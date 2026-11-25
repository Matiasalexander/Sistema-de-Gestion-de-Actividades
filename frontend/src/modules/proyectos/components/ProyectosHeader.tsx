import React from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';

interface ProyectosHeaderProps {
  vista: 'cards' | 'lista';
  setVista: (vista: 'cards' | 'lista') => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  puedeCrear: boolean;
  onNuevoProyecto: () => void;
}

export const ProyectosHeader: React.FC<ProyectosHeaderProps> = ({
  vista,
  setVista,
  busqueda,
  setBusqueda,
  puedeCrear,
  onNuevoProyecto,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Portafolio de Proyectos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Visualización y control de proyectos corporativos, fases, hitos y avance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Selector de Vistas: Cards vs Lista */}
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
            <LayoutGrid className="w-3.5 h-3.5" />
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
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
        </div>

        {/* Buscador */}
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Filtrar por código o nombre..."
          className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs w-48 sm:w-56 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
        />

        {/* Botón Nuevo Proyecto */}
        {puedeCrear && (
          <button
            onClick={onNuevoProyecto}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition"
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </button>
        )}
      </div>
    </div>
  );
};