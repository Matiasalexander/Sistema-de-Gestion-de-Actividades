using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SistemaGestionGA.API.Hubs;
using SistemaGestionGA.API.Middleware;
using SistemaGestionGA.API.Security;
using SistemaGestionGA.API.Services;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);

var usarInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "SERVER=209.35.185.147,5003; Database=SistemaGestionGA; User ID = AB; Password = 121278Aa; Encrypt = True; Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

if (!usarInMemory)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
    {
        options.UseSqlServer(connectionString, sql =>
            sql.MigrationsAssembly("SistemaGestionGA.Infrastructure"));
        options.ConfigureWarnings(w =>
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    });
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IRealtimeNotificationService, RealtimeNotificationService>();
builder.Services.AddScoped<SlaMonitorJob>();
builder.Services.AddScoped<IPasswordRecoveryMailer, PasswordRecoveryMailer>();
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("password-recovery", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(15),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Autenticación JWT + soporte SignalR
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "ClaveSecretaCorporativaSistemaGestionGA_2026_SeguridadMaxima_HS256!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SistemaGestionGA.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SistemaGestionGA.Web";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notificaciones"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermisoPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermisoAuthorizationHandler>();
builder.Services.AddAuthorization();

// SignalR y Hangfire
builder.Services.AddSignalR();
builder.Services.AddHangfire(config =>
{
    config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
          .UseSimpleAssemblyNameTypeSerializer()
          .UseRecommendedSerializerSettings()
          .UseMemoryStorage();
});
builder.Services.AddHangfireServer();

// CORS restringido
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorporativoCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Sistema de Gestión GA - API Corporativa",
        Version = "v1.0",
        Description = "Plataforma integral de gestión de proyectos, actividades, tableros, mesa de ayuda (tickets) y SLA."
    });

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Ingrese el token JWT en formato: Bearer {token}",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Reference = new OpenApiReference
        {
            Type = ReferenceType.SecurityScheme,
            Id = "Bearer"
        }
    };

    c.AddSecurityDefinition("Bearer", securityScheme);
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { securityScheme, Array.Empty<string>() }
    });
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    try
    {
        await db.Database.OpenConnectionAsync();

        Console.WriteLine("================================");
        Console.WriteLine("CONEXIÓN SQL EXITOSA DESDE .NET");
        Console.WriteLine($"Base de datos: {db.Database.GetDbConnection().Database}");
        Console.WriteLine($"Usuario: {db.Database.GetDbConnection().DataSource}");
        Console.WriteLine("================================");

        await db.Database.CloseConnectionAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine("ERROR DE CONEXIÓN DESDE .NET:");
        Console.WriteLine(ex.ToString());
    }
}
var connectionBuilder =
    new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString);

Console.WriteLine("========== CONFIGURACIÓN SQL ==========");
Console.WriteLine($"Servidor: {connectionBuilder.DataSource}");
Console.WriteLine($"Base de datos: {connectionBuilder.InitialCatalog}");
Console.WriteLine($"Usuario: {connectionBuilder.UserID}");
Console.WriteLine($"Autenticación integrada: {connectionBuilder.IntegratedSecurity}");
Console.WriteLine("=======================================");

Console.WriteLine($"Entorno: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Archivo base: {builder.Configuration.GetConnectionString("DefaultConnection") != null}");

var csBuilder =
    new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString);

Console.WriteLine($"Servidor: {csBuilder.DataSource}");
Console.WriteLine($"Base de datos: {csBuilder.InitialCatalog}");
Console.WriteLine($"Usuario: [{csBuilder.UserID}]");
Console.WriteLine($"Autenticación integrada: {csBuilder.IntegratedSecurity}");

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema de Gestión GA API v1.0");
});

app.UseCors("CorporativoCors");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificacionesHub>("/hubs/notificaciones");

// Inicializar base de datos y semilla
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await DatabaseInitializer.InicializarYPoblarAsync(db, aplicarMigraciones: !usarInMemory);
}

// Programar tarea recurrente en Hangfire para monitoreo SLA
using (var scope = app.Services.CreateScope())
{
    var recurringJobs = scope.ServiceProvider.GetService<IRecurringJobManager>();
    recurringJobs?.AddOrUpdate<SlaMonitorJob>(
        "evaluacion-sla-tickets",
        job => job.EjecutarEvaluacionSlaYActividadesAsync(),
        "*/5 * * * *");
}

app.Run();

public partial class Program { }
