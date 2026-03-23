'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Plus,
  Command,
  ChevronRight,
  LogOut,
  Settings,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

// ─── Route Labels (for breadcrumb) ─────────────────────────────

const ROUTE_LABELS: Readonly<Record<string, string>> = {
  tasks: 'Tasks',
  board: 'Board',
  calendar: 'Calendar',
  timeline: 'Timeline',
  table: 'Table',
  channels: 'Channels',
  ai: 'AI Chat',
  progress: 'Progress & Insights',
  settings: 'Settings',
  profile: 'Profile',
  projects: 'Projects',
  game: 'Game Mode',
  enterprise: 'Enterprise',
  members: 'Members',
  reports: 'Reports',
  portfolio: 'Portfolio',
  team: 'Team',
};

// ─── Breadcrumb ─────────────────────────────────────────────────

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      {segments.map((seg, idx) => {
        const path = '/' + segments.slice(0, idx + 1).join('/');
        const label = ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
        const isLast = idx === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight size={12} className="text-[var(--muted-foreground)]" />
            )}
            {isLast ? (
              <span className="text-sm font-semibold text-[var(--foreground)]">{label}</span>
            ) : (
              <Link
                href={path}
                className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </div>
  );
}

// ─── Notification Bell ──────────────────────────────────────────

function NotificationBell() {
  const unreadCount = 3; // TODO: wire to real notification data

  return (
    <button
      className="relative p-2 rounded-lg hover:bg-[var(--background-surface)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors focus-ring"
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute top-1 right-1 flex items-center justify-center',
            'min-w-[16px] h-4 px-1 rounded-full',
            'bg-unjynx-rose text-white text-[10px] font-bold leading-none',
            'animate-slide-up',
          )}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}

// ─── User Avatar Dropdown ───────────────────────────────────────

function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const displayName = user?.displayName ?? 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems: readonly {
    readonly icon: React.ElementType;
    readonly label: string;
    readonly href: string;
  }[] = [
    { icon: User, label: 'Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
    { icon: CreditCard, label: 'Billing', href: '/settings?tab=billing' },
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--background-surface)] transition-colors focus-ring"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {user?.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--border)]"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-unjynx-violet to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold ring-2 ring-[var(--border)]">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-64 rounded-xl overflow-hidden',
            'bg-[var(--popover)] border border-[var(--border)]',
            'unjynx-shadow animate-scale-in origin-top-right z-50',
          )}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
              {user?.email ?? 'user@unjynx.me'}
            </p>
            {user?.plan && user.plan !== 'free' && (
              <span className="mt-1.5 inline-block badge-pro">{user.plan}</span>
            )}
          </div>

          {/* Menu */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-surface)] hover:text-[var(--foreground)] transition-colors"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Theme toggle */}
            <button
              onClick={() => { toggleTheme(); setIsOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-surface)] hover:text-[var(--foreground)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Sign out */}
          <div className="py-1 border-t border-[var(--border)]">
            <button
              onClick={() => { setIsOpen(false); logout(); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-unjynx-rose hover:bg-unjynx-rose/10 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ────────────────────────────────────────────────

export function Navbar() {
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setCreateTaskOpen = useUiStore((s) => s.setCreateTaskOpen);

  const handleHamburger = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 lg:px-6 glass-nav">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleHamburger}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--background-surface)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors focus-ring"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <Breadcrumb />
      </div>

      {/* Center: Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          'flex items-center gap-2 px-3.5 py-2 rounded-xl',
          'border border-[var(--border)] bg-[var(--background-surface)]',
          'hover:bg-[var(--background-elevated)] hover:border-[var(--accent)]/30',
          'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]',
          'transition-all duration-150 text-sm focus-ring',
          'w-[180px] sm:w-[260px] lg:w-[360px]',
        )}
      >
        <Search size={16} className="flex-shrink-0 opacity-60" />
        <span className="truncate text-left flex-1">Search tasks, projects...</span>
        <kbd className="ml-auto hidden md:flex items-center gap-0.5 text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">
          <Command size={10} />K
        </kbd>
      </button>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCreateTaskOpen(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg',
            'bg-unjynx-violet hover:bg-unjynx-violet-hover',
            'text-white font-medium text-sm',
            'transition-colors shadow-sm hover:shadow-md focus-ring',
          )}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>

        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  );
}
