import React from 'react';
import type { DashboardMetrics } from '../shared/types';

interface SummaryWidgetsProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
}

export const SummaryWidgets: React.FC<SummaryWidgetsProps> = ({ metrics, isLoading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl" />
      )}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tickets Abiertos (Postgres)</span>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics?.openIncidents ?? 0}</h3>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tickets Resueltos (Postgres)</span>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics?.resolvedIncidents ?? 0}</h3>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nodos Activos (Mongo)</span>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics?.eventsByApp?.length ?? 0}</h3>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Última Caché Redis DB 0</span>
        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mt-2 inline-block">
          {metrics?.cachedAt ? new Date(metrics.cachedAt).toLocaleTimeString() : 'N/A'}
        </span>
      </div>
    </div>
  );
};