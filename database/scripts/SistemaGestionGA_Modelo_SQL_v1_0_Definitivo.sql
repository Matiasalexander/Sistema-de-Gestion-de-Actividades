/* =========================================================================
   SISTEMA DE GESTIÓN GA - MODELO RELACIONAL DEFINITIVO (v1.0)
   Motor: Microsoft SQL Server 2019+
   Base de datos de desarrollo: SistemaGestionGA
   Todas las fechas de auditoría y eventos se almacenan en UTC (SYSUTCDATETIME()).
   ========================================================================= */

-- 1. ORGANIZACIÓN Y SEGURIDAD
CREATE TABLE Unidades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(20) NOT NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    ZonaHoraria NVARCHAR(80) NOT NULL DEFAULT 'America/Mexico_City',
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaModificacionUtc DATETIME2 NULL
);

CREATE TABLE Departamentos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    Codigo NVARCHAR(20) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Departamentos_Unidad_Codigo UNIQUE (UnidadId, Codigo)
);

CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(80) NOT NULL UNIQUE,
    Email NVARCHAR(180) NOT NULL UNIQUE,
    NombreCompleto NVARCHAR(200) NOT NULL,
    Cargo NVARCHAR(120) NULL,
    Telefono NVARCHAR(40) NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    AccesoGlobalUnidades BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    DebeCambiarPassword BIT NOT NULL DEFAULT 0,
    IntentosFallidos INT NOT NULL DEFAULT 0,
    BloqueadoHastaUtc DATETIME2 NULL,
    UltimoAccesoUtc DATETIME2 NULL,
    TokenRecuperacionHash NVARCHAR(500) NULL,
    TokenRecuperacionExpiraUtc DATETIME2 NULL,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaModificacionUtc DATETIME2 NULL
);

CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(60) NOT NULL UNIQUE,
    Nombre NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    EsSistema BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Permisos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(100) NOT NULL UNIQUE,
    Modulo NVARCHAR(80) NOT NULL,
    Accion NVARCHAR(80) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(400) NULL
);

CREATE TABLE UsuarioRoles (
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id) ON DELETE CASCADE,
    RolId INT NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    FechaAsignacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UsuarioId, RolId)
);

CREATE TABLE RolPermisos (
    RolId INT NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    PermisoId INT NOT NULL REFERENCES Permisos(Id) ON DELETE CASCADE,
    PRIMARY KEY (RolId, PermisoId)
);

CREATE TABLE UsuarioUnidades (
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id) ON DELETE CASCADE,
    UnidadId INT NOT NULL REFERENCES Unidades(Id) ON DELETE CASCADE,
    EsUnidadPrincipal BIT NOT NULL DEFAULT 0,
    FechaAsignacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UsuarioId, UnidadId)
);

CREATE TABLE Equipos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(30) NOT NULL UNIQUE,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    ColorHex NVARCHAR(20) NOT NULL DEFAULT '#2563EB',
    LiderUsuarioId INT NULL REFERENCES Usuarios(Id),
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE UsuarioEquipos (
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id) ON DELETE CASCADE,
    EquipoId INT NOT NULL REFERENCES Equipos(Id) ON DELETE CASCADE,
    RolEnEquipo NVARCHAR(80) NOT NULL DEFAULT 'Integrante',
    FechaIncorporacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (UsuarioId, EquipoId)
);

CREATE TABLE HistorialAccesos (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NULL REFERENCES Usuarios(Id),
    IdentificadorIntentado NVARCHAR(180) NOT NULL,
    Exitoso BIT NOT NULL,
    Motivo NVARCHAR(250) NULL,
    IpAddress NVARCHAR(60) NULL,
    UserAgent NVARCHAR(400) NULL,
    FechaIntentoUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 2. CATÁLOGOS DE ESTADOS Y PRIORIDADES
CREATE TABLE EstadosProyecto (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(80) NOT NULL,
    ColorHex NVARCHAR(20) NOT NULL,
    Orden INT NOT NULL,
    EsFinal BIT NOT NULL DEFAULT 0
);

CREATE TABLE EstadosActividad (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(80) NOT NULL,
    ColorHex NVARCHAR(20) NOT NULL,
    Orden INT NOT NULL,
    EsFinal BIT NOT NULL DEFAULT 0
);

CREATE TABLE EstadosTicket (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(80) NOT NULL,
    ColorHex NVARCHAR(20) NOT NULL,
    Orden INT NOT NULL,
    PausaSla BIT NOT NULL DEFAULT 0,
    EsFinal BIT NOT NULL DEFAULT 0
);

CREATE TABLE Prioridades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(80) NOT NULL,
    ColorHex NVARCHAR(20) NOT NULL,
    Nivel INT NOT NULL
);

-- 3. PROYECTOS Y FASES
CREATE TABLE Proyectos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(30) NOT NULL UNIQUE,
    Nombre NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    EquipoId INT NULL REFERENCES Equipos(Id),
    ResponsableId INT NOT NULL REFERENCES Usuarios(Id),
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    EstadoProyectoId INT NOT NULL REFERENCES EstadosProyecto(Id),
    FechaInicio DATE NOT NULL,
    FechaFinEstimada DATE NOT NULL,
    FechaFinReal DATE NULL,
    PorcentajeAvance DECIMAL(5,2) NOT NULL DEFAULT 0,
    Archivado BIT NOT NULL DEFAULT 0,
    CreadoPorId INT NULL REFERENCES Usuarios(Id),
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaModificacionUtc DATETIME2 NULL
);

CREATE TABLE ProyectoFases (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoId INT NOT NULL REFERENCES Proyectos(Id) ON DELETE CASCADE,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    Orden INT NOT NULL DEFAULT 1,
    EsHito BIT NOT NULL DEFAULT 0,
    FechaInicio DATE NULL,
    FechaFinEstimada DATE NULL,
    Completada BIT NOT NULL DEFAULT 0,
    PorcentajeAvance DECIMAL(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE ProyectoIntegrantes (
    ProyectoId INT NOT NULL REFERENCES Proyectos(Id) ON DELETE CASCADE,
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    RolProyecto NVARCHAR(80) NOT NULL DEFAULT 'Colaborador',
    FechaAsignacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (ProyectoId, UsuarioId)
);

-- 4. ACTIVIDADES, SUBTAREAS, CHECKLISTS Y TIEMPOS
CREATE TABLE Actividades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(30) NOT NULL UNIQUE,
    ProyectoId INT NULL REFERENCES Proyectos(Id),
    FaseProyectoId INT NULL REFERENCES ProyectoFases(Id),
    ActividadPadreId INT NULL REFERENCES Actividades(Id),
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    EquipoId INT NULL REFERENCES Equipos(Id),
    Titulo NVARCHAR(250) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    EstadoActividadId INT NOT NULL REFERENCES EstadosActividad(Id),
    FechaInicio DATE NULL,
    FechaVencimiento DATE NULL,
    FechaFinalizacionRealUtc DATETIME2 NULL,
    TiempoEstimadoMinutos INT NOT NULL DEFAULT 0,
    PorcentajeAvance DECIMAL(5,2) NOT NULL DEFAULT 0,
    EsRecurrente BIT NOT NULL DEFAULT 0,
    PatronRecurrencia NVARCHAR(100) NULL,
    Archivada BIT NOT NULL DEFAULT 0,
    CreadoPorId INT NULL REFERENCES Usuarios(Id),
    ModificadoPorId INT NULL REFERENCES Usuarios(Id),
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaModificacionUtc DATETIME2 NULL
);

CREATE TABLE ActividadAsignados (
    ActividadId INT NOT NULL REFERENCES Actividades(Id) ON DELETE CASCADE,
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    EsPrincipal BIT NOT NULL DEFAULT 0,
    AsignadoPorId INT NULL REFERENCES Usuarios(Id),
    FechaAsignacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (ActividadId, UsuarioId)
);

CREATE TABLE ActividadDependencias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ActividadId INT NOT NULL REFERENCES Actividades(Id),
    ActividadPredecesoraId INT NOT NULL REFERENCES Actividades(Id),
    TipoDependencia NVARCHAR(30) NOT NULL DEFAULT 'FS',
    CONSTRAINT UQ_ActividadDependencia UNIQUE (ActividadId, ActividadPredecesoraId),
    CONSTRAINT CK_NoAutoDependencia CHECK (ActividadId <> ActividadPredecesoraId)
);

CREATE TABLE ActividadChecklists (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ActividadId INT NOT NULL REFERENCES Actividades(Id) ON DELETE CASCADE,
    Titulo NVARCHAR(250) NOT NULL,
    Orden INT NOT NULL DEFAULT 1,
    Completado BIT NOT NULL DEFAULT 0,
    CompletadoPorId INT NULL REFERENCES Usuarios(Id),
    FechaCompletadoUtc DATETIME2 NULL,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ActividadTiempos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ActividadId INT NOT NULL REFERENCES Actividades(Id) ON DELETE CASCADE,
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    MinutosTrabajados INT NOT NULL CHECK (MinutosTrabajados > 0),
    FechaTrabajo DATE NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    FechaRegistroUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ActividadHistorial (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ActividadId INT NOT NULL REFERENCES Actividades(Id) ON DELETE CASCADE,
    UsuarioId INT NULL REFERENCES Usuarios(Id),
    TipoCambio NVARCHAR(80) NOT NULL,
    ValorAnterior NVARCHAR(500) NULL,
    ValorNuevo NVARCHAR(500) NULL,
    Detalle NVARCHAR(1000) NULL,
    FechaCambioUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 5. MESA DE AYUDA, TICKETS Y SLA
CREATE TABLE TicketCategorias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    Activa BIT NOT NULL DEFAULT 1
);

CREATE TABLE TicketTipos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(40) NOT NULL UNIQUE,
    Nombre NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    Activa BIT NOT NULL DEFAULT 1
);

CREATE TABLE CalendariosSla (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(120) NOT NULL,
    ZonaHoraria NVARCHAR(80) NOT NULL DEFAULT 'America/Mexico_City',
    HoraInicioAtencion TIME NOT NULL DEFAULT '08:00:00',
    HoraFinAtencion TIME NOT NULL DEFAULT '18:00:00',
    DiasLaborales NVARCHAR(30) NOT NULL DEFAULT '1,2,3,4,5', -- Lunes a Viernes
    Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE DiasFestivosSla (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CalendarioSlaId INT NOT NULL REFERENCES CalendariosSla(Id) ON DELETE CASCADE,
    Fecha DATE NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    CONSTRAINT UQ_Calendario_Fecha UNIQUE (CalendarioSlaId, Fecha)
);

CREATE TABLE PoliticasSla (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    TicketTipoId INT NULL REFERENCES TicketTipos(Id),
    TicketCategoriaId INT NULL REFERENCES TicketCategorias(Id),
    UnidadId INT NULL REFERENCES Unidades(Id),
    CalendarioSlaId INT NULL REFERENCES CalendariosSla(Id),
    EquipoEscalamientoId INT NULL REFERENCES Equipos(Id),
    TiempoPrimeraRespuestaMinutos INT NOT NULL,
    TiempoResolucionMinutos INT NOT NULL,
    UmbralAlertaPorcentaje INT NOT NULL DEFAULT 80,
    Activa BIT NOT NULL DEFAULT 1
);

CREATE TABLE Tickets (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Folio NVARCHAR(30) NOT NULL UNIQUE,
    Titulo NVARCHAR(250) NOT NULL,
    Descripcion NVARCHAR(MAX) NOT NULL,
    TicketTipoId INT NOT NULL REFERENCES TicketTipos(Id),
    TicketCategoriaId INT NOT NULL REFERENCES TicketCategorias(Id),
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    EstadoTicketId INT NOT NULL REFERENCES EstadosTicket(Id),
    SolicitanteId INT NOT NULL REFERENCES Usuarios(Id),
    ResponsableId INT NULL REFERENCES Usuarios(Id),
    EquipoAsignadoId INT NULL REFERENCES Equipos(Id),
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    PoliticaSlaId INT NULL REFERENCES PoliticasSla(Id),
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaPrimeraRespuestaUtc DATETIME2 NULL,
    FechaResolucionUtc DATETIME2 NULL,
    FechaCierreUtc DATETIME2 NULL,
    FechaLimitePrimeraRespuestaUtc DATETIME2 NULL,
    FechaLimiteResolucionUtc DATETIME2 NULL,
    FechaUltimoInicioPausaUtc DATETIME2 NULL,
    MinutosPausadoSla INT NOT NULL DEFAULT 0,
    EstadoSla NVARCHAR(40) NOT NULL DEFAULT 'EnTiempo', -- EnTiempo, ProximoAVencer, Incumplido, Cumplido, SinPolitica
    Escalado BIT NOT NULL DEFAULT 0,
    FechaModificacionUtc DATETIME2 NULL
);

CREATE TABLE TicketActividades (
    TicketId INT NOT NULL REFERENCES Tickets(Id) ON DELETE CASCADE,
    ActividadId INT NOT NULL REFERENCES Actividades(Id) ON DELETE CASCADE,
    FechaVinculacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PRIMARY KEY (TicketId, ActividadId)
);

CREATE TABLE TicketHistorial (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TicketId INT NOT NULL REFERENCES Tickets(Id) ON DELETE CASCADE,
    UsuarioId INT NULL REFERENCES Usuarios(Id),
    Accion NVARCHAR(80) NOT NULL,
    EstadoAnterior NVARCHAR(80) NULL,
    EstadoNuevo NVARCHAR(80) NULL,
    Detalle NVARCHAR(1000) NULL,
    FechaEventoUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 6. TRANSVERSALES, NOTIFICACIONES Y AUTOMATIZACIONES
CREATE TABLE Comentarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoId INT NULL REFERENCES Proyectos(Id),
    ActividadId INT NULL REFERENCES Actividades(Id),
    TicketId INT NULL REFERENCES Tickets(Id),
    AutorId INT NOT NULL REFERENCES Usuarios(Id),
    Contenido NVARCHAR(MAX) NOT NULL,
    MencionesJson NVARCHAR(1000) NULL,
    EsInterno BIT NOT NULL DEFAULT 0,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Adjuntos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoId INT NULL REFERENCES Proyectos(Id),
    ActividadId INT NULL REFERENCES Actividades(Id),
    TicketId INT NULL REFERENCES Tickets(Id),
    NombreOriginal NVARCHAR(260) NOT NULL,
    NombreAlmacenado NVARCHAR(260) NOT NULL,
    RutaRelativa NVARCHAR(500) NOT NULL,
    ContentType NVARCHAR(120) NOT NULL,
    TamanoBytes BIGINT NOT NULL,
    HashSha256 NVARCHAR(128) NULL,
    EsEvidencia BIT NOT NULL DEFAULT 0,
    SubidoPorId INT NOT NULL REFERENCES Usuarios(Id),
    FechaSubidaUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Notificaciones (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioDestinoId INT NOT NULL REFERENCES Usuarios(Id) ON DELETE CASCADE,
    TipoEvento NVARCHAR(80) NOT NULL,
    Titulo NVARCHAR(200) NOT NULL,
    Mensaje NVARCHAR(1000) NOT NULL,
    UrlDestino NVARCHAR(300) NULL,
    Leida BIT NOT NULL DEFAULT 0,
    FechaLecturaUtc DATETIME2 NULL,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ReglasAutomatizacion (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    EventoDisparador NVARCHAR(100) NOT NULL, -- TicketAsignado, ActividadProximaVencer, SlaIncumplido, ActividadCompletada
    CondicionJson NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    AccionTipo NVARCHAR(100) NOT NULL,       -- NotificarResponsable, EscalarSupervisor, DesbloquearSucesoras
    AccionConfigJson NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    Activa BIT NOT NULL DEFAULT 1,
    TotalEjecuciones INT NOT NULL DEFAULT 0,
    TotalFallos INT NOT NULL DEFAULT 0,
    UltimaEjecucionUtc DATETIME2 NULL,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AuditoriaEventos (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NULL REFERENCES Usuarios(Id),
    NombreUsuario NVARCHAR(100) NULL,
    Modulo NVARCHAR(80) NOT NULL,
    Accion NVARCHAR(80) NOT NULL,
    Entidad NVARCHAR(100) NOT NULL,
    EntidadId NVARCHAR(80) NULL,
    UnidadId INT NULL,
    Resumen NVARCHAR(500) NULL,
    ValoresAnteriores NVARCHAR(MAX) NULL,
    ValoresNuevos NVARCHAR(MAX) NULL,
    IpAddress NVARCHAR(60) NULL,
    FechaEventoUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE RefreshTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id) ON DELETE CASCADE,
    TokenHash NVARCHAR(500) NOT NULL,
    FechaExpiracionUtc DATETIME2 NOT NULL,
    FechaCreacionUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreadoPorIp NVARCHAR(60) NULL,
    FechaRevocacionUtc DATETIME2 NULL,
    ReemplazadoPorTokenHash NVARCHAR(500) NULL,
    RevocadoPorIp NVARCHAR(60) NULL,
    MotivoRevocacion NVARCHAR(200) NULL
);

-- 7. ÍNDICES DE RENDIMIENTO Y CONSULTAS FRECUENTES
CREATE INDEX IX_Usuarios_DepartamentoId ON Usuarios(DepartamentoId);
CREATE INDEX IX_Proyectos_Unidad_Estado ON Proyectos(UnidadId, EstadoProyectoId) INCLUDE (PrioridadId, ResponsableId, PorcentajeAvance);
CREATE INDEX IX_Actividades_Unidad_Estado_Vencimiento ON Actividades(UnidadId, EstadoActividadId, FechaVencimiento) INCLUDE (ProyectoId, PrioridadId);
CREATE INDEX IX_Tickets_Unidad_Estado_Prioridad ON Tickets(UnidadId, EstadoTicketId, PrioridadId) INCLUDE (Folio, SolicitanteId, ResponsableId, EstadoSla);
CREATE INDEX IX_Notificaciones_Usuario_Leida ON Notificaciones(UsuarioDestinoId, Leida, FechaCreacionUtc DESC);
CREATE INDEX IX_AuditoriaEventos_Modulo_Fecha ON AuditoriaEventos(Modulo, FechaEventoUtc DESC);
CREATE INDEX IX_RefreshTokens_TokenHash ON RefreshTokens(TokenHash);
