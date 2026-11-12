BEGIN TRANSACTION;
ALTER TABLE [Actividades] ADD [ChatGrupoId] int NULL;

CREATE TABLE [ChatGrupos] (
    [Id] int NOT NULL IDENTITY,
    [Nombre] nvarchar(max) NOT NULL,
    [Descripcion] nvarchar(max) NULL,
    [UnidadId] int NOT NULL,
    [ActividadActivaId] int NULL,
    [CreadoPorId] int NOT NULL,
    [Activo] bit NOT NULL,
    [FechaCreacionUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatGrupos] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ChatGrupos_Actividades_ActividadActivaId] FOREIGN KEY ([ActividadActivaId]) REFERENCES [Actividades] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_ChatGrupos_Unidades_UnidadId] FOREIGN KEY ([UnidadId]) REFERENCES [Unidades] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ChatGrupos_Usuarios_CreadoPorId] FOREIGN KEY ([CreadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ChatGrupoMiembros] (
    [ChatGrupoId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [EsAdmin] bit NOT NULL,
    [FechaUnionUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatGrupoMiembros] PRIMARY KEY ([ChatGrupoId], [UsuarioId]),
    CONSTRAINT [FK_ChatGrupoMiembros_ChatGrupos_ChatGrupoId] FOREIGN KEY ([ChatGrupoId]) REFERENCES [ChatGrupos] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ChatGrupoMiembros_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ChatMensajes] (
    [Id] bigint NOT NULL IDENTITY,
    [ChatGrupoId] int NOT NULL,
    [UsuarioId] int NOT NULL,
    [ActividadId] int NULL,
    [Texto] nvarchar(max) NOT NULL,
    [TipoMensaje] nvarchar(max) NOT NULL,
    [OpcionesInteractivasJson] nvarchar(max) NULL,
    [OpcionSeleccionada] nvarchar(max) NULL,
    [RespondidoPorUsuarioId] int NULL,
    [FechaRespuestaUtc] datetime2 NULL,
    [FechaCreacionUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_ChatMensajes] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ChatMensajes_Actividades_ActividadId] FOREIGN KEY ([ActividadId]) REFERENCES [Actividades] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_ChatMensajes_ChatGrupos_ChatGrupoId] FOREIGN KEY ([ChatGrupoId]) REFERENCES [ChatGrupos] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ChatMensajes_Usuarios_RespondidoPorUsuarioId] FOREIGN KEY ([RespondidoPorUsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_ChatMensajes_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_Actividades_ChatGrupoId] ON [Actividades] ([ChatGrupoId]);

CREATE INDEX [IX_ChatGrupoMiembros_UsuarioId] ON [ChatGrupoMiembros] ([UsuarioId]);

CREATE INDEX [IX_ChatGrupos_ActividadActivaId] ON [ChatGrupos] ([ActividadActivaId]);

CREATE INDEX [IX_ChatGrupos_CreadoPorId] ON [ChatGrupos] ([CreadoPorId]);

CREATE INDEX [IX_ChatGrupos_UnidadId] ON [ChatGrupos] ([UnidadId]);

CREATE INDEX [IX_ChatMensajes_ActividadId] ON [ChatMensajes] ([ActividadId]);

CREATE INDEX [IX_ChatMensajes_ChatGrupoId] ON [ChatMensajes] ([ChatGrupoId]);

CREATE INDEX [IX_ChatMensajes_RespondidoPorUsuarioId] ON [ChatMensajes] ([RespondidoPorUsuarioId]);

CREATE INDEX [IX_ChatMensajes_UsuarioId] ON [ChatMensajes] ([UsuarioId]);

ALTER TABLE [Actividades] ADD CONSTRAINT [FK_Actividades_ChatGrupos_ChatGrupoId] FOREIGN KEY ([ChatGrupoId]) REFERENCES [ChatGrupos] ([Id]) ON DELETE SET NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20261111160014_AgregarModuloChatTipoWhatsApp', N'9.0.8');

COMMIT;
GO

