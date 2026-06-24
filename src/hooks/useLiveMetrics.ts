import { useEffect, useContext, useCallback, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { DashboardContext } from '../context/DashboardContext';
import { apiClient } from '../shared/api';

export function useLiveMetrics() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useLiveMetrics debe usarse dentro de DashboardProvider');
  const { state, dispatch } = context;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const [debouncedApp, setDebouncedApp] = useState(state.filters.application);
  const socketRef = useRef<Socket | null>(null);

  const fetchMetrics = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    apiClient.getMetrics()
      .then((data) => {
        dispatch({ type: 'METRICS_UPDATED', payload: data });
        dispatch({ type: 'SET_BACKEND_STATUS', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
      })
      .catch((err) => {
        console.warn('Backend offline:', err);
        dispatch({ type: 'SET_BACKEND_STATUS', payload: false });
        dispatch({ type: 'SET_ERROR', payload: 'No se pudo conectar con el servidor.' });
      })
      .finally(() => {
        dispatch({ type: 'SET_LOADING', payload: false });
      });
  }, [dispatch]);

  const filtersRef = useRef(state.filters);
  useEffect(() => {
    filtersRef.current = state.filters;
  }, [state.filters]);

  const fetchIncidents = useCallback(() => {
    apiClient.getIncidents({
      ...filtersRef.current,
      application: filtersRef.current.application,
    })
      .then((data) => {
        dispatch({ type: 'INCIDENTS_LOADED', payload: data });
      })
      .catch((err) => {
        console.warn('Error cargando incidentes:', err);
      });
  }, [dispatch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedApp(state.filters.application);
    }, 400);
    return () => clearTimeout(handler);
  }, [state.filters.application]);

  useEffect(() => {
    if (!state.backendOnline) return;
    fetchIncidents();
  }, [
    state.filters.status,
    state.filters.severity,
    state.filters.date,
    state.filters.page,
    state.filters.limit,
    debouncedApp,
    state.backendOnline,
    fetchIncidents,
  ]);

  useEffect(() => {
    let cancelled = false;

    apiClient.getDevToken()
      .then((token) => {
        if (cancelled) return;

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        dispatch({ type: 'SET_BACKEND_STATUS', payload: true });
        fetchMetrics();
        fetchIncidents();

        const socket: Socket = io(API_URL, {
          transports: ['websocket'],
          auth: { token },
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          dispatch({ type: 'SET_SOCKET_STATUS', payload: true });
          dispatch({
            type: 'LOG_APPENDED',
            payload: {
              time: new Date().toLocaleTimeString(),
              event: 'SOCKET_CONNECTED',
              payload: JSON.stringify({ host: API_URL, transport: 'WebSocket' }, null, 2),
            },
          });
        });

        socket.on('disconnect', () => {
          dispatch({ type: 'SET_SOCKET_STATUS', payload: false });
          dispatch({
            type: 'LOG_APPENDED',
            payload: {
              time: new Date().toLocaleTimeString(),
              event: 'SOCKET_DISCONNECTED',
              payload: JSON.stringify({ status: 'RECONNECTING...' }, null, 2),
            },
          });
        });

        socket.on('alert.created', (alert) => {
          dispatch({ type: 'ADD_ALERT', payload: alert });
          dispatch({
            type: 'LOG_APPENDED',
            payload: {
              time: new Date().toLocaleTimeString(),
              event: 'alert.created',
              payload: JSON.stringify(alert, null, 2),
            },
          });
        });

        socket.on('metrics.updated', (metrics) => {
          dispatch({ type: 'METRICS_UPDATED', payload: metrics });
          dispatch({
            type: 'LOG_APPENDED',
            payload: {
              time: new Date().toLocaleTimeString(),
              event: 'metrics.updated',
              payload: JSON.stringify(metrics, null, 2),
            },
          });
        });

        socket.on('incident.updated', (incident) => {
          dispatch({ type: 'UPDATE_INCIDENT', payload: incident });
          dispatch({
            type: 'LOG_APPENDED',
            payload: {
              time: new Date().toLocaleTimeString(),
              event: 'incident.updated',
              payload: JSON.stringify(incident, null, 2),
            },
          });
        });
      })
      .catch((err) => {
        console.warn('Backend no disponible. Operando en modo local.', err);
        dispatch({ type: 'SET_BACKEND_STATUS', payload: false });
      });

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return { fetchMetrics, fetchIncidents };
}