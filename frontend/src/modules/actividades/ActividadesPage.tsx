import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Copy,
  CheckSquare,
  GitBranch,
  Clock,
  MessageSquare,
  History,
  AlertTriangle,
  X,
  MessageSquareText,
  Send,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  ActividadItem,
  apiFetch,
  CatalogosOperativos,
  ComentarioItem,
  ProyectoItem,
  UnidadItem,
  UsuarioLista,
  ChatMensajeItem,
  ChatGrupoItem,
  OpcionInteractiva,
} from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const ActividadesPage: React.FC = () => {
  const { unidadActivaId, tienePermiso, usuario } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [busqueda, setBusqueda] = useState('');
  const [proyectoFiltro, setProyectoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [soloMias, setSoloMias] = useState(false);
  const [modalNueva, setModalNueva] = useState(false);
  const [actividadActiva, setActividadActiva] = useState<ActividadItem | null>(null);
  const [modalEliminarActividad, setModalEliminarActividad] = useState(false);
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null);

  // Formulario nueva actividad
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [proyectoId, setProyectoId] = useState<number | undefined>(undefined);
  const [unidadId, setUnidadId] = useState<number>(unidadActivaId || 1);
  const [prioridadId, setPrioridadId] = useState<number>(2);
  const [estadoActividadId, setEstadoActividadId] = useState<number>(1);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  );
  const [tiempoEstimadoMinutos, setTiempoEstimadoMinutos] = useState<number>(120);
  const [responsablesIds, setResponsablesIds] = useState<number[]>([]);
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [patronRecurrencia, setPatronRecurrencia] = useState('SEMANAL');

  // Panel detalle inputs
  const [nuevoChecklistTitulo, setNuevoChecklistTitulo] = useState('');
  const [predecesoraId, setPredecesoraId] = useState<string>('');
  const [minutosTrabajo, setMinutosTrabajo] = useState<number>(60);
  const [descTrabajo, setDescTrabajo] = useState('');
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoMensajeChat, setNuevoMensajeChat] = useState('');

  const { data: actividades = [], isLoading } = useQuery<ActividadItem[]>({
    queryKey: ['actividades', unidadActivaId, proyectoFiltro, estadoFiltro, soloMias, busqueda],
    queryFn: () => {
      const p = new URLSearchParams();
      if (unidadActivaId) p.set('unidadId', String(unidadActivaId));
      if (proyectoFiltro) p.set('proyectoId', proyectoFiltro);
      if (estadoFiltro) p.set('estadoId', estadoFiltro);
      if (soloMias) p.set('soloMias', 'true');
      if (busqueda) p.set('busqueda', busqueda);
      const qs = p.toString();
      return apiFetch<ActividadItem[]>(`/api/actividades${qs ? `?${qs}` : ''}`);
    },
  });

  const { data: catalogos } = useQuery<CatalogosOperativos>({
    queryKey: ['catalogos'],
    queryFn: () => apiFetch<CatalogosOperativos>('/api/catalogos'),
  });

  const { data: proyectos = [] } = useQuery<ProyectoItem[]>({
    queryKey: ['proyectos', unidadActivaId],
    queryFn: () =>
      apiFetch<ProyectoItem[]>(
        `/api/proyectos${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
      ),
  });

  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades'),
  });

  const { data: directorio = [] } = useQuery<UsuarioLista[]>({
    queryKey: ['directorio'],
    queryFn: () => apiFetch<UsuarioLista[]>('/api/usuarios/directorio'),
  });

  const { data: comentarios = [] } = useQuery<ComentarioItem[]>({
    queryKey: ['comentarios-actividad', actividadActiva?.id],
    queryFn: () => apiFetch<ComentarioItem[]>(`/api/actividades/${actividadActiva!.id}/comentarios`),
    enabled: !!actividadActiva,
  });

  const { data: mensajesChat = [] } = useQuery<ChatMensajeItem[]>({
    queryKey: ['chat-actividad-mensajes', actividadActiva?.id],
    queryFn: () => apiFetch<ChatMensajeItem[]>(`/api/chat/actividades/${actividadActiva!.id}/mensajes`),
    enabled: !!actividadActiva,
    refetchInterval: 5000,
  });

  const refrescarActividadActiva = async (id: number) => {
    const actualizada = await apiFetch<ActividadItem>(`/api/actividades/${id}`);
    setActividadActiva(actualizada);
    queryClient.invalidateQueries({ queryKey: ['actividades'] });
    queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const eliminarActividadMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/actividades/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setActividadActiva(null);
      setModalEliminarActividad(false);
      setErrorNegocio(null);
    },
    onError: (err: Error) => {
      setErrorNegocio(err.message);
    },
  });

  const crearActividadMutation = useMutation({
    mutationFn: () =>
      apiFetch<ActividadItem>('/api/actividades', {
        method: 'POST',
        body: JSON.stringify({
          proyectoId: proyectoId || null,
          faseProyectoId: null,
          actividadPadreId: null,
          unidadId,
          departamentoId: null,
          equipoId: null,
          titulo,
          descripcion,
          prioridadId,
          estadoActividadId,
          fechaInicio,
          fechaVencimiento,
          tiempoEstimadoMinutos,
          porcentajeAvance: 0,
          esRecurrente,
          patronRecurrencia: esRecurrente ? patronRecurrencia : null,
          responsablesIds: responsablesIds.length > 0 ? responsablesIds : [usuario?.id || 1],
          responsablePrincipalId: responsablesIds[0] || usuario?.id || 1,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setModalNueva(false);
    },
    onError: (err: any) => setErrorNegocio(err.message),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: ({ id, nuevoEstadoId }: { id: number; nuevoEstadoId: number }) =>
      apiFetch<ActividadItem>(`/api/actividades/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({
          nuevoEstadoActividadId: nuevoEstadoId,
          comentario: 'Cambio de estado desde tabla de trabajo',
        }),
      }),
    onSuccess: (data) => {
      setErrorNegocio(null);
      if (actividadActiva?.id === data.id) setActividadActiva(data);
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
    onError: (err: any) => setErrorNegocio(err.message),
  });

  const duplicarMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch<ActividadItem>(`/api/actividades/${id}/duplicar`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
    },
  });

  const agregarChecklistMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/actividades/${actividadActiva!.id}/checklists`, {
        method: 'POST',
        body: JSON.stringify({ titulo: nuevoChecklistTitulo }),
      }),
    onSuccess: () => {
      setNuevoChecklistTitulo('');
      refrescarActividadActiva(actividadActiva!.id);
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/api/actividades/${actividadActiva!.id}/checklists/${itemId}/toggle`, {
        method: 'PATCH',
      }),
    onSuccess: () => refrescarActividadActiva(actividadActiva!.id),
  });

  const agregarDependenciaMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/actividades/${actividadActiva!.id}/dependencias`, {
        method: 'POST',
        body: JSON.stringify({
          actividadPredecesoraId: Number(predecesoraId),
          tipoDependencia: 'FS',
        }),
      }),
    onSuccess: () => {
      setPredecesoraId('');
      setErrorNegocio(null);
      refrescarActividadActiva(actividadActiva!.id);
    },
    onError: (err: any) => setErrorNegocio(err.message),
  });

  const registrarTiempoMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/actividades/${actividadActiva!.id}/tiempos`, {
        method: 'POST',
        body: JSON.stringify({
          minutosTrabajados: minutosTrabajo,
          fechaTrabajo: new Date().toISOString().slice(0, 10),
          descripcion: descTrabajo,
        }),
      }),
    onSuccess: () => {
      setDescTrabajo('');
      refrescarActividadActiva(actividadActiva!.id);
    },
  });

  const crearComentarioMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/actividades/${actividadActiva!.id}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ contenido: nuevoComentario, esInterno: false }),
      }),
    onSuccess: () => {
      setNuevoComentario('');
      queryClient.invalidateQueries({ queryKey: ['comentarios-actividad', actividadActiva?.id] });
    },
  });

  const enviarMensajeChatMutation = useMutation({
    mutationFn: (texto: string) => {
      if (!actividadActiva?.chatGrupoId) throw new Error('No hay grupo de chat vinculado');
      return apiFetch(`/api/chat/grupos/${actividadActiva.chatGrupoId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify({ texto }),
      });
    },
    onSuccess: () => {
      setNuevoMensajeChat('');
      queryClient.invalidateQueries({ queryKey: ['chat-actividad-mensajes', actividadActiva?.id] });
      refrescarActividadActiva(actividadActiva!.id);
    },
  });

  const iniciarChatMutation = useMutation({
    mutationFn: () =>
      apiFetch<ChatGrupoItem>(`/api/chat/actividades/${actividadActiva!.id}/iniciar-chat`, {
        method: 'POST',
      }),
    onSuccess: () => {
      refrescarActividadActiva(actividadActiva!.id);
    },
  });

  const enviarPreguntaResolucionMutation = useMutation({
    mutationFn: () => {
      if (!actividadActiva?.chatGrupoId) throw new Error('No hay grupo de chat vinculado');
      return apiFetch(`/api/chat/grupos/${actividadActiva.chatGrupoId}/enviar-pregunta-resolucion`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-actividad-mensajes', actividadActiva?.id] });
    },
  });

  const responderOpcionChatMutation = useMutation({
    mutationFn: ({ mensajeId, opcionId }: { mensajeId: number; opcionId: string }) => {
      if (!actividadActiva?.chatGrupoId) throw new Error('No hay grupo de chat vinculado');
      return apiFetch(
        `/api/chat/grupos/${actividadActiva.chatGrupoId}/mensajes/${mensajeId}/responder-opcion`,
        {
          method: 'POST',
          body: JSON.stringify({ opcionId }),
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-actividad-mensajes', actividadActiva?.id] });
      refrescarActividadActiva(actividadActiva!.id);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Actividades (Work OS)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vista de tabla interactiva con edición de estado en línea, checklists, dependencias y control de tiempo.
          </p>
        </div>

        {tienePermiso('actividades.crear') && (
          <button
            onClick={() => {
              setTitulo('');
              setDescripcion('');
              setUnidadId(unidadActivaId || unidades[0]?.id || 1);
              setProyectoId(proyectos[0]?.id);
              setResponsablesIds(usuario ? [usuario.id] : []);
              setModalNueva(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nueva Actividad
          </button>
        )}
      </div>

      {errorNegocio && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorNegocio}
          </span>
          <button onClick={() => setErrorNegocio(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código o título de actividad..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>

        <select
          value={proyectoFiltro}
          onChange={(e) => setProyectoFiltro(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <option value="">Todos los proyectos</option>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codigo} · {p.nombre}
            </option>
          ))}
        </select>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <option value="">Todos los estados</option>
          {catalogos?.estadosActividad.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer font-medium">
          <input
            type="checkbox"
            checked={soloMias}
            onChange={(e) => setSoloMias(e.target.checked)}
          />
          Solo mis actividades
        </label>
      </div>

      {/* Tabla estilo Monday.com */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="py-3 px-4">Actividad</th>
                <th className="py-3 px-4">Proyecto / Unidad</th>
                <th className="py-3 px-4">Responsables</th>
                <th className="py-3 px-4">Prioridad</th>
                <th className="py-3 px-4">Estado (Editable)</th>
                <th className="py-3 px-4">Cronograma</th>
                <th className="py-3 px-4">Avance</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Cargando actividades...
                  </td>
                </tr>
              ) : (
                actividades.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td
                      onClick={() => setActividadActiva(a)}
                      className="py-3 px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {a.codigo}
                        </span>
                        {a.estaVencida && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                            VENCIDA
                          </span>
                        )}
                        {a.ticketsVinculadosFolios.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-semibold"
                          >
                            🎫 {f}
                          </span>
                        ))}
                        {a.chatGrupoId && (
                          <span
                            className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1"
                            title={`Chat WhatsApp vinculado: ${a.chatGrupoNombre || ''}`}
                          >
                            💬 WhatsApp
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {a.titulo}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>☑ {a.checklistCompletados}/{a.totalChecklist} checklist</span>
                        <span>⏱ {(a.tiempoTrabajadoMinutos / 60).toFixed(1)}h registradas</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium truncate max-w-[180px]">
                        {a.proyectoNombre || 'Actividad Independiente'}
                      </div>
                      <div className="text-[11px] text-slate-400">{a.unidadNombre}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {a.asignados.map((asig) => (
                          <span
                            key={asig.usuarioId}
                            className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium"
                          >
                            {asig.nombreCompleto.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={a.prioridadNombre} colorHex={a.prioridadColor} />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        aria-label={`Cambiar estado de ${a.codigo}`}
                        value={a.estadoActividadId}
                        onChange={(e) =>
                          cambiarEstadoMutation.mutate({
                            id: a.id,
                            nuevoEstadoId: Number(e.target.value),
                          })
                        }
                        style={{
                          backgroundColor: `${a.estadoColor}20`,
                          color: a.estadoColor,
                          borderColor: `${a.estadoColor}50`,
                        }}
                        className="px-2.5 py-1 rounded-full border font-semibold text-xs cursor-pointer focus:outline-none"
                      >
                        {catalogos?.estadosActividad.map((est) => (
                          <option
                            key={est.id}
                            value={est.id}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            {est.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{a.fechaInicio || '-'}</div>
                      <div className={a.estaVencida ? 'text-red-600 font-bold' : ''}>
                        → {a.fechaVencimiento || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-4 w-32">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span>{a.porcentajeAvance}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, a.porcentajeAvance)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => setActividadActiva(a)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Detalle
                      </button>
                      {tienePermiso('actividades.crear') && (
                        <button
                          onClick={() => duplicarMutation.mutate(a.id)}
                          title="Duplicar actividad"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                      {tienePermiso('actividades.eliminar') && (
                        <button
                          onClick={() => {
                            setActividadActiva(a);
                            setModalEliminarActividad(true);
                          }}
                          title="Eliminar o archivar actividad"
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PANEL LATERAL DE DETALLE DE ACTIVIDAD */}
      {actividadActiva && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">{actividadActiva.codigo}</span>
                  <StatusBadge
                    label={actividadActiva.estadoNombre}
                    colorHex={actividadActiva.estadoColor}
                  />
                  <StatusBadge
                    label={actividadActiva.prioridadNombre}
                    colorHex={actividadActiva.prioridadColor}
                  />
                </div>
                <h2 className="text-lg font-bold mt-1">{actividadActiva.titulo}</h2>
                <p className="text-xs text-slate-500 mt-1">{actividadActiva.descripcion}</p>
              </div>
              <div className="flex items-center gap-2">
                {tienePermiso('actividades.eliminar') && (
                  <button
                    onClick={() => setModalEliminarActividad(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                )}
                <button
                  onClick={() => setActividadActiva(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SEGUIMIENTO EN VIVO POR CHAT WHATSAPP */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    💬
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      Seguimiento en Vivo vía Chat WhatsApp
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Sincronizado
                      </span>
                    </h3>
                    {actividadActiva.chatGrupoNombre && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Grupo: <strong>{actividadActiva.chatGrupoNombre}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {actividadActiva.chatGrupoId ? (
                    <>
                      <button
                        onClick={() => enviarPreguntaResolucionMutation.mutate()}
                        disabled={enviarPreguntaResolucionMutation.isPending}
                        title="Enviar pregunta interactiva de resolución al cliente"
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>¿Quedó Resuelto?</span>
                      </button>
                      <button
                        onClick={() => navigate('/chat')}
                        title="Abrir en pantalla completa de Chat"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ir al Chat</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => iniciarChatMutation.mutate()}
                      disabled={iniciarChatMutation.isPending}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <span>🚀 Iniciar Canal WhatsApp</span>
                    </button>
                  )}
                </div>
              </div>

              {actividadActiva.chatGrupoId ? (
                <div className="space-y-2.5">
                  {/* Timeline de mensajes de la actividad */}
                  <div className="max-h-56 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    {mensajesChat.length === 0 ? (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        Aún no hay mensajes en este chat. Escribe abajo para enviar el primer mensaje.
                      </div>
                    ) : (
                      mensajesChat.map((m) => {
                        if (m.tipoMensaje === 'Sistema') {
                          return (
                            <div key={m.id} className="text-center text-[10px] text-slate-400 py-1">
                              ⚙️ {m.texto}
                            </div>
                          );
                        }

                        if (m.tipoMensaje === 'PreguntaInteractiva') {
                          let opciones: OpcionInteractiva[] = [];
                          try {
                            if (m.opcionesInteractivasJson) opciones = JSON.parse(m.opcionesInteractivasJson);
                          } catch {}

                          return (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2"
                            >
                              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-bold text-[11px]">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>{m.texto}</span>
                              </div>
                              {m.opcionSeleccionada ? (
                                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                                  ✅ Respondido: {m.opcionSeleccionada} por {m.respondidoPorNombre}
                                </div>
                              ) : (
                                <div className="flex gap-2 pt-1">
                                  {opciones.map((opc) => (
                                    <button
                                      key={opc.id}
                                      onClick={() =>
                                        responderOpcionChatMutation.mutate({
                                          mensajeId: m.id,
                                          opcionId: opc.id,
                                        })
                                      }
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold cursor-pointer shadow-2xs"
                                    >
                                      {opc.texto}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={m.id}
                            className={`p-2 rounded-xl text-xs max-w-[90%] ${
                              m.esMio
                                ? 'ml-auto bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="font-bold text-[10px] text-emerald-700 dark:text-emerald-400">
                              {m.nombreCompleto}
                            </div>
                            <p className="mt-0.5">{m.texto}</p>
                            <div className="text-[9px] text-slate-400 text-right mt-0.5">
                              {new Date(m.fechaCreacionUtc).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input rápido para responder directamente al WhatsApp de la actividad */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nuevoMensajeChat}
                      onChange={(e) => setNuevoMensajeChat(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && nuevoMensajeChat.trim()) {
                          e.preventDefault();
                          enviarMensajeChatMutation.mutate(nuevoMensajeChat.trim());
                        }
                      }}
                      placeholder="Escribir mensaje en el chat WhatsApp..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                    <button
                      onClick={() =>
                        nuevoMensajeChat.trim() &&
                        enviarMensajeChatMutation.mutate(nuevoMensajeChat.trim())
                      }
                      disabled={!nuevoMensajeChat.trim() || enviarMensajeChatMutation.isPending}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 text-xs cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 py-1">
                  Esta actividad aún no tiene un grupo de WhatsApp asociado. Haz clic en "Iniciar Canal
                  WhatsApp" para habilitar el seguimiento conversacional y la resolución interactiva.
                </div>
              )}
            </div>

            {/* Checklists interactivos */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-600" /> Checklist de Ejecución (
                {actividadActiva.checklistCompletados}/{actividadActiva.totalChecklist})
              </h3>
              <div className="space-y-1.5">
                {actividadActiva.checklists.map((chk) => (
                  <label
                    key={chk.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={chk.completado}
                      onChange={() => toggleChecklistMutation.mutate(chk.id)}
                    />
                    <span className={chk.completado ? 'line-through text-slate-400' : 'font-medium'}>
                      {chk.titulo}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  value={nuevoChecklistTitulo}
                  onChange={(e) => setNuevoChecklistTitulo(e.target.value)}
                  placeholder="Agregar ítem al checklist..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <button
                  onClick={() => nuevoChecklistTitulo && agregarChecklistMutation.mutate()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Dependencias (con validación anticiclos) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-blue-600" /> Dependencias Predecesoras
              </h3>
              <div className="space-y-1.5">
                {actividadActiva.dependencias.map((dep) => (
                  <div
                    key={dep.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <span>
                      <strong>{dep.predecesoraCodigo}</strong> · {dep.predecesoraTitulo}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-semibold">
                      {dep.predecesoraEstado}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <select
                  value={predecesoraId}
                  onChange={(e) => setPredecesoraId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Seleccionar actividad predecesora...</option>
                  {actividades
                    .filter((x) => x.id !== actividadActiva.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.codigo} · {x.titulo}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => predecesoraId && agregarDependenciaMutation.mutate()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                >
                  Vincular
                </button>
              </div>
            </div>

            {/* Registro de Tiempo Trabajado */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" /> Registro de Tiempo Trabajado (
                {actividadActiva.tiempoTrabajadoMinutos} min / Est: {actividadActiva.tiempoEstimadoMinutos} min)
              </h3>
              <div className="space-y-1.5">
                {actividadActiva.tiempos.map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex justify-between text-xs"
                  >
                    <span>
                      <strong>{t.usuarioNombre}</strong>: {t.descripcion || 'Trabajo operativo'}
                    </span>
                    <span className="font-bold text-blue-600">{t.minutosTrabajados} min</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  type="number"
                  value={minutosTrabajo}
                  onChange={(e) => setMinutosTrabajo(Number(e.target.value))}
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  placeholder="Minutos"
                />
                <input
                  value={descTrabajo}
                  onChange={(e) => setDescTrabajo(e.target.value)}
                  placeholder="Descripción del trabajo realizado..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <button
                  onClick={() => registrarTiempoMutation.mutate()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </div>

            {/* Comentarios */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Comentarios ({comentarios.length})
              </h3>
              <div className="space-y-2">
                {comentarios.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>{c.autorNombre}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.fechaCreacionUtc).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1">{c.contenido}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribir comentario o mencionar @usuario..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <button
                  onClick={() => nuevoComentario && crearComentarioMutation.mutate()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                >
                  Enviar
                </button>
              </div>
            </div>

            {/* Historial de Cambios */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> Historial de Auditoría de la Actividad
              </h3>
              <div className="space-y-1.5 text-xs">
                {actividadActiva.historial.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between"
                  >
                    <div>
                      <span className="font-semibold">{h.tipoCambio}: </span>
                      <span>{h.detalle}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(h.fechaCambioUtc).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA ACTIVIDAD */}
      {modalNueva && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold">Registrar Nueva Actividad</h3>
            <div>
              <label className="block font-semibold mb-1">Título de la Actividad</label>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Descripción Técnica</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block font-semibold mb-1">Proyecto Asociado (Opcional)</label>
                <select
                  value={proyectoId ?? ''}
                  onChange={(e) => setProyectoId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Actividad Independiente</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} · {p.nombre}
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
                <label className="block font-semibold mb-1">Tiempo Estimado (Min)</label>
                <input
                  type="number"
                  value={tiempoEstimadoMinutos}
                  onChange={(e) => setTiempoEstimadoMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fecha Vencimiento</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={esRecurrente}
                  onChange={(e) => setEsRecurrente(e.target.checked)}
                />
                <span>Actividad Recurrente</span>
              </label>
              {esRecurrente && (
                <select
                  value={patronRecurrencia}
                  onChange={(e) => setPatronRecurrencia(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="DIARIA">Diaria</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setModalNueva(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => crearActividadMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Guardar Actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE ACTIVIDAD */}
      {modalEliminarActividad && actividadActiva && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar actividad?
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Está a punto de archivar/eliminar la actividad{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {actividadActiva.codigo}: {actividadActiva.titulo}
                </strong>
                .
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Esta acción removerá la actividad del tablero activo y conservará la trazabilidad en la bitácora de auditoría. Si está vinculada a un chat de WhatsApp, se desvinculará automáticamente.
              </p>
            </div>
            {errorNegocio && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                {errorNegocio}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalEliminarActividad(false)}
                disabled={eliminarActividadMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarActividadMutation.mutate(actividadActiva.id)}
                disabled={eliminarActividadMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5"
              >
                {eliminarActividadMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
