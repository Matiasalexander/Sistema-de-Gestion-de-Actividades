import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Check, Users, AlertCircle } from 'lucide-react';
import { apiFetch, UsuarioLista } from '../../services/api';
import { array, set } from 'zod/v4';

export interface ModalSeleccionIntegrantesProps {
    abierto: boolean;
    onCerrar: ()=>void;
    unidadId: number;
    unidadNombre?: string;
    integrantesSeleccionados: number[];
    onConfirmar: (nuevosIntegrantesIds: number[]) => void;
    liderUsuarioId?: number;
}

export const ModalSeleccionIntegrantes: React.FC<ModalSeleccionIntegrantesProps>=({
    abierto, onCerrar, unidadId, unidadNombre, integrantesSeleccionados, onConfirmar, liderUsuarioId,
}) => {
    const [busqueda, setBusqueda] = useState('');
    const [seleccionTemporal, setSeleccionTemporal] = useState<number[]>([]);
    //sincronizar la selección inicial
    useEffect(()=>{
        if(abierto) {
            setSeleccionTemporal(integrantesSeleccionados);
            setBusqueda('');
        }
    }, [abierto, integrantesSeleccionados]);

const {data: directorio = [], isLoading} = useQuery<UsuarioLista[]>({
    queryKey: ['directorio', unidadId],
    queryFn: ()=>
        apiFetch<UsuarioLista[]>(
        `/api/usuarios/directorio${unidadId ? `?unidadId=${unidadId}` : ''}`
        ),
});

//filtro en memoria por nombre, correo y cargo
 const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return directorio;
    const term = busqueda.toLowerCase().trim();
    return directorio.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.cargo && u.cargo.toLowerCase().includes(term))
    );
  }, [directorio, busqueda]);

  if (!abierto) return null;

  const toggleUsuario = (id:number) => {
setSeleccionTemporal((prev)=>prev.includes(id)? prev.filter((item)=>item !== id): [...prev, id]);
  };

  const toggleSeleccionarTodos = ()=> {
    const idsVisibles = usuariosFiltrados.map((u)=>u.id);
    const todosVisiblesSeleccionados= idsVisibles.length>0 && idsVisibles.every((id)=>seleccionTemporal.includes(id));
    if (todosVisiblesSeleccionados) {
        setSeleccionTemporal((prev)=>prev.filter((id)=>!idsVisibles.includes(id)));
    } else {
        setSeleccionTemporal((prev)=>Array.from(new Set([...prev, ...idsVisibles])));
    }
  };

  const handleGuardar = () => {
    onConfirmar(seleccionTemporal);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Seleccionar Integrantes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {unidadNombre ? `Sede: ${unidadNombre}` : 'Colaboradores disponibles'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Buscador y Contadores */}
        <div className="p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar colaborador por nombre, cargo o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              autoFocus
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {seleccionTemporal.length} de {directorio.length} seleccionados
            </span>
            {usuariosFiltrados.length > 0 && (
              <button
                type="button"
                onClick={toggleSeleccionarTodos}
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {usuariosFiltrados.every((u) => seleccionTemporal.includes(u.id))
                  ? 'Deseleccionar filtrados'
                  : 'Seleccionar todos los visibles'}
              </button>
            )}
          </div>
        </div>
        {/* Lista con scroll y avatares */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Cargando colaboradores de la unidad...</span>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-center px-4">
              <AlertCircle className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              <span className="text-xs">
                {busqueda
                  ? `No se encontraron colaboradores para "${busqueda}".`
                  : 'No hay usuarios asignados a esta unidad de negocio.'}
              </span>
            </div>
          ) : (
            usuariosFiltrados.map((u) => {
              const seleccionado = seleccionTemporal.includes(u.id);
              const esLider = liderUsuarioId === u.id;
              const iniciales = u.nombreCompleto
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase();
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUsuario(u.id)}
                  className={`pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    seleccionado
                      ? 'bg-blue-50/70 dark:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        seleccionado
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/30'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {iniciales}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {u.nombreCompleto}
                        </span>
                        {esLider && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
                            Líder
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {u.cargo ? `${u.cargo} • ${u.email}` : u.email}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        seleccionado
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}
                    >
                      {seleccionado && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            Confirmar Selección ({seleccionTemporal.length})
          </button>
        </div>
      </div>
    </div>
  );
  
};