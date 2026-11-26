import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import * as signalR from "@microsoft/signalr";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Kanban,
  LifeBuoy,
  Users,
  Shield,
  ShieldAlert,
  FileBarChart2,
  Settings,
  Bell,
  Building2,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  CheckCheck,
  MessageSquareText,
} from "lucide-react";
import { esColaboradorSistemas, useAuth } from "../auth/AuthContext";

import logo from "../img/gandersons-wlogo.png";

import { apiFetch, NotificacionItem, tokenStorage } from "../services/api";
import "../styles/MainLayout.css";

export const MainLayout: React.FC = () => {
  const { usuario, unidadActivaId, setUnidadActivaId, logout, tienePermiso } =
    useAuth();
  const accesoSistemas = esColaboradorSistemas(usuario);

  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  // controlar el cambio de tema
  const [modoOscuro, setModoOscuro] = useState(() => {
    const temaGuardado = localStorage.getItem("theme");
    if (temaGuardado) return temaGuardado === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [modoOscuro]);

  const cargarNotificaciones = async () => {
    try {
      const data = await apiFetch<NotificacionItem[]>("/api/notificaciones");
      setNotificaciones(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const token = tokenStorage.getAccess();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/notificaciones", {
        accessTokenFactory: () => tokenStorage.getAccess() || "",
      })
      .withAutomaticReconnect()
      .build();

    connection.on("NuevaNotificacion", (nueva: NotificacionItem) => {
      setNotificaciones((prev) => [nueva, ...prev]);
    });

    connection.start().catch(() => {
      // fallback silencioso si el socket aún no está disponible
    });

    return () => {
      connection.stop();
    };
  }, []);

  const marcarTodasLeidas = async () => {
    await apiFetch("/api/notificaciones/leer-todas", { method: "POST" });
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const menuItems = [
    {
      to: "/",
      label: "Dashboard Ejecutivo",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      to: "/proyectos",
      label: "Proyectos",
      icon: FolderKanban,
      visible: tienePermiso("proyectos.ver"),
    },
    {
      to: "/actividades",
      label: "Actividades",
      icon: CheckSquare,
      visible: tienePermiso("actividades.ver"),
    },
    { to: "/chat", label: "Chats", icon: MessageSquareText, visible: true },
    {
      to: "/tableros",
      label: "Tableros y Vistas",
      icon: Kanban,
      visible: tienePermiso("actividades.ver"),
    },
    {
      to: "/tickets",
      label: "Mesa de Ayuda / Tickets",
      icon: LifeBuoy,
      visible: tienePermiso("tickets.ver"),
    },
    { to: "/equipos", label: "Equipos de Trabajo", icon: Users, visible: true },
    {
      to: "/usuarios",
      label: "Usuarios y Seguridad",
      icon: Shield,
      visible: tienePermiso("usuarios.ver"),
    },
    {
      to: "/reportes",
      label: "Reportes y Exportación",
      icon: FileBarChart2,
      visible: tienePermiso("reportes.ver"),
    },
    {
      to: "/configuracion",
      label: "SLA y Automatización",
      icon: Settings,
      visible: true,
    },
    {
      to: "/",
      label: "Dashboard Ejecutivo",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      to: "/proyectos",
      label: "Proyectos",
      icon: FolderKanban,
      visible: tienePermiso("proyectos.ver"),
    },
    {
      to: "/actividades",
      label: "Actividades",
      icon: CheckSquare,
      visible: tienePermiso("actividades.ver"),
    },
    // NUEVO ÍTEM DE GUARDIAS:
    {
      to: "/guardias",
      label: "Guardias de Sistemas",
      icon: ShieldAlert,
      visible: accesoSistemas, // Visible ÚNICAMENTE para el departamento de Sistemas
    },
    { to: "/chat", label: "Chats", icon: MessageSquareText, visible: true },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarAbierto ? "sidebar--open" : "sidebar--closed"}`}
      >
        <div className="sidebar-header">
          <div className="main-logo-container">
            <img className="main-logo" src={logo} alt="Grupo Anderson's Logo" />
          </div>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="sidebar-close-btn"
            aria-label="Cerrar menú"
          >
            <X className="sidebar-close-icon" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setSidebarAbierto(false)}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? "sidebar-nav-item--active" : ""}`
                  }
                >
                  <Icon className="sidebar-nav-icon" />
                  <span className="sidebar-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-name">{usuario?.nombreCompleto}</div>
          <div className="sidebar-user-email">{usuario?.email}</div>
          <div className="sidebar-user-roles">
            {usuario?.roles.map((r) => (
              <span key={r} className="sidebar-role-badge">
                {r}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="main-content-wrapper">
        {/* Barra Superior */}
        <header className="header">
          <div className="header-left">
            <button
              onClick={() => setSidebarAbierto(true)}
              className="sidebar-menu-btn"
              aria-label="Abrir menú"
            >
              <Menu className="sidebar-menu-icon" />
            </button>

            {/* Selector de Alcance de Unidad */}
            <div className="unit-selector">
              <Building2 className="unit-selector-icon" />
              <span className="unit-selector-label">Alcance Unidad:</span>
              <select
                aria-label="Seleccionar unidad de negocio"
                value={unidadActivaId ?? ""}
                onChange={(e) =>
                  setUnidadActivaId(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="unit-selector-select"
              >
                {(usuario?.accesoGlobalUnidades ||
                  (usuario?.unidades.length ?? 0) > 1) && (
                  <option value="" className="unit-selector-option">
                    {usuario?.accesoGlobalUnidades
                      ? "🌐 Todas las Unidades (Global)"
                      : "Todas mis unidades autorizadas"}
                  </option>
                )}
                {usuario?.unidades.map((u) => (
                  <option
                    key={u.id}
                    value={u.id}
                    className="unit-selector-option"
                  >
                    {u.codigo} · {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="header-actions">
            {/* Botón Modo Claro / Oscuro */}
            <button
              onClick={() => setModoOscuro(!modoOscuro)}
              className="theme-toggle-btn"
              title={
                modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
              }
              aria-label="Alternar tema visual"
            >
              {modoOscuro ? (
                <Sun className="theme-icon theme-icon--sun" />
              ) : (
                <Moon className="theme-icon theme-icon--moon" />
              )}
            </button>

            {/* Campana de Notificaciones SignalR */}
            <div className="notifications-wrapper">
              <button
                onClick={() => setPanelNotifAbierto(!panelNotifAbierto)}
                className="notifications-btn"
                aria-label="Notificaciones"
              >
                <Bell className="notifications-icon" />
                {noLeidas > 0 && (
                  <span className="notifications-badge">{noLeidas}</span>
                )}
              </button>

              {panelNotifAbierto && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <span className="notifications-title">
                      Centro de Notificaciones
                    </span>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="notifications-read-all-btn"
                      >
                        <CheckCheck className="notifications-read-all-icon" />{" "}
                        Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="notifications-list">
                    {notificaciones.length === 0 ? (
                      <div className="notifications-empty">
                        No tienes notificaciones pendientes.
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          className={`notification-item ${
                            !n.leida ? "notification-item--unread" : ""
                          }`}
                        >
                          <div className="notification-title">{n.titulo}</div>
                          <div className="notification-message">
                            {n.mensaje}
                          </div>
                          <div className="notification-date">
                            {new Date(n.fechaCreacionUtc).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cerrar sesión */}
            <button onClick={logout} className="logout-btn">
              <LogOut className="logout-icon" />
              <span className="logout-label">Salir</span>
            </button>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
