'use client';

import { useQuery } from '@tanstack/react-query';
import { getTeams, getMembers, type Team, type TeamMember } from '@/lib/api/team';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Users,
  Plus,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Crown,
} from 'lucide-react';

// ─── Team Stats Card ────────────────────────────────────────────

function TeamStatCard({
  icon,
  value,
  label,
  accent,
}: {
  readonly icon: React.ReactNode;
  readonly value: string | number;
  readonly label: string;
  readonly accent: string;
}) {
  return (
    <div className="glass-card p-4">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', accent)}>
        {icon}
      </div>
      <p className="font-bebas text-2xl text-[var(--foreground)]">{value}</p>
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
    </div>
  );
}

// ─── Team Activity Feed ─────────────────────────────────────────

function ActivityFeed({ members }: { readonly members: readonly TeamMember[] }) {
  // Derive recent activity from member lastActiveAt — real activity
  const recentMembers = [...members]
    .filter((m) => m.lastActiveAt !== null)
    .sort((a, b) => new Date(b.lastActiveAt!).getTime() - new Date(a.lastActiveAt!).getTime())
    .slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-unjynx-violet" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">Recent Activity</h3>
      </div>
      {recentMembers.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">
          No recent activity yet. Activity will appear as team members complete tasks.
        </p>
      ) : (
        <div className="space-y-3">
          {recentMembers.map((m) => {
            const lastActive = m.lastActiveAt ? new Date(m.lastActiveAt) : null;
            const ago = lastActive ? formatTimeAgo(lastActive) : '';
            return (
              <div key={m.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-unjynx-violet/30 to-unjynx-gold/30 flex items-center justify-center text-[10px] font-bold text-[var(--foreground)] flex-shrink-0 mt-0.5">
                  {m.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--foreground)]">
                    <span className="font-medium">{m.displayName}</span>{' '}
                    <span className="text-[var(--muted-foreground)]">was active</span>{' '}
                    <span className="font-medium">{m.role}</span>
                  </p>
                  <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">{ago}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Top Contributors ───────────────────────────────────────────

function TopContributors({ members }: { readonly members: readonly TeamMember[] }) {
  // Sort members by most recently active as a proxy for contribution
  const sorted = [...members]
    .sort((a, b) => {
      const aTime = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
      const bTime = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Crown size={16} className="text-unjynx-gold" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">Team Members</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-[var(--muted-foreground)] py-4 text-center">
          No members yet. Invite people to your team to get started.
        </p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((m, i) => (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[var(--muted-foreground)] w-4">{i + 1}</span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-unjynx-violet/30 to-unjynx-gold/30 flex items-center justify-center text-[10px] font-bold text-[var(--foreground)]">
                {m.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--foreground)]">{m.displayName}</p>
                <p className="text-[10px] text-[var(--muted-foreground)]">{m.role} · {m.email}</p>
              </div>
              {m.lastActiveAt && (
                <div className="flex items-center gap-1 text-unjynx-gold">
                  <TrendingUp size={12} />
                  <span className="text-[10px] font-medium">{formatTimeAgo(new Date(m.lastActiveAt))}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Team Dashboard Page ────────────────────────────────────────

export default function TeamPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
    staleTime: 60_000,
  });

  const team = teams?.[0];

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', team?.id],
    queryFn: () => getMembers(team!.id),
    enabled: !!team,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Shimmer key={i} variant="stat" />
          ))}
        </div>
        <Shimmer variant="card" className="h-[300px]" />
      </div>
    );
  }

  if (!team) {
    return (
      <EmptyState
        icon={<Users size={32} className="text-unjynx-gold" />}
        title="No team yet"
        description="Create a team to start collaborating with others."
        action={
          <Button variant="default">
            <Plus size={16} />
            Create Team
          </Button>
        }
      />
    );
  }

  // Derive stats from real member data
  const activeMembers = members.filter((m) => {
    if (!m.lastActiveAt) return false;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(m.lastActiveAt).getTime() > sevenDaysAgo;
  });
  const activeRatio = members.length > 0
    ? `${Math.round((activeMembers.length / members.length) * 100)}%`
    : '0%';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Team header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-unjynx-violet to-unjynx-gold flex items-center justify-center text-white font-bebas text-2xl">
            {team.name[0]}
          </div>
          <div>
            <h2 className="font-outfit text-xl font-bold text-[var(--foreground)]">{team.name}</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              {team.memberCount} members  |  {team.description ?? 'No description'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TeamStatCard
          icon={<Users size={18} className="text-unjynx-violet" />}
          value={members.length}
          label="Team Members"
          accent="bg-unjynx-violet/15"
        />
        <TeamStatCard
          icon={<CheckCircle2 size={18} className="text-unjynx-emerald" />}
          value={activeMembers.length}
          label="Active This Week"
          accent="bg-unjynx-emerald/15"
        />
        <TeamStatCard
          icon={<Clock size={18} className="text-unjynx-amber" />}
          value={team.plan}
          label="Team Plan"
          accent="bg-unjynx-amber/15"
        />
        <TeamStatCard
          icon={<BarChart3 size={18} className="text-unjynx-gold" />}
          value={activeRatio}
          label="Activity Rate"
          accent="bg-unjynx-gold/15"
        />
      </div>

      {/* Activity + Contributors */}
      {membersLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <Shimmer variant="card" className="h-[250px]" />
          <Shimmer variant="card" className="h-[250px]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <ActivityFeed members={members} />
          <TopContributors members={members} />
        </div>
      )}
    </div>
  );
}
