import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Kanban,
  GanttChart,
  Calendar as CalendarIcon,
  UserCheck,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  ActividadItem,
  apiFetch,
  CatalogosOperativos,
  DashboardEjecutivo,
} from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const TablerosPage: React.FC = () => {
  const { unidadActivaId, usuario } = useAuth();
  const queryClient = useQueryClient();

  const [vista, setVista] = useState<'kanban' | 'gantt' | 'calendario' | 'mias' | 'carga'>('kanban');
  const [actividadArrastradaId, setActividadArrastradaId] = useState<number | null>(null);
  const [errorTransicion, setErrorTransicion] = useState<string | null>(null);

  const { data: actividades = [] } = useQuery<ActividadItem[]>({
    queryKey: ['actividades', unidadActivaId],
    queryFn: () =>
      apiFetch<ActividadItem[]>(
        `/api/actividades${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
      ),
  });

  const { data: catalogos } = useQuery<CatalogosOperativos>({
    queryKey: ['catalogos'],
    queryFn: () => apiFetch<CatalogosOperativos>('/api/catalogos'),
  });

  const { data: dashboard } = useQuery<DashboardEjecutivo>({
    queryKey: ['dashboard', unidadActivaId],
    queryFn: () =>
      apiFetch<DashboardEjecutivo>(
        `/api/dashboard${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
      ),
    enabled: vista === 'carga',
  });

  const moverTarjetaMutation = useMutation({
    mutationFn: ({ id, nuevoEstadoId }: { id: number; nuevoEstadoId: number }) =>
      apiFetch(`/api/actividades/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({
          nuevoEstadoActividadId: nuevoEstadoId,
          comentario: 'Movida en Tablero Kanban interactivo',
        }),
      }),
    onSuccess: () => {
      setErrorTransicion(null);
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => setErrorTransicion(err.message),
  });

  const handleDrop = (estadoDestinoId: number) => {
    if (actividadArrastradaId !== null) {
      moverTarjetaMutation.mutate({
        id: actividadArrastradaId,
        nuevoEstadoId: estadoDestinoId,
      });
      setActividadArrastradaId(null);
    }
  };

  const misActividades = actividades.filter((a) =>
    a.asignados.some((asig) => asig.usuarioId === usuario?.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableros y Vistas de Trabajo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Visualización multimodo: Kanban con Drag & Drop, Cronograma Gantt, Calendario, Mis Actividades y Carga.
          </p>
        </div>

        {/* Selector de Vista */}
        <div className="flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {[
            { id: 'kanban', label: 'Kanban', icon: Kanban },
            { id: 'gantt', label: 'Cronograma Gantt', icon: GanttChart },
            { id: 'calendario', label: 'Calendario', icon: CalendarIcon },
            { id: 'mias', label: 'Mis Actividades', icon: UserCheck },
            { id: 'carga', label: 'Carga de Trabajo', icon: BarChart3 },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setVista(v.id as any)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  vista === v.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorTransicion && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorTransicion}
          </span>
          <button onClick={() => setErrorTransicion(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* VISTA 1: KANBAN DRAG & DROP */}
      {vista === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {catalogos?.estadosActividad.map((col) => {
            const tarjetas = actividades.filter((a) => a.estadoActividadId === col.id);
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(col.id)}
                className="w-72 shrink-0 rounded-2xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.colorHex }}
                    />
                    <span className="text-xs font-bold">{col.nombre}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800">
                    {tarjetas.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[260px]">
                  {tarjetas.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setActividadArrastradaId(t.id)}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 cursor-grab active:cursor-grabbing space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-blue-600">{t.codigo}</span>
                        <StatusBadge label={t.prioridadNombre} colorHex={t.prioridadColor} />
                      </div>
                      <div className="text-xs font-semibold leading-snug">{t.titulo}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {t.proyectoNombre || t.unidadNombre}
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{t.fechaVencimiento || 'Sin fecha'}</span>
                        <span className="font-bold text-emerald-600">{t.porcentajeAvance}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: CRONOGRAMA VISUAL GANTT */}
      {vista === 'gantt' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Cronograma Visual de Actividades y Dependencias (Gantt)</h2>
            <span className="text-xs text-slate-400">Duración, estado, avance y predecesoras</span>
          </div>
          <div className="space-y-3">
            {actividades.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center text-xs"
              >
                <div className="lg:col-span-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{a.codigo}</span>
                    <span className="font-semibold truncate">{a.titulo}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {a.proyectoNombre || 'Independiente'} · {a.fechaInicio || 'N/A'} → {a.fechaVencimiento || 'N/A'}
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative flex items-center px-2">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg opacity-85"
                      style={{
                        width: `${Math.max(12, Math.min(100, a.porcentajeAvance))}%`,
                        backgroundColor: a.estadoColor,
                      }}
                    />
                    <span className="relative z-10 text-[11px] font-bold text-slate-900 dark:text-white">
                      {a.estadoNombre} ({a.porcentajeAvance}%)
                    </span>
                  </div>
                </div>
                <div className="lg:col-span-2 text-right">
                  {a.dependencias.length > 0 ? (
                    <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                      Depende de: {a.dependencias.map((d) => d.predecesoraCodigo).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin predecesora</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 3: CALENDARIO DE VENCIMIENTOS Y ENTREGABLES */}
      {vista === 'calendario' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actividades
            .slice()
            .sort((x, y) => (x.fechaVencimiento || '9999').localeCompare(y.fechaVencimiento || '9999'))
            .map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-600">
                    📅 Vence: {a.fechaVencimiento || 'Sin fecha'}
                  </span>
                  <StatusBadge label={a.estadoNombre} colorHex={a.estadoColor} />
                </div>
                <div className="font-bold text-sm">{a.titulo}</div>
                <div className="text-slate-500">{a.proyectoNombre || a.unidadNombre}</div>
              </div>
            ))}
        </div>
      )}

      {/* VISTA 4: MIS ACTIVIDADES */}
      {vista === 'mias' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              titulo: '🔥 Vencidas o Urgentes',
              items: misActividades.filter((a) => a.estaVencida || a.prioridadCodigo === 'CRITICA'),
            },
            {
              titulo: '⚡ En Ejecución / Próximas',
              items: misActividades.filter((a) => !a.estaVencida && a.estadoCodigo !== 'COMPLETADA'),
            },
            {
              titulo: '✅ Completadas por mí',
              items: misActividades.filter((a) => a.estadoCodigo === 'COMPLETADA'),
            },
          ].map((bloque) => (
            <div
              key={bloque.titulo}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <h3 className="text-sm font-bold">{bloque.titulo} ({bloque.items.length})</h3>
              <div className="space-y-2">
                {bloque.items.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1"
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-blue-600">{a.codigo}</span>
                      <span>{a.porcentajeAvance}%</span>
                    </div>
                    <div className="font-semibold">{a.titulo}</div>
                    <div className="text-[11px] text-slate-400">Vence: {a.fechaVencimiento || '-'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VISTA 5: CARGA DE TRABAJO */}
      {vista === 'carga' && dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboard.productividadResponsables.map((r) => {
            const ocupacionPct = Math.min(100, Math.round((r.minutosEstimados / 2400) * 100));
            return (
              <div
                key={r.usuarioId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">{r.nombreCompleto}</div>
                    <div className="text-slate-400">{r.cargo} · {r.unidadNombre}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                    {r.actividadesActivas} activas · {r.ticketsAsignados} tickets
                  </span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">
                      Carga horaria asignada ({(r.minutosEstimados / 60).toFixed(1)}h est / {(r.minutosTrabajados / 60).toFixed(1)}h reg)
                    </span>
                    <span className="font-bold">{ocupacionPct}% cap. semanal</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ocupacionPct > 85 ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${ocupacionPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
