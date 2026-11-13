import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  UserCheck,
  Trash2,
  Edit2,
  UserMinus,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch, EquipoItem, UnidadItem, UsuarioLista } from '../../services/api';

export const EquiposPage: React.FC = () => {
  const { usuario, unidadActivaId, tienePermiso } = useAuth();
  const queryClient = useQueryClient();

  const esAdmin =
    usuario?.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN') ||
    tienePermiso('configuracion.gestionar');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [equipoEnEdicion, setEquipoEnEdicion] = useState<EquipoItem | null>(null);
  const [equipoAEliminar, setEquipoAEliminar] = useState<EquipoItem | null>(null);

  // Modal para reinicio administrativo de datos operativos
  const [modalReinicioAbierto, setModalReinicioAbierto] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [resultadoReinicio, setResultadoReinicio] = useState<{
    mensaje: string;
    registrosAfectados: Record<string, number>;
  } | null>(null);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [colorHex, setColorHex] = useState('#2563EB');
  const [unidadId, setUnidadId] = useState<number>(unidadActivaId || 1);
  const [liderUsuarioId, setLiderUsuarioId] = useState<number | undefined>(undefined);
  const [integrantesIds, setIntegrantesIds] = useState<number[]>([]);

  const { data: equipos = [] } = useQuery<EquipoItem[]>({
    queryKey: ['equipos', unidadActivaId],
    queryFn: () =>
      apiFetch<EquipoItem[]>(
        `/api/equipos${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
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

  const abrirCrearEquipo = () => {
    setEquipoEnEdicion(null);
    setCodigo(`EQ-${equipos.length + 10}`);
    setNombre('');
    setDescripcion('');
    setColorHex('#2563EB');
    setUnidadId(unidadActivaId || unidades[0]?.id || 1);
    setLiderUsuarioId(undefined);
    setIntegrantesIds([]);
    setModalAbierto(true);
  };

  const abrirEditarEquipo = (eq: EquipoItem) => {
    setEquipoEnEdicion(eq);
    setCodigo(eq.codigo);
    setNombre(eq.nombre);
    setDescripcion(eq.descripcion || '');
    setColorHex(eq.colorHex || '#2563EB');
    setUnidadId(eq.unidadId);
    setLiderUsuarioId(eq.liderUsuarioId || undefined);
    setIntegrantesIds(eq.integrantes.map((i) => i.usuarioId));
    setModalAbierto(true);
  };

  const guardarEquipoMutation = useMutation({
    mutationFn: () => {
      if (equipoEnEdicion) {
        return apiFetch(`/api/equipos/${equipoEnEdicion.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            nombre,
            descripcion,
            colorHex,
            liderUsuarioId: liderUsuarioId || null,
            activo: true,
            integrantesIds,
          }),
        });
      }
      return apiFetch('/api/equipos', {
        method: 'POST',
        body: JSON.stringify({
          codigo,
          unidadId,
          nombre,
          descripcion,
          colorHex,
          liderUsuarioId: liderUsuarioId || null,
          activo: true,
          integrantesIds,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setModalAbierto(false);
      setEquipoEnEdicion(null);
    },
  });

  const eliminarEquipoMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/equipos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setEquipoAEliminar(null);
    },
  });

  const quitarIntegranteMutation = useMutation({
    mutationFn: ({ equipoId, usuarioId }: { equipoId: number; usuarioId: number }) =>
      apiFetch(`/api/equipos/${equipoId}/integrantes/${usuarioId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
    },
  });

  const reiniciarOperacionesMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ mensaje: string; registrosAfectados: Record<string, number> }>(
        '/api/mantenimiento/reiniciar-operaciones',
        { method: 'POST' }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      setResultadoReinicio(data);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipos de Trabajo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Células multidisciplinarias y cuadrillas de soporte por Unidad de Negocio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {esAdmin && (
            <button
              onClick={() => {
                setTextoConfirmacion('');
                setResultadoReinicio(null);
                setModalReinicioAbierto(true);
              }}
              title="Borrar todos los datos de prueba y comenzar desde cero"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Limpiar Datos Operativos</span>
            </button>
          )}

          {tienePermiso('equipos.gestionar') && (
            <button
              onClick={abrirCrearEquipo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Nuevo Equipo
            </button>
          )}
        </div>
      </div>

      {equipos.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold">No hay equipos de trabajo registrados</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Haga clic en &quot;Nuevo Equipo&quot; para registrar sus células de trabajo o cuadrillas de soporte por unidad de negocio.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {equipos.map((eq) => (
          <div
            key={eq.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: eq.colorHex }}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600">{eq.codigo}</span>
                  <h3 className="text-base font-bold">{eq.nombre}</h3>
                  <div className="text-xs text-slate-400">{eq.unidadNombre}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {eq.liderNombre && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Líder: {eq.liderNombre}
                  </span>
                )}
                {tienePermiso('equipos.gestionar') && (
                  <button
                    onClick={() => abrirEditarEquipo(eq)}
                    title="Editar equipo de trabajo"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {(tienePermiso('equipos.eliminar') || tienePermiso('equipos.gestionar')) && (
                  <button
                    onClick={() => setEquipoAEliminar(eq)}
                    title="Eliminar equipo de trabajo"
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {eq.descripcion || 'Sin descripción detallada.'}
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
                Integrantes ({eq.integrantes.length}):
              </div>
              {eq.integrantes.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic">
                  No hay integrantes asignados a este equipo.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {eq.integrantes.map((i) => (
                    <div
                      key={i.usuarioId}
                      className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {i.nombreCompleto}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{i.rolEnEquipo}</span>
                        {tienePermiso('equipos.gestionar') && (
                          <button
                            onClick={() =>
                              quitarIntegranteMutation.mutate({
                                equipoId: eq.id,
                                usuarioId: i.usuarioId,
                              })
                            }
                            disabled={quitarIntegranteMutation.isPending}
                            title="Quitar integrante del equipo"
                            className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer transition-colors"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL CREAR / EDITAR EQUIPO */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold">
              {equipoEnEdicion ? 'Editar Equipo de Trabajo' : 'Registrar Equipo de Trabajo'}
            </h3>

            {guardarEquipoMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guardarEquipoMutation.error?.message || 'Error al guardar el equipo'}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Código</label>
                <input
                  value={codigo}
                  disabled={!!equipoEnEdicion}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Unidad de Negocio</label>
                <select
                  value={unidadId}
                  disabled={!!equipoEnEdicion}
                  onChange={(e) => setUnidadId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
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
              <label className="block font-semibold mb-1">Nombre del Equipo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                placeholder="Ej. Cuadrilla de Mantenimiento Redes"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Color Distintivo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 cursor-pointer bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-slate-500">{colorHex}</span>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Líder del Equipo</label>
                <select
                  value={liderUsuarioId ?? ''}
                  onChange={(e) =>
                    setLiderUsuarioId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Seleccionar líder</option>
                  {directorio.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                placeholder="Propósito, responsabilidades o área de cobertura del equipo"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Integrantes ({integrantesIds.length})</label>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {directorio.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 rounded-lg">
                    <input
                      type="checkbox"
                      checked={integrantesIds.includes(u.id)}
                      onChange={() =>
                        setIntegrantesIds((prev) =>
                          prev.includes(u.id) ? prev.filter((x) => x !== u.id) : [...prev, u.id]
                        )
                      }
                    />
                    <span>{u.nombreCompleto}</span>
                    <span className="text-[10px] text-slate-400">({u.cargo || 'Sin cargo'})</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalAbierto(false);
                  setEquipoEnEdicion(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardarEquipoMutation.isPending || !nombre.trim()}
                onClick={() => guardarEquipoMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {guardarEquipoMutation.isPending ? 'Guardando...' : equipoEnEdicion ? 'Actualizar Equipo' : 'Guardar Equipo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE EQUIPO */}
      {equipoAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar equipo de trabajo?
              </h3>
              <p className="text-slate-500 mt-1">
                Está a punto de eliminar el equipo{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {equipoAEliminar.codigo}: {equipoAEliminar.nombre}
                </strong>
                .
              </p>
              <p className="text-slate-400 mt-2">
                Los {equipoAEliminar.integrantes.length} integrantes serán desvinculados de este equipo.
                Cualquier política de escalamiento SLA, actividad o ticket asignado será desenlazado de forma limpia y se registrará en la auditoría.
              </p>
            </div>

            {eliminarEquipoMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eliminarEquipoMutation.error?.message || 'Error al eliminar el equipo'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEquipoAEliminar(null)}
                disabled={eliminarEquipoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarEquipoMutation.mutate(equipoAEliminar.id)}
                disabled={eliminarEquipoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {eliminarEquipoMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REINICIAR DATOS OPERATIVOS (ADMINISTRADOR) */}
      {modalReinicioAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Reiniciar Datos Operativos
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Restablecer el sistema para iniciar operaciones desde cero.
                </p>
              </div>
            </div>

            {resultadoReinicio ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">{resultadoReinicio.mensaje}</div>
                    <div className="text-[11px] mt-0.5 text-emerald-600 dark:text-emerald-400">
                      Todos los datos operativos fueron vaciados. Los usuarios y catálogos de seguridad se mantienen intactos.
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl space-y-1.5 max-h-48 overflow-y-auto">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Registros eliminados:
                  </div>
                  {Object.entries(resultadoReinicio.registrosAfectados).map(([tabla, cantidad]) => (
                    <div key={tabla} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50 pb-0.5">
                      <span>{tabla}</span>
                      <span className="font-mono font-bold">{cantidad}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalReinicioAbierto(false);
                      setResultadoReinicio(null);
                    }}
                    className="px-4 py-2 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    Aceptar y Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-slate-600 dark:text-slate-300">
                  <p>
                    Esta acción administrativa eliminará de manera definitiva{' '}
                    <strong>todos los datos operativos de prueba</strong> para permitirle configurar el sistema desde cero:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                    <li>Equipos de trabajo e integrantes asignados</li>
                    <li>Proyectos, fases e integrantes</li>
                    <li>Actividades, checklists, tiempos e historial</li>
                    <li>Tickets de soporte, actividades vinculadas e historial</li>
                    <li>Grupos y mensajes de WhatsApp (chat interactivo)</li>
                    <li>Comentarios y archivos adjuntos</li>
                  </ul>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px]">
                    ✓ <strong>Se preservan:</strong> Usuarios, Roles, Permisos, Unidades de Negocio, Departamentos y Catálogos del sistema.
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Escriba <span className="font-mono text-amber-600 font-bold">REINICIAR</span> para confirmar:
                  </label>
                  <input
                    type="text"
                    value={textoConfirmacion}
                    onChange={(e) => setTextoConfirmacion(e.target.value)}
                    placeholder="REINICIAR"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent font-mono text-center tracking-wider font-bold"
                  />
                </div>

                {reiniciarOperacionesMutation.isError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{reiniciarOperacionesMutation.error?.message || 'Error al ejecutar el reinicio'}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalReinicioAbierto(false)}
                    disabled={reiniciarOperacionesMutation.isPending}
                    className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => reiniciarOperacionesMutation.mutate()}
                    disabled={
                      reiniciarOperacionesMutation.isPending ||
                      textoConfirmacion.trim().toUpperCase() !== 'REINICIAR'
                    }
                    className="px-4 py-2 rounded-xl font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {reiniciarOperacionesMutation.isPending ? 'Reiniciando...' : 'Confirmar Reinicio Completo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};