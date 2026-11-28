using System;
using System.Collections.Generic;

namespace SistemaGestionGA.Domain.Entities;
//guardia pura
public class Guardia
{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }

    public DateOnly Fecha { get; set; }
    public TimeOnly? HoraInicioTurno { get; set; }
    public TimeOnly? HoraFinTurno { get; set; }
    public string Estado { get; set; } = "ABIERTA"; // ABIERTA, EN_CURSO, CERRADA
    public string? ObservacionesEntrega { get; set; }
    public bool EsGuardiaExtraordinaria { get; set; }

    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCierreUtc { get; set; }

    // Relación 1 a N con sus actividades
    public List<GuardiaActividad> Actividades { get; set; } = new();
}
//actividad registrada dentro de la guardia
public class GuardiaActividad
{
    public int Id { get; set; }
    public int GuardiaId { get; set; }
    public Guardia? Guardia { get; set; }

    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public int DuracionMinutos { get; set; }
    public string TipoActividad { get; set; } = "Soporte Remoto";
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? Solucion { get; set; }
    public string Estado { get; set; } = "COMPLETADA"; // COMPLETADA, EN_PROGRESO, PENDIENTE

    public int? TicketRelacionadoId { get; set; }
    public Ticket? TicketRelacionado { get; set; }
    public string? FolioTicketExterno { get; set; }

    public bool RequiereSeguimientoLunes { get; set; }
    public string? DetalleSeguimiento { get; set; }

    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}