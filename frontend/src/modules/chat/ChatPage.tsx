import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as signalR from '@microsoft/signalr';
import {
  Search,
  Plus,
  Send,
  Users,
  CheckCheck,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  UserPlus,
  Trash2,
  X,
  Building2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  ChatGrupoItem,
  ChatMensajeItem,
  ChatMiembroItem,
  OpcionInteractiva,
  UnidadItem,
  UsuarioLista,
  tokenStorage,
} from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const ChatPage: React.FC = () => {
  const { usuario, unidadActivaId, tienePermiso } = useAuth();
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionadoId, setGrupoSeleccionadoId] = useState<number | null>(null);
  const [textoMensaje, setTextoMensaje] = useState('');
  const [modalNuevoGrupo, setModalNuevoGrupo] = useState(false);
  const [modalMiembros, setModalMiembros] = useState(false);

  // Formulario nuevo grupo (Asistente en 3 pasos)
  const [pasoNuevoGrupo, setPasoNuevoGrupo] = useState<1 | 2 | 3>(1);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaUnidadId, setNuevaUnidadId] = useState<number>(unidadActivaId || 1);
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState<number[]>([]);
  const [busquedaIntegrantes, setBusquedaIntegrantes] = useState('');

  const abrirModalNuevoGrupo = () => {
    setPasoNuevoGrupo(1);
    setNuevoNombre('');
    setNuevaDescripcion('');
    setNuevaUnidadId(unidadActivaId || unidades[0]?.id || 1);
    setMiembrosSeleccionados([]);
    setBusquedaIntegrantes('');
    setModalNuevoGrupo(true);
  };

  const resetearModalNuevoGrupo = () => {
    setModalNuevoGrupo(false);
    setPasoNuevoGrupo(1);
    setNuevoNombre('');
    setNuevaDescripcion('');
    setMiembrosSeleccionados([]);
    setBusquedaIntegrantes('');
  };

  // Miembros a agregar en grupo existente
  const [usuariosParaAgregar, setUsuariosParaAgregar] = useState<number[]>([]);

  const mensajesEndRef = useRef<HTMLDivElement>(null);

  // Cargar grupos de chat
  const { data: grupos = [], isLoading: cargandoGrupos } = useQuery<ChatGrupoItem[]>({
    queryKey: ['chat-grupos', unidadActivaId],
    queryFn: () => {
      const q = unidadActivaId ? `?unidadId=${unidadActivaId}` : '';
      return apiFetch<ChatGrupoItem[]>(`/api/chat/grupos${q}`);
    },
  });

  // Si no hay seleccionado, seleccionar el primero por defecto
  useEffect(() => {
    if (grupos.length > 0 && !grupoSeleccionadoId) {
      setGrupoSeleccionadoId(grupos[0].id);
    }
  }, [grupos, grupoSeleccionadoId]);

  // Cargar grupo activo detalle
  const { data: grupoActivo } = useQuery<ChatGrupoItem>({
    queryKey: ['chat-grupo-detalle', grupoSeleccionadoId],
    queryFn: () => apiFetch<ChatGrupoItem>(`/api/chat/grupos/${grupoSeleccionadoId}`),
    enabled: !!grupoSeleccionadoId,
  });

  // Cargar mensajes del grupo seleccionado
  const { data: mensajes = [] } = useQuery<ChatMensajeItem[]>({
    queryKey: ['chat-mensajes', grupoSeleccionadoId],
    queryFn: () => apiFetch<ChatMensajeItem[]>(`/api/chat/grupos/${grupoSeleccionadoId}/mensajes`),
    enabled: !!grupoSeleccionadoId,
    refetchInterval: 5000, // polling suave como fallback adicional
  });

  // Cargar unidades y directorio para selects
  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades'),
  });

  const unidadDirectorioId = modalNuevoGrupo ? nuevaUnidadId : unidadActivaId;
  const { data: directorio = [], isLoading: cargandoDirectorio } = useQuery<UsuarioLista[]>({
    queryKey: ['directorio', unidadDirectorioId],
    queryFn: () => {
      const q = unidadDirectorioId ? `?unidadId=${unidadDirectorioId}` : '';
      return apiFetch<UsuarioLista[]>(`/api/usuarios/directorio${q}`);
    },
  });

  // Auto scroll al último mensaje
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  // SignalR en tiempo real para mensajes y grupos
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/notificaciones', {
        accessTokenFactory: () => tokenStorage.getAccess() || '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('NuevoMensajeChat', (nuevoMsg: ChatMensajeItem) => {
      if (nuevoMsg.chatGrupoId === grupoSeleccionadoId) {
        queryClient.setQueryData<ChatMensajeItem[]>(
          ['chat-mensajes', grupoSeleccionadoId],
          (prev = []) => {
            if (prev.some((m) => m.id === nuevoMsg.id)) return prev;
            return [...prev, nuevoMsg];
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', nuevoMsg.chatGrupoId] });
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
    });

    connection.on('GrupoChatActualizado', (payload: { grupoId: number }) => {
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', payload.grupoId] });
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
    });

    connection.start().catch(() => {});

    return () => {
      connection.stop();
    };
  }, [grupoSeleccionadoId, queryClient]);

  // Mutación: Enviar mensaje (texto común)
  const enviarMensajeMutation = useMutation({
    mutationFn: (texto: string) =>
      apiFetch<ChatMensajeItem>(`/api/chat/grupos/${grupoSeleccionadoId}/mensajes`, {
        method: 'POST',
        body: JSON.stringify({ texto }),
      }),
    onSuccess: (nuevoMsg) => {
      setTextoMensaje('');
      queryClient.setQueryData<ChatMensajeItem[]>(
        ['chat-mensajes', grupoSeleccionadoId],
        (prev = []) => [...prev, nuevoMsg]
      );
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', grupoSeleccionadoId] });
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
    },
  });

  // Mutación: Enviar pregunta interactiva de resolución
  const enviarResolucionMutation = useMutation({
    mutationFn: () =>
      apiFetch<ChatMensajeItem>(
        `/api/chat/grupos/${grupoSeleccionadoId}/enviar-pregunta-resolucion`,
        { method: 'POST' }
      ),
    onSuccess: (nuevoMsg) => {
      queryClient.setQueryData<ChatMensajeItem[]>(
        ['chat-mensajes', grupoSeleccionadoId],
        (prev = []) => [...prev, nuevoMsg]
      );
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', grupoSeleccionadoId] });
    },
  });

  // Mutación: Responder opción interactiva
  const responderOpcionMutation = useMutation({
    mutationFn: ({ mensajeId, opcionId }: { mensajeId: number; opcionId: string }) =>
      apiFetch<ChatMensajeItem>(
        `/api/chat/grupos/${grupoSeleccionadoId}/mensajes/${mensajeId}/responder-opcion`,
        {
          method: 'POST',
          body: JSON.stringify({ opcionId }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-mensajes', grupoSeleccionadoId] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', grupoSeleccionadoId] });
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
    },
  });

  // Mutación: Crear grupo
  const crearGrupoMutation = useMutation({
    mutationFn: () =>
      apiFetch<ChatGrupoItem>('/api/chat/grupos', {
        method: 'POST',
        body: JSON.stringify({
          nombre: nuevoNombre.trim(),
          descripcion: nuevaDescripcion.trim() || undefined,
          unidadId: nuevaUnidadId,
          miembrosIds: miembrosSeleccionados,
        }),
      }),
    onSuccess: (nuevoGrupo) => {
      resetearModalNuevoGrupo();
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      setGrupoSeleccionadoId(nuevoGrupo.id);
    },
  });

  // Mutación: Agregar miembros
  const agregarMiembrosMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/chat/grupos/${grupoSeleccionadoId}/miembros`, {
        method: 'POST',
        body: JSON.stringify({ usuariosIds: usuariosParaAgregar }),
      }),
    onSuccess: () => {
      setUsuariosParaAgregar([]);
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', grupoSeleccionadoId] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
    },
  });

  // Mutación: Remover miembro
  const removerMiembroMutation = useMutation({
    mutationFn: (usuarioId: number) =>
      apiFetch(`/api/chat/grupos/${grupoSeleccionadoId}/miembros/${usuarioId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-grupo-detalle', grupoSeleccionadoId] });
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
    },
  });

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoMensaje.trim() || !grupoSeleccionadoId) return;
    enviarMensajeMutation.mutate(textoMensaje.trim());
  };

  const gruposFiltrados = grupos.filter(
    (g) =>
      g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.actividadActivaCodigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.actividadActivaTitulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.unidadNombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const esAdmin =
    usuario?.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'LIDER') ||
    tienePermiso('chat.crear') ||
    usuario?.accesoGlobalUnidades;

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col -m-4 lg:-m-6 bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL IZQUIERDO: LISTA DE GRUPOS WHATSAPP */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          {/* Cabecera del panel izquierdo */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                GA
              </div>
              <div>
                <h1 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  Chats
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    En línea
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Grupos y seguimiento de actividades
                </p>
              </div>
            </div>

            {esAdmin && (
              <button
                onClick={abrirModalNuevoGrupo}
                title="Crear nuevo grupo de chat"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Grupo</span>
              </button>
            )}
          </div>

          {/* Barra de búsqueda */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar grupo o código de actividad..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Lista de grupos */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {cargandoGrupos ? (
              <div className="p-6 text-center text-xs text-slate-400">Cargando grupos de chat...</div>
            ) : gruposFiltrados.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>No se encontraron grupos disponibles.</p>
                {esAdmin && (
                  <button
                    onClick={abrirModalNuevoGrupo}
                    className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                  >
                    Crear el primer grupo de chat
                  </button>
                )}
              </div>
            ) : (
              gruposFiltrados.map((grupo) => {
                const activo = grupo.id === grupoSeleccionadoId;
                const iniciales = grupo.nombre.substring(0, 2).toUpperCase();

                return (
                  <div
                    key={grupo.id}
                    onClick={() => setGrupoSeleccionadoId(grupo.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      activo
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-emerald-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Avatar grupo */}
                    <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 relative">
                      {iniciales}
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute -bottom-0.5 -right-0.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {grupo.nombre}
                        </h3>
                        {grupo.ultimoMensajeFechaUtc && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {new Date(grupo.ultimoMensajeFechaUtc).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {/* Snippet de último mensaje */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mb-1">
                        {grupo.ultimoMensaje || 'Sin mensajes aún'}
                      </p>

                      {/* Chip de Actividad Vinculada */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {grupo.actividadActivaCodigo ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                            <span>📌 {grupo.actividadActivaCodigo}</span>
                            {grupo.actividadActivaEstado && (
                              <span className="text-[9px] font-normal opacity-90">
                                · {grupo.actividadActivaEstado}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Sin actividad pendiente
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 ml-auto">
                          <Users className="w-3 h-3 inline" />
                          {grupo.totalMiembros}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL DERECHO: SALA DE CHAT WHATSAPP */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 relative">
          {grupoActivo ? (
            <>
              {/* Cabecera superior del chat */}
              <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {grupoActivo.nombre.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {grupoActivo.nombre}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {grupoActivo.unidadNombre}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {grupoActivo.miembros.map((m) => m.nombreCompleto.split(' ')[0]).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Tarjeta de actividad activa en la cabecera */}
                  {grupoActivo.actividadActivaCodigo ? (
                    <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs">
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {grupoActivo.actividadActivaCodigo}:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {grupoActivo.actividadActivaTitulo}
                      </span>
                      {grupoActivo.actividadActivaEstado && (
                        <StatusBadge
                          label={grupoActivo.actividadActivaEstado}
                          colorHex={grupoActivo.actividadActivaEstadoColor || '#3b82f6'}
                        />
                      )}
                    </div>
                  ) : null}

                  {/* Botón para solicitar resolución interactiva */}
                  <button
                    onClick={() => enviarResolucionMutation.mutate()}
                    disabled={enviarResolucionMutation.isPending}
                    title="Enviar pregunta interactiva al cliente para confirmar si la actividad quedó resuelta"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">¿Quedó Resuelto?</span>
                  </button>

                  {/* Botón gestionar miembros */}
                  <button
                    onClick={() => setModalMiembros(true)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Gestionar participantes del grupo"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TIMELINE DE MENSAJES (ESTILO WHATSAPP) */}
              <div
                className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
              >
                {mensajes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      ¡Inicia la conversación en este grupo!
                    </p>
                    <p className="text-[11px] max-w-sm text-center">
                      Cualquier mensaje que envíes creará o dará seguimiento a una actividad en el
                      sistema de gestión.
                    </p>
                  </div>
                ) : (
                  mensajes.map((msg) => {
                    const esSistema = msg.tipoMensaje === 'Sistema';
                    const esPregunta = msg.tipoMensaje === 'PreguntaInteractiva';
                    const esRespuesta = msg.tipoMensaje === 'RespuestaInteractiva';

                    if (esSistema) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="px-3.5 py-1 rounded-full bg-slate-200/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[11px] font-medium shadow-2xs max-w-lg text-center">
                            ⚙️ {msg.texto}
                          </div>
                        </div>
                      );
                    }

                    if (esPregunta) {
                      let opciones: OpcionInteractiva[] = [];
                      try {
                        if (msg.opcionesInteractivasJson) {
                          opciones = JSON.parse(msg.opcionesInteractivasJson);
                        }
                      } catch {}

                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/50 shadow-md p-4 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <HelpCircle className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Pregunta Interactiva de Seguimiento
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(msg.fechaCreacionUtc).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mt-1">
                                  {msg.texto}
                                </p>
                                {msg.actividadCodigo && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    Vinculado a la actividad <strong>{msg.actividadCodigo}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Opciones interactivas */}
                            {msg.opcionSeleccionada ? (
                              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Respondido: {msg.opcionSeleccionada}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Por {msg.respondidoPorNombre} ·{' '}
                                  {msg.fechaRespuestaUtc &&
                                    new Date(msg.fechaRespuestaUtc).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  Selecciona una opción para avanzar o cerrar la actividad:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {opciones.map((opc) => {
                                    const esResolver = opc.accion === 'resolver';
                                    return (
                                      <button
                                        key={opc.id}
                                        onClick={() =>
                                          responderOpcionMutation.mutate({
                                            mensajeId: msg.id,
                                            opcionId: opc.id,
                                          })
                                        }
                                        disabled={responderOpcionMutation.isPending}
                                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                                          esResolver
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                        }`}
                                      >
                                        <span>{opc.texto}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Mensaje común (burbuja WhatsApp)
                    const esMio = msg.esMio;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs relative text-xs ${
                            esMio
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-slate-900 dark:text-emerald-50 rounded-tr-xs border border-emerald-200/60 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {/* Nombre del remitente (si no es mío) */}
                          {!esMio && (
                            <div className="font-bold text-[11px] text-emerald-700 dark:text-emerald-400 mb-1">
                              {msg.nombreCompleto}
                            </div>
                          )}

                          {/* Contenido del mensaje */}
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.texto}</p>

                          {/* Pie con hora, código de actividad y checkmarks */}
                          <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {msg.actividadCodigo && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-700/60 font-mono text-[9px]">
                                {msg.actividadCodigo}
                              </span>
                            )}
                            <span>
                              {new Date(msg.fechaCreacionUtc).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {esMio && <CheckCheck className="w-3.5 h-3.5 text-emerald-600 inline" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={mensajesEndRef} />
              </div>

              {/* BARRA INFERIOR DE ENTRADA (INPUT WHATSAPP) */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleEnviar} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textoMensaje}
                    onChange={(e) => setTextoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje... (creará o dará seguimiento a la actividad activa)"
                    className="flex-1 px-4 py-2.5 text-xs rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!textoMensaje.trim() || enviarMensajeMutation.isPending}
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">
                Módulo de Chat WhatsApp Corporativo GA
              </h2>
              <p className="max-w-md text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                Selecciona un grupo del panel izquierdo o crea un nuevo grupo para interactuar con tus
                equipos y clientes con seguimiento automático de actividades y resolución interactiva.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: NUEVO GRUPO DE CHAT (ASISTENTE EN 3 PASOS) */}
      {modalNuevoGrupo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs shadow-2xl transition-all">
            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Crear Nuevo Grupo de WhatsApp
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Asistente de configuración en 3 pasos
                  </p>
                </div>
              </div>
              <button
                onClick={resetearModalNuevoGrupo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Visual (Indicador de Progreso en 3 Pasos) */}
            <div className="grid grid-cols-3 gap-2 py-1">
              {/* Paso 1: Info */}
              <div
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  pasoNuevoGrupo === 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : pasoNuevoGrupo > 1
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    pasoNuevoGrupo > 1
                      ? 'bg-emerald-600 text-white'
                      : pasoNuevoGrupo === 1
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {pasoNuevoGrupo > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold leading-tight">1. Datos</div>
                  <div className="text-[9px] opacity-75 truncate">Nombre y fin</div>
                </div>
              </div>

              {/* Paso 2: Unidad */}
              <div
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  pasoNuevoGrupo === 2
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : pasoNuevoGrupo > 2
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    pasoNuevoGrupo > 2
                      ? 'bg-emerald-600 text-white'
                      : pasoNuevoGrupo === 2
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {pasoNuevoGrupo > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold leading-tight">2. Unidad</div>
                  <div className="text-[9px] opacity-75 truncate">Negocio / Sede</div>
                </div>
              </div>

              {/* Paso 3: Integrantes */}
              <div
                className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                  pasoNuevoGrupo === 3
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                    pasoNuevoGrupo === 3
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 dark:ring-emerald-900'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  3
                </div>
                <div className="truncate">
                  <div className="text-[11px] font-bold leading-tight">3. Miembros</div>
                  <div className="text-[9px] opacity-75 truncate">Integrantes</div>
                </div>
              </div>
            </div>

            {/* CONTENIDO DEL PASO 1: NOMBRE Y DESCRIPCIÓN */}
            {pasoNuevoGrupo === 1 && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Nombre del grupo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej. Soporte Nómina - Sucursal Norte"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && nuevoNombre.trim()) {
                        e.preventDefault();
                        setPasoNuevoGrupo(2);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                  />
                  {!nuevoNombre.trim() && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Ingresa un nombre claro que sea fácil de recordar.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Descripción del grupo <span className="text-slate-400 font-normal"></span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe el propósito del grupo"
                    value={nuevaDescripcion}
                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs resize-none"
                  />
                </div>

                {/* Botones Paso 1 */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={resetearModalNuevoGrupo}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoNuevoGrupo(2)}
                    disabled={!nuevoNombre.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
                  >
                    <span>Siguiente: Unidad de Negocio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CONTENIDO DEL PASO 2: UNIDAD DE NEGOCIO */}
            {pasoNuevoGrupo === 2 && (
              <div className="space-y-4 pt-1">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs mb-1">
                    Selecciona la Unidad de Negocio
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    El grupo, sus actividades derivadas y los integrantes disponibles se asociarán a la unidad seleccionada.
                  </p>
                </div>

                {/* Lista de Unidades de Negocio */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {unidades.map((u) => {
                    const seleccionada = nuevaUnidadId === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setNuevaUnidadId(u.id);
                          // Limpiar integrantes seleccionados que pertenezcan a otra unidad
                          setMiembrosSeleccionados([]);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          seleccionada
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              seleccionada
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                              <span className="truncate">{u.nombre}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {u.codigo}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {u.descripcion || `Zona horaria: ${u.zonaHoraria || 'Local'}`}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              seleccionada
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {seleccionada && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Botones Paso 2 */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPasoNuevoGrupo(1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoNuevoGrupo(3)}
                    disabled={!nuevaUnidadId}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
                  >
                    <span>Siguiente: Seleccionar Integrantes</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CONTENIDO DEL PASO 3: SELECCIONAR INTEGRANTES */}
            {pasoNuevoGrupo === 3 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Seleccionar Integrantes Iniciales
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unidad: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{unidades.find(u => u.id === nuevaUnidadId)?.nombre || 'Seleccionada'}</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {miembrosSeleccionados.length} seleccionado(s)
                  </span>
                </div>

                {/* Barra de búsqueda y selector rápido */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o correo..."
                      value={busquedaIntegrantes}
                      onChange={(e) => setBusquedaIntegrantes(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {busquedaIntegrantes && (
                      <button
                        type="button"
                        onClick={() => setBusquedaIntegrantes('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const idsDisponibles = directorio
                        .filter((u) => u.id !== usuario?.id)
                        .map((u) => u.id);
                      if (miembrosSeleccionados.length === idsDisponibles.length) {
                        setMiembrosSeleccionados([]);
                      } else {
                        setMiembrosSeleccionados(idsDisponibles);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer transition-colors"
                  >
                    {miembrosSeleccionados.length === directorio.filter((u) => u.id !== usuario?.id).length && directorio.length > 1
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </button>
                </div>

                {/* Lista de Integrantes */}
                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
                  {directorio
                    .filter((usr) => {
                      if (usr.id === usuario?.id) return false; // El usuario actual se agrega automáticamente en backend como admin
                      if (!busquedaIntegrantes.trim()) return true;
                      const term = busquedaIntegrantes.toLowerCase();
                      return (
                        usr.nombreCompleto.toLowerCase().includes(term) ||
                        usr.email.toLowerCase().includes(term) ||
                        (usr.cargo && usr.cargo.toLowerCase().includes(term))
                      );
                    })
                    .map((usr) => {
                      const checkeado = miembrosSeleccionados.includes(usr.id);
                      const iniciales = usr.nombreCompleto
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <label
                          key={usr.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                            checkeado
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60'
                              : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/60 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checkeado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMiembrosSeleccionados((prev) => [...prev, usr.id]);
                              } else {
                                setMiembrosSeleccionados((prev) => prev.filter((id) => id !== usr.id));
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {iniciales}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">
                              {usr.nombreCompleto}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {usr.email} {usr.cargo ? `· ${usr.cargo}` : ''}
                            </div>
                          </div>
                        </label>
                      );
                    })}

                  {directorio.filter((u) => u.id !== usuario?.id).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No hay colaboradores adicionales en esta unidad. Podrás agregar miembros más tarde.
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Tú (<strong className="text-slate-600 dark:text-slate-300">{usuario?.nombreCompleto}</strong>) serás asignado como Administrador del grupo.
                  </span>
                </div>

                {/* Botones Paso 3 */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPasoNuevoGrupo(2)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer font-semibold transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Atrás</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => crearGrupoMutation.mutate()}
                    disabled={crearGrupoMutation.isPending || !nuevoNombre.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                  >
                    {crearGrupoMutation.isPending ? (
                      <span>Creando grupo...</span>
                    ) : (
                      <>
                        <CheckCheck className="w-4 h-4" />
                        <span>Crear Grupo de WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: GESTIONAR MIEMBROS */}
      {modalMiembros && grupoActivo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Participantes de: {grupoActivo.nombre}
              </h3>
              <button
                onClick={() => setModalMiembros(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Miembros Actuales */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                Miembros en el grupo ({grupoActivo.miembros.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2">
                {grupoActivo.miembros.map((m) => (
                  <div
                    key={m.usuarioId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100">
                        {m.nombreCompleto} {m.esAdmin && '👑 (Admin)'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {m.email} {m.cargo ? `· ${m.cargo}` : ''}
                      </div>
                    </div>
                    {esAdmin && m.usuarioId !== usuario?.id && (
                      <button
                        onClick={() => removerMiembroMutation.mutate(m.usuarioId)}
                        title="Remover del grupo"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agregar Nuevos Participantes */}
            {esAdmin && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Agregar personas al grupo
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/40">
                  {directorio
                    .filter((usr) => !grupoActivo.miembros.some((m) => m.usuarioId === usr.id))
                    .map((usr) => {
                      const checkeado = usuariosParaAgregar.includes(usr.id);
                      return (
                        <label
                          key={usr.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checkeado}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUsuariosParaAgregar((prev) => [...prev, usr.id]);
                              } else {
                                setUsuariosParaAgregar((prev) =>
                                  prev.filter((id) => id !== usr.id)
                                );
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {usr.nombreCompleto}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {usr.email}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => agregarMiembrosMutation.mutate()}
                    disabled={
                      usuariosParaAgregar.length === 0 || agregarMiembrosMutation.isPending
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {agregarMiembrosMutation.isPending ? 'Agregando...' : 'Agregar Seleccionados'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalMiembros(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
