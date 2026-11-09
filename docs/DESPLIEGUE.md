# Guía de Despliegue y Configuración

## 1. Requisitos del Servidor
- **Motor de Base de Datos**: Microsoft SQL Server 2019 o superior (validado en SQL Server 2022 Developer Edition).
- **Runtime Backend**: ASP.NET Core Runtime 9.0+ (o 10.0 LTS al actualizar el SDK del servidor).
- **Servidor Web / Reverse Proxy**: IIS, Nginx o contenedor Docker.

## 2. Variables de Entorno y Secretos Productivos
Nunca almacenar secretos productivos en el repositorio. En producción, inyectar mediante variables de entorno o Azure Key Vault / Secret Manager:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=sql-prod.corporativoga.mx;Database=SistemaGestionGA;User Id=sga_app;Password=<SECRETO>;Encrypt=True;"
$env:Jwt__Secret = "<CLAVE_CRIPTOGRAFICA_MINIMO_64_CARACTERES>"
$env:Cors__AllowedOrigins__0 = "https://gestion.corporativoga.mx"
```

## 3. Aplicación de Migraciones en Base de Datos
Se puede aplicar la migración mediante CLI o ejecutando el script idempotente versionado:
```powershell
# Opción A: CLI EF Core
dotnet ef database update --project backend/SistemaGestionGA.Infrastructure --startup-project backend/SistemaGestionGA.API

# Opción B: Script SQL Idempotente para DBA
sqlcmd -S localhost -d SistemaGestionGA -E -i database/migrations/001_MigracionInicialSistemaGestionGA.sql
```

## 4. Compilación para Producción
```powershell
# Publicación Backend
dotnet publish backend/SistemaGestionGA.API/SistemaGestionGA.API.csproj -c Release -o ./publish/api

# Compilación Frontend SPA
cd frontend
npm run build
```
