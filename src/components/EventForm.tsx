import React, { useState } from 'react';
import { apiClient } from '../shared/api';
import { generateMockId } from '../shared/utils';

interface EventFormProps {
  backendOnline: boolean;
  setIncidentForm: React.Dispatch<React.SetStateAction<any>>;
  setActiveTab: (tab: 'event' | 'incident') => void;
  setError: (msg: string | null) => void;
  setLoading: (loading: boolean) => void;
  addLog: (log: any) => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  backendOnline,
  setIncidentForm,
  setActiveTab,
  setError,
  setLoading,
  addLog
}) => {
  const [form, setForm] = useState({
    application: 'billing-service',
    eventType: 'DATABASE_LOCK',
    description: 'El pool de conexiones de la base de datos de facturación se ha agotado.',
    severity: 'CRITICAL',
    metadata: '{\n  "connections": 50,\n  "max": 50\n}'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedMeta = JSON.parse(form.metadata);
      const payload = { ...form, metadata: parsedMeta, occurredAt: new Date().toISOString() };

      if (backendOnline) {
        setLoading(true);
        const data = await apiClient.createEvent(payload);
        setError(null);
        setIncidentForm((prev: any) => ({
          ...prev,
          relatedEventTraceIds: data.traceId,
          affectedApp: form.application,
          severity: form.severity
        }));
        setActiveTab('incident');
      } else {
        const traceIdSim = generateMockId('trace');
        addLog({
          time: new Date().toLocaleTimeString(),
          event: 'SIMULATION_event_created',
          payload: JSON.stringify(payload, null, 2)
        });
        setIncidentForm((prev: any) => ({
          ...prev,
          relatedEventTraceIds: traceIdSim,
          affectedApp: form.application,
          severity: form.severity
        }));
        setActiveTab('incident');
      }
    } catch (err: any) {
      setError(err.message || 'La metadata debe ser un JSON de formato válido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2" data-testid="event-form">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">APLICACIÓN ORIGEN</label>
          <select
            value={form.application}
            onChange={(e) => setForm(prev => ({ ...prev, application: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-medium"
          >
            <option value="billing-service">billing-service</option>
            <option value="payment-service">payment-service</option>
            <option value="auth-service">auth-service</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">TIPO EVENTO</label>
          <input
            type="text"
            value={form.eventType}
            onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 block mb-1">SEVERIDAD</label>
          <select
            value={form.severity}
            onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-bold"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 block mb-1">DESCRIPCIÓN</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 block mb-1">METADATA (JSON)</label>
        <textarea
          rows={2}
          value={form.metadata}
          onChange={(e) => setForm(prev => ({ ...prev, metadata: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 font-mono text-[10px]"
        />
      </div>
      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-sm">
        Ingestar Evento (POST /api/events)
      </button>
    </form>
  );
};