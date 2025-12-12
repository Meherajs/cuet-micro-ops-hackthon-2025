import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createSpan, getTraceparentHeader, getCurrentTraceId } from './telemetry';
import { captureError, addBreadcrumb } from './sentry';
import type {
  HealthResponse,
  DownloadCheckResponse,
  DownloadInitiateRequest,
  DownloadInitiateResponse,
  DownloadStartRequest,
  DownloadStartResponse,
  ErrorResponse,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add trace context
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add trace context header for distributed tracing
    const traceparent = getTraceparentHeader();
    if (traceparent) {
      config.headers.set('traceparent', traceparent);
    }

    // Add trace ID for correlation
    const traceId = getCurrentTraceId();
    if (traceId) {
      config.headers.set('X-Trace-Id', traceId);
    }

    // Add breadcrumb for Sentry
    addBreadcrumb({
      category: 'http',
      message: `${config.method?.toUpperCase()} ${config.url}`,
      level: 'info',
      data: {
        url: config.url,
        method: config.method,
        trace_id: traceId,
      },
    });

    return config;
  },
  (error) => {
    captureError(error, { stage: 'request' });
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    // Success - add breadcrumb
    addBreadcrumb({
      category: 'http',
      message: `Response ${response.status} from ${response.config.url}`,
      level: 'info',
      data: {
        status: response.status,
        url: response.config.url,
        trace_id: getCurrentTraceId(),
      },
    });
    return response;
  },
  (error: AxiosError<ErrorResponse>) => {
    // Error handling
    const traceId = getCurrentTraceId();

    addBreadcrumb({
      category: 'http',
      message: `HTTP Error: ${error.message}`,
      level: 'error',
      data: {
        status: error.response?.status,
        url: error.config?.url,
        trace_id: traceId,
        error_message: error.response?.data?.message,
      },
    });

    // Capture error in Sentry
    captureError(error, {
      status: error.response?.status,
      url: error.config?.url,
      trace_id: traceId,
      response: error.response?.data,
    });

    // Attach trace ID to error for UI display
    if (error.response?.data) {
      error.response.data.trace_id = traceId;
    }

    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  /**
   * Health check endpoint
   */
  async getHealth(): Promise<HealthResponse> {
    return createSpan(
      'api.health',
      async () => {
        const response = await apiClient.get<HealthResponse>('/health');
        return response.data;
      },
      { 'http.method': 'GET', 'http.route': '/health' }
    );
  },

  /**
   * Check if a file is available for download
   */
  async checkDownload(fileId: number, sentryTest = false): Promise<DownloadCheckResponse> {
    return createSpan(
      'api.download.check',
      async () => {
        const response = await apiClient.post<DownloadCheckResponse>(
          '/v1/download/check',
          { file_id: fileId },
          { params: sentryTest ? { sentry_test: 'true' } : undefined }
        );
        return response.data;
      },
      {
        'http.method': 'POST',
        'http.route': '/v1/download/check',
        'file.id': fileId,
        'test.sentry': sentryTest,
      }
    );
  },

  /**
   * Initiate a bulk download job
   */
  async initiateDownload(request: DownloadInitiateRequest): Promise<DownloadInitiateResponse> {
    return createSpan(
      'api.download.initiate',
      async () => {
        const response = await apiClient.post<DownloadInitiateResponse>(
          '/v1/download/initiate',
          request
        );
        return response.data;
      },
      {
        'http.method': 'POST',
        'http.route': '/v1/download/initiate',
        'download.file_count': request.file_ids.length,
      }
    );
  },

  /**
   * Start a download with simulated delay
   */
  async startDownload(request: DownloadStartRequest): Promise<DownloadStartResponse> {
    return createSpan(
      'api.download.start',
      async () => {
        const response = await apiClient.post<DownloadStartResponse>('/v1/download/start', request);
        return response.data;
      },
      {
        'http.method': 'POST',
        'http.route': '/v1/download/start',
        'file.id': request.file_id,
      }
    );
  },
};

export default api;
