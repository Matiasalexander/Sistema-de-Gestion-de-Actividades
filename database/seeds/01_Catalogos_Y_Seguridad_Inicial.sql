/* =========================================================================
   SISTEMA DE GESTIÓN GA - SEMILLA INICIAL DE CATÁLOGOS Y SEGURIDAD
   Incluye: Prioridades, Estados (Proyectos, Actividades, Tickets),
   Tipos y Categorías de Ticket, Unidades, Departamentos, Roles y Permisos.
   ========================================================================= */

-- 1. Prioridades
INSERT INTO Prioridades (Codigo, Nombre, ColorHex, Nivel) VALUES
('BAJA', 'Baja', '#64748B', 1),
('MEDIA', 'Media', '#2563EB', 2),
('ALTA', 'Alta', '#F59E0B', 3),
('CRITICA', 'Crítica', '#DC2626', 4);

-- 2. Estados de Proyecto
INSERT INTO EstadosProyecto (Codigo, Nombre, ColorHex, Orden, EsFinal) VALUES
('PLANEACION', 'En planeación', '#64748B', 1, 0),
('ACTIVO', 'Activo', '#2563EB', 2, 0),
('EN_RIESGO', 'En riesgo', '#F59E0B', 3, 0),
('PAUSADO', 'En pausa', '#8B5CF6', 4, 0),
('COMPLETADO', 'Completado', '#10B981', 5, 1),
('CANCELADO', 'Cancelado', '#EF4444', 6, 1);

-- 3. Estados de Actividad (Monday.com experience)
INSERT INTO EstadosActividad (Codigo, Nombre, ColorHex, Orden, EsFinal) VALUES
('PENDIENTE', 'Pendiente', '#94A3B8', 1, 0),
('POR_INICIAR', 'Por iniciar', '#64748B', 2, 0),
('EN_PROGRESO', 'En progreso', '#FDAB3D', 3, 0),
('EN_ESPERA', 'En espera', '#A25DDC', 4, 0),
('BLOQUEADA', 'Bloqueada', '#E2445C', 5, 0),
('EN_REVISION', 'En revisión', '#0086C0', 6, 0),
('COMPLETADA', 'Completada', '#00C875', 7, 1),
('CANCELADA', 'Cancelada', '#333333', 8, 1);

-- 4. Estados de Ticket (Jira Service Management experience)
INSERT INTO EstadosTicket (Codigo, Nombre, ColorHex, Orden, PausaSla, EsFinal) VALUES
('NUEVO', 'Nuevo', '#64748B', 1, 0, 0),
('ABIERTO', 'Abierto', '#3B82F6', 2, 0, 0),
('ASIGNADO', 'Asignado', '#0284C7', 3, 0, 0),
('EN_ATENCION', 'En atención', '#F59E0B', 4, 0, 0),
('EN_ESPERA', 'En espera', '#8B5CF6', 5, 1, 0),
('RESUELTO', 'Resuelto', '#10B981', 6, 1, 0),
('CERRADO', 'Cerrado', '#059669', 7, 1, 1),
('CANCELADO', 'Cancelado', '#EF4444', 8, 1, 1),
('REABIERTO', 'Reabierto', '#EC4899', 9, 0, 0);

-- 5. Tipos de Ticket
INSERT INTO TicketTipos (Codigo, Nombre, Descripcion, Activa) VALUES
('INCIDENTE', 'Incidente', 'Interrupción no planificada o reducción en la calidad de un servicio', 1),
('SOLICITUD', 'Solicitud de servicio', 'Petición formal de un usuario para provisión de accesos o recursos', 1),
('REQUERIMIENTO', 'Requerimiento', 'Solicitud funcional o evolutiva sobre sistemas o procesos', 1),
('PROBLEMA', 'Problema', 'Causa raíz de uno o más incidentes recurrentes', 1),
('CAMBIO', 'Cambio', 'Adición, modificación o eliminación controlada en infraestructura o sistemas', 1),
('CONSULTA', 'Consulta', 'Solicitud de información u orientación operativa', 1);

-- 6. Categorías de Ticket
INSERT INTO TicketCategorias (Codigo, Nombre, Descripcion, Activa) VALUES
('INFRAESTRUCTURA', 'Infraestructura y Redes', 'Servidores, conectividad, VPN, telefonía y equipos', 1),
('SISTEMAS_GA', 'Sistemas Corporativos GA', 'ERP, Caja GA, Inventario GA y portales internos', 1),
('ACCESOS_SEG', 'Accesos y Seguridad', 'Cuentas, permisos, contraseñas y certificados', 1),
('SOPORTE_CAMPO', 'Soporte Técnico Operativo', 'Estaciones de trabajo, impresoras y periféricos', 1),
('OPERACIONES', 'Operaciones y Logística', 'Procesos operativos de unidades de negocio', 1),
('ADMINISTRATIVO', 'Gestión Administrativa', 'Trámites y servicios corporativos generales', 1);

-- 7. Unidades de Negocio Iniciales
INSERT INTO Unidades (Codigo, Nombre, Descripcion, ZonaHoraria, Activa) VALUES
('CORP-GA', 'Corporativo Central GA', 'Dirección general, TI corporativo, finanzas y administración central', 'America/Mexico_City', 1),
('UNI-NORTE', 'Unidad Operativa Norte', 'Operaciones comerciales, almacén y soporte regional Norte', 'America/Monterrey', 1),
('UNI-SUR', 'Unidad Operativa Sur', 'Operaciones logísticas y atención regional Sur', 'America/Mexico_City', 1),
('UNI-BAJIO', 'Unidad Industrial Bajío', 'Planta operativa, calidad y mantenimiento industrial Bajío', 'America/Mexico_City', 1);
