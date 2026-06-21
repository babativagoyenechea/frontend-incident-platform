import React from 'react';
import type { Incident, PaginatedResult } from '../shared/types';

interface IncidentTableProps {
  incidents: PaginatedResult<Incident> | null;
  handleTransition: (id: string, nextStatus: string) => void;
  page: number;
  setPage: (page: number) => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  handleTransition,
  page,
  setPage
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* OPTIMIZACIÓN CONTRASTE: Cabeceras de tabla más legibles en gris oscuro */}
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-extrabold uppercase tracking-wider">
              <th className="py-4 px-5">Incidente / UUID</th>
              <th className="py-4 px-5">Aplicación</th>
              <th className="py-4 px-5">Severidad</th>
              <th className="py-4 px-5">Responsable</th>
              <th className="py-4 px-5">Estado</th>
              <th className="py-4 px-5 text-right">Transiciones de Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-800">
            {incidents?.data.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-4 px-5">
                  <div className="font-bold text-slate-900 text-[13px] md:text-sm">{inc.title}</div>
                  {/* OPTIMIZACIÓN TEXTOS SECUNDARIOS: IDs legibles y visibles en gris oscuro */}
                  <div className="text-xs text-slate-600 font-mono mt-1 font-semibold">ID: {inc.id}</div>
                </td>
                <td className="py-4 px-5 font-mono text-xs text-slate-700 font-bold">{inc.affectedApp}</td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${inc.severity === 'CRITICAL' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-slate-100 border-slate-250 text-slate-700'}`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="py-4 px-5 text-slate-700 font-bold">{inc.assignee}</td>
                <td className="py-4 px-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${inc.status === 'OPEN' ? 'bg-amber-50 border-amber-300 text-amber-800' : inc.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
                    {inc.status}
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => handleTransition(inc.id, 'OPEN')} disabled={inc.status === 'OPEN'} className="px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold rounded-lg hover:bg-amber-100 transition disabled:opacity-30">OPEN</button>
                    <button onClick={() => handleTransition(inc.id, 'IN_PROGRESS')} disabled={inc.status === 'IN_PROGRESS'} className="px-2.5 py-1.5 bg-blue-50 text-blue-800 border border-blue-300 text-xs font-bold rounded-lg hover:bg-blue-100 transition disabled:opacity-30">PROGRESS</button>
                    <button onClick={() => handleTransition(inc.id, 'RESOLVED')} disabled={inc.status === 'RESOLVED'} className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg hover:bg-emerald-100 transition disabled:opacity-30">RESOLVED</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incidents && incidents.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm font-bold text-slate-700">
          <span>Página {page} de {incidents.totalPages} ({incidents.total} incidentes)</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3.5 py-2 border border-slate-350 rounded-lg hover:bg-slate-50 disabled:opacity-30 font-bold"
            >
              Anterior
            </button>
            <button
              disabled={page === incidents.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3.5 py-2 border border-slate-350 rounded-lg hover:bg-slate-50 disabled:opacity-30 font-bold"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
