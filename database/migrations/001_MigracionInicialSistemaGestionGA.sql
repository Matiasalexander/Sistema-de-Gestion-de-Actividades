IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [CalendariosSla] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(max) NOT NULL,
        [ZonaHoraria] nvarchar(max) NOT NULL,
        [HoraInicioAtencion] time NOT NULL,
        [HoraFinAtencion] time NOT NULL,
        [DiasLaborales] nvarchar(max) NOT NULL,
        [Activo] bit NOT NULL,
        CONSTRAINT [PK_CalendariosSla] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [EstadosActividad] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [ColorHex] nvarchar(max) NOT NULL,
        [Orden] int NOT NULL,
        [EsFinal] bit NOT NULL,
        CONSTRAINT [PK_EstadosActividad] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [EstadosProyecto] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [ColorHex] nvarchar(max) NOT NULL,
        [Orden] int NOT NULL,
        [EsFinal] bit NOT NULL,
        CONSTRAINT [PK_EstadosProyecto] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [EstadosTicket] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [ColorHex] nvarchar(max) NOT NULL,
        [Orden] int NOT NULL,
        [PausaSla] bit NOT NULL,
        [EsFinal] bit NOT NULL,
        CONSTRAINT [PK_EstadosTicket] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Permisos] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Modulo] nvarchar(max) NOT NULL,
        [Accion] nvarchar(max) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        CONSTRAINT [PK_Permisos] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Prioridades] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [ColorHex] nvarchar(max) NOT NULL,
        [Nivel] int NOT NULL,
        CONSTRAINT [PK_Prioridades] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ReglasAutomatizacion] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [EventoDisparador] nvarchar(max) NOT NULL,
        [CondicionJson] nvarchar(max) NOT NULL,
        [AccionTipo] nvarchar(max) NOT NULL,
        [AccionConfigJson] nvarchar(max) NOT NULL,
        [Activa] bit NOT NULL,
        [TotalEjecuciones] int NOT NULL,
        [TotalFallos] int NOT NULL,
        [UltimaEjecucionUtc] datetime2 NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ReglasAutomatizacion] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [EsSistema] bit NOT NULL,
        [Activo] bit NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [TicketCategorias] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [Activa] bit NOT NULL,
        CONSTRAINT [PK_TicketCategorias] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [TicketTipos] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [Activa] bit NOT NULL,
        CONSTRAINT [PK_TicketTipos] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Unidades] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [ZonaHoraria] nvarchar(max) NOT NULL,
        [Activa] bit NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [FechaModificacionUtc] datetime2 NULL,
        CONSTRAINT [PK_Unidades] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [DiasFestivosSla] (
        [Id] int NOT NULL IDENTITY,
        [CalendarioSlaId] int NOT NULL,
        [Fecha] date NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_DiasFestivosSla] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_DiasFestivosSla_CalendariosSla_CalendarioSlaId] FOREIGN KEY ([CalendarioSlaId]) REFERENCES [CalendariosSla] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [RolPermisos] (
        [RolId] int NOT NULL,
        [PermisoId] int NOT NULL,
        CONSTRAINT [PK_RolPermisos] PRIMARY KEY ([RolId], [PermisoId]),
        CONSTRAINT [FK_RolPermisos_Permisos_PermisoId] FOREIGN KEY ([PermisoId]) REFERENCES [Permisos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolPermisos_Roles_RolId] FOREIGN KEY ([RolId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Departamentos] (
        [Id] int NOT NULL IDENTITY,
        [UnidadId] int NOT NULL,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [Activa] bit NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Departamentos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Departamentos_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Usuarios] (
        [Id] int NOT NULL IDENTITY,
        [NombreUsuario] nvarchar(450) NOT NULL,
        [Email] nvarchar(450) NOT NULL,
        [NombreCompleto] nvarchar(max) NOT NULL,
        [Cargo] nvarchar(max) NULL,
        [Telefono] nvarchar(max) NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [DepartamentoId] int NULL,
        [AccesoGlobalUnidades] bit NOT NULL,
        [Activo] bit NOT NULL,
        [DebeCambiarPassword] bit NOT NULL,
        [IntentosFallidos] int NOT NULL,
        [BloqueadoHastaUtc] datetime2 NULL,
        [UltimoAccesoUtc] datetime2 NULL,
        [TokenRecuperacionHash] nvarchar(max) NULL,
        [TokenRecuperacionExpiraUtc] datetime2 NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [FechaModificacionUtc] datetime2 NULL,
        CONSTRAINT [PK_Usuarios] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Usuarios_Departamentos_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [Departamentos] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [AuditoriaEventos] (
        [Id] bigint NOT NULL IDENTITY,
        [UsuarioId] int NULL,
        [NombreUsuario] nvarchar(max) NULL,
        [Modulo] nvarchar(max) NOT NULL,
        [Accion] nvarchar(max) NOT NULL,
        [Entidad] nvarchar(max) NOT NULL,
        [EntidadId] nvarchar(max) NULL,
        [UnidadId] int NULL,
        [Resumen] nvarchar(max) NULL,
        [ValoresAnteriores] nvarchar(max) NULL,
        [ValoresNuevos] nvarchar(max) NULL,
        [IpAddress] nvarchar(max) NULL,
        [FechaEventoUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditoriaEventos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditoriaEventos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Equipos] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [UnidadId] int NOT NULL,
        [DepartamentoId] int NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [ColorHex] nvarchar(max) NOT NULL,
        [LiderUsuarioId] int NULL,
        [Activo] bit NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Equipos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Equipos_Departamentos_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [Departamentos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Equipos_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Equipos_Usuarios_LiderUsuarioId] FOREIGN KEY ([LiderUsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [HistorialAccesos] (
        [Id] bigint NOT NULL IDENTITY,
        [UsuarioId] int NULL,
        [IdentificadorIntentado] nvarchar(max) NOT NULL,
        [Exitoso] bit NOT NULL,
        [Motivo] nvarchar(max) NULL,
        [IpAddress] nvarchar(max) NULL,
        [UserAgent] nvarchar(max) NULL,
        [FechaIntentoUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_HistorialAccesos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_HistorialAccesos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Notificaciones] (
        [Id] bigint NOT NULL IDENTITY,
        [UsuarioDestinoId] int NOT NULL,
        [TipoEvento] nvarchar(max) NOT NULL,
        [Titulo] nvarchar(max) NOT NULL,
        [Mensaje] nvarchar(max) NOT NULL,
        [UrlDestino] nvarchar(max) NULL,
        [Leida] bit NOT NULL,
        [FechaLecturaUtc] datetime2 NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notificaciones_Usuarios_UsuarioDestinoId] FOREIGN KEY ([UsuarioDestinoId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [TokenHash] nvarchar(max) NOT NULL,
        [FechaExpiracionUtc] datetime2 NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [CreadoPorIp] nvarchar(max) NULL,
        [FechaRevocacionUtc] datetime2 NULL,
        [ReemplazadoPorTokenHash] nvarchar(max) NULL,
        [RevocadoPorIp] nvarchar(max) NULL,
        [MotivoRevocacion] nvarchar(max) NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [UsuarioRoles] (
        [UsuarioId] int NOT NULL,
        [RolId] int NOT NULL,
        [FechaAsignacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_UsuarioRoles] PRIMARY KEY ([UsuarioId], [RolId]),
        CONSTRAINT [FK_UsuarioRoles_Roles_RolId] FOREIGN KEY ([RolId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UsuarioRoles_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [UsuarioUnidades] (
        [UsuarioId] int NOT NULL,
        [UnidadId] int NOT NULL,
        [EsUnidadPrincipal] bit NOT NULL,
        [FechaAsignacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_UsuarioUnidades] PRIMARY KEY ([UsuarioId], [UnidadId]),
        CONSTRAINT [FK_UsuarioUnidades_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UsuarioUnidades_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [PoliticasSla] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(max) NOT NULL,
        [PrioridadId] int NOT NULL,
        [TicketTipoId] int NULL,
        [TicketCategoriaId] int NULL,
        [UnidadId] int NULL,
        [CalendarioSlaId] int NULL,
        [EquipoEscalamientoId] int NULL,
        [TiempoPrimeraRespuestaMinutos] int NOT NULL,
        [TiempoResolucionMinutos] int NOT NULL,
        [UmbralAlertaPorcentaje] int NOT NULL,
        [Activa] bit NOT NULL,
        CONSTRAINT [PK_PoliticasSla] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PoliticasSla_CalendariosSla_CalendarioSlaId] FOREIGN KEY ([CalendarioSlaId]) REFERENCES [CalendariosSla] ([Id]),
        CONSTRAINT [FK_PoliticasSla_Equipos_EquipoEscalamientoId] FOREIGN KEY ([EquipoEscalamientoId]) REFERENCES [Equipos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_PoliticasSla_Prioridades_PrioridadId] FOREIGN KEY ([PrioridadId]) REFERENCES [Prioridades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PoliticasSla_TicketCategorias_TicketCategoriaId] FOREIGN KEY ([TicketCategoriaId]) REFERENCES [TicketCategorias] ([Id]),
        CONSTRAINT [FK_PoliticasSla_TicketTipos_TicketTipoId] FOREIGN KEY ([TicketTipoId]) REFERENCES [TicketTipos] ([Id]),
        CONSTRAINT [FK_PoliticasSla_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Proyectos] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [UnidadId] int NOT NULL,
        [DepartamentoId] int NULL,
        [EquipoId] int NULL,
        [ResponsableId] int NOT NULL,
        [PrioridadId] int NOT NULL,
        [EstadoProyectoId] int NOT NULL,
        [FechaInicio] date NOT NULL,
        [FechaFinEstimada] date NOT NULL,
        [FechaFinReal] date NULL,
        [PorcentajeAvance] decimal(5,2) NOT NULL,
        [Archivado] bit NOT NULL,
        [CreadoPorId] int NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [FechaModificacionUtc] datetime2 NULL,
        CONSTRAINT [PK_Proyectos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Proyectos_Departamentos_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [Departamentos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Proyectos_Equipos_EquipoId] FOREIGN KEY ([EquipoId]) REFERENCES [Equipos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Proyectos_EstadosProyecto_EstadoProyectoId] FOREIGN KEY ([EstadoProyectoId]) REFERENCES [EstadosProyecto] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Proyectos_Prioridades_PrioridadId] FOREIGN KEY ([PrioridadId]) REFERENCES [Prioridades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Proyectos_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Proyectos_Usuarios_ResponsableId] FOREIGN KEY ([ResponsableId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [UsuarioEquipos] (
        [UsuarioId] int NOT NULL,
        [EquipoId] int NOT NULL,
        [RolEnEquipo] nvarchar(max) NOT NULL,
        [FechaIncorporacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_UsuarioEquipos] PRIMARY KEY ([UsuarioId], [EquipoId]),
        CONSTRAINT [FK_UsuarioEquipos_Equipos_EquipoId] FOREIGN KEY ([EquipoId]) REFERENCES [Equipos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UsuarioEquipos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Tickets] (
        [Id] int NOT NULL IDENTITY,
        [Folio] nvarchar(450) NOT NULL,
        [Titulo] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NOT NULL,
        [TicketTipoId] int NOT NULL,
        [TicketCategoriaId] int NOT NULL,
        [PrioridadId] int NOT NULL,
        [EstadoTicketId] int NOT NULL,
        [SolicitanteId] int NOT NULL,
        [ResponsableId] int NULL,
        [EquipoAsignadoId] int NULL,
        [UnidadId] int NOT NULL,
        [DepartamentoId] int NULL,
        [PoliticaSlaId] int NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [FechaPrimeraRespuestaUtc] datetime2 NULL,
        [FechaResolucionUtc] datetime2 NULL,
        [FechaCierreUtc] datetime2 NULL,
        [FechaLimitePrimeraRespuestaUtc] datetime2 NULL,
        [FechaLimiteResolucionUtc] datetime2 NULL,
        [FechaUltimoInicioPausaUtc] datetime2 NULL,
        [MinutosPausadoSla] int NOT NULL,
        [EstadoSla] nvarchar(max) NOT NULL,
        [Escalado] bit NOT NULL,
        [FechaModificacionUtc] datetime2 NULL,
        CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Tickets_Departamentos_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [Departamentos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_Equipos_EquipoAsignadoId] FOREIGN KEY ([EquipoAsignadoId]) REFERENCES [Equipos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_EstadosTicket_EstadoTicketId] FOREIGN KEY ([EstadoTicketId]) REFERENCES [EstadosTicket] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Tickets_PoliticasSla_PoliticaSlaId] FOREIGN KEY ([PoliticaSlaId]) REFERENCES [PoliticasSla] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_Prioridades_PrioridadId] FOREIGN KEY ([PrioridadId]) REFERENCES [Prioridades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Tickets_TicketCategorias_TicketCategoriaId] FOREIGN KEY ([TicketCategoriaId]) REFERENCES [TicketCategorias] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Tickets_TicketTipos_TicketTipoId] FOREIGN KEY ([TicketTipoId]) REFERENCES [TicketTipos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Tickets_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_Usuarios_ResponsableId] FOREIGN KEY ([ResponsableId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Tickets_Usuarios_SolicitanteId] FOREIGN KEY ([SolicitanteId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ProyectoFases] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [Nombre] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [Orden] int NOT NULL,
        [EsHito] bit NOT NULL,
        [FechaInicio] date NULL,
        [FechaFinEstimada] date NULL,
        [Completada] bit NOT NULL,
        [PorcentajeAvance] decimal(5,2) NOT NULL,
        CONSTRAINT [PK_ProyectoFases] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ProyectoFases_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ProyectoIntegrantes] (
        [ProyectoId] int NOT NULL,
        [UsuarioId] int NOT NULL,
        [RolProyecto] nvarchar(max) NOT NULL,
        [FechaAsignacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ProyectoIntegrantes] PRIMARY KEY ([ProyectoId], [UsuarioId]),
        CONSTRAINT [FK_ProyectoIntegrantes_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProyectoIntegrantes_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [TicketHistorial] (
        [Id] bigint NOT NULL IDENTITY,
        [TicketId] int NOT NULL,
        [UsuarioId] int NULL,
        [Accion] nvarchar(max) NOT NULL,
        [EstadoAnterior] nvarchar(max) NULL,
        [EstadoNuevo] nvarchar(max) NULL,
        [Detalle] nvarchar(max) NULL,
        [FechaEventoUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketHistorial] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TicketHistorial_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TicketHistorial_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Actividades] (
        [Id] int NOT NULL IDENTITY,
        [Codigo] nvarchar(450) NOT NULL,
        [ProyectoId] int NULL,
        [FaseProyectoId] int NULL,
        [ActividadPadreId] int NULL,
        [UnidadId] int NOT NULL,
        [DepartamentoId] int NULL,
        [EquipoId] int NULL,
        [Titulo] nvarchar(max) NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [PrioridadId] int NOT NULL,
        [EstadoActividadId] int NOT NULL,
        [FechaInicio] date NULL,
        [FechaVencimiento] date NULL,
        [FechaFinalizacionRealUtc] datetime2 NULL,
        [TiempoEstimadoMinutos] int NOT NULL,
        [PorcentajeAvance] decimal(5,2) NOT NULL,
        [EsRecurrente] bit NOT NULL,
        [PatronRecurrencia] nvarchar(max) NULL,
        [Archivada] bit NOT NULL,
        [CreadoPorId] int NULL,
        [ModificadoPorId] int NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        [FechaModificacionUtc] datetime2 NULL,
        CONSTRAINT [PK_Actividades] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Actividades_Actividades_ActividadPadreId] FOREIGN KEY ([ActividadPadreId]) REFERENCES [Actividades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Actividades_Departamentos_DepartamentoId] FOREIGN KEY ([DepartamentoId]) REFERENCES [Departamentos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Actividades_Equipos_EquipoId] FOREIGN KEY ([EquipoId]) REFERENCES [Equipos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Actividades_EstadosActividad_EstadoActividadId] FOREIGN KEY ([EstadoActividadId]) REFERENCES [EstadosActividad] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Actividades_Prioridades_PrioridadId] FOREIGN KEY ([PrioridadId]) REFERENCES [Prioridades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Actividades_ProyectoFases_FaseProyectoId] FOREIGN KEY ([FaseProyectoId]) REFERENCES [ProyectoFases] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Actividades_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Actividades_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ActividadAsignados] (
        [ActividadId] int NOT NULL,
        [UsuarioId] int NOT NULL,
        [EsPrincipal] bit NOT NULL,
        [AsignadoPorId] int NULL,
        [FechaAsignacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ActividadAsignados] PRIMARY KEY ([ActividadId], [UsuarioId]),
        CONSTRAINT [FK_ActividadAsignados_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ActividadAsignados_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ActividadChecklists] (
        [Id] int NOT NULL IDENTITY,
        [ActividadId] int NOT NULL,
        [Titulo] nvarchar(max) NOT NULL,
        [Orden] int NOT NULL,
        [Completado] bit NOT NULL,
        [CompletadoPorId] int NULL,
        [FechaCompletadoUtc] datetime2 NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ActividadChecklists] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ActividadChecklists_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ActividadDependencias] (
        [Id] int NOT NULL IDENTITY,
        [ActividadId] int NOT NULL,
        [ActividadPredecesoraId] int NOT NULL,
        [TipoDependencia] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_ActividadDependencias] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ActividadDependencias_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ActividadDependencias_Actividades_ActividadPredecesoraId] FOREIGN KEY ([ActividadPredecesoraId]) REFERENCES [Actividades] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ActividadHistorial] (
        [Id] bigint NOT NULL IDENTITY,
        [ActividadId] int NOT NULL,
        [UsuarioId] int NULL,
        [TipoCambio] nvarchar(max) NOT NULL,
        [ValorAnterior] nvarchar(max) NULL,
        [ValorNuevo] nvarchar(max) NULL,
        [Detalle] nvarchar(max) NULL,
        [FechaCambioUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ActividadHistorial] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ActividadHistorial_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ActividadHistorial_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [ActividadTiempos] (
        [Id] int NOT NULL IDENTITY,
        [ActividadId] int NOT NULL,
        [UsuarioId] int NOT NULL,
        [MinutosTrabajados] int NOT NULL,
        [FechaTrabajo] date NOT NULL,
        [Descripcion] nvarchar(max) NULL,
        [FechaRegistroUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_ActividadTiempos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ActividadTiempos_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ActividadTiempos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Adjuntos] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NULL,
        [ActividadId] int NULL,
        [TicketId] int NULL,
        [NombreOriginal] nvarchar(max) NOT NULL,
        [NombreAlmacenado] nvarchar(max) NOT NULL,
        [RutaRelativa] nvarchar(max) NOT NULL,
        [ContentType] nvarchar(max) NOT NULL,
        [TamanoBytes] bigint NOT NULL,
        [HashSha256] nvarchar(max) NULL,
        [EsEvidencia] bit NOT NULL,
        [SubidoPorId] int NOT NULL,
        [FechaSubidaUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Adjuntos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Adjuntos_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Adjuntos_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Adjuntos_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Adjuntos_Usuarios_SubidoPorId] FOREIGN KEY ([SubidoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [Comentarios] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NULL,
        [ActividadId] int NULL,
        [TicketId] int NULL,
        [AutorId] int NOT NULL,
        [Contenido] nvarchar(max) NOT NULL,
        [MencionesJson] nvarchar(max) NULL,
        [EsInterno] bit NOT NULL,
        [FechaCreacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_Comentarios] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Comentarios_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comentarios_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comentarios_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Comentarios_Usuarios_AutorId] FOREIGN KEY ([AutorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE TABLE [TicketActividades] (
        [TicketId] int NOT NULL,
        [ActividadId] int NOT NULL,
        [FechaVinculacionUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_TicketActividades] PRIMARY KEY ([TicketId], [ActividadId]),
        CONSTRAINT [FK_TicketActividades_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TicketActividades_Tickets_TicketId] FOREIGN KEY ([TicketId]) REFERENCES [Tickets] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadAsignados_UsuarioId] ON [ActividadAsignados] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadChecklists_ActividadId] ON [ActividadChecklists] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadDependencias_ActividadId] ON [ActividadDependencias] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadDependencias_ActividadPredecesoraId] ON [ActividadDependencias] ([ActividadPredecesoraId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_ActividadPadreId] ON [Actividades] ([ActividadPadreId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Actividades_Codigo] ON [Actividades] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_DepartamentoId] ON [Actividades] ([DepartamentoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_EquipoId] ON [Actividades] ([EquipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_EstadoActividadId] ON [Actividades] ([EstadoActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_FaseProyectoId] ON [Actividades] ([FaseProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_PrioridadId] ON [Actividades] ([PrioridadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_ProyectoId] ON [Actividades] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Actividades_UnidadId] ON [Actividades] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadHistorial_ActividadId] ON [ActividadHistorial] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadHistorial_UsuarioId] ON [ActividadHistorial] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadTiempos_ActividadId] ON [ActividadTiempos] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ActividadTiempos_UsuarioId] ON [ActividadTiempos] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Adjuntos_ActividadId] ON [Adjuntos] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Adjuntos_ProyectoId] ON [Adjuntos] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Adjuntos_SubidoPorId] ON [Adjuntos] ([SubidoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Adjuntos_TicketId] ON [Adjuntos] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_AuditoriaEventos_UsuarioId] ON [AuditoriaEventos] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Comentarios_ActividadId] ON [Comentarios] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Comentarios_AutorId] ON [Comentarios] ([AutorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Comentarios_ProyectoId] ON [Comentarios] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Comentarios_TicketId] ON [Comentarios] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Departamentos_UnidadId_Codigo] ON [Departamentos] ([UnidadId], [Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_DiasFestivosSla_CalendarioSlaId] ON [DiasFestivosSla] ([CalendarioSlaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Equipos_Codigo] ON [Equipos] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Equipos_DepartamentoId] ON [Equipos] ([DepartamentoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Equipos_LiderUsuarioId] ON [Equipos] ([LiderUsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Equipos_UnidadId] ON [Equipos] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EstadosActividad_Codigo] ON [EstadosActividad] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EstadosProyecto_Codigo] ON [EstadosProyecto] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EstadosTicket_Codigo] ON [EstadosTicket] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_HistorialAccesos_UsuarioId] ON [HistorialAccesos] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Notificaciones_UsuarioDestinoId] ON [Notificaciones] ([UsuarioDestinoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Permisos_Codigo] ON [Permisos] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_CalendarioSlaId] ON [PoliticasSla] ([CalendarioSlaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_EquipoEscalamientoId] ON [PoliticasSla] ([EquipoEscalamientoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_PrioridadId] ON [PoliticasSla] ([PrioridadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_TicketCategoriaId] ON [PoliticasSla] ([TicketCategoriaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_TicketTipoId] ON [PoliticasSla] ([TicketTipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_PoliticasSla_UnidadId] ON [PoliticasSla] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Prioridades_Codigo] ON [Prioridades] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ProyectoFases_ProyectoId] ON [ProyectoFases] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_ProyectoIntegrantes_UsuarioId] ON [ProyectoIntegrantes] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Proyectos_Codigo] ON [Proyectos] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_DepartamentoId] ON [Proyectos] ([DepartamentoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_EquipoId] ON [Proyectos] ([EquipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_EstadoProyectoId] ON [Proyectos] ([EstadoProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_PrioridadId] ON [Proyectos] ([PrioridadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_ResponsableId] ON [Proyectos] ([ResponsableId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Proyectos_UnidadId] ON [Proyectos] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UsuarioId] ON [RefreshTokens] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Roles_Codigo] ON [Roles] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_RolPermisos_PermisoId] ON [RolPermisos] ([PermisoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_TicketActividades_ActividadId] ON [TicketActividades] ([ActividadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketCategorias_Codigo] ON [TicketCategorias] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_TicketHistorial_TicketId] ON [TicketHistorial] ([TicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_TicketHistorial_UsuarioId] ON [TicketHistorial] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_DepartamentoId] ON [Tickets] ([DepartamentoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_EquipoAsignadoId] ON [Tickets] ([EquipoAsignadoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_EstadoTicketId] ON [Tickets] ([EstadoTicketId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Tickets_Folio] ON [Tickets] ([Folio]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_PoliticaSlaId] ON [Tickets] ([PoliticaSlaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_PrioridadId] ON [Tickets] ([PrioridadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_ResponsableId] ON [Tickets] ([ResponsableId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_SolicitanteId] ON [Tickets] ([SolicitanteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_TicketCategoriaId] ON [Tickets] ([TicketCategoriaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_TicketTipoId] ON [Tickets] ([TicketTipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Tickets_UnidadId] ON [Tickets] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_TicketTipos_Codigo] ON [TicketTipos] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Unidades_Codigo] ON [Unidades] ([Codigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_UsuarioEquipos_EquipoId] ON [UsuarioEquipos] ([EquipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_UsuarioRoles_RolId] ON [UsuarioRoles] ([RolId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_Usuarios_DepartamentoId] ON [Usuarios] ([DepartamentoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuarios_Email] ON [Usuarios] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Usuarios_NombreUsuario] ON [Usuarios] ([NombreUsuario]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    CREATE INDEX [IX_UsuarioUnidades_UnidadId] ON [UsuarioUnidades] ([UnidadId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261109215545_MigracionInicialSistemaGestionGA'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261109215545_MigracionInicialSistemaGestionGA', N'9.0.8');
END;

COMMIT;
GO

