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
}
