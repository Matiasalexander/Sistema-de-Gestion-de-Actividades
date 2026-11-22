using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace SistemaGestionGA.API.Security;

public class PermisoRequirement(string permiso) : IAuthorizationRequirement
{
    public string Permiso { get; } = permiso;
}

public class PermisoAuthorizationHandler : AuthorizationHandler<PermisoRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermisoRequirement requirement)
    {
        var esAdmin = context.User.IsInRole("SUPER_ADMIN") ||
                      context.User.IsInRole("ADMIN") ||
                      context.User.FindAll(System.Security.Claims.ClaimTypes.Role)
                          .Any(r => string.Equals(r.Value, "SUPER_ADMIN", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(r.Value, "ADMIN", StringComparison.OrdinalIgnoreCase)) ||
                      string.Equals(context.User.FindFirst("acceso_global")?.Value, "true", StringComparison.OrdinalIgnoreCase) ||
                      string.Equals(context.User.FindFirst("accesoGlobalUnidades")?.Value, "true", StringComparison.OrdinalIgnoreCase);

        var tienePermiso = esAdmin || context.User.FindAll("permiso")
            .Any(c => string.Equals(c.Value, requirement.Permiso, StringComparison.OrdinalIgnoreCase));

        if (tienePermiso)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

public class PermisoPolicyProvider(IOptions<AuthorizationOptions> options) : DefaultAuthorizationPolicyProvider(options)
{
    public const string PolicyPrefix = "PERMISO:";

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (policyName.StartsWith(PolicyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var codigoPermiso = policyName[PolicyPrefix.Length..];
            var policy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .AddRequirements(new PermisoRequirement(codigoPermiso))
                .Build();
            return policy;
        }

        return await base.GetPolicyAsync(policyName);
    }
}

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequierePermisoAttribute : AuthorizeAttribute
{
    public RequierePermisoAttribute(string codigoPermiso)
    {
        Policy = $"{PermisoPolicyProvider.PolicyPrefix}{codigoPermiso}";
    }
}
