import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { GlobalErrorBoundary } from '@/components/layout/GlobalErrorBoundary';

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
      <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);