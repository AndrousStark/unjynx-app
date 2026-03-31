'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api/organizations';
import { useOrgStore } from '@/lib/store/org-store';
import { useAuth } from '@/lib/hooks/use-auth';
import { cn } from '@/lib/utils/cn';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';
import { User, Search, X, UserPlus } from 'lucide-react';

interface AssigneePickerProps {
  readonly value: string | null;
  readonly onChange: (userId: string | null) => void;
  readonly size?: 'sm' | 'md';
  readonly showLabel?: boolean;
}

interface MemberInfo {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly role: string;
  readonly avatarUrl?: string;
}

export function AssigneePicker({
  value,
  onChange,
  size = 'md',
  showLabel = true,
}: AssigneePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { currentOrgId } = useOrgStore();
  const { user } = useAuth();
  const t = useVocabulary();

  const { data: members } = useQuery({
    queryKey: ['org-members', currentOrgId],
    queryFn: () => getMembers(currentOrgId!),
    enabled: !!currentOrgId,
    staleTime: 5 * 60_000,
  });

  const memberList: readonly MemberInfo[] = useMemo(() => {
    if (!members) return [];
    return members.map((m) => ({
      userId: m.userId,
      displayName: m.userId === (user as { id: string } | undefined)?.id ? 'You' : m.userId.slice(0, 8),
      email: null,
      role: m.role,
    }));
  }, [members, user]);

  const filtered = useMemo(() => {
    if (!search) return memberList;
    const q = search.toLowerCase();
    return memberList.filter(
      (m) => m.displayName.toLowerCase().includes(q) || m.role.includes(q),
    );
  }, [memberList, search]);

  const selectedMember = memberList.find((m) => m.userId === value);

  const avatarSize = size === 'sm' ? 'w-5 h-5 text-[8px]' : 'w-6 h-6 text-[10px]';

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-transparent transition-colors',
          'hover:border-[var(--border)] hover:bg-[var(--background-surface)]',
          size === 'sm' ? 'px-1.5 py-1' : 'px-2.5 py-1.5',
        )}
      >
        {value && selectedMember ? (
          <>
            <div className={cn(avatarSize, 'rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold')}>
              {selectedMember.displayName[0]}
            </div>
            {showLabel && (
              <span className="text-xs text-[var(--foreground)]">{selectedMember.displayName}</span>
            )}
          </>
        ) : (
          <>
            <div className={cn(avatarSize, 'rounded-full border border-dashed border-[var(--border)] flex items-center justify-center')}>
              <User size={size === 'sm' ? 10 : 12} className="text-[var(--muted-foreground)]" />
            </div>
            {showLabel && (
              <span className="text-xs text-[var(--muted-foreground)]">{t('Assignee')}</span>
            )}
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(''); }} aria-hidden />
          <div className="absolute top-full left-0 z-50 mt-1 w-56 py-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Search */}
            <div className="px-2 py-1.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--background-surface)]">
                <Search size={12} className="text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search members..."
                  className="flex-1 text-xs bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* "Assign to me" shortcut */}
            {user && (
              <button
                type="button"
                onClick={() => {
                  onChange((user as { id: string }).id);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--accent)]"
              >
                <UserPlus size={12} />
                Assign to me
              </button>
            )}

            {/* Unassign option */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                  setSearch('');
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--muted-foreground)]"
              >
                <X size={12} />
                Unassign
              </button>
            )}

            <div className="border-t border-[var(--border)] my-1" />

            {/* Member list */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-[var(--muted-foreground)]">No members found</p>
              ) : (
                filtered.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => {
                      onChange(member.userId);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-[var(--sidebar-hover)] transition-colors',
                      value === member.userId && 'bg-[var(--accent)]/5',
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {member.displayName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[var(--foreground)] truncate block">{member.displayName}</span>
                      <span className="text-[9px] text-[var(--muted-foreground)]">{member.role}</span>
                    </div>
                    {value === member.userId && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
