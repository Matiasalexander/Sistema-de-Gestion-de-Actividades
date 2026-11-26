import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Calendar,
  Clock,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Info,
  Server,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  ActividadGuardiaItem,
  GuardarActividadGuardiaPayload,
  ResumenGuardiasData,
  UnidadItem,
} from '../../services/api';

const TIPOS_ACTIVIDAD = [
  'Soporte Remoto',
  'Incidencia Crítica',
  'Mantenimiento Preventivo',
  'Pase a Producción',
  'Monitoreo de Infraestructura',
  'Atención a Usuarios VIP',
  'Otro',
];

const SISTEMAS_COMUNES = [
  'ERP / Sistema de Gestión',
  'Redes y Conectividad',
  'Servidores / Virtualización',
  'Base de Datos SQL Server',
  'Correo / Telefonía VoIP',
  'Acceso Remoto / VPN',
  'Impresoras y Terminales',
  'Otro',
];

export const GuardiasPage: React.FC = () => {
  const { usuario, unidadActivaId } = useAuth();
  const queryClient = useQueryClient();

  // Estados de Filtro
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [soloPendientesLunes, setSoloPendientesLunes] = useState(false);

  // Estados de Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDetalle, setModalDetalle] = useState<ActividadGuardiaItem | null>(null);
  const [actividadEditar, setActividadEditar] = useState<ActividadGuardiaItem | null>(null);
  const [modalEliminar, setModalEliminar] = useState<ActividadGuardiaItem | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Formulario
  const [form, setForm] = useState<GuardarActividadGuardiaPayload>({
    unidadId: unidadActivaId || 1,
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFin: '10:00',
    tipoActividad: 'Soporte Remoto',
    sistemaAfectado: 'ERP / Sistema de Gestión',
    titulo: '',
    descripcion: '',
    solucion: '',
    estado: 'COMPLETADA',
    ticketRelacionadoId: undefined,
    folioTicketExterno: '',
    requiereSeguimientoLunes: false,
    detalleSeguimiento: '',
    esGuardiaExtraordinaria: false,
  });

  // Queries
  const { data: actividades = [], isLoading } = useQuery<ActividadGuardiaItem[]>({
    queryKey: ['guardias', filtroTipo, soloPendientesLunes, busqueda],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipoActividad', filtroTipo);
      if (soloPendientesLunes) params.append('soloPendientesLunes', 'true');
      if (busqueda) params.append('busqueda', busqueda);
      return apiFetch<ActividadGuardiaItem[]>(`/api/guardias?${params.toString()}`);
    },
  });

  const { data: resumen } = useQuery<ResumenGuardiasData>({
    queryKey: ['guardias-resumen'],
    queryFn: () => apiFetch<ResumenGuardiasData>('/api/guardias/resumen'),
  });

  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades'),
  });

  // Mutaciones
  const guardarMutation = useMutation({
    mutationFn: (payload: GuardarActividadGuardiaPayload) => {
      if (actividadEditar) {
        return apiFetch<ActividadGuardiaItem>(`/api/guardias/${actividadEditar.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }
      return apiFetch<ActividadGuardiaItem>('/api/guardias', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
      queryClient.invalidateQueries({ queryKey: ['guardias-resumen'] });
      cerrarModal();
    },
    onError: (err: any) => {
      setErrorForm(err.message || 'Error al guardar la actividad de guardia.');
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/api/guardias/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardias'] });
      queryClient.invalidateQueries({ queryKey: ['guardias-resumen'] });
      setModalEliminar(null);
    },
  });

  // Manejo de Modal
  const abrirModalNuevo = () => {
    setActividadEditar(null);
    setErrorForm(null);
    setForm({
      unidadId: unidadActivaId || (unidades[0]?.id ?? 1),
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '09:00',
      horaFin: '10:00',
      tipoActividad: 'Soporte Remoto',
      sistemaAfectado: 'ERP / Sistema de Gestión',
      titulo: '',
      descripcion: '',
      solucion: '',
      estado: 'COMPLETADA',
      ticketRelacionadoId: undefined,
      folioTicketExterno: '',
      requiereSeguimientoLunes: false,
      detalleSeguimiento: '',
      esGuardiaExtraordinaria: false,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (item: ActividadGuardiaItem) => {
    setActividadEditar(item);
    setErrorForm(null);
    setForm({
      unidadId: item.unidadId,
      fecha: item.fecha,
      horaInicio: item.horaInicio.substring(0, 5),
      horaFin: item.horaFin.substring(0, 5),
      tipoActividad: item.tipoActividad,
      sistemaAfectado: item.sistemaAfectado,
      titulo: item.titulo,
      descripcion: item.descripcion,
      solucion: item.solucion || '',
      estado: item.estado,
      ticketRelacionadoId: item.ticketRelacionadoId,
      folioTicketExterno: item.folioTicket || '',
      requiereSeguimientoLunes: item.requiereSeguimientoLunes,
      detalleSeguimiento: item.detalleSeguimiento || '',
      esGuardiaExtraordinaria: item.esGuardiaExtraordinaria,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadEditar(null);
    setErrorForm(null);
  };

  // Validación de fin de semana
  const diaSeleccionado = useMemo(() => {
    if (!form.fecha) return '';
    const [y, m, d] = form.fecha.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    if (day === 0) return 'Domingo';
    if (day === 6) return 'Sábado';
    return 'Día Laboral Regular';
  }, [form.fecha]);

  const esFinDeSemana = diaSeleccionado === 'Sábado' || diaSeleccionado === 'Domingo';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!esFinDeSemana && !form.esGuardiaExtraordinaria) {
      setErrorForm('La guardia debe registrarse en Sábado o Domingo, o marca la casilla de Guardia Extraordinaria.');
      return;
    }
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setErrorForm('El título y la descripción son obligatorios.');
      return;
    }
    setErrorForm(null);
    guardarMutation.mutate(form);
  };

  const actividadesFiltradas = useMemo(() => {
    return actividades.filter((act) => {
      if (filtroEstado && act.estado !== filtroEstado) return false;
      return true;
    });
  }, [actividades, filtroEstado]);

  const formatearHoras = (minutos: number) => {
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Guardias de Sistemas
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Fines de Semana
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bitácora de atenciones e incidencias operativas atendidas fuera de horario regular por el equipo de TI.
          </p>
        </div>

        <button
          onClick={abrirModalNuevo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Guardia
        </button>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Actividades</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {resumen?.totalActividades ?? actividades.length}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tiempo Invertido</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {formatearHoras(resumen?.totalMinutosInvertidos ?? 0)}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sábado / Domingo</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Sáb: {resumen?.actividadesSabado ?? 0}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                Dom: {resumen?.actividadesDomingo ?? 0}
              </span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pendientes Traspaso Lunes</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {resumen?.totalPendientesLunes ?? 0}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por folio, título, sistema..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos los Tipos de Atención</option>
            {TIPOS_ACTIVIDAD.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">Todos los Estados</option>
            <option value="COMPLETADA">Completada</option>
            <option value="EN_PROGRESO">En Progreso</option>
            <option value="PENDIENTE">Pendiente</option>
          </select>

          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs md:text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={soloPendientesLunes}
              onChange={(e) => setSoloPendientesLunes(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span>Solo pendientes de Lunes</span>
          </label>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Cargando registros de guardia...
          </div>
        ) : actividadesFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No hay actividades de guardia registradas.
            </p>
            <p className="text-xs text-slate-500">
              Registra una nueva atención usando el botón superior.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Folio</th>
                  <th className="p-3.5 font-semibold">Día / Fecha</th>
                  <th className="p-3.5 font-semibold">Horario</th>
                  <th className="p-3.5 font-semibold">Sistema / Título</th>
                  <th className="p-3.5 font-semibold">Atendido Por</th>
                  <th className="p-3.5 font-semibold">Estado</th>
                  <th className="p-3.5 font-semibold">Lunes</th>
                  <th className="p-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {actividadesFiltradas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {item.folio}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium border ${
                            item.diaSemana === 'Sábado'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : item.diaSemana === 'Domingo'
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {item.diaSemana}
                        </span>
                        <span className="text-xs text-slate-500">{item.fecha}</span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {item.horaInicio.substring(0, 5)} - {item.horaFin.substring(0, 5)}
                        </span>
                        <span className="text-slate-400 ml-1.5">({item.duracionMinutos} min)</span>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.titulo}
                      </div>
                      <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {item.sistemaAfectado}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {item.usuarioNombre}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                        {item.unidadNombre}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          item.estado === 'COMPLETADA'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : item.estado === 'EN_PROGRESO'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {item.estado}
                      </span>
                    </td>

                    <td className="p-3.5">
                      {item.requiereSeguimientoLunes ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          Traspaso
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setModalDetalle(item)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          title="Ver detalle"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirModalEditar(item)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-blue-500 hover:text-blue-700"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModalEliminar(item)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 hover:text-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {actividadEditar ? 'Editar Actividad de Guardia' : 'Registrar Actividad de Guardia'}
                </h3>
              </div>
              <button
                onClick={cerrarModal}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorForm && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              {/* Fecha y Día */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de la Guardia *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Día: <strong className={esFinDeSemana ? 'text-blue-500' : 'text-amber-500'}>{diaSeleccionado}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unidad Operativa *
                  </label>
                  <select
                    value={form.unidadId}
                    onChange={(e) => setForm({ ...form, unidadId: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {unidades.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Casilla de Guardia Extraordinaria */}
              {!esFinDeSemana && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.esGuardiaExtraordinaria}
                      onChange={(e) => setForm({ ...form, esGuardiaExtraordinaria: e.target.checked })}
                      className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      Esta es una <strong>Guardia Extraordinaria / Feriado</strong> (Permitir registro entre semana).
                    </span>
                  </label>
                </div>
              )}

              {/* Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.horaInicio}
                    onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.horaFin}
                    onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Sistema y Tipo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sistema o Infraestructura Afectada *
                  </label>
                  <select
                    value={form.sistemaAfectado}
                    onChange={(e) => setForm({ ...form, sistemaAfectado: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {SISTEMAS_COMUNES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Atención *
                  </label>
                  <select
                    value={form.tipoActividad}
                    onChange={(e) => setForm({ ...form, tipoActividad: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {TIPOS_ACTIVIDAD.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título Breve de la Guardia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Caída de servicio VPN en sucursal Norte"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del Incidente / Tarea *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalla el problema reportado, usuarios afectados y diagnóstico inicial..."
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Solución */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Acción Realizada / Solución
                </label>
                <textarea
                  rows={2}
                  placeholder="Acciones correctivas aplicadas, reinicio de servicios, parches..."
                  value={form.solucion}
                  onChange={(e) => setForm({ ...form, solucion: e.target.value })}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Estado y Ticket */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de la Tarea *
                  </label>
                  <select
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="COMPLETADA">Completada</option>
                    <option value="EN_PROGRESO">En Progreso</option>
                    <option value="PENDIENTE">Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ticket Relacionado / Folio Externo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. TCK-1045 o GLPI-8821"
                    value={form.folioTicketExterno}
                    onChange={(e) => setForm({ ...form, folioTicketExterno: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Traspaso Lunes */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiereSeguimientoLunes}
                    onChange={(e) => setForm({ ...form, requiereSeguimientoLunes: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Requiere seguimiento o traspaso el Lunes al equipo de Sistemas</span>
                </label>

                {form.requiereSeguimientoLunes && (
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Indica qué tarea debe realizar el equipo regular el lunes (ej. validar respaldo físico, cambiar disco, contactar al proveedor)..."
                      value={form.detalleSeguimiento}
                      onChange={(e) => setForm({ ...form, detalleSeguimiento: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardarMutation.isPending}
                  className="px-4 py-2 text-xs md:text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
                >
                  {guardarMutation.isPending ? 'Guardando...' : actividadEditar ? 'Actualizar Guardia' : 'Registrar Guardia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded">
                  {modalDetalle.folio}
                </span>
                <span className="text-xs text-slate-500">
                  {modalDetalle.diaSemana}, {modalDetalle.fecha}
                </span>
              </div>
              <button onClick={() => setModalDetalle(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs md:text-sm">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{modalDetalle.titulo}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sistema: {modalDetalle.sistemaAfectado} | Tipo: {modalDetalle.tipoActividad}</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg space-y-1">
                <p className="text-xs font-semibold text-slate-500">Descripción:</p>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{modalDetalle.descripcion}</p>
              </div>

              {modalDetalle.solucion && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-emerald-600">Solución Aplicada:</p>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{modalDetalle.solucion}</p>
                </div>
              )}

              {modalDetalle.requiereSeguimientoLunes && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
                  <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Traspaso para Lunes:
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">{modalDetalle.detalleSeguimiento || 'Sin detalle adicional'}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>Atendió: <strong className="text-slate-700 dark:text-slate-300">{modalDetalle.usuarioNombre}</strong></div>
                <div>Horario: <strong className="text-slate-700 dark:text-slate-300">{modalDetalle.horaInicio} - {modalDetalle.horaFin}</strong></div>
                <div>Unidad: <strong className="text-slate-700 dark:text-slate-300">{modalDetalle.unidadNombre}</strong></div>
                <div>Estado: <strong className="text-slate-700 dark:text-slate-300">{modalDetalle.estado}</strong></div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setModalDetalle(null)}
                className="px-4 py-2 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Eliminar Guardia</h4>
            </div>
            <p className="text-xs text-slate-500">
              ¿Estás seguro de eliminar el registro de guardia <strong>{modalEliminar.folio}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalEliminar(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarMutation.mutate(modalEliminar.id)}
                disabled={eliminarMutation.isPending}
                className="px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};