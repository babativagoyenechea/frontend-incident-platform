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

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.application) e.application = 'Campo requerido';
    if (!form.eventType.trim()) e.eventType = 'Campo requerido';
    if (!form.description.trim()) e.description = 'Campo requerido';
    try { JSON.parse(form.metadata); } catch { e.metadata = 'JSON inválido'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
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
        showToast('success', `Evento registrado. TraceID: ${data.traceId?.slice(0, 8)}...`);
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
        showToast('success', 'Evento simulado correctamente. Complete el incidente.');
        setActiveTab('incident');
      }
    } catch (err: any) {
      showToast('error', err.message || 'La metadata debe ser JSON válido.');
      setError(err.message || 'La metadata debe ser un JSON de formato válido.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: string) =>
    `w-full bg-slate-50 border text-xs rounded-lg px-3 py-2 ${errors[key] ? 'border-red-400 focus:ring-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-200`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2" data-testid="event-form">

      {toast && (
        <div className={`flex items-center gap-2 text-xs font-semibold px-4 py-3 rounded-lg border ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">APLICACIÓN ORIGEN</label>
          <select value={form.application} onChange={(e) => setForm(prev => ({ ...prev, application: e.target.value }))} className={field('application')}>
            <option value="billing-service">billing-service</option>
            <option value="payment-service">payment-service</option>
            <option value="auth-service">auth-service</option>
          </select>
          {errors.application && <p className="text-[10px] text-red-500 mt-1">{errors.application}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">TIPO EVENTO</label>
          <input type="text" value={form.eventType} onChange={(e) => setForm(prev => ({ ...prev, eventType: e.target.value }))} className={field('eventType')} />
          {errors.eventType && <p className="text-[10px] text-red-500 mt-1">{errors.eventType}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1">SEVERIDAD</label>
          <select value={form.severity} onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))} className={field('severity')}>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 block mb-1">DESCRIPCIÓN</label>
        <input type="text" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} className={field('description')} />
        {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 block mb-1">METADATA (JSON)</label>
        <textarea rows={2} value={form.metadata} onChange={(e) => setForm(prev => ({ ...prev, metadata: e.target.value }))} className={`${field('metadata')} font-mono`} />
        {errors.metadata && <p className="text-[10px] text-red-500 mt-1">{errors.metadata}</p>}
      </div>

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95 shadow-sm">
        Registrar Evento
      </button>
    </form>
  );
};
