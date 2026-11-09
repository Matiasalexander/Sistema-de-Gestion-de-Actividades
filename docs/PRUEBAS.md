# Estrategia y Resultados de Pruebas

## 1. Pruebas Unitarias de Dominio (`tests/SistemaGestionGA.UnitTests`)
Archivo: `ReglasNegocioTests.cs`
- `TieneDependenciaCircular_DetectaCicloDirectoEIndirecto`: Valida detección de ciclos `1 -> 3 -> 2 -> 1` y aceptación de grafos acíclicos.
- `ValidarTransicionActividad_ImpideCerrarConPredecesorasOSubtareasAbiertas`: Verifica que intentar pasar a `COMPLETADA` falle con `ACTIVIDAD_PREDECESORA_INCOMPLETA` o `SUBTAREAS_INCOMPLETAS` cuando corresponda.
- `CalcularAvanceActividadYProyecto_CalculaPonderacionConsistente`: Verifica cálculo automático desde ítems de checklist y ponderación por nivel de prioridad en proyectos.
- `ValidarTransicionTicket_RechazaTransicionInvalida`: Verifica bloqueo de transiciones no permitidas (ej. `NUEVO -> CERRADO`).
- `CalcularSYEvaluarSla_RespetaPausasYUmbrales`: Verifica evaluación de `EnTiempo`, `ProximoAVencer`, `Cumplido` y desplazamiento por minutos en pausa.

**Resultado:** 5/5 pruebas superadas (0 errores).

## 2. Pruebas de Integración y Seguridad (`tests/SistemaGestionGA.IntegrationTests`)
Archivo: `SeguridadYOperacionesIntegrationTests.cs`
- `Login_Refresh_Y_AislamientoPorUnidad_FuncionanCorrectamente`:
  1. Autentica con `POST /api/auth/login` y verifica emisión de JWT y Refresh Token.
  2. Rota el Refresh Token en `POST /api/auth/refresh` y comprueba que reutilizar el token anterior devuelva `401 Unauthorized`.
  3. Inicia sesión con un usuario restringido a `UNI-SUR` (`sofia.torres`) y comprueba que solo reciba registros de su unidad.
  4. Intenta manipular parámetros (`GET /api/proyectos?unidadId=1`) e IDs (`GET /api/proyectos/1`) pertenecientes a otra unidad, verificando que la API responda `403 Forbidden`.
  5. Intenta acceder a `/api/usuarios` sin permiso `usuarios.ver`, verificando `403 Forbidden`.
- `FlujoCompleto_Ticket_SLA_Y_VinculacionActividad_FuncionaCorrectamente`:
  1. Levanta un ticket en `UNI-NORTE` y verifica la asignación automática de política SLA.
  2. Genera y vincula una actividad técnica desde el ticket (`POST /api/tickets/{id}/vincular-actividad`).
  3. Ejecuta el flujo `atender` -> `resolver` y verifica el cálculo de `EstadoSla = Cumplido`.

**Resultado:** 2/2 pruebas de integración superadas (0 errores).

## 3. Pruebas Automatizadas Frontend (`frontend/src/app/App.test.tsx`)
Ejecutadas con **Vitest + React Testing Library**:
- Renderizado de pantalla de autenticación corporativa cuando no existe sesión.
- Selección y autocompletado de perfiles de prueba.
- Renderizado accesible de `StatusBadge`.

**Resultado:** 3/3 pruebas superadas (0 errores).
