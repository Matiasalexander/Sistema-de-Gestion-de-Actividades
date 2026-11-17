import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  Plus,
  Search,
  ShieldAlert,
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  Link2,
  Lock,
  MessageSquare,
  History,
  X,
  ArrowRight, 
  ArrowLeft,
  Check,
  Building2,
  FileText,
  Tag,
  Users
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  CatalogosOperativos,
  TicketItem,
  UnidadItem,
  UsuarioLista,
} from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const TicketsPage: React.FC = () => {
  const { unidadActivaId, tienePermiso, usuario } = useAuth();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [slaFiltro, setSlaFiltro] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [ticketActivo, setTicketActivo] = useState<TicketItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulario nuevo ticket
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ticketTipoId, setTicketTipoId] = useState<number>(1);
  const [ticketCategoriaId, setTicketCategoriaId] = useState<number>(1);
  const [prioridadId, setPrioridadId] = useState<number>(3);
  const [unidadId, setUnidadId] = useState<number>(unidadActivaId || 1);
  const [responsableId, setResponsableId] = useState<number | undefined>(undefined);

  //estado para los pasos del panel
  const [pasoNuevoTicket, setPasoNuevoTicket] = useState<1 | 2 | 3>(1);
  const abrirModalNuevoTicket = () => {
    setPasoNuevoTicket(1)
    setTitulo('');
    setDescripcion('');
    setTicketTipoId(catalogos?.tiposTicket[0]?.id || 1);
    setTicketCategoriaId(catalogos?.categoriasTicket[0]?.id ||1);
    const prioridadDefecto = catalogos?.prioridades.find((p)=>p.codigo === 'MEDIA') || catalogos?.prioridades[1];
    setPrioridadId(prioridadDefecto?.id || 2);
    setUnidadId(unidadActivaId || unidades[0]?.id || 1);
    setResponsableId(undefined);
    setErrorMsg(null);
    setModalNuevo(true);
  };

  const resetearModalNuevoTicket = () => {
    setModalNuevo(false);
    setPasoNuevoTicket(1);
    setTitulo('');
    setDescripcion('');
    setResponsableId(undefined);
    setErrorMsg(null);
  };
  // Panel detalle inputs
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [nuevaActividadTitulo, setNuevaActividadTitulo] = useState('');

  const { data: tickets = [], isLoading } = useQuery<TicketItem[]>({
    queryKey: ['tickets', unidadActivaId, estadoFiltro, slaFiltro, busqueda],
    queryFn: () => {
      const p = new URLSearchParams();
      if (unidadActivaId) p.set('unidadId', String(unidadActivaId));
      if (estadoFiltro) p.set('estadoId', estadoFiltro);
      if (slaFiltro) p.set('estadoSla', slaFiltro);
      if (busqueda) p.set('busqueda', busqueda);
      const qs = p.toString();
      return apiFetch<TicketItem[]>(`/api/tickets${qs ? `?${qs}` : ''}`);
    },
  });

  const { data: catalogos } = useQuery<CatalogosOperativos>({
    queryKey: ['catalogos'],
    queryFn: () => apiFetch<CatalogosOperativos>('/api/catalogos'),
  });

  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades'),
  });

  const { data: directorio = [] } = useQuery<UsuarioLista[]>({
    queryKey: ['directorio'],
    queryFn: () => apiFetch<UsuarioLista[]>('/api/usuarios/directorio'),
  });

  const refrescarTicketActivo = async (id: number) => {
    const actualizado = await apiFetch<TicketItem>(`/api/tickets/${id}`);
    setTicketActivo(actualizado);
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const crearTicketMutation = useMutation({
    mutationFn: () =>
      apiFetch<TicketItem>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({
          titulo,
          descripcion,
          ticketTipoId,
          ticketCategoriaId,
          prioridadId,
          unidadId,
          departamentoId: null,
          equipoAsignadoId: null,
          responsableId: responsableId || null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setModalNuevo(false);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const accionEstadoMutation = useMutation({
    mutationFn: ({
      accion,
      comentario,
    }: {
      accion: 'atender' | 'espera' | 'resolver' | 'cerrar' | 'reabrir';
      comentario?: string;
    }) =>
      apiFetch<TicketItem>(`/api/tickets/${ticketActivo!.id}/${accion}`, {
        method: 'POST',
        body: JSON.stringify({
          comentario: comentario || `Acción ejecutada: ${accion}`,
          esInterno: false,
        }),
      }),
    onSuccess: (data) => {
      setErrorMsg(null);
      setTicketActivo(data);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const asignarMutation = useMutation({
    mutationFn: (nuevoRespId: number) =>
      apiFetch<TicketItem>(`/api/tickets/${ticketActivo!.id}/asignar`, {
        method: 'POST',
        body: JSON.stringify({
          responsableId: nuevoRespId,
          equipoAsignadoId: null,
          notaAsignacion: 'Asignación directa desde mesa de ayuda',
        }),
      }),
    onSuccess: (data) => {
      setTicketActivo(data);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const generarActividadMutation = useMutation({
    mutationFn: () =>
      apiFetch<TicketItem>(`/api/tickets/${ticketActivo!.id}/vincular-actividad`, {
        method: 'POST',
        body: JSON.stringify({
          actividadExistenteId: null,
          nuevaActividad: {
            proyectoId: null,
            faseProyectoId: null,
            actividadPadreId: null,
            unidadId: ticketActivo!.unidadId,
            departamentoId: null,
            equipoId: null,
            titulo: nuevaActividadTitulo,
            descripcion: `Actividad técnica generada desde el ticket ${ticketActivo!.folio}`,
            prioridadId: ticketActivo!.prioridadId,
            estadoActividadId: 3, // En progreso
            fechaInicio: new Date().toISOString().slice(0, 10),
            fechaVencimiento: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
            tiempoEstimadoMinutos: 120,
            porcentajeAvance: 20,
            esRecurrente: false,
            patronRecurrencia: null,
            responsablesIds: [ticketActivo!.responsableId || usuario?.id || 1],
            responsablePrincipalId: ticketActivo!.responsableId || usuario?.id || 1,
          },
        }),
      }),
    onSuccess: (data) => {
      setNuevaActividadTitulo('');
      setTicketActivo(data);
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const agregarComentarioMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/tickets/${ticketActivo!.id}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({
          contenido: comentarioTexto,
          esInterno,
        }),
      }),
    onSuccess: () => {
      setComentarioTexto('');
      refrescarTicketActivo(ticketActivo!.id);
    },
  });

  const colorSla = (estado: string) => {
    switch (estado) {
      case 'Cumplido':
        return '#10B981';
      case 'EnTiempo':
        return '#3B82F6';
      case 'ProximoAVencer':
        return '#F59E0B';
      case 'Incumplido':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mesa de Ayuda y Gestión de Tickets (Service Desk)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Atención de incidentes, requerimientos y cambios con control SLA, notas internas y actividades técnicas vinculadas.
          </p>
        </div>

        {tienePermiso('tickets.crear') && (
          <button
            onClick={() => {
              setTitulo('');
              setDescripcion('');
              setUnidadId(unidadActivaId || unidades[0]?.id || 1);
              setModalNuevo(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Levantar Ticket
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 text-xs font-medium flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}>✕</button>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por folio (ej. TKT-2026-0001), título o descripción..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <option value="">Todos los estados</option>
          {catalogos?.estadosTicket.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>

        <select
          value={slaFiltro}
          onChange={(e) => setSlaFiltro(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <option value="">Todos los estados SLA</option>
          <option value="EnTiempo">En Tiempo</option>
          <option value="ProximoAVencer">Próximo a vencer</option>
          <option value="Incumplido">SLA Incumplido</option>
          <option value="Cumplido">SLA Cumplido</option>
        </select>
      </div>

      {/* Tabla de Tickets */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3 px-4">Folio / Solicitud</th>
                <th className="py-3 px-4">Tipo / Categoría</th>
                <th className="py-3 px-4">Unidad / Solicitante</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Acuerdo SLA</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Cargando mesa de ayuda...
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setTicketActivo(t)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {t.folio}
                        </span>
                        {t.escalado && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> ESCALADO
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {t.titulo}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Creado: {new Date(t.fechaCreacionUtc).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{t.tipoNombre}</div>
                      <div className="text-[11px] text-slate-400">{t.categoriaNombre}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{t.unidadNombre}</div>
                      <div className="text-[11px] text-slate-400">Por: {t.solicitanteNombre}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={t.prioridadNombre} colorHex={t.prioridadColor} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={t.estadoNombre} colorHex={t.estadoColor} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={t.estadoSla} colorHex={colorSla(t.estadoSla)} />
                      {t.minutosPausadoSla > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          ⏸ {t.minutosPausadoSla}m en pausa
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">
                        {t.responsableNombre || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100">
                        Gestionar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL LATERAL DE GESTIÓN DE TICKET */}
      {ticketActivo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">{ticketActivo.folio}</span>
                  <StatusBadge label={ticketActivo.estadoNombre} colorHex={ticketActivo.estadoColor} />
                  <StatusBadge
                    label={`SLA: ${ticketActivo.estadoSla}`}
                    colorHex={colorSla(ticketActivo.estadoSla)}
                  />
                </div>
                <h2 className="text-lg font-bold mt-1">{ticketActivo.titulo}</h2>
                <p className="text-xs text-slate-500 mt-1">{ticketActivo.descripcion}</p>
              </div>
              <button
                onClick={() => setTicketActivo(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Botonera de Flujo de Estados y Asignación */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">Flujo de Atención del Ticket:</span>
                <div className="flex flex-wrap gap-1.5">
                  {tienePermiso('tickets.atender') && (
                    <>
                      <button
                        onClick={() => accionEstadoMutation.mutate({ accion: 'atender' })}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> En Atención
                      </button>
                      <button
                        onClick={() => accionEstadoMutation.mutate({ accion: 'espera' })}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pausar (Espera)
                      </button>
                    </>
                  )}
                  {tienePermiso('tickets.resolver') && (
                    <button
                      onClick={() => accionEstadoMutation.mutate({ accion: 'resolver' })}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
                    </button>
                  )}
                  {tienePermiso('tickets.cerrar') && ticketActivo.estadoCodigo === 'RESUELTO' && (
                    <button
                      onClick={() => accionEstadoMutation.mutate({ accion: 'cerrar' })}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-semibold cursor-pointer"
                    >
                      Cerrar Ticket
                    </button>
                  )}
                  {tienePermiso('tickets.reabrir') &&
                    (ticketActivo.estadoCodigo === 'RESUELTO' ||
                      ticketActivo.estadoCodigo === 'CERRADO') && (
                      <button
                        onClick={() => accionEstadoMutation.mutate({ accion: 'reabrir' })}
                        className="px-3 py-1.5 rounded-xl bg-pink-600 text-white font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                      </button>
                    )}
                </div>
              </div>

              {tienePermiso('tickets.asignar') && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold">Especialista asignado:</span>
                  <select
                    value={ticketActivo.responsableId ?? ''}
                    onChange={(e) =>
                      e.target.value && asignarMutation.mutate(Number(e.target.value))
                    }
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="">Sin asignar</option>
                    {directorio.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombreCompleto}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Actividades Técnicas Relacionadas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-blue-600" /> Actividades Técnicas Derivadas (
                {ticketActivo.actividadesRelacionadas.length})
              </h3>
              <div className="space-y-1.5">
                {ticketActivo.actividadesRelacionadas.map((act) => (
                  <div
                    key={act.actividadId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-blue-600">{act.codigo}</span> ·{' '}
                      <span className="font-semibold">{act.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={act.estadoNombre} colorHex={act.estadoColor} />
                      <span className="font-bold">{act.porcentajeAvance}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {tienePermiso('tickets.atender') && (
                <div className="flex gap-2 text-xs">
                  <input
                    value={nuevaActividadTitulo}
                    onChange={(e) => setNuevaActividadTitulo(e.target.value)}
                    placeholder="Generar nueva actividad técnica para este ticket..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <button
                    onClick={() => nuevaActividadTitulo && generarActividadMutation.mutate()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Generar Actividad
                  </button>
                </div>
              )}
            </div>

            {/* Comentarios Públicos vs Notas Internas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Seguimiento y Notas Técnicas (
                {ticketActivo.comentarios.length})
              </h3>
              <div className="space-y-2">
                {ticketActivo.comentarios.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl text-xs border ${
                      c.esInterno
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        {c.autorNombre}
                        {c.esInterno && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> NOTA TÉCNICA INTERNA
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.fechaCreacionUtc).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1">{c.contenido}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-xs">
                <textarea
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value)}
                  rows={2}
                  placeholder="Escribir respuesta al solicitante o nota técnica interna..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <div className="flex items-center justify-between">
                  {tienePermiso('tickets.atender') ? (
                    <label className="flex items-center gap-2 font-medium text-amber-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esInterno}
                        onChange={(e) => setEsInterno(e.target.checked)}
                      />
                      Marcar como Nota Interna (Oculta al solicitante)
                    </label>
                  ) : (
                    <span />
                  )}
                  <button
                    onClick={() => comentarioTexto && agregarComentarioMutation.mutate()}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Registrar Seguimiento
                  </button>
                </div>
              </div>
            </div>

            {/* Historial Cronológico */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> Trazabilidad Cronológica del Ticket
              </h3>
              <div className="space-y-1.5 text-xs">
                {ticketActivo.historial.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between"
                  >
                    <div>
                      <span className="font-bold text-blue-600">{h.accion}: </span>
                      <span>{h.detalle}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.fechaEventoUtc).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LEVANTAR TICKET */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" /> Levantar Ticket en Mesa de Ayuda
            </h3>
            <div>
              <label className="block font-semibold mb-1">Asunto / Título del Ticket</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Resumen claro del incidente o requerimiento..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Descripción Detallada</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Tipo de Ticket</label>
                <select
                  value={ticketTipoId}
                  onChange={(e) => setTicketTipoId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {catalogos?.tiposTicket.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <select
                  value={ticketCategoriaId}
                  onChange={(e) => setTicketCategoriaId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {catalogos?.categoriasTicket.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Prioridad</label>
                <select
                  value={prioridadId}
                  onChange={(e) => setPrioridadId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {catalogos?.prioridades.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Unidad de Negocio</label>
                <select
                  value={unidadId}
                  onChange={(e) => setUnidadId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Asignar Especialista (Opcional)</label>
              <select
                value={responsableId ?? ''}
                onChange={(e) => setResponsableId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="">Asignación por Mesa de Ayuda</option>
                {directorio.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombreCompleto}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setModalNuevo(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => crearTicketMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Registrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
