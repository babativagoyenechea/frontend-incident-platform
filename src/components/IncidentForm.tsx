import React, { useState } from 'react';
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

interface InlineToast {
  type: 'success' | 'error';
  title: string;
  detail: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const IncidentForm: React.FC<IncidentFormProps> = ({
  backendOnline,
  form,
  setForm,
  setError,
  setLoading,
  addIncidentLocal,
  fetchMetrics,
  fetchIncidents,
}) => {
  const [toast, setToast] = useState<InlineToast | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title?.trim())       e.title       = 'El título es obligatorio';
    if (!form.affectedApp?.trim()) e.affectedApp = 'Indica la aplicación afectada';
    if (!form.assignee?.trim())    e.assignee    = 'Asigna un responsable';
    if (!form.description?.trim()) e.description = 'Describe brevemente el problema';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const showToast = (t: InlineToast) => {
    setToast(t);
    setTimeout(() => setToast(null), 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    const traceIds = form.relatedEventTraceIds
      ? form.relatedEventTraceIds.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title:                form.title,
      description:          form.description,
      affectedApplication:  form.affectedApp,
      severity:             form.severity,
      assignee:             form.assignee,
      relatedEventTraceIds: traceIds,
    };

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (backendOnline) {
        const created = await apiClient.createIncident(payload);
        setError(null);
        fetchMetrics();
        fetchIncidents();
        showToast({
          type:   'success',
          title:  '✅ Incidente registrado correctamente',
          detail: `"${created.title}" fue guardado en la base de datos con ID ${created.id?.slice(0, 8)}... y estado ABIERTO. El equipo responsable ya puede verlo en la grilla.`,
        });
        // Limpiar solo los campos dinámicos (mantener severity y assignee)
        setForm((prev: any) => ({
          ...prev,
          title:                '',
          description:          '',
          relatedEventTraceIds: '',
        }));
      } else {
        // Modo simulación offline
        const uuidSim = generateMockId('uuid');
        const mockInc = {
          id:                   uuidSim,
          title:                form.title,
          description:          form.description,
          affectedApp:          form.affectedApp,
          severity:             form.severity,
          status:               'OPEN',
          assignee:             form.assignee,
          relatedEventTraceIds: traceIds,
          createdAt:            new Date().toISOString(),
          updatedAt:            new Date().toISOString(),
        };
        addIncidentLocal(mockInc);
        showToast({
          type:   'success',
          title:  '🧪 Incidente creado en modo simulación',
          detail: `No hay conexión con el servidor, pero el incidente "${form.title}" se añadió localmente (ID ${uuidSim.slice(0, 8)}...). Se sincronizará cuando el backend esté disponible.`,
        });
        setForm((prev: any) => ({
          ...prev,
          title:                '',
          description:          '',
          relatedEventTraceIds: '',
        }));
      }
    } catch (err: any) {
      const msg = err.message || 'No se pudo guardar el incidente. Intente de nuevo.';
      showToast({
        type:   'error',
        title:  '❌ No se pudo registrar el incidente',
        detail: msg,
      });
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const fieldClass = (key: string) =>
    `w-full bg-slate-50 border text-sm rounded-lg px-3 py-2 transition focus:outline-none focus:ring-2 ${
      fieldErrors[key]
        ? 'border-red-400 focus:ring-red-300 bg-red-50/40'
        : 'border-slate-200 focus:ring-blue-200'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2" noValidate>

      {/* ── Notificación de resultado ── */}
      {toast && (
        <div
          className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 shadow-sm animate-fade-in ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
          role="alert"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-snug">{toast.title}</p>
            <p className="text-xs mt-1 leading-relaxed opacity-80">{toast.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="shrink-0 text-current opacity-50 hover:opacity-100 transition font-bold text-sm mt-0.5"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Fila 1: Título / App / Severidad ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej: Caída del servicio de pagos"
            value={form.title}
            onChange={(e) => setForm((p: any) => ({ ...p, title: e.target.value }))}
            className={fieldClass('title')}
          />
          {fieldErrors.title && (
            <p className="text-[11px] text-red-500 mt-1">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
            App afectada <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="billing-service"
            value={form.affectedApp}
            onChange={(e) => setForm((p: any) => ({ ...p, affectedApp: e.target.value }))}
            className={`${fieldClass('affectedApp')} font-mono`}
          />
          {fieldErrors.affectedApp && (
            <p className="text-[11px] text-red-500 mt-1">{fieldErrors.affectedApp}</p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
            Severidad
          </label>
          <select
            value={form.severity}
            onChange={(e) => setForm((p: any) => ({ ...p, severity: e.target.value }))}
            className={fieldClass('severity')}
          >
            {Object.entries(SEVERITY_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl} ({val})</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Fila 2: Responsable / Trace IDs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
            Responsable <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="ingeniero@empresa.com"
            value={form.assignee}
            onChange={(e) => setForm((p: any) => ({ ...p, assignee: e.target.value }))}
            className={fieldClass('assignee')}
          />
          {fieldErrors.assignee && (
            <p className="text-[11px] text-red-500 mt-1">{fieldErrors.assignee}</p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
            Trace IDs asociados
          </label>
          <input
            type="text"
            placeholder="Se rellena automáticamente al crear un evento..."
            value={form.relatedEventTraceIds}
            onChange={(e) => setForm((p: any) => ({ ...p, relatedEventTraceIds: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      {/* ── Descripción ── */}
      <div>
        <label className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wide">
          Descripción del problema <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="Explique brevemente qué está fallando y cuál es el impacto..."
          value={form.description}
          onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))}
          className={fieldClass('description')}
        />
        {fieldErrors.description && (
          <p className="text-[11px] text-red-500 mt-1">{fieldErrors.description}</p>
        )}
      </div>

      {/* ── Botón ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-lg transition active:scale-95 shadow-sm flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            'Registrar Incidente'
          )}
        </button>
        {!backendOnline && (
          <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            ⚠ Modo simulación — sin conexión al servidor
          </span>
        )}
      </div>
    </form>
  );
};
