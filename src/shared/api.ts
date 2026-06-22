import type { DashboardMetrics, Incident, PaginatedResult } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'legacy-php-dev-key-2026';

let accessToken: string | null = null;

const getOrFetchToken = async (): Promise<string> => {
  if (accessToken) return accessToken;
  const res = await fetch(`${API_URL}/api/auth/token`, { method: 'POST' });
  if (!res.ok) throw new Error('Fallo al obtener token de desarrollo');
  const data = await res.json();
  accessToken = data.accessToken;
  return data.accessToken;
};

export const apiClient = {
  getDevToken: async (): Promise<string> => {
    return getOrFetchToken();
  },

  getMetrics: async (): Promise<DashboardMetrics> => {
    const token = await getOrFetchToken();
    const res = await fetch(`${API_URL}/api/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Fallo al obtener métricas');
    return res.json();
  },

  getIncidents: async (filters: {
    page: number;
    limit: number;
    status?: string;
    severity?: string;
    application?: string;
    date?: string;
  }): Promise<PaginatedResult<Incident>> => {
    const token = await getOrFetchToken();
    const params = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.application && { application: filters.application }),
      ...(filters.date && { date: filters.date }),
    });

    const res = await fetch(`${API_URL}/api/incidents?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-api-key': API_KEY,
      },
    });
    if (!res.ok) throw new Error(`Error al consultar incidentes (${res.status})`);
    return res.json();
  },

  createEvent: async (payload: {
    application: string;
    eventType: string;
    description: string;
    severity: string;
    occurredAt: string;
    metadata: Record<string, any>;
  }): Promise<{ traceId: string }> => {
    const token = await getOrFetchToken();
    const res = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Fallo al registrar el evento');
    }
    return res.json();
  },

  createIncident: async (payload: {
    title: string;
    description: string;
    affectedApplication: string;
    severity: string;
    assignee: string;
    relatedEventTraceIds: string[];
  }): Promise<Incident> => {
    const token = await getOrFetchToken();
    const res = await fetch(`${API_URL}/api/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Error al guardar el incidente');
    }
    return res.json();
  },

  transitionIncident: async (id: string, nextStatus: string): Promise<Incident> => {
    const token = await getOrFetchToken();
    const res = await fetch(`${API_URL}/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Transición de estado denegada');
    }
    return res.json();
  },
};