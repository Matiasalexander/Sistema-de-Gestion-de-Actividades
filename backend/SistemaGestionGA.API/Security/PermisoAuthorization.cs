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
        var tienePermiso = context.User.FindAll("permiso")
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
