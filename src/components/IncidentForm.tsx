import React from 'react';
import { apiClient } from '../shared/api';
import { generateMockId } from '../shared/utils';

interface IncidentFormProps {
  backendOnline: boolean;
  form: any;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setError: (msg: string | null) => void;
  setLoading: (loading: boolean) => void;
  addIncidentLocal: (inc: any) => void;
  fetchMetrics: () => void;
  fetchIncidents: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  backendOnline,
  form,
  setForm,
  setError,
  setLoading,
  addIncidentLocal,
  fetchMetrics,
  fetchIncidents
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const traceIds = form.relatedEventTraceIds ? form.relatedEventTraceIds.split(',').map((t: string) => t.trim()) : [];
    const payload = {
      title: form.title,
      description: form.description,
      affectedApplication: form.affectedApp,
      severity: form.severity,
      assignee: form.assignee,
      relatedEventTraceIds: traceIds
    };

    try {
      if (backendOnline) {
        setLoading(true);
        await apiClient.createIncident(payload);
        setError(null);
        fetchMetrics();
        fetchIncidents();
      } else {
        const uuidSim = generateMockId('uuid');
        const mockInc = {
          id: uuidSim,
          title: form.title,
          description: form.description,
          affectedApp: form.affectedApp,
          severity: form.severity,
          status: 'OPEN',
          assignee: form.assignee,
          relatedEventTraceIds: traceIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        addIncidentLocal(mockInc);
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el incidente relacional.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">TÍTULO TICKET</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((prev: any) => ({ ...prev, title: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">APP AFECTADA</label>
          <input
            type="text"
            value={form.affectedApp}
            onChange={(e) => setForm((prev: any) => ({ ...prev, affectedApp: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">SEVERIDAD</label>
          <select
            value={form.severity}
            onChange={(e) => setForm((prev: any) => ({ ...prev, severity: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-bold"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">RESPONSABLE ASIGNADO</label>
          <input
            type="text"
            value={form.assignee}
            onChange={(e) => setForm((prev: any) => ({ ...prev, assignee: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">TRACE IDS ASOCIADOS</label>
          <input
            type="text"
            placeholder="Mande un evento para rellenar automáticamente..."
            value={form.relatedEventTraceIds}
            onChange={(e) => setForm((prev: any) => ({ ...prev, relatedEventTraceIds: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 block mb-1">DESCRIPCIÓN DEL PROBLEMA</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2"
        />
      </div>
      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-sm">
        Registrar Ticket (POST /api/incidents)
      </button>
    </form>
  );
};