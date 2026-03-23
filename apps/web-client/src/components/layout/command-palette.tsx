'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';
import { useKeyboardShortcut } from '@/lib/hooks/use-keyboard-shortcut';
import {
  Home,
  CheckSquare,
  LayoutGrid,
  Calendar,
  GanttChart,
  Table2,
  MessageSquare,
  BarChart3,
  Sparkles,
  Settings,
  User,
  Plus,
  Sun,
  Moon,
  Search,
  FolderKanban,
  Trophy,
  ArrowRight,
  Zap,
} from 'lucide-react';

// ─── Group Data ─────────────────────────────────────────────────

interface CommandItem {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ElementType;
  readonly shortcut?: string;
  readonly action: 'navigate' | 'action';
  readonly value: string; // href or action key
  readonly keywords?: string;
}

interface CommandGroup {
  readonly heading: string;
  readonly items: readonly CommandItem[];
}

const COMMAND_GROUPS: readonly CommandGroup[] = [
  {
    heading: 'Navigation',
    items: [
      { id: 'nav-dashboard', label: 'Go to Dashboard', icon: Home, action: 'navigate', value: '/tasks', keywords: 'home overview' },
      { id: 'nav-board', label: 'Go to Board', icon: LayoutGrid, action: 'navigate', value: '/board', keywords: 'kanban columns' },
      { id: 'nav-calendar', label: 'Go to Calendar', icon: Calendar, action: 'navigate', value: '/calendar', keywords: 'schedule dates' },
      { id: 'nav-timeline', label: 'Go to Timeline', icon: GanttChart, action: 'navigate', value: '/timeline', keywords: 'gantt' },
      { id: 'nav-table', label: 'Go to Table', icon: Table2, action: 'navigate', value: '/table', keywords: 'spreadsheet' },
      { id: 'nav-channels', label: 'Go to Channels', icon: MessageSquare, action: 'navigate', value: '/channels', keywords: 'whatsapp telegram sms email' },
      { id: 'nav-progress', label: 'Go to Progress', icon: BarChart3, action: 'navigate', value: '/progress', keywords: 'insights analytics stats' },
      { id: 'nav-ai', label: 'Go to AI Chat', icon: Sparkles, action: 'navigate', value: '/ai', keywords: 'assistant intelligence' },
      { id: 'nav-game', label: 'Go to Game Mode', icon: Trophy, action: 'navigate', value: '/game', keywords: 'gamification xp streak' },
      { id: 'nav-projects', label: 'Go to Projects', icon: FolderKanban, action: 'navigate', value: '/projects', keywords: 'folders' },
      { id: 'nav-settings', label: 'Go to Settings', icon: Settings, action: 'navigate', value: '/settings', keywords: 'preferences config' },
      { id: 'nav-profile', label: 'Go to Profile', icon: User, action: 'navigate', value: '/profile', keywords: 'account' },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { id: 'act-new-task', label: 'Create New Task', icon: Plus, shortcut: 'N', action: 'action', value: 'create-task', keywords: 'add todo' },
      { id: 'act-new-project', label: 'Create New Project', icon: FolderKanban, action: 'action', value: 'create-project', keywords: 'add folder' },
      { id: 'act-toggle-theme', label: 'Toggle Theme', icon: Sun, shortcut: 'T', action: 'action', value: 'toggle-theme', keywords: 'dark light mode appearance' },
      { id: 'act-toggle-sidebar', label: 'Toggle Sidebar', icon: ArrowRight, shortcut: '\\', action: 'action', value: 'toggle-sidebar', keywords: 'collapse expand' },
    ],
  },
];

// ─── Command Palette ────────────────────────────────────────────

export function CommandPalette() {
  const router = useRouter();
  const isOpen = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const setCreateTaskOpen = useUiStore((s) => s.setCreateTaskOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const theme = useUiStore((s) => s.theme);

  // Open with Cmd+K
  useKeyboardShortcut('k', () => setOpen(true), { meta: true });

  // Handle item selection
  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false);

      if (item.action === 'navigate') {
        router.push(item.value);
        return;
      }

      // Actions
      switch (item.value) {
        case 'create-task':
          setCreateTaskOpen(true);
          break;
        case 'create-project':
          router.push('/projects/new');
          break;
        case 'toggle-theme':
          toggleTheme();
          break;
        case 'toggle-sidebar':
          toggleSidebar();
          break;
      }
    },
    [router, setOpen, setCreateTaskOpen, toggleTheme, toggleSidebar],
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        role="presentation"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[61] flex items-start justify-center pt-[15vh] px-4">
        <Command
          className={cn(
            'w-full max-w-[640px] rounded-2xl overflow-hidden',
            'bg-[var(--popover)] border border-[var(--border)]',
            'shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(108,60,224,0.1)]',
            'animate-scale-in',
          )}
          loop
          shouldFilter
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 border-b border-[var(--border)]">
            <Search size={18} className="flex-shrink-0 text-[var(--muted-foreground)]" />
            <Command.Input
              placeholder="Type a command or search..."
              className={cn(
                'flex-1 h-14 bg-transparent text-base text-[var(--foreground)]',
                'placeholder:text-[var(--muted-foreground)]',
                'outline-none border-none',
                'font-dm-sans',
              )}
              autoFocus
            />
            <kbd className="flex-shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-2 py-1 rounded-md border border-[var(--border)]">
              ESC
            </kbd>
          </div>

          {/* Command List */}
          <Command.List className="max-h-[360px] overflow-y-auto overscroll-contain py-2">
            <Command.Empty className="flex flex-col items-center py-8 text-center">
              <Zap size={32} className="text-[var(--muted-foreground)] mb-3" />
              <p className="text-sm font-medium text-[var(--foreground-secondary)]">
                No results found
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Try a different search term
              </p>
            </Command.Empty>

            {COMMAND_GROUPS.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-[var(--muted-foreground)]"
              >
                {group.items.map((item) => {
                  // Swap icon for theme action
                  const Icon =
                    item.value === 'toggle-theme'
                      ? theme === 'dark'
                        ? Sun
                        : Moon
                      : item.icon;

                  return (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords ?? ''}`}
                      onSelect={() => handleSelect(item)}
                      className={cn(
                        'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer',
                        'text-sm text-[var(--foreground-secondary)]',
                        'transition-colors duration-100',
                        'data-[selected=true]:bg-unjynx-violet/10 data-[selected=true]:text-[var(--foreground)]',
                        'aria-selected:bg-unjynx-violet/10 aria-selected:text-[var(--foreground)]',
                      )}
                    >
                      <Icon
                        size={16}
                        className="flex-shrink-0 data-[selected=true]:text-[var(--gold)]"
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="flex-shrink-0 text-[10px] font-medium text-[var(--muted-foreground)] bg-[var(--muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                          {item.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--muted-foreground)]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
                  &#8593;&#8595;
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
                  &#9166;
                </kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-[var(--muted)] border border-[var(--border)]">
                  esc
                </kbd>
                Close
              </span>
            </div>
            <span className="text-gradient-gold font-semibold tracking-wider">UNJYNX</span>
          </div>
        </Command>
      </div>
    </>
  );
}
