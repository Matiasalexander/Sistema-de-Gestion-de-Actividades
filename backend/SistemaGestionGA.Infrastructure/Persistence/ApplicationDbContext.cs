using Microsoft.EntityFrameworkCore;
using SistemaGestionGA.Domain.Entities;

namespace SistemaGestionGA.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Unidad> Unidades => Set<Unidad>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Permiso> Permisos => Set<Permiso>();
    public DbSet<UsuarioRol> UsuarioRoles => Set<UsuarioRol>();
    public DbSet<RolPermiso> RolPermisos => Set<RolPermiso>();
    public DbSet<UsuarioUnidad> UsuarioUnidades => Set<UsuarioUnidad>();
    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<UsuarioEquipo> UsuarioEquipos => Set<UsuarioEquipo>();
    public DbSet<HistorialAcceso> HistorialAccesos => Set<HistorialAcceso>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<AuditoriaEvento> AuditoriaEventos => Set<AuditoriaEvento>();

    public DbSet<EstadoProyecto> EstadosProyecto => Set<EstadoProyecto>();
    public DbSet<EstadoActividad> EstadosActividad => Set<EstadoActividad>();
    public DbSet<EstadoTicket> EstadosTicket => Set<EstadoTicket>();
    public DbSet<Prioridad> Prioridades => Set<Prioridad>();

    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<ProyectoFase> ProyectoFases => Set<ProyectoFase>();
    public DbSet<ProyectoIntegrante> ProyectoIntegrantes => Set<ProyectoIntegrante>();
    //DbSet actividades
    public DbSet<Actividad> Actividades => Set<Actividad>();
    public DbSet<ActividadAsignado> ActividadAsignados => Set<ActividadAsignado>();
    public DbSet<ActividadDependencia> ActividadDependencias => Set<ActividadDependencia>();
    public DbSet<ActividadChecklist> ActividadChecklists => Set<ActividadChecklist>();
    public DbSet<ActividadTiempo> ActividadTiempos => Set<ActividadTiempo>();
    public DbSet<ActividadHistorial> ActividadHistorial => Set<ActividadHistorial>();
    //DbSetActividadesGuardias
    public DbSet<ActividadGuardia> ActividadesGuardia => Set<ActividadGuardia>();

    public DbSet<TicketCategoria> TicketCategorias => Set<TicketCategoria>();
    public DbSet<TicketTipo> TicketTipos => Set<TicketTipo>();
    public DbSet<CalendarioSla> CalendariosSla => Set<CalendarioSla>();
    public DbSet<DiaFestivoSla> DiasFestivosSla => Set<DiaFestivoSla>();
    public DbSet<PoliticaSla> PoliticasSla => Set<PoliticaSla>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketActividad> TicketActividades => Set<TicketActividad>();
    public DbSet<TicketHistorial> TicketHistorial => Set<TicketHistorial>();

    public DbSet<Comentario> Comentarios => Set<Comentario>();
    public DbSet<Adjunto> Adjuntos => Set<Adjunto>();
    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();
    public DbSet<ReglaAutomatizacion> ReglasAutomatizacion => Set<ReglaAutomatizacion>();

    public DbSet<ChatGrupo> ChatGrupos => Set<ChatGrupo>();
    public DbSet<ChatGrupoMiembro> ChatGrupoMiembros => Set<ChatGrupoMiembro>();
    public DbSet<ChatMensaje> ChatMensajes => Set<ChatMensaje>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w =>
            w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Claves compuestas
        modelBuilder.Entity<UsuarioRol>().HasKey(x => new { x.UsuarioId, x.RolId });
        modelBuilder.Entity<RolPermiso>().HasKey(x => new { x.RolId, x.PermisoId });
        modelBuilder.Entity<UsuarioUnidad>().HasKey(x => new { x.UsuarioId, x.UnidadId });
        modelBuilder.Entity<UsuarioEquipo>().HasKey(x => new { x.UsuarioId, x.EquipoId });
        modelBuilder.Entity<ProyectoIntegrante>().HasKey(x => new { x.ProyectoId, x.UsuarioId });
        modelBuilder.Entity<ActividadAsignado>().HasKey(x => new { x.ActividadId, x.UsuarioId });
        modelBuilder.Entity<TicketActividad>().HasKey(x => new { x.TicketId, x.ActividadId });
        modelBuilder.Entity<ChatGrupoMiembro>().HasKey(x => new { x.ChatGrupoId, x.UsuarioId });

        // Índices únicos
        modelBuilder.Entity<Unidad>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Departamento>().HasIndex(x => new { x.UnidadId, x.Codigo }).IsUnique();
        modelBuilder.Entity<Usuario>().HasIndex(x => x.NombreUsuario).IsUnique();
        modelBuilder.Entity<Usuario>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Usuario>()
            .HasIndex(x => x.Telefono)
            .IsUnique()
            .HasFilter("[Telefono] IS NOT NULL AND [Telefono] <> ''");
        modelBuilder.Entity<Rol>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Permiso>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Equipo>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<EstadoProyecto>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<EstadoActividad>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<EstadoTicket>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Prioridad>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Proyecto>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Actividad>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<Ticket>().HasIndex(x => x.Folio).IsUnique();
        modelBuilder.Entity<TicketTipo>().HasIndex(x => x.Codigo).IsUnique();
        modelBuilder.Entity<TicketCategoria>().HasIndex(x => x.Codigo).IsUnique();

        // Precisiones decimales
        modelBuilder.Entity<Proyecto>().Property(x => x.PorcentajeAvance).HasPrecision(5, 2);
        modelBuilder.Entity<ProyectoFase>().Property(x => x.PorcentajeAvance).HasPrecision(5, 2);
        modelBuilder.Entity<Actividad>().Property(x => x.PorcentajeAvance).HasPrecision(5, 2);

        // Relaciones sin cascadas múltiples para SQL Server
        modelBuilder.Entity<Departamento>()
            .HasOne(x => x.Unidad)
            .WithMany(u => u.Departamentos)
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Usuario>()
            .HasOne(x => x.Departamento)
            .WithMany(d => d.Usuarios)
            .HasForeignKey(x => x.DepartamentoId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Equipo>()
            .HasOne(x => x.Unidad)
            .WithMany(u => u.Equipos)
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Equipo>()
            .HasOne(x => x.Departamento)
            .WithMany()
            .HasForeignKey(x => x.DepartamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Equipo>()
            .HasOne(x => x.LiderUsuario)
            .WithMany()
            .HasForeignKey(x => x.LiderUsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UsuarioEquipo>()
            .HasOne(x => x.Usuario)
            .WithMany(u => u.UsuarioEquipos)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UsuarioEquipo>()
            .HasOne(x => x.Equipo)
            .WithMany(e => e.Integrantes)
            .HasForeignKey(x => x.EquipoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Proyecto>()
            .HasOne(x => x.Unidad)
            .WithMany()
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Proyecto>()
            .HasOne(x => x.Departamento)
            .WithMany()
            .HasForeignKey(x => x.DepartamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Proyecto>()
            .HasOne(x => x.Equipo)
            .WithMany()
            .HasForeignKey(x => x.EquipoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Proyecto>()
            .HasOne(x => x.Responsable)
            .WithMany()
            .HasForeignKey(x => x.ResponsableId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ProyectoIntegrante>()
            .HasOne(x => x.Proyecto)
            .WithMany(p => p.Integrantes)
            .HasForeignKey(x => x.ProyectoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ProyectoIntegrante>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.Proyecto)
            .WithMany(p => p.Actividades)
            .HasForeignKey(x => x.ProyectoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.FaseProyecto)
            .WithMany()
            .HasForeignKey(x => x.FaseProyectoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.ActividadPadre)
            .WithMany(a => a.Subtareas)
            .HasForeignKey(x => x.ActividadPadreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.Unidad)
            .WithMany()
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.Departamento)
            .WithMany()
            .HasForeignKey(x => x.DepartamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.Equipo)
            .WithMany()
            .HasForeignKey(x => x.EquipoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActividadAsignado>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Asignados)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActividadAsignado>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActividadDependencia>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Dependencias)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActividadDependencia>()
            .HasOne(x => x.ActividadPredecesora)
            .WithMany()
            .HasForeignKey(x => x.ActividadPredecesoraId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActividadTiempo>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Tiempos)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActividadTiempo>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ActividadHistorial>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Historial)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ActividadHistorial>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<ActividadGuardia>(entity =>
        {
            entity.ToTable("ActividadesGuardia");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Folio).IsUnique();
            entity.HasIndex(e => e.Fecha);
            entity.HasIndex(e => e.UsuarioId);
            entity.HasIndex(e => e.UnidadId);
            entity.HasIndex(e => e.DepartamentoId);
            entity.HasOne(e => e.Usuario)
                .WithMany()
                .HasForeignKey(e => e.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Unidad)
                .WithMany()
                .HasForeignKey(e => e.UnidadId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Departamento)
                .WithMany()
                .HasForeignKey(e => e.DepartamentoId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.TicketRelacionado)
                .WithMany()
                .HasForeignKey(e => e.TicketRelacionadoId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PoliticaSla>()
            .HasOne(x => x.Unidad)
            .WithMany()
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PoliticaSla>()
            .HasOne(x => x.EquipoEscalamiento)
            .WithMany()
            .HasForeignKey(x => x.EquipoEscalamientoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.Solicitante)
            .WithMany()
            .HasForeignKey(x => x.SolicitanteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.Responsable)
            .WithMany()
            .HasForeignKey(x => x.ResponsableId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.EquipoAsignado)
            .WithMany()
            .HasForeignKey(x => x.EquipoAsignadoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.Unidad)
            .WithMany()
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.Departamento)
            .WithMany()
            .HasForeignKey(x => x.DepartamentoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(x => x.PoliticaSla)
            .WithMany()
            .HasForeignKey(x => x.PoliticaSlaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketActividad>()
            .HasOne(x => x.Ticket)
            .WithMany(t => t.TicketActividades)
            .HasForeignKey(x => x.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketActividad>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.TicketActividades)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketHistorial>()
            .HasOne(x => x.Ticket)
            .WithMany(t => t.Historial)
            .HasForeignKey(x => x.TicketId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketHistorial>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comentario>()
            .HasOne(x => x.Proyecto)
            .WithMany(p => p.Comentarios)
            .HasForeignKey(x => x.ProyectoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comentario>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Comentarios)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comentario>()
            .HasOne(x => x.Ticket)
            .WithMany(t => t.Comentarios)
            .HasForeignKey(x => x.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Comentario>()
            .HasOne(x => x.Autor)
            .WithMany()
            .HasForeignKey(x => x.AutorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Adjunto>()
            .HasOne(x => x.Proyecto)
            .WithMany(p => p.Adjuntos)
            .HasForeignKey(x => x.ProyectoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Adjunto>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.Adjuntos)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Adjunto>()
            .HasOne(x => x.Ticket)
            .WithMany(t => t.Adjuntos)
            .HasForeignKey(x => x.TicketId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Adjunto>()
            .HasOne(x => x.SubidoPor)
            .WithMany()
            .HasForeignKey(x => x.SubidoPorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Módulo de Chat estilo WhatsApp
        modelBuilder.Entity<ChatGrupo>()
            .HasOne(x => x.Unidad)
            .WithMany()
            .HasForeignKey(x => x.UnidadId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatGrupo>()
            .HasOne(x => x.CreadoPor)
            .WithMany()
            .HasForeignKey(x => x.CreadoPorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatGrupo>()
            .HasOne(x => x.ActividadActiva)
            .WithMany()
            .HasForeignKey(x => x.ActividadActivaId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ChatGrupoMiembro>()
            .HasOne(x => x.ChatGrupo)
            .WithMany(g => g.Miembros)
            .HasForeignKey(x => x.ChatGrupoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatGrupoMiembro>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatMensaje>()
            .HasOne(x => x.ChatGrupo)
            .WithMany(g => g.Mensajes)
            .HasForeignKey(x => x.ChatGrupoId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ChatMensaje>()
            .HasOne(x => x.Usuario)
            .WithMany()
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ChatMensaje>()
            .HasOne(x => x.Actividad)
            .WithMany(a => a.ChatMensajes)
            .HasForeignKey(x => x.ActividadId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<ChatMensaje>()
            .HasOne(x => x.RespondidoPorUsuario)
            .WithMany()
            .HasForeignKey(x => x.RespondidoPorUsuarioId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Actividad>()
            .HasOne(x => x.ChatGrupo)
            .WithMany(g => g.Actividades)
            .HasForeignKey(x => x.ChatGrupoId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
