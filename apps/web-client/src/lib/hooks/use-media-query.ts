'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that returns true if the given media query matches.
 * Returns false during SSR.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** Returns true when viewport is less than 768px. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** Returns true when viewport is less than 1024px. */
export function useIsTablet(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}
