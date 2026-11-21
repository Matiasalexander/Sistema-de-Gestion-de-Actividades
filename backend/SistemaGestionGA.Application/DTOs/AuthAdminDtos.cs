using System.ComponentModel.DataAnnotations;

namespace SistemaGestionGA.Application.DTOs;

public record LoginRequestDto(
    [Required] string Identificador,
    [Required] string Password);

// DTOs del flujo de recuperación de acceso por correo.
public record SolicitarRecuperacionDto(
    [Required, EmailAddress] string Email);

public record RestablecerPasswordDto(
    [Required] string Token,
    [Required, MinLength(12)] string NuevoPassword);

public record RefreshTokenRequestDto(
    [Required] string RefreshToken);

public record CambiarPasswordDto(
    [Required] string PasswordActual,
    [Required, MinLength(12)] string NuevoPassword);

public record UsuarioAutenticadoDto(
    int Id,
    string NombreUsuario,
    string Email,
    string NombreCompleto,
    string? Cargo,
    int? DepartamentoId,
    string? DepartamentoNombre,
    bool AccesoGlobalUnidades,
    IReadOnlyList<UnidadResumenDto> Unidades,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permisos);

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiraEnUtc,
    UsuarioAutenticadoDto Usuario);

public record UnidadResumenDto(
    int Id,
    string Codigo,
    string Nombre,
    bool EsPrincipal);

public record UnidadDto(
    int Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    string ZonaHoraria,
    bool Activa,
    int TotalDepartamentos,
    int TotalUsuarios,
    IReadOnlyList<DepartamentoDto> Departamentos);

public record GuardarUnidadDto(
    [Required, MaxLength(20)] string Codigo,
    [Required, MaxLength(150)] string Nombre,
    string? Descripcion,
    string ZonaHoraria = "America/Mexico_City",
    bool Activa = true);

public record DepartamentoDto(
    int Id,
    int UnidadId,
    string UnidadNombre,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool Activa);

public record GuardarDepartamentoDto(
    [Required] int UnidadId,
    [Required, MaxLength(20)] string Codigo,
    [Required, MaxLength(150)] string Nombre,
    string? Descripcion,
    bool Activa = true);

public record PermisoDto(
    int Id,
    string Codigo,
    string Modulo,
    string Accion,
    string Nombre,
    string? Descripcion);

public record RolDto(
    int Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    bool EsSistema,
    bool Activo,
    int TotalUsuarios,
    IReadOnlyList<string> PermisosCodigos);

public record GuardarRolDto(
    [Required, MaxLength(60)] string Codigo,
    [Required, MaxLength(120)] string Nombre,
    string? Descripcion,
    bool Activo,
    IReadOnlyList<string> PermisosCodigos);

public record EquipoIntegranteDto(
    int UsuarioId,
    string NombreCompleto,
    string Email,
    string RolEnEquipo);

public record EquipoDto(
    int Id,
    string Codigo,
    int UnidadId,
    string UnidadNombre,
    int? DepartamentoId,
    string? DepartamentoNombre,
    string Nombre,
    string? Descripcion,
    string ColorHex,
    int? LiderUsuarioId,
    string? LiderNombre,
    bool Activo,
    IReadOnlyList<EquipoIntegranteDto> Integrantes);

public record GuardarEquipoDto(
    [Required, MaxLength(30)] string Codigo,
    [Required] int UnidadId,
    int? DepartamentoId,
    [Required, MaxLength(150)] string Nombre,
    string? Descripcion,
    string ColorHex,
    int? LiderUsuarioId,
    bool Activo,
    IReadOnlyList<int> IntegrantesIds);

public record UsuarioListaDto(
    int Id,
    string NombreUsuario,
    string Email,
    string NombreCompleto,
    string? Cargo,
    string? Telefono,
    int? DepartamentoId,
    string? DepartamentoNombre,
    bool AccesoGlobalUnidades,
    bool Activo,
    DateTime? UltimoAccesoUtc,
    DateTime FechaCreacionUtc,
    IReadOnlyList<RolResumenDto> Roles,
    IReadOnlyList<UnidadResumenDto> Unidades,
    IReadOnlyList<string> Equipos);

public record RolResumenDto(int Id, string Codigo, string Nombre);

public record CrearUsuarioDto(
    [Required, MaxLength(80)] string NombreUsuario,
    [Required, EmailAddress, MaxLength(180)] string Email,
    [Required, MaxLength(200)] string NombreCompleto,
    string? Cargo,
    string? Telefono,
    [Required, MinLength(8)] string Password,
    int? DepartamentoId,
    bool AccesoGlobalUnidades,
    bool Activo,
    IReadOnlyList<int> RolesIds,
    IReadOnlyList<int> UnidadesIds,
    int? UnidadPrincipalId,
    IReadOnlyList<int>? EquiposIds);

public record ActualizarUsuarioDto(
    [Required, EmailAddress, MaxLength(180)] string Email,
    [Required, MaxLength(200)] string NombreCompleto,
    string? Cargo,
    string? Telefono,
    int? DepartamentoId,
    bool AccesoGlobalUnidades,
    bool Activo,
    IReadOnlyList<int> RolesIds,
    IReadOnlyList<int> UnidadesIds,
    int? UnidadPrincipalId,
    IReadOnlyList<int>? EquiposIds);

public record ResetPasswordAdminDto(
    [Required, MinLength(12)] string NuevoPassword,
    bool DebeCambiarPassword = false);

public record HistorialAccesoDto(
    long Id,
    int? UsuarioId,
    string IdentificadorIntentado,
    bool Exitoso,
    string? Motivo,
    string? IpAddress,
    DateTime FechaIntentoUtc);

public record AuditoriaEventoDto(
    long Id,
    int? UsuarioId,
    string? NombreUsuario,
    string Modulo,
    string Accion,
    string Entidad,
    string? EntidadId,
    int? UnidadId,
    string? Resumen,
    string? ValoresAnteriores,
    string? ValoresNuevos,
    string? IpAddress,
    DateTime FechaEventoUtc);
