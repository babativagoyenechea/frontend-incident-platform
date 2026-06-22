# Frontend — Plataforma de Monitoreo Operacional
 
Dashboard React en tiempo real para la gestión de incidentes y eventos operacionales. Consume la API REST y WebSocket del backend NestJS/DDD.
 
## Tabla de Contenidos
 
1. [Tecnologías](#1-tecnologías)
2. [Arquitectura Frontend](#2-arquitectura-frontend)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Variables de Entorno](#4-variables-de-entorno)
5. [Instalación y Ejecución](#5-instalación-y-ejecución)
6. [Modo Offline (sin backend)](#6-modo-offline-sin-backend)
7. [Contratos con la API](#7-contratos-con-la-api)
8. [Pruebas](#8-pruebas)
9. [Flujo de Trabajo Git](#9-flujo-de-trabajo-git)
10. [Mapeo a Historias de Usuario](#10-mapeo-a-historias-de-usuario)
---
 
## 1. Tecnologías
 
| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.2 | Framework de UI |
| TypeScript | 6.0 | Tipado estático |
| Vite | 8.0 | Bundler y servidor de desarrollo |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Socket.IO Client | 4.8 | Conexión WebSocket con el backend |
| Recharts | 3.8 | Gráficos de eventos por app y severidad |
| Lucide React | 1.21 | Iconografía |
| Vitest | 4.1 | Test runner |
| Testing Library | 16.3 | Pruebas de integración de componentes |
 
---
 
## 2. Arquitectura Frontend
 
El frontend sigue una arquitectura de **Estado Global centralizado** basada en Context API + `useReducer`, sin librerías de estado externas.
 
```
src/
│
├── context/DashboardContext.tsx   ← Estado global (reducer puro)
│
├── hooks/useLiveMetrics.ts        ← Orquestador: HTTP + WebSocket + filtros
│
├── shared/
│   ├── api.ts                     ← Cliente HTTP con resolución automática de token
│   ├── types.ts                   ← Interfaces de dominio (Incident, Alert, etc.)
│   └── utils.ts                   ← UUID offline y utilidades
│
├── components/                    ← Componentes de presentación reutilizables
│   ├── SummaryWidgets.tsx         ← Contadores de métricas (HU4)
│   ├── IncidentTable.tsx          ← Tabla con transiciones de estado (HU2)
│   ├── IncidentFilters.tsx        ← Filtros por app, fecha, estado, severidad
│   ├── EventForm.tsx              ← Formulario de registro de eventos (HU1)
│   ├── IncidentForm.tsx           ← Formulario de creación de incidentes (HU2)
│   ├── SocketsConsole.tsx         ← Consola de eventos WebSocket en tiempo real
│   └── Toast.tsx                  ← Sistema de notificaciones
│
└── pages/Dashboard.tsx            ← Composición de la página principal
```
 
### Flujo de Datos
 
```
useLiveMetrics
      │
      ├─► POST /api/auth/token  →  accessToken (cacheado en memoria)
      │
      ├─► GET /api/dashboard/metrics  →  dispatch(SET_METRICS)
      │
      ├─► GET /api/incidents?<filtros>  →  dispatch(SET_INCIDENTS)
      │
      └─► Socket.IO connect
              ├─ 'alert.created'     →  dispatch(ADD_ALERT)
              ├─ 'metrics.updated'   →  dispatch(SET_METRICS)
              └─ 'incident.updated'  →  dispatch(UPDATE_INCIDENT)
```
 
### Estado Global — Reducer
 
El `dashboardReducer` en `DashboardContext.tsx` es una función pura que gestiona:
 
| Acción | Efecto |
|---|---|
| `SET_METRICS` | Reemplaza las métricas del dashboard completas |
| `ADD_ALERT` | Antepone la alerta nueva y recorta a máx. 10 |
| `SET_INCIDENTS` | Reemplaza la lista paginada de incidentes |
| `UPDATE_INCIDENT` | Actualiza por ID un incidente en la lista existente |
| `ADD_INCIDENT_LOCAL` | Agrega un incidente al estado (modo offline) |
| `SET_FILTERS` | Fusión parcial: solo los campos enviados cambian |
| `ADD_LOG` | Antepone el evento WebSocket, máx. 30 en buffer |
| `SET_BACKEND_STATUS` | Controla el banner de modo offline |
| `SET_SOCKET_STATUS` | Indicador de conexión WebSocket |
| `SET_LOADING` / `SET_ERROR` | Estado de carga y mensajes de error |
 
### Cliente HTTP — `api.ts`
 
`apiClient` resuelve el token JWT automáticamente antes de cada llamada (cache-first, un solo `POST /api/auth/token` por sesión). Métodos disponibles:
 
- `getDevToken()` — obtiene el token de desarrollo
- `getMetrics()` — `GET /api/dashboard/metrics`
- `getIncidents(filters)` — `GET /api/incidents?<params>`
- `createEvent(payload)` — `POST /api/events`
- `createIncident(payload)` — `POST /api/incidents`
- `transitionIncident(id, status)` — `PATCH /api/incidents/:id/status`
### Hook `useLiveMetrics`
 
Ciclo de vida del hook:
 
1. Llama a `getDevToken()` para obtener credenciales.
2. Conecta el socket Socket.IO con `auth: { token }` y `reconnection: true`.
3. Suscribe a `alert.created`, `metrics.updated` e `incident.updated`.
4. Aplica debounce de 400 ms al filtro de aplicación para evitar llamadas excesivas.
5. Re-fetcha incidentes reactivamente cuando cambian los filtros de estado, severidad, fecha, página o límite.
6. En `useRef` guarda el socket para sobrevivir al doble montaje de `React.StrictMode` sin crear conexiones duplicadas.
7. En cleanup desconecta el socket y cancela efectos pendientes.
---
 
## 3. Estructura del Proyecto
 
```
frontend/
├── Dockerfile
├── index.html
├── package.json
├── vite.config.ts              ← Configuración dual Vite + Vitest
├── tailwind.config.js
├── tsconfig.app.json
└── src/
    ├── main.tsx                ← Entry point: monta DashboardProvider
    ├── App.tsx                 ← Composición raíz
    ├── setupTests.ts           ← Configuración global de Vitest
    ├── __tests__/
    │   └── Dashboard.test.tsx  ← Suite completa (reducer + componentes)
    ├── context/
    │   └── DashboardContext.tsx
    ├── hooks/
    │   ├── useLiveMetrics.ts
    │   └── useToast.ts
    ├── components/
    │   ├── EventForm.tsx
    │   ├── IncidentFilters.tsx
    │   ├── IncidentForm.tsx
    │   ├── IncidentTable.tsx
    │   ├── SocketsConsole.tsx
    │   ├── SummaryWidgets.tsx
    │   └── Toast.tsx
    ├── pages/
    │   └── Dashboard.tsx
    └── shared/
        ├── api.ts
        ├── types.ts
        └── utils.ts
```
 
---
 
## 4. Variables de Entorno
 
El frontend lee variables de entorno con el prefijo `VITE_`. El archivo `.env` debe colocarse en la raíz del repositorio frontend.
 
| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_URL` | URL base de la API REST del backend | `http://localhost:3000` |
| `VITE_WS_URL` | URL del servidor WebSocket | `ws://localhost:3000` |
| `VITE_API_KEY` | API Key legacy (usada como cabecera auxiliar en `GET /api/incidents`) | `legacy-php-dev-key-2026` |
 
> Para desarrollo local no es necesario crear un `.env`: los valores por defecto apuntan a `localhost:3000`.
 
---
 
## 5. Instalación y Ejecución
 
### Prerrequisitos
 
- Node.js 20+
- npm 10+
- Backend NestJS corriendo en el puerto 3000 (o configurar `VITE_API_URL`)
### Opción A — Docker Compose (recomendado, desde el repositorio backend)
 
El `docker-compose.yml` del backend levanta el frontend automáticamente junto a todos los servicios:
 
```bash
# Desde la carpeta backend/ (con el frontend clonado como ../frontend)
docker compose up --build
```
 
El dashboard queda disponible en **http://localhost:5173**.
 
### Opción B — Desarrollo local con hot-reload
 
```bash
# Instalar dependencias
npm install
 
# Servidor de desarrollo con HMR
npm run dev
```
 
El dashboard queda disponible en **http://localhost:5173**.
 
> Asegurarse de que el backend esté corriendo primero. El frontend detecta automáticamente si el backend está offline y activa el modo simulador.
 
### Scripts disponibles
 
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite con HMR |
| `npm run build` | Compilación TypeScript + bundle de producción |
| `npm run preview` | Previsualización del bundle de producción |
| `npm run lint` | ESLint sobre todos los archivos `.ts` / `.tsx` |
| `npm run test` | Ejecuta la suite Vitest en modo CI (una sola pasada) |
| `npm run test:watch` | Vitest en modo watch (desarrollo) |
| `npm run test:cov` | Vitest con reporte de cobertura |
 
---
 
## 6. Modo Offline (sin backend)
 
Si el backend no está disponible al iniciar, el hook `useLiveMetrics` captura el error de red y activa el **modo simulador local**:
 
- Un banner naranja indica que el backend no está conectado.
- `EventForm` registra eventos localmente mediante `ADD_LOG` sin llamar a la API.
- `IncidentForm` crea incidentes simulados con UUID local y estado `OPEN`, usando `ADD_INCIDENT_LOCAL`.
- Los filtros, la tabla y los widgets siguen siendo funcionales con datos del estado en memoria.
Cuando el backend vuelve a estar disponible, recargar la página reconecta automáticamente.
 
---
 
## 7. Contratos con la API
 
Los tipos de dominio en `src/shared/types.ts` mapean exactamente los contratos del backend:
 
```typescript
// Alerta generada de forma asíncrona (HU3)
interface Alert {
  id: string;
  sourceTraceId: string;
  affectedApplication: string;
  severity: string;
  generatedAt: string;
  processingStatus: string;
}
 
// Incidente operacional (HU2)
interface Incident {
  id: string;
  title: string;
  description: string;
  affectedApp: string;
  severity: string;
  status: string;            // OPEN | IN_PROGRESS | RESOLVED
  assignee: string;
  relatedEventTraceIds: string[];
  createdAt: string;
  updatedAt: string;
}
 
// Métricas consolidadas del dashboard (HU4)
interface DashboardMetrics {
  openIncidents: number;
  resolvedIncidents: number;
  eventsByApp: Array<{ application: string; count: number }>;
  eventsBySeverity: Array<{ severity: string; count: number }>;
  recentAlerts: Alert[];
  cachedAt: string;          // Fecha de la última escritura en Redis
}
 
// Respuesta paginada genérica
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```
 
### Eventos WebSocket escuchados
 
| Evento | Acción en el reducer |
|---|---|
| `alert.created` | `ADD_ALERT` — agrega la alerta al tope de la lista |
| `metrics.updated` | `SET_METRICS` — reemplaza las métricas sin recarga |
| `incident.updated` | `UPDATE_INCIDENT` — actualiza el incidente en la tabla |
 
---
 
## 8. Pruebas
 
La suite vive en `src/__tests__/Dashboard.test.tsx` y combina pruebas unitarias del reducer con pruebas de integración de los componentes principales. Se ejecutan con **Vitest** y **Testing Library**.
 
### Resumen de la suite (32 pruebas)
 
#### Bloque 1 — `dashboardReducer` (11 pruebas unitarias)
 
Valida la lógica pura del estado global sin renderizado:
 
| # | Prueba |
|---|---|
| 1 | Retorna el estado inicial ante una acción desconocida |
| 2 | `SET_METRICS` reemplaza las métricas completas |
| 3 | `ADD_ALERT` antepone y recorta a máx. 10 alertas |
| 4 | `ADD_ALERT` no modifica el estado si `metrics` es null |
| 5 | `UPDATE_INCIDENT` reemplaza solo el incidente con el ID coincidente |
| 6 | `ADD_INCIDENT_LOCAL` inicializa la lista cuando `incidents` es null |
| 7 | `ADD_INCIDENT_LOCAL` incrementa el total cuando ya existen incidentes |
| 8 | `SET_FILTERS` fusiona parcialmente sin borrar campos no enviados |
| 9 | `ADD_LOG` mantiene buffer de máx. 30 y pone el más reciente primero |
| 10 | `SET_LOADING` y `SET_ERROR` actualizan sus campos de forma independiente |
| 11 | `SET_BACKEND_STATUS` y `SET_SOCKET_STATUS` son independientes entre sí |
 
#### Bloque 2 — `SummaryWidgets` (5 pruebas de integración, HU4)
 
| # | Prueba |
|---|---|
| 1 | Muestra ceros cuando `metrics` es null |
| 2 | Muestra los contadores de incidentes abiertos y resueltos |
| 3 | Muestra el número de nodos activos basado en `eventsByApp` |
| 4 | Muestra `N/A` en el widget de caché cuando `metrics` es null |
| 5 | Muestra la hora de caché formateada cuando `cachedAt` está presente |
 
#### Bloque 3 — `IncidentTable` (5 pruebas de integración, HU2)
 
| # | Prueba |
|---|---|
| 1 | Renderiza título y UUID del incidente en la tabla |
| 2 | Deshabilita el botón del estado actual del incidente |
| 3 | Llama a `handleTransition` con `IN_PROGRESS` al hacer clic en PROGRESS |
| 4 | Llama a `handleTransition` con `RESOLVED` al hacer clic en el botón correspondiente |
| 5 | No muestra filas cuando la lista de incidentes está vacía |
 
#### Bloque 4 — `EventForm` (4 pruebas de integración, HU1)
 
| # | Prueba |
|---|---|
| 1 | Renderiza el formulario con campos y botón de envío |
| 2 | Llama a `apiClient.createEvent` y redirige al tab de incidente al enviar con éxito |
| 3 | Propaga el `traceId` recibido hacia el formulario de incidente |
| 4 | En modo offline usa `addLog` en lugar de llamar a la API |
 
#### Bloque 5 — `IncidentForm` (7 pruebas de integración, HU2)
 
| # | Prueba |
|---|---|
| 1 | Renderiza el botón de registro de incidente |
| 2 | Llama a `apiClient.createIncident` con el payload correcto al enviar |
| 3 | Llama a `fetchMetrics` y `fetchIncidents` después de crear el incidente |
| 4 | Llama a `setError` cuando la API rechaza la creación |
| 5 | En modo offline crea un incidente simulado con status `OPEN` y lo agrega localmente |
| 6 | Parte correctamente el string de `traceIds` separados por coma |
 
> **Nota:** el bloque 5 tiene 6 pruebas pero el formulario las cubre con 7 aserciones, por lo que el total real de la suite es **32 aserciones** en 32 `it()` distribuidos en 5 `describe()`.
 
### Ejecutar las pruebas
 
```bash
# Ejecución única (modo CI)
npm run test
 
# Modo watch (desarrollo)
npm run test:watch
 
# Con reporte de cobertura
npm run test:cov
```
 
### Configuración de Vitest
 
`vite.config.ts` actúa como configuración dual para Vite y Vitest:
 
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
```
 
---
 
## 9. Flujo de Trabajo Git
 
El repositorio sigue **Git Flow simplificado** con tres niveles de ramas:
 
```
main     ● chore: initial react + vite + tailwindcss configuration
          │
develop   ◄── (branch desde main)
          │
          ├─ feature/context-api
          │     └─ feat: establish domain types and global Context API state reducer
          │   ──► merge → develop
          │
          ├─ feature/live-hooks
          │     └─ feat: implement api client with auto token resolver and real-time socket hook
          │   ──► merge → develop
          │
          ├─ feature/presentation-components
          │     └─ feat: build modular presentation layer and monochrome telemetry console
          │   ──► merge → develop
          │
          ├─ feature/automated-tests
          │     └─ test: add unit tests for state reducer and integration tests for form submission
          │   ──► merge → develop
          │
          ├─ feature/automated-tests-and-docker
          │     └─ test: config vitest script in package.json and add container files
          │   ──► merge → develop
          │
develop ──┴──► merge → main  (release: production ready react dashboard v1.0.0)
          │
main      ● 708a419 (HEAD -> main, origin/main)
develop   ● 2a1a8da (origin/develop, develop)
```
 
**Convención de commits** (Conventional Commits):
 
| Prefijo | Uso |
|---|---|
| `chore:` | Configuración inicial (Vite, Tailwind, TypeScript) |
| `feat:` | Nueva funcionalidad (Context, hooks, componentes) |
| `test:` | Pruebas unitarias e integración, configuración Vitest |
| `merge:` | Integración de rama `feature/*` hacia `develop` |
| `release:` | Promoción de `develop` a `main` con marca de versión |
 
---
 
## 10. Mapeo a Historias de Usuario
 
| Historia de Usuario | Componente / Módulo |
|---|---|
| **HU1** — Registro de Eventos Operacionales | `EventForm.tsx`, `apiClient.createEvent()`, `POST /api/events` |
| **HU2** — Gestión de Incidentes | `IncidentForm.tsx`, `IncidentTable.tsx`, `IncidentFilters.tsx`, `apiClient.createIncident()`, `apiClient.transitionIncident()` |
| **HU3** — Procesamiento Asíncrono de Alertas | `useLiveMetrics.ts` (evento `alert.created`), `ADD_ALERT` en reducer, `SummaryWidgets` (alertas recientes) |
| **HU4** — Dashboard Operacional en Tiempo Real | `SummaryWidgets.tsx`, `SocketsConsole.tsx`, `useLiveMetrics.ts` (evento `metrics.updated`), `DashboardContext` |
| **HU5** — Integración con Sistema Legacy | `apiClient.getIncidents()` usa `x-api-key` como header auxiliar al consultar `GET /api/incidents` |