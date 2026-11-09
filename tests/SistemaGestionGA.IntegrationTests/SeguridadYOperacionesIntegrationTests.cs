using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Infrastructure.Persistence;

namespace SistemaGestionGA.IntegrationTests;

public class CustomWebAppFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"SistemaGestionGA_Test_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.UseSetting("UseInMemoryDatabase", "true");
        builder.ConfigureServices(services =>
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

public class SeguridadYOperacionesIntegrationTests(CustomWebAppFactory factory)
    : IClassFixture<CustomWebAppFactory>
{
    [Fact]
    public async Task Login_Refresh_Y_AislamientoPorUnidad_FuncionanCorrectamente()
    {
        var client = factory.CreateClient();

        // 1. Login como admin global
        var loginAdminResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("admin", "AdminGA2026!"));
        Assert.Equal(HttpStatusCode.OK, loginAdminResp.StatusCode);
        var adminAuth = await loginAdminResp.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(adminAuth);
        Assert.True(adminAuth!.Usuario.AccesoGlobalUnidades);

        // 2. Rotación de Refresh Token
        var refreshResp = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenRequestDto(adminAuth.RefreshToken));
        Assert.Equal(HttpStatusCode.OK, refreshResp.StatusCode);
        var nuevoAuth = await refreshResp.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(nuevoAuth);
        Assert.NotEqual(adminAuth.RefreshToken, nuevoAuth!.RefreshToken);

        // 3. Reutilizar el Refresh Token anterior ya revocado debe fallar con 401
        var reuseResp = await client.PostAsJsonAsync("/api/auth/refresh", new RefreshTokenRequestDto(adminAuth.RefreshToken));
        Assert.Equal(HttpStatusCode.Unauthorized, reuseResp.StatusCode);

        // 4. Login como Sofía Torres (alcance exclusivo en Unidad Sur, rol USUARIO_OPERATIVO)
        var loginSofiaResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("sofia.torres", "AdminGA2026!"));
        Assert.Equal(HttpStatusCode.OK, loginSofiaResp.StatusCode);
        var sofiaAuth = await loginSofiaResp.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(sofiaAuth);
        Assert.False(sofiaAuth!.Usuario.AccesoGlobalUnidades);
        Assert.Single(sofiaAuth.Usuario.Unidades);

        var unidadSurId = sofiaAuth.Usuario.Unidades[0].Id;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", sofiaAuth.AccessToken);

        // 5. Sofía solo ve proyectos de su unidad autorizada (Unidad Sur)
        var proyectosSofia = await client.GetFromJsonAsync<List<ProyectoDto>>("/api/proyectos");
        Assert.NotNull(proyectosSofia);
        Assert.All(proyectosSofia!, p => Assert.Equal(unidadSurId, p.UnidadId));

        // 6. Si Sofía manipula el parámetro unidadId o ID de recurso para consultar Unidad Corporativa (Id=1), recibe 403 Forbidden
        var ataqueQueryUnidad = await client.GetAsync("/api/proyectos?unidadId=1");
        Assert.Equal(HttpStatusCode.Forbidden, ataqueQueryUnidad.StatusCode);

        var ataqueIdProyecto = await client.GetAsync("/api/proyectos/1");
        Assert.Equal(HttpStatusCode.Forbidden, ataqueIdProyecto.StatusCode);

        // 7. Si Sofía intenta acceder al módulo de administración de usuarios sin permiso, recibe 403 Forbidden
        var ataqueUsuarios = await client.GetAsync("/api/usuarios");
        Assert.Equal(HttpStatusCode.Forbidden, ataqueUsuarios.StatusCode);
    }

    [Fact]
    public async Task FlujoCompleto_Ticket_SLA_Y_VinculacionActividad_FuncionaCorrectamente()
    {
        var client = factory.CreateClient();

        var loginResp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequestDto("carlos.mendez", "AdminGA2026!"));
        Assert.Equal(HttpStatusCode.OK, loginResp.StatusCode);
        var auth = (await loginResp.Content.ReadFromJsonAsync<LoginResponseDto>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        var catalogos = (await client.GetFromJsonAsync<CatalogosOperativosDto>("/api/catalogos"))!;
        var unidadNorteId = auth.Usuario.Unidades.First(u => u.Codigo == "UNI-NORTE").Id;
        var prioAltaId = catalogos.Prioridades.First(p => p.Codigo == "ALTA").Id;
        var tipoIncidenteId = catalogos.TiposTicket.First(t => t.Codigo == "INCIDENTE").Id;
        var catInfraId = catalogos.CategoriasTicket.First(c => c.Codigo == "INFRAESTRUCTURA").Id;
        var estadoActProgId = catalogos.EstadosActividad.First(e => e.Codigo == "EN_PROGRESO").Id;

        // 1. Crear ticket en Unidad Norte y verificar asignación automática de política SLA
        var crearTicketResp = await client.PostAsJsonAsync("/api/tickets", new CrearTicketDto(
            "Falla en switch de distribución piso 2 Monterrey",
            "Los puertos PoE del bloque B dejaron de suministrar energía a teléfonos IP.",
            tipoIncidenteId,
            catInfraId,
            prioAltaId,
            unidadNorteId,
            null,
            null,
            auth.Usuario.Id));

        Assert.Equal(HttpStatusCode.OK, crearTicketResp.StatusCode);
        var ticketCreado = (await crearTicketResp.Content.ReadFromJsonAsync<TicketDto>())!;
        Assert.NotNull(ticketCreado.PoliticaSlaId);
        Assert.Equal("EnTiempo", ticketCreado.EstadoSla);

        // 2. Generar y vincular una actividad técnica desde el ticket
        var vincularResp = await client.PostAsJsonAsync($"/api/tickets/{ticketCreado.Id}/vincular-actividad", new VincularActividadTicketDto(
            null,
            new GuardarActividadDto(
                null, null, null, unidadNorteId, null, null,
                "Reemplazo de fuente PoE en switch piso 2",
                "Sustitución de módulo de potencia redundante",
                prioAltaId, estadoActProgId,
                DateOnly.FromDateTime(DateTime.UtcNow),
                DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
                90, 50m, false, null, [auth.Usuario.Id], auth.Usuario.Id)));

        Assert.Equal(HttpStatusCode.OK, vincularResp.StatusCode);
        var ticketConAct = (await vincularResp.Content.ReadFromJsonAsync<TicketDto>())!;
        Assert.Single(ticketConAct.ActividadesRelacionadas);

        // 3. Tomar en atención y luego resolver el ticket
        var atenderResp = await client.PostAsJsonAsync($"/api/tickets/{ticketCreado.Id}/atender", new AccionEstadoTicketDto("Iniciando reemplazo físico en site.", true));
        Assert.Equal(HttpStatusCode.OK, atenderResp.StatusCode);

        var resolverResp = await client.PostAsJsonAsync($"/api/tickets/{ticketCreado.Id}/resolver", new AccionEstadoTicketDto("Fuente PoE reemplazada y puertos operativos al 100%.", false));
        Assert.Equal(HttpStatusCode.OK, resolverResp.StatusCode);
        var ticketResuelto = (await resolverResp.Content.ReadFromJsonAsync<TicketDto>())!;
        Assert.Equal("RESUELTO", ticketResuelto.EstadoCodigo);
        Assert.Equal("Cumplido", ticketResuelto.EstadoSla);
    }
}
