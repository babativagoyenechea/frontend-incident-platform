import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SummaryWidgets } from '../components/SummaryWidgets';
import { dashboardReducer, initialState } from '../context/DashboardContext';
import '@testing-library/jest-dom';

vi.mock('../shared/api', () => ({
  apiClient: {
    createEvent: vi.fn(),
    getMetrics: vi.fn(),
    getIncidents: vi.fn(),
    createIncident: vi.fn(),
    transitionIncident: vi.fn(),
    getDevToken: vi.fn()
  }
}));

describe('Pruebas del Dashboard de Monitoreo - Coordinadora', () => {
  
  describe('dashboardReducer - Lógica de Estado Pura', () => {
    
    it('Debe mutar los filtros correctamente al procesar la acción SET_FILTERS', () => {
      const action = { type: 'SET_FILTERS' as const, payload: { status: 'RESOLVED', page: 2 } };
      const nextState = dashboardReducer(initialState, action);

      expect(nextState.filters.status).toBe('RESOLVED');
      expect(nextState.filters.page).toBe(2);
    });

    it('Debe acumular logs limitando el buffer de red a un máximo de 30 entradas', () => {
      let state = initialState;
      for (let i = 1; i <= 35; i++) {
        state = dashboardReducer(state, {
          type: 'ADD_LOG',
          payload: { time: '12:00', event: 'SOCKET_EV', payload: `Data ${i}` }
        });
      }
      expect(state.logs.length).toBe(30);
      expect(state.logs[0].payload).toBe('Data 35');
    });
  });

  describe('SummaryWidgets & IncidentFilters - Comportamiento UI', () => {
    
    it('Debe renderizar correctamente los contadores de métricas de la HU4', () => {
      const mockMetrics = {
        openIncidents: 5,
        resolvedIncidents: 12,
        eventsByApp: [{ application: 'billing-service', count: 10 }],
        eventsBySeverity: [{ severity: 'CRITICAL', count: 3 }],
        recentAlerts: [],
        cachedAt: new Date().toISOString(),
      };

      render(<SummaryWidgets metrics={mockMetrics} isLoading={false} />);

      expect(screen.getByText('Tickets Abiertos (Postgres)')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});