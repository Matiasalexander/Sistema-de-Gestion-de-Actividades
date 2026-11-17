import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Kanban,
  LifeBuoy,
  Users,
  Shield,
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
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiFetch, NotificacionItem, tokenStorage } from '../services/api';

export const MainLayout: React.FC = () => {
  const { usuario, unidadActivaId, setUnidadActivaId, logout, tienePermiso } = useAuth();
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [modoOscuro]);

  const cargarNotificaciones = async () => {
    try {
      const data = await apiFetch<NotificacionItem[]>('/api/notificaciones');
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
      .withUrl('/hubs/notificaciones', {
        accessTokenFactory: () => tokenStorage.getAccess() || '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('NuevaNotificacion', (nueva: NotificacionItem) => {
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
    await apiFetch('/api/notificaciones/leer-todas', { method: 'POST' });
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const menuItems = [
    { to: '/', label: 'Dashboard Ejecutivo', icon: LayoutDashboard, visible: true },
    { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, visible: tienePermiso('proyectos.ver') },
    { to: '/actividades', label: 'Actividades', icon: CheckSquare, visible: tienePermiso('actividades.ver') },
    { to: '/chat', label: 'Chats', icon: MessageSquareText, visible: true },
    { to: '/tableros', label: 'Tableros y Vistas', icon: Kanban, visible: tienePermiso('actividades.ver') },
    { to: '/tickets', label: 'Mesa de Ayuda / Tickets', icon: LifeBuoy, visible: tienePermiso('tickets.ver') },
    { to: '/equipos', label: 'Equipos de Trabajo', icon: Users, visible: true },
    { to: '/usuarios', label: 'Usuarios y Seguridad', icon: Shield, visible: tienePermiso('usuarios.ver') },
    { to: '/reportes', label: 'Reportes y Exportación', icon: FileBarChart2, visible: tienePermiso('reportes.ver') },
    { to: '/configuracion', label: 'SLA y Automatización', icon: Settings, visible: true },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform lg:static lg:translate-x-0 ${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              GA
            </div>
            <div>
              <div className="font-bold text-white text-sm leading-none">Sistema Gestión GA</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Work & Service Management</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarAbierto(false)}
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarAbierto(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="text-xs font-semibold text-white truncate">{usuario?.nombreCompleto}</div>
          <div className="text-[11px] text-slate-400 truncate mt-0.5">{usuario?.email}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {usuario?.roles.map((r) => (
              <span
                key={r}
                className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-400/20 text-blue-300 text-[10px] font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAbierto(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Selector de Alcance de Unidad */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                Alcance Unidad:
              </span>
              <select
                aria-label="Seleccionar unidad de negocio"
                value={unidadActivaId ?? ''}
                onChange={(e) =>
                  setUnidadActivaId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {(usuario?.accesoGlobalUnidades || (usuario?.unidades.length ?? 0) > 1) && (
                  <option value="" className="bg-white dark:bg-slate-900">
                    {usuario?.accesoGlobalUnidades
                      ? '🌐 Todas las Unidades (Global)'
                      : 'Todas mis unidades autorizadas'}
                  </option>
                )}
                {usuario?.unidades.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-slate-900">
                    {u.codigo} · {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botón Modo Claro / Oscuro */}
            <button
              onClick={() => setModoOscuro(!modoOscuro)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema visual"
            >
              {modoOscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Campana de Notificaciones SignalR */}
            <div className="relative">
              <button
                onClick={() => setPanelNotifAbierto(!panelNotifAbierto)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {noLeidas}
                  </span>
                )}
              </button>

              {panelNotifAbierto && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-sm">Centro de Notificaciones</span>
                    {noLeidas > 0 && (
                      <button
                        onClick={marcarTodasLeidas}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Marcar leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notificaciones.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No tienes notificaciones pendientes.
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs ${
                            !n.leida ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="font-semibold text-slate-800 dark:text-slate-100">{n.titulo}</div>
                          <div className="text-slate-600 dark:text-slate-400 mt-0.5">{n.mensaje}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
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
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-xs font-medium transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Área de Contenido */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
