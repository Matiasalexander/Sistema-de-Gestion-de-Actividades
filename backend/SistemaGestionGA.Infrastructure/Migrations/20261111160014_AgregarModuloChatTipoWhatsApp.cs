using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SistemaGestionGA.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AgregarModuloChatTipoWhatsApp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChatGrupoId",
                table: "Actividades",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChatGrupos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UnidadId = table.Column<int>(type: "int", nullable: false),
                    ActividadActivaId = table.Column<int>(type: "int", nullable: true),
                    CreadoPorId = table.Column<int>(type: "int", nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGrupos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatGrupos_Actividades_ActividadActivaId",
                        column: x => x.ActividadActivaId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChatGrupos_Unidades_UnidadId",
                        column: x => x.UnidadId,
                        principalTable: "Unidades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatGrupos_Usuarios_CreadoPorId",
                        column: x => x.CreadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChatGrupoMiembros",
                columns: table => new
                {
                    ChatGrupoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    EsAdmin = table.Column<bool>(type: "bit", nullable: false),
                    FechaUnionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatGrupoMiembros", x => new { x.ChatGrupoId, x.UsuarioId });
                    table.ForeignKey(
                        name: "FK_ChatGrupoMiembros_ChatGrupos_ChatGrupoId",
                        column: x => x.ChatGrupoId,
                        principalTable: "ChatGrupos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatGrupoMiembros_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChatMensajes",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChatGrupoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    ActividadId = table.Column<int>(type: "int", nullable: true),
                    Texto = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TipoMensaje = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OpcionesInteractivasJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    OpcionSeleccionada = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RespondidoPorUsuarioId = table.Column<int>(type: "int", nullable: true),
                    FechaRespuestaUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCreacionUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMensajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMensajes_Actividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "Actividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChatMensajes_ChatGrupos_ChatGrupoId",
                        column: x => x.ChatGrupoId,
                        principalTable: "ChatGrupos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMensajes_Usuarios_RespondidoPorUsuarioId",
                        column: x => x.RespondidoPorUsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChatMensajes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Actividades_ChatGrupoId",
                table: "Actividades",
                column: "ChatGrupoId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGrupoMiembros_UsuarioId",
                table: "ChatGrupoMiembros",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGrupos_ActividadActivaId",
                table: "ChatGrupos",
                column: "ActividadActivaId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGrupos_CreadoPorId",
                table: "ChatGrupos",
                column: "CreadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatGrupos_UnidadId",
                table: "ChatGrupos",
                column: "UnidadId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_ActividadId",
                table: "ChatMensajes",
                column: "ActividadId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_ChatGrupoId",
                table: "ChatMensajes",
                column: "ChatGrupoId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_RespondidoPorUsuarioId",
                table: "ChatMensajes",
                column: "RespondidoPorUsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMensajes_UsuarioId",
                table: "ChatMensajes",
                column: "UsuarioId");

            migrationBuilder.AddForeignKey(
                name: "FK_Actividades_ChatGrupos_ChatGrupoId",
                table: "Actividades",
                column: "ChatGrupoId",
                principalTable: "ChatGrupos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Actividades_ChatGrupos_ChatGrupoId",
                table: "Actividades");

            migrationBuilder.DropTable(
                name: "ChatGrupoMiembros");

            migrationBuilder.DropTable(
                name: "ChatMensajes");

            migrationBuilder.DropTable(
                name: "ChatGrupos");

            migrationBuilder.DropIndex(
                name: "IX_Actividades_ChatGrupoId",
                table: "Actividades");

            migrationBuilder.DropColumn(
                name: "ChatGrupoId",
                table: "Actividades");
        }
    }
}
