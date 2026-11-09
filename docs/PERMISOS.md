# Modelo de Permisos, Roles y Alcance por Unidad

## 1. Catálogo de Permisos en Base de Datos (`Permisos`)

Todos los permisos se almacenan en la tabla `Permisos` y se asocian dinámicamente mediante `RolPermisos`.

| Código | Módulo | Acción | Descripción |
| :--- | :--- | :--- | :--- |
| `proyectos.ver` | Proyectos | Ver | Consultar proyectos dentro de las unidades autorizadas |
| `proyectos.crear` | Proyectos | Crear | Dar de alta nuevos proyectos corporativos o tecnológicos |
| `proyectos.editar` | Proyectos | Editar | Modificar fechas, fases, responsables y estados de proyectos |
| `proyectos.eliminar` | Proyectos | Eliminar | Archivar proyectos dentro del alcance autorizado |
| `actividades.ver` | Actividades | Ver | Visualizar actividades, Kanban, calendario, Gantt y carga |
| `actividades.crear` | Actividades | Crear | Registrar actividades, subtareas, checklists y duplicados |
| `actividades.editar` | Actividades | Editar | Actualizar fechas, prioridades, dependencias y tiempos |
| `actividades.asignar` | Actividades | Asignar | Asignar o reasignar responsables |
| `actividades.cerrar` | Actividades | Cerrar | Completar o cancelar actividades validando reglas de negocio |
| `tickets.ver` | Tickets | Ver | Consultar tickets en el alcance de unidad |
| `tickets.crear` | Tickets | Crear | Levantar incidentes, solicitudes, requerimientos o consultas |
| `tickets.asignar` | Tickets | Asignar | Asignar tickets a especialistas o equipos |
| `tickets.atender` | Tickets | Atender | Tomar en atención, pausar por espera y registrar notas internas |
| `tickets.resolver` | Tickets | Resolver | Documentar solución técnica y pasar a estado Resuelto |
| `tickets.cerrar` | Tickets | Cerrar | Confirmar cierre definitivo del ticket |
| `tickets.reabrir` | Tickets | Reabrir | Reabrir un ticket resuelto o cerrado |
| `usuarios.ver` | Usuarios | Ver | Consultar directorio de usuarios, roles, unidades y accesos |
| `usuarios.crear` | Usuarios | Crear | Alta de usuarios y asignación inicial de alcance |
| `usuarios.editar` | Usuarios | Editar | Modificar perfil, roles, unidades y restablecer contraseñas |
| `usuarios.desactivar` | Usuarios | Desactivar | Activar o suspender cuentas y revocar sesiones |
| `roles.gestionar` | Seguridad | Gestionar Roles | Crear y editar roles y su matriz de permisos en SQL Server |
| `unidades.gestionar` | Organización | Gestionar Unidades | Administrar unidades de negocio y departamentos |
| `equipos.gestionar` | Organización | Gestionar Equipos | Configurar equipos multidisciplinarios e integrantes |
| `reportes.ver` | Reportes | Ver | Consultar indicadores ejecutivos y reportes operativos |
| `reportes.exportar` | Reportes | Exportar | Descargar reportes en formato CSV/Excel |
| `auditoria.ver` | Seguridad | Auditoría | Inspeccionar bitácora de auditoría de modificaciones |
| `configuracion.gestionar`| Configuración | Gestionar | Administrar políticas SLA y reglas de automatización |

## 2. Alcance por Unidad (`UsuarioUnidades` y `AccesoGlobalUnidades`)
- Cada usuario posee una colección explícita de unidades autorizadas en `UsuarioUnidades`.
- Los administradores globales poseen `AccesoGlobalUnidades = true`, controlado exclusivamente desde el backend.
- En cada petición HTTP, `ICurrentUserService.ExigirAlcanceUnidad(unidadId)` verifica que la unidad del registro solicitado pertenezca al alcance del usuario autenticado; de lo contrario, el endpoint devuelve `403 Forbidden` (`ALCANCE_NO_AUTORIZADO`).
