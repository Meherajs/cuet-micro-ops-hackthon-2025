import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ZoneContextManager } from '@opentelemetry/context-zone';

const OTEL_ENDPOINT = import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces';
const SERVICE_NAME = import.meta.env.VITE_OTEL_SERVICE_NAME || 'download-service-ui';
const OTEL_ENABLED = import.meta.env.VITE_OTEL_ENABLED !== 'false';

let provider: WebTracerProvider | null = null;
const tracer = trace.getTracer('download-service-ui', '1.0.0');

export function initTelemetry() {
  if (!OTEL_ENABLED) {
    console.warn('OpenTelemetry disabled. Tracing will not be available.');
    return;
  }

  try {
    // Create a resource with service information
    const resource = Resource.default().merge(
      new Resource({
        [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
        'service.version': '1.0.0',
        'deployment.environment': import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      })
    );

    // Create and configure the tracer provider
    provider = new WebTracerProvider({
      resource,
    });

    // Configure OTLP exporter
    const exporter = new OTLPTraceExporter({
      url: OTEL_ENDPOINT,
      headers: {},
    });

    // Add span processor
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    // Register the provider
    provider.register({
      contextManager: new ZoneContextManager(),
    });

    // Register automatic instrumentations
    registerInstrumentations({
      instrumentations: [
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: [
            /.*/, // Propagate trace headers to all origins
          ],
          clearTimingResources: true,
          applyCustomAttributesOnSpan: (span, request) => {
            span.setAttribute('http.request.url', request.url);
          },
        }),
        new DocumentLoadInstrumentation(),
      ],
    });

    console.log('OpenTelemetry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
  }
}

/**
 * Create a custom span for tracking user interactions
 */
export function createSpan<T>(
  name: string,
  operation: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>
): T | Promise<T> {
  return tracer.startActiveSpan(name, (span) => {
    try {
      // Add custom attributes
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          span.setAttribute(key, value);
        });
      }

      // Store trace ID globally for Sentry correlation
      const traceId = span.spanContext().traceId;
      (window as any).__CURRENT_TRACE_ID__ = traceId;

      // Execute the operation
      const result = operation(span);

      // Handle promises
      if (result instanceof Promise) {
        return result
          .then((value) => {
            span.setStatus({ code: SpanStatusCode.OK });
            span.end();
            return value;
          })
          .catch((error) => {
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
            throw error;
          }) as T;
      }

      // Handle synchronous operations
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      }
      span.end();
      throw error;
    }
  });
}

/**
 * Get the current trace ID
 */
export function getCurrentTraceId(): string | undefined {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    return activeSpan.spanContext().traceId;
  }
  return (window as any).__CURRENT_TRACE_ID__;
}

/**
 * Get the current span ID
 */
export function getCurrentSpanId(): string | undefined {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    return activeSpan.spanContext().spanId;
  }
  return undefined;
}

/**
 * Add event to current span
 */
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    activeSpan.addEvent(name, attributes);
  }
}

/**
 * Get W3C traceparent header value for propagation
 */
export function getTraceparentHeader(): string | undefined {
  const activeSpan = trace.getActiveSpan();
  if (activeSpan) {
    const spanContext = activeSpan.spanContext();
    const traceFlags = spanContext.traceFlags || 0;
    return `00-${spanContext.traceId}-${spanContext.spanId}-0${traceFlags.toString(16)}`;
  }
  return undefined;
}

/**
 * Shutdown telemetry (cleanup)
 */
export async function shutdownTelemetry() {
  if (provider) {
    await provider.shutdown();
    console.log('OpenTelemetry shutdown complete');
  }
}

export { tracer, context, trace };
