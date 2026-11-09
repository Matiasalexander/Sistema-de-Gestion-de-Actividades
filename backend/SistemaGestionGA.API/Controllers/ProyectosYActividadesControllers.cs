using System.Security.Cryptography;
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
[Route("api/proyectos")]
[Authorize]
public class ProyectosController(
    ApplicationDbContext db,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    [RequierePermiso(PermisosConstantes.ProyectosVer)]
    public async Task<ActionResult<IReadOnlyList<ProyectoDto>>> ListarProyectos(
        [FromQuery] int? unidadId,
        [FromQuery] int? estadoId,
        [FromQuery] bool incluirArchivados = false,
        [FromQuery] string? busqueda = null,
        CancellationToken ct = default)
    {
        var query = db.Proyectos
            .AsNoTracking()
            .Include(p => p.Unidad)
            .Include(p => p.Departamento)
            .Include(p => p.Equipo)
            .Include(p => p.Responsable)
            .Include(p => p.Prioridad)
            .Include(p => p.EstadoProyecto)
            .Include(p => p.Fases)
            .Include(p => p.Integrantes).ThenInclude(i => i.Usuario)
            .Include(p => p.Actividades).ThenInclude(a => a.EstadoActividad)
            .AsQueryable();

        if (!incluirArchivados)
            query = query.Where(p => !p.Archivado);

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(p => p.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(p => unidades.Contains(p.UnidadId));
        }

        if (estadoId.HasValue)
            query = query.Where(p => p.EstadoProyectoId == estadoId.Value);

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(p => p.Nombre.ToLower().Contains(b) || p.Codigo.ToLower().Contains(b));
        }

        var items = await query.OrderByDescending(p => p.Prioridad!.Nivel).ThenBy(p => p.FechaFinEstimada).ToListAsync(ct);
        return Ok(items.Select(MapearProyectoDto).ToList());
    }

    [HttpGet("{id:int}")]
    [RequierePermiso(PermisosConstantes.ProyectosVer)]
    public async Task<ActionResult<ProyectoDto>> ObtenerPorId(int id, CancellationToken ct)
    {
        var p = await db.Proyectos
            .AsNoTracking()
            .Include(x => x.Unidad)
            .Include(x => x.Departamento)
            .Include(x => x.Equipo)
            .Include(x => x.Responsable)
            .Include(x => x.Prioridad)
            .Include(x => x.EstadoProyecto)
            .Include(x => x.Fases)
            .Include(x => x.Integrantes).ThenInclude(i => i.Usuario)
            .Include(x => x.Actividades).ThenInclude(a => a.EstadoActividad)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new DomainRuleException("Proyecto no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(p.UnidadId);
        return Ok(MapearProyectoDto(p));
    }

    [HttpPost]
    [RequierePermiso(PermisosConstantes.ProyectosCrear)]
    public async Task<ActionResult<ProyectoDto>> CrearProyecto([FromBody] GuardarProyectoDto dto, CancellationToken ct)
    {
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);
        var codigo = dto.Codigo.Trim().ToUpperInvariant();
        if (await db.Proyectos.AnyAsync(p => p.Codigo == codigo, ct))
            throw new DomainRuleException("Ya existe un proyecto con el código especificado.");

        if (dto.FechaFinEstimada < dto.FechaInicio)
            throw new DomainRuleException("La fecha estimada de finalización no puede ser anterior a la fecha de inicio.");

        var proyecto = new Proyecto
        {
            Codigo = codigo,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            UnidadId = dto.UnidadId,
            DepartamentoId = dto.DepartamentoId,
            EquipoId = dto.EquipoId,
            ResponsableId = dto.ResponsableId,
            PrioridadId = dto.PrioridadId,
            EstadoProyectoId = dto.EstadoProyectoId,
            FechaInicio = dto.FechaInicio,
            FechaFinEstimada = dto.FechaFinEstimada,
            PorcentajeAvance = 0m,
            CreadoPorId = currentUser.UsuarioId
        };

        db.Proyectos.Add(proyecto);
        await db.SaveChangesAsync(ct);

        if (dto.IntegrantesIds != null)
        {
            foreach (var usrId in dto.IntegrantesIds.Distinct())
            {
                db.ProyectoIntegrantes.Add(new ProyectoIntegrante
                {
                    ProyectoId = proyecto.Id,
                    UsuarioId = usrId,
                    RolProyecto = usrId == dto.ResponsableId ? "Responsable" : "Colaborador"
                });
            }
        }

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Proyectos",
            Accion = "CrearProyecto",
            Entidad = "Proyecto",
            EntidadId = proyecto.Id.ToString(),
            UnidadId = proyecto.UnidadId,
            Resumen = $"Creación del proyecto {proyecto.Codigo} - {proyecto.Nombre}",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return await ObtenerPorId(proyecto.Id, ct);
    }

    [HttpPut("{id:int}")]
    [RequierePermiso(PermisosConstantes.ProyectosEditar)]
    public async Task<ActionResult<ProyectoDto>> ActualizarProyecto(int id, [FromBody] GuardarProyectoDto dto, CancellationToken ct)
    {
        var proyecto = await db.Proyectos
            .Include(p => p.Integrantes)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new DomainRuleException("Proyecto no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(proyecto.UnidadId);
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);

        proyecto.Nombre = dto.Nombre.Trim();
        proyecto.Descripcion = dto.Descripcion?.Trim();
        proyecto.UnidadId = dto.UnidadId;
        proyecto.DepartamentoId = dto.DepartamentoId;
        proyecto.EquipoId = dto.EquipoId;
        proyecto.ResponsableId = dto.ResponsableId;
        proyecto.PrioridadId = dto.PrioridadId;
        proyecto.EstadoProyectoId = dto.EstadoProyectoId;
        proyecto.FechaInicio = dto.FechaInicio;
        proyecto.FechaFinEstimada = dto.FechaFinEstimada;
        proyecto.FechaModificacionUtc = DateTime.UtcNow;

        if (dto.IntegrantesIds != null)
        {
            db.ProyectoIntegrantes.RemoveRange(proyecto.Integrantes);
            foreach (var usrId in dto.IntegrantesIds.Distinct())
            {
                db.ProyectoIntegrantes.Add(new ProyectoIntegrante
                {
                    ProyectoId = proyecto.Id,
                    UsuarioId = usrId,
                    RolProyecto = usrId == dto.ResponsableId ? "Responsable" : "Colaborador"
                });
            }
        }

        await db.SaveChangesAsync(ct);
        return await ObtenerPorId(proyecto.Id, ct);
    }

    [HttpPost("{id:int}/fases")]
    [RequierePermiso(PermisosConstantes.ProyectosEditar)]
    public async Task<ActionResult<ProyectoFaseDto>> CrearFase(int id, [FromBody] GuardarProyectoFaseDto dto, CancellationToken ct)
    {
        var proyecto = await db.Proyectos.FindAsync([id], ct)
            ?? throw new DomainRuleException("Proyecto no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(proyecto.UnidadId);

        var fase = new ProyectoFase
        {
            ProyectoId = id,
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Orden = dto.Orden,
            EsHito = dto.EsHito,
            FechaInicio = dto.FechaInicio,
            FechaFinEstimada = dto.FechaFinEstimada,
            Completada = dto.Completada,
            PorcentajeAvance = dto.Completada ? 100m : 0m
        };
        db.ProyectoFases.Add(fase);
        await db.SaveChangesAsync(ct);

        return Ok(new ProyectoFaseDto(
            fase.Id, fase.ProyectoId, fase.Nombre, fase.Descripcion, fase.Orden,
            fase.EsHito, fase.FechaInicio, fase.FechaFinEstimada, fase.Completada, fase.PorcentajeAvance));
    }

    [HttpPatch("{id:int}/archivar")]
    [RequierePermiso(PermisosConstantes.ProyectosEliminar)]
    public async Task<IActionResult> ArchivarProyecto(int id, [FromQuery] bool archivado = true, CancellationToken ct = default)
    {
        var proyecto = await db.Proyectos.FindAsync([id], ct)
            ?? throw new DomainRuleException("Proyecto no encontrado.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(proyecto.UnidadId);
        proyecto.Archivado = archivado;
        proyecto.FechaModificacionUtc = DateTime.UtcNow;

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = currentUser.UsuarioId,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Proyectos",
            Accion = archivado ? "ArchivarProyecto" : "RestaurarProyecto",
            Entidad = "Proyecto",
            EntidadId = proyecto.Id.ToString(),
            UnidadId = proyecto.UnidadId,
            Resumen = $"{(archivado ? "Archivado" : "Restauración")} del proyecto {proyecto.Codigo}",
            IpAddress = currentUser.IpAddress
        });

        await db.SaveChangesAsync(ct);
        return Ok(new { proyecto.Id, proyecto.Archivado });
    }

    private static ProyectoDto MapearProyectoDto(Proyecto p)
    {
        var actividadesActivas = p.Actividades.Where(a => !a.Archivada).ToList();
        var completadas = actividadesActivas.Count(a => a.EstadoActividad?.EsFinal == true && a.EstadoActividad.Codigo == "COMPLETADA");

        return new ProyectoDto(
            p.Id,
            p.Codigo,
            p.Nombre,
            p.Descripcion,
            p.UnidadId,
            p.Unidad?.Nombre ?? "",
            p.DepartamentoId,
            p.Departamento?.Nombre,
            p.EquipoId,
            p.Equipo?.Nombre,
            p.ResponsableId,
            p.Responsable?.NombreCompleto ?? "",
            p.PrioridadId,
            p.Prioridad?.Nombre ?? "",
            p.Prioridad?.ColorHex ?? "#2563EB",
            p.EstadoProyectoId,
            p.EstadoProyecto?.Codigo ?? "",
            p.EstadoProyecto?.Nombre ?? "",
            p.EstadoProyecto?.ColorHex ?? "#2563EB",
            p.FechaInicio,
            p.FechaFinEstimada,
            p.FechaFinReal,
            p.PorcentajeAvance,
            p.Archivado,
            actividadesActivas.Count,
            completadas,
            p.FechaCreacionUtc,
            p.Fases.OrderBy(f => f.Orden).Select(f => new ProyectoFaseDto(
                f.Id, f.ProyectoId, f.Nombre, f.Descripcion, f.Orden, f.EsHito, f.FechaInicio, f.FechaFinEstimada, f.Completada, f.PorcentajeAvance)).ToList(),
            p.Integrantes.Where(i => i.Usuario != null).Select(i => new EquipoIntegranteDto(
                i.UsuarioId, i.Usuario!.NombreCompleto, i.Usuario.Email, i.RolProyecto)).ToList());
    }
}

[ApiController]
[Route("api/actividades")]
[Authorize]
public class ActividadesController(
    ApplicationDbContext db,
    ICurrentUserService currentUser,
    IRealtimeNotificationService notificationService) : ControllerBase
{
    [HttpGet]
    [RequierePermiso(PermisosConstantes.ActividadesVer)]
    public async Task<ActionResult<IReadOnlyList<ActividadDto>>> ListarActividades(
        [FromQuery] int? unidadId,
        [FromQuery] int? proyectoId,
        [FromQuery] int? estadoId,
        [FromQuery] int? prioridadId,
        [FromQuery] int? responsableId,
        [FromQuery] bool soloMias = false,
        [FromQuery] bool incluirArchivadas = false,
        [FromQuery] string? busqueda = null,
        CancellationToken ct = default)
    {
        var query = ConstruirQueryCompleta();

        if (!incluirArchivadas)
            query = query.Where(a => !a.Archivada);

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(a => a.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades)
        {
            var unidades = currentUser.UnidadesAutorizadas;
            query = query.Where(a => unidades.Contains(a.UnidadId));
        }

        if (proyectoId.HasValue)
            query = query.Where(a => a.ProyectoId == proyectoId.Value);

        if (estadoId.HasValue)
            query = query.Where(a => a.EstadoActividadId == estadoId.Value);

        if (prioridadId.HasValue)
            query = query.Where(a => a.PrioridadId == prioridadId.Value);

        if (responsableId.HasValue)
            query = query.Where(a => a.Asignados.Any(asig => asig.UsuarioId == responsableId.Value));

        if (soloMias && currentUser.UsuarioId.HasValue)
        {
            var uid = currentUser.UsuarioId.Value;
            query = query.Where(a => a.Asignados.Any(asig => asig.UsuarioId == uid));
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(a => a.Titulo.ToLower().Contains(b) || a.Codigo.ToLower().Contains(b));
        }

        var items = await query
            .OrderBy(a => a.EstadoActividad!.Orden)
            .ThenByDescending(a => a.Prioridad!.Nivel)
            .ThenBy(a => a.FechaVencimiento)
            .ToListAsync(ct);

        return Ok(items.Select(MapearActividadDto).ToList());
    }

    [HttpGet("{id:int}")]
    [RequierePermiso(PermisosConstantes.ActividadesVer)]
    public async Task<ActionResult<ActividadDto>> ObtenerPorId(int id, CancellationToken ct)
    {
        var act = await ConstruirQueryCompleta().FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(act.UnidadId);
        return Ok(MapearActividadDto(act));
    }

    [HttpPost]
    [RequierePermiso(PermisosConstantes.ActividadesCrear)]
    public async Task<ActionResult<ActividadDto>> CrearActividad([FromBody] GuardarActividadDto dto, CancellationToken ct)
    {
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);

        var consecutivo = await db.Actividades.CountAsync(ct) + 1;
        var codigo = $"ACT-{consecutivo:D4}";
        while (await db.Actividades.AnyAsync(a => a.Codigo == codigo, ct))
        {
            consecutivo++;
            codigo = $"ACT-{consecutivo:D4}";
        }

        var estado = await db.EstadosActividad.FindAsync([dto.EstadoActividadId], ct)
            ?? throw new DomainRuleException("Estado de actividad inválido.");

        var actividad = new Actividad
        {
            Codigo = codigo,
            ProyectoId = dto.ProyectoId,
            FaseProyectoId = dto.FaseProyectoId,
            ActividadPadreId = dto.ActividadPadreId,
            UnidadId = dto.UnidadId,
            DepartamentoId = dto.DepartamentoId,
            EquipoId = dto.EquipoId,
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            PrioridadId = dto.PrioridadId,
            EstadoActividadId = dto.EstadoActividadId,
            FechaInicio = dto.FechaInicio,
            FechaVencimiento = dto.FechaVencimiento,
            TiempoEstimadoMinutos = Math.Max(0, dto.TiempoEstimadoMinutos),
            PorcentajeAvance = estado.Codigo == "COMPLETADA" ? 100m : Math.Clamp(dto.PorcentajeAvance, 0m, 100m),
            EsRecurrente = dto.EsRecurrente,
            PatronRecurrencia = dto.PatronRecurrencia,
            CreadoPorId = currentUser.UsuarioId,
            ModificadoPorId = currentUser.UsuarioId
        };

        db.Actividades.Add(actividad);
        await db.SaveChangesAsync(ct);

        var principalId = dto.ResponsablePrincipalId ?? dto.ResponsablesIds.FirstOrDefault();
        foreach (var usrId in dto.ResponsablesIds.Distinct())
        {
            db.ActividadAsignados.Add(new ActividadAsignado
            {
                ActividadId = actividad.Id,
                UsuarioId = usrId,
                EsPrincipal = usrId == principalId,
                AsignadoPorId = currentUser.UsuarioId
            });

            if (usrId != currentUser.UsuarioId)
            {
                await notificationService.EnviarNotificacionAsync(
                    usrId,
                    "ActividadAsignada",
                    $"Nueva actividad asignada: {actividad.Codigo}",
                    actividad.Titulo,
                    "/actividades",
                    ct);
            }
        }

        db.ActividadHistorial.Add(new ActividadHistorial
        {
            ActividadId = actividad.Id,
            UsuarioId = currentUser.UsuarioId,
            TipoCambio = "Creación",
            ValorNuevo = estado.Nombre,
            Detalle = $"Actividad '{actividad.Titulo}' registrada."
        });

        await db.SaveChangesAsync(ct);
        if (actividad.ProyectoId.HasValue)
        {
            await RecalcularAvanceProyectoAsync(actividad.ProyectoId.Value, ct);
        }

        return await ObtenerPorId(actividad.Id, ct);
    }

    [HttpPut("{id:int}")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<ActividadDto>> ActualizarActividad(int id, [FromBody] GuardarActividadDto dto, CancellationToken ct)
    {
        var actividad = await db.Actividades
            .Include(a => a.Asignados)
            .Include(a => a.EstadoActividad)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);

        actividad.ProyectoId = dto.ProyectoId;
        actividad.FaseProyectoId = dto.FaseProyectoId;
        actividad.UnidadId = dto.UnidadId;
        actividad.DepartamentoId = dto.DepartamentoId;
        actividad.EquipoId = dto.EquipoId;
        actividad.Titulo = dto.Titulo.Trim();
        actividad.Descripcion = dto.Descripcion?.Trim();
        actividad.PrioridadId = dto.PrioridadId;
        actividad.FechaInicio = dto.FechaInicio;
        actividad.FechaVencimiento = dto.FechaVencimiento;
        actividad.TiempoEstimadoMinutos = Math.Max(0, dto.TiempoEstimadoMinutos);
        actividad.EsRecurrente = dto.EsRecurrente;
        actividad.PatronRecurrencia = dto.PatronRecurrencia;
        actividad.ModificadoPorId = currentUser.UsuarioId;
        actividad.FechaModificacionUtc = DateTime.UtcNow;

        if (dto.EstadoActividadId != actividad.EstadoActividadId)
        {
            await AplicarCambioEstadoInternoAsync(actividad, dto.EstadoActividadId, "Actualización desde edición de actividad", ct);
        }
        else
        {
            actividad.PorcentajeAvance = Math.Clamp(dto.PorcentajeAvance, 0m, 100m);
        }

        db.ActividadAsignados.RemoveRange(actividad.Asignados);
        var principalId = dto.ResponsablePrincipalId ?? dto.ResponsablesIds.FirstOrDefault();
        foreach (var usrId in dto.ResponsablesIds.Distinct())
        {
            db.ActividadAsignados.Add(new ActividadAsignado
            {
                ActividadId = actividad.Id,
                UsuarioId = usrId,
                EsPrincipal = usrId == principalId,
                AsignadoPorId = currentUser.UsuarioId
            });
        }

        await db.SaveChangesAsync(ct);
        if (actividad.ProyectoId.HasValue)
        {
            await RecalcularAvanceProyectoAsync(actividad.ProyectoId.Value, ct);
        }

        return await ObtenerPorId(actividad.Id, ct);
    }

    [HttpPatch("{id:int}/estado")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<ActividadDto>> CambiarEstado(int id, [FromBody] CambiarEstadoActividadDto dto, CancellationToken ct)
    {
        var actividad = await db.Actividades
            .Include(a => a.EstadoActividad)
            .Include(a => a.Checklists)
            .Include(a => a.Subtareas).ThenInclude(s => s.EstadoActividad)
            .Include(a => a.Dependencias).ThenInclude(d => d.ActividadPredecesora).ThenInclude(p => p!.EstadoActividad)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        await AplicarCambioEstadoInternoAsync(actividad, dto.NuevoEstadoActividadId, dto.Comentario, ct);
        await db.SaveChangesAsync(ct);

        if (actividad.ProyectoId.HasValue)
        {
            await RecalcularAvanceProyectoAsync(actividad.ProyectoId.Value, ct);
        }

        return await ObtenerPorId(actividad.Id, ct);
    }

    [HttpPost("{id:int}/checklists")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<ChecklistItemDto>> AgregarChecklistItem(int id, [FromBody] CrearChecklistItemDto dto, CancellationToken ct)
    {
        var actividad = await db.Actividades
            .Include(a => a.Checklists)
            .Include(a => a.EstadoActividad)
            .Include(a => a.Subtareas)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        var item = new ActividadChecklist
        {
            ActividadId = id,
            Titulo = dto.Titulo.Trim(),
            Orden = actividad.Checklists.Count + 1,
            Completado = false
        };
        db.ActividadChecklists.Add(item);
        await db.SaveChangesAsync(ct);

        await RecalcularAvanceActividadYProyectoAsync(id, ct);

        return Ok(new ChecklistItemDto(item.Id, item.ActividadId, item.Titulo, item.Orden, item.Completado, item.FechaCompletadoUtc));
    }

    [HttpPatch("{id:int}/checklists/{itemId:int}/toggle")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<ChecklistItemDto>> ToggleChecklistItem(int id, int itemId, CancellationToken ct)
    {
        var actividad = await db.Actividades.FindAsync([id], ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        var item = await db.ActividadChecklists.FirstOrDefaultAsync(c => c.Id == itemId && c.ActividadId == id, ct)
            ?? throw new DomainRuleException("Elemento de checklist no encontrado.", "NO_ENCONTRADO", 404);

        item.Completado = !item.Completado;
        item.CompletadoPorId = item.Completado ? currentUser.UsuarioId : null;
        item.FechaCompletadoUtc = item.Completado ? DateTime.UtcNow : null;

        await db.SaveChangesAsync(ct);
        await RecalcularAvanceActividadYProyectoAsync(id, ct);

        return Ok(new ChecklistItemDto(item.Id, item.ActividadId, item.Titulo, item.Orden, item.Completado, item.FechaCompletadoUtc));
    }

    [HttpPost("{id:int}/dependencias")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<ActividadDto>> AgregarDependencia(int id, [FromBody] CrearDependenciaDto dto, CancellationToken ct)
    {
        var actividad = await db.Actividades.FindAsync([id], ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);
        var predecesora = await db.Actividades.FindAsync([dto.ActividadPredecesoraId], ct)
            ?? throw new DomainRuleException("Actividad predecesora no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        var todasDependencias = await db.ActividadDependencias
            .AsNoTracking()
            .Select(d => new ValueTuple<int, int>(d.ActividadId, d.ActividadPredecesoraId))
            .ToListAsync(ct);

        if (ReglasNegocioService.TieneDependenciaCircular(id, dto.ActividadPredecesoraId, todasDependencias))
        {
            throw new DomainRuleException(
                $"No se puede vincular la dependencia con {predecesora.Codigo} porque generaría una dependencia circular.",
                "DEPENDENCIA_CIRCULAR");
        }

        if (await db.ActividadDependencias.AnyAsync(d => d.ActividadId == id && d.ActividadPredecesoraId == dto.ActividadPredecesoraId, ct))
        {
            throw new DomainRuleException("La dependencia seleccionada ya se encuentra registrada.");
        }

        db.ActividadDependencias.Add(new ActividadDependencia
        {
            ActividadId = id,
            ActividadPredecesoraId = dto.ActividadPredecesoraId,
            TipoDependencia = dto.TipoDependencia
        });

        db.ActividadHistorial.Add(new ActividadHistorial
        {
            ActividadId = id,
            UsuarioId = currentUser.UsuarioId,
            TipoCambio = "Dependencia",
            ValorNuevo = predecesora.Codigo,
            Detalle = $"Se agregó dependencia con la actividad predecesora {predecesora.Codigo}."
        });

        await db.SaveChangesAsync(ct);
        return await ObtenerPorId(id, ct);
    }

    [HttpPost("{id:int}/tiempos")]
    [RequierePermiso(PermisosConstantes.ActividadesEditar)]
    public async Task<ActionResult<TiempoActividadDto>> RegistrarTiempo(int id, [FromBody] RegistrarTiempoActividadDto dto, CancellationToken ct)
    {
        var actividad = await db.Actividades.FindAsync([id], ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);
        var usuarioId = currentUser.UsuarioId ?? throw new DomainRuleException("Usuario no autenticado.", "NO_AUTENTICADO", 401);

        var tiempo = new ActividadTiempo
        {
            ActividadId = id,
            UsuarioId = usuarioId,
            MinutosTrabajados = dto.MinutosTrabajados,
            FechaTrabajo = dto.FechaTrabajo,
            Descripcion = dto.Descripcion?.Trim()
        };
        db.ActividadTiempos.Add(tiempo);
        await db.SaveChangesAsync(ct);

        return Ok(new TiempoActividadDto(
            tiempo.Id,
            tiempo.ActividadId,
            tiempo.UsuarioId,
            currentUser.NombreUsuario ?? "",
            tiempo.MinutosTrabajados,
            tiempo.FechaTrabajo,
            tiempo.Descripcion,
            tiempo.FechaRegistroUtc));
    }

    [HttpPost("{id:int}/duplicar")]
    [RequierePermiso(PermisosConstantes.ActividadesCrear)]
    public async Task<ActionResult<ActividadDto>> DuplicarActividad(int id, CancellationToken ct)
    {
        var origen = await db.Actividades
            .Include(a => a.Asignados)
            .Include(a => a.Checklists)
            .FirstOrDefaultAsync(a => a.Id == id, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(origen.UnidadId);
        var estadoInicial = await db.EstadosActividad.OrderBy(e => e.Orden).FirstAsync(ct);

        var dto = new GuardarActividadDto(
            origen.ProyectoId,
            origen.FaseProyectoId,
            origen.ActividadPadreId,
            origen.UnidadId,
            origen.DepartamentoId,
            origen.EquipoId,
            $"{origen.Titulo} (Copia)",
            origen.Descripcion,
            origen.PrioridadId,
            estadoInicial.Id,
            DateOnly.FromDateTime(DateTime.UtcNow),
            origen.FechaVencimiento?.AddDays(7),
            origen.TiempoEstimadoMinutos,
            0m,
            origen.EsRecurrente,
            origen.PatronRecurrencia,
            origen.Asignados.Select(a => a.UsuarioId).ToList(),
            origen.Asignados.FirstOrDefault(a => a.EsPrincipal)?.UsuarioId);

        var resultado = await CrearActividad(dto, ct);
        var nuevaId = resultado.Value!.Id;

        foreach (var chk in origen.Checklists.OrderBy(c => c.Orden))
        {
            db.ActividadChecklists.Add(new ActividadChecklist
            {
                ActividadId = nuevaId,
                Titulo = chk.Titulo,
                Orden = chk.Orden,
                Completado = false
            });
        }
        await db.SaveChangesAsync(ct);

        return await ObtenerPorId(nuevaId, ct);
    }

    private async Task AplicarCambioEstadoInternoAsync(Actividad actividad, int nuevoEstadoId, string? comentario, CancellationToken ct)
    {
        var estadoNuevo = await db.EstadosActividad.FindAsync([nuevoEstadoId], ct)
            ?? throw new DomainRuleException("Estado de actividad no encontrado.");

        if (estadoNuevo.Codigo == "COMPLETADA" && !currentUser.TienePermiso(PermisosConstantes.ActividadesCerrar))
        {
            throw new DomainRuleException("No cuenta con el permiso 'actividades.cerrar' para completar actividades.", "PERMISO_INSUFICIENTE", 403);
        }

        var predecesorasIncompletas = await db.ActividadDependencias
            .Include(d => d.ActividadPredecesora).ThenInclude(p => p!.EstadoActividad)
            .AnyAsync(d => d.ActividadId == actividad.Id &&
                           d.ActividadPredecesora != null &&
                           d.ActividadPredecesora.EstadoActividad!.Codigo != "COMPLETADA", ct);

        var subtareasIncompletas = await db.Actividades
            .Include(s => s.EstadoActividad)
            .AnyAsync(s => s.ActividadPadreId == actividad.Id &&
                           !s.Archivada &&
                           s.EstadoActividad!.Codigo != "COMPLETADA" &&
                           s.EstadoActividad.Codigo != "CANCELADA", ct);

        var codigoActual = actividad.EstadoActividad?.Codigo ?? "PENDIENTE";
        var nombreActual = actividad.EstadoActividad?.Nombre ?? "Pendiente";

        ReglasNegocioService.ValidarTransicionActividad(
            codigoActual,
            estadoNuevo.Codigo,
            predecesorasIncompletas,
            subtareasIncompletas);

        actividad.EstadoActividadId = estadoNuevo.Id;
        actividad.ModificadoPorId = currentUser.UsuarioId;
        actividad.FechaModificacionUtc = DateTime.UtcNow;

        var checklists = await db.ActividadChecklists.Where(c => c.ActividadId == actividad.Id).Select(c => c.Completado).ToListAsync(ct);
        var subtareas = await db.Actividades.Where(s => s.ActividadPadreId == actividad.Id && !s.Archivada).Select(s => s.PorcentajeAvance).ToListAsync(ct);

        actividad.PorcentajeAvance = ReglasNegocioService.CalcularAvanceActividad(
            estadoNuevo.Codigo,
            checklists,
            subtareas,
            actividad.PorcentajeAvance);

        if (estadoNuevo.Codigo == "COMPLETADA")
        {
            actividad.FechaFinalizacionRealUtc = DateTime.UtcNow;
            await notificationService.EvaluarAutomatizacionesAsync(
                "ActividadCompletada",
                $"La actividad {actividad.Codigo} ({actividad.Titulo}) fue completada.",
                currentUser.UsuarioId,
                "/actividades",
                ct);
        }

        db.ActividadHistorial.Add(new ActividadHistorial
        {
            ActividadId = actividad.Id,
            UsuarioId = currentUser.UsuarioId,
            TipoCambio = "Estado",
            ValorAnterior = nombreActual,
            ValorNuevo = estadoNuevo.Nombre,
            Detalle = comentario ?? $"Cambio de estado de '{nombreActual}' a '{estadoNuevo.Nombre}'."
        });
    }

    private async Task RecalcularAvanceActividadYProyectoAsync(int actividadId, CancellationToken ct)
    {
        var act = await db.Actividades
            .Include(a => a.EstadoActividad)
            .Include(a => a.Checklists)
            .Include(a => a.Subtareas)
            .FirstOrDefaultAsync(a => a.Id == actividadId, ct);

        if (act == null) return;

        act.PorcentajeAvance = ReglasNegocioService.CalcularAvanceActividad(
            act.EstadoActividad?.Codigo ?? "EN_PROGRESO",
            act.Checklists.Select(c => c.Completado).ToList(),
            act.Subtareas.Where(s => !s.Archivada).Select(s => s.PorcentajeAvance).ToList(),
            act.PorcentajeAvance);

        await db.SaveChangesAsync(ct);

        if (act.ProyectoId.HasValue)
        {
            await RecalcularAvanceProyectoAsync(act.ProyectoId.Value, ct);
        }
    }

    private async Task RecalcularAvanceProyectoAsync(int proyectoId, CancellationToken ct)
    {
        var proyecto = await db.Proyectos
            .Include(p => p.Actividades).ThenInclude(a => a.EstadoActividad)
            .Include(p => p.Actividades).ThenInclude(a => a.Prioridad)
            .FirstOrDefaultAsync(p => p.Id == proyectoId, ct);

        if (proyecto == null) return;

        var datos = proyecto.Actividades
            .Where(a => !a.Archivada && a.ActividadPadreId == null)
            .Select(a => (a.PorcentajeAvance, a.EstadoActividad?.Codigo ?? "PENDIENTE", a.Prioridad?.Nivel ?? 1))
            .ToList();

        proyecto.PorcentajeAvance = ReglasNegocioService.CalcularAvanceProyecto(datos);
        await db.SaveChangesAsync(ct);
    }

    private IQueryable<Actividad> ConstruirQueryCompleta() =>
        db.Actividades
            .AsNoTracking()
            .Include(a => a.Proyecto)
            .Include(a => a.FaseProyecto)
            .Include(a => a.Unidad)
            .Include(a => a.Departamento)
            .Include(a => a.Equipo)
            .Include(a => a.Prioridad)
            .Include(a => a.EstadoActividad)
            .Include(a => a.Subtareas).ThenInclude(s => s.EstadoActividad)
            .Include(a => a.Asignados).ThenInclude(asig => asig.Usuario)
            .Include(a => a.Checklists)
            .Include(a => a.Dependencias).ThenInclude(d => d.ActividadPredecesora).ThenInclude(p => p!.EstadoActividad)
            .Include(a => a.Tiempos).ThenInclude(t => t.Usuario)
            .Include(a => a.Historial).ThenInclude(h => h.Usuario)
            .Include(a => a.TicketActividades).ThenInclude(ta => ta.Ticket);

    private static ActividadDto MapearActividadDto(Actividad a)
    {
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var estaVencida = a.FechaVencimiento.HasValue &&
                          a.FechaVencimiento.Value < hoy &&
                          a.EstadoActividad?.EsFinal != true;

        var subtareasActivas = a.Subtareas.Where(s => !s.Archivada).ToList();

        return new ActividadDto(
            a.Id,
            a.Codigo,
            a.ProyectoId,
            a.Proyecto?.Codigo,
            a.Proyecto?.Nombre,
            a.FaseProyectoId,
            a.FaseProyecto?.Nombre,
            a.ActividadPadreId,
            a.UnidadId,
            a.Unidad?.Nombre ?? "",
            a.DepartamentoId,
            a.Departamento?.Nombre,
            a.EquipoId,
            a.Equipo?.Nombre,
            a.Titulo,
            a.Descripcion,
            a.PrioridadId,
            a.Prioridad?.Codigo ?? "",
            a.Prioridad?.Nombre ?? "",
            a.Prioridad?.ColorHex ?? "#2563EB",
            a.EstadoActividadId,
            a.EstadoActividad?.Codigo ?? "",
            a.EstadoActividad?.Nombre ?? "",
            a.EstadoActividad?.ColorHex ?? "#64748B",
            a.FechaInicio,
            a.FechaVencimiento,
            a.FechaFinalizacionRealUtc,
            a.TiempoEstimadoMinutos,
            a.Tiempos.Sum(t => t.MinutosTrabajados),
            a.PorcentajeAvance,
            a.EsRecurrente,
            a.PatronRecurrencia,
            a.Archivada,
            estaVencida,
            subtareasActivas.Count,
            subtareasActivas.Count(s => s.EstadoActividad?.Codigo == "COMPLETADA"),
            a.Checklists.Count,
            a.Checklists.Count(c => c.Completado),
            a.FechaCreacionUtc,
            a.Asignados.Where(x => x.Usuario != null).Select(x => new ActividadAsignadoDto(
                x.UsuarioId, x.Usuario!.NombreCompleto, x.Usuario.Email, x.EsPrincipal)).ToList(),
            a.Checklists.OrderBy(c => c.Orden).Select(c => new ChecklistItemDto(
                c.Id, c.ActividadId, c.Titulo, c.Orden, c.Completado, c.FechaCompletadoUtc)).ToList(),
            a.Dependencias.Where(d => d.ActividadPredecesora != null).Select(d => new DependenciaActividadDto(
                d.Id, d.ActividadId, d.ActividadPredecesoraId, d.ActividadPredecesora!.Codigo,
                d.ActividadPredecesora.Titulo, d.ActividadPredecesora.EstadoActividad?.Nombre ?? "", d.TipoDependencia)).ToList(),
            a.Tiempos.OrderByDescending(t => t.FechaTrabajo).Select(t => new TiempoActividadDto(
                t.Id, t.ActividadId, t.UsuarioId, t.Usuario?.NombreCompleto ?? "", t.MinutosTrabajados,
                t.FechaTrabajo, t.Descripcion, t.FechaRegistroUtc)).ToList(),
            a.Historial.OrderByDescending(h => h.FechaCambioUtc).Select(h => new ActividadHistorialDto(
                h.Id, h.ActividadId, h.Usuario?.NombreCompleto, h.TipoCambio, h.ValorAnterior,
                h.ValorNuevo, h.Detalle, h.FechaCambioUtc)).ToList(),
            a.TicketActividades.Where(ta => ta.Ticket != null).Select(ta => ta.Ticket!.Folio).ToList());
    }
}

[ApiController]
[Route("api")]
[Authorize]
public class ComentariosYAdjuntosController(
    ApplicationDbContext db,
    ICurrentUserService currentUser,
    IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".xlsx", ".csv", ".txt", ".zip"
    };

    [HttpGet("{entidad}/{id:int}/comentarios")]
    public async Task<ActionResult<IReadOnlyList<ComentarioDto>>> ListarComentarios(string entidad, int id, CancellationToken ct)
    {
        await ValidarAlcanceEntidadAsync(entidad, id, ct);

        var query = db.Comentarios.AsNoTracking().Include(c => c.Autor).AsQueryable();
        query = entidad.ToLowerInvariant() switch
        {
            "proyectos" => query.Where(c => c.ProyectoId == id),
            "actividades" => query.Where(c => c.ActividadId == id),
            "tickets" => query.Where(c => c.TicketId == id),
            _ => throw new DomainRuleException("Entidad no soportada para comentarios.")
        };

        // Si es solicitante sin permiso de atender tickets, ocultar notas técnicas internas
        if (entidad.Equals("tickets", StringComparison.OrdinalIgnoreCase) &&
            !currentUser.TienePermiso(PermisosConstantes.TicketsAtender))
        {
            query = query.Where(c => !c.EsInterno);
        }

        var items = await query.OrderBy(c => c.FechaCreacionUtc).ToListAsync(ct);
        return Ok(items.Select(c => new ComentarioDto(
            c.Id, c.ProyectoId, c.ActividadId, c.TicketId, c.AutorId,
            c.Autor?.NombreCompleto ?? "", c.Contenido, c.MencionesJson, c.EsInterno, c.FechaCreacionUtc)).ToList());
    }

    [HttpPost("{entidad}/{id:int}/comentarios")]
    public async Task<ActionResult<ComentarioDto>> CrearComentario(string entidad, int id, [FromBody] CrearComentarioDto dto, CancellationToken ct)
    {
        await ValidarAlcanceEntidadAsync(entidad, id, ct);
        var autorId = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión inválida.", "NO_AUTENTICADO", 401);

        var comentario = new Comentario
        {
            AutorId = autorId,
            Contenido = dto.Contenido.Trim(),
            EsInterno = dto.EsInterno && currentUser.TienePermiso(PermisosConstantes.TicketsAtender),
            MencionesJson = dto.MencionesJson
        };

        switch (entidad.ToLowerInvariant())
        {
            case "proyectos":
                comentario.ProyectoId = id;
                break;
            case "actividades":
                comentario.ActividadId = id;
                break;
            case "tickets":
                comentario.TicketId = id;
                var ticket = await db.Tickets.FindAsync([id], ct);
                if (ticket != null && !comentario.EsInterno && ticket.FechaPrimeraRespuestaUtc == null && ticket.SolicitanteId != autorId)
                {
                    ticket.FechaPrimeraRespuestaUtc = DateTime.UtcNow;
                }
                break;
            default:
                throw new DomainRuleException("Entidad no soportada.");
        }

        db.Comentarios.Add(comentario);
        await db.SaveChangesAsync(ct);

        return Ok(new ComentarioDto(
            comentario.Id, comentario.ProyectoId, comentario.ActividadId, comentario.TicketId,
            comentario.AutorId, currentUser.NombreUsuario ?? "", comentario.Contenido,
            comentario.MencionesJson, comentario.EsInterno, comentario.FechaCreacionUtc));
    }

    [HttpGet("{entidad}/{id:int}/adjuntos")]
    public async Task<ActionResult<IReadOnlyList<AdjuntoDto>>> ListarAdjuntos(string entidad, int id, CancellationToken ct)
    {
        await ValidarAlcanceEntidadAsync(entidad, id, ct);

        var query = db.Adjuntos.AsNoTracking().Include(a => a.SubidoPor).AsQueryable();
        query = entidad.ToLowerInvariant() switch
        {
            "proyectos" => query.Where(a => a.ProyectoId == id),
            "actividades" => query.Where(a => a.ActividadId == id),
            "tickets" => query.Where(a => a.TicketId == id),
            _ => throw new DomainRuleException("Entidad no soportada.")
        };

        var items = await query.OrderByDescending(a => a.FechaSubidaUtc).ToListAsync(ct);
        return Ok(items.Select(a => new AdjuntoDto(
            a.Id, a.ProyectoId, a.ActividadId, a.TicketId, a.NombreOriginal, a.ContentType,
            a.TamanoBytes, a.EsEvidencia, a.SubidoPorId, a.SubidoPor?.NombreCompleto ?? "", a.FechaSubidaUtc)).ToList());
    }

    [HttpPost("{entidad}/{id:int}/adjuntos")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<AdjuntoDto>> SubirAdjunto(
        string entidad,
        int id,
        IFormFile archivo,
        [FromQuery] bool esEvidencia = true,
        CancellationToken ct = default)
    {
        await ValidarAlcanceEntidadAsync(entidad, id, ct);
        if (archivo == null || archivo.Length == 0)
            throw new DomainRuleException("El archivo proporcionado está vacío.");

        if (archivo.Length > 15 * 1024 * 1024)
            throw new DomainRuleException("El tamaño del archivo excede el límite permitido de 15 MB.");

        var nombreSeguro = Path.GetFileName(archivo.FileName);
        var ext = Path.GetExtension(nombreSeguro);
        if (string.IsNullOrWhiteSpace(ext) || !ExtensionesPermitidas.Contains(ext))
        {
            throw new DomainRuleException($"La extensión de archivo '{ext}' no está permitida por políticas de seguridad.");
        }

        var carpetaBase = Path.Combine(env.ContentRootPath, "App_Data", "Uploads", DateTime.UtcNow.ToString("yyyyMM"));
        Directory.CreateDirectory(carpetaBase);

        var nombreAlmacenado = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var rutaCompleta = Path.Combine(carpetaBase, nombreAlmacenado);

        string hashSha256;
        await using (var fs = new FileStream(rutaCompleta, FileMode.Create))
        {
            await archivo.CopyToAsync(fs, ct);
            fs.Position = 0;
            var hashBytes = await SHA256.HashDataAsync(fs, ct);
            hashSha256 = Convert.ToHexString(hashBytes);
        }

        var adjunto = new Adjunto
        {
            NombreOriginal = nombreSeguro,
            NombreAlmacenado = nombreAlmacenado,
            RutaRelativa = Path.Combine(DateTime.UtcNow.ToString("yyyyMM"), nombreAlmacenado),
            ContentType = string.IsNullOrWhiteSpace(archivo.ContentType) ? "application/octet-stream" : archivo.ContentType,
            TamanoBytes = archivo.Length,
            HashSha256 = hashSha256,
            EsEvidencia = esEvidencia,
            SubidoPorId = currentUser.UsuarioId ?? 1
        };

        switch (entidad.ToLowerInvariant())
        {
            case "proyectos": adjunto.ProyectoId = id; break;
            case "actividades": adjunto.ActividadId = id; break;
            case "tickets": adjunto.TicketId = id; break;
        }

        db.Adjuntos.Add(adjunto);
        await db.SaveChangesAsync(ct);

        return Ok(new AdjuntoDto(
            adjunto.Id, adjunto.ProyectoId, adjunto.ActividadId, adjunto.TicketId,
            adjunto.NombreOriginal, adjunto.ContentType, adjunto.TamanoBytes, adjunto.EsEvidencia,
            adjunto.SubidoPorId, currentUser.NombreUsuario ?? "", adjunto.FechaSubidaUtc));
    }

    [HttpGet("adjuntos/{id:int}/descargar")]
    public async Task<IActionResult> DescargarAdjunto(int id, CancellationToken ct)
    {
        var adjunto = await db.Adjuntos.FindAsync([id], ct)
            ?? throw new DomainRuleException("Archivo adjunto no encontrado.", "NO_ENCONTRADO", 404);

        if (adjunto.ProyectoId.HasValue) await ValidarAlcanceEntidadAsync("proyectos", adjunto.ProyectoId.Value, ct);
        if (adjunto.ActividadId.HasValue) await ValidarAlcanceEntidadAsync("actividades", adjunto.ActividadId.Value, ct);
        if (adjunto.TicketId.HasValue) await ValidarAlcanceEntidadAsync("tickets", adjunto.TicketId.Value, ct);

        var carpetaBase = Path.GetFullPath(Path.Combine(env.ContentRootPath, "App_Data", "Uploads"));
        var rutaArchivo = Path.GetFullPath(Path.Combine(carpetaBase, adjunto.RutaRelativa));

        if (!rutaArchivo.StartsWith(carpetaBase, StringComparison.OrdinalIgnoreCase) || !System.IO.File.Exists(rutaArchivo))
        {
            throw new DomainRuleException("El archivo físico solicitado no se encuentra disponible.", "NO_ENCONTRADO", 404);
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(rutaArchivo, ct);
        return File(bytes, adjunto.ContentType, adjunto.NombreOriginal);
    }

    private async Task ValidarAlcanceEntidadAsync(string entidad, int id, CancellationToken ct)
    {
        int unidadId = entidad.ToLowerInvariant() switch
        {
            "proyectos" => (await db.Proyectos.FindAsync([id], ct) ?? throw new DomainRuleException("Proyecto no encontrado.", "NO_ENCONTRADO", 404)).UnidadId,
            "actividades" => (await db.Actividades.FindAsync([id], ct) ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404)).UnidadId,
            "tickets" => (await db.Tickets.FindAsync([id], ct) ?? throw new DomainRuleException("Ticket no encontrado.", "NO_ENCONTRADO", 404)).UnidadId,
            _ => throw new DomainRuleException("Entidad inválida.")
        };

        currentUser.ExigirAlcanceUnidad(unidadId);
    }
}
