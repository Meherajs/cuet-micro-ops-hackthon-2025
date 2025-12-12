# Download Service UI

A React-based monitoring dashboard for the Download Service API with integrated observability using Sentry and OpenTelemetry.

## 🎯 Features

- **Real-time API Health Monitoring** - Live status updates from the backend service
- **Error Tracking** - Comprehensive error capture and reporting with Sentry
- **Distributed Tracing** - End-to-end trace propagation with OpenTelemetry
- **Download Job Management** - Initiate and monitor download jobs
- **Performance Metrics** - Visualize API response times and success rates
- **Trace Correlation** - Link frontend errors to backend traces

## 🚀 Quick Start

### Prerequisites

- Node.js >= 24.10.0
- npm >= 10.x
- Running backend service at `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your Sentry DSN
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000

# Sentry Configuration
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development

# OpenTelemetry Configuration
VITE_OTEL_ENDPOINT=http://localhost:4318/v1/traces
VITE_OTEL_SERVICE_NAME=download-service-ui

# Jaeger UI
VITE_JAEGER_UI_URL=http://localhost:16686
```

### Setting up Sentry

1. Create a new project in [Sentry.io](https://sentry.io)
2. Select "React" as the platform
3. Copy the DSN from the project settings
4. Add it to your `.env` file as `VITE_SENTRY_DSN`

### Setting up OpenTelemetry

The frontend is configured to send traces to an OTLP endpoint. Ensure your backend is running with Jaeger:

```bash
# Start backend with Docker (includes Jaeger)
cd ..
npm run docker:dev
```

Jaeger UI will be available at `http://localhost:16686`

## 🧪 Testing Observability

### Test Sentry Error Tracking

Click the "Test Sentry Error" button in the UI, or run:

```bash
curl -X POST "http://localhost:3000/v1/download/check?sentry_test=true" \
  -H "Content-Type: application/json" \
  -d '{"file_id": 70000}'
```

The error should appear in your Sentry dashboard.

### Test OpenTelemetry Tracing

1. Click the "Test Tracing" button in the UI
2. Note the Trace ID displayed
3. Click "Open Jaeger UI" or visit `http://localhost:16686`
4. Search for the trace by ID
5. Verify the trace spans from frontend to backend

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   └── ErrorBoundary.tsx
│   ├── services/          # API and observability services
│   │   ├── api.ts         # API client with trace propagation
│   │   ├── sentry.ts      # Sentry configuration
│   │   └── telemetry.ts   # OpenTelemetry configuration
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx            # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔍 Key Concepts

### Trace Propagation

The frontend automatically propagates trace context to the backend using W3C Trace Context headers:

```typescript
// Automatically added to all API requests
headers: {
  'traceparent': '00-{trace-id}-{span-id}-{flags}'
}
```

### Error Correlation

Errors captured by Sentry are automatically tagged with trace IDs for correlation:

```typescript
Sentry.captureException(error, {
  tags: { trace_id: getCurrentTraceId() }
});
```

### Custom Spans

Create custom spans for user interactions:

```typescript
createSpan('user.download_clicked', async (span) => {
  await api.startDownload({ file_id: 12345 });
}, { 'user.action': 'download' });
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🐛 Troubleshooting

### Sentry not capturing errors

1. Verify `VITE_SENTRY_DSN` is set correctly in `.env`
2. Check browser console for Sentry initialization messages
3. Ensure the DSN project matches your Sentry organization

### Traces not appearing in Jaeger

1. Verify backend is running with Jaeger (`npm run docker:dev`)
2. Check `VITE_OTEL_ENDPOINT` is correct (default: `http://localhost:4318/v1/traces`)
3. Verify CORS is properly configured on the OTLP endpoint
4. Check browser network tab for trace export requests

### API requests failing

1. Verify backend is running at `http://localhost:3000`
2. Check `VITE_API_BASE_URL` in `.env`
3. Verify CORS is enabled on the backend

## 📚 Resources

- [Sentry React SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [OpenTelemetry JavaScript Documentation](https://opentelemetry.io/docs/instrumentation/js/)
- [W3C Trace Context Specification](https://www.w3.org/TR/trace-context/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

## 🎨 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Error Tracking**: Sentry
- **Tracing**: OpenTelemetry
- **Icons**: Lucide React

## 📝 License

This project is part of the CUET Micro-Ops Hackathon 2025.
