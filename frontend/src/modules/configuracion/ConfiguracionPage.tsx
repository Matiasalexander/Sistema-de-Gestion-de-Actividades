import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Zap, Power } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  PoliticaSlaItem,
  ReglaAutomatizacionItem,
} from '../../services/api';

export const ConfiguracionPage: React.FC = () => {
  const { tienePermiso } = useAuth();
  const queryClient = useQueryClient();

  const [nuevoNombreRegla, setNuevoNombreRegla] = useState('');
  const [eventoDisparador, setEventoDisparador] = useState('TicketAsignado');
  const [accionTipo, setAccionTipo] = useState('NotificarResponsable');

  const { data: politicasSla = [] } = useQuery<PoliticaSlaItem[]>({
    queryKey: ['slas'],
    queryFn: () => apiFetch<PoliticaSlaItem[]>('/api/slas'),
  });

  const { data: automatizaciones = [] } = useQuery<ReglaAutomatizacionItem[]>({
    queryKey: ['automatizaciones'],
    queryFn: () => apiFetch<ReglaAutomatizacionItem[]>('/api/automatizaciones'),
  });

  const toggleReglaMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/api/automatizaciones/${id}/toggle`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automatizaciones'] }),
  });

  const crearReglaMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/automatizaciones', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nuevoNombreRegla,
          descripcion: `CUANDO ocurre ${eventoDisparador} ENTONCES ejecutar ${accionTipo}`,
          eventoDisparador,
          condicionJson: '{"activo":true}',
          accionTipo,
          accionConfigJson: '{"canal":"SignalR"}',
          activa: true,
        }),
      }),
    onSuccess: () => {
      setNuevoNombreRegla('');
      queryClient.invalidateQueries({ queryKey: ['automatizaciones'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Políticas SLA y Reglas de Automatización
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Acuerdos de nivel de servicio por prioridad/calendario y motor de reglas CUANDO → SI → ENTONCES.
        </p>
      </div>

      {/* Políticas SLA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" /> Políticas de Acuerdo de Nivel de Servicio (SLA)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2.5 px-3">Política SLA</th>
                <th className="py-2.5 px-3">Prioridad</th>
                <th className="py-2.5 px-3">Calendario Aplicable</th>
                <th className="py-2.5 px-3 text-center">Máx. 1ra Respuesta</th>
                <th className="py-2.5 px-3 text-center">Máx. Resolución</th>
                <th className="py-2.5 px-3 text-center">Umbral Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {politicasSla.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3 font-bold">{p.nombre}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{p.prioridadNombre}</td>
                  <td className="py-2.5 px-3">{p.calendarioNombre || '24x7'}</td>
                  <td className="py-2.5 px-3 text-center font-semibold">
                    {p.tiempoPrimeraRespuestaMinutos} min
                  </td>
                  <td className="py-2.5 px-3 text-center font-semibold">
                    {p.tiempoResolucionMinutos} min
                  </td>
                  <td className="py-2.5 px-3 text-center">{p.umbralAlertaPorcentaje}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Motor de Automatizaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Reglas de Automatización (CUANDO → SI → ENTONCES)
        </h2>

        <div className="space-y-2.5">
          {automatizaciones.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{r.nombre}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                    CUANDO: {r.eventoDisparador}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                    ENTONCES: {r.accionTipo}
                  </span>
                </div>
                <p className="text-slate-500 mt-1">{r.descripcion}</p>
                <div className="text-[11px] text-slate-400 mt-1">
                  Ejecuciones exitosas: {r.totalEjecuciones} · Fallos: {r.totalFallos}
                </div>
              </div>

              {tienePermiso('configuracion.gestionar') && (
                <button
                  onClick={() => toggleReglaMutation.mutate(r.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer ${
                    r.activa
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {r.activa ? 'Activa' : 'Inactiva'}
                </button>
              )}
            </div>
          ))}
        </div>

        {tienePermiso('configuracion.gestionar') && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
            <input
              value={nuevoNombreRegla}
              onChange={(e) => setNuevoNombreRegla(e.target.value)}
              placeholder="Nombre de la nueva regla..."
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
            />
            <select
              value={eventoDisparador}
              onChange={(e) => setEventoDisparador(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="TicketAsignado">CUANDO: TicketAsignado</option>
              <option value="SlaAlerta">CUANDO: SlaAlerta</option>
              <option value="ActividadCompletada">CUANDO: ActividadCompletada</option>
            </select>
            <select
              value={accionTipo}
              onChange={(e) => setAccionTipo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="NotificarResponsable">ENTONCES: NotificarResponsable</option>
              <option value="EscalarSupervisor">ENTONCES: EscalarSupervisor</option>
              <option value="DesbloquearSucesoras">ENTONCES: DesbloquearSucesoras</option>
            </select>
            <button
              onClick={() => nuevoNombreRegla && crearReglaMutation.mutate()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
            >
              Agregar Regla
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
