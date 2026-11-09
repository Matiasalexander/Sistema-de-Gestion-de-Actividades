using System.Text;
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
    ?? "Server=localhost;Database=SistemaGestionGA;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true";

if (!usarInMemory)
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(connectionString, sql =>
            sql.MigrationsAssembly("SistemaGestionGA.Infrastructure")));
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<IRealtimeNotificationService, RealtimeNotificationService>();
builder.Services.AddScoped<SlaMonitorJob>();

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

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Sistema de Gestión GA API v1.0");
});

app.UseCors("CorporativoCors");
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
