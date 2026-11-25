import React from 'react';
import { ProyectoItem } from '../../../services/api';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  obtenerIconoProyecto,
  obtenerIniciales,
  IndicadorPrioridad,
} from './proyectosHelpers';

interface ProyectosListViewProps {
  proyectos: ProyectoItem[];
  onSeleccionar: (proyecto: ProyectoItem) => void;
}

export const ProyectosListView: React.FC<ProyectosListViewProps> = ({ proyectos, onSeleccionar }) => {
  if (proyectos.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        No se encontraron proyectos con los filtros seleccionados.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Proyecto</th>
              <th className="py-3.5 px-4">Unidad</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4">Avance</th>
              <th className="py-3.5 px-4">Responsable</th>
              <th className="py-3.5 px-4">Prioridad</th>
              <th className="py-3.5 px-4">Fechas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {proyectos.map((p) => {
              const { Icon, bg } = obtenerIconoProyecto(p.nombre, p.unidadNombre);
              const inicialesLider = obtenerIniciales(p.responsableNombre);

              return (
                <tr
                  key={p.id}
                  onClick={() => onSeleccionar(p)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-xs">
                          {p.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400">{p.codigo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {p.unidadNombre}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge label={p.estadoNombre} colorHex={p.estadoColor} />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-bold text-blue-600">{p.porcentajeAvance}%</span>
                        <span className="text-slate-400">
                          {p.actividadesCompletadas}/{p.totalActividades}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${Math.min(100, p.porcentajeAvance)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {inicialesLider}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[140px]">
                        {p.responsableNombre}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <IndicadorPrioridad prioridad={p.prioridadNombre} />
                      <span className="capitalize text-slate-700 dark:text-slate-300 font-medium">
                        {p.prioridadNombre}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {p.fechaInicio} → {p.fechaFinEstimada}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};