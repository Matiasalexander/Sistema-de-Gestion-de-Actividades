# Registro de Decisiones Técnicas (ADR)

## ADR-001: Target Framework .NET 9.0 Compatible con .NET 10 LTS
- **Contexto**: La especificación solicita C# / ASP.NET Core y EF Core modernos. Al inspeccionar el entorno de desarrollo (`dotnet --list-sdks`), se verificó que el SDK instalado en el servidor local es `.NET SDK 9.0.304` (y no existe SDK 10.0 instalado en la máquina).
- **Decisión**: Configurar los archivos `.csproj` en `net9.0` utilizando C# 13, EF Core 9.0.8 y ASP.NET Core 9.0.8 para garantizar compilación nativa, ejecución real, generación de migraciones y ejecución de pruebas en el entorno autorizado sin bloqueos de toolchain, manteniendo código 100% compatible con actualización directa de `<TargetFramework>net10.0</TargetFramework>`.

## ADR-002: Prevención de Rutas de Cascada Múltiples en SQL Server
- **Contexto**: SQL Server rechaza claves foráneas con `ON DELETE CASCADE` cuando existen múltiples rutas desde `Unidades` o `Usuarios` hacia tablas puente como `TicketActividades` o `Comentarios`.
- **Decisión**: Configurar explícitamente `DeleteBehavior.Restrict` en `ApplicationDbContext` para las relaciones transversales, garantizando que `dotnet ef database update` cree el esquema completo en SQL Server 2022 sin errores de integridad.

## ADR-003: Almacenamiento Seguro de Archivos Fuera de Rutas Públicas
- **Contexto**: Los adjuntos y evidencias no deben exponerse mediante URLs estáticas públicas sin control de autorización.
- **Decisión**: Almacenar los archivos físicamente en `App_Data/Uploads/{yyyyMM}/{Guid}.{ext}` validando extensión, límite de 15 MB, cálculo de huella `SHA-256` y prevención de *Path Traversal*, sirviendo las descargas exclusivamente a través del endpoint autenticado `GET /api/adjuntos/{id}/descargar` tras validar el alcance por unidad del registro padre.

## ADR-004: Autorización Dinámica con `IAuthorizationPolicyProvider`
- **Contexto**: Los permisos deben residir en base de datos y validarse en cada endpoint sin hardcodear roles fijos.
- **Decisión**: Implementar `PermisoPolicyProvider` y el atributo `[RequierePermiso("codigo.permiso")]`, evaluando los claims `permiso` emitidos desde la matriz `RolPermisos` de SQL Server.
