using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.API.Security;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Shared.Constants;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("directorio")]
    public async Task<ActionResult<IReadOnlyList<UsuarioListaDto>>> ObtenerDirectorioAlcance([FromQuery] int? unidadId, CancellationToken ct)
    {
        var query = db.Usuarios
            .AsNoTracking()
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol)
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .Include(u => u.UsuarioEquipos).ThenInclude(ue => ue.Equipo)
            .Where(u => u.Activo);

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(u => u.AccesoGlobalUnidades || u.UsuarioUnidades.Any(uu => uu.UnidadId == unidadId.Value));
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(u => u.UsuarioUnidades.Any(uu => unidades.Contains(uu.UnidadId)));
        }

        var usuarios = await query.OrderBy(u => u.NombreCompleto).ToListAsync(ct);
        return Ok(usuarios.Select(MapearUsuarioListaDto).ToList());
    }

    [HttpGet]
    [RequierePermiso(PermisosConstantes.UsuariosVer)]
    public async Task<ActionResult<IReadOnlyList<UsuarioListaDto>>> ListarUsuarios(
        [FromQuery] string? busqueda,
        [FromQuery] int? unidadId,
        [FromQuery] int? rolId,
        [FromQuery] bool? activo,
        CancellationToken ct)
    {
        var query = db.Usuarios
            .AsNoTracking()
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol)
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .Include(u => u.UsuarioEquipos).ThenInclude(ue => ue.Equipo)
            .AsQueryable();

        if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(u => u.UsuarioUnidades.Any(uu => unidades.Contains(uu.UnidadId)));
        }

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(u => u.UsuarioUnidades.Any(uu => uu.UnidadId == unidadId.Value));
        }

        if (rolId.HasValue)
        {
            query = query.Where(u => u.UsuarioRoles.Any(ur => ur.RolId == rolId.Value));
        }

        if (activo.HasValue)
        {
            query = query.Where(u => u.Activo == activo.Value);
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(u =>
                u.NombreCompleto.ToLower().Contains(b) ||
                u.NombreUsuario.ToLower().Contains(b) ||
                u.Email.ToLower().Contains(b));
        }

        var items = await query.OrderBy(u => u.NombreCompleto).ToListAsync(ct);
        return Ok(items.Select(MapearUsuarioListaDto).ToList());
    }

    [HttpGet("{id:int}")]
    [RequierePermiso(PermisosConstantes.UsuariosVer)]
    public async Task<ActionResult<UsuarioListaDto>> ObtenerPorId(int id, CancellationToken ct)
    {
        var usuario = await db.Usuarios
            .AsNoTracking()
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol)
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .Include(u => u.UsuarioEquipos).ThenInclude(ue => ue.Equipo)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!currentUser.AccesoGlobalUnidades &&
            !usuario.UsuarioUnidades.Any(uu => currentUser.UnidadesAutorizadas.Contains(uu.UnidadId)))
        {
            throw new ForbiddenScopeException("No tiene autorización para consultar este usuario fuera de sus unidades asignadas.");
        }

        return Ok(MapearUsuarioListaDto(usuario));
    }

    [HttpPost]
    [RequierePermiso(PermisosConstantes.UsuariosCrear)]
    public async Task<ActionResult<UsuarioListaDto>> CrearUsuario([FromBody] CrearUsuarioDto dto, CancellationToken ct)
    {
        var usernameNorm = dto.NombreUsuario.Trim();
        var emailNorm = dto.Email.Trim().ToLowerInvariant();

        if (await db.Usuarios.AnyAsync(u => u.NombreUsuario == usernameNorm || u.Email == emailNorm, ct))
        {
            throw new DomainRuleException("Ya existe un usuario registrado con ese nombre de usuario o correo electrónico.", "USUARIO_DUPLICADO", 400);
        }

        var telNorm = dto.Telefono?.Trim() ?? string.Empty;
        var telDigits = new string(telNorm.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(telNorm) || telDigits.Length < 10)
        {
            throw new DomainRuleException("El número de teléfono móvil es obligatorio y debe contener al menos 10 dígitos.", "TELEFONO_INVALIDO", 400);
        }

        var last10 = telDigits[^10..];
        var usuariosConTel = await db.Usuarios
            .Where(u => u.Telefono != null && u.Telefono != "")
            .Select(u => new { u.Id, u.Telefono })
            .ToListAsync(ct);

        var telefonoDuplicado = usuariosConTel.Any(u =>
        {
            var uDigits = new string(u.Telefono!.Where(char.IsDigit).ToArray());
            return u.Telefono == telNorm || uDigits == telDigits || (uDigits.Length >= 10 && uDigits[^10..] == last10);
        });

        if (telefonoDuplicado)
        {
            throw new DomainRuleException("El número de teléfono ya se encuentra registrado con otro usuario. No se permiten números de teléfono duplicados.", "TELEFONO_DUPLICADO", 400);
        }

        if (dto.AccesoGlobalUnidades && !currentUser.AccesoGlobalUnidades)
        {
            throw new ForbiddenScopeException("Solo un administrador con alcance global puede otorgar acceso global a unidades.");
        }

        if (dto.UnidadesIds.Count == 0 && !dto.AccesoGlobalUnidades)
        {
            throw new DomainRuleException("El usuario debe tener al menos una unidad de negocio asignada.", "UNIDADES_REQUERIDAS", 400);
        }

        foreach (var unidadId in dto.UnidadesIds)
        {
            currentUser.ExigirAlcanceUnidad(unidadId);
        }

        var usuario = new Usuario
        {
            NombreUsuario = usernameNorm,
            Email = emailNorm,
            NombreCompleto = dto.NombreCompleto.Trim(),
            Cargo = dto.Cargo?.Trim(),
            Telefono = dto.Telefono?.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            DepartamentoId = dto.DepartamentoId,
            AccesoGlobalUnidades = dto.AccesoGlobalUnidades,
            Activo = dto.Activo,
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        foreach (var rolId in dto.RolesIds.Distinct())
        {
            db.UsuarioRoles.Add(new UsuarioRol { UsuarioId = usuario.Id, RolId = rolId });
        }

        var principalId = dto.UnidadPrincipalId ?? dto.UnidadesIds.FirstOrDefault();
        foreach (var unidadId in dto.UnidadesIds.Distinct())
        {
            db.UsuarioUnidades.Add(new UsuarioUnidad
            {
                UsuarioId = usuario.Id,
                UnidadId = unidadId,
                EsUnidadPrincipal = unidadId == principalId
            });
        }

        if (dto.EquiposIds != null)
        {
            foreach (var eqId in dto.EquiposIds.Distinct())
            {
                db.UsuarioEquipos.Add(new UsuarioEquipo { UsuarioId = usuario.Id, EquipoId = eqId });
            }
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Usuarios",
            Accion = "AltaUsuario",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            UnidadId = principalId,
            Resumen = $"Alta de usuario '{usuario.NombreUsuario}' ({usuario.NombreCompleto})",
            ValoresNuevos = JsonSerializer.Serialize(new { usuario.NombreUsuario, usuario.Email, dto.RolesIds, dto.UnidadesIds }),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return await ObtenerPorId(usuario.Id, ct);
    }

    [HttpPut("{id:int}")]
    [RequierePermiso(PermisosConstantes.UsuariosEditar)]
    public async Task<ActionResult<UsuarioListaDto>> ActualizarUsuario(int id, [FromBody] ActualizarUsuarioDto dto, CancellationToken ct)
    {
        var usuario = await db.Usuarios
            .Include(u => u.UsuarioRoles)
            .Include(u => u.UsuarioUnidades)
            .Include(u => u.UsuarioEquipos)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!currentUser.AccesoGlobalUnidades &&
            !usuario.UsuarioUnidades.Any(uu => currentUser.UnidadesAutorizadas.Contains(uu.UnidadId)))
        {
            throw new ForbiddenScopeException();
        }

        foreach (var unidadId in dto.UnidadesIds)
        {
            currentUser.ExigirAlcanceUnidad(unidadId);
        }

        var anterior = JsonSerializer.Serialize(new
        {
            usuario.Email,
            usuario.NombreCompleto,
            usuario.Cargo,
            usuario.DepartamentoId,
            usuario.AccesoGlobalUnidades,
            usuario.Activo,
            Roles = usuario.UsuarioRoles.Select(r => r.RolId).ToList(),
            Unidades = usuario.UsuarioUnidades.Select(u => u.UnidadId).ToList()
        });

        var emailNorm = dto.Email.Trim().ToLowerInvariant();
        if (await db.Usuarios.AnyAsync(u => u.Id != id && u.Email == emailNorm, ct))
        {
            throw new DomainRuleException("Ya existe otro usuario registrado con ese correo electrónico.", "EMAIL_DUPLICADO", 400);
        }

        var telNorm = dto.Telefono?.Trim() ?? string.Empty;
        var telDigits = new string(telNorm.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(telNorm) || telDigits.Length < 10)
        {
            throw new DomainRuleException("El número de teléfono móvil es obligatorio y debe contener al menos 10 dígitos.", "TELEFONO_INVALIDO", 400);
        }

        var last10 = telDigits[^10..];
        var usuariosConTel = await db.Usuarios
            .Where(u => u.Id != id && u.Telefono != null && u.Telefono != "")
            .Select(u => new { u.Id, u.Telefono })
            .ToListAsync(ct);

        var telefonoDuplicado = usuariosConTel.Any(u =>
        {
            var uDigits = new string(u.Telefono!.Where(char.IsDigit).ToArray());
            return u.Telefono == telNorm || uDigits == telDigits || (uDigits.Length >= 10 && uDigits[^10..] == last10);
        });

        if (telefonoDuplicado)
        {
            throw new DomainRuleException("El número de teléfono ya se encuentra registrado con otro usuario. No se permiten números de teléfono duplicados.", "TELEFONO_DUPLICADO", 400);
        }

        usuario.Email = emailNorm;
        usuario.NombreCompleto = dto.NombreCompleto.Trim();
        usuario.Cargo = dto.Cargo?.Trim();
        usuario.Telefono = telNorm;
        usuario.DepartamentoId = dto.DepartamentoId;
        if (currentUser.AccesoGlobalUnidades)
        {
            usuario.AccesoGlobalUnidades = dto.AccesoGlobalUnidades;
        }
        usuario.Activo = dto.Activo;
        usuario.FechaModificacionUtc = DateTime.UtcNow;

        db.UsuarioRoles.RemoveRange(usuario.UsuarioRoles);
        foreach (var rolId in dto.RolesIds.Distinct())
        {
            db.UsuarioRoles.Add(new UsuarioRol { UsuarioId = usuario.Id, RolId = rolId });
        }

        db.UsuarioUnidades.RemoveRange(usuario.UsuarioUnidades);
        var principalId = dto.UnidadPrincipalId ?? dto.UnidadesIds.FirstOrDefault();
        foreach (var unidadId in dto.UnidadesIds.Distinct())
        {
            db.UsuarioUnidades.Add(new UsuarioUnidad
            {
                UsuarioId = usuario.Id,
                UnidadId = unidadId,
                EsUnidadPrincipal = unidadId == principalId
            });
        }

        if (dto.EquiposIds != null)
        {
            db.UsuarioEquipos.RemoveRange(usuario.UsuarioEquipos);
            foreach (var eqId in dto.EquiposIds.Distinct())
            {
                db.UsuarioEquipos.Add(new UsuarioEquipo { UsuarioId = usuario.Id, EquipoId = eqId });
            }
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Usuarios",
            Accion = "EdicionUsuario",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            UnidadId = principalId,
            Resumen = $"Actualización de usuario '{usuario.NombreUsuario}'",
            ValoresAnteriores = anterior,
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return await ObtenerPorId(usuario.Id, ct);
    }

    [HttpPatch("{id:int}/estado")]
    [RequierePermiso(PermisosConstantes.UsuariosDesactivar)]
    public async Task<IActionResult> CambiarEstadoActivo(int id, [FromQuery] bool activo, CancellationToken ct)
    {
        var usuario = await db.Usuarios
            .Include(u => u.UsuarioUnidades)
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!currentUser.AccesoGlobalUnidades &&
            !usuario.UsuarioUnidades.Any(uu => currentUser.UnidadesAutorizadas.Contains(uu.UnidadId)))
        {
            throw new ForbiddenScopeException();
        }

        usuario.Activo = activo;
        usuario.FechaModificacionUtc = DateTime.UtcNow;

        if (!activo)
        {
            foreach (var rt in usuario.RefreshTokens.Where(t => t.FechaRevocacionUtc == null))
            {
                rt.FechaRevocacionUtc = DateTime.UtcNow;
                rt.RevocadoPorIp = currentUser.IpAddress;
                rt.MotivoRevocacion = "Desactivación administrativa de cuenta";
            }
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Usuarios",
            Accion = activo ? "ActivacionUsuario" : "DesactivacionUsuario",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            Resumen = $"{(activo ? "Activación" : "Desactivación")} de la cuenta '{usuario.NombreUsuario}'",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { usuario.Id, usuario.Activo });
    }

    [HttpDelete("{id:int}")]
    [RequierePermiso(PermisosConstantes.UsuariosEliminar)]
    public async Task<IActionResult> EliminarUsuario(int id, CancellationToken ct = default)
    {
        if (currentUser.UsuarioId == id)
        {
            throw new DomainRuleException("No puede eliminar su propia cuenta de usuario.", "AUTO_ELIMINACION_PROHIBIDA", 400);
        }

        var usuario = await db.Usuarios
            .Include(u => u.UsuarioRoles)
            .Include(u => u.UsuarioUnidades)
            .Include(u => u.UsuarioEquipos)
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!currentUser.AccesoGlobalUnidades &&
            !usuario.UsuarioUnidades.Any(uu => currentUser.UnidadesAutorizadas.Contains(uu.UnidadId)))
        {
            throw new ForbiddenScopeException();
        }

        var tieneHistorial = await db.Actividades.AnyAsync(a => a.CreadoPorId == id || a.Asignados.Any(asig => asig.UsuarioId == id), ct) ||
                             await db.Tickets.AnyAsync(t => t.SolicitanteId == id || t.ResponsableId == id, ct) ||
                             await db.AuditoriaEventos.AnyAsync(ae => ae.UsuarioId == id, ct);

        if (tieneHistorial)
        {
            usuario.Activo = false;
            usuario.FechaModificacionUtc = DateTime.UtcNow;

            foreach (var rt in usuario.RefreshTokens.Where(t => t.FechaRevocacionUtc == null))
            {
                rt.FechaRevocacionUtc = DateTime.UtcNow;
                rt.RevocadoPorIp = currentUser.IpAddress;
                rt.MotivoRevocacion = "Baja definitiva de cuenta de usuario";
            }

            db.AuditoriaEventos.Add(new AuditoriaEvento
            {
                UsuarioId = currentUser.UsuarioId,
                NombreUsuario = currentUser.NombreUsuario,
                Modulo = "Usuarios",
                Accion = "ELIMINAR_USUARIO_LOGICO",
                Entidad = "Usuario",
                EntidadId = usuario.Id.ToString(),
                Resumen = $"Baja lógica y revocación de accesos del usuario '{usuario.NombreUsuario}' ({usuario.NombreCompleto}) con historial",
                IpAddress = currentUser.IpAddress
            });

            await db.SaveChangesAsync(ct);
            return Ok(new { usuario.Id, borradoFisico = false, mensaje = "El usuario tiene historial operativo y fue dado de baja definitivamente." });
        }
        else
        {
            db.UsuarioRoles.RemoveRange(usuario.UsuarioRoles);
            db.UsuarioUnidades.RemoveRange(usuario.UsuarioUnidades);
            db.UsuarioEquipos.RemoveRange(usuario.UsuarioEquipos);
            db.RefreshTokens.RemoveRange(usuario.RefreshTokens);
            db.Usuarios.Remove(usuario);

            db.AuditoriaEventos.Add(new AuditoriaEvento
            {
                UsuarioId = currentUser.UsuarioId,
                NombreUsuario = currentUser.NombreUsuario,
                Modulo = "Usuarios",
                Accion = "ELIMINAR_USUARIO_FISICO",
                Entidad = "Usuario",
                EntidadId = usuario.Id.ToString(),
                Resumen = $"Eliminación física del usuario '{usuario.NombreUsuario}' ({usuario.NombreCompleto}) sin historial",
                IpAddress = currentUser.IpAddress
            });

            await db.SaveChangesAsync(ct);
            return Ok(new { id, borradoFisico = true, mensaje = "Usuario eliminado exitosamente del sistema." });
        }
    }

    [HttpPost("{id:int}/reset-password")]
    [RequierePermiso(PermisosConstantes.UsuariosEditar)]
    public async Task<IActionResult> ResetPasswordAdministrativo(int id, [FromBody] ResetPasswordAdminDto dto, CancellationToken ct)
    {
        var usuario = await db.Usuarios
            .Include(u => u.UsuarioUnidades)
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Usuario no encontrado.", "NO_ENCONTRADO", 404);

        if (!currentUser.AccesoGlobalUnidades &&
            !usuario.UsuarioUnidades.Any(uu => currentUser.UnidadesAutorizadas.Contains(uu.UnidadId)))
        {
            throw new ForbiddenScopeException();
        }

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NuevoPassword);
        usuario.DebeCambiarPassword = dto.DebeCambiarPassword;
        usuario.IntentosFallidos = 0;
        usuario.BloqueadoHastaUtc = null;
        usuario.FechaModificacionUtc = DateTime.UtcNow;

        foreach (var rt in usuario.RefreshTokens.Where(t => t.FechaRevocacionUtc == null))
        {
            rt.FechaRevocacionUtc = DateTime.UtcNow;
            rt.RevocadoPorIp = currentUser.IpAddress;
            rt.MotivoRevocacion = "Restablecimiento administrativo de contraseña";
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Usuarios",
            Accion = "ResetPasswordAdmin",
            Entidad = "Usuario",
            EntidadId = usuario.Id.ToString(),
            Resumen = $"Restablecimiento administrativo de contraseña para '{usuario.NombreUsuario}'",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { mensaje = "Contraseña restablecida y sesiones previas revocadas." });
    }

    [HttpGet("accesos")]
    [RequierePermiso(PermisosConstantes.UsuariosVer)]
    public async Task<ActionResult<IReadOnlyList<HistorialAccesoDto>>> ObtenerHistorialAccesos([FromQuery] int top = 100, CancellationToken ct = default)
    {
        var accesos = await db.HistorialAccesos
            .AsNoTracking()
            .OrderByDescending(a => a.FechaIntentoUtc)
            .Take(Math.Clamp(top, 10, 500))
            .Select(a => new HistorialAccesoDto(
                a.Id,
                a.UsuarioId,
                a.IdentificadorIntentado,
                a.Exitoso,
                a.Motivo,
                a.IpAddress,
                a.FechaIntentoUtc))
            .ToListAsync(ct);

        return Ok(accesos);
    }

    private static UsuarioListaDto MapearUsuarioListaDto(Usuario u) => new(
        u.Id,
        u.NombreUsuario,
        u.Email,
        u.NombreCompleto,
        u.Cargo,
        u.Telefono,
        u.DepartamentoId,
        u.Departamento?.Nombre,
        u.AccesoGlobalUnidades,
        u.Activo,
        u.UltimoAccesoUtc,
        u.FechaCreacionUtc,
        u.UsuarioRoles
            .Where(ur => ur.Rol != null)
            .Select(ur => new RolResumenDto(ur.RolId, ur.Rol!.Codigo, ur.Rol.Nombre))
            .ToList(),
        u.UsuarioUnidades
            .Where(uu => uu.Unidad != null)
            .Select(uu => new UnidadResumenDto(uu.UnidadId, uu.Unidad!.Codigo, uu.Unidad.Nombre, uu.EsUnidadPrincipal))
            .ToList(),
        u.UsuarioEquipos
            .Where(ue => ue.Equipo != null)
            .Select(ue => ue.Equipo!.Nombre)
            .ToList());
}

[ApiController]
[Route("api")]
[Authorize]
public class RolesYOrganizacionController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("permisos")]
    public async Task<ActionResult<IReadOnlyList<PermisoDto>>> ListarPermisos(CancellationToken ct)
    {
        var items = await db.Permisos
            .AsNoTracking()
            .OrderBy(p => p.Modulo).ThenBy(p => p.Codigo)
            .Select(p => new PermisoDto(p.Id, p.Codigo, p.Modulo, p.Accion, p.Nombre, p.Descripcion))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("roles")]
    public async Task<ActionResult<IReadOnlyList<RolDto>>> ListarRoles(CancellationToken ct)
    {
        var roles = await db.Roles
            .AsNoTracking()
            .Include(r => r.UsuarioRoles)
            .Include(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .OrderBy(r => r.Id)
            .ToListAsync(ct);

        return Ok(roles.Select(r => new RolDto(
            r.Id,
            r.Codigo,
            r.Nombre,
            r.Descripcion,
            r.EsSistema,
            r.Activo,
            r.UsuarioRoles.Count,
            r.RolPermisos.Where(rp => rp.Permiso != null).Select(rp => rp.Permiso!.Codigo).OrderBy(c => c).ToList()
        )).ToList());
    }

    [HttpPost("roles")]
    [RequierePermiso(PermisosConstantes.RolesGestionar)]
    public async Task<ActionResult<RolDto>> CrearRol([FromBody] GuardarRolDto dto, CancellationToken ct)
    {
        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Roles.AnyAsync(r => r.Codigo == codigo, ct))
            throw new DomainRuleException("Ya existe un rol con ese código.");

        var rol = new Rol
        {
            Codigo = codigo,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            EsSistema = false,
            Activo = dto.Activo
        };
        db.Roles.Add(rol);
        await db.SaveChangesAsync(ct);

        var permisos = await db.Permisos
            .Where(p => dto.PermisosCodigos.Contains(p.Codigo))
            .ToListAsync(ct);

        foreach (var p in permisos)
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rol.Id, PermisoId = p.Id });
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Seguridad",
            Accion = "CrearRol",
            Entidad = "Rol",
            EntidadId = rol.Id.ToString(),
            Resumen = $"Creación del rol '{rol.Nombre}' con {permisos.Count} permisos",
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new RolDto(rol.Id, rol.Codigo, rol.Nombre, rol.Descripcion, rol.EsSistema, rol.Activo, 0, permisos.Select(p => p.Codigo).ToList()));
    }

    [HttpPut("roles/{id:int}")]
    [RequierePermiso(PermisosConstantes.RolesGestionar)]
    public async Task<ActionResult<RolDto>> ActualizarRol(int id, [FromBody] GuardarRolDto dto, CancellationToken ct)
    {
        var rol = await db.Roles
            .Include(r => r.UsuarioRoles)
            .Include(r => r.RolPermisos).ThenInclude(rp => rp.Permiso)
            .FirstOrDefaultAsync(r => r.Id == id, ct)
            ?? throw new DomainRuleException("Rol no encontrado.", "NO_ENCONTRADO", 404);

        rol.Nombre = dto.Nombre.Trim();
        rol.Descripcion = dto.Descripcion?.Trim();
        rol.Activo = dto.Activo;

        db.RolPermisos.RemoveRange(rol.RolPermisos);
        var permisos = await db.Permisos
            .Where(p => dto.PermisosCodigos.Contains(p.Codigo))
            .ToListAsync(ct);

        foreach (var p in permisos)
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rol.Id, PermisoId = p.Id });
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Seguridad",
            Accion = "ActualizarRolPermisos",
            Entidad = "Rol",
            EntidadId = rol.Id.ToString(),
            Resumen = $"Actualización de matriz de permisos del rol '{rol.Nombre}' ({permisos.Count} permisos activos)",
            ValoresNuevos = JsonSerializer.Serialize(dto.PermisosCodigos),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new RolDto(rol.Id, rol.Codigo, rol.Nombre, rol.Descripcion, rol.EsSistema, rol.Activo, rol.UsuarioRoles.Count, permisos.Select(p => p.Codigo).ToList()));
    }

    [HttpGet("unidades")]
    public async Task<ActionResult<IReadOnlyList<UnidadDto>>> ListarUnidades([FromQuery] bool incluirTodasAdmin = false, CancellationToken ct = default)
    {
        var query = db.Unidades
            .AsNoTracking()
            .Include(u => u.Departamentos)
            .Include(u => u.UsuarioUnidades)
            .AsQueryable();

        if (!currentUser.AccesoGlobalUnidades && !incluirTodasAdmin)
        {
            var ids = currentUser.UnidadesAutorizadas;
            query = query.Where(u => ids.Contains(u.Id));
        }

        var unidades = await query.OrderBy(u => u.Id).ToListAsync(ct);
        return Ok(unidades.Select(u => new UnidadDto(
            u.Id,
            u.Codigo,
            u.Nombre,
            u.Descripcion,
            u.ZonaHoraria,
            u.Activa,
            u.Departamentos.Count,
            u.UsuarioUnidades.Count,
            u.Departamentos.OrderBy(d => d.Nombre).Select(d => new DepartamentoDto(
                d.Id, d.UnidadId, u.Nombre, d.Codigo, d.Nombre, d.Descripcion, d.Activa)).ToList()
        )).ToList());
    }

    [HttpPost("unidades")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<ActionResult<UnidadDto>> CrearUnidad([FromBody] GuardarUnidadDto dto, CancellationToken ct)
    {
        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Unidades.AnyAsync(u => u.Codigo == codigo, ct))
            throw new DomainRuleException("Ya existe una unidad con ese código.");

        var unidad = new Unidad
        {
            Codigo = codigo,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            ZonaHoraria = string.IsNullOrWhiteSpace(dto.ZonaHoraria) ? "America/Mexico_City" : dto.ZonaHoraria.Trim(),
            Activa = dto.Activa
        };
        db.Unidades.Add(unidad);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "CrearUnidad",
            Entidad = "Unidad",
            Resumen = $"Creación de la unidad de negocio '{unidad.Nombre}' ({unidad.Codigo})",
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new UnidadDto(unidad.Id, unidad.Codigo, unidad.Nombre, unidad.Descripcion, unidad.ZonaHoraria, unidad.Activa, 0, 0, []));
    }

    [HttpPut("unidades/{id:int}")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<ActionResult<UnidadDto>> ActualizarUnidad(int id, [FromBody] GuardarUnidadDto dto, CancellationToken ct)
    {
        if (!currentUser.AccesoGlobalUnidades)
            currentUser.ExigirAlcanceUnidad(id);

        var unidad = await db.Unidades
            .Include(u => u.Departamentos)
            .Include(u => u.UsuarioUnidades)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Unidad no encontrada.", "NO_ENCONTRADO", 404);

        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Unidades.AnyAsync(u => u.Codigo == codigo && u.Id != id, ct))
            throw new DomainRuleException("Ya existe otra unidad con ese código.", "CODIGO_DUPLICADO", 400);

        var valoresAnteriores = JsonSerializer.Serialize(new { unidad.Codigo, unidad.Nombre, unidad.Descripcion, unidad.ZonaHoraria, unidad.Activa });

        unidad.Codigo = codigo;
        unidad.Nombre = dto.Nombre.Trim();
        unidad.Descripcion = dto.Descripcion?.Trim();
        unidad.ZonaHoraria = string.IsNullOrWhiteSpace(dto.ZonaHoraria) ? "America/Mexico_City" : dto.ZonaHoraria.Trim();
        unidad.Activa = dto.Activa;

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "ActualizarUnidad",
            Entidad = "Unidad",
            EntidadId = unidad.Id.ToString(),
            UnidadId = unidad.Id,
            Resumen = $"Actualización de la unidad de negocio '{unidad.Nombre}' ({unidad.Codigo})",
            ValoresAnteriores = valoresAnteriores,
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new UnidadDto(
            unidad.Id,
            unidad.Codigo,
            unidad.Nombre,
            unidad.Descripcion,
            unidad.ZonaHoraria,
            unidad.Activa,
            unidad.Departamentos.Count,
            unidad.UsuarioUnidades.Count,
            unidad.Departamentos.OrderBy(d => d.Nombre).Select(d => new DepartamentoDto(
                d.Id, d.UnidadId, unidad.Nombre, d.Codigo, d.Nombre, d.Descripcion, d.Activa)).ToList()));
    }

    [HttpDelete("unidades/{id:int}")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<IActionResult> EliminarUnidad(int id, CancellationToken ct)
    {
        if (!currentUser.AccesoGlobalUnidades &&
            !User.IsInRole("SUPER_ADMIN") &&
            !User.IsInRole("ADMIN"))
        {
            throw new ForbiddenScopeException("Solo un administrador corporativo con acceso global puede eliminar unidades de negocio.");
        }

        var totalUnidades = await db.Unidades.CountAsync(ct);
        if (totalUnidades <= 1)
        {
            throw new DomainRuleException("No es posible eliminar la única unidad de negocio existente en el sistema.", "UNIDAD_UNICA", 400);
        }

        var unidad = await db.Unidades
            .Include(u => u.Departamentos)
            .Include(u => u.UsuarioUnidades)
            .FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new DomainRuleException("Unidad no encontrada.", "NO_ENCONTRADO", 404);

        // Validar dependencias operativas activas
        var totalProyectos = await db.Proyectos.CountAsync(p => p.UnidadId == id, ct);
        if (totalProyectos > 0)
            throw new DomainRuleException($"No se puede eliminar la unidad '{unidad.Nombre}' porque contiene {totalProyectos} proyecto(s) registrado(s). Reasigne o elimine los proyectos primero.", "PROYECTOS_VINCULADOS", 400);

        var totalActividades = await db.Actividades.CountAsync(a => a.UnidadId == id, ct);
        if (totalActividades > 0)
            throw new DomainRuleException($"No se puede eliminar la unidad '{unidad.Nombre}' porque contiene {totalActividades} actividad(es) registrada(s). Reasigne o elimine las actividades primero.", "ACTIVIDADES_VINCULADAS", 400);

        var totalTickets = await db.Tickets.CountAsync(t => t.UnidadId == id, ct);
        if (totalTickets > 0)
            throw new DomainRuleException($"No se puede eliminar la unidad '{unidad.Nombre}' porque contiene {totalTickets} ticket(s) de soporte registrado(s). Reasigne o elimine los tickets primero.", "TICKETS_VINCULADOS", 400);

        var totalEquipos = await db.Equipos.CountAsync(e => e.UnidadId == id, ct);
        if (totalEquipos > 0)
            throw new DomainRuleException($"No se puede eliminar la unidad '{unidad.Nombre}' porque tiene {totalEquipos} equipo(s) de trabajo asignado(s). Elimine o reasigne los equipos primero.", "EQUIPOS_VINCULADOS", 400);

        var totalChats = await db.ChatGrupos.CountAsync(g => g.UnidadId == id, ct);
        if (totalChats > 0)
            throw new DomainRuleException($"No se puede eliminar la unidad '{unidad.Nombre}' porque contiene {totalChats} grupo(s) de chat de WhatsApp. Elimine los grupos primero.", "CHATS_VINCULADOS", 400);

        // Desvincular políticas SLA que apunten a esta unidad
        var politicasSla = await db.PoliticasSla.Where(p => p.UnidadId == id).ToListAsync(ct);
        foreach (var p in politicasSla)
        {
            p.UnidadId = null;
        }

        // Desvincular usuarios asignados a los departamentos de esta unidad
        var deptoIds = unidad.Departamentos.Select(d => d.Id).ToList();
        if (deptoIds.Count > 0)
        {
            var usuariosEnDeptos = await db.Usuarios.Where(u => u.DepartamentoId != null && deptoIds.Contains(u.DepartamentoId.Value)).ToListAsync(ct);
            foreach (var u in usuariosEnDeptos)
            {
                u.DepartamentoId = null;
            }
        }

        // Desvincular usuarios asignados a esta unidad (UsuarioUnidades)
        db.UsuarioUnidades.RemoveRange(unidad.UsuarioUnidades);

        // Asegurar que usuarios sin otra unidad asignada y sin acceso global reciban al menos una unidad restante
        var otraUnidad = await db.Unidades.FirstOrDefaultAsync(u => u.Id != id, ct);
        if (otraUnidad != null)
        {
            var usuariosAfectadosIds = unidad.UsuarioUnidades.Select(uu => uu.UsuarioId).ToList();
            var usuariosSinUnidad = await db.Usuarios
                .Include(u => u.UsuarioUnidades)
                .Where(u => usuariosAfectadosIds.Contains(u.Id) && !u.AccesoGlobalUnidades)
                .ToListAsync(ct);

            foreach (var usr in usuariosSinUnidad)
            {
                if (!usr.UsuarioUnidades.Any(uu => uu.UnidadId != id))
                {
                    db.UsuarioUnidades.Add(new UsuarioUnidad
                    {
                        UsuarioId = usr.Id,
                        UnidadId = otraUnidad.Id,
                        EsUnidadPrincipal = true
                    });
                }
            }
        }

        // Eliminar departamentos de la unidad
        db.Departamentos.RemoveRange(unidad.Departamentos);

        // Eliminar la unidad
        db.Unidades.Remove(unidad);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "EliminarUnidad",
            Entidad = "Unidad",
            EntidadId = id.ToString(),
            Resumen = $"Unidad de negocio '{unidad.Nombre}' ({unidad.Codigo}) eliminada por {currentUser.NombreCompleto ?? currentUser.NombreUsuario}.",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { id, mensaje = $"Unidad '{unidad.Nombre}' eliminada exitosamente." });
    }

    [HttpGet("departamentos")]
    public async Task<ActionResult<IReadOnlyList<DepartamentoDto>>> ListarDepartamentos([FromQuery] int? unidadId, CancellationToken ct)
    {
        var query = db.Departamentos
            .AsNoTracking()
            .Include(d => d.Unidad)
            .AsQueryable();

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(d => d.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var ids = currentUser.UnidadesAutorizadas;
            query = query.Where(d => ids.Contains(d.UnidadId));
        }

        var items = await query.OrderBy(d => d.Nombre).ToListAsync(ct);
        return Ok(items.Select(d => new DepartamentoDto(
            d.Id, d.UnidadId, d.Unidad?.Nombre ?? "", d.Codigo, d.Nombre, d.Descripcion, d.Activa)).ToList());
    }

    [HttpPost("departamentos")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<ActionResult<DepartamentoDto>> CrearDepartamento([FromBody] GuardarDepartamentoDto dto, CancellationToken ct)
    {
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);
        var unidad = await db.Unidades.FindAsync([dto.UnidadId], ct)
            ?? throw new DomainRuleException("Unidad no encontrada.", "NO_ENCONTRADO", 404);

        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Departamentos.AnyAsync(d => d.UnidadId == dto.UnidadId && d.Codigo == codigo, ct))
            throw new DomainRuleException("Ya existe un departamento con ese código en esta unidad.", "CODIGO_DUPLICADO", 400);

        var depto = new Departamento
        {
            UnidadId = dto.UnidadId,
            Codigo = codigo,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Activa = dto.Activa
        };
        db.Departamentos.Add(depto);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "CrearDepartamento",
            Entidad = "Departamento",
            UnidadId = dto.UnidadId,
            Resumen = $"Creación del departamento '{depto.Nombre}' ({depto.Codigo}) en unidad '{unidad.Nombre}'",
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new DepartamentoDto(depto.Id, depto.UnidadId, unidad.Nombre, depto.Codigo, depto.Nombre, depto.Descripcion, depto.Activa));
    }

    [HttpPut("departamentos/{id:int}")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<ActionResult<DepartamentoDto>> ActualizarDepartamento(int id, [FromBody] GuardarDepartamentoDto dto, CancellationToken ct)
    {
        var depto = await db.Departamentos
            .Include(d => d.Unidad)
            .FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new DomainRuleException("Departamento no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(depto.UnidadId);

        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Departamentos.AnyAsync(d => d.UnidadId == depto.UnidadId && d.Codigo == codigo && d.Id != id, ct))
            throw new DomainRuleException("Ya existe otro departamento con ese código en la misma unidad.", "CODIGO_DUPLICADO", 400);

        var valoresAnteriores = JsonSerializer.Serialize(new { depto.Codigo, depto.Nombre, depto.Descripcion, depto.Activa });

        depto.Codigo = codigo;
        depto.Nombre = dto.Nombre.Trim();
        depto.Descripcion = dto.Descripcion?.Trim();
        depto.Activa = dto.Activa;

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "ActualizarDepartamento",
            Entidad = "Departamento",
            EntidadId = depto.Id.ToString(),
            UnidadId = depto.UnidadId,
            Resumen = $"Actualización del departamento '{depto.Nombre}' ({depto.Codigo})",
            ValoresAnteriores = valoresAnteriores,
            ValoresNuevos = JsonSerializer.Serialize(dto),
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new DepartamentoDto(
            depto.Id,
            depto.UnidadId,
            depto.Unidad?.Nombre ?? "",
            depto.Codigo,
            depto.Nombre,
            depto.Descripcion,
            depto.Activa));
    }

    [HttpDelete("departamentos/{id:int}")]
    [RequierePermiso(PermisosConstantes.UnidadesGestionar)]
    public async Task<IActionResult> EliminarDepartamento(int id, CancellationToken ct)
    {
        var depto = await db.Departamentos
            .Include(d => d.Unidad)
            .FirstOrDefaultAsync(d => d.Id == id, ct)
            ?? throw new DomainRuleException("Departamento no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(depto.UnidadId);

        var totalTickets = await db.Tickets.CountAsync(t => t.DepartamentoId == id, ct);
        if (totalTickets > 0)
            throw new DomainRuleException($"No se puede eliminar el departamento '{depto.Nombre}' porque tiene {totalTickets} ticket(s) asociado(s). Reasigne o elimine los tickets primero.", "TICKETS_VINCULADOS", 400);

        var totalProyectos = await db.Proyectos.CountAsync(p => p.DepartamentoId == id, ct);
        if (totalProyectos > 0)
            throw new DomainRuleException($"No se puede eliminar el departamento '{depto.Nombre}' porque tiene {totalProyectos} proyecto(s) asociado(s). Reasigne o elimine los proyectos primero.", "PROYECTOS_VINCULADOS", 400);

        var totalEquipos = await db.Equipos.CountAsync(e => e.DepartamentoId == id, ct);
        if (totalEquipos > 0)
            throw new DomainRuleException($"No se puede eliminar el departamento '{depto.Nombre}' porque tiene {totalEquipos} equipo(s) asociado(s). Reasigne o elimine los equipos primero.", "EQUIPOS_VINCULADOS", 400);

        // Desvincular usuarios asignados a este departamento
        var usuarios = await db.Usuarios.Where(u => u.DepartamentoId == id).ToListAsync(ct);
        foreach (var u in usuarios)
        {
            u.DepartamentoId = null;
        }

        db.Departamentos.Remove(depto);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organizacion",
            Accion = "EliminarDepartamento",
            Entidad = "Departamento",
            EntidadId = id.ToString(),
            UnidadId = depto.UnidadId,
            Resumen = $"Departamento '{depto.Nombre}' ({depto.Codigo}) eliminado.",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { id, mensaje = $"Departamento '{depto.Nombre}' eliminado exitosamente." });
    }

    [HttpGet("equipos")]
    public async Task<ActionResult<IReadOnlyList<EquipoDto>>> ListarEquipos([FromQuery] int? unidadId, CancellationToken ct)
    {
        var query = db.Equipos
            .AsNoTracking()
            .Include(e => e.Unidad)
            .Include(e => e.Departamento)
            .Include(e => e.LiderUsuario)
            .Include(e => e.Integrantes).ThenInclude(i => i.Usuario)
            .AsQueryable();

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(e => e.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var ids = currentUser.UnidadesAutorizadas;
            query = query.Where(e => ids.Contains(e.UnidadId));
        }

        var equipos = await query.OrderBy(e => e.Nombre).ToListAsync(ct);
        return Ok(equipos.Select(e => new EquipoDto(
            e.Id,
            e.Codigo,
            e.UnidadId,
            e.Unidad?.Nombre ?? "",
            e.DepartamentoId,
            e.Departamento?.Nombre,
            e.Nombre,
            e.Descripcion,
            e.ColorHex,
            e.LiderUsuarioId,
            e.LiderUsuario?.NombreCompleto,
            e.Activo,
            e.Integrantes.Where(i => i.Usuario != null).Select(i => new EquipoIntegranteDto(
                i.UsuarioId, i.Usuario!.NombreCompleto, i.Usuario.Email, i.RolEnEquipo)).ToList()
        )).ToList());
    }

    [HttpPost("equipos")]
    [RequierePermiso(PermisosConstantes.EquiposGestionar)]
    public async Task<ActionResult<EquipoDto>> CrearEquipo([FromBody] GuardarEquipoDto dto, CancellationToken ct)
    {
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);
        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Equipos.AnyAsync(e => e.Codigo == codigo, ct))
            throw new DomainRuleException("Ya existe un equipo con ese código.");

        var equipo = new Equipo
        {
            Codigo = codigo,
            UnidadId = dto.UnidadId,
            DepartamentoId = dto.DepartamentoId,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#2563EB" : dto.ColorHex,
            LiderUsuarioId = dto.LiderUsuarioId,
            Activo = dto.Activo
        };
        db.Equipos.Add(equipo);
        await db.SaveChangesAsync(ct);

        foreach (var usrId in dto.IntegrantesIds.Distinct())
        {
            db.UsuarioEquipos.Add(new UsuarioEquipo
            {
                EquipoId = equipo.Id,
                UsuarioId = usrId,
                RolEnEquipo = usrId == dto.LiderUsuarioId ? "Líder" : "Integrante"
            });
        }
        await db.SaveChangesAsync(ct);

        var creado = await ListarEquipos(dto.UnidadId, ct);
        return Ok(creado.Value!.First(x => x.Id == equipo.Id));
    }

    [HttpPut("equipos/{id:int}")]
    [RequierePermiso(PermisosConstantes.EquiposGestionar)]
    public async Task<ActionResult<EquipoDto>> ActualizarEquipo(int id, [FromBody] GuardarEquipoDto dto, CancellationToken ct)
    {
        var equipo = await db.Equipos
            .Include(e => e.Integrantes)
            .FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new DomainRuleException("Equipo no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(equipo.UnidadId);
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);

        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Equipos.AnyAsync(e => e.Codigo == codigo && e.Id != id, ct))
            throw new DomainRuleException("Ya existe otro equipo con ese código.");

        equipo.Codigo = codigo;
        equipo.Nombre = dto.Nombre.Trim();
        equipo.Descripcion = dto.Descripcion?.Trim();
        equipo.UnidadId = dto.UnidadId;
        equipo.DepartamentoId = dto.DepartamentoId;
        equipo.ColorHex = string.IsNullOrWhiteSpace(dto.ColorHex) ? "#2563EB" : dto.ColorHex;
        equipo.LiderUsuarioId = dto.LiderUsuarioId;
        equipo.Activo = dto.Activo;

        var actuales = await db.UsuarioEquipos.Where(ue => ue.EquipoId == id).ToListAsync(ct);
        db.UsuarioEquipos.RemoveRange(actuales);

        foreach (var usrId in dto.IntegrantesIds.Distinct())
        {
            db.UsuarioEquipos.Add(new UsuarioEquipo
            {
                EquipoId = equipo.Id,
                UsuarioId = usrId,
                RolEnEquipo = usrId == dto.LiderUsuarioId ? "Líder" : "Integrante"
            });
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organización",
            Accion = "ACTUALIZAR_EQUIPO",
            Entidad = "Equipo",
            EntidadId = equipo.Id.ToString(),
            UnidadId = equipo.UnidadId,
            Resumen = $"Actualización del equipo de trabajo '{equipo.Nombre}' ({equipo.Codigo})",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        var actualizado = await ListarEquipos(dto.UnidadId, ct);
        return Ok(actualizado.Value!.First(x => x.Id == equipo.Id));
    }

    [HttpDelete("equipos/{id:int}/integrantes/{usuarioId:int}")]
    [RequierePermiso(PermisosConstantes.EquiposGestionar)]
    public async Task<IActionResult> QuitarIntegranteEquipo(int id, int usuarioId, CancellationToken ct)
    {
        var equipo = await db.Equipos
            .Include(e => e.Integrantes)
            .FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new DomainRuleException("Equipo no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(equipo.UnidadId);

        var integrante = await db.UsuarioEquipos.FirstOrDefaultAsync(i => i.EquipoId == id && i.UsuarioId == usuarioId, ct)
            ?? throw new DomainRuleException("El usuario no forma parte de este equipo.", "NO_ENCONTRADO", 404);

        db.UsuarioEquipos.Remove(integrante);

        if (equipo.LiderUsuarioId == usuarioId)
        {
            equipo.LiderUsuarioId = null;
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organización",
            Accion = "QUITAR_INTEGRANTE_EQUIPO",
            Entidad = "Equipo",
            EntidadId = equipo.Id.ToString(),
            UnidadId = equipo.UnidadId,
            Resumen = $"Se quitó al usuario #{usuarioId} del equipo '{equipo.Nombre}' ({equipo.Codigo})",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { id, usuarioId, mensaje = "Integrante desvinculado exitosamente del equipo." });
    }

    [HttpDelete("equipos/{id:int}")]
    [RequierePermiso(PermisosConstantes.EquiposEliminar)]
    public async Task<IActionResult> EliminarEquipo(int id, CancellationToken ct)
    {
        var equipo = await db.Equipos
            .Include(e => e.Integrantes)
            .FirstOrDefaultAsync(e => e.Id == id, ct)
            ?? throw new DomainRuleException("Equipo no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(equipo.UnidadId);

        var usuarioEquipos = await db.UsuarioEquipos.Where(ue => ue.EquipoId == id).ToListAsync(ct);
        db.UsuarioEquipos.RemoveRange(usuarioEquipos);

        var politicasSla = await db.PoliticasSla.Where(ps => ps.EquipoEscalamientoId == id).ToListAsync(ct);
        foreach (var ps in politicasSla)
        {
            ps.EquipoEscalamientoId = null;
        }

        var actividades = await db.Actividades.Where(a => a.EquipoId == id).ToListAsync(ct);
        foreach (var act in actividades)
        {
            act.EquipoId = null;
        }

        var tickets = await db.Tickets.Where(t => t.EquipoAsignadoId == id).ToListAsync(ct);
        foreach (var tkt in tickets)
        {
            tkt.EquipoAsignadoId = null;
        }

        var proyectos = await db.Proyectos.Where(p => p.EquipoId == id).ToListAsync(ct);
        foreach (var proy in proyectos)
        {
            proy.EquipoId = null;
        }

        db.Equipos.Remove(equipo);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Organización",
            Accion = "ELIMINAR_EQUIPO",
            Entidad = "Equipo",
            EntidadId = equipo.Id.ToString(),
            UnidadId = equipo.UnidadId,
            Resumen = $"Eliminación del equipo de trabajo '{equipo.Nombre}' ({equipo.Codigo})",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { id, mensaje = "Equipo eliminado exitosamente." });
    }

    [HttpGet("catalogos")]
    public async Task<ActionResult<CatalogosOperativosDto>> ObtenerCatalogosOperativos(CancellationToken ct)
    {
        var prioridades = await db.Prioridades.AsNoTracking().OrderBy(p => p.Nivel)
            .Select(p => new CatalogoItemDto(p.Id, p.Codigo, p.Nombre, p.ColorHex, p.Nivel, false, false)).ToListAsync(ct);
        var estadosProyecto = await db.EstadosProyecto.AsNoTracking().OrderBy(e => e.Orden)
            .Select(e => new CatalogoItemDto(e.Id, e.Codigo, e.Nombre, e.ColorHex, e.Orden, e.EsFinal, false)).ToListAsync(ct);
        var estadosActividad = await db.EstadosActividad.AsNoTracking().OrderBy(e => e.Orden)
            .Select(e => new CatalogoItemDto(e.Id, e.Codigo, e.Nombre, e.ColorHex, e.Orden, e.EsFinal, false)).ToListAsync(ct);
        var estadosTicket = await db.EstadosTicket.AsNoTracking().OrderBy(e => e.Orden)
            .Select(e => new CatalogoItemDto(e.Id, e.Codigo, e.Nombre, e.ColorHex, e.Orden, e.EsFinal, e.PausaSla)).ToListAsync(ct);
        var tiposTicket = await db.TicketTipos.AsNoTracking().Where(t => t.Activa).OrderBy(t => t.Id)
            .Select(t => new CatalogoItemDto(t.Id, t.Codigo, t.Nombre, "#2563EB", t.Id, false, false)).ToListAsync(ct);
        var categoriasTicket = await db.TicketCategorias.AsNoTracking().Where(c => c.Activa).OrderBy(c => c.Id)
            .Select(c => new CatalogoItemDto(c.Id, c.Codigo, c.Nombre, "#0284C7", c.Id, false, false)).ToListAsync(ct);

        return Ok(new CatalogosOperativosDto(
            prioridades,
            estadosProyecto,
            estadosActividad,
            estadosTicket,
            tiposTicket,
            categoriasTicket));
    }
}

[ApiController]
[Route("api/mantenimiento")]
[Authorize]
public class MantenimientoController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost("reiniciar-operaciones")]
    public async Task<IActionResult> ReiniciarDatosOperativos(CancellationToken ct)
    {
        var esAdmin = currentUser.AccesoGlobalUnidades ||
                      currentUser.Permisos.Contains(PermisosConstantes.ConfiguracionGestionar) ||
                      User.IsInRole("SUPER_ADMIN") ||
                      User.IsInRole("ADMIN") ||
                      User.FindAll(System.Security.Claims.ClaimTypes.Role)
                          .Any(r => string.Equals(r.Value, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(r.Value, "ADMIN", StringComparison.OrdinalIgnoreCase));

        if (!esAdmin)
        {
            return Forbid();
        }

        // 1. Desvincular referencias circulares y foráneas
        var politicasSla = await db.PoliticasSla.Where(p => p.EquipoEscalamientoId != null).ToListAsync(ct);
        foreach (var ps in politicasSla)
        {
            ps.EquipoEscalamientoId = null;
        }

        var gruposChat = await db.ChatGrupos.Where(g => g.ActividadActivaId != null).ToListAsync(ct);
        foreach (var g in gruposChat)
        {
            g.ActividadActivaId = null;
        }

        var actividadesRef = await db.Actividades.Where(a => a.ChatGrupoId != null || a.ActividadPadreId != null).ToListAsync(ct);
        foreach (var a in actividadesRef)
        {
            a.ChatGrupoId = null;
            a.ActividadPadreId = null;
        }

        await db.SaveChangesAsync(ct);

        // 2. Limpiar chats WhatsApp
        var mensajes = await db.ChatMensajes.ToListAsync(ct);
        db.ChatMensajes.RemoveRange(mensajes);

        var miembrosChat = await db.ChatGrupoMiembros.ToListAsync(ct);
        db.ChatGrupoMiembros.RemoveRange(miembrosChat);

        var grupos = await db.ChatGrupos.ToListAsync(ct);
        db.ChatGrupos.RemoveRange(grupos);

        // 3. Limpiar tickets y trazabilidad
        var tktAct = await db.TicketActividades.ToListAsync(ct);
        db.TicketActividades.RemoveRange(tktAct);

        var tktHist = await db.TicketHistorial.ToListAsync(ct);
        db.TicketHistorial.RemoveRange(tktHist);

        var comentarios = await db.Comentarios.ToListAsync(ct);
        db.Comentarios.RemoveRange(comentarios);

        var adjuntos = await db.Adjuntos.ToListAsync(ct);
        db.Adjuntos.RemoveRange(adjuntos);

        var tickets = await db.Tickets.ToListAsync(ct);
        db.Tickets.RemoveRange(tickets);

        // 4. Limpiar actividades
        var chk = await db.ActividadChecklists.ToListAsync(ct);
        db.ActividadChecklists.RemoveRange(chk);

        var dep = await db.ActividadDependencias.ToListAsync(ct);
        db.ActividadDependencias.RemoveRange(dep);

        var asg = await db.ActividadAsignados.ToListAsync(ct);
        db.ActividadAsignados.RemoveRange(asg);

        var tmp = await db.ActividadTiempos.ToListAsync(ct);
        db.ActividadTiempos.RemoveRange(tmp);

        var actHist = await db.ActividadHistorial.ToListAsync(ct);
        db.ActividadHistorial.RemoveRange(actHist);

        var actividades = await db.Actividades.ToListAsync(ct);
        db.Actividades.RemoveRange(actividades);

        // 5. Limpiar proyectos
        var proyFases = await db.ProyectoFases.ToListAsync(ct);
        db.ProyectoFases.RemoveRange(proyFases);

        var proyIntegrantes = await db.ProyectoIntegrantes.ToListAsync(ct);
        db.ProyectoIntegrantes.RemoveRange(proyIntegrantes);

        var proyectos = await db.Proyectos.ToListAsync(ct);
        db.Proyectos.RemoveRange(proyectos);

        // 6. Limpiar equipos
        var usrEquipos = await db.UsuarioEquipos.ToListAsync(ct);
        db.UsuarioEquipos.RemoveRange(usrEquipos);

        var equipos = await db.Equipos.ToListAsync(ct);
        db.Equipos.RemoveRange(equipos);

        // 7. Evento de auditoría de reinicio
        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Mantenimiento",
            Accion = "REINICIO_OPERATIVO_TOTAL",
            Entidad = "Sistema",
            Resumen = $"Reinicio de datos operativos ejecutado por {currentUser.NombreCompleto ?? currentUser.NombreUsuario}. Se conservaron usuarios, roles, unidades y catálogos.",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            mensaje = "Datos operativos reiniciados exitosamente. La plataforma está lista para crear equipos, proyectos, actividades y tickets desde cero.",
            resumen = new
            {
                equiposEliminados = equipos.Count,
                proyectosEliminados = proyectos.Count,
                actividadesEliminadas = actividades.Count,
                ticketsEliminados = tickets.Count,
                gruposChatEliminados = grupos.Count,
                usuariosConservados = await db.Usuarios.CountAsync(ct)
            }
        });
    }

    [HttpPost("solo-corporativo")]
    public async Task<IActionResult> DejarSoloCorporativoGa(CancellationToken ct)
    {
        var esAdmin = currentUser.AccesoGlobalUnidades ||
                      currentUser.Permisos.Contains(PermisosConstantes.ConfiguracionGestionar) ||
                      User.IsInRole("SUPER_ADMIN") ||
                      User.IsInRole("ADMIN") ||
                      User.FindAll(System.Security.Claims.ClaimTypes.Role)
                          .Any(r => string.Equals(r.Value, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(r.Value, "ADMIN", StringComparison.OrdinalIgnoreCase));

        if (!esAdmin)
        {
            return Forbid();
        }

        // 1. Desvincular referencias circulares y foráneas
        var politicasSla = await db.PoliticasSla.ToListAsync(ct);
        foreach (var ps in politicasSla)
        {
            ps.EquipoEscalamientoId = null;
        }

        var gruposChat = await db.ChatGrupos.Where(g => g.ActividadActivaId != null).ToListAsync(ct);
        foreach (var g in gruposChat)
        {
            g.ActividadActivaId = null;
        }

        var actividadesRef = await db.Actividades.Where(a => a.ChatGrupoId != null || a.ActividadPadreId != null).ToListAsync(ct);
        foreach (var a in actividadesRef)
        {
            a.ChatGrupoId = null;
            a.ActividadPadreId = null;
        }

        await db.SaveChangesAsync(ct);

        // 2. Limpiar chats WhatsApp
        var mensajes = await db.ChatMensajes.ToListAsync(ct);
        db.ChatMensajes.RemoveRange(mensajes);

        var miembrosChat = await db.ChatGrupoMiembros.ToListAsync(ct);
        db.ChatGrupoMiembros.RemoveRange(miembrosChat);

        var grupos = await db.ChatGrupos.ToListAsync(ct);
        db.ChatGrupos.RemoveRange(grupos);

        // 3. Limpiar tickets
        var tktAct = await db.TicketActividades.ToListAsync(ct);
        db.TicketActividades.RemoveRange(tktAct);

        var tktHist = await db.TicketHistorial.ToListAsync(ct);
        db.TicketHistorial.RemoveRange(tktHist);

        var comentarios = await db.Comentarios.ToListAsync(ct);
        db.Comentarios.RemoveRange(comentarios);

        var adjuntos = await db.Adjuntos.ToListAsync(ct);
        db.Adjuntos.RemoveRange(adjuntos);

        var tickets = await db.Tickets.ToListAsync(ct);
        db.Tickets.RemoveRange(tickets);

        // 4. Limpiar actividades
        var chk = await db.ActividadChecklists.ToListAsync(ct);
        db.ActividadChecklists.RemoveRange(chk);

        var dep = await db.ActividadDependencias.ToListAsync(ct);
        db.ActividadDependencias.RemoveRange(dep);

        var asg = await db.ActividadAsignados.ToListAsync(ct);
        db.ActividadAsignados.RemoveRange(asg);

        var tmp = await db.ActividadTiempos.ToListAsync(ct);
        db.ActividadTiempos.RemoveRange(tmp);

        var actHist = await db.ActividadHistorial.ToListAsync(ct);
        db.ActividadHistorial.RemoveRange(actHist);

        var actividades = await db.Actividades.ToListAsync(ct);
        db.Actividades.RemoveRange(actividades);

        // 5. Limpiar proyectos
        var proyFases = await db.ProyectoFases.ToListAsync(ct);
        db.ProyectoFases.RemoveRange(proyFases);

        var proyIntegrantes = await db.ProyectoIntegrantes.ToListAsync(ct);
        db.ProyectoIntegrantes.RemoveRange(proyIntegrantes);

        var proyectos = await db.Proyectos.ToListAsync(ct);
        db.Proyectos.RemoveRange(proyectos);

        // 6. Limpiar equipos
        var usrEquipos = await db.UsuarioEquipos.ToListAsync(ct);
        db.UsuarioEquipos.RemoveRange(usrEquipos);

        var equipos = await db.Equipos.ToListAsync(ct);
        db.Equipos.RemoveRange(equipos);

        // 7. Desvincular departamentos de usuarios
        var usuarios = await db.Usuarios.ToListAsync(ct);
        foreach (var u in usuarios)
        {
            u.DepartamentoId = null;
        }

        // 8. Eliminar todos los departamentos
        var deptos = await db.Departamentos.ToListAsync(ct);
        db.Departamentos.RemoveRange(deptos);

        // 9. Asegurar Corporativo GA
        var corporativo = await db.Unidades.FirstOrDefaultAsync(u => u.Codigo == "CORP-GA" || u.Nombre.Contains("Corporativo"), ct);
        if (corporativo == null)
        {
            corporativo = await db.Unidades.FirstOrDefaultAsync(ct);
            if (corporativo != null)
            {
                corporativo.Codigo = "CORP-GA";
                corporativo.Nombre = "Corporativo GA";
                corporativo.Descripcion = "Sede corporativa central";
                corporativo.Activa = true;
            }
            else
            {
                corporativo = new Unidad
                {
                    Codigo = "CORP-GA",
                    Nombre = "Corporativo GA",
                    Descripcion = "Sede corporativa central",
                    ZonaHoraria = "America/Mexico_City",
                    Activa = true
                };
                db.Unidades.Add(corporativo);
                await db.SaveChangesAsync(ct);
            }
        }
        else
        {
            corporativo.Codigo = "CORP-GA";
            corporativo.Nombre = "Corporativo GA";
            corporativo.Activa = true;
        }

        await db.SaveChangesAsync(ct);

        // 10. Actualizar SLAs a Corporativo GA
        foreach (var ps in politicasSla)
        {
            ps.UnidadId = corporativo.Id;
        }

        // 11. Limpiar UsuarioUnidades distintas a Corporativo GA
        var uuOtras = await db.UsuarioUnidades.Where(uu => uu.UnidadId != corporativo.Id).ToListAsync(ct);
        db.UsuarioUnidades.RemoveRange(uuOtras);

        // 12. Asegurar que todos los usuarios tengan asignado Corporativo GA
        var uuExistentes = await db.UsuarioUnidades.Where(uu => uu.UnidadId == corporativo.Id).ToListAsync(ct);
        var usuariosConCorp = uuExistentes.Select(uu => uu.UsuarioId).ToHashSet();
        foreach (var u in usuarios)
        {
            if (!usuariosConCorp.Contains(u.Id))
            {
                db.UsuarioUnidades.Add(new UsuarioUnidad
                {
                    UsuarioId = u.Id,
                    UnidadId = corporativo.Id,
                    EsUnidadPrincipal = true
                });
            }
        }
        foreach (var uu in uuExistentes)
        {
            uu.EsUnidadPrincipal = true;
        }

        // 13. Eliminar todas las demás unidades
        var otrasUnidades = await db.Unidades.Where(u => u.Id != corporativo.Id).ToListAsync(ct);
        db.Unidades.RemoveRange(otrasUnidades);

        // 14. Auditoría
        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Mantenimiento",
            Accion = "PURGA_TOTAL_EXCEPTO_CORPORATIVO",
            Entidad = "Unidad",
            EntidadId = corporativo.Id.ToString(),
            UnidadId = corporativo.Id,
            Resumen = $"Purga completa de departamentos y unidades secundarias realizada por {currentUser.NombreCompleto ?? currentUser.NombreUsuario}. Única unidad activa: 'Corporativo GA'.",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            mensaje = "Limpieza completada exitosamente. Se eliminaron datos operativos, todos los departamentos y unidades secundarias. Solo permanece 'Corporativo GA'.",
            resumen = new
            {
                unidadConservada = corporativo.Nombre,
                unidadesEliminadas = otrasUnidades.Count,
                departamentosEliminados = deptos.Count,
                usuariosConservados = usuarios.Count
            }
        });
    }
}
