namespace SistemaGestionGA.Domain.Entities;

public class EstadoProyecto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#2563EB";
    public int Orden { get; set; }
    public bool EsFinal { get; set; }
}

public class EstadoActividad
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#2563EB";
    public int Orden { get; set; }
    public bool EsFinal { get; set; }
}

public class EstadoTicket
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#2563EB";
    public int Orden { get; set; }
    public bool PausaSla { get; set; }
    public bool EsFinal { get; set; }
}

public class Prioridad
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#2563EB";
    public int Nivel { get; set; }
}

public class Proyecto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }
    public int? EquipoId { get; set; }
    public Equipo? Equipo { get; set; }
    public int ResponsableId { get; set; }
    public Usuario? Responsable { get; set; }
    public int PrioridadId { get; set; }
    public Prioridad? Prioridad { get; set; }
    public int EstadoProyectoId { get; set; }
    public EstadoProyecto? EstadoProyecto { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFinEstimada { get; set; }
    public DateOnly? FechaFinReal { get; set; }
    public decimal PorcentajeAvance { get; set; }
    public bool Archivado { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacionUtc { get; set; }

    public ICollection<ProyectoFase> Fases { get; set; } = new List<ProyectoFase>();
    public ICollection<ProyectoIntegrante> Integrantes { get; set; } = new List<ProyectoIntegrante>();
    public ICollection<Actividad> Actividades { get; set; } = new List<Actividad>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
    public ICollection<Adjunto> Adjuntos { get; set; } = new List<Adjunto>();
}

public class ProyectoFase
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int Orden { get; set; } = 1;
    public bool EsHito { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFinEstimada { get; set; }
    public bool Completada { get; set; }
    public decimal PorcentajeAvance { get; set; }
}

public class ProyectoIntegrante
{
    public int ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string RolProyecto { get; set; } = "Colaborador";
    public DateTime FechaAsignacionUtc { get; set; } = DateTime.UtcNow;
}

public class Actividad
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? FaseProyectoId { get; set; }
    public ProyectoFase? FaseProyecto { get; set; }
    public int? ActividadPadreId { get; set; }
    public Actividad? ActividadPadre { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }
    public int? EquipoId { get; set; }
    public Equipo? Equipo { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int PrioridadId { get; set; }
    public Prioridad? Prioridad { get; set; }
    public int EstadoActividadId { get; set; }
    public EstadoActividad? EstadoActividad { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public DateTime? FechaFinalizacionRealUtc { get; set; }
    public int TiempoEstimadoMinutos { get; set; }
    public decimal PorcentajeAvance { get; set; }
    public bool EsRecurrente { get; set; }
    public string? PatronRecurrencia { get; set; }
    public bool Archivada { get; set; }
    public int? ChatGrupoId { get; set; }
    public ChatGrupo? ChatGrupo { get; set; }
    public int? CreadoPorId { get; set; }
    public int? ModificadoPorId { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacionUtc { get; set; }

    public ICollection<Actividad> Subtareas { get; set; } = new List<Actividad>();
    public ICollection<ActividadAsignado> Asignados { get; set; } = new List<ActividadAsignado>();
    public ICollection<ActividadDependencia> Dependencias { get; set; } = new List<ActividadDependencia>();
    public ICollection<ActividadChecklist> Checklists { get; set; } = new List<ActividadChecklist>();
    public ICollection<ActividadTiempo> Tiempos { get; set; } = new List<ActividadTiempo>();
    public ICollection<ActividadHistorial> Historial { get; set; } = new List<ActividadHistorial>();
    public ICollection<TicketActividad> TicketActividades { get; set; } = new List<TicketActividad>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
    public ICollection<Adjunto> Adjuntos { get; set; } = new List<Adjunto>();
    public ICollection<ChatMensaje> ChatMensajes { get; set; } = new List<ChatMensaje>();
}

public class ActividadAsignado
{
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public bool EsPrincipal { get; set; }
    public int? AsignadoPorId { get; set; }
    public DateTime FechaAsignacionUtc { get; set; } = DateTime.UtcNow;
}

public class ActividadDependencia
{
    public int Id { get; set; }
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int ActividadPredecesoraId { get; set; }
    public Actividad? ActividadPredecesora { get; set; }
    public string TipoDependencia { get; set; } = "FS"; // Finish-to-Start
}

public class ActividadChecklist
{
    public int Id { get; set; }
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public int Orden { get; set; } = 1;
    public bool Completado { get; set; }
    public int? CompletadoPorId { get; set; }
    public DateTime? FechaCompletadoUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}

public class ActividadTiempo
{
    public int Id { get; set; }
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int MinutosTrabajados { get; set; }
    public DateOnly FechaTrabajo { get; set; }
    public string? Descripcion { get; set; }
    public DateTime FechaRegistroUtc { get; set; } = DateTime.UtcNow;
}

public class ActividadHistorial
{
    public long Id { get; set; }
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string TipoCambio { get; set; } = string.Empty;
    public string? ValorAnterior { get; set; }
    public string? ValorNuevo { get; set; }
    public string? Detalle { get; set; }
    public DateTime FechaCambioUtc { get; set; } = DateTime.UtcNow;
}

public class TicketCategoria
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;
}

public class TicketTipo
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activa { get; set; } = true;
}

public class CalendarioSla
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string ZonaHoraria { get; set; } = "America/Mexico_City";
    public TimeOnly HoraInicioAtencion { get; set; } = new(8, 0);
    public TimeOnly HoraFinAtencion { get; set; } = new(18, 0);
    public string DiasLaborales { get; set; } = "1,2,3,4,5";
    public bool Activo { get; set; } = true;

    public ICollection<DiaFestivoSla> DiasFestivos { get; set; } = new List<DiaFestivoSla>();
}

public class DiaFestivoSla
{
    public int Id { get; set; }
    public int CalendarioSlaId { get; set; }
    public CalendarioSla? CalendarioSla { get; set; }
    public DateOnly Fecha { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

public class PoliticaSla
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int PrioridadId { get; set; }
    public Prioridad? Prioridad { get; set; }
    public int? TicketTipoId { get; set; }
    public TicketTipo? TicketTipo { get; set; }
    public int? TicketCategoriaId { get; set; }
    public TicketCategoria? TicketCategoria { get; set; }
    public int? UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? CalendarioSlaId { get; set; }
    public CalendarioSla? CalendarioSla { get; set; }
    public int? EquipoEscalamientoId { get; set; }
    public Equipo? EquipoEscalamiento { get; set; }
    public int TiempoPrimeraRespuestaMinutos { get; set; }
    public int TiempoResolucionMinutos { get; set; }
    public int UmbralAlertaPorcentaje { get; set; } = 80;
    public bool Activa { get; set; } = true;
}

public class Ticket
{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public int TicketTipoId { get; set; }
    public TicketTipo? TicketTipo { get; set; }
    public int TicketCategoriaId { get; set; }
    public TicketCategoria? TicketCategoria { get; set; }
    public int PrioridadId { get; set; }
    public Prioridad? Prioridad { get; set; }
    public int EstadoTicketId { get; set; }
    public EstadoTicket? EstadoTicket { get; set; }
    public int SolicitanteId { get; set; }
    public Usuario? Solicitante { get; set; }
    public int? ResponsableId { get; set; }
    public Usuario? Responsable { get; set; }
    public int? EquipoAsignadoId { get; set; }
    public Equipo? EquipoAsignado { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? DepartamentoId { get; set; }
    public Departamento? Departamento { get; set; }
    public int? PoliticaSlaId { get; set; }
    public PoliticaSla? PoliticaSla { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
    public DateTime? FechaPrimeraRespuestaUtc { get; set; }
    public DateTime? FechaResolucionUtc { get; set; }
    public DateTime? FechaCierreUtc { get; set; }
    public DateTime? FechaLimitePrimeraRespuestaUtc { get; set; }
    public DateTime? FechaLimiteResolucionUtc { get; set; }
    public DateTime? FechaUltimoInicioPausaUtc { get; set; }
    public int MinutosPausadoSla { get; set; }
    public string EstadoSla { get; set; } = "EnTiempo";
    public bool Escalado { get; set; }
    public DateTime? FechaModificacionUtc { get; set; }

    public ICollection<TicketActividad> TicketActividades { get; set; } = new List<TicketActividad>();
    public ICollection<TicketHistorial> Historial { get; set; } = new List<TicketHistorial>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
    public ICollection<Adjunto> Adjuntos { get; set; } = new List<Adjunto>();
}

public class TicketActividad
{
    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public int ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public DateTime FechaVinculacionUtc { get; set; } = DateTime.UtcNow;
}

public class TicketHistorial
{
    public long Id { get; set; }
    public int TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? EstadoAnterior { get; set; }
    public string? EstadoNuevo { get; set; }
    public string? Detalle { get; set; }
    public DateTime FechaEventoUtc { get; set; } = DateTime.UtcNow;
}

public class Comentario
{
    public int Id { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int? TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public int AutorId { get; set; }
    public Usuario? Autor { get; set; }
    public string Contenido { get; set; } = string.Empty;
    public string? MencionesJson { get; set; }
    public bool EsInterno { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}

public class Adjunto
{
    public int Id { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public int? TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public string NombreOriginal { get; set; } = string.Empty;
    public string NombreAlmacenado { get; set; } = string.Empty;
    public string RutaRelativa { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }
    public string? HashSha256 { get; set; }
    public bool EsEvidencia { get; set; }
    public int SubidoPorId { get; set; }
    public Usuario? SubidoPor { get; set; }
    public DateTime FechaSubidaUtc { get; set; } = DateTime.UtcNow;
}

public class Notificacion
{
    public long Id { get; set; }
    public int UsuarioDestinoId { get; set; }
    public Usuario? UsuarioDestino { get; set; }
    public string TipoEvento { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
    public string? UrlDestino { get; set; }
    public bool Leida { get; set; }
    public DateTime? FechaLecturaUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}

public class ReglaAutomatizacion
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string EventoDisparador { get; set; } = string.Empty;
    public string CondicionJson { get; set; } = "{}";
    public string AccionTipo { get; set; } = string.Empty;
    public string AccionConfigJson { get; set; } = "{}";
    public bool Activa { get; set; } = true;
    public int TotalEjecuciones { get; set; }
    public int TotalFallos { get; set; }
    public DateTime? UltimaEjecucionUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}

public class ChatGrupo
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public int UnidadId { get; set; }
    public Unidad? Unidad { get; set; }
    public int? ActividadActivaId { get; set; }
    public Actividad? ActividadActiva { get; set; }
    public int CreadoPorId { get; set; }
    public Usuario? CreadoPor { get; set; }
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ChatGrupoMiembro> Miembros { get; set; } = new List<ChatGrupoMiembro>();
    public ICollection<ChatMensaje> Mensajes { get; set; } = new List<ChatMensaje>();
    public ICollection<Actividad> Actividades { get; set; } = new List<Actividad>();
}

public class ChatGrupoMiembro
{
    public int ChatGrupoId { get; set; }
    public ChatGrupo? ChatGrupo { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public bool EsAdmin { get; set; }
    public DateTime FechaUnionUtc { get; set; } = DateTime.UtcNow;
}

public class ChatMensaje
{
    public long Id { get; set; }
    public int ChatGrupoId { get; set; }
    public ChatGrupo? ChatGrupo { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int? ActividadId { get; set; }
    public Actividad? Actividad { get; set; }
    public string Texto { get; set; } = string.Empty;
    public string TipoMensaje { get; set; } = "Texto"; // Texto, Sistema, PreguntaInteractiva, RespuestaInteractiva
    public string? OpcionesInteractivasJson { get; set; }
    public string? OpcionSeleccionada { get; set; }
    public int? RespondidoPorUsuarioId { get; set; }
    public Usuario? RespondidoPorUsuario { get; set; }
    public DateTime? FechaRespuestaUtc { get; set; }
    public DateTime FechaCreacionUtc { get; set; } = DateTime.UtcNow;
}
