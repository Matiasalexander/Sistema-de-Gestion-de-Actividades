using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SistemaGestionGA.Application.DTOs;

// --- DTOs de Guardia (Cabecera) ---
public record GuardiaDto(
    int Id,
    string Folio,
    int UsuarioId,
    string UsuarioNombre,
    string UsuarioEmail,
    int UnidadId,
    string UnidadNombre,
    int? DepartamentoId,
    string? DepartamentoNombre,
    DateOnly Fecha,
    string DiaSemana,
    TimeOnly? HoraInicioTurno,
    TimeOnly? HoraFinTurno,
    string Estado,
    string? ObservacionesEntrega,
    bool EsGuardiaExtraordinaria,
    int TotalActividades,
    int TotalMinutos,
    bool TienePendientesLunes,
    DateTime FechaCreacionUtc,
    IReadOnlyList<GuardiaActividadDto>? Actividades = null
);

public record CrearGuardiaDto(
    [Required] int UnidadId,
    [Required] DateOnly Fecha,
    TimeOnly? HoraInicioTurno,
    TimeOnly? HoraFinTurno,
    string? ObservacionesEntrega,
    bool EsGuardiaExtraordinaria
);

public record CerrarGuardiaDto(
    TimeOnly? HoraFinTurno,
    string? ObservacionesEntrega
);
// --- DTOs de Actividad de Guardia (Detalle) ---
public record GuardiaActividadDto(
    int Id,
    int GuardiaId,
    TimeOnly HoraInicio,
    TimeOnly HoraFin,
    int DuracionMinutos,
    string TipoActividad,
    string Titulo,
    string Descripcion,
    string? Solucion,
    string Estado,
    int? TicketRelacionadoId,
    string? FolioTicket,
    bool RequiereSeguimientoLunes,
    string? DetalleSeguimiento,
    DateTime FechaCreacionUtc
);

public record GuardarGuardiaActividadDto(
    [Required] TimeOnly HoraInicio,
    [Required] TimeOnly HoraFin,
    [Required, MaxLength(60)] string TipoActividad,
    [Required, MaxLength(250)] string Titulo,
    [Required] string Descripcion,
    string? Solucion,
    [Required, MaxLength(30)] string Estado,
    int? TicketRelacionadoId,
    string? FolioTicketExterno,
    bool RequiereSeguimientoLunes,
    string? DetalleSeguimiento
);