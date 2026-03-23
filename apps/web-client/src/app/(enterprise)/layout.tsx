'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';
import { useAuth } from '@/lib/hooks/use-auth';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import { Navbar } from '@/components/layout/navbar';
import { CommandPalette } from '@/components/layout/command-palette';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  BarChart3,
  Briefcase,
  MessageSquareMore,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building2,
} from 'lucide-react';

// ─── Enterprise Nav Items ───────────────────────────────────────

interface EntNavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
}

const ENT_NAV_ITEMS: readonly EntNavItem[] = [
  { label: 'Team Dashboard', href: '/team', icon: LayoutDashboard },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Projects', href: '/portfolio', icon: FolderKanban },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { label: 'Standups', href: '/team/standups', icon: MessageSquareMore },
  { label: 'Billing', href: '/team/billing', icon: CreditCard },
];

// ─── Enterprise Sidebar ─────────────────────────────────────────

function EnterpriseSidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const { user } = useAuth();

  const isCollapsed = sidebarCollapsed;
  const isAdmin = user?.plan === 'enterprise' || user?.plan === 'team';

  // Keyboard shortcut
  const handleToggle = useCallback(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed]);

  useKeyboardShortcut('\\', handleToggle, { meta: true });

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-40 flex flex-col',
          'bg-[var(--sidebar)] border-r border-[var(--border)]',
          'transition-all duration-200',
          // Desktop
          'hidden lg:flex',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* ── Team Header ── */}
        <div
          className={cn(
            'flex items-center h-16 flex-shrink-0 border-b border-[var(--border)]',
            isCollapsed ? 'justify-center px-0' : 'gap-3 px-4',
          )}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-emerald to-unjynx-violet flex items-center justify-center shadow-lg">
              <Building2 size={18} className="text-white" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                METAminds
              </p>
              <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                Enterprise Team
              </p>
            </div>
          )}
          {!isCollapsed && isAdmin && (
            <span className="ml-auto badge-admin">Admin</span>
          )}
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {!isCollapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.1em]">
              Team Management
            </p>
          )}

          {ENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'group relative flex items-center rounded-lg mx-1.5',
                  'transition-all duration-150 cursor-pointer',
                  isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'sidebar-active text-[var(--foreground)]'
                    : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]',
                )}
              >
                <Icon
                  size={isCollapsed ? 20 : 18}
                  className={cn(
                    'flex-shrink-0 transition-colors duration-150',
                    isActive && 'text-[var(--gold)]',
                  )}
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}

                {/* Collapsed tooltip */}
                {isCollapsed && (
                  <div
                    className={cn(
                      'absolute left-full ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap',
                      'bg-[var(--popover)] text-[var(--popover-foreground)] border border-[var(--border)]',
                      'opacity-0 scale-95 pointer-events-none',
                      'group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto',
                      'transition-all duration-150 z-[60] unjynx-shadow-sm',
                    )}
                  >
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Separator */}
          <div className="mx-3 my-3 border-t border-[var(--border)]" />

          {/* Back to personal workspace */}
          <Link
            href="/tasks"
            className={cn(
              'flex items-center rounded-lg mx-1.5',
              'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]',
              'transition-all duration-150',
              isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
            )}
          >
            <ChevronLeft size={isCollapsed ? 20 : 18} className="flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium">Back to Personal</span>
            )}
          </Link>
        </nav>

        {/* ── Collapse toggle ── */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!isCollapsed)}
          className={cn(
            'flex items-center w-full py-3 border-t border-[var(--border)]',
            'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            'transition-colors duration-150',
            isCollapsed ? 'justify-center' : 'gap-3 px-4',
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </aside>

      {/* ── Mobile sidebar ── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col',
          'bg-[var(--sidebar)] border-r border-[var(--border)]',
          'w-72 transition-transform duration-300 ease-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Team header */}
        <div className="flex items-center gap-3 h-16 px-4 border-b border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-emerald to-unjynx-violet flex items-center justify-center shadow-lg">
            <Building2 size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)] truncate">METAminds</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Enterprise Team</p>
          </div>
          {isAdmin && <span className="ml-auto badge-admin">Admin</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <p className="px-3 pb-1.5 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-[0.1em]">
            Team Management
          </p>
          {ENT_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-lg mx-1.5',
                  'transition-all duration-150',
                  isActive
                    ? 'sidebar-active text-[var(--foreground)]'
                    : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]',
                )}
              >
                <Icon size={18} className={cn('flex-shrink-0', isActive && 'text-[var(--gold)]')} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}

          <div className="mx-3 my-3 border-t border-[var(--border)]" />

          <Link
            href="/tasks"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg mx-1.5 text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)] transition-all duration-150"
          >
            <ChevronLeft size={18} className="flex-shrink-0" />
            <span className="text-sm font-medium">Back to Personal</span>
          </Link>
        </nav>
      </aside>
    </>
  );
}

// ─── Enterprise Layout ──────────────────────────────────────────

export default function EnterpriseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <EnterpriseSidebar />

      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-16',
        )}
      >
        <Navbar />

        <main>
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
