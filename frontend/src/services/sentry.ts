import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development';
const TRACES_SAMPLE_RATE = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '1.0');
const REPLAYS_SESSION_SAMPLE_RATE = parseFloat(
  import.meta.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'
);
const REPLAYS_ON_ERROR_SAMPLE_RATE = parseFloat(
  import.meta.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || '1.0'
);

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
      Sentry.browserProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: TRACES_SAMPLE_RATE,
    tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    
    // Session Replay
    replaysSessionSampleRate: REPLAYS_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: REPLAYS_ON_ERROR_SAMPLE_RATE,

    // Release tracking
    release: `download-service-ui@${import.meta.env.VITE_APP_VERSION || 'dev'}`,

    // Before send hook to add trace context
    beforeSend(event, hint) {
      // Add trace ID to event if available
      const traceId = getActiveTraceId();
      if (traceId) {
        event.tags = {
          ...event.tags,
          trace_id: traceId,
        };
      }
      return event;
    },

    // Performance monitoring configuration
    profilesSampleRate: 1.0,
  });

  console.log('Sentry initialized successfully');
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
    tags: {
      trace_id: getActiveTraceId(),
    },
  });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, {
    level,
    tags: {
      trace_id: getActiveTraceId(),
    },
  });
}

export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser(user);
}

export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}) {
  Sentry.addBreadcrumb(breadcrumb);
}

export function showReportDialog(eventId?: string) {
  const id = eventId || Sentry.lastEventId();
  if (id) {
    Sentry.showReportDialog({
      eventId: id,
      title: 'Something went wrong',
      subtitle: 'Our team has been notified.',
      subtitle2: 'If you would like to help, tell us what happened below.',
    });
  }
}

// Helper to get active trace ID (will be implemented with OpenTelemetry)
function getActiveTraceId(): string | undefined {
  // This will be implemented in telemetry.ts
  return (window as any).__CURRENT_TRACE_ID__;
}

export { Sentry };
