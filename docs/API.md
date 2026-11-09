# Especificación de Contratos API REST

La documentación interactiva OpenAPI se encuentra expuesta en `/swagger` (`http://localhost:5180/swagger`).

## 1. Autenticación (`/api/auth`)
- `POST /api/auth/login`: Valida credenciales con BCrypt, aplica bloqueo temporal tras 5 intentos fallidos, registra en `HistorialAccesos` y emite `AccessToken` + `RefreshToken`.
- `POST /api/auth/refresh`: Rota el Refresh Token (revoca el token anterior y emite un nuevo par).
- `POST /api/auth/logout`: Revoca el Refresh Token activo.
- `GET /api/auth/me`: Devuelve el perfil autenticado con sus unidades, roles y permisos vigentes.
- `POST /api/auth/cambiar-password`: Actualiza la contraseña del usuario autenticado y registra auditoría.

## 2. Usuarios, Roles, Unidades y Equipos
- `GET /api/usuarios`, `GET /api/usuarios/{id}`, `POST /api/usuarios`, `PUT /api/usuarios/{id}`
- `PATCH /api/usuarios/{id}/estado?activo={bool}`
- `POST /api/usuarios/{id}/reset-password`
- `GET /api/usuarios/accesos`
- `GET /api/roles`, `POST /api/roles`, `PUT /api/roles/{id}`
- `GET /api/permisos`
- `GET /api/unidades`, `POST /api/unidades`
- `GET /api/departamentos`, `POST /api/departamentos`
- `GET /api/equipos`, `POST /api/equipos`
- `GET /api/catalogos`

## 3. Proyectos y Actividades
- `GET /api/proyectos`, `GET /api/proyectos/{id}`, `POST /api/proyectos`, `PUT /api/proyectos/{id}`
- `POST /api/proyectos/{id}/fases`
- `PATCH /api/proyectos/{id}/archivar`
- `GET /api/actividades`, `GET /api/actividades/{id}`, `POST /api/actividades`, `PUT /api/actividades/{id}`
- `PATCH /api/actividades/{id}/estado`
- `POST /api/actividades/{id}/checklists`, `PATCH /api/actividades/{id}/checklists/{itemId}/toggle`
- `POST /api/actividades/{id}/dependencias`
- `POST /api/actividades/{id}/tiempos`
- `POST /api/actividades/{id}/duplicar`

## 4. Tickets, SLA, Transversales y Reportes
- `GET /api/tickets`, `GET /api/tickets/{id}`, `POST /api/tickets`
- `POST /api/tickets/{id}/asignar`
- `POST /api/tickets/{id}/atender`, `POST /api/tickets/{id}/espera`, `POST /api/tickets/{id}/resolver`, `POST /api/tickets/{id}/cerrar`, `POST /api/tickets/{id}/reabrir`
- `POST /api/tickets/{id}/vincular-actividad`
- `GET /api/{entidad}/{id}/comentarios`, `POST /api/{entidad}/{id}/comentarios`
- `GET /api/{entidad}/{id}/adjuntos`, `POST /api/{entidad}/{id}/adjuntos`, `GET /api/adjuntos/{id}/descargar`
- `GET /api/slas`, `POST /api/slas`
- `GET /api/automatizaciones`, `POST /api/automatizaciones`, `PATCH /api/automatizaciones/{id}/toggle`
- `GET /api/notificaciones`, `PATCH /api/notificaciones/{id}/leer`, `POST /api/notificaciones/leer-todas`
- `GET /api/dashboard`
- `GET /api/reportes/exportar?tipo={actividades|tickets|productividad}`
- `GET /api/auditoria`
