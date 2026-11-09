import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Printer } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiFetch, DashboardEjecutivo, tokenStorage } from '../../services/api';

export const ReportesPage: React.FC = () => {
  const { unidadActivaId, tienePermiso } = useAuth();

  const { data: dashboard } = useQuery<DashboardEjecutivo>({
    queryKey: ['dashboard', unidadActivaId],
    queryFn: () =>
      apiFetch<DashboardEjecutivo>(
        `/api/dashboard${unidadActivaId ? `?unidadId=${unidadActivaId}` : ''}`
      ),
  });

  const descargarCsv = async (tipo: 'actividades' | 'tickets' | 'productividad') => {
    const token = tokenStorage.getAccess();
    const qs = new URLSearchParams({ tipo });
    if (unidadActivaId) qs.set('unidadId', String(unidadActivaId));

    const resp = await fetch(`/api/reportes/exportar?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return;

    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_${tipo}_GA.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reportesCatalogo = [
    {
      id: 'actividades',
      titulo: 'Reporte Maestro de Actividades, Proyectos y Tiempos',
      descripcion:
        'Incluye código, proyecto, unidad, estado, prioridad, avance, fechas compromiso y minutos trabajados.',
      tipo: 'actividades' as const,
    },
    {
      id: 'tickets',
      titulo: 'Reporte de Mesa de Ayuda, Tiempos de Respuesta y Cumplimiento SLA',
      descripcion:
        'Incluye folio, categoría, solicitante, especialista, fechas de primera respuesta, resolución y estado SLA.',
      tipo: 'tickets' as const,
    },
    {
      id: 'productividad',
      titulo: 'Reporte de Productividad y Carga por Responsable y Unidad',
      descripcion:
        'Comparativa de actividades completadas, vencidas, tickets asignados e índice de cumplimiento por colaborador.',
      tipo: 'productividad' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Reportes Corporativos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Consultas ejecutivas respetando alcance por unidad con exportación a CSV/Excel e impresión PDF.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportesCatalogo.map((rep) => (
          <div
            key={rep.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">{rep.titulo}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{rep.descripcion}</p>
            </div>

            {tienePermiso('reportes.exportar') && (
              <button
                onClick={() => descargarCsv(rep.tipo)}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Exportar CSV / Excel
              </button>
            )}
          </div>
        ))}
      </div>

      {dashboard && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold">Resumen Consolidado de Cumplimiento Operativo</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-slate-500">Cumplimiento SLA</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {dashboard.porcentajeCumplimientoSla}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-slate-500">Tiempo Prom. 1ra Respuesta</div>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {dashboard.tiempoPromedioPrimeraRespuestaMin} min
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-slate-500">Tiempo Prom. Resolución</div>
              <div className="text-xl font-bold text-indigo-600 mt-1">
                {dashboard.tiempoPromedioResolucionMin} min
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <div className="text-slate-500">Actividades Completadas</div>
              <div className="text-xl font-bold text-teal-600 mt-1">
                {dashboard.actividadesCompletadas}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
