using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Domain.Rules;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.UnitTests;

public class ReglasNegocioTests
{
    [Fact]
    public void TieneDependenciaCircular_DetectaCicloDirectoEIndirecto()
    {
        var existentes = new List<(int ActividadId, int PredecesoraId)>
        {
            (2, 1), // 2 depende de 1
            (3, 2)  // 3 depende de 2
        };

        // Intentar que 1 dependa de 3 crea el ciclo 1 -> 3 -> 2 -> 1
        var hayCiclo = ReglasNegocioService.TieneDependenciaCircular(1, 3, existentes);
        Assert.True(hayCiclo);

        // Intentar que 4 dependa de 3 es válido
        var sinCiclo = ReglasNegocioService.TieneDependenciaCircular(4, 3, existentes);
        Assert.False(sinCiclo);
    }

    [Fact]
    public void ValidarTransicionActividad_ImpideCerrarConPredecesorasOSubtareasAbiertas()
    {
        var exPredecesora = Assert.Throws<DomainRuleException>(() =>
            ReglasNegocioService.ValidarTransicionActividad(
                "EN_PROGRESO",
                "COMPLETADA",
                tienePredecesorasIncompletas: true,
                tieneSubtareasIncompletas: false));

        Assert.Equal("ACTIVIDAD_PREDECESORA_INCOMPLETA", exPredecesora.Code);

        var exSubtarea = Assert.Throws<DomainRuleException>(() =>
            ReglasNegocioService.ValidarTransicionActividad(
                "EN_REVISION",
                "COMPLETADA",
                tienePredecesorasIncompletas: false,
                tieneSubtareasIncompletas: true));

        Assert.Equal("SUBTAREAS_INCOMPLETAS", exSubtarea.Code);
    }

    [Fact]
    public void CalcularAvanceActividadYProyecto_CalculaPonderacionConsistente()
    {
        var avanceChecklist = ReglasNegocioService.CalcularAvanceActividad(
            "EN_PROGRESO",
            itemsChecklistCompletados: [true, true, false, false],
            avancesSubtareas: [],
            avanceActual: 0m);

        Assert.Equal(50.00m, avanceChecklist);

        var avanceProyecto = ReglasNegocioService.CalcularAvanceProyecto(
        [
            (100m, "COMPLETADA", 4), // peso 4 -> 400
            (50m, "EN_PROGRESO", 2), // peso 2 -> 100
            (0m, "CANCELADA", 3)     // ignorada por estar cancelada
        ]);

        // 500 / 6 = 83.33
        Assert.Equal(83.33m, avanceProyecto);
    }

    [Fact]
    public void ValidarTransicionTicket_RechazaTransicionInvalida()
    {
        Assert.Throws<DomainRuleException>(() =>
            ReglasNegocioService.ValidarTransicionTicket("NUEVO", "CERRADO"));

        // Transición válida no lanza excepción
        ReglasNegocioService.ValidarTransicionTicket("EN_ATENCION", "RESUELTO");
    }

    [Fact]
    public void CalcularSYEvaluarSla_RespetaPausasYUmbrales()
    {
        var politica = new PoliticaSla
        {
            TiempoPrimeraRespuestaMinutos = 30,
            TiempoResolucionMinutos = 120,
            UmbralAlertaPorcentaje = 80
        };

        var creacion = new DateTime(2026, 11, 9, 10, 0, 0, DateTimeKind.Utc);
        var limite = creacion.AddMinutes(120); // 12:00 UTC

        // A las 11:40 (100 min transcurridos de 120 = 83.3%) sin pausa -> ProximoAVencer
        var estadoAlerta = ReglasNegocioService.EvaluarEstadoSla(
            politica, creacion, limite, null, minutosPausado: 0, ahoraUtc: creacion.AddMinutes(100));
        Assert.Equal("ProximoAVencer", estadoAlerta);

        // Con 30 minutos pausados en espera, el límite efectivo se desplaza a 12:30 -> sigue EnTiempo
        var estadoConPausa = ReglasNegocioService.EvaluarEstadoSla(
            politica, creacion, limite, null, minutosPausado: 30, ahoraUtc: creacion.AddMinutes(100));
        Assert.Equal("EnTiempo", estadoConPausa);

        // Resuelto dentro de tiempo -> Cumplido
        var estadoCumplido = ReglasNegocioService.EvaluarEstadoSla(
            politica, creacion, limite, fechaResolucionUtc: creacion.AddMinutes(110), minutosPausado: 0, ahoraUtc: creacion.AddMinutes(115));
        Assert.Equal("Cumplido", estadoCumplido);
    }
}
