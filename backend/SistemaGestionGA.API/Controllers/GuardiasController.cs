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

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ActividadGuardiaDto>>> Listar(
        [FromQuery] DateOnly? fechaInicio,
        [FromQuery] DateOnly? fechaFin,
        [FromQuery] int? unidadId,
        [FromQuery] int? usuarioId,
        [FromQuery] string? tipoActividad,
        [FromQuery] bool? soloPendientesLunes,
        [FromQuery] string? busqueda,
        CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var query = db.ActividadesGuardia
            .AsNoTracking()
            .Include(g => g.Usuario)
            .Include(g => g.Unidad)
            .Include(g => g.Departamento)
            .Include(g => g.TicketRelacionado)
            .AsQueryable();

        if (fechaInicio.HasValue) query = query.Where(g => g.Fecha >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(g => g.Fecha <= fechaFin.Value);
        if (unidadId.HasValue) query = query.Where(g => g.UnidadId == unidadId.Value);
        if (usuarioId.HasValue) query = query.Where(g => g.UsuarioId == usuarioId.Value);
        if (!string.IsNullOrWhiteSpace(tipoActividad)) query = query.Where(g => g.TipoActividad == tipoActividad);
        if (soloPendientesLunes == true) query = query.Where(g => g.RequiereSeguimientoLunes);

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(g => g.Titulo.ToLower().Contains(b) ||
                                     g.Descripcion.ToLower().Contains(b) ||
                                     g.Folio.ToLower().Contains(b) ||
                                     g.SistemaAfectado.ToLower().Contains(b));
        }

        var lista = await query.OrderByDescending(g => g.Fecha).ThenByDescending(g => g.HoraInicio).ToListAsync(ct);
        return Ok(lista.Select(MapearDto).ToList());
    }

    [HttpGet("resumen")]
    public async Task<ActionResult<ResumenGuardiasDto>> ObtenerResumen(
        [FromQuery] DateOnly? fechaInicio,
        [FromQuery] DateOnly? fechaFin,
        CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var query = db.ActividadesGuardia.AsNoTracking();
        if (fechaInicio.HasValue) query = query.Where(g => g.Fecha >= fechaInicio.Value);
        if (fechaFin.HasValue) query = query.Where(g => g.Fecha <= fechaFin.Value);

        var items = await query.ToListAsync(ct);

        var totalActividades = items.Count;
        var totalMinutos = items.Sum(x => x.DuracionMinutos);
        var pendientesLunes = items.Count(x => x.RequiereSeguimientoLunes);
        var sabados = items.Count(x => x.Fecha.DayOfWeek == DayOfWeek.Saturday);
        var domingos = items.Count(x => x.Fecha.DayOfWeek == DayOfWeek.Sunday);

        var porSistema = items
            .GroupBy(x => x.SistemaAfectado)
            .Select(g => new DesgloseSistemaDto(g.Key, g.Count(), g.Sum(x => x.DuracionMinutos)))
            .OrderByDescending(x => x.Cantidad)
            .ToList();

        return Ok(new ResumenGuardiasDto(totalActividades, totalMinutos, pendientesLunes, sabados, domingos, porSistema));
    }

    [HttpPost]
    public async Task<ActionResult<ActividadGuardiaDto>> Crear([FromBody] GuardarActividadGuardiaDto dto, CancellationToken ct)
    {
        var usuarioActual = await ValidarAccesoDepartamentoSistemasAsync(ct);

        var diaSemana = dto.Fecha.DayOfWeek;
        var esFinDeSemana = diaSemana == DayOfWeek.Saturday || diaSemana == DayOfWeek.Sunday;
        if (!esFinDeSemana && !dto.EsGuardiaExtraordinaria)
        {
            throw new DomainRuleException("La fecha de guardia debe ser un sábado o domingo, a menos que se marque como guardia extraordinaria.", "FECHA_INVALIDA", 400);
        }

        if (dto.HoraFin < dto.HoraInicio)
        {
            throw new DomainRuleException("La hora de finalización no puede ser anterior a la hora de inicio.", "HORA_INVALIDA", 400);
        }

        var duracionMinutos = (int)(dto.HoraFin.ToTimeSpan() - dto.HoraInicio.ToTimeSpan()).TotalMinutes;

        // Generar folio consecutivo: GUA-yyyyMMdd-XXX
        var prefijo = $"GUA-{dto.Fecha:yyyyMMdd}";
        var conteoHoy = await db.ActividadesGuardia.CountAsync(g => g.Folio.StartsWith(prefijo), ct);
        var folio = $"{prefijo}-{(conteoHoy + 1):D3}";

        var nueva = new ActividadGuardia
        {
            Folio = folio,
            UsuarioId = usuarioActual.Id,
            UnidadId = dto.UnidadId,
            DepartamentoId = usuarioActual.DepartamentoId,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            DuracionMinutos = duracionMinutos,
            TipoActividad = dto.TipoActividad.Trim(),
            SistemaAfectado = dto.SistemaAfectado.Trim(),
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            Solucion = dto.Solucion?.Trim(),
            Estado = dto.Estado.Trim(),
            TicketRelacionadoId = dto.TicketRelacionadoId,
            FolioTicketExterno = dto.FolioTicketExterno?.Trim(),
            RequiereSeguimientoLunes = dto.RequiereSeguimientoLunes,
            DetalleSeguimiento = dto.DetalleSeguimiento?.Trim(),
            EsGuardiaExtraordinaria = dto.EsGuardiaExtraordinaria,
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.ActividadesGuardia.Add(nueva);
        await db.SaveChangesAsync(ct);

        await db.Entry(nueva).Reference(x => x.Usuario).LoadAsync(ct);
        await db.Entry(nueva).Reference(x => x.Unidad).LoadAsync(ct);
        await db.Entry(nueva).Reference(x => x.Departamento).LoadAsync(ct);

        return CreatedAtAction(nameof(Listar), new { id = nueva.Id }, MapearDto(nueva));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ActividadGuardiaDto>> Actualizar(int id, [FromBody] GuardarActividadGuardiaDto dto, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var entidad = await db.ActividadesGuardia
            .Include(x => x.Usuario)
            .Include(x => x.Unidad)
            .Include(x => x.Departamento)
            .Include(x => x.TicketRelacionado)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new DomainRuleException("Registro de guardia no encontrado.", "NO_ENCONTRADO", 404);

        var diaSemana = dto.Fecha.DayOfWeek;
        var esFinDeSemana = diaSemana == DayOfWeek.Saturday || diaSemana == DayOfWeek.Sunday;
        if (!esFinDeSemana && !dto.EsGuardiaExtraordinaria)
        {
            throw new DomainRuleException("La fecha debe corresponder a un sábado o domingo.", "FECHA_INVALIDA", 400);
        }

        var duracionMinutos = (int)(dto.HoraFin.ToTimeSpan() - dto.HoraInicio.ToTimeSpan()).TotalMinutes;

        entidad.UnidadId = dto.UnidadId;
        entidad.Fecha = dto.Fecha;
        entidad.HoraInicio = dto.HoraInicio;
        entidad.HoraFin = dto.HoraFin;
        entidad.DuracionMinutos = duracionMinutos;
        entidad.TipoActividad = dto.TipoActividad.Trim();
        entidad.SistemaAfectado = dto.SistemaAfectado.Trim();
        entidad.Titulo = dto.Titulo.Trim();
        entidad.Descripcion = dto.Descripcion.Trim();
        entidad.Solucion = dto.Solucion?.Trim();
        entidad.Estado = dto.Estado.Trim();
        entidad.TicketRelacionadoId = dto.TicketRelacionadoId;
        entidad.FolioTicketExterno = dto.FolioTicketExterno?.Trim();
        entidad.RequiereSeguimientoLunes = dto.RequiereSeguimientoLunes;
        entidad.DetalleSeguimiento = dto.DetalleSeguimiento?.Trim();
        entidad.EsGuardiaExtraordinaria = dto.EsGuardiaExtraordinaria;
        entidad.FechaModificacionUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(MapearDto(entidad));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id, CancellationToken ct)
    {
        await ValidarAccesoDepartamentoSistemasAsync(ct);

        var entidad = await db.ActividadesGuardia.FindAsync([id], ct)
            ?? throw new DomainRuleException("Registro de guardia no encontrado.", "NO_ENCONTRADO", 404);

        db.ActividadesGuardia.Remove(entidad);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static ActividadGuardiaDto MapearDto(ActividadGuardia g) =>
        new(
            g.Id,
            g.Folio,
            g.UsuarioId,
            g.Usuario?.NombreCompleto ?? "Colaborador de Sistemas",
            g.Usuario?.Email ?? "",
            g.UnidadId,
            g.Unidad?.Nombre ?? "Unidad General",
            g.DepartamentoId,
            g.Departamento?.Nombre,
            g.Fecha,
            g.Fecha.DayOfWeek == DayOfWeek.Saturday ? "Sábado" : g.Fecha.DayOfWeek == DayOfWeek.Sunday ? "Domingo" : "Entre Semana",
            g.HoraInicio,
            g.HoraFin,
            g.DuracionMinutos,
            g.TipoActividad,
            g.SistemaAfectado,
            g.Titulo,
            g.Descripcion,
            g.Solucion,
            g.Estado,
            g.TicketRelacionadoId,
            g.TicketRelacionado?.Folio ?? g.FolioTicketExterno,
            g.RequiereSeguimientoLunes,
            g.DetalleSeguimiento,
            g.EsGuardiaExtraordinaria,
            g.FechaCreacionUtc
        );
}