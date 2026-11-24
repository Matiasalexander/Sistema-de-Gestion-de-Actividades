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

export const obtenerIconoProyecto = (nombre: string, unidad:string = '') => {
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
 * Obtiene las iniciales de un nombre (ej. "Juan Pérez" -> "JP") //NOTA PARA MATÍAS EL CÓDIGO ANTERIOR SE PUEDE REFACTOTIZAR PARA USAR UN ARREGLO QUE
 * INVLUCRE LAS PALABARAS CLAVE, ASÍ COMO ICONOS Y BG COLOR, SIN EMBARGO POR MOTIVOS DE TIEMPO SE DEJA TAL CUAL MARCA ANTIGRAVITY, A LA BREVEDAD SE PASARÁ
 * AL ARREGLO DINÁMICO :).
 */
export const obtenerIniciales = (nombreCompleto?: string): string => {
  if (!nombreCompleto) return 'U';
  const partes = nombreCompleto.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
};

export const IndicadorPrioridad: React.FC<{prioridad: string}> = ({prioridad}) => {
    const p = (prioridad    || '').toLocaleLowerCase();
};
