'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';
import { useSidebarStore } from '@/lib/store/sidebar-store';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import {
  Home,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FolderKanban,
  Plus,
  MessageSquare,
  Send,
  Mail,
  Instagram,
  Hash,
  Gamepad2,
  Calendar,
  BarChart3,
  Sparkles,
  Trophy,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  LayoutList,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { OrgSwitcher } from './org-switcher';
import { useVocabulary } from '@/lib/hooks/use-vocabulary';

// ─── Types ──────────────────────────────────────────────────────

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ElementType;
  readonly badge?: string;
  readonly badgeType?: 'gold' | 'pro';
}

interface NavGroup {
  readonly id: string;
  readonly label: string;
  readonly collapsible: boolean;
  readonly items: readonly NavItem[];
  readonly addAction?: { readonly label: string; readonly href: string };
}

// ─── Navigation Data ────────────────────────────────────────────

// Labels that should be translated via vocabulary:
// "Task" → mode term (e.g., "Matter" in Legal)
// "Project" → mode term (e.g., "Case" in Legal)
// Nav items use the raw English terms; translation happens at render time.

const NAV_GROUPS: readonly NavGroup[] = [
  {
    id: 'main',
    label: '',
    collapsible: false,
    items: [
      { label: 'Dashboard', href: '/tasks', icon: Home },
    ],
  },
  {
    id: 'tasks',
    label: 'My Tasks',
    collapsible: true,
    items: [
      { label: 'Today', href: '/tasks?filter=today', icon: CalendarDays },
      { label: 'This Week', href: '/tasks?filter=week', icon: Clock },
      { label: 'Overdue', href: '/tasks?filter=overdue', icon: AlertTriangle },
      { label: 'Completed', href: '/tasks?filter=completed', icon: CheckCircle2 },
    ],
  },
  {
    id: 'channels',
    label: 'Channels',
    collapsible: true,
    items: [
      { label: 'WhatsApp', href: '/channels?type=whatsapp', icon: MessageSquare },
      { label: 'Telegram', href: '/channels?type=telegram', icon: Send },
      { label: 'SMS', href: '/channels?type=sms', icon: MessageSquare },
      { label: 'Email', href: '/channels?type=email', icon: Mail },
      { label: 'Instagram', href: '/channels?type=instagram', icon: Instagram },
      { label: 'Slack', href: '/channels?type=slack', icon: Hash },
      { label: 'Discord', href: '/channels?type=discord', icon: Gamepad2 },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    collapsible: true,
    items: [
      { label: 'Messaging', href: '/messaging', icon: MessageCircle },
      { label: 'Sprints', href: '/sprints', icon: Zap },
      { label: 'Goals', href: '/goals', icon: Target },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'features',
    label: '',
    collapsible: false,
    items: [
      { label: 'Calendar', href: '/calendar', icon: Calendar },
      { label: 'Progress & Insights', href: '/progress', icon: BarChart3 },
      { label: 'AI Chat', href: '/ai', icon: Sparkles, badge: 'NEW', badgeType: 'gold' },
      { label: 'Game Mode', href: '/game', icon: Trophy, badge: 'PRO', badgeType: 'pro' },
    ],
  },
];

const BOTTOM_NAV: readonly NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Profile', href: '/profile', icon: User },
];

// ─── Sub-components ─────────────────────────────────────────────

/**
 * UNJYNX logo mark with gold pulse dot.
 */
function SidebarLogo({ collapsed }: { readonly collapsed: boolean }) {
  return (
    <Link
      href="/tasks"
      className={cn(
        'flex items-center h-16 flex-shrink-0 transition-all duration-200',
        collapsed ? 'justify-center px-0' : 'gap-2.5 px-4',
      )}
    >
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--gold)] to-[var(--gold-rich)] flex items-center justify-center shadow-lg">
          <span className="font-bebas text-lg text-[var(--background)] leading-none tracking-wider select-none">
            U
          </span>
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse-gold" />
      </div>
      {!collapsed && (
        <span className="font-bebas text-xl tracking-[0.2em] text-[var(--foreground)] select-none">
          UNJYNX
        </span>
      )}
    </Link>
  );
}

/**
 * Collapsible section header.
 */
function GroupHeader({
  group,
  collapsed,
  isExpanded,
  onToggle,
}: {
  readonly group: NavGroup;
  readonly collapsed: boolean;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
}) {
  if (!group.label || collapsed) {
    // Collapsed: show a thin divider between groups
    if (collapsed && group.label) {
      return <div className="mx-3 my-1.5 border-t border-[var(--border)]" />;
    }
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center justify-between w-full px-3 py-1.5 mt-3 mb-0.5',
        'text-[10px] font-semibold uppercase tracking-[0.1em]',
        'text-[var(--muted-foreground)] hover:text-[var(--foreground-secondary)]',
        'transition-colors duration-150 select-none',
      )}
    >
      <span>{group.label}</span>
      {group.collapsible && (
        <ChevronDown
          size={12}
          className={cn(
            'transition-transform duration-200 ease-out',
            !isExpanded && '-rotate-90',
          )}
        />
      )}
    </button>
  );
}

/**
 * Single navigation item with active indicator, tooltip (collapsed), badges.
 */
function SidebarNavItem({
  item,
  collapsed,
  isActive,
  projectColor,
  onClick,
}: {
  readonly item: NavItem;
  readonly collapsed: boolean;
  readonly isActive: boolean;
  readonly projectColor?: string;
  readonly onClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex items-center rounded-lg mx-1.5',
        'transition-all duration-150 cursor-pointer',
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
        isActive
          ? 'sidebar-active text-[var(--foreground)]'
          : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]',
      )}
    >
      {/* Icon or project color dot */}
      {projectColor ? (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-[var(--sidebar-hover)]"
          style={{ backgroundColor: projectColor }}
        />
      ) : (
        <Icon
          size={collapsed ? 20 : 18}
          className={cn(
            'flex-shrink-0 transition-colors duration-150',
            isActive && 'text-[var(--gold)]',
          )}
        />
      )}

      {/* Label */}
      {!collapsed && (
        <span className="text-sm font-medium truncate flex-1">{item.label}</span>
      )}

      {/* Badge */}
      {!collapsed && item.badge && (
        <span className={item.badgeType === 'gold' ? 'badge-gold' : 'badge-pro'}>
          {item.badge}
        </span>
      )}

      {/* Tooltip for collapsed mode */}
      {collapsed && (
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
          {item.badge && (
            <span className={cn('ml-1.5', item.badgeType === 'gold' ? 'badge-gold' : 'badge-pro')}>
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

/**
 * Project list with dynamic colored dots + add button.
 */
function ProjectSection({
  collapsed,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  readonly collapsed: boolean;
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly onNavigate?: () => void;
}) {
  const projects = useSidebarStore((s) => s.projects);
  const pathname = usePathname();

  return (
    <div>
      <GroupHeader
        group={{ id: 'projects', label: 'Projects', collapsible: true, items: [] }}
        collapsed={collapsed}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />

      <div
        className={cn(
          'transition-all duration-200 overflow-hidden',
          isExpanded || collapsed ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        {projects.map((p) => (
          <SidebarNavItem
            key={p.id}
            item={{
              label: p.name,
              href: `/projects/${p.id}`,
              icon: FolderKanban,
            }}
            collapsed={collapsed}
            isActive={pathname === `/projects/${p.id}`}
            projectColor={p.color}
            onClick={onNavigate}
          />
        ))}

        {/* Add project button */}
        {!collapsed && (
          <Link
            href="/projects/new"
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-2 mx-1.5 px-3 py-1.5 rounded-lg',
              'text-xs font-medium text-[var(--muted-foreground)]',
              'hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]',
              'transition-all duration-150',
            )}
          >
            <Plus size={14} />
            <span>Add Project</span>
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Collapse / expand toggle button at the bottom of the sidebar.
 */
function CollapseToggle({
  collapsed,
  onToggle,
}: {
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center w-full py-3 border-t border-[var(--border)]',
        'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
        'transition-colors duration-150',
        collapsed ? 'justify-center' : 'gap-3 px-4',
      )}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      {!collapsed && <span className="text-sm font-medium">Collapse</span>}
    </button>
  );
}

// ─── Inner sidebar content (shared between desktop & mobile) ────

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  readonly collapsed: boolean;
  readonly onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const expandedSections = useSidebarStore((s) => s.expandedSections);
  const toggleSection = useSidebarStore((s) => s.toggleSection);
  const t = useVocabulary();

  // Translate nav labels using vocabulary (e.g., "My Tasks" → "My Matters" in Legal mode)
  const translateLabel = useCallback(
    (label: string): string => {
      // Replace known terms within the label
      return label
        .replace(/\bTasks?\b/g, (m) => t(m))
        .replace(/\bProjects?\b/g, (m) => t(m))
        .replace(/\bTags?\b/g, (m) => t(m))
        .replace(/\bAssignee\b/g, t('Assignee'))
        .replace(/\bSprints?\b/g, (m) => t(m.endsWith('s') ? 'Section' : 'Section') + 's');
    },
    [t],
  );

  const isActive = useCallback(
    (href: string): boolean => {
      if (href === '/tasks' && (pathname === '/tasks' || pathname === '/')) return true;
      if (href.includes('?')) return false; // Query-based items need URL match
      return pathname.startsWith(href) && href !== '/';
    },
    [pathname],
  );

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
      {NAV_GROUPS.map((group) => {
        const isExpanded = !group.collapsible || expandedSections.includes(group.id);

        // Insert project section after the tasks group
        if (group.id === 'channels') {
          return (
            <div key={group.id}>
              {/* Projects section */}
              <ProjectSection
                collapsed={collapsed}
                isExpanded={expandedSections.includes('projects')}
                onToggle={() => toggleSection('projects')}
                onNavigate={onNavigate}
              />

              {/* Channels section */}
              <GroupHeader
                group={group}
                collapsed={collapsed}
                isExpanded={isExpanded}
                onToggle={() => toggleSection(group.id)}
              />
              <div
                className={cn(
                  'transition-all duration-200 overflow-hidden',
                  isExpanded || collapsed ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive(item.href)}
                    onClick={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={group.id}>
            <GroupHeader
              group={group}
              collapsed={collapsed}
              isExpanded={isExpanded}
              onToggle={() => toggleSection(group.id)}
            />
            <div
              className={cn(
                'transition-all duration-200 overflow-hidden',
                !group.collapsible || isExpanded || collapsed
                  ? 'max-h-[600px] opacity-100'
                  : 'max-h-0 opacity-0',
              )}
            >
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.href)}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Separator */}
      <div className="mx-3 my-2 border-t border-[var(--border)]" />

      {/* Bottom items */}
      {BOTTOM_NAV.map((item) => (
        <SidebarNavItem
          key={item.href}
          item={item}
          collapsed={collapsed}
          isActive={isActive(item.href)}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

// ─── Main Sidebar ───────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  // Keyboard shortcut: Cmd+\ toggles sidebar
  const handleToggle = useCallback(() => {
    // On small screens toggle mobile drawer; on desktop toggle collapse
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed]);

  useKeyboardShortcut('\\', handleToggle, { meta: true });

  // Close mobile sidebar on route change
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close mobile sidebar on Escape
  useKeyboardShortcut('Escape', () => setSidebarOpen(false), {
    enabled: sidebarOpen,
  });

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-40 flex-col',
          'bg-[var(--sidebar)] border-r border-[var(--border)]',
          'transition-all duration-sidebar',
          'hidden lg:flex',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <SidebarLogo collapsed={sidebarCollapsed} />
        <OrgSwitcher collapsed={sidebarCollapsed} />
        <div className="mx-3 border-b border-[var(--border)]" />
        <SidebarContent collapsed={sidebarCollapsed} />
        <CollapseToggle
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </aside>

      {/* ── Mobile sidebar (overlay drawer) ── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col',
          'bg-[var(--sidebar)] border-r border-[var(--border)]',
          'w-72 transition-transform duration-300 ease-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarLogo collapsed={false} />
        <OrgSwitcher collapsed={false} />
        <div className="mx-3 border-b border-[var(--border)]" />
        <SidebarContent collapsed={false} onNavigate={() => setSidebarOpen(false)} />
      </aside>
    </>
  );
}
