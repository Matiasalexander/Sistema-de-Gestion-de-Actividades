using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Cryptography;
using SistemaGestionGA.API.Services;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Infrastructure.Security;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    ApplicationDbContext db,
    JwtTokenService jwtService,
    ICurrentUserService currentUser,
    IPasswordRecoveryMailer recoveryMailer,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request, CancellationToken ct)
    {
        var identificador = request.Identificador.Trim();
        var digitsIdentificador = new string(identificador.Where(char.IsDigit).ToArray());

        var usuario = await db.Usuarios
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol!).ThenInclude(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .FirstOrDefaultAsync(u =>
                u.NombreUsuario == identificador ||
                u.Email == identificador ||
                u.Telefono == identificador, ct);

        // Si no se encontró por coincidencia directa y el identificador tiene al menos 10 dígitos numéricos,
        // validar con los números telefónicos normalizados de los usuarios.
        if (usuario == null && digitsIdentificador.Length >= 10)
        {
            var last10 = digitsIdentificador[^10..];
            var candidatosConTelefono = await db.Usuarios
                .Include(u => u.Departamento)
                .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol!).ThenInclude(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
                .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
                .Where(u => u.Telefono != null && u.Telefono != "")
                .ToListAsync(ct);

            usuario = candidatosConTelefono.FirstOrDefault(u =>
            {
                var telDigits = new string(u.Telefono!.Where(char.IsDigit).ToArray());
                return telDigits == digitsIdentificador || (telDigits.Length >= 10 && telDigits[^10..] == last10);
            });
        }

        if (usuario == null)
        {
            await RegistrarIntentoAccesoAsync(null, identificador, false, "Credenciales inválidas", ct);
            throw new DomainRuleException("Usuario o contraseña incorrectos.", "CREDENCIALES_INVALIDAS", 401);
        }

        if (!usuario.Activo)
        {
            await RegistrarIntentoAccesoAsync(usuario.Id, identificador, false, "Cuenta desactivada", ct);
            throw new DomainRuleException("La cuenta de usuario se encuentra desactivada. Contacte al administrador.", "CUENTA_INACTIVA", 403);
        }

        if (usuario.BloqueadoHastaUtc.HasValue && usuario.BloqueadoHastaUtc.Value > DateTime.UtcNow)
        {
            var minutosRestantes = Math.Max(1, (int)Math.Ceiling((usuario.BloqueadoHastaUtc.Value - DateTime.UtcNow).TotalMinutes));
            await RegistrarIntentoAccesoAsync(usuario.Id, identificador, false, "Cuenta temporalmente bloqueada por intentos fallidos", ct);
            throw new DomainRuleException($"Cuenta bloqueada temporalmente por seguridad. Intente nuevamente en {minutosRestantes} minuto(s).", "CUENTA_BLOQUEADA", 423);
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
        {
            usuario.IntentosFallidos++;
            if (usuario.IntentosFallidos >= 5)
            {
                usuario.BloqueadoHastaUtc = DateTime.UtcNow.AddMinutes(15);
            }
            await db.SaveChangesAsync(ct);
            await RegistrarIntentoAccesoAsync(usuario.Id, identificador, false, "Contraseña incorrecta", ct);
            throw new DomainRuleException("Usuario o contraseña incorrectos.", "CREDENCIALES_INVALIDAS", 401);
        }

        usuario.IntentosFallidos = 0;
        usuario.BloqueadoHastaUtc = null;
        usuario.UltimoAccesoUtc = DateTime.UtcNow;

        var dtoAutenticado = await ConstruirUsuarioAutenticadoDtoAsync(usuario, ct);
        var (accessToken, expiraEnUtc) = jwtService.GenerarAccessToken(dtoAutenticado);
        var refreshTokenPlano = jwtService.GenerarRefreshTokenPlano();
        var refreshTokenHash = JwtTokenService.CalcularHashSha256(refreshTokenPlano);

        db.RefreshTokens.Add(new RefreshToken
        {
            UsuarioId = usuario.Id,
            TokenHash = refreshTokenHash,
            FechaExpiracionUtc = DateTime.UtcNow.AddDays(7),
            CreadoPorIp = currentUser.IpAddress
        });

        await RegistrarIntentoAccesoAsync(usuario.Id, identificador, true, "Inicio de sesión exitoso", ct);
        await db.SaveChangesAsync(ct);

        return Ok(new LoginResponseDto(accessToken, refreshTokenPlano, expiraEnUtc, dtoAutenticado));
    }

    // Respuesta genérica: no confirma si el correo está registrado.
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("password-recovery")]
    public async Task<IActionResult> SolicitarRecuperacion([FromBody] SolicitarRecuperacionDto request, CancellationToken ct)
    {
        var email = request.Email.Trim();
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Email == email && u.Activo, ct);
        if (usuario != null)
        {
            var frontendUrl = configuration["PasswordRecovery:FrontendUrl"];
            if (string.IsNullOrWhiteSpace(frontendUrl) ||
                !Uri.TryCreate(frontendUrl, UriKind.Absolute, out var baseUrl) ||
                (baseUrl.Scheme != Uri.UriSchemeHttps && !baseUrl.IsLoopback))
                throw new InvalidOperationException("Configurar una URL de frontend segura para recuperación.");

            // El enlace usa un fragmento (#) para evitar que el token viaje en requests HTTP GET.
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48))
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');
            var hash = JwtTokenService.CalcularHashSha256(token);
            var enlace = frontendUrl.TrimEnd('/') + "/#reset-password?token=" + Uri.EscapeDataString(token);

            // Enviar antes de persistir, para no invalidar un enlace previo si falla SMTP.
            await recoveryMailer.EnviarAsync(usuario.Email, usuario.NombreUsuario, enlace, ct);
            usuario.TokenRecuperacionHash = hash;
            usuario.TokenRecuperacionExpiraUtc = DateTime.UtcNow.AddMinutes(15);
            await db.SaveChangesAsync(ct);
        }
        return Ok(new { mensaje = "Si la cuenta está registrada y activa, recibirás instrucciones en su correo." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("password-recovery")]
    public async Task<IActionResult> RestablecerPassword([FromBody] RestablecerPasswordDto request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Token) || request.Token.Length > 256 ||
            string.IsNullOrWhiteSpace(request.NuevoPassword) || request.NuevoPassword.Length < 12)
            return BadRequest(new { mensaje = "Solicitud de recuperación inválida." });

        var hash = JwtTokenService.CalcularHashSha256(request.Token);
        var ahora = DateTime.UtcNow;
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Activo &&
            u.TokenRecuperacionHash == hash && u.TokenRecuperacionExpiraUtc > ahora, ct);
        if (usuario == null)
            return BadRequest(new { mensaje = "El enlace es inválido o ha expirado. Solicita uno nuevo." });

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevoPassword);
        usuario.TokenRecuperacionHash = null;
        usuario.TokenRecuperacionExpiraUtc = null;
        usuario.DebeCambiarPassword = false;
        usuario.IntentosFallidos = 0;
        usuario.BloqueadoHastaUtc = null;
        usuario.FechaModificacionUtc = ahora;
        var activos = await db.RefreshTokens
            .Where(t => t.UsuarioId == usuario.Id && t.FechaRevocacionUtc == null).ToListAsync(ct);
        foreach (var token in activos)
        {
            token.FechaRevocacionUtc = ahora;
            token.MotivoRevocacion = "Recuperación de contraseña";
        }
        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            Modulo = "Seguridad",
            Accion = "RecuperacionPassword",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            Resumen = "Contraseña recuperada por enlace de correo.",
            IpAddress = currentUser.IpAddress
        });
        await db.SaveChangesAsync(ct);
        return Ok(new { mensaje = "Contraseña actualizada. Ya puedes iniciar sesión." });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponseDto>> Refresh([FromBody] RefreshTokenRequestDto request, CancellationToken ct)
    {
        var tokenHash = JwtTokenService.CalcularHashSha256(request.RefreshToken);
        var tokenExistente = await db.RefreshTokens
            .Include(rt => rt.Usuario!).ThenInclude(u => u.Departamento)
            .Include(rt => rt.Usuario!).ThenInclude(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol!).ThenInclude(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .Include(rt => rt.Usuario!).ThenInclude(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, ct);

        if (tokenExistente == null || !tokenExistente.EstaActivo || tokenExistente.Usuario == null || !tokenExistente.Usuario.Activo)
        {
            throw new DomainRuleException("El Refresh Token es inválido, ha expirado o fue revocado.", "REFRESH_TOKEN_INVALIDO", 401);
        }

        var nuevoPlano = jwtService.GenerarRefreshTokenPlano();
        var nuevoHash = JwtTokenService.CalcularHashSha256(nuevoPlano);

        tokenExistente.FechaRevocacionUtc = DateTime.UtcNow;
        tokenExistente.RevocadoPorIp = currentUser.IpAddress;
        tokenExistente.ReemplazadoPorTokenHash = nuevoHash;
        tokenExistente.MotivoRevocacion = "Rotación automática de Refresh Token";

        db.RefreshTokens.Add(new RefreshToken
        {
            UsuarioId = tokenExistente.UsuarioId,
            TokenHash = nuevoHash,
            FechaExpiracionUtc = DateTime.UtcNow.AddDays(7),
            CreadoPorIp = currentUser.IpAddress
        });

        var dtoAutenticado = await ConstruirUsuarioAutenticadoDtoAsync(tokenExistente.Usuario, ct);
        var (accessToken, expiraEnUtc) = jwtService.GenerarAccessToken(dtoAutenticado);
        await db.SaveChangesAsync(ct);

        return Ok(new LoginResponseDto(accessToken, nuevoPlano, expiraEnUtc, dtoAutenticado));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto? request, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
        {
            var hash = JwtTokenService.CalcularHashSha256(request.RefreshToken);
            var token = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash && t.FechaRevocacionUtc == null, ct);
            if (token != null)
            {
                token.FechaRevocacionUtc = DateTime.UtcNow;
                token.RevocadoPorIp = currentUser.IpAddress;
                token.MotivoRevocacion = "Cierre de sesión por el usuario";
                await db.SaveChangesAsync(ct);
            }
        }
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioAutenticadoDto>> Me(CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión no válida.", "NO_AUTENTICADO", 401);
        var usuario = await db.Usuarios
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol!).ThenInclude(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Activo, ct);

        if (usuario == null)
            throw new DomainRuleException("Usuario no encontrado o inactivo.", "NO_AUTENTICADO", 401);

        return Ok(await ConstruirUsuarioAutenticadoDtoAsync(usuario, ct));
    }

    [HttpPost("cambiar-password")]
    [Authorize]
    public async Task<IActionResult> CambiarPassword([FromBody] CambiarPasswordDto request, CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión no válida.", "NO_AUTENTICADO", 401);
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!BCrypt.Net.BCrypt.Verify(request.PasswordActual, usuario.PasswordHash))
        {
            throw new DomainRuleException("La contraseña actual proporcionada es incorrecta.", "PASSWORD_ACTUAL_INCORRECTO", 400);
        }

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevoPassword);
        usuario.DebeCambiarPassword = false;
        usuario.FechaModificacionUtc = DateTime.UtcNow;

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = usuario.Id,
            NombreUsuario = usuario.NombreUsuario,
            Modulo = "Seguridad",
            Accion = "CambioPasswordPropio",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            Resumen = "El usuario actualizó su contraseña personal.",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { mensaje = "Contraseña actualizada correctamente." });
    }

    private async Task<UsuarioAutenticadoDto> ConstruirUsuarioAutenticadoDtoAsync(Usuario usuario, CancellationToken ct)
    {
        IReadOnlyList<UnidadResumenDto> unidades;
        if (usuario.AccesoGlobalUnidades)
        {
            var todas = await db.Unidades.Where(u => u.Activa).OrderBy(u => u.Id).ToListAsync(ct);
            var principalId = usuario.UsuarioUnidades.FirstOrDefault(uu => uu.EsUnidadPrincipal)?.UnidadId ?? todas.FirstOrDefault()?.Id;
            unidades = todas.Select(u => new UnidadResumenDto(u.Id, u.Codigo, u.Nombre, u.Id == principalId)).ToList();
        }
        else
        {
            unidades = usuario.UsuarioUnidades
                .Where(uu => uu.Unidad != null && uu.Unidad.Activa)
                .Select(uu => new UnidadResumenDto(uu.UnidadId, uu.Unidad!.Codigo, uu.Unidad.Nombre, uu.EsUnidadPrincipal))
                .ToList();
        }

        var rolesActivos = usuario.UsuarioRoles
            .Where(ur => ur.Rol != null && ur.Rol.Activo)
            .Select(ur => ur.Rol!)
            .ToList();

        var rolesCodigos = rolesActivos.Select(r => r.Codigo).Distinct().ToList();
        var permisosCodigos = rolesActivos
            .SelectMany(r => r.RolPermisos)
            .Where(rp => rp.Permiso != null)
            .Select(rp => rp.Permiso!.Codigo)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(c => c)
            .ToList();

        return new UsuarioAutenticadoDto(
            usuario.Id,
            usuario.NombreUsuario,
            usuario.Email,
            usuario.NombreCompleto,
            usuario.Cargo,
            usuario.DepartamentoId,
            usuario.Departamento?.Nombre,
            usuario.AccesoGlobalUnidades,
            unidades,
            rolesCodigos,
            permisosCodigos);
    }

    private async Task RegistrarIntentoAccesoAsync(int? usuarioId, string identificador, bool exitoso, string motivo, CancellationToken ct)
    {
        db.HistorialAccesos.Add(new HistorialAcceso
        {
            UsuarioId = usuarioId,
            IdentificadorIntentado = identificador,
            Exitoso = exitoso,
            Motivo = motivo,
            IpAddress = currentUser.IpAddress,
            UserAgent = currentUser.UserAgent,
            FechaIntentoUtc = DateTime.UtcNow
        });
        await db.SaveChangesAsync(ct);
    }
}
