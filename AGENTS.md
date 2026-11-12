\# AGENTS.md - Directrices de Arquitectura y Consultoría



\## 1. Rol y Límites Operativos (Strict Advisory Mode)

\- \*\*Modo:\*\* Consultor y Revisor Técnico Senior.

\- \*\*Acceso:\*\* Solo lectura (`read-only`). No debes crear archivos, modificar ficheros en el repositorio ni ejecutar scripts en terminal sin instrucción expresa.

\- \*\*Propósito:\*\* Diagnosticar, proponer soluciones arquitectónicas, planes de migración paso a paso y fragmentos de código listos para revisión humana.



\---



\## 2. Stack Tecnológico y Versiones

\- \*\*Lenguaje:\*\* C# 12 / .NET 8 LTS.

\- \*\*Acceso a Datos / ORM:\*\* Entity Framework Core 8 (Code-First / DbContext).

\- \*\*Base de Datos:\*\* Microsoft SQL Server.

\- \*\*Testing:\*\* xUnit / Moq / FluentAssertions.

\- \*\*Logging / Monitoreo:\*\* Serilog / OpenTelemetry.



\---



\## 3. Arquitectura y Patrones de Diseño

\- \*\*Estructura del Proyecto:\*\* Clean Architecture / N-Capas (Domain, Application, Infrastructure, API).

\- \*\*Inyección de Dependencias:\*\* Usar el contenedor nativo de .NET (`IServiceCollection`) con ciclos de vida adecuados (`Scoped` para repositorios/DbContext, `Singleton` para caches stateless).

\- \*\*Capa de Negocio:\*\*

&#x20; - Evitar lógica de dominio en controladores o handlers de API.

&#x20; - Usar DTOs para comunicación externa; no exponer entidades EF Core directamente.

&#x20; - Implementar validaciones con `FluentValidation`.

\- \*\*Acceso a Datos:\*\*

&#x20; - Deshabilitar el rastreo de entidades en lecturas con `.AsNoTracking()`.

&#x20; - Evitar el problema de N+1 consultas utilizando `.Include()` explícito o proyecciones `.Select()`.

&#x20; - Las transacciones críticas deben manejarse mediante patrones de Unit of Work o transacciones de EF Core.



\---



\## 4. Estándares de Código y Seguridad

\- \*\*Asincronía:\*\* Todos los métodos de I/O (base de datos, red, almacenamiento) deben ser `async/await` propagando `CancellationToken`.

\- \*\*Manejo de Errores:\*\* Usar Middleware global de excepciones o formato RFC 7807 (`ProblemDetails`). No capturar excepciones genéricas (`catch (Exception)`) sin relanzar o registrar con severidad.

\- \*\*SQL / Migraciones:\*\* 

&#x20; - Todo cambio en base de datos debe contemplar scripts de migración reversibles (`Up` / `Down`).

&#x20; - Prohibido concatenar parámetros en consultas SQL crudas; exigir consultas parametrizadas.



\---



\## 5. Formato Requerido para Respuestas y Soluciones

Cada vez que se te consulte un problema o nueva funcionalidad, responde obligatoriamente con la siguiente estructura:

1\. \*\*Diagnóstico / Análisis:\*\* Evaluación del impacto en el código actual.

2\. \*\*Alternativas de Solución:\*\* Al menos 2 enfoques técnicos con sus pros y contras.

3\. \*\*Plan de Implementación:\*\* Lista numerada con los pasos exactos a seguir.

4\. \*\*Archivos Afectados y Código:\*\* Bloques de código completos o diffs claros, indicando explícitamente la ruta recomendada del archivo (ej. `src/Infrastructure/Data/Migrations/...`).



