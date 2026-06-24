import React, { useRef, useEffect } from 'react';
import type { Log } from '../context/DashboardContext';

interface SocketsConsoleProps {
  logs: Log[];
}

const EVENT_CONFIG: Record<string, {
  badge: string;        // clases del badge de evento
  rowEven: string;      // fondo fila par
  rowOdd: string;       // fondo fila impar
  icon: string;         // emoji de apoyo visual
  label: string;        // nombre legible
  description: string;  // explicación para usuario no técnico
}> = {
  'metrics.updated': {
    badge:       'text-blue-700 bg-blue-100 border-blue-300',
    rowEven:     'bg-blue-50/60  border-blue-200',
    rowOdd:      'bg-white       border-blue-100',
    icon:        '📊',
    label:       'Métricas actualizadas',
    description: 'El sistema recalculó los contadores del panel (incidentes abiertos, alertas, etc.) porque algo cambió en tiempo real.',
  },
  'incident.updated': {
    badge:       'text-amber-700 bg-amber-100 border-amber-300',
    rowEven:     'bg-amber-50/60 border-amber-200',
    rowOdd:      'bg-white       border-amber-100',
    icon:        '🔄',
    label:       'Incidente actualizado',
    description: 'Un incidente existente cambió de estado (por ejemplo, de Abierto a En Progreso o Resuelto).',
  },
  'alert.created': {
    badge:       'text-emerald-700 bg-emerald-100 border-emerald-300',
    rowEven:     'bg-emerald-50/60 border-emerald-200',
    rowOdd:      'bg-white         border-emerald-100',
    icon:        '🚨',
    label:       'Nueva alerta generada',
    description: 'El sistema detectó un evento crítico y generó una alerta automáticamente para que el equipo la revise.',
  },
  'SOCKET_CONNECTED': {
    badge:       'text-teal-700 bg-teal-100 border-teal-300',
    rowEven:     'bg-teal-50/50 border-teal-200',
    rowOdd:      'bg-white      border-teal-100',
    icon:        '🟢',
    label:       'Conexión establecida',
    description: 'Su navegador se conectó exitosamente al servidor. Desde ahora recibirá actualizaciones automáticas sin recargar la página.',
  },
  'SOCKET_DISCONNECTED': {
    badge:       'text-red-700 bg-red-100 border-red-300',
    rowEven:     'bg-red-50/50 border-red-200',
    rowOdd:      'bg-white     border-red-100',
    icon:        '🔴',
    label:       'Conexión perdida',
    description: 'Se perdió la comunicación con el servidor. El sistema intentará reconectarse solo. No se perderá ningún dato.',
  },
  'SIMULATION_event_created': {
    badge:       'text-violet-700 bg-violet-100 border-violet-300',
    rowEven:     'bg-violet-50/60 border-violet-200',
    rowOdd:      'bg-white        border-violet-100',
    icon:        '🧪',
    label:       'Evento simulado (modo local)',
    description: 'El backend no está disponible, así que el sistema creó un evento de prueba local para que pueda continuar trabajando.',
  },
};

const DEFAULT_CONFIG = {
  badge:       'text-slate-600 bg-slate-100 border-slate-300',
  rowEven:     'bg-slate-50/50 border-slate-200',
  rowOdd:      'bg-white       border-slate-100',
  icon:        '📡',
  label:       'Evento del sistema',
  description: 'Se recibió una señal del servidor con información de operación interna.',
};

const getConfig = (event: string) => EVENT_CONFIG[event] ?? DEFAULT_CONFIG;

export const SocketsConsole: React.FC<SocketsConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll al tope cuando llega un nuevo log (el más nuevo está arriba)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl flex flex-col shadow-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase">Telemetría Sockets</h3>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono font-semibold">NestJS → React</span>
          {logs.length > 0 && (
            <span className="text-[10px] text-slate-400 font-semibold">
              Más reciente arriba ↑
            </span>
          )}
        </div>
      </div>

      {/* ── Área de logs ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px] max-h-[400px]"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xl">
              📡
            </div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Esperando actualizaciones del servidor...
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Cuando registre un evento o incidente, aparecerá aquí automáticamente con una explicación de lo que ocurrió.
            </p>
          </div>
        ) : (
          // Los logs ya vienen ordenados: el más nuevo en índice 0
          logs.map((log, idx) => {
            const cfg = getConfig(log.event);
            const isEven = idx % 2 === 0;
            const rowClass = isEven ? cfg.rowEven : cfg.rowOdd;

            return (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden shadow-sm transition-all ${rowClass} ${idx === 0 ? 'ring-2 ring-offset-1 ring-blue-300/50' : ''}`}
              >
                {/* Cabecera del log */}
                <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{cfg.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-tight truncate">
                        {cfg.label}
                        {idx === 0 && (
                          <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded-full align-middle">
                            NUEVO
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                        {cfg.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold whitespace-nowrap">
                      {log.time}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${cfg.badge}`}>
                      {log.event}
                    </span>
                  </div>
                </div>

                {/* Datos técnicos (colapsados visualmente pero legibles) */}
                <details className="group">
                  <summary className="cursor-pointer px-4 py-1.5 bg-black/5 text-[10px] font-semibold text-slate-500 hover:text-slate-700 select-none flex items-center gap-1 list-none">
                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                    Ver datos técnicos del servidor
                  </summary>
                  <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap leading-relaxed bg-black/5 px-4 py-3 border-t border-slate-200/50 overflow-x-auto">
                    {log.payload}
                  </pre>
                </details>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-500 font-semibold">
          {logs.length} actualización{logs.length !== 1 ? 'es' : ''} recibida{logs.length !== 1 ? 's' : ''}
        </span>
        <span className="text-[11px] text-emerald-500 font-bold font-mono">● CONECTADO</span>
      </div>
    </div>
  );
};
