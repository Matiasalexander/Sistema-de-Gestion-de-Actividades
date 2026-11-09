# Reglas de Negocio Implementadas

## 1. Proyectos y Cálculo Automático de Avance
- El porcentaje de avance de un proyecto (`PorcentajeAvance`) no depende exclusivamente de captura manual; se recalcula automáticamente mediante `ReglasNegocioService.CalcularAvanceProyecto`, ponderando el avance de cada actividad raíz activa por el nivel de su prioridad (`Baja=1`, `Media=2`, `Alta=3`, `Crítica=4`) y excluyendo actividades canceladas.

## 2. Actividades, Subtareas, Checklists y Dependencias
- **Prevención de Dependencias Circulares**: Antes de persistir una relación en `ActividadDependencias`, `ReglasNegocioService.TieneDependenciaCircular` ejecuta una búsqueda en anchura (BFS) sobre el grafo de dependencias para impedir ciclos directos (`A -> A`) o indirectos (`A -> B -> C -> A`).
- **Restricciones de Cierre**: Una actividad no puede pasar a estado `COMPLETADA` si:
  1. El usuario carece del permiso `actividades.cerrar`.
  2. Existen actividades predecesoras pendientes de completar (`ACTIVIDAD_PREDECESORA_INCOMPLETA`).
  3. Existen subtareas hijas abiertas (`SUBTAREAS_INCOMPLETAS`).
- **Avance de Actividad**: Se calcula automáticamente combinando el cumplimiento de sus ítems de checklist (`ActividadChecklists`) y el avance de sus subtareas.

## 3. Tickets, Vinculación con Actividades y Notas Internas
- **Folio Único**: Generado secuencialmente con formato `TKT-YYYY-NNNN`.
- **Ciclo de Vida Independiente**: Un ticket puede generar o vincularse con una o varias actividades técnicas (`TicketActividades`), pero el cierre del ticket y el cierre de las actividades técnicas se rigen por sus propias reglas y permisos.
- **Visibilidad de Comentarios**: Los comentarios marcados con `EsInterno = true` solo son devueltos por la API a usuarios que cuentan con el permiso `tickets.atender`.

## 4. Motor SLA y Escalamiento
- Al crear un ticket, el sistema selecciona automáticamente la `PoliticaSla` activa más específica (evaluando coincidencia por `UnidadId`, `TicketTipoId`, `TicketCategoriaId` y `PrioridadId`).
- Las fechas límite de primera respuesta y resolución se calculan mediante `ReglasNegocioService.CalcularFechaLimiteSla`, respetando el horario de atención (`HoraInicioAtencion` a `HoraFinAtencion`), los días laborales (`DiasLaborales`) y los días inhábiles (`DiasFestivosSla`) del `CalendarioSla`.
- Cuando un ticket entra en un estado con `PausaSla = true` (como `En espera`), se registra `FechaUltimoInicioPausaUtc`; al reanudarse la atención, los minutos en espera se acumulan en `MinutosPausadoSla` y desplazan proporcionalmente la ventana límite de resolución.
