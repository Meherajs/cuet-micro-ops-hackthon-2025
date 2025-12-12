import { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { Activity, Download, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { api } from './services/api';
import { createSpan, getCurrentTraceId } from './services/telemetry';
import { captureMessage } from './services/sentry';
import type { HealthResponse } from './types';

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingSentry, setTestingSentry] = useState(false);

  // Fetch health status
  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Test Sentry integration
  const handleSentryTest = async () => {
    setTestingSentry(true);
    try {
      await createSpan(
        'user.test_sentry',
        async () => {
          await api.checkDownload(70000, true);
        },
        { 'test.type': 'sentry_error' }
      );
    } catch (err) {
      const traceId = getCurrentTraceId();
      captureMessage('Sentry test completed - error captured successfully', 'info');
      alert(`Sentry test triggered! Check your Sentry dashboard.\nTrace ID: ${traceId}`);
    } finally {
      setTestingSentry(false);
    }
  };

  // Test OpenTelemetry tracing
  const handleTracingTest = async () => {
    const traceId = getCurrentTraceId();
    await createSpan(
      'user.test_tracing',
      async () => {
        captureMessage('Testing OpenTelemetry trace propagation', 'info');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      },
      { 'test.type': 'tracing' }
    );

    const jaegerUrl = import.meta.env.VITE_JAEGER_UI_URL || 'http://localhost:16686';
    alert(
      `Tracing test completed!\nTrace ID: ${traceId}\n\nView in Jaeger: ${jaegerUrl}/trace/${traceId}`
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'healthy' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-8 h-8 text-primary-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Download Service Monitor</h1>
                  <p className="text-sm text-gray-500">
                    Real-time monitoring with Sentry & OpenTelemetry
                  </p>
                </div>
              </div>
              {getCurrentTraceId() && (
                <div className="text-xs font-mono text-gray-500">
                  Trace: {getCurrentTraceId()?.substring(0, 16)}...
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* API Health */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">API Status</p>
                  {loading ? (
                    <p className="text-lg font-semibold text-gray-400">Loading...</p>
                  ) : (
                    <p
                      className={`text-lg font-semibold ${getStatusColor(health?.status || 'unhealthy')}`}
                    >
                      {health?.status || 'Unknown'}
                    </p>
                  )}
                </div>
                <Activity className="w-8 h-8 text-primary-600" />
              </div>
            </div>

            {/* Storage Status */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Storage</p>
                  {loading ? (
                    <p className="text-lg font-semibold text-gray-400">Loading...</p>
                  ) : (
                    <p
                      className={`text-lg font-semibold ${health?.storage.connected ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {health?.storage.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  )}
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </div>

            {/* Tracing Status */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tracing</p>
                  {loading ? (
                    <p className="text-lg font-semibold text-gray-400">Loading...</p>
                  ) : (
                    <p
                      className={`text-lg font-semibold ${health?.observability.tracing ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {health?.observability.tracing ? 'Active' : 'Inactive'}
                    </p>
                  )}
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            {/* Sentry Status */}
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sentry</p>
                  {loading ? (
                    <p className="text-lg font-semibold text-gray-400">Loading...</p>
                  ) : (
                    <p
                      className={`text-lg font-semibold ${health?.observability.sentry ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {health?.observability.sentry ? 'Active' : 'Inactive'}
                    </p>
                  )}
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Welcome Section */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🎉 Welcome to Phase 1 - Foundation Complete!
            </h2>
            <div className="space-y-3 text-gray-600">
              <p>
                The React frontend with observability foundation is now set up. Here's what's been
                implemented:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>✅ React 18 with Vite and TypeScript</li>
                <li>✅ Sentry integration for error tracking</li>
                <li>✅ OpenTelemetry for distributed tracing</li>
                <li>✅ Trace propagation with W3C Trace Context</li>
                <li>✅ API service with automatic instrumentation</li>
                <li>✅ Error Boundary with user feedback</li>
                <li>✅ Tailwind CSS for styling</li>
              </ul>
            </div>
          </div>

          {/* Testing Section */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              🧪 Test Observability Integration
            </h2>
            <p className="text-gray-600 mb-6">
              Use these buttons to test the Sentry and OpenTelemetry integrations:
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleSentryTest}
                disabled={testingSentry}
                className="btn btn-danger"
              >
                {testingSentry ? 'Testing...' : 'Test Sentry Error'}
              </button>
              <button onClick={handleTracingTest} className="btn btn-primary">
                Test Tracing
              </button>
              <a
                href={import.meta.env.VITE_JAEGER_UI_URL || 'http://localhost:16686'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                Open Jaeger UI
              </a>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Next Steps (Phase 2-7)</h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
              <li>Build Dashboard components (Health, Downloads, Errors, Traces, Metrics)</li>
              <li>Implement download job management</li>
              <li>Add real-time error log viewer</li>
              <li>Create trace visualization</li>
              <li>Build performance metrics charts</li>
              <li>Setup Docker containers</li>
              <li>Add comprehensive documentation</li>
            </ul>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
