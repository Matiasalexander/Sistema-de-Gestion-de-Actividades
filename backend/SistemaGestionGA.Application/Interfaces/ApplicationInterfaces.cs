namespace SistemaGestionGA.Application.Interfaces;

public interface ICurrentUserService
{
    int? UsuarioId { get; }
    string? NombreUsuario { get; }
    bool Autenticado { get; }
    bool AccesoGlobalUnidades { get; }
    IReadOnlySet<int> UnidadesAutorizadas { get; }
    IReadOnlySet<string> Permisos { get; }
    string? IpAddress { get; }
    string? UserAgent { get; }

    bool TienePermiso(string permiso);
    bool TieneAlcanceUnidad(int unidadId);
    void ExigirAlcanceUnidad(int unidadId);
}

public interface IRealtimeNotificationService
{
    Task EnviarNotificacionAsync(
        int usuarioDestinoId,
        string tipoEvento,
        string titulo,
        string mensaje,
        string? urlDestino = null,
        CancellationToken ct = default);

    Task EvaluarAutomatizacionesAsync(
        string eventoDisparador,
        string resumenEntidad,
        int? usuarioDestinoId,
        string? urlDestino = null,
        CancellationToken ct = default);
}
