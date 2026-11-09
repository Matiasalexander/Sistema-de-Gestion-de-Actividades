/* =========================================================================
   SISTEMA DE GESTIÓN GA - MODELO BASE DE REFERENCIA (v0.1)
   Propuesta inicial de tablas base según especificación arquitectónica.
   Nota: Este archivo representa el modelo inicial de referencia sobre el
   cual se diseñó el esquema normalizado y extendido v1.0.
   ========================================================================= */

-- 1. Organización y Seguridad Base
CREATE TABLE Unidades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(20) NOT NULL UNIQUE,
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Departamentos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    Codigo NVARCHAR(20) NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Activa BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NombreUsuario NVARCHAR(80) NOT NULL UNIQUE,
    Email NVARCHAR(180) NOT NULL UNIQUE,
    NombreCompleto NVARCHAR(200) NOT NULL,
    PasswordHash NVARCHAR(500) NOT NULL,
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    AccesoGlobalUnidades BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(60) NOT NULL UNIQUE,
    Nombre NVARCHAR(120) NOT NULL,
    Descripcion NVARCHAR(400) NULL,
    EsSistema BIT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1
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
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    RolId INT NOT NULL REFERENCES Roles(Id),
    PRIMARY KEY (UsuarioId, RolId)
);

CREATE TABLE RolPermisos (
    RolId INT NOT NULL REFERENCES Roles(Id),
    PermisoId INT NOT NULL REFERENCES Permisos(Id),
    PRIMARY KEY (RolId, PermisoId)
);

CREATE TABLE UsuarioUnidades (
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    PRIMARY KEY (UsuarioId, UnidadId)
);

CREATE TABLE Equipos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    Nombre NVARCHAR(150) NOT NULL,
    Descripcion NVARCHAR(500) NULL,
    LiderUsuarioId INT NULL REFERENCES Usuarios(Id),
    Activo BIT NOT NULL DEFAULT 1
);

CREATE TABLE UsuarioEquipos (
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    EquipoId INT NOT NULL REFERENCES Equipos(Id),
    RolEnEquipo NVARCHAR(80) NULL,
    PRIMARY KEY (UsuarioId, EquipoId)
);

-- 2. Catálogos de Estados y Prioridades
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

-- 3. Proyectos y Actividades
CREATE TABLE Proyectos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Codigo NVARCHAR(30) NOT NULL UNIQUE,
    Nombre NVARCHAR(200) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    ResponsableId INT NOT NULL REFERENCES Usuarios(Id),
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    EstadoProyectoId INT NOT NULL REFERENCES EstadosProyecto(Id),
    FechaInicio DATE NOT NULL,
    FechaFinEstimada DATE NOT NULL,
    PorcentajeAvance DECIMAL(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE Actividades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoId INT NULL REFERENCES Proyectos(Id),
    ActividadPadreId INT NULL REFERENCES Actividades(Id),
    UnidadId INT NOT NULL REFERENCES Unidades(Id),
    DepartamentoId INT NULL REFERENCES Departamentos(Id),
    Titulo NVARCHAR(250) NOT NULL,
    Descripcion NVARCHAR(MAX) NULL,
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    EstadoActividadId INT NOT NULL REFERENCES EstadosActividad(Id),
    FechaInicio DATE NULL,
    FechaVencimiento DATE NULL,
    FechaFinalizacionReal DATETIME2 NULL,
    PorcentajeAvance DECIMAL(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE ActividadAsignados (
    ActividadId INT NOT NULL REFERENCES Actividades(Id),
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    EsPrincipal BIT NOT NULL DEFAULT 0,
    PRIMARY KEY (ActividadId, UsuarioId)
);

CREATE TABLE ActividadDependencias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ActividadId INT NOT NULL REFERENCES Actividades(Id),
    ActividadPredecesoraId INT NOT NULL REFERENCES Actividades(Id),
    TipoDependencia NVARCHAR(30) NOT NULL DEFAULT 'FS'
);

-- 4. Mesa de Ayuda / Tickets y SLA
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
    Activa BIT NOT NULL DEFAULT 1
);

CREATE TABLE PoliticasSla (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    PrioridadId INT NOT NULL REFERENCES Prioridades(Id),
    TicketTipoId INT NULL REFERENCES TicketTipos(Id),
    TicketCategoriaId INT NULL REFERENCES TicketCategorias(Id),
    UnidadId INT NULL REFERENCES Unidades(Id),
    TiempoPrimeraRespuestaMinutos INT NOT NULL,
    TiempoResolucionMinutos INT NOT NULL,
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
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaPrimeraRespuesta DATETIME2 NULL,
    FechaResolucion DATETIME2 NULL,
    FechaCierre DATETIME2 NULL
);

CREATE TABLE TicketActividades (
    TicketId INT NOT NULL REFERENCES Tickets(Id),
    ActividadId INT NOT NULL REFERENCES Actividades(Id),
    PRIMARY KEY (TicketId, ActividadId)
);

-- 5. Transversales y Seguridad
CREATE TABLE Comentarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProyectoId INT NULL REFERENCES Proyectos(Id),
    ActividadId INT NULL REFERENCES Actividades(Id),
    TicketId INT NULL REFERENCES Tickets(Id),
    AutorId INT NOT NULL REFERENCES Usuarios(Id),
    Contenido NVARCHAR(MAX) NOT NULL,
    EsInterno BIT NOT NULL DEFAULT 0,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
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
    SubidoPorId INT NOT NULL REFERENCES Usuarios(Id),
    FechaSubida DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE AuditoriaEventos (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NULL REFERENCES Usuarios(Id),
    Modulo NVARCHAR(80) NOT NULL,
    Accion NVARCHAR(80) NOT NULL,
    Entidad NVARCHAR(100) NOT NULL,
    EntidadId NVARCHAR(80) NULL,
    ValoresAnteriores NVARCHAR(MAX) NULL,
    ValoresNuevos NVARCHAR(MAX) NULL,
    IpAddress NVARCHAR(60) NULL,
    FechaEvento DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE RefreshTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL REFERENCES Usuarios(Id),
    TokenHash NVARCHAR(500) NOT NULL,
    FechaExpiracion DATETIME2 NOT NULL,
    FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    FechaRevocacion DATETIME2 NULL,
    ReemplazadoPorTokenHash NVARCHAR(500) NULL,
    RevocadoPorIp NVARCHAR(60) NULL
);
