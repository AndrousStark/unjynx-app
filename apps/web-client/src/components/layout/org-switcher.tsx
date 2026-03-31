'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useOrgStore, useCurrentOrg } from '@/lib/store/org-store';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import {
  ChevronDown,
  Check,
  Plus,
  Building2,
  User,
  Crown,
  Shield,
  Settings,
} from 'lucide-react';

// ─── Role Badge ──────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: 'text-[var(--gold)] bg-[var(--gold)]/10',
  admin: 'text-purple-400 bg-purple-500/10',
  manager: 'text-blue-400 bg-blue-500/10',
  member: 'text-emerald-400 bg-emerald-500/10',
  viewer: 'text-gray-400 bg-gray-500/10',
  guest: 'text-gray-400 bg-gray-500/10',
};

const PLAN_BADGES: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'text-gray-400 bg-gray-500/10' },
  pro: { label: 'Pro', color: 'text-[var(--gold)] bg-[var(--gold)]/10' },
  team: { label: 'Team', color: 'text-purple-400 bg-purple-500/10' },
  enterprise: { label: 'Enterprise', color: 'text-blue-400 bg-blue-500/10' },
};

// ─── Component ───────────────────────────────────────────────────

export function OrgSwitcher({ collapsed }: { readonly collapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { currentOrgId, userOrgs, switchOrg, currentRole } = useOrgStore();
  const currentOrg = useCurrentOrg();

  // Cmd+Shift+W to toggle dropdown
  useKeyboardShortcut('w', () => setIsOpen((prev) => !prev), { meta: true, shift: true });

  const handleSwitch = (orgId: string) => {
    switchOrg(orgId);
    setIsOpen(false);
    // Invalidate all queries when switching org
    window.location.reload();
  };

  const handleCreateOrg = () => {
    setIsOpen(false);
    router.push('/create-org');
  };

  // Get initials for org avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  // Collapsed: just show the org avatar
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-full h-12 relative"
        title={currentOrg?.name ?? 'Personal'}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold">
          {currentOrg ? getInitials(currentOrg.name) : <User size={14} />}
        </div>

        {isOpen && (
          <OrgDropdown
            orgs={userOrgs}
            currentOrgId={currentOrgId}
            currentRole={currentRole}
            onSwitch={handleSwitch}
            onCreate={handleCreateOrg}
            onClose={() => setIsOpen(false)}
            position="left"
          />
        )}
      </button>
    );
  }

  return (
    <div className="relative px-3 py-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg',
          'hover:bg-[var(--sidebar-hover)] transition-colors duration-150',
          'text-left group',
        )}
      >
        {/* Org Avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {currentOrg?.logoUrl ? (
            <img
              src={currentOrg.logoUrl}
              alt={currentOrg.name}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : currentOrg ? (
            getInitials(currentOrg.name)
          ) : (
            <User size={14} />
          )}
        </div>

        {/* Org Name + Plan */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[var(--foreground)] truncate">
              {currentOrg?.name ?? 'Personal'}
            </span>
            {currentOrg?.isPersonal && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                Personal
              </span>
            )}
          </div>
          {currentOrg && !currentOrg.isPersonal && (
            <span className={cn('text-[10px] px-1.5 py-0 rounded', PLAN_BADGES[currentOrg.plan]?.color)}>
              {PLAN_BADGES[currentOrg.plan]?.label}
            </span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          size={14}
          className={cn(
            'text-[var(--muted-foreground)] transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <OrgDropdown
          orgs={userOrgs}
          currentOrgId={currentOrgId}
          currentRole={currentRole}
          onSwitch={handleSwitch}
          onCreate={handleCreateOrg}
          onClose={() => setIsOpen(false)}
          position="below"
        />
      )}
    </div>
  );
}

// ─── Dropdown ────────────────────────────────────────────────────

function OrgDropdown({
  orgs,
  currentOrgId,
  currentRole,
  onSwitch,
  onCreate,
  onClose,
  position,
}: {
  readonly orgs: readonly { id: string; name: string; slug: string; plan: string; isPersonal: boolean; logoUrl: string | null }[];
  readonly currentOrgId: string | null;
  readonly currentRole: string | null;
  readonly onSwitch: (id: string) => void;
  readonly onCreate: () => void;
  readonly onClose: () => void;
  readonly position: 'below' | 'left';
}) {
  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* Dropdown */}
      <div
        className={cn(
          'absolute z-50 w-72 py-1.5 rounded-xl border border-[var(--border)]',
          'bg-[var(--card)] shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-150',
          position === 'below' ? 'top-full left-3 right-3 mt-1' : 'left-full top-0 ml-2',
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-[var(--border)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Switch workspace
          </p>
        </div>

        {/* Org List */}
        <div className="max-h-64 overflow-y-auto py-1">
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => onSwitch(org.id)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-left',
                'hover:bg-[var(--sidebar-hover)] transition-colors duration-100',
                org.id === currentOrgId && 'bg-[var(--accent)]/5',
              )}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--gold-rich)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {org.logoUrl ? (
                  <img src={org.logoUrl} alt={org.name} className="w-7 h-7 rounded-md object-cover" />
                ) : (
                  getInitials(org.name)
                )}
              </div>

              {/* Name + Plan */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[var(--foreground)] truncate">{org.name}</span>
                  {org.isPersonal && (
                    <User size={10} className="text-[var(--muted-foreground)]" />
                  )}
                </div>
                <span className={cn('text-[9px] px-1 rounded', PLAN_BADGES[org.plan]?.color)}>
                  {PLAN_BADGES[org.plan]?.label}
                </span>
              </div>

              {/* Checkmark */}
              {org.id === currentOrgId && (
                <Check size={14} className="text-[var(--accent)] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border)] my-1" />

        {/* Actions */}
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <Plus size={14} />
          <span>Create new organization</span>
        </button>

        <button
          type="button"
          onClick={() => { onClose(); window.location.href = '/settings'; }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <Settings size={14} />
          <span>Manage organizations</span>
        </button>
      </div>
    </>
  );
}
