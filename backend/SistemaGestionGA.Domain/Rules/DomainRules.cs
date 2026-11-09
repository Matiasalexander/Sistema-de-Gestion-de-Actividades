using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.Domain.Rules;

public static class ReglasNegocioService
{
    private static readonly Dictionary<string, HashSet<string>> TransicionesTicketValidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ["NUEVO"] = ["ABIERTO", "ASIGNADO", "EN_ATENCION", "CANCELADO"],
        ["ABIERTO"] = ["ASIGNADO", "EN_ATENCION", "EN_ESPERA", "CANCELADO"],
        ["ASIGNADO"] = ["EN_ATENCION", "EN_ESPERA", "RESUELTO", "CANCELADO"],
        ["EN_ATENCION"] = ["EN_ESPERA", "RESUELTO", "ASIGNADO", "CANCELADO"],
        ["EN_ESPERA"] = ["EN_ATENCION", "RESUELTO", "CANCELADO"],
        ["RESUELTO"] = ["CERRADO", "REABIERTO"],
        ["REABIERTO"] = ["ASIGNADO", "EN_ATENCION", "EN_ESPERA", "RESUELTO", "CANCELADO"],
        ["CERRADO"] = ["REABIERTO"],
        ["CANCELADO"] = []
    };

    private static readonly Dictionary<string, HashSet<string>> TransicionesActividadValidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ["PENDIENTE"] = ["POR_INICIAR", "EN_PROGRESO", "EN_ESPERA", "BLOQUEADA", "CANCELADA"],
        ["POR_INICIAR"] = ["PENDIENTE", "EN_PROGRESO", "EN_ESPERA", "BLOQUEADA", "CANCELADA"],
        ["EN_PROGRESO"] = ["EN_ESPERA", "BLOQUEADA", "EN_REVISION", "COMPLETADA", "CANCELADA"],
        ["EN_ESPERA"] = ["EN_PROGRESO", "BLOQUEADA", "EN_REVISION", "COMPLETADA", "CANCELADA"],
        ["BLOQUEADA"] = ["PENDIENTE", "POR_INICIAR", "EN_PROGRESO", "EN_ESPERA", "CANCELADA"],
        ["EN_REVISION"] = ["EN_PROGRESO", "COMPLETADA", "BLOQUEADA", "CANCELADA"],
        ["COMPLETADA"] = ["EN_PROGRESO", "EN_REVISION"],
        ["CANCELADA"] = ["PENDIENTE", "POR_INICIAR"]
    };

    /// <summary>
    /// Detecta si agregar la dependencia (actividadId depende de predecesoraId) genera un ciclo directo o indirecto.
    /// </summary>
    public static bool TieneDependenciaCircular(
        int actividadId,
        int predecesoraId,
        IEnumerable<(int ActividadId, int PredecesoraId)> dependenciasExistentes)
    {
        if (actividadId == predecesoraId)
            return true;

        var grafo = new Dictionary<int, List<int>>();
        foreach (var (act, pred) in dependenciasExistentes)
        {
            if (!grafo.TryGetValue(act, out var lista))
            {
                lista = [];
                grafo[act] = lista;
            }
            lista.Add(pred);
        }

        // Si predecesoraId ya depende directa o indirectamente de actividadId, hay ciclo
        var visitados = new HashSet<int>();
        var cola = new Queue<int>();
        cola.Enqueue(predecesoraId);

        while (cola.Count > 0)
        {
            var actual = cola.Dequeue();
            if (actual == actividadId)
                return true;

            if (!visitados.Add(actual))
                continue;

            if (grafo.TryGetValue(actual, out var predecesoras))
            {
                foreach (var p in predecesoras)
                {
                    cola.Enqueue(p);
                }
            }
        }

        return false;
    }

    public static void ValidarTransicionActividad(
        string codigoEstadoActual,
        string codigoEstadoNuevo,
        bool tienePredecesorasIncompletas,
        bool tieneSubtareasIncompletas)
    {
        if (string.Equals(codigoEstadoActual, codigoEstadoNuevo, StringComparison.OrdinalIgnoreCase))
            return;

        if (TransicionesActividadValidas.TryGetValue(codigoEstadoActual, out var permitidos) &&
            !permitidos.Contains(codigoEstadoNuevo))
        {
            throw new DomainRuleException(
                $"La transición de estado de actividad '{codigoEstadoActual}' a '{codigoEstadoNuevo}' no está permitida.");
        }

        if (string.Equals(codigoEstadoNuevo, "COMPLETADA", StringComparison.OrdinalIgnoreCase))
        {
            if (tienePredecesorasIncompletas)
            {
                throw new DomainRuleException(
                    "No se puede completar la actividad porque tiene actividades predecesoras pendientes de finalizar.",
                    "ACTIVIDAD_PREDECESORA_INCOMPLETA");
            }

            if (tieneSubtareasIncompletas)
            {
                throw new DomainRuleException(
                    "No se puede completar la actividad mientras existan subtareas abiertas.",
                    "SUBTAREAS_INCOMPLETAS");
            }
        }
    }

    public static decimal CalcularAvanceActividad(
        string codigoEstado,
        IReadOnlyCollection<bool> itemsChecklistCompletados,
        IReadOnlyCollection<decimal> avancesSubtareas,
        decimal avanceActual)
    {
        if (string.Equals(codigoEstado, "COMPLETADA", StringComparison.OrdinalIgnoreCase))
            return 100m;

        if (string.Equals(codigoEstado, "CANCELADA", StringComparison.OrdinalIgnoreCase))
            return 0m;

        if (avancesSubtareas.Count > 0 && itemsChecklistCompletados.Count > 0)
        {
            var promSubtareas = avancesSubtareas.Average();
            var promChecklist = (decimal)itemsChecklistCompletados.Count(c => c) / itemsChecklistCompletados.Count * 100m;
            return Math.Round((promSubtareas * 0.6m) + (promChecklist * 0.4m), 2);
        }

        if (avancesSubtareas.Count > 0)
        {
            return Math.Round(avancesSubtareas.Average(), 2);
        }

        if (itemsChecklistCompletados.Count > 0)
        {
            return Math.Round((decimal)itemsChecklistCompletados.Count(c => c) / itemsChecklistCompletados.Count * 100m, 2);
        }

        return codigoEstado.ToUpperInvariant() switch
        {
            "PENDIENTE" or "POR_INICIAR" => 0m,
            "EN_PROGRESO" => avanceActual > 0 && avanceActual < 100 ? avanceActual : 45m,
            "EN_REVISION" => avanceActual >= 80 && avanceActual < 100 ? avanceActual : 85m,
            _ => Math.Clamp(avanceActual, 0m, 99m)
        };
    }

    public static decimal CalcularAvanceProyecto(IReadOnlyCollection<(decimal Avance, string CodigoEstado, int NivelPrioridad)> actividadesRaiz)
    {
        var activas = actividadesRaiz
            .Where(a => !string.Equals(a.CodigoEstado, "CANCELADA", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (activas.Count == 0)
            return 0m;

        decimal sumaPonderada = 0m;
        decimal totalPesos = 0m;

        foreach (var act in activas)
        {
            decimal peso = Math.Max(1, act.NivelPrioridad);
            sumaPonderada += act.Avance * peso;
            totalPesos += peso;
        }

        return totalPesos == 0 ? 0m : Math.Round(sumaPonderada / totalPesos, 2);
    }

    public static void ValidarTransicionTicket(string codigoEstadoActual, string codigoEstadoNuevo)
    {
        if (string.Equals(codigoEstadoActual, codigoEstadoNuevo, StringComparison.OrdinalIgnoreCase))
            return;

        if (!TransicionesTicketValidas.TryGetValue(codigoEstadoActual, out var permitidos) ||
            !permitidos.Contains(codigoEstadoNuevo))
        {
            throw new DomainRuleException(
                $"Transición de ticket inválida: no se puede cambiar de '{codigoEstadoActual}' a '{codigoEstadoNuevo}'.",
                "TRANSICION_TICKET_INVALIDA");
        }
    }

    public static DateTime CalcularFechaLimiteSla(
        DateTime fechaCreacionUtc,
        int minutosObjetivo,
        CalendarioSla? calendario,
        IReadOnlySet<DateOnly>? diasFestivos = null)
    {
        if (calendario == null || !calendario.Activo)
            return fechaCreacionUtc.AddMinutes(minutosObjetivo);

        var diasLaboralesSet = calendario.DiasLaborales
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(s => int.TryParse(s, out var d) ? d : -1)
            .Where(d => d >= 0 && d <= 7)
            .ToHashSet();

        if (diasLaboralesSet.Count == 0)
            return fechaCreacionUtc.AddMinutes(minutosObjetivo);

        var minutosJornada = (int)(calendario.HoraFinAtencion - calendario.HoraInicioAtencion).TotalMinutes;
        if (minutosJornada <= 0)
            return fechaCreacionUtc.AddMinutes(minutosObjetivo);

        var cursor = fechaCreacionUtc;
        var minutosRestantes = minutosObjetivo;
        int iteracionesSeguridad = 0;

        while (minutosRestantes > 0 && iteracionesSeguridad++ < 366)
        {
            var fechaCursor = DateOnly.FromDateTime(cursor);
            int diaSemanaIso = cursor.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)cursor.DayOfWeek;
            bool esLaboral = diasLaboralesSet.Contains(diaSemanaIso) &&
                             (diasFestivos == null || !diasFestivos.Contains(fechaCursor));

            var inicioJornada = fechaCursor.ToDateTime(calendario.HoraInicioAtencion, DateTimeKind.Utc);
            var finJornada = fechaCursor.ToDateTime(calendario.HoraFinAtencion, DateTimeKind.Utc);

            if (!esLaboral || cursor >= finJornada)
            {
                cursor = fechaCursor.AddDays(1).ToDateTime(calendario.HoraInicioAtencion, DateTimeKind.Utc);
                continue;
            }

            if (cursor < inicioJornada)
                cursor = inicioJornada;

            var disponiblesHoy = (int)Math.Max(0, (finJornada - cursor).TotalMinutes);
            if (minutosRestantes <= disponiblesHoy)
            {
                return cursor.AddMinutes(minutosRestantes);
            }

            minutosRestantes -= disponiblesHoy;
            cursor = fechaCursor.AddDays(1).ToDateTime(calendario.HoraInicioAtencion, DateTimeKind.Utc);
        }

        return cursor;
    }

    public static string EvaluarEstadoSla(
        PoliticaSla? politica,
        DateTime fechaCreacionUtc,
        DateTime? fechaLimiteResolucionUtc,
        DateTime? fechaResolucionUtc,
        int minutosPausado,
        DateTime ahoraUtc)
    {
        if (politica == null || fechaLimiteResolucionUtc == null)
            return "SinPolitica";

        var limiteEfectivo = fechaLimiteResolucionUtc.Value.AddMinutes(minutosPausado);
        var fechaComparacion = fechaResolucionUtc ?? ahoraUtc;

        if (fechaResolucionUtc.HasValue)
        {
            return fechaResolucionUtc.Value <= limiteEfectivo ? "Cumplido" : "Incumplido";
        }

        if (fechaComparacion > limiteEfectivo)
            return "Incumplido";

        var totalMinutos = Math.Max(1.0, (limiteEfectivo - fechaCreacionUtc).TotalMinutes);
        var transcurridos = Math.Max(0.0, (ahoraUtc - fechaCreacionUtc).TotalMinutes - minutosPausado);
        var porcentajeConsumido = (transcurridos / totalMinutos) * 100.0;

        if (porcentajeConsumido >= politica.UmbralAlertaPorcentaje)
            return "ProximoAVencer";

        return "EnTiempo";
    }
}
