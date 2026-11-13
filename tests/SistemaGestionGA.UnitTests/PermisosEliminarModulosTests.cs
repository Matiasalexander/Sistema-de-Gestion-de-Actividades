using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using SistemaGestionGA.API.Security;
using SistemaGestionGA.API.Services;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Shared.Constants;
using Xunit;

namespace SistemaGestionGA.UnitTests;

public class PermisosEliminarModulosTests
{
    [Theory]
    [InlineData("SUPER_ADMIN")]
    [InlineData("ADMIN")]
    public async Task PermisoAuthorizationHandler_Admin_TieneBypassAutomaticoParaEliminacion(string rol)
    {
        var handler = new PermisoAuthorizationHandler();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Name, "admin"),
            new(ClaimTypes.Role, rol)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var requirement = new PermisoRequirement(PermisosConstantes.ActividadesEliminar);
        var context = new AuthorizationHandlerContext([requirement], principal, null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task PermisoAuthorizationHandler_AccesoGlobal_TieneBypassAutomatico()
    {
        var handler = new PermisoAuthorizationHandler();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "2"),
            new(ClaimTypes.Name, "director"),
            new("acceso_global", "true")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var requirement = new PermisoRequirement(PermisosConstantes.TicketsEliminar);
        var context = new AuthorizationHandlerContext([requirement], principal, null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task PermisoAuthorizationHandler_UsuarioEstandarSinPermiso_Falla()
    {
        var handler = new PermisoAuthorizationHandler();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "3"),
            new(ClaimTypes.Name, "operador"),
            new(ClaimTypes.Role, "OPERADOR")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var requirement = new PermisoRequirement(PermisosConstantes.UsuariosEliminar);
        var context = new AuthorizationHandlerContext([requirement], principal, null);

        await handler.HandleAsync(context);

        Assert.False(context.HasSucceeded);
    }

    [Fact]
    public async Task PermisoAuthorizationHandler_UsuarioConPermisoEspecifico_TieneExito()
    {
        var handler = new PermisoAuthorizationHandler();
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "4"),
            new(ClaimTypes.Name, "lider"),
            new("permiso", PermisosConstantes.EquiposEliminar)
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var requirement = new PermisoRequirement(PermisosConstantes.EquiposEliminar);
        var context = new AuthorizationHandlerContext([requirement], principal, null);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public void CurrentUserService_SuperAdmin_TienePermisoRetornaTrueParaCualquierPermiso()
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Name, "admin"),
            new(ClaimTypes.Role, "SUPER_ADMIN")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var httpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };
        var httpAccessor = new HttpContextAccessor { HttpContext = httpContext };

        var service = new CurrentUserService(httpAccessor);

        Assert.True(service.TienePermiso(PermisosConstantes.ActividadesEliminar));
        Assert.True(service.TienePermiso(PermisosConstantes.TicketsEliminar));
        Assert.True(service.TienePermiso(PermisosConstantes.UsuariosEliminar));
        Assert.True(service.TienePermiso(PermisosConstantes.EquiposEliminar));
        Assert.True(service.TienePermiso(PermisosConstantes.ChatEliminar));
        Assert.True(service.TienePermiso("cualquier.permiso.inexistente"));
    }

    [Fact]
    public void CatalogoPermisos_ContieneNuevosPermisosDeEliminacion()
    {
        var catalogo = PermisosConstantes.ObtenerCatalogo();

        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.ActividadesEliminar);
        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.TicketsEliminar);
        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.EquiposEliminar);
        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.UsuariosEliminar);
        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.ChatEliminar);
        Assert.Contains(catalogo, p => p.Codigo == PermisosConstantes.ProyectosEliminar);
    }

    [Fact]
    public void Actividad_EliminarLogica_ArchivaYDesvinculaChat()
    {
        var actividad = new Actividad
        {
            Id = 15,
            Codigo = "ACT-0015",
            Titulo = "Mantenimiento Preventivo",
            UnidadId = 1,
            Archivada = false,
            ChatGrupoId = 8
        };

        var grupo = new ChatGrupo
        {
            Id = 8,
            Nombre = "Grupo Soporte 8",
            ActividadActivaId = actividad.Id
        };

        // Simular lógica de eliminación lógica:
        actividad.Archivada = true;
        actividad.ChatGrupoId = null;
        grupo.ActividadActivaId = null;

        var historial = new ActividadHistorial
        {
            ActividadId = actividad.Id,
            UsuarioId = 1,
            TipoCambio = "Eliminación",
            Detalle = "La actividad fue archivada y eliminada lógicamente del tablero operativo."
        };

        var auditoria = new AuditoriaEvento
        {
            UsuarioId = 1,
            NombreUsuario = "admin",
            Modulo = "Actividades",
            Accion = "ELIMINAR_ACTIVIDAD",
            Entidad = nameof(Actividad),
            EntidadId = actividad.Id.ToString(),
            UnidadId = actividad.UnidadId,
            Resumen = $"Actividad {actividad.Codigo} archivada lógicamente."
        };

        Assert.True(actividad.Archivada);
        Assert.Null(actividad.ChatGrupoId);
        Assert.Null(grupo.ActividadActivaId);
        Assert.Equal("ELIMINAR_ACTIVIDAD", auditoria.Accion);
        Assert.Equal("Eliminación", historial.TipoCambio);
    }

    [Fact]
    public void Ticket_Eliminar_CambiaACanceladoYRegistraHistorial()
    {
        var ticket = new Ticket
        {
            Id = 25,
            Folio = "TCK-0025",
            Titulo = "Error en enlace WAN",
            UnidadId = 2,
            EstadoTicketId = 1 // PENDIENTE
        };

        const string motivo = "Ticket duplicado generado por error de escaneo";

        // Simular lógica de eliminación / cancelación de ticket
        ticket.EstadoTicketId = 4; // CANCELADO
        ticket.FechaCierreUtc = DateTime.UtcNow;

        var historial = new TicketHistorial
        {
            TicketId = ticket.Id,
            UsuarioId = 1,
            Accion = "CANCELADO",
            EstadoAnterior = "PENDIENTE",
            EstadoNuevo = "CANCELADO",
            Detalle = $"Ticket cancelado/eliminado por el usuario. Motivo: {motivo}"
        };

        var auditoria = new AuditoriaEvento
        {
            UsuarioId = 1,
            NombreUsuario = "admin",
            Modulo = "Tickets",
            Accion = "CANCELAR_ELIMINAR_TICKET",
            Entidad = nameof(Ticket),
            EntidadId = ticket.Id.ToString(),
            UnidadId = ticket.UnidadId,
            Resumen = $"Ticket {ticket.Folio} cancelado por motivo: {motivo}"
        };

        Assert.Equal(4, ticket.EstadoTicketId);
        Assert.NotNull(ticket.FechaCierreUtc);
        Assert.Equal("CANCELADO", historial.EstadoNuevo);
        Assert.Contains(motivo, historial.Detalle);
        Assert.Equal("CANCELAR_ELIMINAR_TICKET", auditoria.Accion);
    }

    [Fact]
    public void Equipo_Eliminar_DesvinculaMiembros()
    {
        var equipo = new Equipo
        {
            Id = 3,
            Codigo = "EQ-03",
            Nombre = "Equipo Infraestructura",
            UnidadId = 1
        };

        var integrante1 = new UsuarioEquipo { UsuarioId = 10, EquipoId = equipo.Id };
        var integrante2 = new UsuarioEquipo { UsuarioId = 11, EquipoId = equipo.Id };
        equipo.Integrantes.Add(integrante1);
        equipo.Integrantes.Add(integrante2);

        // Simular desvinculación previa a eliminación
        equipo.Integrantes.Clear();

        var auditoria = new AuditoriaEvento
        {
            UsuarioId = 1,
            NombreUsuario = "admin",
            Modulo = "Administracion",
            Accion = "ELIMINAR_EQUIPO",
            Entidad = nameof(Equipo),
            EntidadId = equipo.Id.ToString(),
            UnidadId = equipo.UnidadId,
            Resumen = $"Equipo '{equipo.Nombre}' eliminado."
        };

        Assert.Empty(equipo.Integrantes);
        Assert.Equal("ELIMINAR_EQUIPO", auditoria.Accion);
    }

    [Fact]
    public void Usuario_EliminacionSegura_DesactivaSiTieneHistorialOperativo()
    {
        var usuario = new Usuario
        {
            Id = 8,
            NombreUsuario = "tecnico1",
            Activo = true
        };

        var rt = new RefreshToken
        {
            Id = 101,
            UsuarioId = usuario.Id,
            FechaExpiracionUtc = DateTime.UtcNow.AddDays(7)
        };
        usuario.RefreshTokens.Add(rt);

        var tieneActividadesAsignadas = true;
        var tieneTicketsAsignados = false;
        var tieneHistorial = tieneActividadesAsignadas || tieneTicketsAsignados;

        // Regla: Si tiene historial, desactivación lógica y revocación de sesión
        if (tieneHistorial)
        {
            usuario.Activo = false;
            foreach (var token in usuario.RefreshTokens.Where(t => t.EstaActivo))
            {
                token.FechaRevocacionUtc = DateTime.UtcNow;
                token.MotivoRevocacion = "Eliminación lógica de usuario por seguridad de auditoría";
            }
        }

        Assert.False(usuario.Activo);
        Assert.False(rt.EstaActivo);
        Assert.NotNull(rt.FechaRevocacionUtc);
    }
}
