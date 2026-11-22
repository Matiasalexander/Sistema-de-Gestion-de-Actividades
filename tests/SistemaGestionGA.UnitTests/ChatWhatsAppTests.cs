using System.Text.Json;
using SistemaGestionGA.Domain.Entities;
using Xunit;

namespace SistemaGestionGA.UnitTests;

public class ChatWhatsAppTests
{
    [Fact]
    public void OpcionesInteractivasJson_EstructuraCorrectaParaResolucionCliente()
    {
        var opciones = new[]
        {
            new { id = "resolver", texto = "✅ Sí, marcar como resuelto", accion = "resolver", color = "verde" },
            new { id = "continuar", texto = "⏳ Aún no, requiero más apoyo", accion = "continuar", color = "amarillo" }
        };

        var json = JsonSerializer.Serialize(opciones);
        Assert.Contains("\"id\":\"resolver\"", json);
        Assert.Contains("\"accion\":\"resolver\"", json);

        using var doc = JsonDocument.Parse(json);
        Assert.Equal(2, doc.RootElement.GetArrayLength());
        Assert.Equal("resolver", doc.RootElement[0].GetProperty("accion").GetString());
    }

    [Fact]
    public void ChatMensaje_InteractividadYResolucion_ActualizaEstadoYRespuestas()
    {
        var grupo = new ChatGrupo
        {
            Id = 1,
            Nombre = "Soporte Técnico - Sucursal Centro",
            UnidadId = 1,
            CreadoPorId = 1,
            Activo = true
        };

        var actividad = new Actividad
        {
            Id = 10,
            Codigo = "ACT-0010",
            Titulo = "Atención de falla en punto de venta",
            UnidadId = 1,
            EstadoActividadId = 2, // EN_PROGRESO
            PorcentajeAvance = 30m,
            ChatGrupoId = grupo.Id
        };

        grupo.ActividadActivaId = actividad.Id;

        var mensajePregunta = new ChatMensaje
        {
            Id = 101,
            ChatGrupoId = grupo.Id,
            UsuarioId = 1,
            Texto = "¿Estimado cliente, su solicitud o actividad ha quedado resuelta a su entera satisfacción?",
            TipoMensaje = "PreguntaInteractiva",
            OpcionesInteractivasJson = "[{\"id\":\"resolver\",\"texto\":\"✅ Sí, marcar como resuelto\",\"accion\":\"resolver\"}]"
        };

        // Simular respuesta afirmativa del cliente ("resolver")
        mensajePregunta.OpcionSeleccionada = "✅ Sí, marcar como resuelto";
        mensajePregunta.RespondidoPorUsuarioId = 5; // Id del cliente
        mensajePregunta.FechaRespuestaUtc = DateTime.UtcNow;

        // Comportamiento esperado de negocio al resolver
        actividad.EstadoActividadId = 4; // COMPLETADA
        actividad.PorcentajeAvance = 100m;
        actividad.FechaFinalizacionRealUtc = DateTime.UtcNow;
        grupo.ActividadActivaId = null;

        Assert.Equal(100m, actividad.PorcentajeAvance);
        Assert.Equal(4, actividad.EstadoActividadId);
        Assert.NotNull(actividad.FechaFinalizacionRealUtc);
        Assert.Null(grupo.ActividadActivaId);
        Assert.NotNull(mensajePregunta.OpcionSeleccionada);
        Assert.Equal(5, mensajePregunta.RespondidoPorUsuarioId);
    }

    [Fact]
    public void ChatGrupo_EliminarGrupo_DesvinculaActividadesYGeneraAuditoria()
    {
        var grupo = new ChatGrupo
        {
            Id = 5,
            Nombre = "Grupo Soporte Sucursal Norte",
            UnidadId = 2,
            CreadoPorId = 3,
            Activo = true
        };

        var actividadVinculada = new Actividad
        {
            Id = 42,
            Codigo = "ACT-0042",
            Titulo = "Revisión de enlace de comunicaciones",
            UnidadId = 2,
            ChatGrupoId = grupo.Id
        };

        grupo.ActividadActivaId = actividadVinculada.Id;

        // Simular lógica de eliminación:
        // 1. Romper referencias cruzadas
        grupo.ActividadActivaId = null;
        actividadVinculada.ChatGrupoId = null;

        var historial = new ActividadHistorial
        {
            ActividadId = actividadVinculada.Id,
            UsuarioId = 3,
            TipoCambio = "Eliminación de Grupo WhatsApp",
            Detalle = $"El grupo de chat '{grupo.Nombre}' vinculado a esta actividad fue eliminado por Administrador."
        };

        var auditoria = new AuditoriaEvento
        {
            UsuarioId = 3,
            NombreUsuario = "admin",
            Modulo = "Chat",
            Accion = "ELIMINAR_GRUPO",
            Entidad = nameof(ChatGrupo),
            EntidadId = grupo.Id.ToString(),
            UnidadId = grupo.UnidadId,
            Resumen = $"Eliminación del grupo de chat '{grupo.Nombre}'",
            ValoresAnteriores = JsonSerializer.Serialize(new { grupo.Id, grupo.Nombre, grupo.UnidadId }),
            FechaEventoUtc = DateTime.UtcNow
        };

        Assert.Null(grupo.ActividadActivaId);
        Assert.Null(actividadVinculada.ChatGrupoId);
        Assert.Equal(42, historial.ActividadId);
        Assert.Contains("Eliminación de Grupo WhatsApp", historial.TipoCambio);
        Assert.Equal("ELIMINAR_GRUPO", auditoria.Accion);
        Assert.Equal("Chat", auditoria.Modulo);
        Assert.Contains("\"Id\":5", auditoria.ValoresAnteriores);
    }
}
