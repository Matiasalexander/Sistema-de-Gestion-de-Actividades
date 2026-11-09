using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Infrastructure.Persistence;

namespace SistemaGestionGA.API.Hubs;

[Authorize]
public class NotificacionesHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
        }
        await base.OnConnectedAsync();
    }
}

public class RealtimeNotificationService(
    ApplicationDbContext db,
    IHubContext<NotificacionesHub> hubContext) : IRealtimeNotificationService
{
    public async Task EnviarNotificacionAsync(
        int usuarioDestinoId,
        string tipoEvento,
        string titulo,
        string mensaje,
        string? urlDestino = null,
        CancellationToken ct = default)
    {
        // Control de duplicados recientes (mismo usuario, título y evento en los últimos 2 minutos)
        var limiteDuplicado = DateTime.UtcNow.AddMinutes(-2);
        var existeReciente = await db.Notificaciones.AnyAsync(n =>
            n.UsuarioDestinoId == usuarioDestinoId &&
            n.TipoEvento == tipoEvento &&
            n.Titulo == titulo &&
            n.FechaCreacionUtc >= limiteDuplicado, ct);

        if (existeReciente)
            return;

        var notificacion = new Notificacion
        {
            UsuarioDestinoId = usuarioDestinoId,
            TipoEvento = tipoEvento,
            Titulo = titulo,
            Mensaje = mensaje,
            UrlDestino = urlDestino,
            Leida = false,
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.Notificaciones.Add(notificacion);
        await db.SaveChangesAsync(ct);

        var dto = new NotificacionDto(
            notificacion.Id,
            notificacion.TipoEvento,
            notificacion.Titulo,
            notificacion.Mensaje,
            notificacion.UrlDestino,
            notificacion.Leida,
            notificacion.FechaCreacionUtc);

        await hubContext.Clients.Group($"user:{usuarioDestinoId}")
            .SendAsync("NuevaNotificacion", dto, ct);
    }

    public async Task EvaluarAutomatizacionesAsync(
        string eventoDisparador,
        string resumenEntidad,
        int? usuarioDestinoId,
        string? urlDestino = null,
        CancellationToken ct = default)
    {
        var reglas = await db.ReglasAutomatizacion
            .Where(r => r.Activa && r.EventoDisparador == eventoDisparador)
            .ToListAsync(ct);

        foreach (var regla in reglas)
        {
            try
            {
                regla.TotalEjecuciones++;
                regla.UltimaEjecucionUtc = DateTime.UtcNow;

                if (usuarioDestinoId.HasValue)
                {
                    await EnviarNotificacionAsync(
                        usuarioDestinoId.Value,
                        eventoDisparador,
                        $"[Automatización] {regla.Nombre}",
                        resumenEntidad,
                        urlDestino,
                        ct);
                }
            }
            catch
            {
                regla.TotalFallos++;
            }
        }

        if (reglas.Count > 0)
        {
            await db.SaveChangesAsync(ct);
        }
    }
}
