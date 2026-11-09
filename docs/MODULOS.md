# Catálogo de Módulos del Sistema

## 1. Módulo de Administración de Usuarios y Seguridad (`/usuarios`)
- Alta, edición y activación/desactivación de cuentas de usuario.
- Restablecimiento administrativo de contraseñas con revocación inmediata de Refresh Tokens activos.
- Asignación múltiple de roles, unidades de negocio (con unidad principal y bandera de acceso global), departamentos y equipos.
- Editor visual de la **Matriz de Roles y Permisos** agrupada por módulo y acción.
- Consulta en vivo del **Historial de Accesos** y de la **Bitácora de Auditoría (`AuditoriaEventos`)**.

## 2. Módulo de Proyectos (`/proyectos`)
- Gestión del portafolio de proyectos corporativos y tecnológicos por unidad.
- Definición de fases e hitos (`EsHito`), fechas compromiso, prioridades y responsables.
- Cálculo automático y ponderado del porcentaje de avance en función de sus actividades activas.
- Gestión de comentarios, carga/descarga segura de evidencias y archivado controlado.

## 3. Módulo de Gestión de Actividades (`/actividades`)
- Experiencia tipo *Work OS (Monday.com)* con tabla editable en línea.
- Actividades asociadas a proyecto o independientes, subtareas, checklists interactivos y registro de tiempos trabajados (`ActividadTiempos`).
- Dependencias entre actividades con bloqueo automático de ciclos (`TieneDependenciaCircular`).
- Duplicación de actividades con preservación de estructura de checklist.

## 4. Módulo de Tableros y Vistas de Trabajo (`/tableros`)
- **Kanban**: Tarjetas por estado con *Drag & Drop* persistente en SQL Server y validación de reglas de transición.
- **Gantt**: Cronograma visual de duración, avance y dependencias predecesoras.
- **Calendario**:Agenda ordenada de vencimientos y entregables.
- **Mis Actividades**: Bandeja personal clasificada en urgentes/vencidas, en ejecución y completadas.
- **Carga de Trabajo**: Comparativa de capacidad horaria y asignación por colaborador.

## 5. Módulo de Tickets / Mesa de Ayuda y SLA (`/tickets`)
- Registro de Incidentes, Solicitudes de Servicio, Requerimientos, Problemas, Cambios y Consultas con **Folio Único (`TKT-YYYY-NNNN`)**.
- Asignación automática de **Política SLA** según prioridad, unidad, tipo y categoría.
- Flujo controlado de estados (`Nuevo`, `Abierto`, `Asignado`, `En atención`, `En espera`, `Resuelto`, `Cerrado`, `Cancelado`, `Reabierto`).
- Pausa automática del reloj SLA en estado `En espera`.
- Distinción estricta entre **Comentarios Públicos** (visibles al solicitante) y **Notas Técnicas Internas** (exclusivas para soporte).
- Generación y vinculación de **Actividades Técnicas** derivadas de un ticket con ciclo de cierre independiente.

## 6. Dashboard Ejecutivo, Reportes y Automatizaciones (`/`, `/reportes`, `/configuracion`)
- Indicadores y gráficos en tiempo real filtrables por unidad y proyecto.
- Exportación real a **CSV / Excel** (con BOM UTF-8 para compatibilidad directa con Microsoft Excel) e impresión PDF.
- Configuración de políticas SLA y reglas de automatización (`CUANDO -> SI -> ENTONCES`).
