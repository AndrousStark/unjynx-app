'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrganization } from '@/lib/api/organizations';
import { useOrgStore } from '@/lib/store/org-store';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Check,
  Scale,
  HeartPulse,
  Code,
  HardHat,
  Home,
  GraduationCap,
  Landmark,
  Users,
  Megaphone,
  House,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

// ─── Industry Modes ──────────────────────────────────────────────

const MODES = [
  { slug: 'legal', name: 'Legal', icon: Scale, color: '#1E3A5F', description: 'Law firms, case management, court deadlines' },
  { slug: 'healthcare', name: 'Healthcare', icon: HeartPulse, color: '#0D7377', description: 'Clinics, appointments, patient follow-ups' },
  { slug: 'dev_teams', name: 'Dev Teams', icon: Code, color: '#7C3AED', description: 'Sprints, issues, code review, deployments' },
  { slug: 'construction', name: 'Construction', icon: HardHat, color: '#C2410C', description: 'Job sites, inspections, permits, safety' },
  { slug: 'real_estate', name: 'Real Estate', icon: Home, color: '#0891B2', description: 'Listings, showings, transactions, leads' },
  { slug: 'education', name: 'Education', icon: GraduationCap, color: '#2563EB', description: 'Courses, assignments, grading, curriculum' },
  { slug: 'finance', name: 'Finance', icon: Landmark, color: '#047857', description: 'Accounting, audits, client portfolios' },
  { slug: 'hr', name: 'HR', icon: Users, color: '#DB2777', description: 'Hiring, onboarding, performance reviews' },
  { slug: 'marketing', name: 'Marketing', icon: Megaphone, color: '#E11D48', description: 'Campaigns, content, social media' },
  { slug: 'family', name: 'Family', icon: House, color: '#8B5CF6', description: 'Chores, meal plans, events, vacations' },
  { slug: 'students', name: 'Students', icon: BookOpen, color: '#4F46E5', description: 'Homework, exams, study plans, projects' },
] as const;

// ─── Page ────────────────────────────────────────────────────────

export default function CreateOrgPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addOrg, switchOrg } = useOrgStore();

  const [name, setName] = useState('');
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Auto-generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);

  const createMutation = useMutation({
    mutationFn: () =>
      createOrganization({
        name: name.trim(),
        slug,
        industryMode: selectedMode ?? undefined,
      }),
    onSuccess: (org) => {
      addOrg(org);
      switchOrg(org.id);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.push('/');
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !slug) return;
      createMutation.mutate();
    },
    [name, slug, createMutation],
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/"
          className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors"
        >
          <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center shadow-lg">
          <Building2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">
            Create Organization
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            Set up a workspace for your team
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., METAminds, Acme Corp"
            className="w-full px-4 py-3 rounded-xl bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/10 transition-all"
            autoFocus
          />
          {slug && (
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5">
              URL: app.unjynx.me/org/<span className="text-[var(--accent)]">{slug}</span>
            </p>
          )}
        </div>

        {/* Industry Mode */}
        <div>
          <label className="text-sm font-medium text-[var(--foreground)] mb-2 block">
            What does your team do?{' '}
            <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
          </label>
          <p className="text-xs text-[var(--muted-foreground)] mb-3">
            This customizes vocabulary, templates, and dashboard for your industry.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.slug;
              return (
                <button
                  key={mode.slug}
                  type="button"
                  onClick={() =>
                    setSelectedMode(isSelected ? null : mode.slug)
                  }
                  className={cn(
                    'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all',
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20'
                      : 'border-[var(--border)] bg-[var(--background-surface)] hover:border-[var(--accent)]/30',
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${mode.color}20`, color: mode.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                      {mode.name}
                    </span>
                    {isSelected && (
                      <Check size={12} className="text-[var(--accent)] ml-auto flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2 pl-9">
                    {mode.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!name.trim() || createMutation.isPending}
          className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--gold-rich)] hover:opacity-90 transition-opacity text-white"
          size="lg"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Building2 size={16} className="mr-2" />
              Create Organization
            </>
          )}
        </Button>

        {createMutation.isError && (
          <p className="text-xs text-[var(--destructive)] text-center">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Failed to create organization'}
          </p>
        )}
      </form>
    </div>
  );
}
