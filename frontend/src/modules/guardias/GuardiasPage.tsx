import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  FileText,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch, UnidadItem } from '../../services/api';

// Tipos locales
interface GuardiaActividad {
  id: number;
  guardiaId: number;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
  tipoActividad: string;
  titulo: string;
  descripcion: string;
  solucion?: string;
  estado: string;
  folioTicket?: string;
  requiereSeguimientoLunes: boolean;
  detalleSeguimiento?: string;
}

interface Guardia {
  id: number;
  folio: string;
  usuarioNombre: string;
  unidadNombre: string;
  fecha: string;
  diaSemana: string;
  horaInicioTurno?: string;
  horaFinTurno?: string;
  estado: string;
  observacionesEntrega?: string;
  totalActividades: number;
  totalMinutos: number;
  tienePendientesLunes: boolean;
  actividades?: GuardiaActividad[];
}

const TIPOS_ACTIVIDAD = [
  'Soporte Remoto',
  'Incidencia Crítica',
  'Mantenimiento Preventivo',
  'Monitoreo y Revisión de Servicios',
  'Pase a Producción',
  'Otro',
];

export const GuardiasPage: React.FC = () => {
  const { usuario, unidadActivaId } = useAuth();
  const queryClient = useQueryClient();

  // Estado Maestro - Detalle
  const [guardiaSeleccionadaId, setGuardiaSeleccionadaId] = useState<number | null>(null);

  // Modales
  const [modalNuevaGuardia, setModalNuevaGuardia] = useState(false);
  const [modalCerrarGuardia, setModalCerrarGuardia] = useState(false);
  const [modalActividad, setModalActividad] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<GuardiaActividad | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formularios
  const [formGuardia, setFormGuardia] = useState({
    unidadId: unidadActivaId || 1,
    fecha: new Date().toISOString().split('T')[0],
    horaInicioTurno: '09:00',
    horaFinTurno: '18:00',
    esGuardiaExtraordinaria: false,
    observacionesEntrega: '',
  });

  const [formCierre, setFormCierre] = useState({
    horaFinTurno: '18:00',
    observacionesEntrega: '',
  });

  const [formActividad, setFormActividad] = useState({
    horaInicio: '09:00',
    horaFin: '10:00',
    tipoActividad: 'Soporte Remoto',
    titulo: '',
    descripcion: '',
    solucion: '',
    estado: 'COMPLETADA',
    folioTicketExterno: '',
    requiereSeguimientoLunes: false,
    detalleSeguimiento: '',
  });

  // Queries
  const { data: guardias = [], isLoading: cargandoGuardias } = useQuery<Guardia[]>({
    queryKey: ['guardias-lista'],
    queryFn: () => apiFetch<Guardia[]>('/api/guardias'),
  });

  const { data: guardiaActiva, isLoading: cargandoDetalle } = useQuery<Guardia>({
    queryKey: ['guardia-detalle', guardiaSeleccionadaId],
    queryFn: () => apiFetch<Guardia>(`/api/guardias/${guardiaSeleccionadaId}`),
    enabled: !!guardiaSeleccionadaId,
  });

  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades'),
  });

  // Mutaciones
  const crearGuardiaMutation = useMutation({
    mutationFn: (data: typeof formGuardia) =>
      apiFetch<Guardia>('/api/guardias', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (nueva) => {
      queryClient.invalidateQueries({ queryKey: ['guardias-lista'] });
      setModalNuevaGuardia(false);
      setGuardiaSeleccionadaId(nueva.id);
    },
    onError: (err: any) => setErrorMsg(err.message || 'Error al iniciar guardia.'),
  });

  const cerrarGuardiaMutation = useMutation({
    mutationFn: (data: typeof formCierre) =>
      apiFetch<Guardia>(`/api/guardias/${guardiaSeleccionadaId}/cerrar`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias-lista'] });
      queryClient.invalidateQueries({ queryKey: ['guardia-detalle', guardiaSeleccionadaId] });
      setModalCerrarGuardia(false);
    },
  });

  const guardarActividadMutation = useMutation({
    mutationFn: (data: typeof formActividad) => {
      if (actividadEditar) {
        return apiFetch(`/api/guardias/${guardiaSeleccionadaId}/actividades/${actividadEditar.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
      return apiFetch(`/api/guardias/${guardiaSeleccionadaId}/actividades`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardia-detalle', guardiaSeleccionadaId] });
      queryClient.invalidateQueries({ queryKey: ['guardias-lista'] });
      setModalActividad(false);
      setActividadEditar(null);
    },
    onError: (err: any) => setErrorMsg(err.message || 'Error al guardar actividad.'),
  });

  const eliminarActividadMutation = useMutation({
    mutationFn: (actId: number) =>
      apiFetch(`/api/guardias/${guardiaSeleccionadaId}/actividades/${actId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardia-detalle', guardiaSeleccionadaId] });
      queryClient.invalidateQueries({ queryKey: ['guardias-lista'] });
    },
  });

  // Helpers
  const abrirModalNuevaActividad = () => {
    setActividadEditar(null);
    setErrorMsg(null);
    setFormActividad({
      horaInicio: '09:00',
      horaFin: '10:00',
      tipoActividad: 'Soporte Remoto',
      titulo: '',
      descripcion: '',
      solucion: '',
      estado: 'COMPLETADA',
      folioTicketExterno: '',
      requiereSeguimientoLunes: false,
      detalleSeguimiento: '',
    });
    setModalActividad(true);
  };

  const abrirModalEditarActividad = (act: GuardiaActividad) => {
    setActividadEditar(act);
    setErrorMsg(null);
    setFormActividad({
      horaInicio: act.horaInicio.substring(0, 5),
      horaFin: act.horaFin.substring(0, 5),
      tipoActividad: act.tipoActividad,
      titulo: act.titulo,
      descripcion: act.descripcion,
      solucion: act.solucion || '',
      estado: act.estado,
      folioTicketExterno: act.folioTicket || '',
      requiereSeguimientoLunes: act.requiereSeguimientoLunes,
      detalleSeguimiento: act.detalleSeguimiento || '',
    });
    setModalActividad(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* VISTA 1: LISTADO DE GUARDIAS (NIVEL MAESTRO) */}
      {!guardiaSeleccionadaId ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Guardias de Sistemas
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Registra tu turno de fin de semana y accede a él para capturar las actividades del día.
              </p>
            </div>

            <button
              onClick={() => {
                setErrorMsg(null);
                setModalNuevaGuardia(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Iniciar Guardia
            </button>
          </div>

          {/* Grid de Guardias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cargandoGuardias ? (
              <p className="text-slate-400 text-sm">Cargando turnos de guardia...</p>
            ) : guardias.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-700 dark:text-slate-300 font-medium">No hay guardias registradas.</p>
                <p className="text-xs text-slate-500 mt-1">Inicia tu guardia para comenzar a cargar actividades.</p>
              </div>
            ) : (
              guardias.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setGuardiaSeleccionadaId(g.id)}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-sm cursor-pointer transition-all hover:shadow-md space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded">
                      {g.folio}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        g.estado === 'ABIERTA'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {g.estado}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold text-base">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{g.diaSemana}, {g.fecha}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Responsable: <strong className="text-slate-700 dark:text-slate-300">{g.usuarioNombre}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">
                      Actividades: <strong className="text-slate-800 dark:text-slate-200">{g.totalActividades}</strong>
                    </span>

                    {g.tienePendientesLunes && (
                      <span className="text-amber-500 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Traspaso Lunes
                      </span>
                    )}

                    <span className="text-blue-500 font-semibold flex items-center gap-0.5">
                      Ver <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* VISTA 2: DETALLE DE LA GUARDIA (ACTIVIDADES DEL DÍA) */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setGuardiaSeleccionadaId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-500 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al listado de Guardias
            </button>

            {guardiaActiva?.estado === 'ABIERTA' && (
              <button
                onClick={() => setModalCerrarGuardia(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Guardia / Entregar Turno
              </button>
            )}
          </div>

          {/* Banner de Cabecera de la Guardia */}
          {guardiaActiva && (
            <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {guardiaActiva.folio}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    {guardiaActiva.estado}
                  </span>
                </div>
                <h2 className="text-lg md:text-xl font-bold mt-1.5">
                  Turno de {guardiaActiva.diaSemana} - {guardiaActiva.fecha}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Atendido por <strong>{guardiaActiva.usuarioNombre}</strong> ({guardiaActiva.unidadNombre})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Total Actividades</p>
                  <p className="text-xl font-bold text-white">{guardiaActiva.actividades?.length || 0}</p>
                </div>
                <button
                  onClick={abrirModalNuevaActividad}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Actividad
                </button>
              </div>
            </div>
          )}

          {/* Listado de Actividades del Día */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Actividades Atendidas Durante la Guardia
            </h3>

            {guardiaActiva?.actividades?.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Aún no has registrado ninguna actividad en esta guardia.</p>
              </div>
            ) : (
              guardiaActiva?.actividades?.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        {act.tipoActividad}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {act.horaInicio.substring(0, 5)} - {act.horaFin.substring(0, 5)} ({act.duracionMinutos} min)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => abrirModalEditarActividad(act)}
                        className="p-1 text-slate-400 hover:text-blue-500"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminarActividadMutation.mutate(act.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{act.titulo}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{act.descripcion}</p>

                  {act.solucion && (
                    <div className="p-2.5 rounded bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300">
                      <strong>Acción / Solución:</strong> {act.solucion}
                    </div>
                  )}

                  {act.requiereSeguimientoLunes && (
                    <div className="p-2.5 rounded bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong>Traspaso para el Lunes:</strong> {act.detalleSeguimiento || 'Seguimiento requerido.'}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL INICIAR GUARDIA */}
      {modalNuevaGuardia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Iniciar Turno de Guardia</h3>
              <button onClick={() => setModalNuevaGuardia(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="p-2 text-xs bg-red-500/10 text-red-500 rounded">{errorMsg}</p>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Fecha de la Guardia</label>
                <input
                  type="date"
                  value={formGuardia.fecha}
                  onChange={(e) => setFormGuardia({ ...formGuardia, fecha: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Unidad Operativa</label>
                <select
                  value={formGuardia.unidadId}
                  onChange={(e) => setFormGuardia({ ...formGuardia, unidadId: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formGuardia.esGuardiaExtraordinaria}
                  onChange={(e) => setFormGuardia({ ...formGuardia, esGuardiaExtraordinaria: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Guardia Extraordinaria / Feriado (Permite entre semana)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setModalNuevaGuardia(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => crearGuardiaMutation.mutate(formGuardia)}
                disabled={crearGuardiaMutation.isPending}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                {crearGuardiaMutation.isPending ? 'Creando...' : 'Iniciar Turno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR / EDITAR ACTIVIDAD */}
      {modalActividad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {actividadEditar ? 'Editar Actividad' : 'Registrar Actividad del Día'}
              </h3>
              <button onClick={() => setModalActividad(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <p className="p-2 text-xs bg-red-500/10 text-red-500 rounded">{errorMsg}</p>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={formActividad.horaInicio}
                    onChange={(e) => setFormActividad({ ...formActividad, horaInicio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={formActividad.horaFin}
                    onChange={(e) => setFormActividad({ ...formActividad, horaFin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Tipo de Atención</label>
                <select
                  value={formActividad.tipoActividad}
                  onChange={(e) => setFormActividad({ ...formActividad, tipoActividad: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  {TIPOS_ACTIVIDAD.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Título de la Actividad *</label>
                <input
                  type="text"
                  placeholder="Ej. Reseteo de servicio de base de datos"
                  value={formActividad.titulo}
                  onChange={(e) => setFormActividad({ ...formActividad, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Descripción de  la actividad*</label>
                <textarea
                  rows={2}
                  placeholder="Detalles del reporte o problema..."
                  value={formActividad.descripcion}
                  onChange={(e) => setFormActividad({ ...formActividad, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Solución Aplicada</label>
                <textarea
                  rows={2}
                  placeholder="Acciones correctivas..."
                  value={formActividad.solucion}
                  onChange={(e) => setFormActividad({ ...formActividad, solucion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActividad.requiereSeguimientoLunes}
                    onChange={(e) => setFormActividad({ ...formActividad, requiereSeguimientoLunes: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Requiere seguimiento el Lunes (Traspaso al equipo)
                  </span>
                </label>

                {formActividad.requiereSeguimientoLunes && (
                  <textarea
                    rows={2}
                    placeholder="Indica qué tarea debe realizar el equipo regular el lunes..."
                    value={formActividad.detalleSeguimiento}
                    onChange={(e) => setFormActividad({ ...formActividad, detalleSeguimiento: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setModalActividad(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => guardarActividadMutation.mutate(formActividad)}
                disabled={guardarActividadMutation.isPending}
                className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                {guardarActividadMutation.isPending ? 'Guardando...' : 'Guardar Actividad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CERRAR GUARDIA */}
      {modalCerrarGuardia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Cerrar y Entregar Guardia</h3>
            <p className="text-xs text-slate-500">
              Al cerrar la guardia, el turno quedará marcado como concluido con las observaciones finales.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Hora Fin del Turno</label>
                <input
                  type="time"
                  value={formCierre.horaFinTurno}
                  onChange={(e) => setFormCierre({ ...formCierre, horaFinTurno: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Observaciones Finales / Novedades</label>
                <textarea
                  rows={3}
                  placeholder="Novedades para el equipo regular, llamadas pendientes, incidencias no resueltas..."
                  value={formCierre.observacionesEntrega}
                  onChange={(e) => setFormCierre({ ...formCierre, observacionesEntrega: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setModalCerrarGuardia(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => cerrarGuardiaMutation.mutate(formCierre)}
                disabled={cerrarGuardiaMutation.isPending}
                className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded font-medium"
              >
                {cerrarGuardiaMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};