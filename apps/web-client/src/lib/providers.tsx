'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { VocabularyProvider } from '@/components/providers/vocabulary-provider';

interface ProvidersProps {
  readonly children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <VocabularyProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]',
          }}
        />
      </VocabularyProvider>
    </QueryClientProvider>
  );
}
