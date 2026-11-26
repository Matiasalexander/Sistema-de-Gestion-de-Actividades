using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SistemaGestionGA.Domain.Entities;
public class ActividadGuardia
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
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public int DuracionMinutos { get; set; }
    public string TipoActividad { get; set; } = "Soporte Remoto";
    public string SistemaAfectado { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? Solucion { get; set; } = string.Empty;
    public string Estado { get; set; } = "COMPLETADA"; //debería ser completada, en progreso, pendiente
    public int? TicketRelacionadoId { get; set; }
    public Ticket? TicketRelacionado { get; set; }
    public string? FolioTicketExterno { get; set; }
    public bool RequiereSeguimientoLunes { get; set; }
    public string? DetalleSeguimiento { get; set; }
    public bool EsGuardiaExtraordinaria { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacionUtc { get; set; }
}
