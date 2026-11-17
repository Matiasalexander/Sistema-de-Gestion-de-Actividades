import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, UserCheck, Search, X, Check, Building2 } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch, EquipoItem, UnidadItem, UsuarioLista } from '../../services/api';
import { array, boolean } from 'zod/v4';

export const EquiposPage: React.FC = () => {
  const { unidadActivaId, tienePermiso } = useAuth();
  const queryClient = useQueryClient();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidadId, setUnidadId] = useState<number>(unidadActivaId || 1);
  const [liderUsuarioId, setLiderUsuarioId] = useState<number | undefined>(undefined);
  const [integrantesIds, setIntegrantesIds] = useState<number[]>([]);
  //buscador de usuario
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

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

  //Nuevo directorio de usuarios dinámico
  const { data: directorio = [], isLoading: cargandoDirectorio } = useQuery<UsuarioLista[]>({
    queryKey: ['directorio', unidadId],
    queryFn: () =>
      apiFetch<UsuarioLista[]>(
        `/api/usuarios/directorio${unidadId ? `?unidadId=${unidadId}` : ''}`
      ),
    enabled: modalAbierto && Boolean(unidadId),
  });
  
  //apertura del modal
  const abrirModalNuevoEquipo = () => {
    setCodigo(`EQ-${equipos.length + 10}`);
    setNombre('');
    setDescripcion('');
    setUnidadId(unidadActivaId||unidades[0]?.id || 1);
    setLiderUsuarioId(undefined);
    setIntegrantesIds([]);
    setBusquedaUsuario('');
    setModalAbierto(true);
  };

  //cambio de unidad
  const handleCambioUnidad = (nuevaUnidad: number)=> {
    setUnidadId(nuevaUnidad);
    setLiderUsuarioId(undefined);
    setIntegrantesIds([]);
    setBusquedaUsuario('');
  };
  //Filtrar dependiendo de la unidad
 const usuariosFiltrados = useMemo(() => {
    if (!busquedaUsuario.trim()) return directorio;
    const term = busquedaUsuario.toLowerCase().trim();
    return directorio.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.cargo && u.cargo.toLowerCase().includes(term))
    );
  }, [directorio, busquedaUsuario]);

  //selección and deselección masiva
  const toggleSeleccionarTodos = () => {
    const idsVisibles = usuariosFiltrados.map((u)=>u.id);
    const todosVisiblesSeleccionados = idsVisibles.length > 0 && idsVisibles.every((id)=>integrantesIds.includes(id));
    if (todosVisiblesSeleccionados) {
      setIntegrantesIds((prev)=>prev.filter((id)=>!idsVisibles.includes(id)));
    } else {
      setIntegrantesIds((prev)=>Array.from(new Set([...prev, ...idsVisibles])));
    }
  };
  const crearEquipoMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/equipos', {
        method: 'POST',
        body: JSON.stringify({
          codigo,
          unidadId,
          nombre,
          descripcion,
          colorHex: '#2563EB',
          liderUsuarioId: liderUsuarioId || null,
          activo: true,
          integrantesIds,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      setModalAbierto(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipos de Trabajo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Células multidisciplinarias y cuadrillas de soporte por Unidad de Negocio.
          </p>
        </div>

        {tienePermiso('equipos.gestionar') && (
          <button
            onClick={abrirModalNuevoEquipo}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {equipos.map((eq) => (
          <div
            key={eq.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
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
              {eq.liderNombre && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> Líder: {eq.liderNombre}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">{eq.descripcion}</p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold mb-2">
                Integrantes ({eq.integrantes.length}):
              </div>
              <div className="space-y-1.5">
                {eq.integrantes.map((i) => (
                  <div
                    key={i.usuarioId}
                    className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
                  >
                    <span className="font-medium">{i.nombreCompleto}</span>
                    <span className="text-[11px] text-slate-400">{i.rolEnEquipo}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold">Registrar Equipo de Trabajo</h3>
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
              <label className="block font-semibold mb-1">Nombre del Equipo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Líder del Equipo</label>
              <select
                value={liderUsuarioId ?? ''}
                onChange={(e) => setLiderUsuarioId(e.target.value ? Number(e.target.value) : undefined)}
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
            <div>
              <label className="block font-semibold mb-1">Integrantes</label>
              <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {directorio.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
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
                  </label>
                ))}
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
                onClick={() => crearEquipoMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Guardar Equipo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
