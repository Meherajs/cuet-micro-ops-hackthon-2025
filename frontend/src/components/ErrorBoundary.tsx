import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { showReportDialog, captureError } from '@/services/sentry';
import { getCurrentTraceId } from '@/services/telemetry';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  traceId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      traceId: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      traceId: getCurrentTraceId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Capture the error with Sentry
    captureError(error, {
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      trace_id: getCurrentTraceId(),
    });

    this.setState({
      errorInfo,
      traceId: getCurrentTraceId(),
    });
  }

  handleReportClick = () => {
    showReportDialog();
  };

  handleResetClick = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      traceId: undefined,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Oops! Something went wrong</h1>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified and we're
                working to fix the issue.
              </p>

              {this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-800 mb-2">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono">{this.state.error.toString()}</p>
                </div>
              )}

              {this.state.traceId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-800 mb-2">Trace ID:</p>
                  <p className="text-sm text-blue-700 font-mono break-all">{this.state.traceId}</p>
                  <p className="text-xs text-blue-600 mt-2">
                    Use this ID when contacting support for faster assistance.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={this.handleResetClick}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={this.handleReportClick}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Report Issue
                </button>
                <button
                  onClick={() => (window.location.href = '/')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Go Home
                </button>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    Component Stack (Dev Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64 text-gray-800">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
