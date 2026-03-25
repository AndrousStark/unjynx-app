'use client';

import { useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { forgotPassword } from '@/lib/api/auth';
import { Mail, ArrowLeft, Loader2, Check, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!email.trim()) {
        setError('Please enter your email address.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await forgotPassword(email.trim());
        setSuccess(true);
      } catch {
        // Always show success to prevent email enumeration
        setSuccess(true);
      } finally {
        setIsLoading(false);
      }
    },
    [email],
  );

  // Success view
  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-unjynx-emerald/15 flex items-center justify-center">
            <Check size={28} className="text-unjynx-emerald" />
          </div>
        </div>

        <h2 className="font-outfit text-xl font-bold text-[var(--foreground)] mb-2">
          Check your email
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm mx-auto">
          If an account exists for <span className="text-[var(--foreground)] font-medium">{email}</span>,
          we&apos;ve sent a password reset link.
        </p>

        {/* Open email app */}
        <a
          href="mailto:"
          className={cn(
            'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
            'bg-unjynx-violet hover:bg-unjynx-violet-hover',
            'text-white font-semibold text-sm',
            'transition-all duration-150',
            'shadow-sm hover:shadow-lg hover:shadow-unjynx-violet/20',
          )}
        >
          <ExternalLink size={16} />
          <span>Open Email App</span>
        </a>

        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm text-unjynx-violet hover:text-unjynx-violet-hover font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </div>

        <p className="mt-8 text-xs text-[var(--muted-foreground)]">
          Didn&apos;t receive it? Check your spam folder, or{' '}
          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            className="text-unjynx-violet hover:text-unjynx-violet-hover transition-colors"
          >
            try again
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Back link */}
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        <span>Back to Sign In</span>
      </Link>

      {/* Heading */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-unjynx-gold/15 flex items-center justify-center">
            <Mail size={28} className="text-unjynx-gold" />
          </div>
        </div>
        <h2 className="font-outfit text-2xl font-bold text-[var(--foreground)]">
          Reset password
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1.5">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-unjynx-rose/10 border border-unjynx-rose/20 text-sm text-unjynx-rose animate-slide-up">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="reset-email"
            className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
            />
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              className={cn(
                'w-full h-11 pl-10 pr-4 rounded-xl text-sm',
                'bg-[var(--input)] text-[var(--foreground)]',
                'border border-[var(--border)]',
                'placeholder:text-[var(--muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-unjynx-gold/40 focus:border-unjynx-gold',
                'transition-all duration-150',
              )}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            'flex items-center justify-center gap-2 w-full h-11 rounded-xl',
            'bg-unjynx-gold hover:bg-unjynx-gold-rich',
            'text-[#0F0A1A] font-semibold text-sm',
            'transition-all duration-150',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            'shadow-sm hover:shadow-lg hover:shadow-unjynx-gold/20',
            'focus-ring',
          )}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>
    </div>
  );
}
