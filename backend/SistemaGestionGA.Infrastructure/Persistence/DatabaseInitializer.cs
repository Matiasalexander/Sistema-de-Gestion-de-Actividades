using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Domain.Entities;
using SistemaGestionGA.Domain.Rules;
using SistemaGestionGA.Shared.Constants;

namespace SistemaGestionGA.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InicializarYPoblarAsync(ApplicationDbContext db, bool aplicarMigraciones = true)
    {
        if (aplicarMigraciones && db.Database.IsRelational())
        {
            await db.Database.MigrateAsync();
        }
        else
        {
            await db.Database.EnsureCreatedAsync();
        }

        // 1. Semilla de Permisos
        var catalogoPermisos = PermisosConstantes.ObtenerCatalogo();
        var permisosExistentes = await db.Permisos.ToDictionaryAsync(p => p.Codigo, StringComparer.OrdinalIgnoreCase);
        foreach (var item in catalogoPermisos)
        {
            if (!permisosExistentes.ContainsKey(item.Codigo))
            {
                var nuevoPermiso = new Permiso
                {
                    Codigo = item.Codigo,
                    Modulo = item.Modulo,
                    Accion = item.Accion,
                    Nombre = item.Nombre,
                    Descripcion = item.Descripcion
                };
                db.Permisos.Add(nuevoPermiso);
                permisosExistentes[item.Codigo] = nuevoPermiso;
            }
        }
        await db.SaveChangesAsync();

        // Asegurar que el rol ADMIN tenga todos los permisos existentes (incluyendo chat.*)
        var rolAdminDb = await db.Roles.Include(r => r.RolPermisos).FirstOrDefaultAsync(r => r.Codigo == "ADMIN");
        if (rolAdminDb != null)
        {
            var permisosAsignados = rolAdminDb.RolPermisos.Select(rp => rp.PermisoId).ToHashSet();
            foreach (var permiso in permisosExistentes.Values)
            {
                if (!permisosAsignados.Contains(permiso.Id))
                {
                    db.RolPermisos.Add(new RolPermiso { RolId = rolAdminDb.Id, PermisoId = permiso.Id });
                }
            }
            await db.SaveChangesAsync();
        }

        // Asegurar grupo de chat demostrativo tipo WhatsApp
        if (await db.Unidades.AnyAsync() && !await db.ChatGrupos.AnyAsync())
        {
            await SembrarChatWhatsAppInicialAsync(db);
        }

        if (await db.Unidades.AnyAsync())
            return;

        // 2. Prioridades y Catálogos de Estados
        var prioBaja = new Prioridad { Codigo = "BAJA", Nombre = "Baja", ColorHex = "#64748B", Nivel = 1 };
        var prioMedia = new Prioridad { Codigo = "MEDIA", Nombre = "Media", ColorHex = "#2563EB", Nivel = 2 };
        var prioAlta = new Prioridad { Codigo = "ALTA", Nombre = "Alta", ColorHex = "#F59E0B", Nivel = 3 };
        var prioCritica = new Prioridad { Codigo = "CRITICA", Nombre = "Crítica", ColorHex = "#DC2626", Nivel = 4 };
        db.Prioridades.AddRange(prioBaja, prioMedia, prioAlta, prioCritica);

        var estProyPlan = new EstadoProyecto { Codigo = "PLANEACION", Nombre = "En planeación", ColorHex = "#64748B", Orden = 1 };
        var estProyActivo = new EstadoProyecto { Codigo = "ACTIVO", Nombre = "Activo", ColorHex = "#2563EB", Orden = 2 };
        var estProyRiesgo = new EstadoProyecto { Codigo = "EN_RIESGO", Nombre = "En riesgo", ColorHex = "#F59E0B", Orden = 3 };
        var estProyPausa = new EstadoProyecto { Codigo = "PAUSADO", Nombre = "En pausa", ColorHex = "#8B5CF6", Orden = 4 };
        var estProyComp = new EstadoProyecto { Codigo = "COMPLETADO", Nombre = "Completado", ColorHex = "#10B981", Orden = 5, EsFinal = true };
        var estProyCanc = new EstadoProyecto { Codigo = "CANCELADO", Nombre = "Cancelado", ColorHex = "#EF4444", Orden = 6, EsFinal = true };
        db.EstadosProyecto.AddRange(estProyPlan, estProyActivo, estProyRiesgo, estProyPausa, estProyComp, estProyCanc);

        var estActPend = new EstadoActividad { Codigo = "PENDIENTE", Nombre = "Pendiente", ColorHex = "#94A3B8", Orden = 1 };
        var estActPorIni = new EstadoActividad { Codigo = "POR_INICIAR", Nombre = "Por iniciar", ColorHex = "#64748B", Orden = 2 };
        var estActProg = new EstadoActividad { Codigo = "EN_PROGRESO", Nombre = "En progreso", ColorHex = "#F59E0B", Orden = 3 };
        var estActEspera = new EstadoActividad { Codigo = "EN_ESPERA", Nombre = "En espera", ColorHex = "#8B5CF6", Orden = 4 };
        var estActBloq = new EstadoActividad { Codigo = "BLOQUEADA", Nombre = "Bloqueada", ColorHex = "#EF4444", Orden = 5 };
        var estActRev = new EstadoActividad { Codigo = "EN_REVISION", Nombre = "En revisión", ColorHex = "#0284C7", Orden = 6 };
        var estActComp = new EstadoActividad { Codigo = "COMPLETADA", Nombre = "Completada", ColorHex = "#10B981", Orden = 7, EsFinal = true };
        var estActCanc = new EstadoActividad { Codigo = "CANCELADA", Nombre = "Cancelada", ColorHex = "#334155", Orden = 8, EsFinal = true };
        db.EstadosActividad.AddRange(estActPend, estActPorIni, estActProg, estActEspera, estActBloq, estActRev, estActComp, estActCanc);

        var estTktNuevo = new EstadoTicket { Codigo = "NUEVO", Nombre = "Nuevo", ColorHex = "#64748B", Orden = 1 };
        var estTktAbierto = new EstadoTicket { Codigo = "ABIERTO", Nombre = "Abierto", ColorHex = "#3B82F6", Orden = 2 };
        var estTktAsignado = new EstadoTicket { Codigo = "ASIGNADO", Nombre = "Asignado", ColorHex = "#0284C7", Orden = 3 };
        var estTktAtencion = new EstadoTicket { Codigo = "EN_ATENCION", Nombre = "En atención", ColorHex = "#F59E0B", Orden = 4 };
        var estTktEspera = new EstadoTicket { Codigo = "EN_ESPERA", Nombre = "En espera", ColorHex = "#8B5CF6", Orden = 5, PausaSla = true };
        var estTktResuelto = new EstadoTicket { Codigo = "RESUELTO", Nombre = "Resuelto", ColorHex = "#10B981", Orden = 6, PausaSla = true };
        var estTktCerrado = new EstadoTicket { Codigo = "CERRADO", Nombre = "Cerrado", ColorHex = "#059669", Orden = 7, PausaSla = true, EsFinal = true };
        var estTktCancelado = new EstadoTicket { Codigo = "CANCELADO", Nombre = "Cancelado", ColorHex = "#EF4444", Orden = 8, PausaSla = true, EsFinal = true };
        var estTktReabierto = new EstadoTicket { Codigo = "REABIERTO", Nombre = "Reabierto", ColorHex = "#EC4899", Orden = 9 };
        db.EstadosTicket.AddRange(estTktNuevo, estTktAbierto, estTktAsignado, estTktAtencion, estTktEspera, estTktResuelto, estTktCerrado, estTktCancelado, estTktReabierto);

        var tipoIncidente = new TicketTipo { Codigo = "INCIDENTE", Nombre = "Incidente", Descripcion = "Interrupción o degradación de servicio operativo" };
        var tipoSolicitud = new TicketTipo { Codigo = "SOLICITUD", Nombre = "Solicitud de servicio", Descripcion = "Requerimiento estándar de acceso, equipo o configuración" };
        var tipoReq = new TicketTipo { Codigo = "REQUERIMIENTO", Nombre = "Requerimiento", Descripcion = "Mejora evolutiva o funcional sobre sistemas corporativos" };
        var tipoProblema = new TicketTipo { Codigo = "PROBLEMA", Nombre = "Problema", Descripcion = "Investigación de causa raíz de incidentes recurrentes" };
        var tipoCambio = new TicketTipo { Codigo = "CAMBIO", Nombre = "Cambio", Descripcion = "Despliegue o cambio controlado en infraestructura o software" };
        var tipoConsulta = new TicketTipo { Codigo = "CONSULTA", Nombre = "Consulta", Descripcion = "Duda o asistencia funcional de operación" };
        db.TicketTipos.AddRange(tipoIncidente, tipoSolicitud, tipoReq, tipoProblema, tipoCambio, tipoConsulta);

        var catInfra = new TicketCategoria { Codigo = "INFRAESTRUCTURA", Nombre = "Infraestructura y Redes", Descripcion = "Servidores, enlaces, VPN y telecomunicaciones" };
        var catSistemas = new TicketCategoria { Codigo = "SISTEMAS_GA", Nombre = "Sistemas Corporativos GA", Descripcion = "Plataformas internas: Caja GA, Inventario GA, ERP" };
        var catSeguridad = new TicketCategoria { Codigo = "ACCESOS_SEG", Nombre = "Accesos y Seguridad", Descripcion = "Permisos, cuentas, MFA y auditoría" };
        var catSoporte = new TicketCategoria { Codigo = "SOPORTE_CAMPO", Nombre = "Soporte Técnico Operativo", Descripcion = "Equipos de cómputo, terminales e impresoras" };
        var catOperaciones = new TicketCategoria { Codigo = "OPERACIONES", Nombre = "Operaciones y Logística", Descripcion = "Procesos operativos en unidades de negocio" };
        db.TicketCategorias.AddRange(catInfra, catSistemas, catSeguridad, catSoporte, catOperaciones);

        // 3. Unidades y Departamentos
        var unidadCorp = new Unidad { Codigo = "CORP-GA", Nombre = "Corporativo Central GA", Descripcion = "Sede corporativa, TI central y gobierno operativo", ZonaHoraria = "America/Mexico_City" };
        var unidadNorte = new Unidad { Codigo = "UNI-NORTE", Nombre = "Unidad Operativa Norte", Descripcion = "Operaciones comerciales, distribución y soporte regional Norte", ZonaHoraria = "America/Monterrey" };
        var unidadSur = new Unidad { Codigo = "UNI-SUR", Nombre = "Unidad Operativa Sur", Descripcion = "Operaciones logísticas y centro de servicio regional Sur", ZonaHoraria = "America/Mexico_City" };
        var unidadBajio = new Unidad { Codigo = "UNI-BAJIO", Nombre = "Unidad Industrial Bajío", Descripcion = "Planta industrial, ingeniería y control de calidad", ZonaHoraria = "America/Mexico_City" };
        db.Unidades.AddRange(unidadCorp, unidadNorte, unidadSur, unidadBajio);
        await db.SaveChangesAsync();

        var deptoTi = new Departamento { UnidadId = unidadCorp.Id, Codigo = "TI-CORP", Nombre = "Tecnologías de la Información", Descripcion = "Arquitectura, desarrollo y mesa de ayuda corporativa" };
        var deptoPmo = new Departamento { UnidadId = unidadCorp.Id, Codigo = "PMO-CORP", Nombre = "Oficina de Proyectos (PMO)", Descripcion = "Planeación estratégica y seguimiento de portafolio" };
        var deptoOpsNorte = new Departamento { UnidadId = unidadNorte.Id, Codigo = "OPS-NTE", Nombre = "Operaciones y Soporte Norte", Descripcion = "Continuidad operativa y atención técnica Norte" };
        var deptoOpsSur = new Departamento { UnidadId = unidadSur.Id, Codigo = "OPS-SUR", Nombre = "Operaciones y Logística Sur", Descripcion = "Coordinación operativa de sucursales Sur" };
        var deptoIngBajio = new Departamento { UnidadId = unidadBajio.Id, Codigo = "ING-BAJ", Nombre = "Ingeniería y Mantenimiento", Descripcion = "Automatización y soporte de planta Bajío" };
        db.Departamentos.AddRange(deptoTi, deptoPmo, deptoOpsNorte, deptoOpsSur, deptoIngBajio);
        await db.SaveChangesAsync();

        // 4. Roles y Matriz de Permisos
        var todosPermisos = await db.Permisos.ToListAsync();
        var rolAdmin = new Rol { Codigo = "SUPER_ADMIN", Nombre = "Administrador Corporativo GA", Descripcion = "Control total de seguridad, unidades, proyectos, actividades y mesa de ayuda", EsSistema = true };
        var rolGerente = new Rol { Codigo = "GERENTE_PMO", Nombre = "Gerente de Proyectos y Operaciones", Descripcion = "Gestión de proyectos, actividades, tableros, asignaciones y reportes ejecutivos", EsSistema = true };
        var rolSoporte = new Rol { Codigo = "ESPECIALISTA_MESA", Nombre = "Especialista Mesa de Ayuda / Soporte", Descripcion = "Atención, asignación, escalamiento y resolución de tickets y actividades técnicas", EsSistema = true };
        var rolSolicitante = new Rol { Codigo = "USUARIO_OPERATIVO", Nombre = "Colaborador / Solicitante", Descripcion = "Ejecución de actividades asignadas y levantamiento de tickets en su unidad", EsSistema = true };
        db.Roles.AddRange(rolAdmin, rolGerente, rolSoporte, rolSolicitante);
        await db.SaveChangesAsync();

        foreach (var p in todosPermisos)
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rolAdmin.Id, PermisoId = p.Id });
        }

        string[] codigosGerente =
        [
            PermisosConstantes.ProyectosVer, PermisosConstantes.ProyectosCrear, PermisosConstantes.ProyectosEditar, PermisosConstantes.ProyectosEliminar,
            PermisosConstantes.ActividadesVer, PermisosConstantes.ActividadesCrear, PermisosConstantes.ActividadesEditar, PermisosConstantes.ActividadesAsignar, PermisosConstantes.ActividadesCerrar,
            PermisosConstantes.TicketsVer, PermisosConstantes.TicketsCrear, PermisosConstantes.TicketsAsignar,
            PermisosConstantes.ReportesVer, PermisosConstantes.ReportesExportar, PermisosConstantes.EquiposGestionar
        ];
        foreach (var p in todosPermisos.Where(x => codigosGerente.Contains(x.Codigo)))
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rolGerente.Id, PermisoId = p.Id });
        }

        string[] codigosSoporte =
        [
            PermisosConstantes.ProyectosVer,
            PermisosConstantes.ActividadesVer, PermisosConstantes.ActividadesCrear, PermisosConstantes.ActividadesEditar, PermisosConstantes.ActividadesAsignar, PermisosConstantes.ActividadesCerrar,
            PermisosConstantes.TicketsVer, PermisosConstantes.TicketsCrear, PermisosConstantes.TicketsAsignar, PermisosConstantes.TicketsAtender, PermisosConstantes.TicketsResolver, PermisosConstantes.TicketsCerrar, PermisosConstantes.TicketsReabrir,
            PermisosConstantes.ReportesVer
        ];
        foreach (var p in todosPermisos.Where(x => codigosSoporte.Contains(x.Codigo)))
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rolSoporte.Id, PermisoId = p.Id });
        }

        string[] codigosOperativo =
        [
            PermisosConstantes.ProyectosVer,
            PermisosConstantes.ActividadesVer, PermisosConstantes.ActividadesEditar, PermisosConstantes.ActividadesCerrar,
            PermisosConstantes.TicketsVer, PermisosConstantes.TicketsCrear, PermisosConstantes.TicketsReabrir
        ];
        foreach (var p in todosPermisos.Where(x => codigosOperativo.Contains(x.Codigo)))
        {
            db.RolPermisos.Add(new RolPermiso { RolId = rolSolicitante.Id, PermisoId = p.Id });
        }

        // 5. Usuarios Iniciales (Password corporativo de prueba documentado: AdminGA2026!)
        var hashDefault = BCrypt.Net.BCrypt.HashPassword("AdminGA2026!");
        var usrAdmin = new Usuario
        {
            NombreUsuario = "admin",
            Email = "admin@corporativoga.mx",
            NombreCompleto = "Matías Arceo - Director TI Corporativo",
            Cargo = "Director de Tecnología y Transformación",
            Telefono = "+52 55 4100 9001",
            PasswordHash = hashDefault,
            DepartamentoId = deptoTi.Id,
            AccesoGlobalUnidades = true,
            Activo = true
        };
        var usrPmo = new Usuario
        {
            NombreUsuario = "elena.vargas",
            Email = "elena.vargas@corporativoga.mx",
            NombreCompleto = "Elena Vargas - Líder PMO",
            Cargo = "Gerente de Portafolio de Proyectos",
            Telefono = "+52 55 4100 9002",
            PasswordHash = hashDefault,
            DepartamentoId = deptoPmo.Id,
            AccesoGlobalUnidades = false,
            Activo = true
        };
        var usrSoporteNorte = new Usuario
        {
            NombreUsuario = "carlos.mendez",
            Email = "carlos.mendez@corporativoga.mx",
            NombreCompleto = "Carlos Méndez - Especialista Nivel 2",
            Cargo = "Ingeniero de Soporte e Infraestructura",
            Telefono = "+52 81 8300 4410",
            PasswordHash = hashDefault,
            DepartamentoId = deptoOpsNorte.Id,
            AccesoGlobalUnidades = false,
            Activo = true
        };
        var usrOperativoSur = new Usuario
        {
            NombreUsuario = "sofia.torres",
            Email = "sofia.torres@corporativoga.mx",
            NombreCompleto = "Sofía Torres - Coordinadora Sur",
            Cargo = "Coordinadora de Operaciones Regional Sur",
            Telefono = "+52 99 9210 3300",
            PasswordHash = hashDefault,
            DepartamentoId = deptoOpsSur.Id,
            AccesoGlobalUnidades = false,
            Activo = true
        };
        db.Usuarios.AddRange(usrAdmin, usrPmo, usrSoporteNorte, usrOperativoSur);
        await db.SaveChangesAsync();

        db.UsuarioRoles.AddRange(
            new UsuarioRol { UsuarioId = usrAdmin.Id, RolId = rolAdmin.Id },
            new UsuarioRol { UsuarioId = usrPmo.Id, RolId = rolGerente.Id },
            new UsuarioRol { UsuarioId = usrSoporteNorte.Id, RolId = rolSoporte.Id },
            new UsuarioRol { UsuarioId = usrOperativoSur.Id, RolId = rolSolicitante.Id }
        );

        db.UsuarioUnidades.AddRange(
            new UsuarioUnidad { UsuarioId = usrAdmin.Id, UnidadId = unidadCorp.Id, EsUnidadPrincipal = true },
            new UsuarioUnidad { UsuarioId = usrAdmin.Id, UnidadId = unidadNorte.Id, EsUnidadPrincipal = false },
            new UsuarioUnidad { UsuarioId = usrAdmin.Id, UnidadId = unidadSur.Id, EsUnidadPrincipal = false },
            new UsuarioUnidad { UsuarioId = usrAdmin.Id, UnidadId = unidadBajio.Id, EsUnidadPrincipal = false },
            new UsuarioUnidad { UsuarioId = usrPmo.Id, UnidadId = unidadCorp.Id, EsUnidadPrincipal = true },
            new UsuarioUnidad { UsuarioId = usrPmo.Id, UnidadId = unidadNorte.Id, EsUnidadPrincipal = false },
            new UsuarioUnidad { UsuarioId = usrSoporteNorte.Id, UnidadId = unidadNorte.Id, EsUnidadPrincipal = true },
            new UsuarioUnidad { UsuarioId = usrSoporteNorte.Id, UnidadId = unidadCorp.Id, EsUnidadPrincipal = false },
            new UsuarioUnidad { UsuarioId = usrOperativoSur.Id, UnidadId = unidadSur.Id, EsUnidadPrincipal = true }
        );

        // 6. Equipos de Trabajo
        var eqCoreTi = new Equipo
        {
            Codigo = "EQ-TI-CORE",
            UnidadId = unidadCorp.Id,
            DepartamentoId = deptoTi.Id,
            Nombre = "Ingeniería y Plataformas GA",
            Descripcion = "Equipo encargado de arquitectura, desarrollo y continuidad de sistemas GA",
            ColorHex = "#2563EB",
            LiderUsuarioId = usrAdmin.Id
        };
        var eqMesaNorte = new Equipo
        {
            Codigo = "EQ-MESA-NTE",
            UnidadId = unidadNorte.Id,
            DepartamentoId = deptoOpsNorte.Id,
            Nombre = "Mesa de Ayuda y Campo Norte",
            Descripcion = "Atención de incidentes y requerimientos técnicos en región Norte",
            ColorHex = "#059669",
            LiderUsuarioId = usrSoporteNorte.Id
        };
        db.Equipos.AddRange(eqCoreTi, eqMesaNorte);
        await db.SaveChangesAsync();

        db.UsuarioEquipos.AddRange(
            new UsuarioEquipo { EquipoId = eqCoreTi.Id, UsuarioId = usrAdmin.Id, RolEnEquipo = "Líder Técnico" },
            new UsuarioEquipo { EquipoId = eqCoreTi.Id, UsuarioId = usrPmo.Id, RolEnEquipo = "Product Owner" },
            new UsuarioEquipo { EquipoId = eqMesaNorte.Id, UsuarioId = usrSoporteNorte.Id, RolEnEquipo = "Coordinador Soporte" }
        );

        // 7. Calendarios y Políticas SLA
        var calCorporativo = new CalendarioSla
        {
            Nombre = "Horario Corporativo Estándar (L-V 08:00 a 18:00)",
            ZonaHoraria = "America/Mexico_City",
            HoraInicioAtencion = new TimeOnly(8, 0),
            HoraFinAtencion = new TimeOnly(18, 0),
            DiasLaborales = "1,2,3,4,5",
            Activo = true
        };
        var calCritico24x7 = new CalendarioSla
        {
            Nombre = "Atención Continua Crítica 24x7",
            ZonaHoraria = "America/Mexico_City",
            HoraInicioAtencion = new TimeOnly(0, 0),
            HoraFinAtencion = new TimeOnly(23, 59),
            DiasLaborales = "1,2,3,4,5,6,7",
            Activo = true
        };
        db.CalendariosSla.AddRange(calCorporativo, calCritico24x7);
        await db.SaveChangesAsync();

        var slaCritica = new PoliticaSla
        {
            Nombre = "SLA Incidente Crítico (Respuesta 15m / Resolución 2h)",
            PrioridadId = prioCritica.Id,
            CalendarioSlaId = calCritico24x7.Id,
            EquipoEscalamientoId = eqCoreTi.Id,
            TiempoPrimeraRespuestaMinutos = 15,
            TiempoResolucionMinutos = 120,
            UmbralAlertaPorcentaje = 75
        };
        var slaAlta = new PoliticaSla
        {
            Nombre = "SLA Prioridad Alta (Respuesta 30m / Resolución 4h)",
            PrioridadId = prioAlta.Id,
            CalendarioSlaId = calCorporativo.Id,
            EquipoEscalamientoId = eqMesaNorte.Id,
            TiempoPrimeraRespuestaMinutos = 30,
            TiempoResolucionMinutos = 240,
            UmbralAlertaPorcentaje = 80
        };
        var slaMedia = new PoliticaSla
        {
            Nombre = "SLA Operativo Estándar (Respuesta 2h / Resolución 8h)",
            PrioridadId = prioMedia.Id,
            CalendarioSlaId = calCorporativo.Id,
            TiempoPrimeraRespuestaMinutos = 120,
            TiempoResolucionMinutos = 480,
            UmbralAlertaPorcentaje = 80
        };
        var slaBaja = new PoliticaSla
        {
            Nombre = "SLA Solicitudes y Consultas (Respuesta 4h / Resolución 24h)",
            PrioridadId = prioBaja.Id,
            CalendarioSlaId = calCorporativo.Id,
            TiempoPrimeraRespuestaMinutos = 240,
            TiempoResolucionMinutos = 1440,
            UmbralAlertaPorcentaje = 85
        };
        db.PoliticasSla.AddRange(slaCritica, slaAlta, slaMedia, slaBaja);
        await db.SaveChangesAsync();

        // 8. Reglas de Automatización Iniciales
        db.ReglasAutomatizacion.AddRange(
            new ReglaAutomatizacion
            {
                Nombre = "Notificar al responsable cuando se asigna un ticket",
                Descripcion = "CUANDO se asigna un ticket SI tiene responsable ENTONCES envía notificación en tiempo real",
                EventoDisparador = "TicketAsignado",
                CondicionJson = "{\"requiereResponsable\":true}",
                AccionTipo = "NotificarResponsable",
                AccionConfigJson = "{\"canal\":\"SignalR+Interna\",\"prioridad\":\"Alta\"}",
                Activa = true,
                TotalEjecuciones = 4,
                UltimaEjecucionUtc = DateTime.UtcNow.AddHours(-2)
            },
            new ReglaAutomatizacion
            {
                Nombre = "Alertar al supervisor ante SLA próximo a vencer o incumplido",
                Descripcion = "CUANDO un ticket supera el umbral de SLA SI sigue abierto ENTONCES alerta a liderazgo de soporte",
                EventoDisparador = "SlaAlerta",
                CondicionJson = "{\"umbralPorcentaje\":80}",
                AccionTipo = "EscalarSupervisor",
                AccionConfigJson = "{\"notificarLiderEquipo\":true}",
                Activa = true,
                TotalEjecuciones = 2,
                UltimaEjecucionUtc = DateTime.UtcNow.AddHours(-1)
            },
            new ReglaAutomatizacion
            {
                Nombre = "Evaluar desbloqueo de tareas sucesoras al completar actividad",
                Descripcion = "CUANDO una actividad cambia a Completada SI tiene actividades dependientes bloqueadas ENTONCES notifica liberación",
                EventoDisparador = "ActividadCompletada",
                CondicionJson = "{\"evaluarSucesoras\":true}",
                AccionTipo = "DesbloquearSucesoras",
                AccionConfigJson = "{\"cambiarAPorIniciar\":true}",
                Activa = true,
                TotalEjecuciones = 3,
                UltimaEjecucionUtc = DateTime.UtcNow.AddMinutes(-45)
            }
        );

        // 9. Proyectos Corporativos Iniciales
        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);
        var proyModernizacion = new Proyecto
        {
            Codigo = "PRJ-GA-001",
            Nombre = "Unificación de Plataforma Corporativa GA (Inventario + Caja + Mesa de Ayuda)",
            Descripcion = "Consolidación de arquitectura de identidad, permisos por unidad y trazabilidad operativa en tiempo real.",
            UnidadId = unidadCorp.Id,
            DepartamentoId = deptoTi.Id,
            EquipoId = eqCoreTi.Id,
            ResponsableId = usrAdmin.Id,
            PrioridadId = prioCritica.Id,
            EstadoProyectoId = estProyActivo.Id,
            FechaInicio = hoy.AddDays(-25),
            FechaFinEstimada = hoy.AddDays(35),
            PorcentajeAvance = 68m,
            CreadoPorId = usrAdmin.Id
        };

        var proyRedNorte = new Proyecto
        {
            Codigo = "PRJ-GA-002",
            Nombre = "Renovación de Enlaces SD-WAN y Terminales en Unidad Norte",
            Descripcion = "Actualización de infraestructura de red redundante y terminales de punto de operación en sucursales Norte.",
            UnidadId = unidadNorte.Id,
            DepartamentoId = deptoOpsNorte.Id,
            EquipoId = eqMesaNorte.Id,
            ResponsableId = usrPmo.Id,
            PrioridadId = prioAlta.Id,
            EstadoProyectoId = estProyActivo.Id,
            FechaInicio = hoy.AddDays(-15),
            FechaFinEstimada = hoy.AddDays(20),
            PorcentajeAvance = 45m,
            CreadoPorId = usrPmo.Id
        };

        var proyLogisticaSur = new Proyecto
        {
            Codigo = "PRJ-GA-003",
            Nombre = "Automatización de Recepción y Control Operativo Sur",
            Descripcion = "Implementación de tableros operativos y control de incidencias de almacén en Unidad Sur.",
            UnidadId = unidadSur.Id,
            DepartamentoId = deptoOpsSur.Id,
            ResponsableId = usrOperativoSur.Id,
            PrioridadId = prioMedia.Id,
            EstadoProyectoId = estProyPlan.Id,
            FechaInicio = hoy.AddDays(-5),
            FechaFinEstimada = hoy.AddDays(45),
            PorcentajeAvance = 25m,
            CreadoPorId = usrAdmin.Id
        };

        db.Proyectos.AddRange(proyModernizacion, proyRedNorte, proyLogisticaSur);
        await db.SaveChangesAsync();

        var fase1Proy1 = new ProyectoFase
        {
            ProyectoId = proyModernizacion.Id,
            Nombre = "Fase 1: Seguridad, SSO y Matriz de Alcance por Unidad",
            Descripcion = "Modelo RBAC + Alcance multi-unidad homologado",
            Orden = 1,
            EsHito = false,
            FechaInicio = hoy.AddDays(-25),
            FechaFinEstimada = hoy.AddDays(-5),
            Completada = true,
            PorcentajeAvance = 100m
        };
        var fase2Proy1 = new ProyectoFase
        {
            ProyectoId = proyModernizacion.Id,
            Nombre = "Fase 2: Tableros Operativos, Tickets y Motor SLA",
            Descripcion = "Integración de Kanban, Gantt, Mesa de Ayuda y alertas en tiempo real",
            Orden = 2,
            EsHito = true,
            FechaInicio = hoy.AddDays(-4),
            FechaFinEstimada = hoy.AddDays(20),
            Completada = false,
            PorcentajeAvance = 55m
        };
        db.ProyectoFases.AddRange(fase1Proy1, fase2Proy1);

        db.ProyectoIntegrantes.AddRange(
            new ProyectoIntegrante { ProyectoId = proyModernizacion.Id, UsuarioId = usrAdmin.Id, RolProyecto = "Arquitecto Líder" },
            new ProyectoIntegrante { ProyectoId = proyModernizacion.Id, UsuarioId = usrPmo.Id, RolProyecto = "PMO Lead" },
            new ProyectoIntegrante { ProyectoId = proyModernizacion.Id, UsuarioId = usrSoporteNorte.Id, RolProyecto = "Especialista QA/Soporte" },
            new ProyectoIntegrante { ProyectoId = proyRedNorte.Id, UsuarioId = usrPmo.Id, RolProyecto = "Project Manager" },
            new ProyectoIntegrante { ProyectoId = proyRedNorte.Id, UsuarioId = usrSoporteNorte.Id, RolProyecto = "Líder de Implementación" }
        );
        await db.SaveChangesAsync();

        // 10. Actividades, Checklists, Dependencias y Tiempos
        var act1 = new Actividad
        {
            Codigo = "ACT-0001",
            ProyectoId = proyModernizacion.Id,
            FaseProyectoId = fase1Proy1.Id,
            UnidadId = unidadCorp.Id,
            DepartamentoId = deptoTi.Id,
            EquipoId = eqCoreTi.Id,
            Titulo = "Homologar matriz de permisos y alcance por Unidad de Negocio",
            Descripcion = "Implementar validación backend estricta por unidad y auditoría de accesos.",
            PrioridadId = prioCritica.Id,
            EstadoActividadId = estActComp.Id,
            FechaInicio = hoy.AddDays(-20),
            FechaVencimiento = hoy.AddDays(-6),
            FechaFinalizacionRealUtc = DateTime.UtcNow.AddDays(-6),
            TiempoEstimadoMinutos = 480,
            PorcentajeAvance = 100m,
            CreadoPorId = usrAdmin.Id
        };

        var act2 = new Actividad
        {
            Codigo = "ACT-0002",
            ProyectoId = proyModernizacion.Id,
            FaseProyectoId = fase2Proy1.Id,
            UnidadId = unidadCorp.Id,
            DepartamentoId = deptoTi.Id,
            EquipoId = eqCoreTi.Id,
            Titulo = "Configurar motor de cálculo SLA con calendario laboral y pausas",
            Descripcion = "Integrar cálculo de primera respuesta y resolución respetando horarios de atención y estados en espera.",
            PrioridadId = prioAlta.Id,
            EstadoActividadId = estActProg.Id,
            FechaInicio = hoy.AddDays(-4),
            FechaVencimiento = hoy.AddDays(5),
            TiempoEstimadoMinutos = 360,
            PorcentajeAvance = 66.67m,
            CreadoPorId = usrAdmin.Id
        };

        var act3 = new Actividad
        {
            Codigo = "ACT-0003",
            ProyectoId = proyRedNorte.Id,
            UnidadId = unidadNorte.Id,
            DepartamentoId = deptoOpsNorte.Id,
            EquipoId = eqMesaNorte.Id,
            Titulo = "Diagnóstico de conmutación por error en firewall sucursal Monterrey",
            Descripcion = "Pruebas de redundancia de enlace secundario y validación de túnel VPN con corporativo.",
            PrioridadId = prioCritica.Id,
            EstadoActividadId = estActProg.Id,
            FechaInicio = hoy.AddDays(-7),
            FechaVencimiento = hoy.AddDays(-1), // Vencida para visibilidad en indicadores
            TiempoEstimadoMinutos = 240,
            PorcentajeAvance = 50m,
            CreadoPorId = usrPmo.Id
        };

        var act4 = new Actividad
        {
            Codigo = "ACT-0004",
            ProyectoId = proyRedNorte.Id,
            UnidadId = unidadNorte.Id,
            DepartamentoId = deptoOpsNorte.Id,
            EquipoId = eqMesaNorte.Id,
            Titulo = "Certificación final de enlaces SD-WAN en Unidad Norte",
            Descripcion = "Depende del diagnóstico de conmutación por error en el firewall principal.",
            PrioridadId = prioAlta.Id,
            EstadoActividadId = estActPorIni.Id,
            FechaInicio = hoy.AddDays(1),
            FechaVencimiento = hoy.AddDays(10),
            TiempoEstimadoMinutos = 300,
            PorcentajeAvance = 0m,
            CreadoPorId = usrPmo.Id
        };

        var act5 = new Actividad
        {
            Codigo = "ACT-0005",
            ProyectoId = proyLogisticaSur.Id,
            UnidadId = unidadSur.Id,
            DepartamentoId = deptoOpsSur.Id,
            Titulo = "Levantamiento de requerimientos operativos en almacén Sur",
            Descripcion = "Validación de flujos de recepción y despacho con supervisión regional Sur.",
            PrioridadId = prioMedia.Id,
            EstadoActividadId = estActRev.Id,
            FechaInicio = hoy.AddDays(-5),
            FechaVencimiento = hoy.AddDays(3),
            TiempoEstimadoMinutos = 180,
            PorcentajeAvance = 85m,
            CreadoPorId = usrOperativoSur.Id
        };

        db.Actividades.AddRange(act1, act2, act3, act4, act5);
        await db.SaveChangesAsync();

        db.ActividadAsignados.AddRange(
            new ActividadAsignado { ActividadId = act1.Id, UsuarioId = usrAdmin.Id, EsPrincipal = true, AsignadoPorId = usrAdmin.Id },
            new ActividadAsignado { ActividadId = act2.Id, UsuarioId = usrAdmin.Id, EsPrincipal = true, AsignadoPorId = usrAdmin.Id },
            new ActividadAsignado { ActividadId = act2.Id, UsuarioId = usrPmo.Id, EsPrincipal = false, AsignadoPorId = usrAdmin.Id },
            new ActividadAsignado { ActividadId = act3.Id, UsuarioId = usrSoporteNorte.Id, EsPrincipal = true, AsignadoPorId = usrPmo.Id },
            new ActividadAsignado { ActividadId = act4.Id, UsuarioId = usrSoporteNorte.Id, EsPrincipal = true, AsignadoPorId = usrPmo.Id },
            new ActividadAsignado { ActividadId = act5.Id, UsuarioId = usrOperativoSur.Id, EsPrincipal = true, AsignadoPorId = usrAdmin.Id }
        );

        db.ActividadDependencias.Add(new ActividadDependencia
        {
            ActividadId = act4.Id,
            ActividadPredecesoraId = act3.Id,
            TipoDependencia = "FS"
        });

        db.ActividadChecklists.AddRange(
            new ActividadChecklist { ActividadId = act2.Id, Titulo = "Definir entidades CalendarioSla y PoliticaSla", Orden = 1, Completado = true, CompletadoPorId = usrAdmin.Id, FechaCompletadoUtc = DateTime.UtcNow.AddDays(-2) },
            new ActividadChecklist { ActividadId = act2.Id, Titulo = "Implementar cálculo de pausas en estado En Espera", Orden = 2, Completado = true, CompletadoPorId = usrAdmin.Id, FechaCompletadoUtc = DateTime.UtcNow.AddDays(-1) },
            new ActividadChecklist { ActividadId = act2.Id, Titulo = "Conectar alertas de SLA en Dashboard Ejecutivo", Orden = 3, Completado = false },
            new ActividadChecklist { ActividadId = act3.Id, Titulo = "Verificar túnel IPSec primario", Orden = 1, Completado = true, CompletadoPorId = usrSoporteNorte.Id, FechaCompletadoUtc = DateTime.UtcNow.AddDays(-2) },
            new ActividadChecklist { ActividadId = act3.Id, Titulo = "Ejecutar corte controlado hacia enlace LTE de respaldo", Orden = 2, Completado = false }
        );

        db.ActividadTiempos.AddRange(
            new ActividadTiempo { ActividadId = act1.Id, UsuarioId = usrAdmin.Id, MinutosTrabajados = 450, FechaTrabajo = hoy.AddDays(-7), Descripcion = "Implementación y pruebas de seguridad RBAC + alcance por unidad" },
            new ActividadTiempo { ActividadId = act2.Id, UsuarioId = usrAdmin.Id, MinutosTrabajados = 210, FechaTrabajo = hoy.AddDays(-1), Descripcion = "Motor de cálculo de fechas límite SLA y pruebas unitarias" },
            new ActividadTiempo { ActividadId = act3.Id, UsuarioId = usrSoporteNorte.Id, MinutosTrabajados = 150, FechaTrabajo = hoy.AddDays(-2), Descripcion = "Revisión de tablas de ruteo y failover en sucursal Norte" }
        );

        db.ActividadHistorial.AddRange(
            new ActividadHistorial { ActividadId = act1.Id, UsuarioId = usrAdmin.Id, TipoCambio = "Estado", ValorAnterior = "En progreso", ValorNuevo = "Completada", Detalle = "Actividad validada con pruebas de integración." },
            new ActividadHistorial { ActividadId = act2.Id, UsuarioId = usrAdmin.Id, TipoCambio = "Creación", ValorNuevo = "En progreso", Detalle = "Actividad técnica iniciada." }
        );

        // 11. Tickets de Mesa de Ayuda con SLA real y vinculación a actividades
        var ahora = DateTime.UtcNow;
        var tkt1Creacion = ahora.AddHours(-3);
        var tkt1 = new Ticket
        {
            Folio = "TKT-2026-0001",
            Titulo = "Intermitencia en túnel VPN entre Sucursal Monterrey y Servidor Caja GA",
            Descripcion = "Se presentan desconexiones cada 25 minutos al sincronizar cortes de caja desde las terminales de Unidad Norte.",
            TicketTipoId = tipoIncidente.Id,
            TicketCategoriaId = catInfra.Id,
            PrioridadId = prioCritica.Id,
            EstadoTicketId = estTktAtencion.Id,
            SolicitanteId = usrPmo.Id,
            ResponsableId = usrSoporteNorte.Id,
            EquipoAsignadoId = eqMesaNorte.Id,
            UnidadId = unidadNorte.Id,
            DepartamentoId = deptoOpsNorte.Id,
            PoliticaSlaId = slaCritica.Id,
            FechaCreacionUtc = tkt1Creacion,
            FechaPrimeraRespuestaUtc = tkt1Creacion.AddMinutes(10),
            FechaLimitePrimeraRespuestaUtc = tkt1Creacion.AddMinutes(slaCritica.TiempoPrimeraRespuestaMinutos),
            FechaLimiteResolucionUtc = tkt1Creacion.AddMinutes(slaCritica.TiempoResolucionMinutos),
            EstadoSla = "Incumplido",
            Escalado = true
        };

        var tkt2Creacion = ahora.AddHours(-1);
        var tkt2 = new Ticket
        {
            Folio = "TKT-2026-0002",
            Titulo = "Habilitación de permisos de exportación de reportes para auditoría interna",
            Descripcion = "Solicito autorización y perfil de exportación de reportes ejecutivos para el cierre trimestral en Corporativo.",
            TicketTipoId = tipoSolicitud.Id,
            TicketCategoriaId = catSeguridad.Id,
            PrioridadId = prioMedia.Id,
            EstadoTicketId = estTktAsignado.Id,
            SolicitanteId = usrPmo.Id,
            ResponsableId = usrAdmin.Id,
            EquipoAsignadoId = eqCoreTi.Id,
            UnidadId = unidadCorp.Id,
            DepartamentoId = deptoPmo.Id,
            PoliticaSlaId = slaMedia.Id,
            FechaCreacionUtc = tkt2Creacion,
            FechaPrimeraRespuestaUtc = tkt2Creacion.AddMinutes(18),
            FechaLimitePrimeraRespuestaUtc = tkt2Creacion.AddMinutes(slaMedia.TiempoPrimeraRespuestaMinutos),
            FechaLimiteResolucionUtc = tkt2Creacion.AddMinutes(slaMedia.TiempoResolucionMinutos),
            EstadoSla = "EnTiempo"
        };

        var tkt3Creacion = ahora.AddHours(-26);
        var tkt3 = new Ticket
        {
            Folio = "TKT-2026-0003",
            Titulo = "Ajuste de impresora térmica de etiquetas en andén de recepción Sur",
            Descripcion = "La impresora Zebra del andén 2 desalineaba el código de barras de lotes entrantes.",
            TicketTipoId = tipoIncidente.Id,
            TicketCategoriaId = catSoporte.Id,
            PrioridadId = prioAlta.Id,
            EstadoTicketId = estTktResuelto.Id,
            SolicitanteId = usrOperativoSur.Id,
            ResponsableId = usrAdmin.Id,
            EquipoAsignadoId = eqCoreTi.Id,
            UnidadId = unidadSur.Id,
            DepartamentoId = deptoOpsSur.Id,
            PoliticaSlaId = slaAlta.Id,
            FechaCreacionUtc = tkt3Creacion,
            FechaPrimeraRespuestaUtc = tkt3Creacion.AddMinutes(14),
            FechaResolucionUtc = tkt3Creacion.AddMinutes(95),
            FechaLimitePrimeraRespuestaUtc = tkt3Creacion.AddMinutes(slaAlta.TiempoPrimeraRespuestaMinutos),
            FechaLimiteResolucionUtc = tkt3Creacion.AddMinutes(slaAlta.TiempoResolucionMinutos),
            EstadoSla = "Cumplido"
        };

        db.Tickets.AddRange(tkt1, tkt2, tkt3);
        await db.SaveChangesAsync();

        db.TicketActividades.Add(new TicketActividad
        {
            TicketId = tkt1.Id,
            ActividadId = act3.Id
        });

        db.TicketHistorial.AddRange(
            new TicketHistorial { TicketId = tkt1.Id, UsuarioId = usrPmo.Id, Accion = "Creación", EstadoNuevo = "Nuevo", Detalle = "Ticket registrado en Mesa de Ayuda." },
            new TicketHistorial { TicketId = tkt1.Id, UsuarioId = usrSoporteNorte.Id, Accion = "Tomar en atención", EstadoAnterior = "Nuevo", EstadoNuevo = "En atención", Detalle = "Se vinculó con la actividad técnica ACT-0003 para revisión de firewall." },
            new TicketHistorial { TicketId = tkt3.Id, UsuarioId = usrAdmin.Id, Accion = "Resolución", EstadoAnterior = "En atención", EstadoNuevo = "Resuelto", Detalle = "Se recalibró el sensor óptico y se actualizó plantilla ZPL." }
        );

        db.Comentarios.AddRange(
            new Comentario
            {
                TicketId = tkt1.Id,
                AutorId = usrSoporteNorte.Id,
                Contenido = "Diagnóstico interno: detectamos pérdida de paquetes del 12% en el proveedor primario de fibra. Aplicando cambio de métrica hacia enlace secundario.",
                EsInterno = true,
                MencionesJson = "[\"admin\"]"
            },
            new Comentario
            {
                TicketId = tkt1.Id,
                AutorId = usrSoporteNorte.Id,
                Contenido = "Estimada Elena, ya estamos aplicando la conmutación al enlace de respaldo para estabilizar la sincronización de Caja GA.",
                EsInterno = false
            }
        );

        db.Notificaciones.AddRange(
            new Notificacion
            {
                UsuarioDestinoId = usrAdmin.Id,
                TipoEvento = "SlaAlerta",
                Titulo = "Ticket crítico TKT-2026-0001 requiere seguimiento SLA",
                Mensaje = "El incidente de VPN en Unidad Operativa Norte ha superado su ventana objetivo y fue escalado.",
                UrlDestino = "/tickets"
            },
            new Notificacion
            {
                UsuarioDestinoId = usrAdmin.Id,
                TipoEvento = "TicketAsignado",
                Titulo = "Ticket asignado: TKT-2026-0002",
                Mensaje = "Tienes asignada la solicitud de permisos de exportación en Corporativo Central GA.",
                UrlDestino = "/tickets"
            }
        );

        db.AuditoriaEventos.Add(new AuditoriaEvento
        {
            UsuarioId = usrAdmin.Id,
            NombreUsuario = usrAdmin.NombreUsuario,
            Modulo = "Seguridad",
            Accion = "InicializacionSemilla",
            Entidad = "SistemaGestionGA",
            EntidadId = "v1.0",
            UnidadId = unidadCorp.Id,
            Resumen = "Inicialización automática de catálogos, matriz RBAC, unidades, políticas SLA y datos corporativos iniciales.",
            IpAddress = "127.0.0.1"
        });

        await db.SaveChangesAsync();

        await SembrarChatWhatsAppInicialAsync(db);
    }

    private static async Task SembrarChatWhatsAppInicialAsync(ApplicationDbContext db)
    {
        var adminUser = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == "admin");
        var sofiaUser = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == "sofia.torres") ?? adminUser;
        var carlosUser = await db.Usuarios.FirstOrDefaultAsync(u => u.NombreUsuario == "carlos.mendez") ?? adminUser;
        var unidad = await db.Unidades.FirstOrDefaultAsync();

        if (adminUser == null || unidad == null) return;

        var grupoDemo = new ChatGrupo
        {
            Nombre = "Soporte Regional & Proyectos GA",
            Descripcion = "Canal directo estilo WhatsApp para atención a requerimientos, seguimiento de actividades y resolución guiada.",
            UnidadId = unidad.Id,
            CreadoPorId = adminUser.Id,
            Activo = true,
            FechaCreacionUtc = DateTime.UtcNow.AddHours(-2)
        };

        grupoDemo.Miembros.Add(new ChatGrupoMiembro { UsuarioId = adminUser.Id, EsAdmin = true, FechaUnionUtc = DateTime.UtcNow.AddHours(-2) });
        if (sofiaUser.Id != adminUser.Id)
            grupoDemo.Miembros.Add(new ChatGrupoMiembro { UsuarioId = sofiaUser.Id, EsAdmin = false, FechaUnionUtc = DateTime.UtcNow.AddHours(-2) });
        if (carlosUser.Id != adminUser.Id)
            grupoDemo.Miembros.Add(new ChatGrupoMiembro { UsuarioId = carlosUser.Id, EsAdmin = false, FechaUnionUtc = DateTime.UtcNow.AddHours(-2) });

        var act1 = await db.Actividades.FirstOrDefaultAsync();
        if (act1 != null)
        {
            grupoDemo.ActividadActivaId = act1.Id;
            act1.ChatGrupoId = grupoDemo.Id;

            grupoDemo.Mensajes.Add(new ChatMensaje
            {
                UsuarioId = adminUser.Id,
                Texto = "¡Bienvenidos al canal WhatsApp de Soporte y Actividades GA! Cualquier solicitud que escriban aquí generará automáticamente su actividad de seguimiento.",
                TipoMensaje = "Sistema",
                FechaCreacionUtc = DateTime.UtcNow.AddMinutes(-40)
            });

            grupoDemo.Mensajes.Add(new ChatMensaje
            {
                UsuarioId = sofiaUser.Id,
                Texto = "Hola equipo, necesitamos revisar la sincronización de inventario con las terminales de Monterrey.",
                TipoMensaje = "Texto",
                ActividadId = act1.Id,
                FechaCreacionUtc = DateTime.UtcNow.AddMinutes(-30)
            });

            grupoDemo.Mensajes.Add(new ChatMensaje
            {
                UsuarioId = adminUser.Id,
                ActividadId = act1.Id,
                Texto = $"📌 Se vinculó la actividad {act1.Codigo} ('{act1.Titulo}') para dar seguimiento a esta solicitud.",
                TipoMensaje = "Sistema",
                FechaCreacionUtc = DateTime.UtcNow.AddMinutes(-25)
            });

            grupoDemo.Mensajes.Add(new ChatMensaje
            {
                UsuarioId = carlosUser.Id,
                ActividadId = act1.Id,
                Texto = "Ya validamos la conectividad VPN y se configuraron las reglas de enrutamiento necesarias.",
                TipoMensaje = "Texto",
                FechaCreacionUtc = DateTime.UtcNow.AddMinutes(-15)
            });

            var opciones = new[]
            {
                new { id = "resolver", texto = "✅ Sí, marcar como resuelto", accion = "RESOLVER_ACTIVIDAD" },
                new { id = "continuar", texto = "⏳ Aún no, requiero más apoyo", accion = "CONTINUAR" }
            };

            grupoDemo.Mensajes.Add(new ChatMensaje
            {
                UsuarioId = adminUser.Id,
                ActividadId = act1.Id,
                Texto = $"Estimada {sofiaUser.NombreCompleto}, ¿el requerimiento de la actividad {act1.Codigo} quedó resuelto satisfactoriamente? Elige tu respuesta para que el sistema actualice el seguimiento:",
                TipoMensaje = "PreguntaInteractiva",
                OpcionesInteractivasJson = System.Text.Json.JsonSerializer.Serialize(opciones),
                FechaCreacionUtc = DateTime.UtcNow.AddMinutes(-5)
            });
        }

        db.ChatGrupos.Add(grupoDemo);
        await db.SaveChangesAsync();
    }
}
