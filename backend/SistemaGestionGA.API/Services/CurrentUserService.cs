using System.Security.Claims;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? User => httpContextAccessor.HttpContext?.User;

    public int? UsuarioId
    {
        get
        {
            var val = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? User?.FindFirstValue("sub");
            return int.TryParse(val, out var id) ? id : null;
        }
    }

    public string? NombreUsuario => User?.Identity?.Name;

    public string? NombreCompleto => User?.FindFirstValue("nombre_completo") ?? NombreUsuario;

    public string? Email => User?.FindFirstValue(ClaimTypes.Email);

    public bool Autenticado => User?.Identity?.IsAuthenticated == true;

    public bool AccesoGlobalUnidades =>
        string.Equals(User?.FindFirstValue("acceso_global"), "true", StringComparison.OrdinalIgnoreCase);

    public IReadOnlySet<int> UnidadesAutorizadas
    {
        get
        {
            if (User == null)
                return new HashSet<int>();

            return User.FindAll("unidad_id")
                .Select(c => int.TryParse(c.Value, out var id) ? id : -1)
                .Where(id => id > 0)
                .ToHashSet();
        }
    }

    public IReadOnlySet<string> Permisos
    {
        get
        {
            if (User == null)
                return new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            return User.FindAll("permiso")
                .Select(c => c.Value)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
        }
    }

    public string? IpAddress =>
        httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";

    public string? UserAgent =>
        httpContextAccessor.HttpContext?.Request?.Headers.UserAgent.ToString();

    public bool TienePermiso(string permiso)
    {
        if (!Autenticado)
            return false;

        var esAdmin = (User != null && (
            User.IsInRole("SUPER_ADMIN") ||
            User.IsInRole("ADMIN") ||
            User.FindAll(ClaimTypes.Role).Any(r => string.Equals(r.Value, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                                                   string.Equals(r.Value, "ADMIN", StringComparison.OrdinalIgnoreCase)))) ||
            AccesoGlobalUnidades;

        if (esAdmin)
            return true;

        return Permisos.Contains(permiso);
    }

    public bool TieneAlcanceUnidad(int unidadId)
    {
        if (!Autenticado)
            return false;

        if (AccesoGlobalUnidades)
            return true;

        return UnidadesAutorizadas.Contains(unidadId);
    }

    public void ExigirAlcanceUnidad(int unidadId)
    {
        if (!TieneAlcanceUnidad(unidadId))
        {
            throw new ForbiddenScopeException(
                $"Acceso denegado: Su perfil no tiene alcance autorizado sobre la Unidad de Negocio #{unidadId}.");
        }
    }
}
