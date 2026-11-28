using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Controllers;

[ApiController]
[Route("api/guardias")]
[Authorize]
public class GuardiasController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    private async Task<Usuario> ValidarAccesoDepartamentoSistemasAsync(CancellationToken ct)
    {
        var userId = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión no válida.", "NO_AUTENTICADO", 401);

        var usuario = await db.Usuarios
            .Include(u => u.Departamento)
            .Include(u => u.UsuarioRoles).ThenInclude(ur => ur.Rol)
            .FirstOrDefaultAsync(u => u.Id == userId && u.Activo, ct)
            ?? throw new DomainRuleException("Usuario no encontrado o inactivo.", "NO_AUTENTICADO", 401);

        var esSuperAdmin = usuario.AccesoGlobalUnidades ||
            usuario.UsuarioRoles.Any(r => r.Rol != null && (r.Rol.Codigo == "SUPER_ADMIN" || r.Rol.Codigo == "ADMIN"));

        var deptoNombre = usuario.Departamento?.Nombre ?? string.Empty;
        var deptoCodigo = usuario.Departamento?.Codigo ?? string.Empty;

        var esDeptoSistemas =
            deptoNombre.Contains("Sistemas", StringComparison.OrdinalIgnoreCase) ||
            deptoNombre.Contains("Tecnología", StringComparison.OrdinalIgnoreCase) ||
            deptoNombre.Contains("TI", StringComparison.OrdinalIgnoreCase) ||
            deptoCodigo.Contains("TI", StringComparison.OrdinalIgnoreCase) ||
            deptoCodigo.Contains("SISTEMA", StringComparison.OrdinalIgnoreCase);

        if (!esDeptoSistemas && !esSuperAdmin)
        {
            throw new DomainRuleException(
                "Acceso restringido: Este módulo está disponible únicamente para colaboradores del Departamento de Sistemas.",
                "ACCESO_DEPARTAMENTO_DENEGADO",
                403);
        }

        return usuario;
    }

    // ==========================================
    // ENDPOINTS DE GUARDIA (CABECERA / TURNO)
    // ==========================================

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<GuardiaDto>>> Listar(
        [FromQuery] DateOnly? fechaInicio,
        [FromQuery] DateOnly? fechaFin,
        [FromQuery] string? estado,
        [FromQuery] bool? soloPendientesLunes,
        CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var query = db.Guardias
            .AsNoTracking()
            .Include(g => g.Usuario)
            .Include(g => g.Unidad)
            .Include(g => g.Departamento)
            .Include(g => g.Actividades)
            .AsQueryable();

        if (fechaInicio.HasValue) query = query.Where(g => g.Fecha >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(g => g.Fecha <= fechaFin.Value);
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(g => g.Estado == estado);
        if (soloPendientesLunes == true) query = query.Where(g => g.Actividades.Any(a => a.RequiereSeguimientoLunes));

        var lista = await query.OrderByDescending(g => g.Fecha).ToListAsync(ct);
        return Ok(lista.Select(g => MapearGuardiaDto(g, incluirActividades: false)).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<GuardiaDto>> ObtenerPorId(int id, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var guardia = await db.Guardias
            .AsNoTracking()
            .Include(g => g.Usuario)
            .Include(g => g.Unidad)
            .Include(g => g.Departamento)
            .Include(g => g.Actividades).ThenInclude(a => a.TicketRelacionado)
            .FirstOrDefaultAsync(g => g.Id == id, ct)
            ?? throw new DomainRuleException("Guardia no encontrada.", "NO_ENCONTRADO", 404);

        return Ok(MapearGuardiaDto(guardia, incluirActividades: true));
    }

    [HttpPost]
    public async Task<ActionResult<GuardiaDto>> IniciarGuardia([FromBody] CrearGuardiaDto dto, CancellationToken ct)
    {
        var usuario = await ValidarAccesoDepartamentoSistemasAsync(ct);

        var diaSemana = dto.Fecha.DayOfWeek;
        var esFinDeSemana = diaSemana == DayOfWeek.Saturday || diaSemana == DayOfWeek.Sunday;
        if (!esFinDeSemana && !dto.EsGuardiaExtraordinaria)
        {
            throw new DomainRuleException("La fecha debe ser un sábado o domingo, a menos que se indique como guardia extraordinaria.", "FECHA_INVALIDA", 400);
        }

        var prefijo = $"GUA-{dto.Fecha:yyyyMMdd}";
        var conteoHoy = await db.Guardias.CountAsync(g => g.Folio.StartsWith(prefijo), ct);
        var folio = $"{prefijo}-{(conteoHoy + 1):D3}";

        var nuevaGuardia = new Guardia
        {
            Folio = folio,
            UsuarioId = usuario.Id,
            UnidadId = dto.UnidadId,
            DepartamentoId = usuario.DepartamentoId,
            Fecha = dto.Fecha,
            HoraInicioTurno = dto.HoraInicioTurno ?? TimeOnly.FromDateTime(DateTime.Now),
            HoraFinTurno = dto.HoraFinTurno,
            Estado = "ABIERTA",
            ObservacionesEntrega = dto.ObservacionesEntrega?.Trim(),
            EsGuardiaExtraordinaria = dto.EsGuardiaExtraordinaria,
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.Guardias.Add(nuevaGuardia);
        await db.SaveChangesAsync(ct);

        await db.Entry(nuevaGuardia).Reference(g => g.Usuario).LoadAsync(ct);
        await db.Entry(nuevaGuardia).Reference(g => g.Unidad).LoadAsync(ct);

        return CreatedAtAction(nameof(ObtenerPorId), new { id = nuevaGuardia.Id }, MapearGuardiaDto(nuevaGuardia, false));
    }

    [HttpPut("{id:int}/cerrar")]
    public async Task<ActionResult<GuardiaDto>> CerrarGuardia(int id, [FromBody] CerrarGuardiaDto dto, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var guardia = await db.Guardias
            .Include(g => g.Usuario)
            .Include(g => g.Unidad)
            .Include(g => g.Actividades)
            .FirstOrDefaultAsync(g => g.Id == id, ct)
            ?? throw new DomainRuleException("Guardia no encontrada.", "NO_ENCONTRADO", 404);

        guardia.Estado = "CERRADA";
        guardia.HoraFinTurno = dto.HoraFinTurno ?? TimeOnly.FromDateTime(DateTime.Now);
        guardia.ObservacionesEntrega = dto.ObservacionesEntrega?.Trim();
        guardia.FechaCierreUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(MapearGuardiaDto(guardia, true));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> EliminarGuardia(int id, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var guardia = await db.Guardias.FindAsync([id], ct)
            ?? throw new DomainRuleException("Guardia no encontrada.", "NO_ENCONTRADO", 404);

        db.Guardias.Remove(guardia);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ==========================================
    // ENDPOINTS DE ACTIVIDADES (DETALLE DEL DÍA)
    // ==========================================

    [HttpPost("{guardiaId:int}/actividades")]
    public async Task<ActionResult<GuardiaActividadDto>> AgregarActividad(
        int guardiaId,
        [FromBody] GuardarGuardiaActividadDto dto,
        CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var guardia = await db.Guardias.FindAsync([guardiaId], ct)
            ?? throw new DomainRuleException("Guardia no encontrada.", "NO_ENCONTRADO", 404);

        var duracionMinutos = (int)(dto.HoraFin.ToTimeSpan() - dto.HoraInicio.ToTimeSpan()).TotalMinutes;
        if (duracionMinutos < 0)
        {
            throw new DomainRuleException("La hora final no puede ser menor a la hora inicial.", "HORA_INVALIDA", 400);
        }

        var actividad = new GuardiaActividad
        {
            GuardiaId = guardiaId,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            DuracionMinutos = duracionMinutos,
            TipoActividad = dto.TipoActividad.Trim(),
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            Solucion = dto.Solucion?.Trim(),
            Estado = dto.Estado.Trim(),
            TicketRelacionadoId = dto.TicketRelacionadoId,
            FolioTicketExterno = dto.FolioTicketExterno?.Trim(),
            RequiereSeguimientoLunes = dto.RequiereSeguimientoLunes,
            DetalleSeguimiento = dto.DetalleSeguimiento?.Trim(),
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.GuardiasActividades.Add(actividad);
        await db.SaveChangesAsync(ct);

        return Ok(MapearActividadDto(actividad));
    }

    [HttpPut("{guardiaId:int}/actividades/{actividadId:int}")]
    public async Task<ActionResult<GuardiaActividadDto>> ActualizarActividad(
        int guardiaId,
        int actividadId,
        [FromBody] GuardarGuardiaActividadDto dto,
        CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var actividad = await db.GuardiasActividades
            .FirstOrDefaultAsync(a => a.Id == actividadId && a.GuardiaId == guardiaId, ct)
            ?? throw new DomainRuleException("Actividad no encontrada en esta guardia.", "NO_ENCONTRADO", 404);

        var duracionMinutos = (int)(dto.HoraFin.ToTimeSpan() - dto.HoraInicio.ToTimeSpan()).TotalMinutes;

        actividad.HoraInicio = dto.HoraInicio;
        actividad.HoraFin = dto.HoraFin;
        actividad.DuracionMinutos = duracionMinutos;
        actividad.TipoActividad = dto.TipoActividad.Trim();
        actividad.Titulo = dto.Titulo.Trim();
        actividad.Descripcion = dto.Descripcion.Trim();
        actividad.Solucion = dto.Solucion?.Trim();
        actividad.Estado = dto.Estado.Trim();
        actividad.TicketRelacionadoId = dto.TicketRelacionadoId;
        actividad.FolioTicketExterno = dto.FolioTicketExterno?.Trim();
        actividad.RequiereSeguimientoLunes = dto.RequiereSeguimientoLunes;
        actividad.DetalleSeguimiento = dto.DetalleSeguimiento?.Trim();

        await db.SaveChangesAsync(ct);
        return Ok(MapearActividadDto(actividad));
    }

    [HttpDelete("{guardiaId:int}/actividades/{actividadId:int}")]
    public async Task<IActionResult> EliminarActividad(int guardiaId, int actividadId, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var actividad = await db.GuardiasActividades
            .FirstOrDefaultAsync(a => a.Id == actividadId && a.GuardiaId == guardiaId, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        db.GuardiasActividades.Remove(actividad);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ==========================================
    // HELPERS DE MAPEO
    // ==========================================

    private static GuardiaDto MapearGuardiaDto(Guardia g, bool incluirActividades)
    {
        var totalMin = g.Actividades.Sum(a => a.DuracionMinutos);
        var pendientes = g.Actividades.Any(a => a.RequiereSeguimientoLunes);
        var dia = g.Fecha.DayOfWeek == DayOfWeek.Saturday ? "Sábado" : g.Fecha.DayOfWeek == DayOfWeek.Sunday ? "Domingo" : "Extraordinaria";

        return new GuardiaDto(
            g.Id,
            g.Folio,
            g.UsuarioId,
            g.Usuario?.NombreCompleto ?? "Colaborador",
            g.Usuario?.Email ?? "",
            g.UnidadId,
            g.Unidad?.Nombre ?? "Unidad General",
            g.DepartamentoId,
            g.Departamento?.Nombre,
            g.Fecha,
            dia,
            g.HoraInicioTurno,
            g.HoraFinTurno,
            g.Estado,
            g.ObservacionesEntrega,
            g.EsGuardiaExtraordinaria,
            g.Actividades.Count,
            totalMin,
            pendientes,
            g.FechaCreacionUtc,
            incluirActividades ? g.Actividades.Select(MapearActividadDto).ToList() : null
        );
    }

    private static GuardiaActividadDto MapearActividadDto(GuardiaActividad a) =>
        new(
            a.Id,
            a.GuardiaId,
            a.HoraInicio,
            a.HoraFin,
            a.DuracionMinutos,
            a.TipoActividad,
            a.Titulo,
            a.Descripcion,
            a.Solucion,
            a.Estado,
            a.TicketRelacionadoId,
            a.TicketRelacionado?.Folio ?? a.FolioTicketExterno,
            a.RequiereSeguimientoLunes,
            a.DetalleSeguimiento,
            a.FechaCreacionUtc
        );
}