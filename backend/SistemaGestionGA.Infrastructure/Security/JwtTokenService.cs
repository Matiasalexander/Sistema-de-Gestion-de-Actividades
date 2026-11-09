using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SistemaGestionGA.Application.DTOs;

namespace SistemaGestionGA.Infrastructure.Security;

public class JwtTokenService(IConfiguration configuration)
{
    public (string Token, DateTime ExpiraEnUtc) GenerarAccessToken(UsuarioAutenticadoDto usuario)
    {
        var secret = configuration["Jwt:Secret"] ?? "ClaveSecretaCorporativaSistemaGestionGA_2026_SeguridadMaxima!";
        var issuer = configuration["Jwt:Issuer"] ?? "SistemaGestionGA.API";
        var audience = configuration["Jwt:Audience"] ?? "SistemaGestionGA.Web";
        var minutosExpiracion = int.TryParse(configuration["Jwt:AccessTokenExpirationMinutes"], out var m) ? m : 60;

        var expiraEnUtc = DateTime.UtcNow.AddMinutes(minutosExpiracion);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.NombreUsuario),
            new(ClaimTypes.Email, usuario.Email),
            new("nombre_completo", usuario.NombreCompleto),
            new("acceso_global", usuario.AccesoGlobalUnidades ? "true" : "false")
        };

        foreach (var unidad in usuario.Unidades)
        {
            claims.Add(new Claim("unidad_id", unidad.Id.ToString()));
        }

        foreach (var rol in usuario.Roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, rol));
        }

        foreach (var permiso in usuario.Permisos)
        {
            claims.Add(new Claim("permiso", permiso));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiraEnUtc,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(jwt), expiraEnUtc);
    }

    public string GenerarRefreshTokenPlano()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public static string CalcularHashSha256(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes);
    }
}
