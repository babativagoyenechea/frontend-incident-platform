import React from 'react';

interface IncidentFiltersProps {
  filters: { status: string; severity: string; application: string; date: string };
  setFilters: (newFilters: any) => void;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      <input
        type="text"
        placeholder="Filtro App..."
        aria-label="Filtro App"
        value={filters.application}
        onChange={(e) => setFilters({ application: e.target.value, page: 1 })}
        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
      />
      <input
        type="date"
        aria-label="Filtro Fecha"
        value={filters.date}
        onChange={(e) => setFilters({ date: e.target.value, page: 1 })}
        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none text-slate-500 font-semibold"
      />
      <select
        value={filters.status}
        aria-label="Filtro Estado"
        onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
      >
        <option value="">Filtro Estado</option>
        <option value="OPEN">OPEN</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="RESOLVED">RESOLVED</option>
      </select>
      <select
        value={filters.severity}
        aria-label="Filtro Severidad"
        onChange={(e) => setFilters({ severity: e.target.value, page: 1 })}
        className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none"
      >
        <option value="">Filtro Severidad</option>
        <option value="CRITICAL">CRITICAL</option>
        <option value="HIGH">HIGH</option>
        <option value="MEDIUM">MEDIUM</option>
        <option value="LOW">LOW</option>
      </select>
    </div>
  );
};