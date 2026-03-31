'use client';

import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/lib/stores/ui-store';
import { useDetailPanelStore } from '@/lib/store/detail-panel-store';
import { useOrgInit } from '@/lib/hooks/use-org-init';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import { ViewsBar } from '@/components/layout/views-bar';
import { DetailPanel } from '@/components/layout/detail-panel';
import { CommandPalette } from '@/components/layout/command-palette';
import { ShortcutsHelp } from '@/components/layout/shortcuts-help';

// ─── Dashboard Layout ───────────────────────────────────────────
//
// Grid structure:
//   ┌────────┬──────────────────────────────┐
//   │        │  Navbar (sticky)              │
//   │ Side-  ├──────────────────────────────┤
//   │  bar   │  Views Bar                   │
//   │        ├──────────────────────────────┤
//   │        │  Main Content (scrollable)   │
//   │        │                              │
//   └────────┴──────────────────────────────┘
//

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const isDetailOpen = useDetailPanelStore((s) => s.isOpen);

  // Initialize org context (fetches user's orgs, sets default org)
  useOrgInit();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Sidebar (fixed, handles its own responsive logic) ── */}
      <Sidebar />

      {/* ── Main area: offset by sidebar width ── */}
      <div
        className={cn(
          'min-h-screen transition-all duration-200',
          // Desktop: offset for sidebar
          'lg:ml-64',
          sidebarCollapsed && 'lg:ml-16',
        )}
      >
        {/* ── Navbar (sticky top) ── */}
        <Navbar />

        {/* ── Views Bar (sticky below navbar) ── */}
        <ViewsBar />

        {/* ── Content area ── */}
        <main
          className={cn(
            'transition-all duration-300',
            // Shrink when detail panel is open on large screens
            isDetailOpen && 'lg:mr-[480px]',
          )}
        >
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ── Detail Panel (slide-in from right) ── */}
      <DetailPanel />

      {/* ── Command Palette (Cmd+K overlay) ── */}
      <CommandPalette />

      {/* ── Keyboard Shortcuts Help (? key) ── */}
      <ShortcutsHelp />
    </div>
  );
}
