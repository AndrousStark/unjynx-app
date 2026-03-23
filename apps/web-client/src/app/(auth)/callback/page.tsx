'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleCallback, storeTokens } from '@/lib/api/auth';
import { cn } from '@/lib/utils/cn';
import { Loader2, AlertCircle, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Callback Page
// ---------------------------------------------------------------------------
// Handles the Logto OIDC redirect. After the user authenticates with Logto
// (Google / email), Logto redirects to /callback?code=XXX&state=YYY.
// ---------------------------------------------------------------------------

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setError('Missing authorization code. Please try signing in again.');
      return;
    }

    const redirectUri =
      typeof window !== 'undefined'
        ? `${window.location.origin}/callback`
        : 'http://localhost:3003/callback';

    handleCallback({ code, state: state ?? '', redirectUri })
      .then((tokens) => {
        storeTokens(tokens);
        router.replace('/');
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Authentication failed';
        setError(message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="p-8 text-center">
        {/* Error icon */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-unjynx-rose/15 flex items-center justify-center">
            <AlertCircle size={28} className="text-unjynx-rose" />
          </div>
        </div>

        {/* Error heading */}
        <h2 className="font-outfit text-xl font-bold text-[var(--foreground)] mb-2">
          Sign-in failed
        </h2>

        {/* Error message */}
        <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto">
          {error}
        </p>

        {/* Retry button */}
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }}
          className={cn(
            'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
            'bg-unjynx-violet hover:bg-unjynx-violet-hover',
            'text-white font-semibold text-sm',
            'transition-all duration-150',
            'shadow-sm hover:shadow-lg hover:shadow-unjynx-violet/20',
            'focus-ring',
          )}
        >
          <RotateCcw size={16} />
          <span>Try Again</span>
        </button>

        {/* Troubleshooting hint */}
        <p className="mt-6 text-xs text-[var(--muted-foreground)]">
          If this keeps happening, clear your browser cookies and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      {/* Loading spinner */}
      <div className="flex justify-center mb-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-unjynx-violet/15 flex items-center justify-center">
            <Loader2 size={28} className="text-unjynx-violet animate-spin" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-unjynx-gold animate-pulse-gold" />
        </div>
      </div>

      {/* Loading text */}
      <h2 className="font-outfit text-xl font-bold text-[var(--foreground)] mb-2">
        Completing sign-in...
      </h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Please wait while we verify your identity.
      </p>

      {/* Decorative progress bar */}
      <div className="mt-6 mx-auto max-w-[200px] h-1 rounded-full bg-[var(--border)] overflow-hidden">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-unjynx-violet to-unjynx-gold animate-[shimmer_1.5s_infinite]" />
      </div>
    </div>
  );
}
