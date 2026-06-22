import React from 'react';
import type { Incident, PaginatedResult } from '../shared/types';

interface IncidentTableProps {
  incidents: PaginatedResult<Incident> | null;
  handleTransition: (id: string, nextStatus: string) => void;
  page: number;
  setPage: (page: number) => void;
}

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

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
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Incidente</th>
              <th className="py-3 px-4">Aplicación</th>
              <th className="py-3 px-4">Severidad</th>
              <th className="py-3 px-4">Responsable</th>
              <th className="py-3 px-4">Creado</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Transición</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
            {incidents?.data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-xs text-slate-400 font-medium">
                  No hay incidentes registrados.
                </td>
              </tr>
            )}
            {incidents?.data.map((inc) => (
              <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 text-xs">{inc.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inc.id}</div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600">{inc.affectedApp}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    inc.severity === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-700' :
                    inc.severity === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                    inc.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {inc.severity}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-slate-600">{inc.assignee}</td>
                <td className="py-3 px-4 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                  {formatDate(inc.createdAt)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    inc.status === 'OPEN' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    inc.status === 'IN_PROGRESS' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    {inc.status === 'IN_PROGRESS' ? 'EN PROGRESO' : inc.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => handleTransition(inc.id, 'OPEN')} disabled={inc.status === 'OPEN'}
                      className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded hover:bg-amber-100 transition disabled:opacity-25">
                      Abrir
                    </button>
                    <button onClick={() => handleTransition(inc.id, 'IN_PROGRESS')} disabled={inc.status === 'IN_PROGRESS'}
                      className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded hover:bg-blue-100 transition disabled:opacity-25">
                      En progreso
                    </button>
                    <button onClick={() => handleTransition(inc.id, 'RESOLVED')} disabled={inc.status === 'RESOLVED'}
                      className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded hover:bg-emerald-100 transition disabled:opacity-25">
                      Resolver
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {incidents && incidents.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
          <span>Página {page} de {incidents.totalPages} — {incidents.total} incidentes</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 text-xs font-semibold">
              ← Anterior
            </button>
            <button disabled={page === incidents.totalPages} onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 text-xs font-semibold">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
