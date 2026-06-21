import type { DashboardMetrics, Incident, PaginatedResult } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let accessToken: string | null = null;

/**
 * Helper interno: Garantiza el retorno de un token JWT firmado de forma asíncrona
 */
const getOrFetchToken = async (): Promise<string> => {
  if (accessToken) return accessToken;
  
  const res = await fetch(`${API_URL}/api/auth/token`, { method: 'POST' });
  if (!res.ok) throw new Error('Fallo al obtener token criptográfico de desarrollo');
  const data = await res.json();
  accessToken = data.accessToken;
  return data.accessToken;
};

export const apiClient = {
  /**
   * Expone la carga del token inicial para uso externo (como Sockets)
   */
  getDevToken: async (): Promise<string> => {
    return getOrFetchToken();
  },

  /**
   * Obtiene las estadísticas agregadas consumiendo el caché Redis DB0 (HU4)
   */
  getMetrics: async (): Promise<DashboardMetrics> => {
    const token = await getOrFetchToken(); // Auto-resuelve token de forma transparente
    const res = await fetch(`${API_URL}/api/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Fallo al obtener métricas consolidadas');
    return res.json();
  },

  /**
   * Consulta incidentes paginados y filtrados en caliente (PostgreSQL - HU2 + HU4)
   */
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
        'x-api-key': 'dev-key' // Consumo HU5 con API Key de desarrollo
      }
    });
    if (!res.ok) throw new Error('Error al consultar incidentes paginados');
    return res.json();
  },

  /**
   * Envía un evento con metadatos variables a MongoDB (HU1)
   */
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
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Fallo de red al registrar el evento');
    }
    return res.json();
  },

  /**
   * Registra un incidente transaccional mapeado en Postgres (HU2)
   */
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
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Error al guardar el incidente relacional');
    }
    return res.json();
  },

  /**
   * Avanza la máquina de estados del incidente en Postgres (HU2)
   */
  transitionIncident: async (id: string, nextStatus: string): Promise<Incident> => {
    const token = await getOrFetchToken();
    const res = await fetch(`${API_URL}/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Transición de estado denegada por la máquina de estados');
    }
    return res.json();
  }
};