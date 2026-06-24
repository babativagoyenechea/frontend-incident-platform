import React, { createContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { DashboardMetrics, Incident, Alert, PaginatedResult } from '../shared/types';

export interface Log {
  time: string;
  event: string;
  payload: string;
}

export interface State {
  metrics: DashboardMetrics | null;
  incidents: PaginatedResult<Incident> | null;
  filters: { status: string; severity: string; application: string; date: string; page: number; limit: number };
  backendOnline: boolean;
  socketConnected: boolean;
  isLoading: boolean;
  error: string | null;
  logs: Log[];
}

export type Action =
  | { type: 'METRICS_UPDATED'; payload: DashboardMetrics }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'INCIDENTS_LOADED'; payload: PaginatedResult<Incident> }
  | { type: 'UPDATE_INCIDENT'; payload: Incident }
  | { type: 'INCIDENT_ADDED'; payload: Incident }
  | { type: 'SET_FILTERS'; payload: Partial<State['filters']> }
  | { type: 'SET_BACKEND_STATUS'; payload: boolean }
  | { type: 'SET_SOCKET_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOG_APPENDED'; payload: Log };

// aliases para compatibilidad con tests existentes
export type { Action as DashboardAction };

export const initialState: State = {
  metrics: null,
  incidents: null,
  filters: { status: '', severity: '', application: '', date: '', page: 1, limit: 10 },
  backendOnline: false,
  socketConnected: false,
  isLoading: false,
  error: null,
  logs: [],
};

export const DashboardContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function dashboardReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'METRICS_UPDATED':
      return { ...state, metrics: action.payload };
    case 'ADD_ALERT':
      if (!state.metrics) return state;
      return {
        ...state,
        metrics: {
          ...state.metrics,
          recentAlerts: [action.payload, ...state.metrics.recentAlerts.slice(0, 9)],
        },
      };
    case 'INCIDENTS_LOADED':
      return { ...state, incidents: action.payload };
    case 'UPDATE_INCIDENT':
      if (!state.incidents) return state;
      return {
        ...state,
        incidents: {
          ...state.incidents,
          data: state.incidents.data.map((inc) =>
            inc.id === action.payload.id ? action.payload : inc
          ),
        },
      };
    case 'INCIDENT_ADDED':
      if (!state.incidents) {
        return {
          ...state,
          incidents: { data: [action.payload], total: 1, page: 1, limit: 10, totalPages: 1 },
        };
      }
      return {
        ...state,
        incidents: {
          ...state.incidents,
          data: [action.payload, ...state.incidents.data],
          total: state.incidents.total + 1,
        },
      };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_BACKEND_STATUS':
      return { ...state, backendOnline: action.payload };
    case 'SET_SOCKET_STATUS':
      return { ...state, socketConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOG_APPENDED':
      return { ...state, logs: [action.payload, ...state.logs.slice(0, 29)] };
    default:
      return state;
  }
}

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};