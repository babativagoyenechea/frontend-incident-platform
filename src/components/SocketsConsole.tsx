import React from 'react';
import type { Log } from '../context/DashboardContext';

interface SocketsConsoleProps {
  logs: Log[];
}

export const SocketsConsole: React.FC<SocketsConsoleProps> = ({ logs }) => {
  return (
    <div className="bg-[#121820] text-slate-200 border border-slate-900 rounded-xl p-5 flex flex-col justify-between shadow-lg">
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white tracking-widest uppercase">Telemetría Sockets (Live)</h3>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        
        {/* OPTIMIZACIÓN TELEMETRÍA: Fuente aumentada de text-[9px] a text-xs/text-sm con altura de línea limpia */}
        <div className="bg-black/50 border border-slate-800/80 rounded-xl p-4 font-mono text-xs md:text-[13px] text-emerald-400 overflow-y-auto h-[290px] space-y-3.5 leading-relaxed">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-20 text-xs md:text-sm leading-normal">
              Esperando tráfico por WebSocket...<br/>Interactúe con el dashboard para disparar logs.
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-900 pb-3 last:border-b-0">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-1">
                  <span>[{log.time}]</span>
                  <span className="font-black text-blue-400 text-xs">{log.event}</span>
                </div>
                <pre className="text-slate-200 mt-1.5 whitespace-pre-wrap leading-relaxed overflow-x-auto">{log.payload}</pre>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};