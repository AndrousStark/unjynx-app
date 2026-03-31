'use client';

import { VocabularyContext, useVocabularyData } from '@/lib/hooks/use-vocabulary';

export function VocabularyProvider({ children }: { readonly children: React.ReactNode }) {
  const { data: vocabulary } = useVocabularyData();

  return (
    <VocabularyContext.Provider value={vocabulary ?? {}}>
      {children}
    </VocabularyContext.Provider>
  );
}
