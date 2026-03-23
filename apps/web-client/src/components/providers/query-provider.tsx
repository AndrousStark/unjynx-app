// ---------------------------------------------------------------------------
// QueryProvider - TanStack React Query client wrapper
// ---------------------------------------------------------------------------

'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  readonly children: ReactNode;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Ensure a single QueryClient per browser session (not per render)
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
