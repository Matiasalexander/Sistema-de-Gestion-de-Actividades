import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LifeBuoy,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch, DashboardEjecutivo, ProyectoItem } from '../../services/api';

export const DashboardPage: React.FC = () => {
  const { unidadActivaId } = useAuth();
  const [proyectoFiltroId, setProyectoFiltroId] = useState<string>('');

  const { data: proyectos = [] } = useQuery<ProyectoItem[]>({
    queryKey: ['proyectos', unidadActivaId],
    queryFn: () =>
      apiFetch<ProyectoItem[]>(
        `/api/proyectos${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
      ),
  });

  const { data: dashboard, isLoading } = useQuery<DashboardEjecutivo>({
    queryKey: ['dashboard', unidadActivaId, proyectoFiltroId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (unidadActivaId) params.set('unidadId', String(unidadActivaId));
      if (proyectoFiltroId) params.set('proyectoId', proyectoFiltroId);
      const qs = params.toString();
      return apiFetch<DashboardEjecutivo>(`/api/dashboard${qs ? `?${qs}` : ''}`);
    },
  });

  if (isLoading || !dashboard) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Cargando indicadores ejecutivos en tiempo real...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Proyectos Activos / Total',
      value: `${dashboard.proyectosActivos} / ${dashboard.totalProyectos}`,
      sub: 'Portafolio en curso',
      icon: FolderKanban,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      label: 'Actividades Pendientes',
      value: dashboard.actividadesPendientes,
      sub: `${dashboard.actividadesEnProgreso} en ejecución activa`,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    },
    {
      label: 'Actividades Completadas',
      value: dashboard.actividadesCompletadas,
      sub: `${dashboard.actividadesVencidas} vencidas`,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      label: 'Tickets Abiertos / Resueltos',
      value: `${dashboard.ticketsAbiertos} / ${dashboard.ticketsResueltos}`,
      sub: `${dashboard.ticketsVencidosSla} con SLA incumplido`,
      icon: LifeBuoy,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    },
    {
      label: 'Cumplimiento SLA Global',
      value: `${dashboard.porcentajeCumplimientoSla}%`,
      sub: `1ra resp: ${dashboard.tiempoPromedioPrimeraRespuestaMin}m · Resol: ${dashboard.tiempoPromedioResolucionMin}m`,
      icon: ShieldCheck,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-400',
    },
    {
      label: 'Alertas Críticas (Vencimientos)',
      value: dashboard.actividadesVencidas + dashboard.ticketsVencidosSla,
      sub: 'Actividades + Tickets fuera de SLA',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Ejecutivo GA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Métricas operativas en tiempo real de proyectos, actividades, mesa de ayuda y SLA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            aria-label="Filtrar por proyecto"
            value={proyectoFiltroId}
            onChange={(e) => setProyectoFiltroId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
          >
            <option value="">Todos los proyectos del alcance</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start justify-between"
            >
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">{kpi.value}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{kpi.sub}</div>
              </div>
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Gráficos Ejecutivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avance de Proyectos */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Avance Ponderado de Proyectos
            </h2>
            <span className="text-xs text-slate-400">Cálculo automático</span>
          </div>
          <div className="space-y-3.5">
            {dashboard.avanceProyectos.length === 0 ? (
              <div className="text-xs text-slate-500 py-4">Sin proyectos en el filtro actual.</div>
            ) : (
              dashboard.avanceProyectos.map((item) => (
                <div key={item.etiqueta}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate max-w-xs">{item.etiqueta}</span>
                    <span className="font-bold">{item.valor}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.valor)}%`,
                        backgroundColor: item.colorHex || '#2563EB',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribución de Actividades por Estado & SLA */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold mb-3">Actividades por Estado</h2>
            <div className="space-y-2.5">
              {dashboard.actividadesPorEstado.map((s) => (
                <div key={s.etiqueta} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.colorHex || '#2563EB' }}
                    />
                    {s.etiqueta}
                  </span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    {s.valor}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-3">Estado de Cumplimiento SLA</h2>
            <div className="space-y-2.5">
              {dashboard.distribucionSla.map((s) => (
                <div key={s.etiqueta} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.colorHex || '#10B981' }}
                    />
                    {s.etiqueta}
                  </span>
                  <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    {s.valor}
                  </span>
                </div>
              ))}
            </div>

            <h2 className="text-sm font-bold mt-5 mb-2">Tickets por Prioridad</h2>
            <div className="space-y-2">
              {dashboard.ticketsPorPrioridad.map((p) => (
                <div key={p.etiqueta} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: p.colorHex || '#2563EB' }}
                    />
                    {p.etiqueta}
                  </span>
                  <span className="font-bold">{p.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Productividad y Carga por Responsable */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Productividad y Carga de Trabajo por Responsable
          </h2>
          <span className="text-xs text-slate-400">
            Comparativa de actividades, tickets y horas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2.5 px-3">Responsable</th>
                <th className="py-2.5 px-3">Unidad Principal</th>
                <th className="py-2.5 px-3 text-center">Activas</th>
                <th className="py-2.5 px-3 text-center">Completadas</th>
                <th className="py-2.5 px-3 text-center">Vencidas</th>
                <th className="py-2.5 px-3 text-center">Tickets Asignados</th>
                <th className="py-2.5 px-3 text-right">Tiempo Trabajado / Est.</th>
                <th className="py-2.5 px-3 text-right">Cumplimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dashboard.productividadResponsables.map((r) => (
                <tr key={r.usuarioId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {r.nombreCompleto}
                    </div>
                    <div className="text-[11px] text-slate-400">{r.cargo}</div>
                  </td>
                  <td className="py-2.5 px-3">{r.unidadNombre}</td>
                  <td className="py-2.5 px-3 text-center font-semibold">{r.actividadesActivas}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-600 font-semibold">
                    {r.actividadesCompletadas}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {r.actividadesVencidas > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                        {r.actividadesVencidas}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold">{r.ticketsAsignados}</td>
                  <td className="py-2.5 px-3 text-right">
                    {(r.minutosTrabajados / 60).toFixed(1)}h / {(r.minutosEstimados / 60).toFixed(1)}h
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                    {r.indiceProductividad}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
