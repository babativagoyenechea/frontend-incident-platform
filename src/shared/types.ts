export interface Alert {
  id: string;
  sourceTraceId: string;
  affectedApplication: string;
  severity: string;
  generatedAt: string;
  processingStatus: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  affectedApp: string;
  severity: string;
  status: string;
  assignee: string;
  relatedEventTraceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  openIncidents: number;
  resolvedIncidents: number;
  eventsByApp: Array<{ application: string; count: number }>;
  eventsBySeverity: Array<{ severity: string; count: number }>;
  recentAlerts: Alert[];
  cachedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}