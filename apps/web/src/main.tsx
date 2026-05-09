import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ApiProvider } from '@sprout/api-client';

import '@sprout/shared/tokens.css';
import './styles/global.css';

import { router } from './router';

const App = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider
        baseUrl={import.meta.env.VITE_API_URL ?? ''}
        getToken={() => localStorage.getItem('sprout_token')}
        onUnauthorized={() => {
          localStorage.removeItem('sprout_token');
          router.navigate({ to: '/login' });
        }}
      >
        <RouterProvider router={router} />
      </ApiProvider>
    </QueryClientProvider>
  );
};

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('No #root element found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
