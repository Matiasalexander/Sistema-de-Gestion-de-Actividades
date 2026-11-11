using System.ComponentModel.DataAnnotations;

namespace SistemaGestionGA.Application.DTOs;

public record CatalogoItemDto(int Id, string Codigo, string Nombre, string ColorHex, int Orden, bool EsFinal = false, bool PausaSla = false);

public record CatalogosOperativosDto(
    IReadOnlyList<CatalogoItemDto> Prioridades,
    IReadOnlyList<CatalogoItemDto> EstadosProyecto,
    IReadOnlyList<CatalogoItemDto> EstadosActividad,
    IReadOnlyList<CatalogoItemDto> EstadosTicket,
    IReadOnlyList<CatalogoItemDto> TiposTicket,
    IReadOnlyList<CatalogoItemDto> CategoriasTicket);

public record ProyectoFaseDto(
    int Id,
    int ProyectoId,
    string Nombre,
    string? Descripcion,
    int Orden,
    bool EsHito,
    DateOnly? FechaInicio,
    DateOnly? FechaFinEstimada,
    bool Completada,
    decimal PorcentajeAvance);

public record GuardarProyectoFaseDto(
    [Required, MaxLength(150)] string Nombre,
    string? Descripcion,
    int Orden,
    bool EsHito,
    DateOnly? FechaInicio,
    DateOnly? FechaFinEstimada,
    bool Completada);

public record ProyectoDto(
    int Id,
    string Codigo,
    string Nombre,
    string? Descripcion,
    int UnidadId,
    string UnidadNombre,
    int? DepartamentoId,
    string? DepartamentoNombre,
    int? EquipoId,
    string? EquipoNombre,
    int ResponsableId,
    string ResponsableNombre,
    int PrioridadId,
    string PrioridadNombre,
    string PrioridadColor,
    int EstadoProyectoId,
    string EstadoCodigo,
    string EstadoNombre,
    string EstadoColor,
    DateOnly FechaInicio,
    DateOnly FechaFinEstimada,
    DateOnly? FechaFinReal,
    decimal PorcentajeAvance,
    bool Archivado,
    int TotalActividades,
    int ActividadesCompletadas,
    DateTime FechaCreacionUtc,
    IReadOnlyList<ProyectoFaseDto> Fases,
    IReadOnlyList<EquipoIntegranteDto> Integrantes);

public record GuardarProyectoDto(
    [Required, MaxLength(30)] string Codigo,
    [Required, MaxLength(200)] string Nombre,
    string? Descripcion,
    [Required] int UnidadId,
    int? DepartamentoId,
    int? EquipoId,
    [Required] int ResponsableId,
    [Required] int PrioridadId,
    [Required] int EstadoProyectoId,
    [Required] DateOnly FechaInicio,
    [Required] DateOnly FechaFinEstimada,
    IReadOnlyList<int>? IntegrantesIds);

public record ActividadAsignadoDto(
    int UsuarioId,
    string NombreCompleto,
    string Email,
    bool EsPrincipal);

public record ChecklistItemDto(
    int Id,
    int ActividadId,
    string Titulo,
    int Orden,
    bool Completado,
    DateTime? FechaCompletadoUtc);

public record CrearChecklistItemDto(
    [Required, MaxLength(250)] string Titulo,
    int Orden = 1);

public record TiempoActividadDto(
    int Id,
    int ActividadId,
    int UsuarioId,
    string UsuarioNombre,
    int MinutosTrabajados,
    DateOnly FechaTrabajo,
    string? Descripcion,
    DateTime FechaRegistroUtc);

public record RegistrarTiempoActividadDto(
    [Range(1, 1440)] int MinutosTrabajados,
    DateOnly FechaTrabajo,
    string? Descripcion);

public record DependenciaActividadDto(
    int Id,
    int ActividadId,
    int ActividadPredecesoraId,
    string PredecesoraCodigo,
    string PredecesoraTitulo,
    string PredecesoraEstado,
    string TipoDependencia);

public record CrearDependenciaDto(
    [Required] int ActividadPredecesoraId,
    string TipoDependencia = "FS");

public record ActividadHistorialDto(
    long Id,
    int ActividadId,
    string? UsuarioNombre,
    string TipoCambio,
    string? ValorAnterior,
    string? ValorNuevo,
    string? Detalle,
    DateTime FechaCambioUtc);

public record ActividadDto(
    int Id,
    string Codigo,
    int? ProyectoId,
    string? ProyectoCodigo,
    string? ProyectoNombre,
    int? FaseProyectoId,
    string? FaseNombre,
    int? ActividadPadreId,
    int UnidadId,
    string UnidadNombre,
    int? DepartamentoId,
    string? DepartamentoNombre,
    int? EquipoId,
    string? EquipoNombre,
    string Titulo,
    string? Descripcion,
    int PrioridadId,
    string PrioridadCodigo,
    string PrioridadNombre,
    string PrioridadColor,
    int EstadoActividadId,
    string EstadoCodigo,
    string EstadoNombre,
    string EstadoColor,
    DateOnly? FechaInicio,
    DateOnly? FechaVencimiento,
    DateTime? FechaFinalizacionRealUtc,
    int TiempoEstimadoMinutos,
    int TiempoTrabajadoMinutos,
    decimal PorcentajeAvance,
    bool EsRecurrente,
    string? PatronRecurrencia,
    bool Archivada,
    bool EstaVencida,
    int TotalSubtareas,
    int SubtareasCompletadas,
    int TotalChecklist,
    int ChecklistCompletados,
    DateTime FechaCreacionUtc,
    IReadOnlyList<ActividadAsignadoDto> Asignados,
    IReadOnlyList<ChecklistItemDto> Checklists,
    IReadOnlyList<DependenciaActividadDto> Dependencias,
    IReadOnlyList<TiempoActividadDto> Tiempos,
    IReadOnlyList<ActividadHistorialDto> Historial,
    IReadOnlyList<string> TicketsVinculadosFolios,
    int? ChatGrupoId = null,
    string? ChatGrupoNombre = null);

public record GuardarActividadDto(
    int? ProyectoId,
    int? FaseProyectoId,
    int? ActividadPadreId,
    [Required] int UnidadId,
    int? DepartamentoId,
    int? EquipoId,
    [Required, MaxLength(250)] string Titulo,
    string? Descripcion,
    [Required] int PrioridadId,
    [Required] int EstadoActividadId,
    DateOnly? FechaInicio,
    DateOnly? FechaVencimiento,
    int TiempoEstimadoMinutos,
    decimal PorcentajeAvance,
    bool EsRecurrente,
    string? PatronRecurrencia,
    IReadOnlyList<int> ResponsablesIds,
    int? ResponsablePrincipalId);

public record CambiarEstadoActividadDto(
    [Required] int NuevoEstadoActividadId,
    string? Comentario);

public record TicketHistorialDto(
    long Id,
    int TicketId,
    string? UsuarioNombre,
    string Accion,
    string? EstadoAnterior,
    string? EstadoNuevo,
    string? Detalle,
    DateTime FechaEventoUtc);

public record TicketActividadResumenDto(
    int ActividadId,
    string Codigo,
    string Titulo,
    string EstadoNombre,
    string EstadoColor,
    decimal PorcentajeAvance);

public record TicketDto(
    int Id,
    string Folio,
    string Titulo,
    string Descripcion,
    int TicketTipoId,
    string TipoNombre,
    int TicketCategoriaId,
    string CategoriaNombre,
    int PrioridadId,
    string PrioridadCodigo,
    string PrioridadNombre,
    string PrioridadColor,
    int EstadoTicketId,
    string EstadoCodigo,
    string EstadoNombre,
    string EstadoColor,
    int SolicitanteId,
    string SolicitanteNombre,
    int? ResponsableId,
    string? ResponsableNombre,
    int? EquipoAsignadoId,
    string? EquipoAsignadoNombre,
    int UnidadId,
    string UnidadNombre,
    int? DepartamentoId,
    string? DepartamentoNombre,
    int? PoliticaSlaId,
    string? PoliticaSlaNombre,
    DateTime FechaCreacionUtc,
    DateTime? FechaPrimeraRespuestaUtc,
    DateTime? FechaResolucionUtc,
    DateTime? FechaCierreUtc,
    DateTime? FechaLimitePrimeraRespuestaUtc,
    DateTime? FechaLimiteResolucionUtc,
    int MinutosPausadoSla,
    string EstadoSla,
    bool Escalado,
    IReadOnlyList<TicketActividadResumenDto> ActividadesRelacionadas,
    IReadOnlyList<TicketHistorialDto> Historial,
    IReadOnlyList<ComentarioDto> Comentarios,
    IReadOnlyList<AdjuntoDto> Adjuntos);

public record CrearTicketDto(
    [Required, MaxLength(250)] string Titulo,
    [Required] string Descripcion,
    [Required] int TicketTipoId,
    [Required] int TicketCategoriaId,
    [Required] int PrioridadId,
    [Required] int UnidadId,
    int? DepartamentoId,
    int? EquipoAsignadoId,
    int? ResponsableId);

public record AsignarTicketDto(
    int? ResponsableId,
    int? EquipoAsignadoId,
    string? NotaAsignacion);

public record AccionEstadoTicketDto(
    string? Comentario,
    bool EsInterno = false);

public record VincularActividadTicketDto(
    int? ActividadExistenteId,
    GuardarActividadDto? NuevaActividad);

public record ComentarioDto(
    int Id,
    int? ProyectoId,
    int? ActividadId,
    int? TicketId,
    int AutorId,
    string AutorNombre,
    string Contenido,
    string? MencionesJson,
    bool EsInterno,
    DateTime FechaCreacionUtc);

public record CrearComentarioDto(
    [Required] string Contenido,
    bool EsInterno = false,
    string? MencionesJson = null);

public record AdjuntoDto(
    int Id,
    int? ProyectoId,
    int? ActividadId,
    int? TicketId,
    string NombreOriginal,
    string ContentType,
    long TamanoBytes,
    bool EsEvidencia,
    int SubidoPorId,
    string SubidoPorNombre,
    DateTime FechaSubidaUtc);

public record PoliticaSlaDto(
    int Id,
    string Nombre,
    int PrioridadId,
    string PrioridadNombre,
    int? TicketTipoId,
    string? TipoNombre,
    int? TicketCategoriaId,
    string? CategoriaNombre,
    int? UnidadId,
    string? UnidadNombre,
    int? CalendarioSlaId,
    string? CalendarioNombre,
    int TiempoPrimeraRespuestaMinutos,
    int TiempoResolucionMinutos,
    int UmbralAlertaPorcentaje,
    bool Activa);

public record GuardarPoliticaSlaDto(
    [Required, MaxLength(150)] string Nombre,
    [Required] int PrioridadId,
    int? TicketTipoId,
    int? TicketCategoriaId,
    int? UnidadId,
    int? CalendarioSlaId,
    [Range(5, 43200)] int TiempoPrimeraRespuestaMinutos,
    [Range(15, 129600)] int TiempoResolucionMinutos,
    [Range(50, 99)] int UmbralAlertaPorcentaje = 80,
    bool Activa = true);

public record NotificacionDto(
    long Id,
    string TipoEvento,
    string Titulo,
    string Mensaje,
    string? UrlDestino,
    bool Leida,
    DateTime FechaCreacionUtc);

public record ReglaAutomatizacionDto(
    int Id,
    string Nombre,
    string? Descripcion,
    string EventoDisparador,
    string CondicionJson,
    string AccionTipo,
    string AccionConfigJson,
    bool Activa,
    int TotalEjecuciones,
    int TotalFallos,
    DateTime? UltimaEjecucionUtc);

public record GuardarReglaAutomatizacionDto(
    [Required, MaxLength(150)] string Nombre,
    string? Descripcion,
    [Required] string EventoDisparador,
    string CondicionJson,
    [Required] string AccionTipo,
    string AccionConfigJson,
    bool Activa = true);

public record SerieGraficoDto(string Etiqueta, decimal Valor, string? ColorHex = null);

public record CargaResponsableDto(
    int UsuarioId,
    string NombreCompleto,
    string? Cargo,
    string UnidadNombre,
    int ActividadesActivas,
    int ActividadesCompletadas,
    int ActividadesVencidas,
    int TicketsAsignados,
    int MinutosEstimados,
    int MinutosTrabajados,
    decimal IndiceProductividad);

public record DashboardEjecutivoDto(
    int TotalProyectos,
    int ProyectosActivos,
    int ActividadesPendientes,
    int ActividadesEnProgreso,
    int ActividadesCompletadas,
    int ActividadesVencidas,
    int TicketsAbiertos,
    int TicketsResueltos,
    int TicketsVencidosSla,
    decimal PorcentajeCumplimientoSla,
    decimal TiempoPromedioPrimeraRespuestaMin,
    decimal TiempoPromedioResolucionMin,
    IReadOnlyList<SerieGraficoDto> ActividadesPorEstado,
    IReadOnlyList<SerieGraficoDto> TicketsPorPrioridad,
    IReadOnlyList<SerieGraficoDto> TicketsPorCategoria,
    IReadOnlyList<SerieGraficoDto> TendenciaMensualTickets,
    IReadOnlyList<SerieGraficoDto> DistribucionSla,
    IReadOnlyList<SerieGraficoDto> AvanceProyectos,
    IReadOnlyList<SerieGraficoDto> ComparativoUnidades,
    IReadOnlyList<CargaResponsableDto> ProductividadResponsables);
