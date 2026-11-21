using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace SistemaGestionGA.API.Services;

public interface IPasswordRecoveryMailer
{
    Task EnviarAsync(string correo, string usuario, string enlace, CancellationToken ct);
}

public sealed class PasswordRecoveryMailer(IConfiguration config) : IPasswordRecoveryMailer
{
    public async Task EnviarAsync(string correo, string usuario, string enlace, CancellationToken ct)
    {
        var host = config["Smtp:Host"];
        var from = config["Smtp:From"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            throw new InvalidOperationException("Configurar Smtp:Host y Smtp:From antes de habilitar recuperación.");

        using var mail = new MailMessage
        {
            From = new MailAddress(from),
            Subject = "Recuperación de acceso - Sistema de Gestión GA",
            Body = $"Hola. Tu nombre de usuario es: {usuario}\n\n" +
                   $"Para establecer una contraseña nueva, abre este enlace (válido 15 minutos):\n{enlace}\n\n" +
                   "Si no solicitaste este cambio, ignora el correo.\n",
            IsBodyHtml = false
        };
        mail.To.Add(new MailAddress(correo));
        using var client = new SmtpClient(host, config.GetValue("Smtp:Port", 587))
        {
            EnableSsl = config.GetValue("Smtp:EnableSsl", true),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
        };
        var user = config["Smtp:Username"];
        if (!string.IsNullOrWhiteSpace(user))
            client.Credentials = new NetworkCredential(user, config["Smtp:Password"]);
        // SmtpClient.SendMailAsync no acepta CancellationToken en esta sobrecarga.
        ct.ThrowIfCancellationRequested();
        await client.SendMailAsync(mail);
    }
}
