using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaGestionGA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MigracionInicialSistemaGestionGA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CalendariosSla",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ZonaHoraria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    HoraInicioAtencion = table.Column<TimeOnly>(type: "time", nullable: false),
                    HoraFinAtencion = table.Column<TimeOnly>(type: "time", nullable: false),
                    DiasLaborales = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CalendariosSla", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EstadosActividad",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    EsFinal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EstadosActividad", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EstadosProyecto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    EsFinal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EstadosProyecto", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EstadosTicket",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    PausaSla = table.Column<bool>(type: "bit", nullable: false),
                    EsFinal = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EstadosTicket", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permisos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Modulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permisos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Prioridades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorHex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Nivel = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prioridades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ReglasAutomatizacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EventoDisparador = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CondicionJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccionTipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccionConfigJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    TotalEjecuciones = table.Column<int>(type: "int", nullable: false),
                    TotalFallos = table.Column<int>(type: "int", nullable: false),
                    UltimaEjecucionUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReglasAutomatizacion", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EsSistema = table.Column<bool>(type: "bit", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TicketCategorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketCategorias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TicketTipos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketTipos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Unidades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ZonaHoraria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaModificacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Unidades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DiasFestivosSla",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CalendarioSlaId = table.Column<int>(type: "int", nullable: false),
                    Fecha = table.Column<DateOnly>(type: "date", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiasFestivosSla", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiasFestivosSla_CalendariosSla_CalendarioSlaId",
                        column: x => x.CalendarioSlaId,
                        principalTable: "CalendariosSla",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RolPermisos",
                columns: table => new
                {
                    RolId = table.Column<int>(type: "int", nullable: false),
                    PermisoId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolPermisos", x => new { x.RolId, x.PermisoId });
                    table.ForeignKey(
                        name: "FK_RolPermisos_Permisos_PermisoId",
                        column: x => x.PermisoId,
                        principalTable: "Permisos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolPermisos_Roles_RolId",
                        column: x => x.RolId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Departamentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Activa = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departamentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Departamentos_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NombreUsuario = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NombreCompleto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Cargo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartamentoId = table.Column<int>(type: "int", nullable: true),
                    AccesoGlobalUnidades = table.Column<bool>(type: "bit", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    DebeCambiarPassword = table.Column<bool>(type: "bit", nullable: false),
                    IntentosFallidos = table.Column<int>(type: "int", nullable: false),
                    BloqueadoHastaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UltimoAccesoUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TokenRecuperacionHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TokenRecuperacionExpiraUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaModificacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriaEventos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    NombreUsuario = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Modulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Entidad = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EntidadId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: true),
                    Resumen = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValoresAnteriores = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValoresNuevos = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaEventoUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriaEventos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditoriaEventos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Equipos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    DepartamentoId = table.Column<int>(type: "int", nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ColorHex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LiderUsuarioId = table.Column<int>(type: "int", nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Equipos_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Equipos_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Equipos_Usuarios_LiderUsuarioId",
                        column: x => x.LiderUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HistorialAccesos",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    IdentificadorIntentado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Exitoso = table.Column<bool>(type: "bit", nullable: false),
                    Motivo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaIntentoUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HistorialAccesos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HistorialAccesos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioDestinoId = table.Column<int>(type: "int", nullable: false),
                    TipoEvento = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UrlDestino = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Leida = table.Column<bool>(type: "bit", nullable: false),
                    FechaLecturaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Usuarios_UsuarioDestinoId",
                        column: x => x.UsuarioDestinoId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaExpiracionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreadoPorIp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaRevocacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReemplazadoPorTokenHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RevocadoPorIp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MotivoRevocacion = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRoles",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    RolId = table.Column<int>(type: "int", nullable: false),
                    FechaAsignacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioRoles", x => new { x.UsuarioId, x.RolId });
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Roles_RolId",
                        column: x => x.RolId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioUnidades",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    EsUnidadPrincipal = table.Column<bool>(type: "bit", nullable: false),
                    FechaAsignacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioUnidades", x => new { x.UsuarioId, x.UnidadId });
                    table.ForeignKey(
                        name: "FK_UsuarioUnidades_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioUnidades_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PoliticasSla",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PrioridadId = table.Column<int>(type: "int", nullable: false),
                    TicketTipoId = table.Column<int>(type: "int", nullable: true),
                    TicketCategoriaId = table.Column<int>(type: "int", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: true),
                    CalendarioSlaId = table.Column<int>(type: "int", nullable: true),
                    EquipoEscalamientoId = table.Column<int>(type: "int", nullable: true),
                    TiempoPrimeraRespuestaMinutos = table.Column<int>(type: "int", nullable: false),
                    TiempoResolucionMinutos = table.Column<int>(type: "int", nullable: false),
                    UmbralAlertaPorcentaje = table.Column<int>(type: "int", nullable: false),
                    Activa = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoliticasSla", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PoliticasSla_CalendariosSla_CalendarioSlaId",
                        column: x => x.CalendarioSlaId,
                        principalTable: "CalendariosSla",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PoliticasSla_Equipos_EquipoEscalamientoId",
                        column: x => x.EquipoEscalamientoId,
                        principalTable: "Equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PoliticasSla_Prioridades_PrioridadId",
                        column: x => x.PrioridadId,
                        principalTable: "Prioridades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PoliticasSla_TicketCategorias_TicketCategoriaId",
                        column: x => x.TicketCategoriaId,
                        principalTable: "TicketCategorias",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PoliticasSla_TicketTipos_TicketTipoId",
                        column: x => x.TicketTipoId,
                        principalTable: "TicketTipos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PoliticasSla_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Proyectos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    DepartamentoId = table.Column<int>(type: "int", nullable: true),
                    EquipoId = table.Column<int>(type: "int", nullable: true),
                    ResponsableId = table.Column<int>(type: "int", nullable: false),
                    PrioridadId = table.Column<int>(type: "int", nullable: false),
                    EstadoProyectoId = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaFinEstimada = table.Column<DateOnly>(type: "date", nullable: false),
                    FechaFinReal = table.Column<DateOnly>(type: "date", nullable: true),
                    PorcentajeAvance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    Archivado = table.Column<bool>(type: "bit", nullable: false),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaModificacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proyectos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proyectos_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proyectos_Equipos_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "Equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proyectos_EstadosProyecto_EstadoProyectoId",
                        column: x => x.EstadoProyectoId,
                        principalTable: "EstadosProyecto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Proyectos_Prioridades_PrioridadId",
                        column: x => x.PrioridadId,
                        principalTable: "Prioridades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Proyectos_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Proyectos_Usuarios_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioEquipos",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    EquipoId = table.Column<int>(type: "int", nullable: false),
                    RolEnEquipo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaIncorporacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioEquipos", x => new { x.UsuarioId, x.EquipoId });
                    table.ForeignKey(
                        name: "FK_UsuarioEquipos_Equipos_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "Equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioEquipos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Folio = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TicketTipoId = table.Column<int>(type: "int", nullable: false),
                    TicketCategoriaId = table.Column<int>(type: "int", nullable: false),
                    PrioridadId = table.Column<int>(type: "int", nullable: false),
                    EstadoTicketId = table.Column<int>(type: "int", nullable: false),
                    SolicitanteId = table.Column<int>(type: "int", nullable: false),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    EquipoAsignadoId = table.Column<int>(type: "int", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    DepartamentoId = table.Column<int>(type: "int", nullable: true),
                    PoliticaSlaId = table.Column<int>(type: "int", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaPrimeraRespuestaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaResolucionUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCierreUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaLimitePrimeraRespuestaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaLimiteResolucionUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaUltimoInicioPausaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MinutosPausadoSla = table.Column<int>(type: "int", nullable: false),
                    EstadoSla = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Escalado = table.Column<bool>(type: "bit", nullable: false),
                    FechaModificacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Equipos_EquipoAsignadoId",
                        column: x => x.EquipoAsignadoId,
                        principalTable: "Equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_EstadosTicket_EstadoTicketId",
                        column: x => x.EstadoTicketId,
                        principalTable: "EstadosTicket",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tickets_PoliticasSla_PoliticaSlaId",
                        column: x => x.PoliticaSlaId,
                        principalTable: "PoliticasSla",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Prioridades_PrioridadId",
                        column: x => x.PrioridadId,
                        principalTable: "Prioridades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tickets_TicketCategorias_TicketCategoriaId",
                        column: x => x.TicketCategoriaId,
                        principalTable: "TicketCategorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tickets_TicketTipos_TicketTipoId",
                        column: x => x.TicketTipoId,
                        principalTable: "TicketTipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Tickets_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Usuarios_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Usuarios_SolicitanteId",
                        column: x => x.SolicitanteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProyectoFases",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    EsHito = table.Column<bool>(type: "bit", nullable: false),
                    FechaInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    FechaFinEstimada = table.Column<DateOnly>(type: "date", nullable: true),
                    Completada = table.Column<bool>(type: "bit", nullable: false),
                    PorcentajeAvance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProyectoFases", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProyectoFases_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProyectoIntegrantes",
                columns: table => new
                {
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    RolProyecto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FechaAsignacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProyectoIntegrantes", x => new { x.ProyectoId, x.UsuarioId });
                    table.ForeignKey(
                        name: "FK_ProyectoIntegrantes_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProyectoIntegrantes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketHistorial",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Accion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EstadoAnterior = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstadoNuevo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Detalle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaEventoUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketHistorial", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketHistorial_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketHistorial_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Actividades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Codigo = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProyectoId = table.Column<int>(type: "int", nullable: true),
                    FaseProyectoId = table.Column<int>(type: "int", nullable: true),
                    ActividadPadreId = table.Column<int>(type: "int", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    DepartamentoId = table.Column<int>(type: "int", nullable: true),
                    EquipoId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrioridadId = table.Column<int>(type: "int", nullable: false),
                    EstadoActividadId = table.Column<int>(type: "int", nullable: false),
                    FechaInicio = table.Column<DateOnly>(type: "date", nullable: true),
                    FechaVencimiento = table.Column<DateOnly>(type: "date", nullable: true),
                    FechaFinalizacionRealUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TiempoEstimadoMinutos = table.Column<int>(type: "int", nullable: false),
                    PorcentajeAvance = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                    EsRecurrente = table.Column<bool>(type: "bit", nullable: false),
                    PatronRecurrencia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Archivada = table.Column<bool>(type: "bit", nullable: false),
                    CreadoPorId = table.Column<int>(type: "int", nullable: true),
                    ModificadoPorId = table.Column<int>(type: "int", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaModificacionUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actividades", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Actividades_Actividades_ActividadPadreId",
                        column: x => x.ActividadPadreId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_Departamentos_DepartamentoId",
                        column: x => x.DepartamentoId,
                        principalTable: "Departamentos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_Equipos_EquipoId",
                        column: x => x.EquipoId,
                        principalTable: "Equipos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_EstadosActividad_EstadoActividadId",
                        column: x => x.EstadoActividadId,
                        principalTable: "EstadosActividad",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Actividades_Prioridades_PrioridadId",
                        column: x => x.PrioridadId,
                        principalTable: "Prioridades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Actividades_ProyectoFases_FaseProyectoId",
                        column: x => x.FaseProyectoId,
                        principalTable: "ProyectoFases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Actividades_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActividadAsignados",
                columns: table => new
                {
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    EsPrincipal = table.Column<bool>(type: "bit", nullable: false),
                    AsignadoPorId = table.Column<int>(type: "int", nullable: true),
                    FechaAsignacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadAsignados", x => new { x.ActividadId, x.UsuarioId });
                    table.ForeignKey(
                        name: "FK_ActividadAsignados_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActividadAsignados_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActividadChecklists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Completado = table.Column<bool>(type: "bit", nullable: false),
                    CompletadoPorId = table.Column<int>(type: "int", nullable: true),
                    FechaCompletadoUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadChecklists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActividadChecklists_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActividadDependencias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    ActividadPredecesoraId = table.Column<int>(type: "int", nullable: false),
                    TipoDependencia = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadDependencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActividadDependencias_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActividadDependencias_Actividades_ActividadPredecesoraId",
                        column: x => x.ActividadPredecesoraId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActividadHistorial",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    TipoCambio = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ValorAnterior = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ValorNuevo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Detalle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaCambioUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadHistorial", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActividadHistorial_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActividadHistorial_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ActividadTiempos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    MinutosTrabajados = table.Column<int>(type: "int", nullable: false),
                    FechaTrabajo = table.Column<DateOnly>(type: "date", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FechaRegistroUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActividadTiempos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActividadTiempos_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActividadTiempos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Adjuntos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: true),
                    ActividadId = table.Column<int>(type: "int", nullable: true),
                    TicketId = table.Column<int>(type: "int", nullable: true),
                    NombreOriginal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NombreAlmacenado = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RutaRelativa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TamanoBytes = table.Column<long>(type: "bigint", nullable: false),
                    HashSha256 = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EsEvidencia = table.Column<bool>(type: "bit", nullable: false),
                    SubidoPorId = table.Column<int>(type: "int", nullable: false),
                    FechaSubidaUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Adjuntos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Adjuntos_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Adjuntos_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Adjuntos_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Adjuntos_Usuarios_SubidoPorId",
                        column: x => x.SubidoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Comentarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: true),
                    ActividadId = table.Column<int>(type: "int", nullable: true),
                    TicketId = table.Column<int>(type: "int", nullable: true),
                    AutorId = table.Column<int>(type: "int", nullable: false),
                    Contenido = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MencionesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EsInterno = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comentarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comentarios_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comentarios_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comentarios_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comentarios_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketActividades",
                columns: table => new
                {
                    TicketId = table.Column<int>(type: "int", nullable: false),
                    ActividadId = table.Column<int>(type: "int", nullable: false),
                    FechaVinculacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketActividades", x => new { x.TicketId, x.ActividadId });
                    table.ForeignKey(
                        name: "FK_TicketActividades_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketActividades_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActividadAsignados_UsuarioId",
                table: "ActividadAsignados",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadChecklists_ActividadId",
                table: "ActividadChecklists",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadDependencias_ActividadId",
                table: "ActividadDependencias",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadDependencias_ActividadPredecesoraId",
                table: "ActividadDependencias",
                column: "ActividadPredecesoraId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_ActividadPadreId",
                table: "Actividades",
                column: "ActividadPadreId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_Codigo",
                table: "Actividades",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_DepartamentoId",
                table: "Actividades",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_EquipoId",
                table: "Actividades",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_EstadoActividadId",
                table: "Actividades",
                column: "EstadoActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_FaseProyectoId",
                table: "Actividades",
                column: "FaseProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_PrioridadId",
                table: "Actividades",
                column: "PrioridadId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_ProyectoId",
                table: "Actividades",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_UnidadId",
                table: "Actividades",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadHistorial_ActividadId",
                table: "ActividadHistorial",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadHistorial_UsuarioId",
                table: "ActividadHistorial",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadTiempos_ActividadId",
                table: "ActividadTiempos",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_ActividadTiempos_UsuarioId",
                table: "ActividadTiempos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_ActividadId",
                table: "Adjuntos",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_ProyectoId",
                table: "Adjuntos",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_SubidoPorId",
                table: "Adjuntos",
                column: "SubidoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Adjuntos_TicketId",
                table: "Adjuntos",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaEventos_UsuarioId",
                table: "AuditoriaEventos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_ActividadId",
                table: "Comentarios",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_AutorId",
                table: "Comentarios",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_ProyectoId",
                table: "Comentarios",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_TicketId",
                table: "Comentarios",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_Departamentos_UnidadId_Codigo",
                table: "Departamentos",
                columns: new[] { "UnidadId", "Codigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiasFestivosSla_CalendarioSlaId",
                table: "DiasFestivosSla",
                column: "CalendarioSlaId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipos_Codigo",
                table: "Equipos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Equipos_DepartamentoId",
                table: "Equipos",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipos_LiderUsuarioId",
                table: "Equipos",
                column: "LiderUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Equipos_UnidadId",
                table: "Equipos",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_EstadosActividad_Codigo",
                table: "EstadosActividad",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EstadosProyecto_Codigo",
                table: "EstadosProyecto",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_EstadosTicket_Codigo",
                table: "EstadosTicket",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HistorialAccesos_UsuarioId",
                table: "HistorialAccesos",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_UsuarioDestinoId",
                table: "Notificaciones",
                column: "UsuarioDestinoId");

            migrationBuilder.CreateIndex(
                name: "IX_Permisos_Codigo",
                table: "Permisos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_CalendarioSlaId",
                table: "PoliticasSla",
                column: "CalendarioSlaId");

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_EquipoEscalamientoId",
                table: "PoliticasSla",
                column: "EquipoEscalamientoId");

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_PrioridadId",
                table: "PoliticasSla",
                column: "PrioridadId");

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_TicketCategoriaId",
                table: "PoliticasSla",
                column: "TicketCategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_TicketTipoId",
                table: "PoliticasSla",
                column: "TicketTipoId");

            migrationBuilder.CreateIndex(
                name: "IX_PoliticasSla_UnidadId",
                table: "PoliticasSla",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_Prioridades_Codigo",
                table: "Prioridades",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProyectoFases_ProyectoId",
                table: "ProyectoFases",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProyectoIntegrantes_UsuarioId",
                table: "ProyectoIntegrantes",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_Codigo",
                table: "Proyectos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_DepartamentoId",
                table: "Proyectos",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_EquipoId",
                table: "Proyectos",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_EstadoProyectoId",
                table: "Proyectos",
                column: "EstadoProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_PrioridadId",
                table: "Proyectos",
                column: "PrioridadId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_ResponsableId",
                table: "Proyectos",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_UnidadId",
                table: "Proyectos",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_UsuarioId",
                table: "RefreshTokens",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Codigo",
                table: "Roles",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolPermisos_PermisoId",
                table: "RolPermisos",
                column: "PermisoId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketActividades_ActividadId",
                table: "TicketActividades",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketCategorias_Codigo",
                table: "TicketCategorias",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TicketHistorial_TicketId",
                table: "TicketHistorial",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketHistorial_UsuarioId",
                table: "TicketHistorial",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_DepartamentoId",
                table: "Tickets",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_EquipoAsignadoId",
                table: "Tickets",
                column: "EquipoAsignadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_EstadoTicketId",
                table: "Tickets",
                column: "EstadoTicketId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Folio",
                table: "Tickets",
                column: "Folio",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_PoliticaSlaId",
                table: "Tickets",
                column: "PoliticaSlaId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_PrioridadId",
                table: "Tickets",
                column: "PrioridadId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ResponsableId",
                table: "Tickets",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_SolicitanteId",
                table: "Tickets",
                column: "SolicitanteId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketCategoriaId",
                table: "Tickets",
                column: "TicketCategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketTipoId",
                table: "Tickets",
                column: "TicketTipoId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_UnidadId",
                table: "Tickets",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketTipos_Codigo",
                table: "TicketTipos",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Unidades_Codigo",
                table: "Unidades",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioEquipos_EquipoId",
                table: "UsuarioEquipos",
                column: "EquipoId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioRoles_RolId",
                table: "UsuarioRoles",
                column: "RolId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_DepartamentoId",
                table: "Usuarios",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_NombreUsuario",
                table: "Usuarios",
                column: "NombreUsuario",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioUnidades_UnidadId",
                table: "UsuarioUnidades",
                column: "UnidadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActividadAsignados");

            migrationBuilder.DropTable(
                name: "ActividadChecklists");

            migrationBuilder.DropTable(
                name: "ActividadDependencias");

            migrationBuilder.DropTable(
                name: "ActividadHistorial");

            migrationBuilder.DropTable(
                name: "ActividadTiempos");

            migrationBuilder.DropTable(
                name: "Adjuntos");

            migrationBuilder.DropTable(
                name: "AuditoriaEventos");

            migrationBuilder.DropTable(
                name: "Comentarios");

            migrationBuilder.DropTable(
                name: "DiasFestivosSla");

            migrationBuilder.DropTable(
                name: "HistorialAccesos");

            migrationBuilder.DropTable(
                name: "Notificaciones");

            migrationBuilder.DropTable(
                name: "ProyectoIntegrantes");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "ReglasAutomatizacion");

            migrationBuilder.DropTable(
                name: "RolPermisos");

            migrationBuilder.DropTable(
                name: "TicketActividades");

            migrationBuilder.DropTable(
                name: "TicketHistorial");

            migrationBuilder.DropTable(
                name: "UsuarioEquipos");

            migrationBuilder.DropTable(
                name: "UsuarioRoles");

            migrationBuilder.DropTable(
                name: "UsuarioUnidades");

            migrationBuilder.DropTable(
                name: "Permisos");

            migrationBuilder.DropTable(
                name: "Actividades");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "EstadosActividad");

            migrationBuilder.DropTable(
                name: "ProyectoFases");

            migrationBuilder.DropTable(
                name: "EstadosTicket");

            migrationBuilder.DropTable(
                name: "PoliticasSla");

            migrationBuilder.DropTable(
                name: "Proyectos");

            migrationBuilder.DropTable(
                name: "CalendariosSla");

            migrationBuilder.DropTable(
                name: "TicketCategorias");

            migrationBuilder.DropTable(
                name: "TicketTipos");

            migrationBuilder.DropTable(
                name: "Equipos");

            migrationBuilder.DropTable(
                name: "EstadosProyecto");

            migrationBuilder.DropTable(
                name: "Prioridades");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropTable(
                name: "Departamentos");

            migrationBuilder.DropTable(
                name: "Unidades");
        }
    }
}
