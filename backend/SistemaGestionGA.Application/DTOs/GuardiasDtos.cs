using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SistemaGestionGA.Application.DTOs
{
    public record ActividadGuardiaDto (
    int Id, string Folio, int UsuarioId, string UsuarioNomnbre, string UsuarioEmail, int UnidadId, string UnidadNombre, int? DepartamentoId, string? DepartamentoNombre,
    DateOnly Fecha, string DiaSemana, TimeOnly HoraInicio, TimeOnly HoraFin, int DuracionMinutos, string TipoActividad, string SistemaAfectado, string Titulo, string Descripcion,
    string? Solucion, string Estado, int? TicketRelacionadoId, string? FolioTicket, bool RequiereSeguimientoLunes, string? DetalleSeguimiento, bool EsGuardiaExtraordinaria, 
    DateTime FechaCreacionUtc
    );
    public record GuardarActividadGuardiaDto(
    [Required] int UnidadId,
    [Required] DateOnly Fecha,
    [Required] TimeOnly HoraInicio,
    [Required] TimeOnly HoraFin,
    [Required, MaxLength(60)] string TipoActividad,
    [Required, MaxLength(80)] string SistemaAfectado,
    [Required, MaxLength(250)] string Titulo,
    [Required] string Descripcion,
    string? Solucion,
    [Required, MaxLength(30)] string Estado,
    int? TicketRelacionadoId,
    string? FolioTicketExterno,
    bool RequiereSeguimientoLunes,
    string? DetalleSeguimiento,
    bool EsGuardiaExtraordinaria
    );
    public record ResumenGuardiasDto(
    int TotalActividades, int TotalMinutosInvertidos, int TotalPendientesLunes, int ActividadesSabado, int ActividadesDomingo, IReadOnlyList<DesgloseSistemaDto> PorSistema);
    public record DesgloseSistemaDto(string Sistema, int Cantidad, int Minutos);
}
