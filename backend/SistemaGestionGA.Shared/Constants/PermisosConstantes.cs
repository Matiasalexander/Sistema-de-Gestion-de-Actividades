namespace SistemaGestionGA.Shared.Constants;

public static class PermisosConstantes
{
    public const string ProyectosVer = "proyectos.ver";
    public const string ProyectosCrear = "proyectos.crear";
    public const string ProyectosEditar = "proyectos.editar";
    public const string ProyectosEliminar = "proyectos.eliminar";

    public const string ActividadesVer = "actividades.ver";
    public const string ActividadesCrear = "actividades.crear";
    public const string ActividadesEditar = "actividades.editar";
    public const string ActividadesAsignar = "actividades.asignar";
    public const string ActividadesCerrar = "actividades.cerrar";
    public const string ActividadesEliminar = "actividades.eliminar";

    public const string TicketsVer = "tickets.ver";
    public const string TicketsCrear = "tickets.crear";
    public const string TicketsAsignar = "tickets.asignar";
    public const string TicketsAtender = "tickets.atender";
    public const string TicketsResolver = "tickets.resolver";
    public const string TicketsCerrar = "tickets.cerrar";
    public const string TicketsReabrir = "tickets.reabrir";
    public const string TicketsEliminar = "tickets.eliminar";

    public const string UsuariosVer = "usuarios.ver";
    public const string UsuariosCrear = "usuarios.crear";
    public const string UsuariosEditar = "usuarios.editar";
    public const string UsuariosDesactivar = "usuarios.desactivar";
    public const string UsuariosEliminar = "usuarios.eliminar";

    public const string RolesGestionar = "roles.gestionar";
    public const string UnidadesGestionar = "unidades.gestionar";
    public const string UnidadesEliminar = "unidades.eliminar";
    public const string EquiposGestionar = "equipos.gestionar";
    public const string EquiposEliminar = "equipos.eliminar";

    public const string ReportesVer = "reportes.ver";
    public const string ReportesExportar = "reportes.exportar";
    public const string AuditoriaVer = "auditoria.ver";
    public const string ConfiguracionGestionar = "configuracion.gestionar";

    public const string ChatVer = "chat.ver";
    public const string ChatCrear = "chat.crear";
    public const string ChatEliminar = "chat.eliminar";

    public static IReadOnlyList<(string Codigo, string Modulo, string Accion, string Nombre, string Descripcion)> ObtenerCatalogo() =>
    [
        (ProyectosVer, "Proyectos", "Ver", "Consultar proyectos", "Permite listar y ver el detalle de proyectos dentro de las unidades autorizadas"),
        (ProyectosCrear, "Proyectos", "Crear", "Crear proyectos", "Permite dar de alta nuevos proyectos corporativos o tecnológicos"),
        (ProyectosEditar, "Proyectos", "Editar", "Editar proyectos", "Permite modificar fechas, fases, responsables y estados de proyectos"),
        (ProyectosEliminar, "Proyectos", "Eliminar", "Archivar o eliminar proyectos", "Permite archivar proyectos dentro del alcance autorizado"),

        (ActividadesVer, "Actividades", "Ver", "Consultar actividades", "Permite visualizar actividades, tableros Kanban, calendario, Gantt y carga"),
        (ActividadesCrear, "Actividades", "Crear", "Crear actividades", "Permite registrar actividades, subtareas y checklists"),
        (ActividadesEditar, "Actividades", "Editar", "Editar actividades", "Permite actualizar fechas, prioridades, dependencias y tiempos trabajados"),
        (ActividadesAsignar, "Actividades", "Asignar", "Asignar responsables", "Permite asignar o reasignar responsables a una actividad"),
        (ActividadesCerrar, "Actividades", "Cerrar", "Completar o cerrar actividades", "Permite marcar actividades como completadas o canceladas validando reglas de negocio"),
        (ActividadesEliminar, "Actividades", "Eliminar", "Archivar o eliminar actividades", "Permite archivar o cancelar actividades lógicamente"),

        (TicketsVer, "Tickets", "Ver", "Consultar tickets", "Permite consultar tickets en el alcance de unidad o solicitados por el usuario"),
        (TicketsCrear, "Tickets", "Crear", "Levantar tickets", "Permite registrar incidentes, solicitudes, requerimientos o consultas"),
        (TicketsAsignar, "Tickets", "Asignar", "Asignar tickets", "Permite asignar tickets a especialistas o equipos de soporte"),
        (TicketsAtender, "Tickets", "Atender", "Atender tickets", "Permite tomar en atención, pausar por espera y registrar notas técnicas internas"),
        (TicketsResolver, "Tickets", "Resolver", "Resolver tickets", "Permite documentar la solución técnica y pasar el ticket a estado Resuelto"),
        (TicketsCerrar, "Tickets", "Cerrar", "Cerrar tickets", "Permite confirmar el cierre definitivo del ticket"),
        (TicketsReabrir, "Tickets", "Reabrir", "Reabrir tickets", "Permite reabrir un ticket resuelto o cerrado cuando persiste la incidencia"),
        (TicketsEliminar, "Tickets", "Eliminar", "Cancelar o eliminar tickets", "Permite cancelar o eliminar tickets en el sistema"),

        (UsuariosVer, "Usuarios", "Ver", "Consultar usuarios", "Permite consultar el directorio de usuarios, roles, unidades y accesos"),
        (UsuariosCrear, "Usuarios", "Crear", "Alta de usuarios", "Permite registrar nuevos usuarios y asignarles roles, unidades y equipos"),
        (UsuariosEditar, "Usuarios", "Editar", "Editar usuarios", "Permite modificar perfil, roles, unidades, departamentos y restablecer contraseñas"),
        (UsuariosDesactivar, "Usuarios", "Desactivar", "Activar o desactivar usuarios", "Permite suspender o reactivar cuentas de usuario y revocar sesiones"),
        (UsuariosEliminar, "Usuarios", "Eliminar", "Dar de baja o eliminar usuarios", "Permite dar de baja definitiva o eliminar usuarios sin historial"),

        (RolesGestionar, "Seguridad", "Gestionar Roles", "Administrar roles y permisos", "Permite crear y editar roles y su matriz de permisos en base de datos"),
        (UnidadesGestionar, "Organización", "Gestionar Unidades", "Administrar unidades y departamentos", "Permite crear y editar unidades de negocio y departamentos"),
        (UnidadesEliminar, "Organización", "Eliminar Unidades", "Eliminar unidades de negocio", "Permite desvincular y eliminar unidades de negocio"),
        (EquiposGestionar, "Organización", "Gestionar Equipos", "Administrar equipos de trabajo", "Permite configurar equipos multidisciplinarios y sus integrantes"),
        (EquiposEliminar, "Organización", "Eliminar", "Eliminar equipos de trabajo", "Permite desvincular y eliminar equipos de trabajo"),

        (ReportesVer, "Reportes", "Ver", "Consultar dashboard y reportes", "Permite visualizar indicadores ejecutivos y reportes operativos"),
        (ReportesExportar, "Reportes", "Exportar", "Exportar reportes CSV/Excel", "Permite descargar reportes en formato CSV y Excel"),
        (AuditoriaVer, "Seguridad", "Auditoría", "Consultar bitácora de auditoría", "Permite inspeccionar el historial de accesos y auditoría de modificaciones"),
        (ConfiguracionGestionar, "Configuración", "Gestionar", "Administrar SLA y automatizaciones", "Permite configurar políticas SLA, calendarios y reglas de automatización"),

        (ChatVer, "Chat", "Ver", "Consultar y participar en chats", "Permite participar en canales y grupos de chat tipo WhatsApp"),
        (ChatCrear, "Chat", "Crear", "Crear grupos y administrar miembros", "Permite a los administradores crear grupos de chat e incorporar participantes"),
        (ChatEliminar, "Chat", "Eliminar", "Eliminar grupos de chat", "Permite a los administradores eliminar grupos de chat")
    ];
}
