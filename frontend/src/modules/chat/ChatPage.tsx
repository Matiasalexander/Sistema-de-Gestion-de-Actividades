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
  const [grupoParaEliminar, setGrupoParaEliminar] = useState<ChatGrupoItem | null>(null);

  // Formulario nuevo grupo
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaUnidadId, setNuevaUnidadId] = useState<number>(unidadActivaId || 1);
  const [miembrosSeleccionados, setMiembrosSeleccionados] = useState<number[]>([]);

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

  const { data: directorio = [] } = useQuery<UsuarioLista[]>({
    queryKey: ['directorio', unidadActivaId],
    queryFn: () => {
      const q = unidadActivaId ? `?unidadId=${unidadActivaId}` : '';
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

    connection.on('GrupoChatEliminado', (payload: { grupoId: number }) => {
      if (payload.grupoId === grupoSeleccionadoId) {
        setGrupoSeleccionadoId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.removeQueries({ queryKey: ['chat-grupo-detalle', payload.grupoId] });
      queryClient.removeQueries({ queryKey: ['chat-mensajes', payload.grupoId] });
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
          nombre: nuevoNombre,
          descripcion: nuevaDescripcion,
          unidadId: nuevaUnidadId,
          miembrosIds: miembrosSeleccionados,
        }),
      }),
    onSuccess: (nuevoGrupo) => {
      setModalNuevoGrupo(false);
      setNuevoNombre('');
      setNuevaDescripcion('');
      setMiembrosSeleccionados([]);
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

  // Mutación: Eliminar grupo de chat
  const eliminarGrupoMutation = useMutation({
    mutationFn: (grupoId: number) =>
      apiFetch(`/api/chat/grupos/${grupoId}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, grupoIdEliminado) => {
      setGrupoParaEliminar(null);
      setModalMiembros(false);
      if (grupoSeleccionadoId === grupoIdEliminado) {
        const siguiente = grupos.find((g) => g.id !== grupoIdEliminado);
        setGrupoSeleccionadoId(siguiente ? siguiente.id : null);
      }
      queryClient.invalidateQueries({ queryKey: ['chat-grupos'] });
      queryClient.removeQueries({ queryKey: ['chat-grupo-detalle', grupoIdEliminado] });
      queryClient.removeQueries({ queryKey: ['chat-mensajes', grupoIdEliminado] });
      queryClient.invalidateQueries({ queryKey: ['actividades'] });
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
    usuario?.roles?.some(
      (r) => r.toUpperCase().includes('ADMIN') || r.toUpperCase().includes('LIDER')
    ) ||
    tienePermiso('chat.crear') ||
    usuario?.accesoGlobalUnidades;

  const puedeEliminarGrupo = (g: ChatGrupoItem) =>
    Boolean(
      esAdmin ||
        g.creadoPorId === usuario?.id ||
        g.miembros?.some((m) => m.usuarioId === usuario?.id && m.esAdmin)
    );

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
                  Chats WhatsApp
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                    En vivo
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Grupos y seguimiento de actividades
                </p>
              </div>
            </div>

            {esAdmin && (
              <button
                onClick={() => setModalNuevoGrupo(true)}
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
                    onClick={() => setModalNuevoGrupo(true)}
                    className="text-emerald-600 hover:underline font-semibold"
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

                        {puedeEliminarGrupo(grupo) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGrupoParaEliminar(grupo);
                            }}
                            title="Eliminar grupo de chat"
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

                  {/* Botón eliminar grupo */}
                  {puedeEliminarGrupo(grupoActivo) && (
                    <button
                      onClick={() => setGrupoParaEliminar(grupoActivo)}
                      className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer transition-colors"
                      title="Eliminar grupo de chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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

      {/* MODAL: NUEVO GRUPO DE CHAT */}
      {modalNuevoGrupo && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Crear Nuevo Grupo de Chat WhatsApp
              </h3>
              <button
                onClick={() => setModalNuevoGrupo(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Nombre del Grupo
              </label>
              <input
                type="text"
                placeholder="Ej. Soporte Nómina - Sucursal Norte"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Descripción u Objetivo del Grupo
              </label>
              <textarea
                rows={2}
                placeholder="Canal directo para atender y resolver incidencias de nómina"
                value={nuevaDescripcion}
                onChange={(e) => setNuevaDescripcion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Unidad de Negocio
              </label>
              <select
                value={nuevaUnidadId}
                onChange={(e) => setNuevaUnidadId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.codigo})
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Participantes */}
            <div>
              <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                Seleccionar Integrantes Iniciales ({miembrosSeleccionados.length} seleccionados)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-900/40">
                {directorio.map((usr) => {
                  const checkeado = miembrosSeleccionados.includes(usr.id);
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
                            setMiembrosSeleccionados((prev) => [...prev, usr.id]);
                          } else {
                            setMiembrosSeleccionados((prev) => prev.filter((id) => id !== usr.id));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {usr.nombreCompleto}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {usr.email} {usr.cargo ? `· ${usr.cargo}` : ''}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalNuevoGrupo(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => crearGrupoMutation.mutate()}
                disabled={!nuevoNombre.trim() || crearGrupoMutation.isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {crearGrupoMutation.isPending ? 'Creando...' : 'Crear Grupo'}
              </button>
            </div>
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

      {/* MODAL: CONFIRMAR ELIMINACIÓN DE GRUPO */}
      {grupoParaEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
                Eliminar Grupo de Chat
              </h3>
              <button
                onClick={() => setGrupoParaEliminar(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente el grupo{' '}
                <strong className="text-slate-900 dark:text-white">
                  {grupoParaEliminar.nombre}
                </strong>
                ?
              </p>
              <p className="text-[11px] p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                Se eliminarán el grupo, sus participantes y el historial de mensajes del chat. Las
                actividades que se hayan creado a partir de este grupo se conservarán en el módulo
                de Actividades con registro en su historial.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setGrupoParaEliminar(null)}
                disabled={eliminarGrupoMutation.isPending}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarGrupoMutation.mutate(grupoParaEliminar.id)}
                disabled={eliminarGrupoMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {eliminarGrupoMutation.isPending ? 'Eliminando...' : 'Sí, eliminar grupo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
