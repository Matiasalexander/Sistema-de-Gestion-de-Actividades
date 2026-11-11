using System.ComponentModel.DataAnnotations;

namespace SistemaGestionGA.Application.DTOs;

public record ChatMiembroDto(
    int UsuarioId,
    string NombreCompleto,
    string NombreUsuario,
    string Email,
    string? Cargo,
    bool EsAdmin,
    DateTime FechaUnionUtc);

public record ChatGrupoDto(
    int Id,
    string Nombre,
    string? Descripcion,
    int UnidadId,
    string UnidadNombre,
    int? ActividadActivaId,
    string? ActividadActivaCodigo,
    string? ActividadActivaTitulo,
    string? ActividadActivaEstado,
    string? ActividadActivaEstadoColor,
    int CreadoPorId,
    string CreadoPorNombre,
    DateTime FechaCreacionUtc,
    bool Activo,
    int TotalMiembros,
    string? UltimoMensaje,
    DateTime? UltimoMensajeFechaUtc,
    IReadOnlyList<ChatMiembroDto> Miembros);

public record ChatMensajeDto(
    long Id,
    int ChatGrupoId,
    int UsuarioId,
    string NombreUsuario,
    string NombreCompleto,
    int? ActividadId,
    string? ActividadCodigo,
    string Texto,
    string TipoMensaje, // "Texto", "Sistema", "PreguntaInteractiva", "RespuestaInteractiva"
    string? OpcionesInteractivasJson,
    string? OpcionSeleccionada,
    int? RespondidoPorUsuarioId,
    string? RespondidoPorNombre,
    DateTime? FechaRespuestaUtc,
    DateTime FechaCreacionUtc,
    bool EsMio);

public record CrearChatGrupoDto(
    [Required, MaxLength(150)] string Nombre,
    [MaxLength(500)] string? Descripcion,
    [Required] int UnidadId,
    List<int>? MiembrosIds);

public record AgregarMiembrosDto(
    [Required, MinLength(1)] List<int> UsuariosIds);

public record EnviarMensajeDto(
    [Required, MaxLength(4000)] string Texto,
    string TipoMensaje = "Texto",
    string? OpcionesInteractivasJson = null);

public record ResponderOpcionInteractivaDto(
    [Required] string OpcionId,
    string? Comentario = null);
