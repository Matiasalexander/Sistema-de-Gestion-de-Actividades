using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.API.Hubs;
using SistemaGestionGA.API.Security;
using SistemaGestionGA.Application.DTOs;
using SistemaGestionGA.Application.Interfaces;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Infrastructure.Persistence;
using SistemaGestionGA.Shared.Constants;
using SistemaGestionGA.Shared.Models;

namespace SistemaGestionGA.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController(
    ApplicationDbContext db,
    ICurrentUserService currentUser,
    IHubContext<NotificacionesHub> hubContext) : ControllerBase
{
    [HttpGet("grupos")]
    public async Task<ActionResult<IReadOnlyList<ChatGrupoDto>>> ListarGrupos(
        [FromQuery] int? unidadId,
        [FromQuery] string? busqueda,
        CancellationToken ct = default)
    {
        var uid = currentUser.UsuarioId ?? 0;
        var query = db.ChatGrupos
            .AsNoTracking()
            .Where(g => g.Activo)
            .Include(g => g.Unidad)
            .Include(g => g.CreadoPor)
            .Include(g => g.ActividadActiva).ThenInclude(a => a!.EstadoActividad)
            .Include(g => g.Miembros).ThenInclude(m => m.Usuario)
            .Include(g => g.Mensajes)
            .AsQueryable();

        if (unidadId.HasValue)
        {
            currentUser.ExigirAlcanceUnidad(unidadId.Value);
            query = query.Where(g => g.UnidadId == unidadId.Value);
        }
        else if (!currentUser.AccesoGlobalUnidades && !currentUser.TienePermiso(PermisosConstantes.ChatCrear))
        {
            query = query.Where(g => g.Miembros.Any(m => m.UsuarioId == uid));
        }

        if (!string.IsNullOrWhiteSpace(busqueda))
        {
            var b = busqueda.Trim().ToLower();
            query = query.Where(g => g.Nombre.ToLower().Contains(b) || (g.Descripcion != null && g.Descripcion.ToLower().Contains(b)));
        }

        var grupos = await query
            .OrderByDescending(g => g.Mensajes.Max(m => (DateTime?)m.FechaCreacionUtc) ?? g.FechaCreacionUtc)
            .ToListAsync(ct);

        return Ok(grupos.Select(MapearGrupoDto).ToList());
    }

    [HttpGet("grupos/{id:int}")]
    public async Task<ActionResult<ChatGrupoDto>> ObtenerGrupo(int id, CancellationToken ct)
    {
        var grupo = await db.ChatGrupos
            .AsNoTracking()
            .Include(g => g.Unidad)
            .Include(g => g.CreadoPor)
            .Include(g => g.ActividadActiva).ThenInclude(a => a!.EstadoActividad)
            .Include(g => g.Miembros).ThenInclude(m => m.Usuario)
            .Include(g => g.Mensajes)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo de chat no encontrado.", "NO_ENCONTRADO", 404);

        ValidarAccesoGrupo(grupo);
        return Ok(MapearGrupoDto(grupo));
    }

    [HttpPost("grupos")]
    public async Task<ActionResult<ChatGrupoDto>> CrearGrupo([FromBody] CrearChatGrupoDto dto, CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión inválida.", "NO_AUTENTICADO", 401);
        currentUser.ExigirAlcanceUnidad(dto.UnidadId);

        var grupo = new ChatGrupo
        {
            Nombre = dto.Nombre.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            UnidadId = dto.UnidadId,
            CreadoPorId = uid,
            Activo = true,
            FechaCreacionUtc = DateTime.UtcNow
        };

        // El creador es miembro administrador
        grupo.Miembros.Add(new ChatGrupoMiembro
        {
            UsuarioId = uid,
            EsAdmin = true,
            FechaUnionUtc = DateTime.UtcNow
        });

        // Agregar miembros adicionales seleccionados
        if (dto.MiembrosIds != null)
        {
            var miembrosUnicos = dto.MiembrosIds.Where(mId => mId != uid).Distinct();
            foreach (var mId in miembrosUnicos)
            {
                if (await db.Usuarios.AnyAsync(u => u.Id == mId && u.Activo, ct))
                {
                    grupo.Miembros.Add(new ChatGrupoMiembro
                    {
                        UsuarioId = mId,
                        EsAdmin = false,
                        FechaUnionUtc = DateTime.UtcNow
                    });
                }
            }
        }

        // Mensaje inicial de bienvenida / sistema
        grupo.Mensajes.Add(new ChatMensaje
        {
            UsuarioId = uid,
            Texto = $"💬 Grupo creado por {currentUser.NombreCompleto}. Este canal está listo para solicitudes y seguimiento interactivo de actividades.",
            TipoMensaje = "Sistema",
            FechaCreacionUtc = DateTime.UtcNow
        });

        db.ChatGrupos.Add(grupo);
        await db.SaveChangesAsync(ct);

        return await ObtenerGrupo(grupo.Id, ct);
    }

    [HttpDelete("grupos/{id:int}")]
    public async Task<IActionResult> EliminarGrupo(int id, CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión inválida.", "NO_AUTENTICADO", 401);
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo de chat no encontrado.", "NO_ENCONTRADO", 404);

        var esAdminGrupo = grupo.Miembros.Any(m => m.UsuarioId == uid && m.EsAdmin) || grupo.CreadoPorId == uid;
        var tienePermisoAdmin = currentUser.AccesoGlobalUnidades ||
            (currentUser.UnidadesAutorizadas.Contains(grupo.UnidadId) && currentUser.TienePermiso(PermisosConstantes.ChatCrear));

        if (!esAdminGrupo && !tienePermisoAdmin)
        {
            throw new DomainRuleException("No tienes permisos de administrador para eliminar este grupo de chat.", "NO_AUTORIZADO", 403);
        }

        var miembrosIds = grupo.Miembros.Select(m => m.UsuarioId).Distinct().ToList();
        var nombreGrupo = grupo.Nombre;

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        // 1. Romper la referencia circular entre ChatGrupos y Actividades
        grupo.ActividadActivaId = null;

        var actividadesVinculadas = await db.Actividades
            .Where(a => a.ChatGrupoId == grupo.Id)
            .ToListAsync(ct);

        foreach (var act in actividadesVinculadas)
        {
            act.ChatGrupoId = null;
            db.ActividadHistorial.Add(new ActividadHistorial
            {
                ActividadId = act.Id,
                UsuarioId = uid,
                TipoCambio = "Eliminación de Grupo WhatsApp",
                Detalle = $"El grupo de chat '{nombreGrupo}' vinculado a esta actividad fue eliminado por {currentUser.NombreCompleto}."
            });
        }

        await db.SaveChangesAsync(ct);

        // 2. Eliminar mensajes, miembros y el registro del grupo
        var mensajes = await db.ChatMensajes.Where(m => m.ChatGrupoId == grupo.Id).ToListAsync(ct);
        db.ChatMensajes.RemoveRange(mensajes);
        db.ChatGrupoMiembros.RemoveRange(grupo.Miembros);
        db.ChatGrupos.Remove(grupo);

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = uid,
            NombreUsuario = currentUser.NombreUsuario,
            Modulo = "Chat",
            Accion = "ELIMINAR_GRUPO",
            Entidad = nameof(ChatGrupo),
            EntidadId = id.ToString(),
            UnidadId = grupo.UnidadId,
            Resumen = $"Eliminación del grupo de chat '{nombreGrupo}'",
            ValoresAnteriores = JsonSerializer.Serialize(new { grupo.Id, grupo.Nombre, grupo.UnidadId }),
            IpAddress = currentUser.IpAddress,
            FechaEventoUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        // 3. Notificar por SignalR a los miembros para actualizar su vista en tiempo real
        try
        {
            foreach (var mId in miembrosIds)
            {
                await hubContext.Clients.Group($"user:{mId}").SendAsync("GrupoChatEliminado", new { grupoId = id }, ct);
            }
        }
        catch
        {
            // Continuación tolerante si SignalR no tiene clientes conectados
        }

        return NoContent();
    }

    [HttpPost("grupos/{id:int}/miembros")]
    public async Task<ActionResult<ChatGrupoDto>> AgregarMiembros(int id, [FromBody] AgregarMiembrosDto dto, CancellationToken ct)
    {
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        var uid = currentUser.UsuarioId ?? 0;
        var esAdminGrupo = grupo.Miembros.Any(m => m.UsuarioId == uid && m.EsAdmin);
        if (!esAdminGrupo && !currentUser.AccesoGlobalUnidades && !currentUser.TienePermiso(PermisosConstantes.ChatCrear))
        {
            throw new DomainRuleException("No tienes permisos de administrador para agregar participantes a este grupo.", "NO_AUTORIZADO", 403);
        }

        var agregadosNombres = new List<string>();
        foreach (var mId in dto.UsuariosIds.Distinct())
        {
            if (!grupo.Miembros.Any(m => m.UsuarioId == mId))
            {
                var usuario = await db.Usuarios.FindAsync([mId], ct);
                if (usuario != null && usuario.Activo)
                {
                    grupo.Miembros.Add(new ChatGrupoMiembro
                    {
                        ChatGrupoId = grupo.Id,
                        UsuarioId = mId,
                        EsAdmin = false,
                        FechaUnionUtc = DateTime.UtcNow
                    });
                    agregadosNombres.Add(usuario.NombreCompleto);
                }
            }
        }

        if (agregadosNombres.Count > 0)
        {
            var msj = new ChatMensaje
            {
                ChatGrupoId = grupo.Id,
                UsuarioId = uid,
                Texto = $"👋 {string.Join(", ", agregadosNombres)} se unió(eron) al grupo.",
                TipoMensaje = "Sistema",
                FechaCreacionUtc = DateTime.UtcNow
            };
            db.ChatMensajes.Add(msj);
        }

        await db.SaveChangesAsync(ct);
        await NotificarCambioGrupoAsync(grupo.Id, ct);

        return await ObtenerGrupo(grupo.Id, ct);
    }

    [HttpDelete("grupos/{id:int}/miembros/{usuarioId:int}")]
    public async Task<IActionResult> RemoverMiembro(int id, int usuarioId, CancellationToken ct)
    {
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        var uid = currentUser.UsuarioId ?? 0;
        var esAdmin = grupo.Miembros.Any(m => m.UsuarioId == uid && m.EsAdmin) || currentUser.AccesoGlobalUnidades;
        if (!esAdmin && uid != usuarioId)
        {
            throw new DomainRuleException("No tienes permisos para remover miembros de este grupo.", "NO_AUTORIZADO", 403);
        }

        var miembro = grupo.Miembros.FirstOrDefault(m => m.UsuarioId == usuarioId)
            ?? throw new DomainRuleException("El usuario no pertenece a este grupo.", "NO_ENCONTRADO", 404);

        db.ChatGrupoMiembros.Remove(miembro);

        var usuario = await db.Usuarios.FindAsync([usuarioId], ct);
        var nombre = usuario?.NombreCompleto ?? "Usuario";

        db.ChatMensajes.Add(new ChatMensaje
        {
            ChatGrupoId = grupo.Id,
            UsuarioId = uid,
            Texto = $"🚪 {nombre} salió del grupo.",
            TipoMensaje = "Sistema",
            FechaCreacionUtc = DateTime.UtcNow
        });

        await db.SaveChangesAsync(ct);
        await NotificarCambioGrupoAsync(grupo.Id, ct);

        return NoContent();
    }

    [HttpGet("grupos/{id:int}/mensajes")]
    public async Task<ActionResult<IReadOnlyList<ChatMensajeDto>>> ListarMensajes(int id, CancellationToken ct)
    {
        var grupo = await db.ChatGrupos
            .AsNoTracking()
            .Include(g => g.Miembros)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        ValidarAccesoGrupo(grupo);

        var uid = currentUser.UsuarioId ?? 0;
        var mensajes = await db.ChatMensajes
            .AsNoTracking()
            .Where(m => m.ChatGrupoId == id)
            .Include(m => m.Usuario)
            .Include(m => m.Actividad)
            .Include(m => m.RespondidoPorUsuario)
            .OrderBy(m => m.FechaCreacionUtc)
            .ToListAsync(ct);

        return Ok(mensajes.Select(m => MapearMensajeDto(m, uid)).ToList());
    }

    [HttpGet("actividades/{actividadId:int}/mensajes")]
    public async Task<ActionResult<IReadOnlyList<ChatMensajeDto>>> ListarMensajesPorActividad(int actividadId, CancellationToken ct)
    {
        var actividad = await db.Actividades
            .AsNoTracking()
            .Include(a => a.ChatGrupo)
            .FirstOrDefaultAsync(a => a.Id == actividadId, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        var uid = currentUser.UsuarioId ?? 0;
        var mensajes = await db.ChatMensajes
            .AsNoTracking()
            .Where(m => m.ActividadId == actividadId || (actividad.ChatGrupoId != null && m.ChatGrupoId == actividad.ChatGrupoId.Value))
            .Include(m => m.Usuario)
            .Include(m => m.Actividad)
            .Include(m => m.RespondidoPorUsuario)
            .OrderBy(m => m.FechaCreacionUtc)
            .ToListAsync(ct);

        return Ok(mensajes.Select(m => MapearMensajeDto(m, uid)).ToList());
    }

    [HttpPost("grupos/{id:int}/mensajes")]
    public async Task<ActionResult<ChatMensajeDto>> EnviarMensaje(int id, [FromBody] EnviarMensajeDto dto, CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión requerida.", "NO_AUTENTICADO", 401);
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .Include(g => g.ActividadActiva).ThenInclude(a => a!.EstadoActividad)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        ValidarAccesoGrupo(grupo);

        int? actividadId = null;

        // Si el grupo no tiene actividad activa o la que tenía ya está resuelta/completada,
        // al escribir un usuario/cliente SE CREA AUTOMÁTICAMENTE una actividad para el seguimiento.
        var actividadActiva = grupo.ActividadActiva;
        if (actividadActiva == null || actividadActiva.EstadoActividad?.EsFinal == true)
        {
            var consecutivo = await db.Actividades.CountAsync(ct) + 1;
            var codigo = $"ACT-{consecutivo:D4}";
            while (await db.Actividades.AnyAsync(a => a.Codigo == codigo, ct))
            {
                consecutivo++;
                codigo = $"ACT-{consecutivo:D4}";
            }

            var estadoInicial = await db.EstadosActividad.OrderBy(e => e.Orden).FirstOrDefaultAsync(ct)
                ?? throw new DomainRuleException("No hay estados de actividad configurados.");

            var prioridadMedia = await db.Prioridades.FirstOrDefaultAsync(p => p.Codigo == "MEDIA", ct)
                ?? await db.Prioridades.OrderBy(p => p.Nivel).Skip(1).FirstOrDefaultAsync(ct)
                ?? await db.Prioridades.FirstAsync(ct);

            var textoLimpio = dto.Texto.Trim();
            var resumenTitulo = textoLimpio.Length > 60 ? textoLimpio[..57] + "..." : textoLimpio;

            var nuevaActividad = new Actividad
            {
                Codigo = codigo,
                ChatGrupoId = grupo.Id,
                UnidadId = grupo.UnidadId,
                Titulo = $"[WhatsApp {grupo.Nombre}] {resumenTitulo}",
                Descripcion = $"Actividad generada automáticamente desde el grupo de Chat WhatsApp '{grupo.Nombre}'.\n" +
                              $"Iniciada por: {currentUser.NombreCompleto} ({currentUser.Email})\n" +
                              $"Fecha: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC\n\n" +
                              $"Mensaje original:\n{dto.Texto.Trim()}",
                PrioridadId = prioridadMedia.Id,
                EstadoActividadId = estadoInicial.Id,
                PorcentajeAvance = 0,
                CreadoPorId = uid,
                ModificadoPorId = uid,
                FechaCreacionUtc = DateTime.UtcNow
            };

            db.Actividades.Add(nuevaActividad);
            await db.SaveChangesAsync(ct);

            // Asignar al creador del grupo o a administradores del grupo como responsables
            var adminsIds = grupo.Miembros.Where(m => m.EsAdmin).Select(m => m.UsuarioId).ToList();
            if (adminsIds.Count == 0) adminsIds.Add(grupo.CreadoPorId);

            foreach (var admId in adminsIds.Distinct())
            {
                db.ActividadAsignados.Add(new ActividadAsignado
                {
                    ActividadId = nuevaActividad.Id,
                    UsuarioId = admId,
                    EsPrincipal = admId == adminsIds.First(),
                    AsignadoPorId = uid
                });
            }

            db.ActividadHistorial.Add(new ActividadHistorial
            {
                ActividadId = nuevaActividad.Id,
                UsuarioId = uid,
                TipoCambio = "Creación vía Chat WhatsApp",
                ValorNuevo = estadoInicial.Nombre,
                Detalle = $"Actividad creada automáticamente por mensaje de {currentUser.NombreCompleto} en el grupo '{grupo.Nombre}'."
            });

            // Vincular al grupo
            grupo.ActividadActivaId = nuevaActividad.Id;
            actividadId = nuevaActividad.Id;

            // Mensaje de sistema informativo en el chat
            var msjSistema = new ChatMensaje
            {
                ChatGrupoId = grupo.Id,
                UsuarioId = uid,
                ActividadId = nuevaActividad.Id,
                Texto = $"📌 Se ha creado automáticamente la actividad {nuevaActividad.Codigo} ('{nuevaActividad.Titulo}') en el sistema para dar seguimiento completo a esta solicitud.",
                TipoMensaje = "Sistema",
                FechaCreacionUtc = DateTime.UtcNow
            };
            db.ChatMensajes.Add(msjSistema);
        }
        else
        {
            actividadId = actividadActiva.Id;

            // Registrar en el historial de la actividad para que en la vista de actividades aparezca todo el seguimiento
            db.ActividadHistorial.Add(new ActividadHistorial
            {
                ActividadId = actividadId.Value,
                UsuarioId = uid,
                TipoCambio = "Seguimiento Chat WhatsApp",
                Detalle = $"{currentUser.NombreCompleto}: {dto.Texto.Trim()}"
            });
        }

        var mensaje = new ChatMensaje
        {
            ChatGrupoId = grupo.Id,
            UsuarioId = uid,
            ActividadId = actividadId,
            Texto = dto.Texto.Trim(),
            TipoMensaje = string.IsNullOrWhiteSpace(dto.TipoMensaje) ? "Texto" : dto.TipoMensaje,
            OpcionesInteractivasJson = dto.OpcionesInteractivasJson,
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.ChatMensajes.Add(mensaje);
        await db.SaveChangesAsync(ct);

        var mensajeDto = await db.ChatMensajes
            .AsNoTracking()
            .Include(m => m.Usuario)
            .Include(m => m.Actividad)
            .Include(m => m.RespondidoPorUsuario)
            .Where(m => m.Id == mensaje.Id)
            .Select(m => MapearMensajeDto(m, uid))
            .FirstAsync(ct);

        // Notificar en tiempo real a todos los miembros del grupo por SignalR
        await NotificarNuevoMensajeAsync(grupo.Id, mensajeDto, ct);

        return Ok(mensajeDto);
    }

    [HttpPost("grupos/{id:int}/enviar-pregunta-resolucion")]
    public async Task<ActionResult<ChatMensajeDto>> EnviarPreguntaResolucion(int id, CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión requerida.", "NO_AUTENTICADO", 401);
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .Include(g => g.ActividadActiva)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        ValidarAccesoGrupo(grupo);

        var actividad = grupo.ActividadActiva
            ?? throw new DomainRuleException("No hay una actividad abierta asociada a este chat en este momento.");

        var opciones = new[]
        {
            new { id = "resolver", texto = "✅ Sí, marcar como resuelto", accion = "RESOLVER_ACTIVIDAD" },
            new { id = "continuar", texto = "⏳ Aún no, requiero más apoyo", accion = "CONTINUAR" }
        };

        var mensaje = new ChatMensaje
        {
            ChatGrupoId = grupo.Id,
            UsuarioId = uid,
            ActividadId = actividad.Id,
            Texto = $"¿Tu solicitud referente a la actividad {actividad.Codigo} ('{actividad.Titulo}') ha sido atendida y resuelta satisfactoriamente?",
            TipoMensaje = "PreguntaInteractiva",
            OpcionesInteractivasJson = JsonSerializer.Serialize(opciones),
            FechaCreacionUtc = DateTime.UtcNow
        };

        db.ChatMensajes.Add(mensaje);
        await db.SaveChangesAsync(ct);

        var mensajeDto = await db.ChatMensajes
            .AsNoTracking()
            .Include(m => m.Usuario)
            .Include(m => m.Actividad)
            .Include(m => m.RespondidoPorUsuario)
            .Where(m => m.Id == mensaje.Id)
            .Select(m => MapearMensajeDto(m, uid))
            .FirstAsync(ct);

        await NotificarNuevoMensajeAsync(grupo.Id, mensajeDto, ct);
        return Ok(mensajeDto);
    }

    [HttpPost("grupos/{id:int}/mensajes/{mensajeId:long}/responder-opcion")]
    public async Task<ActionResult<ChatMensajeDto>> ResponderOpcion(
        int id,
        long mensajeId,
        [FromBody] ResponderOpcionInteractivaDto dto,
        CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión requerida.", "NO_AUTENTICADO", 401);
        var grupo = await db.ChatGrupos
            .Include(g => g.Miembros)
            .Include(g => g.ActividadActiva)
            .FirstOrDefaultAsync(g => g.Id == id && g.Activo, ct)
            ?? throw new DomainRuleException("Grupo no encontrado.", "NO_ENCONTRADO", 404);

        ValidarAccesoGrupo(grupo);

        var mensaje = await db.ChatMensajes
            .Include(m => m.Actividad)
            .FirstOrDefaultAsync(m => m.Id == mensajeId && m.ChatGrupoId == id, ct)
            ?? throw new DomainRuleException("Mensaje interactivo no encontrado.", "NO_ENCONTRADO", 404);

        if (mensaje.TipoMensaje != "PreguntaInteractiva")
        {
            throw new DomainRuleException("Este mensaje no es una pregunta interactiva.");
        }

        mensaje.OpcionSeleccionada = dto.OpcionId;
        mensaje.RespondidoPorUsuarioId = uid;
        mensaje.FechaRespuestaUtc = DateTime.UtcNow;

        // Si el cliente elige marcar como resuelto
        if (dto.OpcionId.Equals("resolver", StringComparison.OrdinalIgnoreCase))
        {
            var actividad = mensaje.Actividad ?? grupo.ActividadActiva;
            if (actividad != null)
            {
                var estadoCompletada = await db.EstadosActividad.FirstOrDefaultAsync(e => e.Codigo == "COMPLETADA", ct)
                    ?? await db.EstadosActividad.OrderByDescending(e => e.Orden).FirstAsync(ct);

                actividad.EstadoActividadId = estadoCompletada.Id;
                actividad.PorcentajeAvance = 100m;
                actividad.FechaFinalizacionRealUtc = DateTime.UtcNow;
                actividad.ModificadoPorId = uid;
                actividad.FechaModificacionUtc = DateTime.UtcNow;

                db.ActividadHistorial.Add(new ActividadHistorial
                {
                    ActividadId = actividad.Id,
                    UsuarioId = uid,
                    TipoCambio = "Resolución por Cliente",
                    ValorNuevo = estadoCompletada.Nombre,
                    Detalle = $"El cliente {currentUser.NombreCompleto} marcó la actividad como RESUELTA desde el chat interactivo WhatsApp."
                });

                // Liberar actividad activa del grupo para futuras solicitudes
                grupo.ActividadActivaId = null;

                // Mensaje del sistema en el chat
                db.ChatMensajes.Add(new ChatMensaje
                {
                    ChatGrupoId = grupo.Id,
                    UsuarioId = uid,
                    ActividadId = actividad.Id,
                    Texto = $"🎉 {currentUser.NombreCompleto} ha confirmado y marcado la actividad {actividad.Codigo} como RESUELTA con éxito.",
                    TipoMensaje = "Sistema",
                    FechaCreacionUtc = DateTime.UtcNow
                });
            }
        }
        else
        {
            // Opcion de continuar / requiere apoyo
            db.ChatMensajes.Add(new ChatMensaje
            {
                ChatGrupoId = grupo.Id,
                UsuarioId = uid,
                ActividadId = mensaje.ActividadId,
                Texto = $"📝 {currentUser.NombreCompleto} indicó que la actividad aún requiere seguimiento o apoyo adicional.",
                TipoMensaje = "Sistema",
                FechaCreacionUtc = DateTime.UtcNow
            });
        }

        await db.SaveChangesAsync(ct);

        var respuestaDto = await db.ChatMensajes
            .AsNoTracking()
            .Include(m => m.Usuario)
            .Include(m => m.Actividad)
            .Include(m => m.RespondidoPorUsuario)
            .Where(m => m.Id == mensaje.Id)
            .Select(m => MapearMensajeDto(m, uid))
            .FirstAsync(ct);

        await NotificarNuevoMensajeAsync(grupo.Id, respuestaDto, ct);
        return Ok(respuestaDto);
    }

    [HttpPost("actividades/{actividadId:int}/iniciar-chat")]
    public async Task<ActionResult<ChatGrupoDto>> IniciarChatParaActividad(int actividadId, CancellationToken ct)
    {
        var uid = currentUser.UsuarioId ?? throw new DomainRuleException("Sesión requerida.", "NO_AUTENTICADO", 401);
        var actividad = await db.Actividades
            .Include(a => a.Asignados).ThenInclude(asig => asig.Usuario)
            .Include(a => a.ChatGrupo)
            .FirstOrDefaultAsync(a => a.Id == actividadId, ct)
            ?? throw new DomainRuleException("Actividad no encontrada.", "NO_ENCONTRADO", 404);

        currentUser.ExigirAlcanceUnidad(actividad.UnidadId);

        if (actividad.ChatGrupoId.HasValue && actividad.ChatGrupo != null && actividad.ChatGrupo.Activo)
        {
            return await ObtenerGrupo(actividad.ChatGrupoId.Value, ct);
        }

        // Crear nuevo grupo vinculado a esta actividad
        var grupo = new ChatGrupo
        {
            Nombre = $"Canal {actividad.Codigo}",
            Descripcion = $"Seguimiento directo en chat tipo WhatsApp para la actividad: {actividad.Titulo}",
            UnidadId = actividad.UnidadId,
            ActividadActivaId = actividad.Id,
            CreadoPorId = uid,
            Activo = true,
            FechaCreacionUtc = DateTime.UtcNow
        };

        grupo.Miembros.Add(new ChatGrupoMiembro
        {
            UsuarioId = uid,
            EsAdmin = true,
            FechaUnionUtc = DateTime.UtcNow
        });

        foreach (var asig in actividad.Asignados)
        {
            if (asig.UsuarioId != uid && !grupo.Miembros.Any(m => m.UsuarioId == asig.UsuarioId))
            {
                grupo.Miembros.Add(new ChatGrupoMiembro
                {
                    UsuarioId = asig.UsuarioId,
                    EsAdmin = false,
                    FechaUnionUtc = DateTime.UtcNow
                });
            }
        }

        grupo.Mensajes.Add(new ChatMensaje
        {
            UsuarioId = uid,
            ActividadId = actividad.Id,
            Texto = $"💬 Canal de chat WhatsApp iniciado para dar seguimiento a la actividad {actividad.Codigo}: '{actividad.Titulo}'.",
            TipoMensaje = "Sistema",
            FechaCreacionUtc = DateTime.UtcNow
        });

        db.ChatGrupos.Add(grupo);
        await db.SaveChangesAsync(ct);

        actividad.ChatGrupoId = grupo.Id;
        await db.SaveChangesAsync(ct);

        return await ObtenerGrupo(grupo.Id, ct);
    }

    private void ValidarAccesoGrupo(ChatGrupo grupo)
    {
        var uid = currentUser.UsuarioId ?? 0;
        if (currentUser.AccesoGlobalUnidades) return;
        if (grupo.Miembros.Any(m => m.UsuarioId == uid)) return;
        if (currentUser.UnidadesAutorizadas.Contains(grupo.UnidadId) && currentUser.TienePermiso(PermisosConstantes.ChatCrear)) return;

        throw new DomainRuleException("No perteneces a este grupo de chat ni tienes permisos sobre la unidad.", "NO_AUTORIZADO", 403);
    }

    private async Task NotificarNuevoMensajeAsync(int grupoId, ChatMensajeDto dto, CancellationToken ct)
    {
        try
        {
            var miembrosIds = await db.ChatGrupoMiembros
                .Where(m => m.ChatGrupoId == grupoId)
                .Select(m => m.UsuarioId)
                .ToListAsync(ct);

            foreach (var mId in miembrosIds)
            {
                await hubContext.Clients.Group($"user:{mId}").SendAsync("NuevoMensajeChat", dto, ct);
            }
        }
        catch
        {
            // Continuación tolerante si SignalR no tiene escuchas activas
        }
    }

    private async Task NotificarCambioGrupoAsync(int grupoId, CancellationToken ct)
    {
        try
        {
            var miembrosIds = await db.ChatGrupoMiembros
                .Where(m => m.ChatGrupoId == grupoId)
                .Select(m => m.UsuarioId)
                .ToListAsync(ct);

            foreach (var mId in miembrosIds)
            {
                await hubContext.Clients.Group($"user:{mId}").SendAsync("GrupoChatActualizado", grupoId, ct);
            }
        }
        catch
        {
            // ignore
        }
    }

    private static ChatGrupoDto MapearGrupoDto(ChatGrupo g)
    {
        var ultimoMsj = g.Mensajes.OrderByDescending(m => m.FechaCreacionUtc).FirstOrDefault();
        return new ChatGrupoDto(
            g.Id,
            g.Nombre,
            g.Descripcion,
            g.UnidadId,
            g.Unidad?.Nombre ?? "",
            g.ActividadActivaId,
            g.ActividadActiva?.Codigo,
            g.ActividadActiva?.Titulo,
            g.ActividadActiva?.EstadoActividad?.Nombre,
            g.ActividadActiva?.EstadoActividad?.ColorHex,
            g.CreadoPorId,
            g.CreadoPor?.NombreCompleto ?? "",
            g.FechaCreacionUtc,
            g.Activo,
            g.Miembros.Count,
            ultimoMsj?.Texto,
            ultimoMsj?.FechaCreacionUtc,
            g.Miembros.Where(m => m.Usuario != null).Select(m => new ChatMiembroDto(
                m.UsuarioId,
                m.Usuario!.NombreCompleto,
                m.Usuario.NombreUsuario,
                m.Usuario.Email,
                m.Usuario.Cargo,
                m.EsAdmin,
                m.FechaUnionUtc)).ToList());
    }

    private static ChatMensajeDto MapearMensajeDto(ChatMensaje m, int currentUserId)
    {
        return new ChatMensajeDto(
            m.Id,
            m.ChatGrupoId,
            m.UsuarioId,
            m.Usuario?.NombreUsuario ?? "",
            m.Usuario?.NombreCompleto ?? "",
            m.ActividadId,
            m.Actividad?.Codigo,
            m.Texto,
            m.TipoMensaje,
            m.OpcionesInteractivasJson,
            m.OpcionSeleccionada,
            m.RespondidoPorUsuarioId,
            m.RespondidoPorUsuario?.NombreCompleto,
            m.FechaRespuestaUtc,
            m.FechaCreacionUtc,
            m.UsuarioId == currentUserId);
    }
}
