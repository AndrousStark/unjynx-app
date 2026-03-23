'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeams,
  getMembers,
  getInvites,
  inviteMember,
  removeMember,
  updateMemberRole,
  revokeInvite,
  type TeamMember,
  type TeamInvite,
  type TeamRole,
} from '@/lib/api/team';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  UserPlus,
  MoreHorizontal,
  Shield,
  Crown,
  Eye,
  User,
  Mail,
  X,
  Clock,
  ChevronDown,
  Trash2,
} from 'lucide-react';

// ─── Role Badge ─────────────────────────────────────────────────

const ROLE_CONFIG: Record<TeamRole, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: 'Owner', icon: <Crown size={12} />, color: 'text-unjynx-gold bg-unjynx-gold/15' },
  admin: { label: 'Admin', icon: <Shield size={12} />, color: 'text-unjynx-violet bg-unjynx-violet/15' },
  member: { label: 'Member', icon: <User size={12} />, color: 'text-unjynx-emerald bg-unjynx-emerald/15' },
  viewer: { label: 'Viewer', icon: <Eye size={12} />, color: 'text-[var(--muted-foreground)] bg-[var(--muted)]' },
};

function RoleBadge({ role }: { readonly role: TeamRole }) {
  const config = ROLE_CONFIG[role];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', config.color)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Invite Modal ───────────────────────────────────────────────

function InviteModal({
  open,
  onClose,
  teamId,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly teamId: string;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(teamId, { email, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'invites'] });
      setEmail('');
      setRole('member');
      onClose();
    },
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg animate-scale-in" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h3 className="font-outfit font-semibold text-[var(--foreground)]">Invite Member</h3>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--background-surface)] transition-colors">
              <X size={18} className="text-[var(--muted-foreground)]" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Email</label>
              <div className="flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background-surface)]">
                <Mail size={16} className="text-[var(--muted-foreground)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] mb-1 block">Role</label>
              <div className="flex gap-2">
                {(['admin', 'member', 'viewer'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors',
                      role === r
                        ? 'border-unjynx-violet bg-unjynx-violet/10 text-unjynx-violet'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => inviteMutation.mutate()}
              disabled={!email.trim()}
              isLoading={inviteMutation.isPending}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Member Row ─────────────────────────────────────────────────

function MemberRow({
  member,
  teamId,
}: {
  readonly member: TeamMember;
  readonly teamId: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: () => removeMember(teamId, member.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] }),
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background-surface)] transition-colors rounded-lg">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-unjynx-violet/30 to-unjynx-gold/30 flex items-center justify-center text-sm font-bold text-[var(--foreground)] flex-shrink-0">
        {member.displayName[0]?.toUpperCase() ?? 'U'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{member.displayName}</p>
        <p className="text-xs text-[var(--muted-foreground)] truncate">{member.email}</p>
      </div>
      <RoleBadge role={member.role} />
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded hover:bg-[var(--background-elevated)] transition-colors"
        >
          <MoreHorizontal size={16} className="text-[var(--muted-foreground)]" />
        </button>
        {menuOpen && member.role !== 'owner' && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--popover)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-10 animate-scale-in">
            {(['admin', 'member', 'viewer'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  updateMemberRole(teamId, member.id, { role: r });
                  queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
                  setMenuOpen(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-left hover:bg-[var(--background-surface)] transition-colors capitalize"
              >
                Set as {r}
              </button>
            ))}
            <div className="border-t border-[var(--border)] my-1" />
            <button
              onClick={() => {
                if (window.confirm(`Remove ${member.displayName}?`)) {
                  removeMutation.mutate();
                }
                setMenuOpen(false);
              }}
              className="w-full px-3 py-1.5 text-xs text-left text-unjynx-rose hover:bg-unjynx-rose/10 transition-colors"
            >
              Remove member
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Members Page ───────────────────────────────────────────────

export default function MembersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    staleTime: 60_000,
  });

  const teamId = teams?.[0]?.id;

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => getMembers(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  });

  const { data: invites } = useQuery({
    queryKey: ['teams', teamId, 'invites'],
    queryFn: () => getInvites(teamId!),
    enabled: !!teamId,
    staleTime: 60_000,
  });

  const isLoading = teamsLoading || membersLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Shimmer variant="circle" className="w-9 h-9" />
            <div className="flex-1 space-y-1">
              <Shimmer className="h-3 w-32" />
              <Shimmer className="h-2.5 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!teamId) {
    return (
      <EmptyState
        icon={<UserPlus size={32} className="text-unjynx-gold" />}
        title="No team found"
        description="Create a team first to manage members."
      />
    );
  }

  const pendingInvites = invites?.filter((i) => i.status === 'pending') ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">
            Team Members
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {members?.length ?? 0} members{pendingInvites.length > 0 ? ` | ${pendingInvites.length} pending` : ''}
          </p>
        </div>
        <Button variant="default" size="sm" onClick={() => setInviteOpen(true)}>
          <UserPlus size={14} />
          Invite
        </Button>
      </div>

      {/* Member list */}
      <div className="glass-card divide-y divide-[var(--border)]">
        {members?.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No members yet. Invite your team!
          </p>
        ) : (
          members?.map((m) => (
            <MemberRow key={m.id} member={m} teamId={teamId} />
          ))
        )}
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-2">
            Pending Invites
          </h3>
          <div className="glass-card divide-y divide-[var(--border)]">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <Clock size={16} className="text-[var(--muted-foreground)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--foreground)] truncate">{invite.email}</p>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <RoleBadge role={invite.role} />
                <button
                  onClick={() => revokeInvite(teamId, invite.id)}
                  className="p-1 rounded hover:bg-unjynx-rose/10 text-[var(--muted-foreground)] hover:text-unjynx-rose transition-colors"
                  title="Revoke invite"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} teamId={teamId} />
    </div>
  );
}
