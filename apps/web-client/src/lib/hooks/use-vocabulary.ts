'use client';

import { createContext, useContext, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useOrgStore } from '../store/org-store';

// ─── Types ───────────────────────────────────────────────────────

interface ModeVocabulary {
  readonly mode: { slug: string; name: string } | null;
  readonly vocabulary: Readonly<Record<string, string>>;
  readonly activeSince: string | null;
}

// ─── Context ─────────────────────────────────────────────────────

const VocabularyContext = createContext<Readonly<Record<string, string>>>({});

export { VocabularyContext };

// ─── Hook ────────────────────────────────────────────────────────

/**
 * Returns a translation function that maps default terms to mode-specific ones.
 *
 * Usage:
 *   const t = useVocabulary();
 *   <h1>{t("Task")}</h1>       // → "Matter" in Legal mode
 *   <h2>{t("Project")}</h2>    // → "Case" in Legal mode
 *   <span>{t("Due Date")}</span> // → "Filing Date" in Legal mode
 */
export function useVocabulary(): (key: string) => string {
  const vocab = useContext(VocabularyContext);
  return useCallback((key: string) => vocab[key] ?? key, [vocab]);
}

// ─── Data Hook (for provider) ────────────────────────────────────

export function useVocabularyData() {
  const currentOrgId = useOrgStore((s) => s.currentOrgId);

  return useQuery({
    queryKey: ['vocabulary', currentOrgId],
    queryFn: async (): Promise<Readonly<Record<string, string>>> => {
      if (!currentOrgId) return {};
      try {
        const result = await apiClient.get<ModeVocabulary>('/api/v1/modes/active');
        return result?.vocabulary ?? {};
      } catch {
        return {};
      }
    },
    staleTime: 5 * 60_000, // 5 min cache
    enabled: !!currentOrgId,
  });
}
