using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.API.Security;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Domain.Rules;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Shared.Constants;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
public class TicketsController(
    ApplicationDbContext db,
    ICurrentUserService currentUser,
    IRealtimeNotificationService notificationService) : ControllerBase
{
    [HttpGet]
    [RequierePermiso(PermisosConstantes.TicketsVer)]
    public async Task<ActionResult<IReadOnlyList<TicketDto>>> ListarTickets(
        [FromQuery] int? unidadId,
        [FromQuery] int? estadoId,
        [FromQuery] int? prioridadId,
        [FromQuery] int? responsableId,
        [FromQuery] int? solicitanteId,
        [FromQuery] string? estadoSla,
        [FromQuery] string? busqueda,
        CancellationToken ct)
    {
        var query = ConstruirQueryTickets();

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(t => t.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(t => unidades.Contains(t.UnidadId));
        }

        if (estadoId.HasValue)
            query = query.Where(t => t.EstadoTicketId == estadoId.Value);

        if (prioridadId.HasValue)
            query = query.Where(t => t.PrioridadId == prioridadId.Value);

        if (responsableId.HasValue)
            query = query.Where(t => t.ResponsableId == responsableId.Value);

        if (solicitanteId.HasValue)
            query = query.Where(t => t.SolicitanteId == solicitanteId.Value);

        if (!string.IsNullOrWhiteSpace(estadoSla))
            query = query.Where(t => t.EstadoSla == estadoSla);

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(t =>
                t.Folio.ToLower().Contains(b) ||
                t.Titulo.ToLower().Contains(b) ||
                t.Descripcion.ToLower().Contains(b));
        }

        var tickets = await query.OrderByDescending(t => t.FechaCreacionUtc).ToListAsync(ct);
        var puedeVerInternos = currentUser.TienePermiso(PermisosConstantes.TicketsAtender);
        return Ok(tickets.Select(t => MapearTicketDto(t, puedeVerInternos)).ToList());
    }

    [HttpGet("{id:int}")]
    [RequierePermiso(PermisosConstantes.TicketsVer)]
    public async Task<ActionResult<TicketDto>> ObtenerPorId(int id, CancellationToken ct)
    {
        var t = await ConstruirQueryTickets().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new DomainRuleException("Ticket no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(t.UnidadId);
        var puedeVerInternos = currentUser.TienePermiso(PermisosConstantes.TicketsAtender);
        return Ok(MapearTicketDto(t, puedeVerInternos));
    }

    [HttpPost]
    [RequierePermiso(PermisosConstantes.TicketsCrear)]
    public async Task<ActionResult<TicketDto>> CrearTicket([FromBody] CrearTicketDto dto, CancellationToken ct)
    {
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);
        var solicitanteId = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión no válida.", "NO_AUTENTICADO", 401);

        var anio = DateTime.UtcNow.Year;
        var consecutivo = await db.Tickets.CountAsync(ct) + 1;
        var folio = $"TKT-{anio}-{consecutivo:D4}";
        while (await db.Tickets.AnyAsync(t => t.Folio == folio, ct))
        {
            consecutivo++;
            folio = $"TKT-{anio}-{consecutivo:D4}";
        }

        var estadoInicialCodigo = dto.ResponsableId.HasValue ? "ASIGNADO" : "NUEVO";
        var estadoInicial = await db.EstadosTicket.FirstAsync(e => e.Codigo == estadoInicialCodigo, ct);

        // Seleccionar política SLA aplicable (más específica por unidad/tipo/categoría o general por prioridad)
        var politicas = await db.PoliticasSla
            .Include(p => p.CalendarioSla).ThenInclude(c => c!.DiasFestivos)
            .Where(p => p.Activa && p.PrioridadId == dto.PrioridadId &&
                        (p.UnidadId == null || p.UnidadId == dto.UnidadId) &&
                        (p.TicketTipoId == null || p.TicketTipoId == dto.TicketTipoId) &&
                        (p.TicketCategoriaId == null || p.TicketCategoriaId == dto.TicketCategoriaId))
            .OrderByDescending(p => (p.UnidadId.HasValue ? 4 : 0) + (p.TicketTipoId.HasValue ? 2 : 0) + (p.TicketCategoriaId.HasValue ? 1 : 0))
            .ToListAsync(ct);

        var politicaSla = politicas.FirstOrDefault();
        var ahora = DateTime.UtcNow;
        DateTime? limiteRespuesta = null;
        DateTime? limiteResolucion = null;

        if (politicaSla != null)
        {
            var festivos = politicaSla.CalendarioSla?.DiasFestivos.Select(f => f.Fecha).ToHashSet();
            limiteRespuesta = ReglasNegocioService.CalcularFechaLimiteSla(ahora, politicaSla.TiempoPrimeraRespuestaMinutos, politicaSla.CalendarioSla, festivos);
            limiteResolucion = ReglasNegocioService.CalcularFechaLimiteSla(ahora, politicaSla.TiempoResolucionMinutos, politicaSla.CalendarioSla, festivos);
        }

        var ticket = new Ticket
        {
            Folio = folio,
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            TicketTipoId = dto.TicketTipoId,
            TicketCategoriaId = dto.TicketCategoriaId,
            PrioridadId = dto.PrioridadId,
            EstadoTicketId = estadoInicial.Id,
            SolicitanteId = solicitanteId,
            ResponsableId = dto.ResponsableId,
            EquipoAsignadoId = dto.EquipoAsignadoId,
            UnidadId = dto.UnidadId,
            DepartamentoId = dto.DepartamentoId,
            PoliticaSlaId = politicaSla?.Id,
            FechaCreacionUtc = ahora,
            FechaLimitePrimeraRespuestaUtc = limiteRespuesta,
            FechaLimiteResolucionUtc = limiteResolucion,
            EstadoSla = politicaSla != null ? "EnTiempo" : "SinPolitica"
        };

        db.Tickets.Add(ticket);
        await db.SaveChangesAsync(ct);

        db.TicketHistorial.Add(new TicketHistorial
        {
            TicketId = ticket.Id,
            UsuarioId = solicitanteId,
            Accion = "Creación",
            EstadoNuevo = estadoInicial.Nombre,
            Detalle = $"Ticket {ticket.Folio} levantado con prioridad #{dto.PrioridadId}."
        });

        await db.SaveChangesAsync(ct);

        if (ticket.ResponsableId.HasValue)
        {
            await notificationService.EvaluarAutomatizacionesAsync(
                "TicketAsignado",
                $"Se te ha asignado el ticket {ticket.Folio}: {ticket.Titulo}",
                ticket.ResponsableId.Value,
                "/tickets",
                ct);
        }

        return await ObtenerPorId(ticket.Id, ct);
    }

    [HttpPost("{id:int}/asignar")]
    [RequierePermiso(PermisosConstantes.TicketsAsignar)]
    public async Task<ActionResult<TicketDto>> AsignarTicket(int id, [FromBody] AsignarTicketDto dto, CancellationToken ct)
    {
        var ticket = await db.Tickets
            .Include(t => t.EstadoTicket)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainRuleException("Ticket no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(ticket.UnidadId);

        var estadoAnterior = ticket.EstadoTicket?.Nombre ?? "Nuevo";
        ticket.ResponsableId = dto.ResponsableId;
        ticket.EquipoAsignadoId = dto.EquipoAsignadoId;
        ticket.FechaModificacionUtc = DateTime.UtcNow;

        if (ticket.EstadoTicket?.Codigo is "NUEVO" or "ABIERTO")
        {
            var estAsignado = await db.EstadosTicket.FirstAsync(e => e.Codigo == "ASIGNADO", ct);
            ticket.EstadoTicketId = estAsignado.Id;
        }

        db.TicketHistorial.Add(new TicketHistorial
        {
            TicketId = ticket.Id,
            UsuarioId = currentUser.UsuarioId,
            Accion = "Asignación",
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "Asignado",
            Detalle = dto.NotaAsignacion ?? $"Reasignación de ticket al especialista #{dto.ResponsableId}."
        });

        await db.SaveChangesAsync(ct);

        if (dto.ResponsableId.HasValue)
        {
            await notificationService.EvaluarAutomatizacionesAsync(
                "TicketAsignado",
                $"Se te ha asignado el ticket {ticket.Folio}: {ticket.Titulo}",
                dto.ResponsableId.Value,
                "/tickets",
                ct);
        }

        return await ObtenerPorId(ticket.Id, ct);
    }

    [HttpPost("{id:int}/atender")]
    [RequierePermiso(PermisosConstantes.TicketsAtender)]
    public async Task<ActionResult<TicketDto>> TomarEnAtencion(int id, [FromBody] AccionEstadoTicketDto dto, CancellationToken ct)
    {
        return await TransicionarEstadoTicketAsync(id, "EN_ATENCION", "Tomar en atención", dto, ct);
    }

    [HttpPost("{id:int}/espera")]
    [RequierePermiso(PermisosConstantes.TicketsAtender)]
    public async Task<ActionResult<TicketDto>> PonerEnEspera(int id, [FromBody] AccionEstadoTicketDto dto, CancellationToken ct)
    {
        return await TransicionarEstadoTicketAsync(id, "EN_ESPERA", "Pausa por espera", dto, ct);
    }

    [HttpPost("{id:int}/resolver")]
    [RequierePermiso(PermisosConstantes.TicketsResolver)]
    public async Task<ActionResult<TicketDto>> ResolverTicket(int id, [FromBody] AccionEstadoTicketDto dto, CancellationToken ct)
    {
        return await TransicionarEstadoTicketAsync(id, "RESUELTO", "Resolución técnica", dto, ct);
    }

    [HttpPost("{id:int}/cerrar")]
    [RequierePermiso(PermisosConstantes.TicketsCerrar)]
    public async Task<ActionResult<TicketDto>> CerrarTicket(int id, [FromBody] AccionEstadoTicketDto dto, CancellationToken ct)
    {
        return await TransicionarEstadoTicketAsync(id, "CERRADO", "Cierre definitivo", dto, ct);
    }

    [HttpPost("{id:int}/reabrir")]
    [RequierePermiso(PermisosConstantes.TicketsReabrir)]
    public async Task<ActionResult<TicketDto>> ReabrirTicket(int id, [FromBody] AccionEstadoTicketDto dto, CancellationToken ct)
    {
        return await TransicionarEstadoTicketAsync(id, "REABIERTO", "Reapertura de ticket", dto, ct);
    }

    [HttpPost("{id:int}/vincular-actividad")]
    [RequierePermiso(PermisosConstantes.TicketsAtender)]
    public async Task<ActionResult<TicketDto>> VincularActividadTecnica(int id, [FromBody] VincularActividadTicketDto dto, CancellationToken ct)
    {
        var ticket = await db.Tickets.FindAsync([id], ct)
            ?? throw new DomainRuleException("Ticket no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(ticket.UnidadId);

        int actividadId;
        if (dto.ActividadExistenteId.HasValue)
        {
            var actExistente = await db.Actividades.FindAsync([dto.ActividadExistenteId.Value], ct)
                ?? throw new DomainRuleException("La actividad especificada no existe.", "NO_ENCONTRADO", 404);
            currentUser.ExigirAlcanceUnidad(actExistente.UnidadId);
            actividadId = actExistente.Id;
        }
        else if (dto.NuevaActividad != null)
        {
            var consecutivo = await db.Actividades.CountAsync(ct) + 1;
            var codigo = $"ACT-{consecutivo:D4}";
            while (await db.Actividades.AnyAsync(a => a.Codigo == codigo, ct))
            {
                consecutivo++;
                codigo = $"ACT-{consecutivo:D4}";
            }

            var nueva = new Actividad
            {
                Codigo = codigo,
                ProyectoId = dto.NuevaActividad.ProyectoId,
                UnidadId = ticket.UnidadId,
                DepartamentoId = ticket.DepartamentoId,
                EquipoId = ticket.EquipoAsignadoId,
                Titulo = dto.NuevaActividad.Titulo.Trim(),
                Descripcion = dto.NuevaActividad.Descripcion ?? $"Actividad técnica derivada del ticket {ticket.Folio}",
                PrioridadId = dto.NuevaActividad.PrioridadId,
                EstadoActividadId = dto.NuevaActividad.EstadoActividadId,
                FechaInicio = dto.NuevaActividad.FechaInicio ?? DateOnly.FromDateTime(DateTime.UtcNow),
                FechaVencimiento = dto.NuevaActividad.FechaVencimiento ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
                TiempoEstimadoMinutos = Math.Max(30, dto.NuevaActividad.TiempoEstimadoMinutos),
                CreadoPorId = currentUser.UsuarioId
            };
            db.Actividades.Add(nueva);
            await db.SaveChangesAsync(ct);

            foreach (var respId in dto.NuevaActividad.ResponsablesIds.Distinct())
            {
                db.ActividadAsignados.Add(new ActividadAsignado
                {
                    ActividadId = nueva.Id,
                    UsuarioId = respId,
                    EsPrincipal = true,
                    AsignadoPorId = currentUser.UsuarioId
                });
            }
            await db.SaveChangesAsync(ct);
            actividadId = nueva.Id;
        }
        else
        {
            throw new DomainRuleException("Debe indicar una actividad existente o los datos para generar una nueva actividad técnica.");
        }

        if (!await db.TicketActividades.AnyAsync(ta => ta.TicketId == id && ta.ActividadId == actividadId, ct))
        {
            db.TicketActividades.Add(new TicketActividad
            {
                TicketId = id,
                ActividadId = actividadId
            });

            db.TicketHistorial.Add(new TicketHistorial
            {
                TicketId = id,
                UsuarioId = currentUser.UsuarioId,
                Accion = "Vinculación Actividad",
                Detalle = $"Se vinculó la actividad técnica #{actividadId} al ticket {ticket.Folio}."
            });

            await db.SaveChangesAsync(ct);
        }

        return await ObtenerPorId(id, ct);
    }

    private async Task<ActionResult<TicketDto>> TransicionarEstadoTicketAsync(
        int id,
        string codigoEstadoDestino,
        string accionNombre,
        AccionEstadoTicketDto dto,
        CancellationToken ct)
    {
        var ticket = await db.Tickets
            .Include(t => t.EstadoTicket)
            .Include(t => t.PoliticaSla)
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new DomainRuleException("Ticket no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(ticket.UnidadId);

        var estadoActual = ticket.EstadoTicket!;
        var estadoNuevo = await db.EstadosTicket.FirstOrDefaultAsync(e => e.Codigo == codigoEstadoDestino, ct)
            ?? throw new DomainRuleException($"El estado destino '{codigoEstadoDestino}' no existe.");

        ReglasNegocioService.ValidarTransicionTicket(estadoActual.Codigo, estadoNuevo.Codigo);

        var ahora = DateTime.UtcNow;

        // Manejo de pausas SLA (cuando entra o sale de estado con PausaSla)
        if (!estadoActual.PausaSla && estadoNuevo.PausaSla)
        {
            ticket.FechaUltimoInicioPausaUtc = ahora;
        }
        else if (estadoActual.PausaSla && !estadoNuevo.PausaSla && ticket.FechaUltimoInicioPausaUtc.HasValue)
        {
            var minPausa = (int)Math.Max(0, (ahora - ticket.FechaUltimoInicioPausaUtc.Value).TotalMinutes);
            ticket.MinutosPausadoSla += minPausa;
            ticket.FechaUltimoInicioPausaUtc = null;
        }

        if (ticket.FechaPrimeraRespuestaUtc == null &&
            codigoEstadoDestino is "EN_ATENCION" or "RESUELTO")
        {
            ticket.FechaPrimeraRespuestaUtc = ahora;
        }

        if (codigoEstadoDestino == "RESUELTO")
        {
            ticket.FechaResolucionUtc = ahora;
        }
        else if (codigoEstadoDestino == "CERRADO")
        {
            ticket.FechaCierreUtc = ahora;
        }
        else if (codigoEstadoDestino == "REABIERTO")
        {
            ticket.FechaResolucionUtc = null;
            ticket.FechaCierreUtc = null;
        }

        ticket.EstadoTicketId = estadoNuevo.Id;
        ticket.FechaModificacionUtc = ahora;
        ticket.EstadoSla = ReglasNegocioService.EvaluarEstadoSla(
            ticket.PoliticaSla,
            ticket.FechaCreacionUtc,
            ticket.FechaLimiteResolucionUtc,
            ticket.FechaResolucionUtc,
            ticket.MinutosPausadoSla,
            ahora);

        db.TicketHistorial.Add(new TicketHistorial
        {
            TicketId = ticket.Id,
            UsuarioId = currentUser.UsuarioId,
            Accion = accionNombre,
            EstadoAnterior = estadoActual.Nombre,
            EstadoNuevo = estadoNuevo.Nombre,
            Detalle = dto.Comentario ?? $"{accionNombre}: transición a {estadoNuevo.Nombre}."
        });

        if (!string.IsNullOrWhiteSpace(dto.Comentario))
        {
            db.Comentarios.Add(new Comentario
            {
                TicketId = ticket.Id,
                AutorId = currentUser.UsuarioId ?? ticket.SolicitanteId,
                Contenido = dto.Comentario.Trim(),
                EsInterno = dto.EsInterno
            });
        }

        await db.SaveChangesAsync(ct);

        if (codigoEstadoDestino is "RESUELTO" or "REABIERTO")
        {
            await notificationService.EnviarNotificacionAsync(
                ticket.SolicitanteId,
                $"Ticket{codigoEstadoDestino}",
                $"Ticket {ticket.Folio}: {estadoNuevo.Nombre}",
                dto.Comentario ?? $"El estado del ticket {ticket.Folio} cambió a {estadoNuevo.Nombre}.",
                "/tickets",
                ct);
        }

        return await ObtenerPorId(ticket.Id, ct);
    }

    private IQueryable<Ticket> ConstruirQueryTickets() =>
        db.Tickets
            .AsNoTracking()
            .Include(t => t.TicketTipo)
            .Include(t => t.TicketCategoria)
            .Include(t => t.Prioridad)
            .Include(t => t.EstadoTicket)
            .Include(t => t.Solicitante)
            .Include(t => t.Responsable)
            .Include(t => t.EquipoAsignado)
            .Include(t => t.Unidad)
            .Include(t => t.Departamento)
            .Include(t => t.PoliticaSla)
            .Include(t => t.TicketActividades).ThenInclude(ta => ta.Actividad!).ThenInclude(a => a.EstadoActividad)
            .Include(t => t.Historial).ThenInclude(h => h.Usuario)
            .Include(t => t.Comentarios).ThenInclude(c => c.Autor)
            .Include(t => t.Adjuntos).ThenInclude(a => a.SubidoPor);

    private static TicketDto MapearTicketDto(Ticket t, bool incluirComentariosInternos)
    {
        var estadoSlaActual = ReglasNegocioService.EvaluarEstadoSla(
            t.PoliticaSla,
            t.FechaCreacionUtc,
            t.FechaLimiteResolucionUtc,
            t.FechaResolucionUtc,
            t.MinutosPausadoSla,
            DateTime.UtcNow);

        var comentarios = t.Comentarios
            .Where(c => incluirComentariosInternos || !c.EsInterno)
            .OrderBy(c => c.FechaCreacionUtc)
            .Select(c => new ComentarioDto(
                c.Id, c.ProyectoId, c.ActividadId, c.TicketId, c.AutorId,
                c.Autor?.NombreCompleto ?? "", c.Contenido, c.MencionesJson, c.EsInterno, c.FechaCreacionUtc))
            .ToList();

        return new TicketDto(
            t.Id,
            t.Folio,
            t.Titulo,
            t.Descripcion,
            t.TicketTipoId,
            t.TicketTipo?.Nombre ?? "",
            t.TicketCategoriaId,
            t.TicketCategoria?.Nombre ?? "",
            t.PrioridadId,
            t.Prioridad?.Codigo ?? "",
            t.Prioridad?.Nombre ?? "",
            t.Prioridad?.ColorHex ?? "#2563EB",
            t.EstadoTicketId,
            t.EstadoTicket?.Codigo ?? "",
            t.EstadoTicket?.Nombre ?? "",
            t.EstadoTicket?.ColorHex ?? "#64748B",
            t.SolicitanteId,
            t.Solicitante?.NombreCompleto ?? "",
            t.ResponsableId,
            t.Responsable?.NombreCompleto,
            t.EquipoAsignadoId,
            t.EquipoAsignado?.Nombre,
            t.UnidadId,
            t.Unidad?.Nombre ?? "",
            t.DepartamentoId,
            t.Departamento?.Nombre,
            t.PoliticaSlaId,
            t.PoliticaSla?.Nombre,
            t.FechaCreacionUtc,
            t.FechaPrimeraRespuestaUtc,
            t.FechaResolucionUtc,
            t.FechaCierreUtc,
            t.FechaLimitePrimeraRespuestaUtc,
            t.FechaLimiteResolucionUtc,
            t.MinutosPausadoSla,
            estadoSlaActual,
            t.Escalado,
            t.TicketActividades.Where(ta => ta.Actividad != null).Select(ta => new TicketActividadResumenDto(
                ta.ActividadId,
                ta.Actividad!.Codigo,
                ta.Actividad.Titulo,
                ta.Actividad.EstadoActividad?.Nombre ?? "",
                ta.Actividad.EstadoActividad?.ColorHex ?? "#64748B",
                ta.Actividad.PorcentajeAvance)).ToList(),
            t.Historial.OrderByDescending(h => h.FechaEventoUtc).Select(h => new TicketHistorialDto(
                h.Id, h.TicketId, h.Usuario?.NombreCompleto, h.Accion, h.EstadoAnterior,
                h.EstadoNuevo, h.Detalle, h.FechaEventoUtc)).ToList(),
            comentarios,
            t.Adjuntos.OrderByDescending(a => a.FechaSubidaUtc).Select(a => new AdjuntoDto(
                a.Id, a.ProyectoId, a.ActividadId, a.TicketId, a.NombreOriginal, a.ContentType,
                a.TamanoBytes, a.EsEvidencia, a.SubidoPorId, a.SubidoPor?.NombreCompleto ?? "", a.FechaSubidaUtc)).ToList());
    }
}

[ApiController]
[Route("api")]
[Authorize]
public class SlasAutomatizacionesYAuditoriaController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("slas")]
    public async Task<ActionResult<IReadOnlyList<PoliticaSlaDto>>> ListarPoliticasSla(CancellationToken ct)
    {
        var items = await db.PoliticasSla
            .AsNoTracking()
            .Include(p => p.Prioridad)
            .Include(p => p.TicketTipo)
            .Include(p => p.TicketCategoria)
            .Include(p => p.Unidad)
            .Include(p => p.CalendarioSla)
            .OrderBy(p => p.Prioridad!.Nivel)
            .ToListAsync(ct);

        return Ok(items.Select(p => new PoliticaSlaDto(
            p.Id, p.Nombre, p.PrioridadId, p.Prioridad?.Nombre ?? "",
            p.TicketTipoId, p.TicketTipo?.Nombre, p.TicketCategoriaId, p.TicketCategoria?.Nombre,
            p.UnidadId, p.Unidad?.Nombre, p.CalendarioSlaId, p.CalendarioSla?.Nombre,
            p.TiempoPrimeraRespuestaMinutos, p.TiempoResolucionMinutos, p.UmbralAlertaPorcentaje, p.Activa)).ToList());
    }

    [HttpPost("slas")]
    [RequierePermiso(PermisosConstantes.ConfiguracionGestionar)]
    public async Task<ActionResult<PoliticaSlaDto>> CrearPoliticaSla([FromBody] GuardarPoliticaSlaDto dto, CancellationToken ct)
    {
        var pol = new PoliticaSla
        {
            Nombre = dto.Nombre.Trim(),
            PrioridadId = dto.PrioridadId,
            TicketTipoId = dto.TicketTipoId,
            TicketCategoriaId = dto.TicketCategoriaId,
            UnidadId = dto.UnidadId,
            CalendarioSlaId = dto.CalendarioSlaId,
            TiempoPrimeraRespuestaMinutos = dto.TiempoPrimeraRespuestaMinutos,
            TiempoResolucionMinutos = dto.TiempoResolucionMinutos,
            UmbralAlertaPorcentaje = dto.UmbralAlertaPorcentaje,
            Activa = dto.Activa
        };
        db.PoliticasSla.Add(pol);
        await db.SaveChangesAsync(ct);

        var lista = await ListarPoliticasSla(ct);
        return Ok(lista.Value!.First(x => x.Id == pol.Id));
    }

    [HttpGet("automatizaciones")]
    public async Task<ActionResult<IReadOnlyList<ReglaAutomatizacionDto>>> ListarAutomatizaciones(CancellationToken ct)
    {
        var reglas = await db.ReglasAutomatizacion
            .AsNoTracking()
            .OrderByDescending(r => r.Activa)
            .ThenBy(r => r.Nombre)
            .Select(r => new ReglaAutomatizacionDto(
                r.Id, r.Nombre, r.Descripcion, r.EventoDisparador, r.CondicionJson,
                r.AccionTipo, r.AccionConfigJson, r.Activa, r.TotalEjecuciones, r.TotalFallos, r.UltimaEjecucionUtc))
            .ToListAsync(ct);
        return Ok(reglas);
    }

    [HttpPost("automatizaciones")]
    [RequierePermiso(PermisosConstantes.ConfiguracionGestionar)]
    public async Task<ActionResult<ReglaAutomatizacionDto>> CrearAutomatizacion([FromBody] GuardarReglaAutomatizacionDto dto, CancellationToken ct)
    {
        var regla = new ReglaAutomatizacion
        {
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            EventoDisparador = dto.EventoDisparador,
            CondicionJson = string.IsNullOrWhiteSpace(dto.CondicionJson) ? "{}" : dto.CondicionJson,
            AccionTipo = dto.AccionTipo,
            AccionConfigJson = string.IsNullOrWhiteSpace(dto.AccionConfigJson) ? "{}" : dto.AccionConfigJson,
            Activa = dto.Activa
        };
        db.ReglasAutomatizacion.Add(regla);
        await db.SaveChangesAsync(ct);

        return Ok(new ReglaAutomatizacionDto(
            regla.Id, regla.Nombre, regla.Descripcion, regla.EventoDisparador, regla.CondicionJson,
            regla.AccionTipo, regla.AccionConfigJson, regla.Activa, regla.TotalEjecuciones, regla.TotalFallos, regla.UltimaEjecucionUtc));
    }

    [HttpPatch("automatizaciones/{id:int}/toggle")]
    [RequierePermiso(PermisosConstantes.ConfiguracionGestionar)]
    public async Task<IActionResult> ToggleAutomatizacion(int id, CancellationToken ct)
    {
        var regla = await db.ReglasAutomatizacion.FindAsync([id], ct)
            ?? throw new DomainRuleException("Regla no encontrada.", "NO_ENCONTRADO", 404);
        regla.Activa = !regla.Activa;
        await db.SaveChangesAsync(ct);
        return Ok(new { regla.Id, regla.Activa });
    }

    [HttpGet("notificaciones")]
    public async Task<ActionResult<IReadOnlyList<NotificacionDto>>> MisNotificaciones(CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? 0;
        var items = await db.Notificaciones
            .AsNoTracking()
            .Where(n => n.UsuarioDestinoId == userId)
            .OrderByDescending(n => n.FechaCreacionUtc)
            .Take(40)
            .Select(n => new NotificacionDto(n.Id, n.TipoEvento, n.Titulo, n.Mensaje, n.UrlDestino, n.Leida, n.FechaCreacionUtc))
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPatch("notificaciones/{id:long}/leer")]
    public async Task<IActionResult> MarcarNotificacionLeida(long id, CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? 0;
        var n = await db.Notificaciones.FirstOrDefaultAsync(x => x.Id == id && x.UsuarioDestinoId == userId, ct);
        if (n != null && !n.Leida)
        {
            n.Leida = true;
            n.FechaLecturaUtc = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        return NoContent();
    }

    [HttpPost("notificaciones/leer-todas")]
    public async Task<IActionResult> MarcarTodasLeidas(CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? 0;
        var pendientes = await db.Notificaciones.Where(n => n.UsuarioDestinoId == userId && !n.Leida).ToListAsync(ct);
        foreach (var n in pendientes)
        {
            n.Leida = true;
            n.FechaLecturaUtc = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("auditoria")]
    [RequierePermiso(PermisosConstantes.AuditoriaVer)]
    public async Task<ActionResult<IReadOnlyList<AuditoriaEventoDto>>> ListarAuditoria(
        [FromQuery] string? modulo,
        [FromQuery] int top = 100,
        CancellationToken ct = default)
    {
        var query = db.AuditoriaEventos.AsNoTracking().AsQueryable();

        if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(a => a.UnidadId == null || unidades.Contains(a.UnidadId.Value));
        }

        if (!string.IsNullOrWhiteSpace(modulo))
            query = query.Where(a => a.Modulo == modulo);

        var items = await query
            .OrderByDescending(a => a.FechaEventoUtc)
            .Take(Math.Clamp(top, 10, 500))
            .Select(a => new AuditoriaEventoDto(
                a.Id, a.UsuarioId, a.NombreUsuario, a.Modulo, a.Accion, a.Entidad,
                a.EntidadId, a.UnidadId, a.Resumen, a.ValoresAnteriores, a.ValoresNuevos, a.IpAddress, a.FechaEventoUtc))
            .ToListAsync(ct);

        return Ok(items);
    }
}

[ApiController]
[Route("api")]
[Authorize]
public class DashboardYReportesController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardEjecutivoDto>> ObtenerDashboard(
        [FromQuery] int? unidadId,
        [FromQuery] int? proyectoId,
        [FromQuery] int? departamentoId,
        [FromQuery] int? responsableId,
        CancellationToken ct)
    {
        if (unidadId.HasValue)
            currentUser.ExigirAlcanceUnidad(unidadId.Value);

        var unidadesPermitidas = currentUser.UnidadesAutorizadas;

        var proyQuery = db.Proyectos.AsNoTracking()
            .Include(p => p.EstadoProyecto)
            .Include(p => p.Unidad)
            .Where(p => !p.Archivado);

        var actQuery = db.Actividades.AsNoTracking()
            .Include(a => a.EstadoActividad)
            .Include(a => a.Unidad)
            .Include(a => a.Asignados)
            .Include(a => a.Tiempos)
            .Where(a => !a.Archivada);

        var tktQuery = db.Tickets.AsNoTracking()
            .Include(t => t.EstadoTicket)
            .Include(t => t.Prioridad)
            .Include(t => t.TicketCategoria)
            .Include(t => t.Unidad)
            .Include(t => t.PoliticaSla)
            .AsQueryable();

        if (!currentUser.AccesoGlobalUnidades)
        {
            proyQuery = proyQuery.Where(p => unidadesPermitidas.Contains(p.UnidadId));
            actQuery = actQuery.Where(a => unidadesPermitidas.Contains(a.UnidadId));
            tktQuery = tktQuery.Where(t => unidadesPermitidas.Contains(t.UnidadId));
        }

        if (unidadId.HasValue)
        {
            proyQuery = proyQuery.Where(p => p.UnidadId == unidadId.Value);
            actQuery = actQuery.Where(a => a.UnidadId == unidadId.Value);
            tktQuery = tktQuery.Where(t => t.UnidadId == unidadId.Value);
        }

        if (proyectoId.HasValue)
        {
            proyQuery = proyQuery.Where(p => p.Id == proyectoId.Value);
            actQuery = actQuery.Where(a => a.ProyectoId == proyectoId.Value);
        }

        if (departamentoId.HasValue)
        {
            proyQuery = proyQuery.Where(p => p.DepartamentoId == departamentoId.Value);
            actQuery = actQuery.Where(a => a.DepartamentoId == departamentoId.Value);
            tktQuery = tktQuery.Where(t => t.DepartamentoId == departamentoId.Value);
        }

        if (responsableId.HasValue)
        {
            proyQuery = proyQuery.Where(p => p.ResponsableId == responsableId.Value);
            actQuery = actQuery.Where(a => a.Asignados.Any(x => x.UsuarioId == responsableId.Value));
            tktQuery = tktQuery.Where(t => t.ResponsableId == responsableId.Value);
        }

        var proyectos = await proyQuery.ToListAsync(ct);
        var actividades = await actQuery.ToListAsync(ct);
        var tickets = await tktQuery.ToListAsync(ct);

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var ahora = DateTime.UtcNow;

        var totalProyectos = proyectos.Count;
        var proyectosActivos = proyectos.Count(p => p.EstadoProyecto?.EsFinal != true);
        var actCompletadas = actividades.Count(a => a.EstadoActividad?.Codigo == "COMPLETADA");
        var actEnProgreso = actividades.Count(a => a.EstadoActividad?.Codigo is "EN_PROGRESO" or "EN_REVISION");
        var actPendientes = actividades.Count(a => a.EstadoActividad?.EsFinal != true);
        var actVencidas = actividades.Count(a => a.FechaVencimiento.HasValue && a.FechaVencimiento.Value < hoy && a.EstadoActividad?.EsFinal != true);

        var ticketsAbiertos = tickets.Count(t => t.EstadoTicket?.EsFinal != true && t.EstadoTicket?.Codigo != "RESUELTO");
        var ticketsResueltos = tickets.Count(t => t.EstadoTicket?.Codigo is "RESUELTO" or "CERRADO");

        var estadosSlaEvaluados = tickets.Select(t => ReglasNegocioService.EvaluarEstadoSla(
            t.PoliticaSla, t.FechaCreacionUtc, t.FechaLimiteResolucionUtc, t.FechaResolucionUtc, t.MinutosPausadoSla, ahora)).ToList();

        var ticketsVencidosSla = estadosSlaEvaluados.Count(s => s == "Incumplido");
        var conPolitica = estadosSlaEvaluados.Where(s => s != "SinPolitica").ToList();
        var cumplimientoSla = conPolitica.Count == 0
            ? 100m
            : Math.Round((decimal)conPolitica.Count(s => s is "Cumplido" or "EnTiempo") / conPolitica.Count * 100m, 1);

        var tiemposRespuesta = tickets
            .Where(t => t.FechaPrimeraRespuestaUtc.HasValue)
            .Select(t => (decimal)(t.FechaPrimeraRespuestaUtc!.Value - t.FechaCreacionUtc).TotalMinutes)
            .ToList();
        var promRespuesta = tiemposRespuesta.Count == 0 ? 0m : Math.Round(tiemposRespuesta.Average(), 1);

        var tiemposResolucion = tickets
            .Where(t => t.FechaResolucionUtc.HasValue)
            .Select(t => (decimal)Math.Max(1, (t.FechaResolucionUtc!.Value - t.FechaCreacionUtc).TotalMinutes - t.MinutosPausadoSla))
            .ToList();
        var promResolucion = tiemposResolucion.Count == 0 ? 0m : Math.Round(tiemposResolucion.Average(), 1);

        var actividadesPorEstado = actividades
            .GroupBy(a => new { Nombre = a.EstadoActividad?.Nombre ?? "Sin estado", Color = a.EstadoActividad?.ColorHex ?? "#64748B" })
            .Select(g => new SerieGraficoDto(g.Key.Nombre, g.Count(), g.Key.Color))
            .ToList();

        var ticketsPorPrioridad = tickets
            .GroupBy(t => new { Nombre = t.Prioridad?.Nombre ?? "Media", Color = t.Prioridad?.ColorHex ?? "#2563EB", Nivel = t.Prioridad?.Nivel ?? 1 })
            .OrderByDescending(g => g.Key.Nivel)
            .Select(g => new SerieGraficoDto(g.Key.Nombre, g.Count(), g.Key.Color))
            .ToList();

        var ticketsPorCategoria = tickets
            .GroupBy(t => t.TicketCategoria?.Nombre ?? "General")
            .Select(g => new SerieGraficoDto(g.Key, g.Count(), "#0284C7"))
            .ToList();

        var tendenciaMensual = tickets
            .GroupBy(t => t.FechaCreacionUtc.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new SerieGraficoDto(g.Key, g.Count(), "#2563EB"))
            .ToList();

        var distribucionSla = estadosSlaEvaluados
            .GroupBy(s => s)
            .Select(g => new SerieGraficoDto(
                g.Key,
                g.Count(),
                g.Key switch
                {
                    "Cumplido" => "#10B981",
                    "EnTiempo" => "#3B82F6",
                    "ProximoAVencer" => "#F59E0B",
                    "Incumplido" => "#EF4444",
                    _ => "#94A3B8"
                }))
            .ToList();

        var avanceProyectos = proyectos
            .Select(p => new SerieGraficoDto($"{p.Codigo} · {p.Nombre}", p.PorcentajeAvance, p.Prioridad?.ColorHex ?? "#2563EB"))
            .ToList();

        var comparativoUnidades = actividades
            .GroupBy(a => a.Unidad?.Nombre ?? "Corporativo")
            .Select(g => new SerieGraficoDto(g.Key, g.Count(), "#6366F1"))
            .ToList();

        var usuarios = await db.Usuarios
            .AsNoTracking()
            .Include(u => u.UsuarioUnidades).ThenInclude(uu => uu.Unidad)
            .Where(u => u.Activo)
            .ToListAsync(ct);

        var productividad = usuarios
            .Where(u => currentUser.AccesoGlobalUnidades || u.UsuarioUnidades.Any(uu => unidadesPermitidas.Contains(uu.UnidadId)))
            .Select(u =>
            {
                var misAct = actividades.Where(a => a.Asignados.Any(asig => asig.UsuarioId == u.Id)).ToList();
                var activas = misAct.Count(a => a.EstadoActividad?.EsFinal != true);
                var comp = misAct.Count(a => a.EstadoActividad?.Codigo == "COMPLETADA");
                var venc = misAct.Count(a => a.FechaVencimiento.HasValue && a.FechaVencimiento.Value < hoy && a.EstadoActividad?.EsFinal != true);
                var tkts = tickets.Count(t => t.ResponsableId == u.Id && t.EstadoTicket?.EsFinal != true);
                var minEst = misAct.Sum(a => a.TiempoEstimadoMinutos);
                var minTrab = misAct.SelectMany(a => a.Tiempos).Where(t => t.UsuarioId == u.Id).Sum(t => t.MinutosTrabajados);
                var totalAsignadas = misAct.Count;
                var indice = totalAsignadas == 0 ? 100m : Math.Round((decimal)comp / totalAsignadas * 100m, 1);
                var unidadPrincipal = u.UsuarioUnidades.FirstOrDefault(uu => uu.EsUnidadPrincipal)?.Unidad?.Nombre
                                      ?? u.UsuarioUnidades.FirstOrDefault()?.Unidad?.Nombre ?? "Global";

                return new CargaResponsableDto(
                    u.Id, u.NombreCompleto, u.Cargo, unidadPrincipal,
                    activas, comp, venc, tkts, minEst, minTrab, indice);
            })
            .ToList();

        return Ok(new DashboardEjecutivoDto(
            totalProyectos,
            proyectosActivos,
            actPendientes,
            actEnProgreso,
            actCompletadas,
            actVencidas,
            ticketsAbiertos,
            ticketsResueltos,
            ticketsVencidosSla,
            cumplimientoSla,
            promRespuesta,
            promResolucion,
            actividadesPorEstado,
            ticketsPorPrioridad,
            ticketsPorCategoria,
            tendenciaMensual,
            distribucionSla,
            avanceProyectos,
            comparativoUnidades,
            productividad));
    }

    [HttpGet("reportes/exportar")]
    [RequierePermiso(PermisosConstantes.ReportesExportar)]
    public async Task<IActionResult> ExportarReporteCsv(
        [FromQuery] string tipo = "actividades",
        [FromQuery] int? unidadId = null,
        CancellationToken ct = default)
    {
        if (unidadId.HasValue)
            currentUser.ExigirAlcanceUnidad(unidadId.Value);

        var unidadesPermitidas = currentUser.UnidadesAutorizadas;
        var sb = new StringBuilder();

        if (tipo.Equals("tickets", StringComparison.OrdinalIgnoreCase))
        {
            sb.AppendLine("Folio,Titulo,Tipo,Categoria,Prioridad,Estado,Unidad,Solicitante,Responsable,EstadoSLA,FechaCreacionUTC,FechaPrimeraRespuestaUTC,FechaResolucionUTC");
            var query = db.Tickets.AsNoTracking()
                .Include(t => t.TicketTipo)
                .Include(t => t.TicketCategoria)
                .Include(t => t.Prioridad)
                .Include(t => t.EstadoTicket)
                .Include(t => t.Unidad)
                .Include(t => t.Solicitante)
                .Include(t => t.Responsable)
                .AsQueryable();

            if (!currentUser.AccesoGlobalUnidades)
                query = query.Where(t => unidadesPermitidas.Contains(t.UnidadId));
            if (unidadId.HasValue)
                query = query.Where(t => t.UnidadId == unidadId.Value);

            var items = await query.OrderByDescending(t => t.FechaCreacionUtc).ToListAsync(ct);
            foreach (var t in items)
            {
                sb.AppendLine($"\"{t.Folio}\",\"{EscaparCsv(t.Titulo)}\",\"{t.TicketTipo?.Nombre}\",\"{t.TicketCategoria?.Nombre}\",\"{t.Prioridad?.Nombre}\",\"{t.EstadoTicket?.Nombre}\",\"{t.Unidad?.Nombre}\",\"{t.Solicitante?.NombreCompleto}\",\"{t.Responsable?.NombreCompleto ?? "Sin asignar"}\",\"{t.EstadoSla}\",\"{t.FechaCreacionUtc:yyyy-MM-dd HH:mm}\",\"{t.FechaPrimeraRespuestaUtc:yyyy-MM-dd HH:mm}\",\"{t.FechaResolucionUtc:yyyy-MM-dd HH:mm}\"");
            }
        }
        else if (tipo.Equals("productividad", StringComparison.OrdinalIgnoreCase))
        {
            var dash = await ObtenerDashboard(unidadId, null, null, null, ct);
            sb.AppendLine("Usuario,Cargo,Unidad,ActividadesActivas,ActividadesCompletadas,ActividadesVencidas,TicketsAsignados,MinutosEstimados,MinutosTrabajados,IndiceCumplimientoPct");
            foreach (var r in dash.Value!.ProductividadResponsables)
            {
                sb.AppendLine($"\"{EscaparCsv(r.NombreCompleto)}\",\"{EscaparCsv(r.Cargo ?? "")}\",\"{EscaparCsv(r.UnidadNombre)}\",{r.ActividadesActivas},{r.ActividadesCompletadas},{r.ActividadesVencidas},{r.TicketsAsignados},{r.MinutosEstimados},{r.MinutosTrabajados},{r.IndiceProductividad}");
            }
        }
        else
        {
            sb.AppendLine("Codigo,Titulo,Proyecto,Unidad,Prioridad,Estado,AvancePct,FechaInicio,FechaVencimiento,Responsables,MinutosEstimados,MinutosTrabajados");
            var query = db.Actividades.AsNoTracking()
                .Include(a => a.Proyecto)
                .Include(a => a.Unidad)
                .Include(a => a.Prioridad)
                .Include(a => a.EstadoActividad)
                .Include(a => a.Asignados).ThenInclude(x => x.Usuario)
                .Include(a => a.Tiempos)
                .Where(a => !a.Archivada);

            if (!currentUser.AccesoGlobalUnidades)
                query = query.Where(a => unidadesPermitidas.Contains(a.UnidadId));
            if (unidadId.HasValue)
                query = query.Where(a => a.UnidadId == unidadId.Value);

            var items = await query.OrderBy(a => a.Codigo).ToListAsync(ct);
            foreach (var a in items)
            {
                var resps = string.Join(" | ", a.Asignados.Where(x => x.Usuario != null).Select(x => x.Usuario!.NombreCompleto));
                var minTrab = a.Tiempos.Sum(t => t.MinutosTrabajados);
                sb.AppendLine($"\"{a.Codigo}\",\"{EscaparCsv(a.Titulo)}\",\"{EscaparCsv(a.Proyecto?.Nombre ?? "Independiente")}\",\"{EscaparCsv(a.Unidad?.Nombre ?? "")}\",\"{a.Prioridad?.Nombre}\",\"{a.EstadoActividad?.Nombre}\",{a.PorcentajeAvance},\"{a.FechaInicio:yyyy-MM-dd}\",\"{a.FechaVencimiento:yyyy-MM-dd}\",\"{EscaparCsv(resps)}\",{a.TiempoEstimadoMinutos},{minTrab}");
            }
        }

        var preamble = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        var bytes = preamble.Concat(body).ToArray();
        return File(bytes, "text/csv; charset=utf-8", $"Reporte_{tipo}_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv");
    }

    private static string EscaparCsv(string input) => input.Replace("\"", "\"\"");
}
