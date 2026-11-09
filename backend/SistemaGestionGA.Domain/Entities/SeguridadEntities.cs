namespace SistemaGestionGA.Domain.Entities;

public class Unidad
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string ZonaHoraria { get; set; } = "America/Mexico_City";
    public bool Activa { get; set; } = true;
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacionUtc { get; set; }

    public ICollection<Departamento> Departamentos { get; set; } = new List<Departamento>();
    public ICollection<UsuarioUnidad> UsuarioUnidades { get; set; } = new List<UsuarioUnidad>();
    public ICollection<Equipo> Equipos { get; set; } = new List<Equipo>();
}

public class Departamento
{
    public int Id { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

    public ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}

public class Usuario
{
    public int Id { get; set; }
    public string NombreUsuario { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Cargo { get; set; }
    public string? Telefono { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }
    public bool AccesoGlobalUnidades { get; set; }
    public bool Activo { get; set; } = true;
    public bool DebeCambiarPassword { get; set; }
    public int IntentosFallidos { get; set; }
    public DateTime? BloqueadoHastaUtc { get; set; }
    public DateTime? UltimoAccesoUtc { get; set; }
    public string? TokenRecuperacionHash { get; set; }
    public DateTime? TokenRecuperacionExpiraUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacionUtc { get; set; }

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
    public ICollection<UsuarioUnidad> UsuarioUnidades { get; set; } = new List<UsuarioUnidad>();
    public ICollection<UsuarioEquipo> UsuarioEquipos { get; set; } = new List<UsuarioEquipo>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class Rol
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool EsSistema { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
    public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
}

public class Permiso
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Modulo { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public ICollection<RolPermiso> RolPermisos { get; set; } = new List<RolPermiso>();
}

public class UsuarioRol
{
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int RolId { get; set; }
    public Rol? Rol { get; set; }
    public DateTime FechaAsignacionUtc { get; set; } = DateTime.UtcNow;
}

public class RolPermiso
{
    public int RolId { get; set; }
    public Rol? Rol { get; set; }
    public int PermisoId { get; set; }
    public Permiso? Permiso { get; set; }
}

public class UsuarioUnidad
{
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public bool EsUnidadPrincipal { get; set; }
    public DateTime FechaAsignacionUtc { get; set; } = DateTime.UtcNow;
}

public class Equipo
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string ColorHex { get; set; } = "#2563EB";
    public int? LiderUsuarioId { get; set; }
    public Usuario? LiderUsuario { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

    public ICollection<UsuarioEquipo> Integrantes { get; set; } = new List<UsuarioEquipo>();
}

public class UsuarioEquipo
{
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int EquipoId { get; set; }
    public Equipo? Equipo { get; set; }
    public string RolEnEquipo { get; set; } = "Integrante";
    public DateTime FechaIncorporacionUtc { get; set; } = DateTime.UtcNow;
}

public class HistorialAcceso
{
    public long Id { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string IdentificadorIntentado { get; set; } = string.Empty;
    public bool Exitoso { get; set; }
    public string? Motivo { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime FechaIntentoUtc { get; set; } = DateTime.UtcNow;
}

public class RefreshToken
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime FechaExpiracionUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public string? CreadoPorIp { get; set; }
    public DateTime? FechaRevocacionUtc { get; set; }
    public string? ReemplazadoPorTokenHash { get; set; }
    public string? RevocadoPorIp { get; set; }
    public string? MotivoRevocacion { get; set; }

    public bool EstaActivo => FechaRevocacionUtc == null && DateTime.UtcNow < FechaExpiracionUtc;
}

public class AuditoriaEvento
{
    public long Id { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string? NombreUsuario { get; set; }
    public string Modulo { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string Entidad { get; set; } = string.Empty;
    public string? EntidadId { get; set; }
    public int? UnidadId { get; set; }
    public string? Resumen { get; set; }
    public string? ValoresAnteriores { get; set; }
    public string? ValoresNuevos { get; set; }
    public string? IpAddress { get; set; }
    public DateTime FechaEventoUtc { get; set; } = DateTime.UtcNow;
}
