// API Response Types
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  storage: {
    connected: boolean;
    bucket: string;
  };
  observability: {
    tracing: boolean;
    sentry: boolean;
  };
}

export interface DownloadCheckResponse {
  file_id: number;
  status: 'available' | 'unavailable';
  estimated_size?: number;
  message: string;
}

export interface DownloadInitiateRequest {
  file_ids: number[];
  notification_url?: string;
}

export interface DownloadInitiateResponse {
  job_id: string;
  status: 'initiated';
  file_count: number;
  estimated_time_seconds: number;
}

export interface DownloadStartRequest {
  file_id: number;
}

export interface DownloadStartResponse {
  file_id: number;
  download_url: string;
  expires_in_seconds: number;
  file_size_bytes: number;
  processing_time_ms: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  trace_id?: string;
}

// UI State Types
export interface DownloadJob {
  id: string;
  file_ids: number[];
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  trace_id?: string;
  error?: string;
}

export interface SentryError {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  trace_id?: string;
  user?: {
    id: string;
    email?: string;
  };
}

export interface Trace {
  trace_id: string;
  span_id: string;
  operation: string;
  start_time: string;
  duration_ms: number;
  status: 'ok' | 'error';
}

export interface PerformanceMetric {
  timestamp: string;
  response_time_ms: number;
  success_count: number;
  error_count: number;
  requests_per_minute: number;
}
