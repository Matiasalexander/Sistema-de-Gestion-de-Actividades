# Sistema de Gestión GA (v1.0)
## Plataforma Corporativa de Gestión de Proyectos, Actividades, Tableros y Mesa de Ayuda (Tickets + SLA)

**Sistema de Gestión GA** es una plataforma web corporativa integral que unifica la experiencia de gestión de trabajo estilo *Monday.com* (proyectos, fases, actividades, subtareas, checklists, dependencias, Kanban, Gantt, calendario y carga de trabajo) con una mesa de ayuda corporativa estilo *Jira Service Management* (tickets con folio único, flujos de estado, políticas SLA con calendario laboral, pausas controladas, notas internas y vinculación de actividades técnicas).

---

## 1. Estructura de la Solución

```text
Sistema de Gestion de Actividades/
├── SistemaGestionGA.sln
├── backend/
│   ├── SistemaGestionGA.API/             # Controladores REST, Auth JWT, SignalR Hub, Hangfire, Middleware
│   ├── SistemaGestionGA.Application/     # DTOs, Contratos de Servicios e Interfaces
│   ├── SistemaGestionGA.Domain/          # Entidades Relacionales y Reglas Puras de Negocio
│   ├── SistemaGestionGA.Infrastructure/  # EF Core DbContext, Migraciones SQL Server, Semilla y Seguridad JWT
│   └── SistemaGestionGA.Shared/          # Catálogo de Permisos, Modelos Paginados y Excepciones de Dominio
├── frontend/
│   └── src/
│       ├── app/                          # Enrutador protegido por permisos y configuración React Query
│       ├── auth/                         # Contexto de sesión, rotación JWT y Login corporativo
│       ├── components/                   # Componentes visuales reutilizables (StatusBadge, etc.)
│       ├── layouts/                      # Layout principal con selector de Unidad, Tema y SignalR
│       ├── modules/
│       │   ├── dashboard/                # Dashboard Ejecutivo con KPIs y gráficas reales
│       │   ├── proyectos/                # CRUD de Proyectos, Fases, Hitos, Evidencias y Comentarios
│       │   ├── actividades/              # Tabla editable Work OS, Checklists, Dependencias y Tiempos
│       │   ├── tableros/                 # Vistas Kanban (Drag & Drop), Gantt, Calendario, Mis Actividades y Carga
│       │   ├── tickets/                  # Mesa de Ayuda, Folios, Flujo de Estados, SLA y Actividades Técnicas
│       │   ├── equipos/                  # Equipos multidisciplinarios e integrantes
│       │   ├── usuarios/                 # Administración de Usuarios, Matriz de Roles/Permisos, Unidades y Auditoría
│       │   ├── reportes/                 # Exportación real CSV/Excel e impresión PDF
│       │   └── configuracion/            # Políticas SLA y Reglas de Automatización (CUANDO -> SI -> ENTONCES)
│       └── services/                     # Cliente HTTP tipado con rotación automática de Refresh Token
├── database/
│   ├── migrations/                       # Script SQL idempotente generado desde EF Core Migrations
│   ├── scripts/                          # Modelo SQL v0.1 (referencia) y Modelo SQL v1.0 Definitivo (38 tablas)
│   └── seeds/                            # Semilla inicial de catálogos, unidades, roles y permisos
├── tests/
│   ├── SistemaGestionGA.UnitTests/       # Pruebas unitarias de reglas de negocio (ciclos, SLA, avances, estados)
│   └── SistemaGestionGA.IntegrationTests/# Pruebas de integración API (Auth, rotación Refresh Token, aislamiento por unidad)
└── docs/                                 # Documentación técnica, funcional y estado del proyecto
```

---

## 2. Credenciales Preconfiguradas de Desarrollo

La semilla inicial crea automáticamente cuatro perfiles con distintos niveles de permisos y alcance de unidades (contraseña para todos: `AdminGA2026!`):

| Usuario | Correo | Rol | Alcance de Unidades |
| :--- | :--- | :--- | :--- |
| `admin` | `admin@corporativoga.mx` | Administrador Corporativo GA | **Global** (Todas las unidades) |
| `elena.vargas` | `elena.vargas@corporativoga.mx` | Gerente de Proyectos y Operaciones | `CORP-GA`, `UNI-NORTE` |
| `carlos.mendez` | `carlos.mendez@corporativoga.mx` | Especialista Mesa de Ayuda / Soporte | `UNI-NORTE`, `CORP-GA` |
| `sofia.torres` | `sofia.torres@corporativoga.mx` | Colaborador / Solicitante | Exclusivo `UNI-SUR` |

---

## 3. Ejecución Rápida en Entorno Local

### Backend (ASP.NET Core + SQL Server)
```powershell
dotnet run --project backend/SistemaGestionGA.API --urls "http://localhost:5180"
```
- **Swagger / OpenAPI:** `http://localhost:5180/swagger`
- **Base de datos SQL Server:** `Server=localhost;Database=SistemaGestionGA` (se migra y puebla automáticamente al iniciar).

### Frontend (React + TypeScript + Vite + Tailwind CSS)
```powershell
cd frontend
npm run dev
```
- **Aplicación Web:** `http://localhost:5173`

### Ejecución de Pruebas Automatizadas
```powershell
# Pruebas Unitarias y de Integración Backend
dotnet test SistemaGestionGA.sln

# Pruebas de Componentes y Seguridad UI Frontend
cd frontend
npm test
```
