'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/use-auth';
import { useOrgStore } from '@/lib/store/org-store';
import { updateOrganization } from '@/lib/api/organizations';
import {
  Sparkles, ArrowRight, Check, Loader2,
  Scale, HeartPulse, Code, HardHat, Home,
  GraduationCap, Landmark, Users, Megaphone,
  House, BookOpen, Building2, Rocket,
} from 'lucide-react';

// ─── Steps ───────────────────────────────────────────────────────

type Step = 'welcome' | 'industry' | 'done';

// ─── Industry Modes ──────────────────────────────────────────────

const MODES = [
  { slug: 'legal', name: 'Legal', icon: Scale, color: '#1E3A5F', desc: 'Cases, deadlines, billing' },
  { slug: 'healthcare', name: 'Healthcare', icon: HeartPulse, color: '#0D7377', desc: 'Appointments, follow-ups' },
  { slug: 'dev_teams', name: 'Dev Teams', icon: Code, color: '#7C3AED', desc: 'Sprints, issues, deploys' },
  { slug: 'construction', name: 'Construction', icon: HardHat, color: '#C2410C', desc: 'Job sites, inspections' },
  { slug: 'real_estate', name: 'Real Estate', icon: Home, color: '#0891B2', desc: 'Listings, transactions' },
  { slug: 'education', name: 'Education', icon: GraduationCap, color: '#2563EB', desc: 'Courses, assignments' },
  { slug: 'finance', name: 'Finance', icon: Landmark, color: '#047857', desc: 'Audits, portfolios' },
  { slug: 'hr', name: 'HR', icon: Users, color: '#DB2777', desc: 'Hiring, onboarding' },
  { slug: 'marketing', name: 'Marketing', icon: Megaphone, color: '#E11D48', desc: 'Campaigns, content' },
  { slug: 'family', name: 'Family', icon: House, color: '#8B5CF6', desc: 'Chores, events' },
  { slug: 'students', name: 'Students', icon: BookOpen, color: '#4F46E5', desc: 'Homework, exams' },
] as const;

// ─── Page ────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { userOrgs, currentOrgId, updateOrg } = useOrgStore();

  const [step, setStep] = useState<Step>('welcome');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const displayName = (user as { name?: string } | undefined)?.name?.split(' ')[0] ?? 'there';

  // Find the user's personal org to update
  const personalOrg = userOrgs.find((o) => o.isPersonal) ?? userOrgs[0];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!personalOrg || !selectedMode) return;
      await updateOrganization(personalOrg.id, { industryMode: selectedMode });
    },
    onSuccess: () => {
      if (personalOrg && selectedMode) {
        updateOrg(personalOrg.id, { industryMode: selectedMode });
      }
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setStep('done');
    },
  });

  const handleFinish = useCallback(() => {
    // Mark onboarding as complete
    if (typeof window !== 'undefined') {
      localStorage.setItem('unjynx_onboarded', 'true');
    }
    router.replace('/');
  }, [router]);

  const handleSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unjynx_onboarded', 'true');
    }
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-2xl px-4">
        {/* ── Step 1: Welcome ── */}
        {step === 'welcome' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[var(--accent)]/20">
              <Rocket size={36} className="text-white" />
            </div>
            <h1 className="font-outfit text-3xl font-bold text-[var(--foreground)] mb-3">
              Welcome to UNJYNX, {displayName}!
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto mb-8">
              Let&apos;s personalize your workspace. This takes 30 seconds and you can change it anytime.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => setStep('industry')}
                className="bg-gradient-to-r from-[var(--accent)] to-[var(--gold-rich)] text-white px-8"
                size="lg"
              >
                Get Started <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button variant="outline" size="lg" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Industry Selection ── */}
        {step === 'industry' && (
          <div>
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles size={20} className="text-[var(--accent)]" />
                <h2 className="font-outfit text-xl font-bold text-[var(--foreground)]">
                  What does your team do?
                </h2>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                This customizes your vocabulary, templates, and dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = selectedMode === mode.slug;
                return (
                  <button
                    key={mode.slug}
                    type="button"
                    onClick={() => setSelectedMode(isSelected ? null : mode.slug)}
                    className={cn(
                      'flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20'
                        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30',
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mode.color}20`, color: mode.color }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--foreground)] truncate">{mode.name}</p>
                      <p className="text-[9px] text-[var(--muted-foreground)] truncate">{mode.desc}</p>
                    </div>
                    {isSelected && <Check size={14} className="text-[var(--accent)] ml-auto flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Skip — I&apos;ll use General mode
              </button>
              <Button
                onClick={() => selectedMode ? saveMutation.mutate() : handleFinish()}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-[var(--accent)] to-[var(--gold-rich)] text-white"
              >
                {saveMutation.isPending ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</>
                ) : selectedMode ? (
                  <><Check size={14} className="mr-2" /> Apply &amp; Continue</>
                ) : (
                  <><ArrowRight size={14} className="mr-2" /> Continue</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 'done' && (
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-6">
              <Check size={36} className="text-[var(--success)]" />
            </div>
            <h2 className="font-outfit text-2xl font-bold text-[var(--foreground)] mb-2">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              Your workspace is customized for{' '}
              <span className="text-[var(--accent)] font-medium">
                {MODES.find((m) => m.slug === selectedMode)?.name ?? 'your industry'}
              </span>.
              You can change this anytime in Settings.
            </p>
            <Button
              onClick={handleFinish}
              className="bg-gradient-to-r from-[var(--accent)] to-[var(--gold-rich)] text-white px-8"
              size="lg"
            >
              Go to Dashboard <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {(['welcome', 'industry', 'done'] as const).map((s) => (
            <div
              key={s}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step === s ? 'bg-[var(--accent)]' : 'bg-[var(--border)]',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
