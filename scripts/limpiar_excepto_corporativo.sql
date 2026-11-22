-- =========================================================================================
-- Script SQL: Purga de Datos Operativos, Departamentos y Unidades
-- Conserva únicamente:
--   1. Todos los Usuarios (reasignados a 'Corporativo GA', sin departamento asignado)
--   2. Roles, Permisos y Seguridad
--   3. Catálogos del sistema (Prioridades, Estados, Tipos, Categorías)
--   4. Unidad de Negocio: 'Corporativo GA' (CORP-GA)
-- =========================================================================================

USE [SistemaGestionGA];
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    PRINT 'Iniciando limpieza de datos operativos y organizacionales...';

    -- 1. Desvincular referencias circulares y foráneas
    PRINT 'Desvinculando referencias foráneas en SLAs, Grupos y Actividades...';
    UPDATE PoliticasSla SET EquipoEscalamientoId = NULL;
    UPDATE ChatGrupos SET ActividadActivaId = NULL;
    UPDATE Actividades SET ChatGrupoId = NULL, ActividadPadreId = NULL;

    -- 2. Eliminar chats WhatsApp y miembros
    PRINT 'Eliminando chats y mensajes...';
    DELETE FROM ChatMensajes;
    DELETE FROM ChatGrupoMiembros;
    DELETE FROM ChatGrupos;

    -- 3. Eliminar tickets y trazabilidad
    PRINT 'Eliminando tickets, historial y comentarios...';
    DELETE FROM TicketActividades;
    DELETE FROM TicketHistorial;
    DELETE FROM Comentarios;
    DELETE FROM Adjuntos;
    DELETE FROM Tickets;

    -- 4. Eliminar actividades
    PRINT 'Eliminando actividades, asignados y checklists...';
    DELETE FROM ActividadChecklists;
    DELETE FROM ActividadDependencias;
    DELETE FROM ActividadAsignados;
    DELETE FROM ActividadTiempos;
    DELETE FROM ActividadHistorial;
    DELETE FROM Actividades;

    -- 5. Eliminar proyectos y fases
    PRINT 'Eliminando proyectos y fases...';
    DELETE FROM ProyectoFases;
    DELETE FROM ProyectoIntegrantes;
    DELETE FROM Proyectos;

    -- 6. Eliminar equipos de trabajo
    PRINT 'Eliminando equipos y miembros...';
    DELETE FROM UsuarioEquipos;
    DELETE FROM Equipos;

    -- 7. Desvincular departamentos de todos los usuarios
    PRINT 'Desvinculando departamentos de usuarios...';
    UPDATE Usuarios SET DepartamentoId = NULL;

    -- 8. Eliminar todos los departamentos
    PRINT 'Eliminando todos los departamentos...';
    DELETE FROM Departamentos;

    -- 9. Identificar o asegurar la unidad 'Corporativo GA'
    PRINT 'Configurando unidad Corporativo GA...';
    DECLARE @CorpId INT;
    SELECT TOP 1 @CorpId = Id FROM Unidades WHERE Codigo = 'CORP-GA' OR Nombre LIKE '%Corporativo%';

    IF @CorpId IS NULL
    BEGIN
        SELECT TOP 1 @CorpId = Id FROM Unidades;
        IF @CorpId IS NOT NULL
        BEGIN
            UPDATE Unidades 
            SET Codigo = 'CORP-GA', Nombre = 'Corporativo GA', Descripcion = 'Sede corporativa central', Activa = 1 
            WHERE Id = @CorpId;
        END
        ELSE
        BEGIN
            INSERT INTO Unidades (Codigo, Nombre, Descripcion, ZonaHoraria, Activa)
            VALUES ('CORP-GA', 'Corporativo GA', 'Sede corporativa central', 'America/Mexico_City', 1);
            SET @CorpId = SCOPE_IDENTITY();
        END
    END
    ELSE
    BEGIN
        UPDATE Unidades 
        SET Codigo = 'CORP-GA', Nombre = 'Corporativo GA', Activa = 1 
        WHERE Id = @CorpId;
    END

    -- 10. Actualizar PoliticasSla para que apunten a Corporativo GA
    UPDATE PoliticasSla SET UnidadId = @CorpId;

    -- 11. Eliminar membresías de usuarios en otras unidades
    DELETE FROM UsuarioUnidades WHERE UnidadId != @CorpId;

    -- 12. Asegurar que todos los usuarios tengan asignado Corporativo GA como unidad principal
    INSERT INTO UsuarioUnidades (UsuarioId, UnidadId, EsUnidadPrincipal)
    SELECT u.Id, @CorpId, 1
    FROM Usuarios u
    WHERE NOT EXISTS (
        SELECT 1 FROM UsuarioUnidades uu WHERE uu.UsuarioId = u.Id AND uu.UnidadId = @CorpId
    );

    UPDATE UsuarioUnidades SET EsUnidadPrincipal = 1 WHERE UnidadId = @CorpId;

    -- 13. Eliminar todas las demás unidades
    PRINT 'Eliminando el resto de las unidades de negocio...';
    DELETE FROM Unidades WHERE Id != @CorpId;

    -- 14. Registrar auditoría del proceso
    INSERT INTO AuditoriaEventos (Modulo, Accion, Entidad, EntidadId, UnidadId, Resumen, FechaEventoUtc)
    VALUES ('Mantenimiento', 'PURGA_TOTAL_EXCEPTO_CORPORATIVO', 'Unidad', CAST(@CorpId AS NVARCHAR(50)), @CorpId, 'Limpieza general de datos operativos, eliminación de departamentos y unidades secundarias. Se conservaron todos los usuarios asignados a Corporativo GA.', GETUTCDATE());

    COMMIT TRANSACTION;
    PRINT '=========================================================================================';
    PRINT '¡ÉXITO! Base de datos limpia: solo permanece la unidad Corporativo GA y todos los usuarios.';
    PRINT '=========================================================================================';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    PRINT 'ERROR: Ocurrió un fallo durante la ejecución. Transacción revertida.';
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
