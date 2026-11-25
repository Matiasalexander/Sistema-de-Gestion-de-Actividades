import React from 'react';
import {
  Folder,
  Layers,
  Globe,
  Smartphone,
  Sparkles,
  Palette,
  Laptop,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

/**
 * Retorna un icono de Lucide y una clase de fondo distintiva
 * emulando los badges de marca/tipo que aparecen en la referencia.
 */
export const obtenerIconoProyecto = (nombre: string, unidad: string = '') => {
  const texto = `${nombre} ${unidad}`.toLowerCase();

  if (texto.includes('app') || texto.includes('móvil') || texto.includes('mobile') || texto.includes('tablet')) {
    return { Icon: Smartphone, bg: 'bg-blue-600 text-white' };
  }
  if (texto.includes('web') || texto.includes('portal') || texto.includes('site') || texto.includes('landing')) {
    return { Icon: Globe, bg: 'bg-red-600 text-white' };
  }
  if (texto.includes('brand') || texto.includes('diseño') || texto.includes('marca') || texto.includes('logo')) {
    return { Icon: Palette, bg: 'bg-purple-600 text-white' };
  }
  if (texto.includes('dashboard') || texto.includes('sistema') || texto.includes('software')) {
    return { Icon: Laptop, bg: 'bg-blue-500 text-white' };
  }
  if (texto.includes('alumbrado') || texto.includes('servicios') || texto.includes('infraestructura')) {
    return { Icon: Layers, bg: 'bg-emerald-600 text-white' };
  }
  if (texto.includes('marketing') || texto.includes('social') || texto.includes('ad')) {
    return { Icon: Sparkles, bg: 'bg-amber-500 text-white' };
  }

  return { Icon: Folder, bg: 'bg-slate-900 text-white dark:bg-slate-700' };
};

/**
 * Obtiene las iniciales de un nombre (ej. "Juan Pérez" -> "JP")
 */
export const obtenerIniciales = (nombreCompleto?: string): string => {
  if (!nombreCompleto) return 'U';
  const partes = nombreCompleto.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

export const IndicadorPrioridad: React.FC<{ prioridad: string }> = ({ prioridad }) => {
  const p = (prioridad || '').toLowerCase();

  let icono = <ChevronDown className="w-4 h-4 text-emerald-500 shrink-0" />;

  if (p.includes('alta') || p.includes('urgente') || p.includes('crit')) {
    icono = <ChevronsUp className="w-4 h-4 text-red-500 shrink-0" />;
  } else if (p.includes('media') || p.includes('normal')) {
    icono = <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />;
  }

  return (
    <span title={`Prioridad: ${prioridad}`} className="inline-flex items-center">
      {icono}
    </span>
  );
};