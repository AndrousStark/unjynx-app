'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { useOrgStore, useCurrentOrg, useHasOrgRole } from '@/lib/store/org-store';
import {
  getMembers, inviteMember, updateMemberRole, removeMember, getPendingInvites,
  type OrgMember, type OrgInvite,
} from '@/lib/api/organizations';
import {
  Users, UserPlus, Mail, Shield, Crown, Eye,
  MoreHorizontal, Trash2, Loader2, X, Check,
  Clock, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Role Config ─────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  owner: { icon: Crown, color: 'text-[var(--gold)]', bg: 'bg-[var(--gold)]/10', label: 'Owner' },
  admin: { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Admin' },
  manager: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Manager' },
  member: { icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Member' },
  viewer: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Viewer' },
  guest: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Guest' },
};

// ─── Member Row ──────────────────────────────────────────────────

function MemberRow({
  member,
  isAdmin,
  onRoleChange,
  onRemove,
}: {
  readonly member: OrgMember;
  readonly isAdmin: boolean;
  readonly onRoleChange: (userId: string, role: string) => void;
  readonly onRemove: (userId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const role = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
  const RoleIcon = role.icon;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-surface)] transition-colors rounded-lg">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        {member.userId.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{member.userId.slice(0, 12)}</p>
        <p className="text-[10px] text-[var(--muted-foreground)]">
          Joined {new Date(member.joinedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Role badge */}
      <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5', role.color, role.bg)}>
        <RoleIcon size={10} className="mr-1" />
        {role.label}
      </Badge>

      {/* Actions */}
      {isAdmin && member.role !== 'owner' && (
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)]"
          >
            <MoreHorizontal size={14} />
          </button>
          {showActions && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} aria-hidden />
              <div className="absolute right-0 top-full mt-1 z-50 w-40 py-1 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
                {['admin', 'manager', 'member', 'viewer'].map((r) => (
                  <button
                    key={r}
                    onClick={() => { onRoleChange(member.userId, r); setShowActions(false); }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--sidebar-hover)] transition-colors capitalize',
                      member.role === r && 'text-[var(--accent)] font-medium',
                    )}
                  >
                    {r === member.role ? `${r} (current)` : `Make ${r}`}
                  </button>
                ))}
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  onClick={() => { onRemove(member.userId); setShowActions(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[var(--destructive)] hover:bg-[var(--destructive)]/5 transition-colors"
                >
                  <Trash2 size={10} className="inline mr-1.5" />Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Invite Form ─────────────────────────────────────────────────

function InviteForm({
  orgId,
  onInvited,
}: {
  readonly orgId: string;
  readonly onInvited: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const mutation = useMutation({
    mutationFn: () => inviteMember(orgId, { email: email.trim(), role }),
    onSuccess: () => { setEmail(''); onInvited(); },
  });

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] mb-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
        <UserPlus size={14} /> Invite Member
      </h3>
      <div className="flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] outline-none"
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
        <Button size="sm" onClick={() => mutation.mutate()} disabled={!email.trim() || mutation.isPending}>
          {mutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} className="mr-1" />}
          Invite
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-[var(--destructive)]">{(mutation.error as Error).message}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-xs text-[var(--success)]">Invite sent! They have 7 days to accept.</p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function MembersPage() {
  const queryClient = useQueryClient();
  const currentOrg = useCurrentOrg();
  const isAdmin = useHasOrgRole('admin');
  const [showInvite, setShowInvite] = useState(false);

  const orgId = currentOrg?.id ?? '';

  const { data: members, isLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getMembers(orgId),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const { data: invites } = useQuery({
    queryKey: ['org-invites', orgId],
    queryFn: () => getPendingInvites(orgId),
    enabled: !!orgId && isAdmin,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateMemberRole(orgId, userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-members', orgId] }),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org-members', orgId] }),
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
            <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center shadow-lg">
            <Users size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Members</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">
              {currentOrg?.name ?? 'Organization'} &bull; {members?.length ?? 0} members
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setShowInvite(!showInvite)}>
            <UserPlus size={12} className="mr-1" /> Invite
          </Button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && isAdmin && (
        <InviteForm orgId={orgId} onInvited={() => queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] })} />
      )}

      {/* Pending Invites */}
      {invites && invites.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2 px-1">
            Pending Invites ({invites.length})
          </h3>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[var(--background-surface)] mb-1">
              <Mail size={14} className="text-[var(--muted-foreground)]" />
              <span className="text-sm text-[var(--foreground)] flex-1">{inv.email}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{inv.role}</Badge>
              <span className="text-[10px] text-[var(--muted-foreground)] flex items-center gap-1">
                <Clock size={10} /> Expires {new Date(inv.expiresAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Member List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => <Shimmer key={i} className="h-16 rounded-lg" />)}
        </div>
      ) : !members || members.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--foreground)]">No members yet</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Invite your team to get started.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              isAdmin={isAdmin}
              onRoleChange={(userId, role) => roleMutation.mutate({ userId, role })}
              onRemove={(userId) => {
                if (confirm('Remove this member?')) removeMutation.mutate(userId);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
