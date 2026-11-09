using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Rules;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DomainRuleException ex)
        {
            context.Response.StatusCode = ex.StatusCode;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize(new
            {
                error = ex.Message,
                code = ex.Code,
                status = ex.StatusCode,
                timestampUtc = DateTime.UtcNow
            });
            await context.Response.WriteAsync(payload);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error no controlado en la petición {Method} {Path}", context.Request.Method, context.Request.Path);
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var payload = JsonSerializer.Serialize(new
            {
                error = "Ocurrió un error interno al procesar la solicitud. El evento ha sido registrado.",
                code = "ERROR_INTERNO",
                status = 500,
                timestampUtc = DateTime.UtcNow
            });
            await context.Response.WriteAsync(payload);
        }
    }
}

public class SlaMonitorJob(
    ApplicationDbContext db,
    IRealtimeNotificationService notificationService,
    ILogger<SlaMonitorJob> logger)
{
    public async Task EjecutarEvaluacionSlaYActividadesAsync()
    {
        var ahora = DateTime.UtcNow;

        var ticketsAbiertos = await db.Tickets
            .Include(t => t.PoliticaSla)
            .Include(t => t.EstadoTicket)
            .Where(t => t.EstadoTicket != null && !t.EstadoTicket.EsFinal)
            .ToListAsync();

        foreach (var t in ticketsAbiertos)
        {
            var nuevoEstadoSla = ReglasNegocioService.EvaluarEstadoSla(
                t.PoliticaSla,
                t.FechaCreacionUtc,
                t.FechaLimiteResolucionUtc,
                t.FechaResolucionUtc,
                t.MinutosPausadoSla,
                ahora);

            if (nuevoEstadoSla != t.EstadoSla)
            {
                t.EstadoSla = nuevoEstadoSla;
                if (nuevoEstadoSla == "Incumplido" && !t.Escalado)
                {
                    t.Escalado = true;
                    if (t.ResponsableId.HasValue)
                    {
                        await notificationService.EvaluarAutomatizacionesAsync(
                            "SlaAlerta",
                            $"El ticket {t.Folio} ({t.Titulo}) ha incumplido su acuerdo SLA.",
                            t.ResponsableId.Value,
                            "/tickets");
                    }
                }
            }
        }

        await db.SaveChangesAsync();
        logger.LogInformation("Evaluación programada de SLA completada a las {FechaUtc}. Tickets evaluados: {Total}", ahora, ticketsAbiertos.Count);
    }
}
