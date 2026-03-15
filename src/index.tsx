import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration({
        tracePropagationTargets: ["localhost", /^\/api/, /supabase\.co\/functions\/v1\/hydro-calc/, /supabase\.co\/functions\/v1\/ai-consult/],
      }),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Flattened Design Error Boundary Fallback component
const FlatErrorFallback = ({ error, resetError }: any) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        padding: '32px'
      }}>
        <h1 style={{ margin: '0 0 16px', fontSize: '24px', color: '#0f172a', fontWeight: '600' }}>
          System Error Encountered
        </h1>
        <p style={{ margin: '0 0 24px', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
          RekaSDA Pro has encountered an unexpected client-side error. This issue has been logged via Sentry for telemetry analysis.
        </p>
        
        <div style={{
          backgroundColor: '#f1f5f9',
          border: '1px solid #e2e8f0',
          padding: '16px',
          marginBottom: '24px',
          overflowX: 'auto'
        }}>
          <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#b91c1c' }}>
            {error?.toString()}
          </code>
        </div>

        <button 
          onClick={resetError}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#334155'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
        >
          Restart Application
        </button>
      </div>
    </div>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24,        // 24 jam - data hidrologi jarang berubah
      gcTime: 1000 * 60 * 60 * 24 * 7,        // 7 hari garbage collection
      refetchOnWindowFocus: false,             // Hemat bandwidth Supabase
      refetchOnMount: false,                   // Gunakan cache jika masih fresh
      retry: 2,                                // Retry 2x pada network error
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <GlobalErrorBoundary>
      <Sentry.ErrorBoundary fallback={FlatErrorFallback}>
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </Sentry.ErrorBoundary>
    </GlobalErrorBoundary>
  </StrictMode>
);