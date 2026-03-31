'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { updateOrganization } from '@/lib/api/organizations';
import { useOrgStore, useCurrentOrg } from '@/lib/store/org-store';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import {
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
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

// ─── Mode Data ───────────────────────────────────────────────────

interface IndustryMode {
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly icon: string | null;
  readonly colorHex: string | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  scale: Scale, 'heart-pulse': HeartPulse, code: Code, 'hard-hat': HardHat,
  home: Home, 'graduation-cap': GraduationCap, landmark: Landmark,
  users: Users, megaphone: Megaphone, house: House, 'book-open': BookOpen,
};

// ─── Page ────────────────────────────────────────────────────────

export default function ModeSettingsPage() {
  const queryClient = useQueryClient();
  const currentOrg = useCurrentOrg();
  const { updateOrg } = useOrgStore();
  const [selected, setSelected] = useState<string | null>(currentOrg?.industryMode ?? null);

  const { data: modes, isLoading } = useQuery({
    queryKey: ['industry-modes'],
    queryFn: () => apiClient.get<readonly IndustryMode[]>('/api/v1/modes'),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!currentOrg) throw new Error('No organization selected');
      return updateOrganization(currentOrg.id, { industryMode: selected });
    },
    onSuccess: () => {
      if (currentOrg) updateOrg(currentOrg.id, { industryMode: selected });
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });

  const hasChanged = selected !== (currentOrg?.industryMode ?? null);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-pink-500 flex items-center justify-center shadow-lg">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Industry Mode</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">
            Customize vocabulary, templates, and dashboard for your industry
          </p>
        </div>
      </div>

      {currentOrg?.isPersonal && (
        <div className="p-3 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 mb-6">
          <p className="text-xs text-[var(--warning)]">
            Industry modes work best with team organizations. Create an org first.
          </p>
        </div>
      )}

      {/* Mode Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[var(--background-surface)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* None option */}
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border mb-3 text-left transition-all',
              selected === null
                ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20'
                : 'border-[var(--border)] bg-[var(--background-surface)] hover:border-[var(--accent)]/30',
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
              <span className="text-gray-400 text-sm font-bold">G</span>
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-[var(--foreground)]">General</span>
              <p className="text-[10px] text-[var(--muted-foreground)]">No industry-specific customization</p>
            </div>
            {selected === null && <Check size={16} className="text-[var(--accent)]" />}
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(modes ?? [])
              .filter((m) => !['general', 'hustle', 'closer', 'grind'].includes(m.slug))
              .map((mode) => {
                const Icon = ICON_MAP[mode.icon ?? ''] ?? Sparkles;
                const isSelected = selected === mode.slug;
                return (
                  <button
                    key={mode.slug}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : mode.slug)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 ring-1 ring-[var(--accent)]/20'
                        : 'border-[var(--border)] bg-[var(--background-surface)] hover:border-[var(--accent)]/30',
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${mode.colorHex ?? '#6C5CE7'}20`, color: mode.colorHex ?? '#6C5CE7' }}
                      >
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-semibold text-[var(--foreground)] flex-1 truncate">
                        {mode.name}
                      </span>
                      {isSelected && <Check size={14} className="text-[var(--accent)] flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-[var(--muted-foreground)] line-clamp-2">
                      {mode.description}
                    </p>
                  </button>
                );
              })}
          </div>
        </>
      )}

      {/* Save Button */}
      {hasChanged && (
        <div className="sticky bottom-4 mt-6">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full bg-gradient-to-r from-[var(--accent)] to-[var(--gold-rich)] text-white"
            size="lg"
          >
            {saveMutation.isPending ? (
              <><Loader2 size={14} className="mr-2 animate-spin" />Saving...</>
            ) : (
              <><Check size={14} className="mr-2" />Save Industry Mode</>
            )}
          </Button>
        </div>
      )}

      {saveMutation.isSuccess && (
        <p className="text-xs text-[var(--success)] text-center mt-3">
          Mode updated! Vocabulary and templates will refresh.
        </p>
      )}
    </div>
  );
}
