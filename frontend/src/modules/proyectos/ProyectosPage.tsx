import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderPlus,
  Calendar,
  Flag,
  Archive,
  MessageSquare,
  Paperclip,
  Milestone,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  AdjuntoItem,
  CatalogosOperativos,
  ComentarioItem,
  ProyectoItem,
  UnidadItem,
  UsuarioLista,
} from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';

export const ProyectosPage: React.FC = () => {
  const { unidadActivaId, tienePermiso } = useAuth();
  const queryClient = useQueryClient();

//estado de la nueva vista
  const [vista, setVista] = useState<'cards' | 'lista'>('cards');
  const [estado, setEstado] = useState<string>('todos');
  //cierre estado
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoDetalle, setProyectoDetalle] = useState<ProyectoItem | null>(null);

  // Formulario nuevo proyecto
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadId, setUnidadId] = useState<number>(1);
  const [responsableId, setResponsableId] = useState<number>(1);
  const [prioridadId, setPrioridadId] = useState<number>(2);
  const [estadoProyectoId, setEstadoProyectoId] = useState<number>(2);
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFinEstimada, setFechaFinEstimada] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );

  // Fase y Comentario
  const [nuevaFaseNombre, setNuevaFaseNombre] = useState('');
  const [nuevaFaseHito, setNuevaFaseHito] = useState(false);
  const [nuevoComentario, setNuevoComentario] = useState('');

  const { data: proyectos = [], isLoading } = useQuery<ProyectoItem[]>({
    queryKey: ['proyectos', unidadActivaId, busqueda],
    queryFn: () => {
      const p = new URLSearchParams();
      if (unidadActivaId) p.set('unidadId', String(unidadActivaId));
      if (busqueda) p.set('busqueda', busqueda);
      const qs = p.toString();
      return apiFetch<ProyectoItem[]>(`/api/proyectos${qs ? `?${qs}` : ''}`);
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

  const { data: comentarios = [] } = useQuery<ComentarioItem[]>({
    queryKey: ['comentarios-proyecto', proyectoDetalle?.id],
    queryFn: () => apiFetch<ComentarioItem[]>(`/api/proyectos/${proyectoDetalle!.id}/comentarios`),
    enabled: !!proyectoDetalle,
  });

  const { data: adjuntos = [] } = useQuery<AdjuntoItem[]>({
    queryKey: ['adjuntos-proyecto', proyectoDetalle?.id],
    queryFn: () => apiFetch<AdjuntoItem[]>(`/api/proyectos/${proyectoDetalle!.id}/adjuntos`),
    enabled: !!proyectoDetalle,
  });

  const crearProyectoMutation = useMutation({
    mutationFn: () =>
      apiFetch<ProyectoItem>('/api/proyectos', {
        method: 'POST',
        body: JSON.stringify({
          codigo,
          nombre,
          descripcion,
          unidadId,
          responsableId,
          prioridadId,
          estadoProyectoId,
          fechaInicio,
          fechaFinEstimada,
          integrantesIds: [responsableId],
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setModalAbierto(false);
    },
  });

  const crearFaseMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/proyectos/${proyectoDetalle!.id}/fases`, {
        method: 'POST',
        body: JSON.stringify({
          nombre: nuevaFaseNombre,
          orden: (proyectoDetalle?.fases.length || 0) + 1,
          esHito: nuevaFaseHito,
          completada: false,
        }),
      }),
    onSuccess: async () => {
      setNuevaFaseNombre('');
      const actualizado = await apiFetch<ProyectoItem>(`/api/proyectos/${proyectoDetalle!.id}`);
      setProyectoDetalle(actualizado);
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
    },
  });

  const agregarComentarioMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/proyectos/${proyectoDetalle!.id}/comentarios`, {
        method: 'POST',
        body: JSON.stringify({ contenido: nuevoComentario, esInterno: false }),
      }),
    onSuccess: () => {
      setNuevoComentario('');
      queryClient.invalidateQueries({ queryKey: ['comentarios-proyecto', proyectoDetalle?.id] });
    },
  });

  const archivarMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/proyectos/${id}/archivar?archivado=true`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });
      setProyectoDetalle(null);
    },
  });

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !proyectoDetalle) return;
    const fd = new FormData();
    fd.append('archivo', e.target.files[0]);
    await apiFetch(`/api/proyectos/${proyectoDetalle.id}/adjuntos`, {
      method: 'POST',
      body: fd,
    });
    queryClient.invalidateQueries({ queryKey: ['adjuntos-proyecto', proyectoDetalle.id] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portafolio de Proyectos GA</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Proyectos corporativos y tecnológicos con fases, hitos, evidencias y avance ponderado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
  <button
        type="button"
        onClick={() => setVista('cards')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          vista === 'cards'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Cards
      </button>
      <button
        type="button"
        onClick={() => setVista('lista')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
          vista === 'lista'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Lista
      </button>
          </div>
          
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Filtrar por código o nombre..."
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
          />
          {tienePermiso('proyectos.crear') && (
            <button
              onClick={() => {
                setCodigo(`PRJ-GA-00${proyectos.length + 1}`);
                setNombre('');
                setDescripcion('');
                setUnidadId(unidadActivaId || unidades[0]?.id || 1);
                setResponsableId(directorio[0]?.id || 1);
                setModalAbierto(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" /> Nuevo Proyecto
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Cargando portafolio de proyectos...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {proyectos.map((p) => (
            <div
              key={p.id}
              onClick={() => setProyectoDetalle(p)}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 transition cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {p.codigo}
                    </span>
                    <span className="text-xs text-slate-400">· {p.unidadNombre}</span>
                  </div>
                  <h3 className="mt-1 font-bold text-base leading-snug">{p.nombre}</h3>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge label={p.estadoNombre} colorHex={p.estadoColor} />
                  <StatusBadge label={p.prioridadNombre} colorHex={p.prioridadColor} />
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{p.descripcion}</p>

              {/* Barra de avance calculada */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">
                    Avance ({p.actividadesCompletadas}/{p.totalActividades} actividades)
                  </span>
                  <span className="font-bold text-blue-600">{p.porcentajeAvance}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${Math.min(100, p.porcentajeAvance)}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-slate-400" />
                  Resp: <strong className="text-slate-700 dark:text-slate-200">{p.responsableNombre}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {p.fechaInicio} → {p.fechaFinEstimada}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PANEL LATERAL DETALLE DE PROYECTO */}
      {proyectoDetalle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 space-y-6 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-blue-600">{proyectoDetalle.codigo}</span>
                <h2 className="text-lg font-bold mt-0.5">{proyectoDetalle.nombre}</h2>
                <p className="text-xs text-slate-500 mt-1">{proyectoDetalle.descripcion}</p>
              </div>
              <div className="flex items-center gap-2">
                {tienePermiso('proyectos.eliminar') && (
                  <button
                    onClick={() => archivarMutation.mutate(proyectoDetalle.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archivar
                  </button>
                )}
                <button
                  onClick={() => setProyectoDetalle(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fases e Hitos */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Milestone className="w-4 h-4 text-blue-600" /> Fases e Hitos del Proyecto
              </h3>
              <div className="space-y-2">
                {proyectoDetalle.fases.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold">{f.nombre}</span>
                      {f.esHito && (
                        <span className="ml-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          HITO CLAVE
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-blue-600">{f.porcentajeAvance}%</span>
                  </div>
                ))}
              </div>
              {tienePermiso('proyectos.editar') && (
                <div className="flex gap-2 text-xs">
                  <input
                    value={nuevaFaseNombre}
                    onChange={(e) => setNuevaFaseNombre(e.target.value)}
                    placeholder="Nueva fase o entregable..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={nuevaFaseHito}
                      onChange={(e) => setNuevaFaseHito(e.target.checked)}
                    />
                    Hito
                  </label>
                  <button
                    onClick={() => nuevaFaseNombre && crearFaseMutation.mutate()}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                  >
                    Añadir Fase
                  </button>
                </div>
              )}
            </div>

            {/* Evidencias y Adjuntos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600" /> Evidencias y Documentos ({adjuntos.length})
                </h3>
                <label className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold cursor-pointer">
                  + Adjuntar Evidencia
                  <input type="file" onChange={subirArchivo} className="hidden" />
                </label>
              </div>
              <div className="space-y-1.5">
                {adjuntos.map((a) => (
                  <div
                    key={a.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold">{a.nombreOriginal}</div>
                      <div className="text-[11px] text-slate-400">
                        Subido por {a.subidoPorNombre} · {(a.tamanoBytes / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <a
                      href={`/api/adjuntos/${a.id}/descargar`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Comentarios */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Bitácora de Comentarios ({comentarios.length})
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
                    <p className="mt-1 text-slate-600 dark:text-slate-300">{c.contenido}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                <input
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribir comentario de avance..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <button
                  onClick={() => nuevoComentario && agregarComentarioMutation.mutate()}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold cursor-pointer"
                >
                  Comentar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO PROYECTO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold">Crear Proyecto Corporativo</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Código</label>
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
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
              <label className="block font-semibold mb-1">Nombre del Proyecto</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Descripción y Alcance</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Responsable Líder</label>
                <select
                  value={responsableId}
                  onChange={(e) => setResponsableId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {directorio.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombreCompleto}
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
                <label className="block font-semibold mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Fecha Fin Estimada</label>
                <input
                  type="date"
                  value={fechaFinEstimada}
                  onChange={(e) => setFechaFinEstimada(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => crearProyectoMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Crear Proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
