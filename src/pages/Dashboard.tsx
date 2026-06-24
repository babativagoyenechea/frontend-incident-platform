import React, { useContext, useState } from 'react';
import { DashboardContext } from '../context/DashboardContext';
import { useLiveMetrics } from '../hooks/useLiveMetrics';
import { SummaryWidgets } from '../components/SummaryWidgets';
import { SocketsConsole } from '../components/SocketsConsole';
import { EventForm } from '../components/EventForm';
import { IncidentForm } from '../components/IncidentForm';
import { IncidentFilters } from '../components/IncidentFilters';
import { IncidentTable } from '../components/IncidentTable';
import { apiClient } from '../shared/api';

export const Dashboard: React.FC = () => {
  const { fetchMetrics, fetchIncidents } = useLiveMetrics();
  const context = useContext(DashboardContext);
  if (!context) return null;
  const { state, dispatch } = context;

  const [activeFormTab, setActiveTab] = useState<'event' | 'incident'>('event');
  const [incidentForm, setIncidentForm] = useState({
    title: 'Sobrecarga masiva en pasarela',
    description: 'Fallo de timeout en base de datos de facturación.',
    affectedApp: 'billing-service',
    severity: 'CRITICAL',
    assignee: '',
    relatedEventTraceIds: ''
  });

  const setFilters = (newFilters: any) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
  };

  const handleTransition = async (id: string, nextStatus: string) => {
    const incident = state.incidents?.data.find(i => i.id === id);
    if (!incident) return;

    try {
      if (state.backendOnline) {
        dispatch({ type: 'SET_LOADING', payload: true });
        await apiClient.transitionIncident(id, nextStatus);
        dispatch({ type: 'SET_ERROR', payload: null });
        fetchMetrics();
        fetchIncidents();
      } else {
        // Lógica de simulación offline
        const transitions: Record<string, string[]> = {
          OPEN: ['IN_PROGRESS'],
          IN_PROGRESS: ['RESOLVED', 'OPEN'],
          RESOLVED: []
        };

        if (transitions[incident.status]?.includes(nextStatus)) {
          dispatch({ type: 'SET_ERROR', payload: null });
          dispatch({ 
            type: 'UPDATE_INCIDENT', 
            payload: { ...incident, status: nextStatus, updatedAt: new Date().toISOString() } 
          });
        } else {
          dispatch({ 
            type: 'SET_ERROR', 
            payload: `Error 409 Conflict: Transición de ${incident.status} a ${nextStatus} prohibida.` 
          });
        }
      }
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased">
      <aside className="w-full md:w-64 bg-[#0b1329] text-slate-200 p-5 flex flex-col justify-between border-r border-slate-900 shadow-xl shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
            <div className="bg-blue-600 p-2.5 rounded-lg text-white font-bold text-xs">CO</div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white">Coordinadora</h1>
              <p className="text-xs text-slate-300 font-extrabold tracking-widest uppercase">TI Telemetría</p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Módulos</span>
            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-blue-600/20 border border-blue-500/30 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
              <span className="text-xs font-bold text-blue-300">Dashboard operacional</span>
            </div>
          </div>
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 space-y-3.5">
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest block">Estado del Sistema</span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">API REST</span>
              <span className={`font-black flex items-center gap-1.5 ${state.backendOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${state.backendOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                {state.backendOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">WebSocket</span>
              <span className={`font-black flex items-center gap-1.5 ${state.socketConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${state.socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {state.socketConnected ? 'Activo' : 'Simulación'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-600 font-mono text-center">Coordinadora © 2026</div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-md font-bold text-slate-900 tracking-tight">Centro de Mandos y Diagnóstico</h2>
            <p className="text-xs text-slate-500">Monitoreo operacional en tiempo real</p>
          </div>
        </header>

        <main className="p-6 space-y-6 overflow-y-auto">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xl flex items-center justify-between">
              <span className="font-semibold">{state.error}</span>
              <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="font-bold hover:text-red-950">✖</button>
            </div>
          )}

          <SummaryWidgets metrics={state.metrics} isLoading={state.isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex border-b border-slate-200 pb-3 gap-4">
                <button
                  onClick={() => setActiveTab('event')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition ${activeFormTab === 'event' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  1. Ingesta Eventos (HU1 MongoDB)
                </button>
                <button
                  onClick={() => setActiveTab('incident')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition ${activeFormTab === 'incident' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  2. Registro Incidente (HU2 Postgres)
                </button>
              </div>

              {activeFormTab === 'event' ? (
                <EventForm
                  backendOnline={state.backendOnline}
                  setIncidentForm={setIncidentForm}
                  setActiveTab={setActiveTab}
                  setError={(msg) => dispatch({ type: 'SET_ERROR', payload: msg })}
                  setLoading={(l) => dispatch({ type: 'SET_LOADING', payload: l })}
                  addLog={(log) => dispatch({ type: 'LOG_APPENDED', payload: log })}
                />
              ) : (
                <IncidentForm
                  backendOnline={state.backendOnline}
                  form={incidentForm}
                  setForm={setIncidentForm}
                  setError={(msg) => dispatch({ type: 'SET_ERROR', payload: msg })}
                  setLoading={(l) => dispatch({ type: 'SET_LOADING', payload: l })}
                  addIncidentLocal={(inc) => dispatch({ type: 'INCIDENT_ADDED', payload: inc })}
                  fetchMetrics={fetchMetrics}
                  fetchIncidents={fetchIncidents}
                />
              )}
            </div>

            <div className="lg:col-span-3">
              <SocketsConsole logs={state.logs} />
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">Grilla de Incidentes (PostgreSQL)</h3>
                <p className="text-xs text-slate-600 font-semibold mt-1">Transiciones con consistencia ACID aplicadas en tiempo real</p>
              </div>
              <IncidentFilters filters={state.filters} setFilters={setFilters} />
            </div>

            <IncidentTable
              incidents={state.incidents}
              handleTransition={handleTransition}
              page={state.filters.page}
              setPage={(p) => dispatch({ type: 'SET_FILTERS', payload: { page: p } })}
            />
          </section>
        </main>
      </div>
    </div>
  );
};