import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { dashboardReducer, initialState } from '../context/DashboardContext';
import type { State, Action } from '../context/DashboardContext';
import { SummaryWidgets } from '../components/SummaryWidgets';
import { IncidentTable } from '../components/IncidentTable';
import { EventForm } from '../components/EventForm';
import { IncidentForm } from '../components/IncidentForm';
import type { DashboardMetrics, Incident, PaginatedResult } from '../shared/types';
import { apiClient } from '../shared/api';

// ─── Mock global del cliente HTTP ────────────────────────────────────────────
vi.mock('../shared/api', () => ({
  apiClient: {
    createEvent:        vi.fn(),
    createIncident:     vi.fn(),
    getMetrics:         vi.fn(),
    getIncidents:       vi.fn(),
    transitionIncident: vi.fn(),
    getDevToken:        vi.fn(),
  },
}));

// ─── Fixtures reutilizables ───────────────────────────────────────────────────
const mockMetrics: DashboardMetrics = {
  openIncidents:     3,
  resolvedIncidents: 7,
  eventsByApp:       [{ application: 'billing-service', count: 12 }],
  eventsBySeverity:  [{ severity: 'CRITICAL', count: 4 }],
  recentAlerts:      [],
  cachedAt:          '2026-06-21T12:00:00.000Z',
};

const mockIncident: Incident = {
  id:                   'uuid-001',
  title:                'Fallo en pasarela de pagos',
  description:          'El gateway no responde',
  affectedApp:          'payment-service',
  severity:             'CRITICAL',
  status:               'OPEN',
  assignee:             'ops@empresa.com',
  relatedEventTraceIds: ['trace-abc'],
  createdAt:            '2026-06-21T10:00:00.000Z',
  updatedAt:            '2026-06-21T10:00:00.000Z',
};

const mockPaginated: PaginatedResult<Incident> = {
  data:       [mockIncident],
  total:      1,
  page:       1,
  limit:      10,
  totalPages: 1,
};

// =============================================================================
// 1. REDUCER — Lógica de estado pura (sin renderizado)
// =============================================================================
describe('dashboardReducer — Estado global', () => {

  it('retorna el estado inicial sin mutaciones cuando recibe una acción desconocida', () => {
    const result = dashboardReducer(initialState, { type: 'UNKNOWN' } as unknown as Action);
    expect(result).toEqual(initialState);
  });

  it('SET_METRICS reemplaza las métricas completas en el estado', () => {
    const action: Action = { type: 'SET_METRICS', payload: mockMetrics };
    const next = dashboardReducer(initialState, action);
    expect(next.metrics?.openIncidents).toBe(3);
    expect(next.metrics?.resolvedIncidents).toBe(7);
  });

  it('ADD_ALERT antepone la nueva alerta y conserva un máximo de 10 en la lista', () => {
    // Estado previo con métricas cargadas y 10 alertas ya existentes
    const tenAlerts = Array.from({ length: 10 }, (_, i) => ({
      id: `alert-${i}`,
      sourceTraceId:       `tr-${i}`,
      affectedApplication: 'auth-service',
      severity:            'HIGH',
      generatedAt:         new Date().toISOString(),
      processingStatus:    'PROCESSED',
    }));

    const stateWithMetrics: State = {
      ...initialState,
      metrics: { ...mockMetrics, recentAlerts: tenAlerts },
    };

    const newAlert = {
      id:                  'alert-new',
      sourceTraceId:       'tr-new',
      affectedApplication: 'billing-service',
      severity:            'CRITICAL',
      generatedAt:         new Date().toISOString(),
      processingStatus:    'PROCESSED',
    };

    const next = dashboardReducer(stateWithMetrics, { type: 'ADD_ALERT', payload: newAlert });
    expect(next.metrics!.recentAlerts[0].id).toBe('alert-new');
    expect(next.metrics!.recentAlerts.length).toBe(10);
  });

  it('ADD_ALERT no modifica el estado si metrics es null', () => {
    const action: Action = { type: 'ADD_ALERT', payload: { id: 'x' } as any };
    const next = dashboardReducer(initialState, action);
    expect(next.metrics).toBeNull();
  });

  it('UPDATE_INCIDENT reemplaza solo el incidente con el id coincidente', () => {
    const stateWithIncidents: State = { ...initialState, incidents: mockPaginated };
    const updated: Incident = { ...mockIncident, status: 'IN_PROGRESS' };
    const next = dashboardReducer(stateWithIncidents, { type: 'UPDATE_INCIDENT', payload: updated });
    expect(next.incidents!.data[0].status).toBe('IN_PROGRESS');
  });

  it('ADD_INCIDENT_LOCAL inicializa la lista cuando incidents es null', () => {
    const next = dashboardReducer(initialState, { type: 'ADD_INCIDENT_LOCAL', payload: mockIncident });
    expect(next.incidents!.data).toHaveLength(1);
    expect(next.incidents!.total).toBe(1);
  });

  it('ADD_INCIDENT_LOCAL incrementa el total cuando ya existen incidentes', () => {
    const stateWithIncidents: State = { ...initialState, incidents: mockPaginated };
    const anotherIncident: Incident = { ...mockIncident, id: 'uuid-002' };
    const next = dashboardReducer(stateWithIncidents, { type: 'ADD_INCIDENT_LOCAL', payload: anotherIncident });
    expect(next.incidents!.data).toHaveLength(2);
    expect(next.incidents!.total).toBe(2);
  });

  it('SET_FILTERS fusiona parcialmente sin borrar los campos no enviados', () => {
    const next = dashboardReducer(initialState, {
      type: 'SET_FILTERS',
      payload: { status: 'RESOLVED', page: 3 },
    });
    expect(next.filters.status).toBe('RESOLVED');
    expect(next.filters.page).toBe(3);
    // Campos no enviados se conservan con su valor original
    expect(next.filters.severity).toBe('');
    expect(next.filters.limit).toBe(10);
  });

  it('ADD_LOG mantiene el buffer limitado a 30 entradas y pone el más reciente primero', () => {
    let state = initialState;
    for (let i = 1; i <= 35; i++) {
      state = dashboardReducer(state, {
        type: 'ADD_LOG',
        payload: { time: '12:00', event: 'WS_EVENT', payload: `msg-${i}` },
      });
    }
    expect(state.logs).toHaveLength(30);
    expect(state.logs[0].payload).toBe('msg-35');
  });

  it('SET_LOADING y SET_ERROR actualizan sus campos de forma independiente', () => {
    const s1 = dashboardReducer(initialState, { type: 'SET_LOADING', payload: true });
    expect(s1.isLoading).toBe(true);

    const s2 = dashboardReducer(s1, { type: 'SET_ERROR', payload: 'Fallo de red' });
    expect(s2.error).toBe('Fallo de red');
    expect(s2.isLoading).toBe(true); // no debe haber sido tocado
  });

  it('SET_BACKEND_STATUS y SET_SOCKET_STATUS son independientes entre sí', () => {
    const s1 = dashboardReducer(initialState, { type: 'SET_BACKEND_STATUS', payload: true });
    const s2 = dashboardReducer(s1, { type: 'SET_SOCKET_STATUS', payload: true });
    expect(s2.backendOnline).toBe(true);
    expect(s2.socketConnected).toBe(true);
  });
});

// =============================================================================
// 2. SummaryWidgets — Renderizado de métricas (HU4)
// =============================================================================
describe('SummaryWidgets — Métricas del dashboard', () => {

  it('muestra ceros cuando metrics es null', () => {
    render(<SummaryWidgets metrics={null} isLoading={false} />);
    // Todos los contadores deben mostrar 0 por defecto
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(3);
  });

  it('muestra los contadores de incidentes abiertos y resueltos correctamente', () => {
    render(<SummaryWidgets metrics={mockMetrics} isLoading={false} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('muestra el número de nodos activos basado en eventsByApp', () => {
    render(<SummaryWidgets metrics={mockMetrics} isLoading={false} />);
    // mockMetrics tiene 1 entrada en eventsByApp → 1 nodo activo
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('muestra N/A en el widget de caché cuando metrics es null', () => {
    render(<SummaryWidgets metrics={null} isLoading={false} />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('muestra la hora de caché formateada cuando metrics tiene cachedAt', () => {
    render(<SummaryWidgets metrics={mockMetrics} isLoading={false} />);
    // Debe mostrar una hora formateada, no el string ISO
    expect(screen.queryByText('N/A')).not.toBeInTheDocument();
  });
});

// =============================================================================
// 3. IncidentTable — Tabla de incidentes con transiciones (HU2)
// =============================================================================
describe('IncidentTable — Tabla de incidentes', () => {

  it('renderiza el título y el UUID del incidente en la tabla', () => {
    render(
      <IncidentTable
        incidents={mockPaginated}
        handleTransition={vi.fn()}
        page={1}
        setPage={vi.fn()}
      />
    );
    expect(screen.getByText('Fallo en pasarela de pagos')).toBeInTheDocument();
    expect(screen.getByText(/uuid-001/)).toBeInTheDocument();
  });

  it('deshabilita el botón del estado actual del incidente', () => {
    // El incidente está en OPEN → el botón OPEN debe estar disabled
    render(
      <IncidentTable
        incidents={mockPaginated}
        handleTransition={vi.fn()}
        page={1}
        setPage={vi.fn()}
      />
    );
    const openButtons = screen.getAllByRole('button', { name: 'OPEN' });
    // El botón de la fila (no el badge de estado) debe estar deshabilitado
    const transitionBtn = openButtons.find(btn => btn.hasAttribute('disabled'));
    expect(transitionBtn).toBeDefined();
  });

  it('llama a handleTransition con el id e IN_PROGRESS al hacer clic en PROGRESS', () => {
    const handleTransition = vi.fn();
    render(
      <IncidentTable
        incidents={mockPaginated}
        handleTransition={handleTransition}
        page={1}
        setPage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'PROGRESS' }));
    expect(handleTransition).toHaveBeenCalledWith('uuid-001', 'IN_PROGRESS');
  });

  it('llama a handleTransition con RESOLVED al hacer clic en el botón correspondiente', () => {
    const handleTransition = vi.fn();
    render(
      <IncidentTable
        incidents={mockPaginated}
        handleTransition={handleTransition}
        page={1}
        setPage={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'RESOLVED' }));
    expect(handleTransition).toHaveBeenCalledWith('uuid-001', 'RESOLVED');
  });

  it('no muestra filas cuando la lista de incidentes está vacía', () => {
    const empty: PaginatedResult<Incident> = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    render(
      <IncidentTable
        incidents={empty}
        handleTransition={vi.fn()}
        page={1}
        setPage={vi.fn()}
      />
    );
    expect(screen.queryByText(/uuid-/)).not.toBeInTheDocument();
  });
});

// =============================================================================
// 4. EventForm — Integración de envío de eventos (HU1)
// =============================================================================
describe('EventForm — Formulario de registro de eventos', () => {

  const defaultProps = {
    backendOnline:   true,
    setIncidentForm: vi.fn(),
    setActiveTab:    vi.fn(),
    setError:        vi.fn(),
    setLoading:      vi.fn(),
    addLog:          vi.fn(),
    onSuccess:       vi.fn(),
    onEventCreated:  vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario con los campos y el botón de envío', () => {
    render(<EventForm {...defaultProps} />);
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingestar Evento/i })).toBeInTheDocument();
  });

  it('llama a apiClient.createEvent y redirige al tab de incidente al enviar con éxito', async () => {
    vi.mocked(apiClient.createEvent).mockResolvedValueOnce({ traceId: 'trace-xyz' });

    render(<EventForm {...defaultProps} />);
    fireEvent.submit(screen.getByTestId('event-form'));

    await waitFor(() => {
      expect(apiClient.createEvent).toHaveBeenCalledTimes(1);
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith('incident');
      expect(defaultProps.setError).toHaveBeenCalledWith(null);
    });
  });

  it('propaga el traceId recibido hacia el formulario de incidente', async () => {
    vi.mocked(apiClient.createEvent).mockResolvedValueOnce({ traceId: 'trace-xyz' });

    render(<EventForm {...defaultProps} />);
    fireEvent.submit(screen.getByTestId('event-form'));

    await waitFor(() => {
      expect(defaultProps.setIncidentForm).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  it('en modo offline (backendOnline=false) usa addLog en lugar de llamar a la API', async () => {
    render(<EventForm {...defaultProps} backendOnline={false} />);
    fireEvent.submit(screen.getByTestId('event-form'));

    await waitFor(() => {
      expect(apiClient.createEvent).not.toHaveBeenCalled();
      expect(defaultProps.addLog).toHaveBeenCalledTimes(1);
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith('incident');
    });
  });
});

// =============================================================================
// 5. IncidentForm — Integración de creación de incidentes (HU2)
// =============================================================================
describe('IncidentForm — Formulario de incidentes', () => {

  const defaultForm = {
    title:                'Timeout en checkout',
    description:          'Los usuarios no pueden completar el pago',
    affectedApp:          'payment-service',
    severity:             'CRITICAL',
    assignee:             'ops@empresa.com',
    relatedEventTraceIds: 'trace-abc,trace-def',
  };

  const defaultProps = {
    backendOnline:    true,
    form:             defaultForm,
    setForm:          vi.fn(),
    setError:         vi.fn(),
    setLoading:       vi.fn(),
    addIncidentLocal: vi.fn(),
    fetchMetrics:     vi.fn(),
    fetchIncidents:   vi.fn(),
    onSuccess:        vi.fn(),
    prefilledFromEvent: false,
    onDismissPrefilled: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el botón de registro de incidente', () => {
    render(<IncidentForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Registrar Ticket/i })).toBeInTheDocument();
  });

  it('llama a apiClient.createIncident con el payload correcto al enviar', async () => {
    vi.mocked(apiClient.createIncident).mockResolvedValueOnce(mockIncident);

    render(<IncidentForm {...defaultProps} />);
    fireEvent.submit(screen.getByRole('button', { name: /Registrar Ticket/i }).closest('form')!);

    await waitFor(() => {
      expect(apiClient.createIncident).toHaveBeenCalledWith({
        title:               'Timeout en checkout',
        description:         'Los usuarios no pueden completar el pago',
        affectedApplication: 'payment-service',
        severity:            'CRITICAL',
        assignee:            'ops@empresa.com',
        relatedEventTraceIds: ['trace-abc', 'trace-def'],
      });
    });
  });

  it('llama a fetchMetrics y fetchIncidents después de crear el incidente con éxito', async () => {
    vi.mocked(apiClient.createIncident).mockResolvedValueOnce(mockIncident);

    render(<IncidentForm {...defaultProps} />);
    fireEvent.submit(screen.getByRole('button', { name: /Registrar Ticket/i }).closest('form')!);

    await waitFor(() => {
      expect(defaultProps.fetchMetrics).toHaveBeenCalledTimes(1);
      expect(defaultProps.fetchIncidents).toHaveBeenCalledTimes(1);
    });
  });

  it('llama a setError cuando la API rechaza la creación', async () => {
    vi.mocked(apiClient.createIncident).mockRejectedValueOnce(
      new Error('Transición de estado denegada')
    );

    render(<IncidentForm {...defaultProps} />);
    fireEvent.submit(screen.getByRole('button', { name: /Registrar Ticket/i }).closest('form')!);

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('Transición de estado denegada');
    });
  });

  it('en modo offline crea un incidente simulado con status OPEN y lo agrega localmente', async () => {
    render(<IncidentForm {...defaultProps} backendOnline={false} />);
    fireEvent.submit(screen.getByRole('button', { name: /Registrar Ticket/i }).closest('form')!);

    await waitFor(() => {
      expect(apiClient.createIncident).not.toHaveBeenCalled();
      expect(defaultProps.addIncidentLocal).toHaveBeenCalledTimes(1);

      const incidentCreado = defaultProps.addIncidentLocal.mock.calls[0][0];
      expect(incidentCreado.status).toBe('OPEN');
      expect(incidentCreado.title).toBe('Timeout en checkout');
      expect(incidentCreado.relatedEventTraceIds).toEqual(['trace-abc', 'trace-def']);
    });
  });

  it('parte correctamente el string de traceIds separados por coma', async () => {
    vi.mocked(apiClient.createIncident).mockResolvedValueOnce(mockIncident);

    const formConTraces = { ...defaultForm, relatedEventTraceIds: 'trace-1 , trace-2 , trace-3' };
    render(<IncidentForm {...defaultProps} form={formConTraces} />);
    fireEvent.submit(screen.getByRole('button', { name: /Registrar Ticket/i }).closest('form')!);

    await waitFor(() => {
      const payload = vi.mocked(apiClient.createIncident).mock.calls[0][0];
      expect(payload.relatedEventTraceIds).toEqual(['trace-1', 'trace-2', 'trace-3']);
    });
  });
});
