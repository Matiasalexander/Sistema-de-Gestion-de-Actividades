# Estado del Proyecto por Módulo (`ESTADO_PROYECTO.md`)

Última actualización: **2026-11-09**

## 1. Matriz de Estado por Módulo

| Módulo / Componente | Estado | Conectado a API Real | Persistencia SQL Server | Pruebas Automatizadas | Observaciones |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **1. Arquitectura y Base de Datos (38 tablas)** | **Validado** | Sí | Sí (`SistemaGestionGA`) | Sí | Migración inicial aplicada en SQL Server 2022 y script idempotente generado. |
| **2. Autenticación JWT + Refresh Tokens** | **Validado** | Sí (`/api/auth/*`) | Sí (`RefreshTokens`, `HistorialAccesos`) | Sí (Integración) | Incluye rotación de tokens, revocación y bloqueo por intentos fallidos. |
| **3. Administración de Usuarios, Roles y Alcance** | **Validado** | Sí (`/api/usuarios`, `/api/roles`) | Sí (`Usuarios`, `Roles`, `Permisos`, `UsuarioUnidades`) | Sí (Integración) | Matriz visual de permisos en BD y aislamiento anti-IDOR por unidad. |
| **4. Unidades, Departamentos y Equipos** | **Validado** | Sí (`/api/unidades`, `/api/equipos`) | Sí (`Unidades`, `Departamentos`, `Equipos`) | Sí | Alcance multi-unidad y selector global en barra superior. |
| **5. Módulo de Proyectos, Fases e Hitos** | **Validado** | Sí (`/api/proyectos/*`) | Sí (`Proyectos`, `ProyectoFases`) | Sí (Unitarias + Int.) | Avance ponderado automático, fases/hitos, comentarios y adjuntos. |
| **6. Módulo de Actividades, Checklists y Tiempos** | **Validado** | Sí (`/api/actividades/*`) | Sí (`Actividades`, `ActividadChecklists`, `ActividadTiempos`) | Sí (Unitarias) | Validación anticiclos en dependencias, tiempos trabajados y duplicación. |
| **7. Tableros (Tabla, Kanban, Gantt, Calendario, Carga)**| **Validado** | Sí (`/api/actividades`, `/api/dashboard`) | Sí | Sí | Kanban con Drag & Drop persistente y validación de transiciones. |
| **8. Mesa de Ayuda / Tickets y Vinculación** | **Validado** | Sí (`/api/tickets/*`) | Sí (`Tickets`, `TicketActividades`, `TicketHistorial`) | Sí (Integración) | Folios únicos, flujo de estados, notas internas vs públicas y actividades derivadas. |
| **9. Motor SLA, Calendarios y Escalamiento** | **Validado** | Sí (`/api/slas`) | Sí (`PoliticasSla`, `CalendariosSla`) | Sí (Unitarias + Int.) | Cálculo con calendario laboral, pausas en espera y monitoreo Hangfire. |
| **10. Notificaciones SignalR y Automatizaciones** | **Validado** | Sí (`/hubs/notificaciones`, `/api/automatizaciones`) | Sí (`Notificaciones`, `ReglasAutomatizacion`) | Sí | Reglas `CUANDO -> SI -> ENTONCES` y alertas en tiempo real. |
| **11. Adjuntos y Evidencias Seguras** | **Validado** | Sí (`/api/{entidad}/{id}/adjuntos`) | Sí (`Adjuntos`) | Sí | Validación de extensión/tamaño, hash SHA-256 y descarga autorizada. |
| **12. Dashboard Ejecutivo y Reportes CSV/Excel** | **Validado** | Sí (`/api/dashboard`, `/api/reportes/exportar`) | Sí | Sí | KPIs reales, gráficas por unidad/estado/SLA y exportación CSV UTF-8 BOM. |

## 2. Dependencias y Decisiones Pendientes
- **Ningún módulo utiliza datos simulados (mocks) en el frontend**: Todas las pantallas consultan y persisten en la base de datos SQL Server `SistemaGestionGA` a través de la API REST.
- **Actualización opcional a .NET 10 SDK**: Cuando se instale el SDK de .NET 10 en el equipo anfitrión, basta cambiar `<TargetFramework>net9.0</TargetFramework>` a `net10.0` en los proyectos.
