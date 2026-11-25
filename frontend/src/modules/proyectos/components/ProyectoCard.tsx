import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ProyectoItem } from '../../../services/api';
import {
  obtenerIconoProyecto,
  obtenerIniciales,
  IndicadorPrioridad,
} from './proyectosHelpers';

interface ProyectoCardProps {
  proyecto: ProyectoItem;
  onClick: () => void;
}

export const ProyectoCard: React.FC<ProyectoCardProps> = ({ proyecto, onClick }) => {
  const { Icon, bg } = obtenerIconoProyecto(proyecto.nombre, proyecto.unidadNombre);
  const inicialesLider = obtenerIniciales(proyecto.responsableNombre);

  // Cantidad de integrantes adicionales
  const extraIntegrantes =
    proyecto.integrantes && proyecto.integrantes.length > 1
      ? proyecto.integrantes.length - 1
      : 0;

  return (
    <div
      onClick={onClick}
      className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex flex-col justify-between gap-4"
    >
      <div className="space-y-3">
        {/* Cabecera: Icono de Marca / Categoría + Título del Proyecto */}
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg} shadow-xs`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
              {proyecto.nombre}
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">
              {proyecto.codigo}
            </span>
          </div>
        </div>

        {/* Tags / Pills de Categoría con fondo pastel */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900/30">
            {proyecto.unidadNombre}
          </span>
          {proyecto.departamentoNombre && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/30">
              {proyecto.departamentoNombre}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {proyecto.estadoNombre}
          </span>
        </div>

        {/* Descripción truncada a 2 líneas */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {proyecto.descripcion || 'Sin descripción registrada para este proyecto corporativo.'}
        </p>

        {/* Barra de progreso de avance */}
        <div className="pt-1">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Avance ({proyecto.actividadesCompletadas ?? 0}/{proyecto.totalActividades ?? 0})</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{proyecto.porcentajeAvance}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, proyecto.porcentajeAvance)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer: Pila de avatares superpuestos a la izquierda | Comentarios y Prioridad a la derecha */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        {/* Avatares superpuestos */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          <div
            title={`Responsable: ${proyecto.responsableNombre}`}
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-900"
          >
            {inicialesLider}
          </div>
          {extraIntegrantes > 0 && (
            <div
              title={`${extraIntegrantes} integrantes más`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold ring-2 ring-white dark:ring-slate-900"
            >
              +{extraIntegrantes}
            </div>
          )}
        </div>

        {/* Comentarios y Chevron de Prioridad */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1 text-slate-400 text-xs font-medium"
            title={`${proyecto.actividadesCompletadas} actividades / comentarios`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{proyecto.actividadesCompletadas ?? 0}</span>
          </div>
          <div className="flex items-center">
            <IndicadorPrioridad prioridad={proyecto.prioridadNombre} />
          </div>
        </div>
      </div>
    </div>
  );
};