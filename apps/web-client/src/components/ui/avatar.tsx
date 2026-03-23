// ---------------------------------------------------------------------------
// Avatar - shadcn/ui-style with UNJYNX theme
// ---------------------------------------------------------------------------

'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AvatarProps {
  readonly src?: string | null;
  readonly alt?: string;
  readonly fallback?: string;
  readonly size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl';
  readonly className?: string;
  readonly status?: 'online' | 'offline' | 'busy' | 'away';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIZE_CLASSES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  default: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
} as const;

const STATUS_CLASSES = {
  online: 'bg-unjynx-emerald',
  offline: 'bg-[var(--muted-foreground)]',
  busy: 'bg-unjynx-rose',
  away: 'bg-unjynx-amber',
} as const;

const STATUS_DOT_SIZE = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border',
  default: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Generate a deterministic hue from a string for the fallback background
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Avatar({ src, alt = '', fallback, size = 'default', className, status }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showFallback = !src || imageError;

  const initials = fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?';
  const hue = stringToHue(fallback ?? alt ?? '');

  return (
    <div className={cn('relative inline-flex flex-shrink-0', className)}>
      <div
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden rounded-full',
          SIZE_CLASSES[size],
          showFallback && 'border border-[var(--border)]',
        )}
        style={
          showFallback
            ? { backgroundColor: `hsl(${hue}, 40%, 25%)` }
            : undefined
        }
      >
        {showFallback ? (
          <span className="font-outfit font-semibold text-white/90 select-none">
            {initials}
          </span>
        ) : (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            draggable={false}
          />
        )}
      </div>

      {status ? (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-[var(--card)]',
            STATUS_CLASSES[status],
            STATUS_DOT_SIZE[size],
          )}
          aria-label={`Status: ${status}`}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AvatarGroup
// ---------------------------------------------------------------------------

interface AvatarGroupProps {
  readonly avatars: readonly { readonly src?: string | null; readonly alt?: string; readonly fallback?: string }[];
  readonly max?: number;
  readonly size?: AvatarProps['size'];
  readonly className?: string;
}

function AvatarGroup({ avatars, max = 4, size = 'sm', className }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visible.map((avatar, i) => (
        <Avatar
          key={i}
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          size={size}
          className="ring-2 ring-[var(--card)]"
        />
      ))}
      {remaining > 0 ? (
        <div
          className={cn(
            'relative inline-flex items-center justify-center rounded-full bg-[var(--background-elevated)] border border-[var(--border)] ring-2 ring-[var(--card)]',
            SIZE_CLASSES[size ?? 'sm'],
          )}
        >
          <span className="font-dm-sans font-medium text-[var(--muted-foreground)]">
            +{remaining}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export { Avatar, AvatarGroup };
