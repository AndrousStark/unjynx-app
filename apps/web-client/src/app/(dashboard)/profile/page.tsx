'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { updateProfile, type UpdateProfilePayload } from '@/lib/api/auth';
import { useChannels } from '@/lib/hooks/use-dashboard';
import { cn } from '@/lib/utils/cn';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shimmer, ShimmerGroup } from '@/components/ui/shimmer';
import {
  User,
  Mail,
  Calendar,
  CheckCircle2,
  Flame,
  Trophy,
  Camera,
  Save,
  Radio,
  Crown,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Plan Badge
// ---------------------------------------------------------------------------

function PlanBadge({ plan }: { readonly plan: string }) {
  const variants: Record<string, { variant: 'gold' | 'primary' | 'default'; label: string }> = {
    enterprise: { variant: 'gold', label: 'Enterprise' },
    team: { variant: 'primary', label: 'Team' },
    pro: { variant: 'gold', label: 'Pro' },
    free: { variant: 'default', label: 'Free' },
  };

  const config = variants[plan] ?? variants.free;

  return (
    <Badge variant={config.variant} size="lg">
      <Crown size={12} className="mr-1" />
      {config.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Stats Card
// ---------------------------------------------------------------------------

function StatItem({
  icon,
  value,
  label,
}: {
  readonly icon: React.ReactNode;
  readonly value: string | number;
  readonly label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background-surface)]">
      <div className="w-10 h-10 rounded-lg bg-unjynx-violet/15 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bebas text-xl text-[var(--foreground)]">{value}</p>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connected Channels Section
// ---------------------------------------------------------------------------

function ConnectedChannels() {
  const { data: channels, isLoading } = useChannels();

  if (isLoading) {
    return (
      <div className="glass-card p-5">
        <Shimmer className="h-4 w-32 mb-4" />
        <ShimmerGroup count={3} />
      </div>
    );
  }

  const channelList = channels ?? [];
  const connectedCount = channelList.filter(
    (ch) => ch.status === 'connected',
  ).length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={16} className="text-unjynx-emerald" />
        <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
          Connected Channels
        </h3>
        <Badge variant="success" size="sm" className="ml-auto">
          {connectedCount} active
        </Badge>
      </div>

      {channelList.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
          No channels connected yet.
        </p>
      ) : (
        <div className="space-y-2">
          {channelList.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--background-surface)]"
            >
              <span className="text-sm capitalize flex-1">{ch.name}</span>
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  ch.status === 'connected'
                    ? 'bg-unjynx-emerald'
                    : 'bg-[var(--muted-foreground)]',
                )}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Profile Form
// ---------------------------------------------------------------------------

function EditProfileForm({
  initialName,
  initialAvatar,
  onSaved,
}: {
  readonly initialName: string;
  readonly initialAvatar: string | null;
  readonly onSaved: () => void;
}) {
  const [displayName, setDisplayName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!displayName.trim()) {
        setError('Display name is required.');
        return;
      }

      setIsSaving(true);
      setError(null);
      setSuccess(false);

      try {
        const payload: UpdateProfilePayload = {
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || null,
        };
        await updateProfile(payload);
        setSuccess(true);
        onSaved();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
      } finally {
        setIsSaving(false);
      }
    },
    [displayName, avatarUrl, onSaved],
  );

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
        Edit Profile
      </h3>

      {error && (
        <div className="px-3 py-2 rounded-lg bg-unjynx-rose/10 border border-unjynx-rose/20 text-sm text-unjynx-rose">
          {error}
        </div>
      )}

      {success && (
        <div className="px-3 py-2 rounded-lg bg-unjynx-emerald/10 border border-unjynx-emerald/20 text-sm text-unjynx-emerald">
          Profile updated successfully.
        </div>
      )}

      <Input
        id="displayName"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Display name"
        icon={<User size={16} />}
      />

      <Input
        id="avatarUrl"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="Avatar URL (optional)"
        icon={<Camera size={16} />}
      />

      <Button type="submit" isLoading={isSaving} className="w-full">
        <Save size={16} />
        Save Changes
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Profile Page
// ---------------------------------------------------------------------------

export default function ProfilePage() {
  const { user, isLoading, refetch } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Shimmer className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Shimmer variant="card" className="h-48" />
            <Shimmer variant="card" className="h-64" />
          </div>
          <div className="space-y-4">
            <Shimmer variant="card" className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">
        Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Profile Card */}
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <Avatar
                src={user.avatarUrl}
                fallback={user.displayName}
                size="xl"
              />

              {/* Info */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                  <h2 className="font-outfit text-2xl font-bold text-[var(--foreground)]">
                    {user.displayName}
                  </h2>
                  <PlanBadge plan={user.plan} />
                </div>

                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start text-[var(--muted-foreground)]">
                  <Mail size={14} />
                  <span className="text-sm">{user.email}</span>
                </div>

                <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start text-[var(--muted-foreground)]">
                  <Calendar size={14} />
                  <span className="text-sm">
                    Member since {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="glass-card p-5">
            <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)] mb-4">
              Activity Stats
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatItem
                icon={<Calendar size={18} className="text-unjynx-violet" />}
                value={memberSince}
                label="Member Since"
              />
              <StatItem
                icon={<CheckCircle2 size={18} className="text-unjynx-emerald" />}
                value="--"
                label="Total Tasks"
              />
              <StatItem
                icon={<Flame size={18} className="text-unjynx-amber" />}
                value="--"
                label="Day Streak"
              />
              <StatItem
                icon={<Trophy size={18} className="text-unjynx-gold" />}
                value="--"
                label="Total XP"
              />
            </div>
          </div>

          {/* Edit Profile Form */}
          <EditProfileForm
            initialName={user.displayName}
            initialAvatar={user.avatarUrl}
            onSaved={() => refetch()}
          />
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-4 lg:space-y-6">
          <ConnectedChannels />
        </div>
      </div>
    </div>
  );
}
