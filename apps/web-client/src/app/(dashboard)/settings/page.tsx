'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/hooks/use-auth';
import { useThemeStore } from '@/lib/store/theme-store';
import { useFontSizeStore } from '@/lib/store/font-size-store';
import { deleteAccount } from '@/lib/api/auth';
import { getChannels, addChannel, removeChannel, type Channel, type ChannelType } from '@/lib/api/channels';
import { getTasks, type Task } from '@/lib/api/tasks';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shimmer } from '@/components/ui/shimmer';
import {
  Palette,
  Bell,
  User,
  Database,
  Monitor,
  Moon,
  Sun,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  Shield,
  Briefcase,
  AlertTriangle,
  Check,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingsTab = 'appearance' | 'notifications' | 'account' | 'data' | 'industry';

interface TabConfig {
  readonly id: SettingsTab;
  readonly label: string;
  readonly icon: React.ElementType;
}

const TABS: readonly TabConfig[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: User },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'industry', label: 'Industry Mode', icon: Briefcase },
];

// ---------------------------------------------------------------------------
// Theme Option
// ---------------------------------------------------------------------------

function ThemeOption({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  readonly label: string;
  readonly icon: React.ElementType;
  readonly isActive: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
        isActive
          ? 'border-unjynx-violet bg-unjynx-violet/10 text-unjynx-violet'
          : 'border-[var(--border)] bg-[var(--background-surface)] text-[var(--foreground-secondary)] hover:border-unjynx-violet/40',
      )}
    >
      <Icon size={24} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Toggle Switch
// ---------------------------------------------------------------------------

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  readonly label: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 rounded-full transition-colors duration-200',
          checked ? 'bg-unjynx-violet' : 'bg-[var(--border)]',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
            'mt-[2px]',
          )}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Appearance
// ---------------------------------------------------------------------------

function AppearanceSection() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const fontSize = useFontSizeStore((s) => s.fontSize);
  const setFontSize = useFontSizeStore((s) => s.setFontSize);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Theme
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Choose how UNJYNX looks for you.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <ThemeOption
            label="Light"
            icon={Sun}
            isActive={theme === 'light'}
            onClick={() => setTheme('light')}
          />
          <ThemeOption
            label="Dark"
            icon={Moon}
            isActive={theme === 'dark'}
            onClick={() => setTheme('dark')}
          />
          <ThemeOption
            label="System"
            icon={Monitor}
            isActive={theme === 'system'}
            onClick={() => setTheme('system')}
          />
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Font Size
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Adjust text size across the app.
        </p>
        <div className="flex gap-3">
          {(['small', 'default', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm capitalize transition-all duration-150',
                fontSize === size
                  ? 'border-unjynx-violet bg-unjynx-violet/10 text-unjynx-violet font-medium'
                  : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-unjynx-violet/40',
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Notifications
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notification channel toggle config
// ---------------------------------------------------------------------------

interface ChannelToggleConfig {
  readonly type: ChannelType;
  readonly label: string;
  readonly description: string;
  readonly identifier: string;
}

const CHANNEL_TOGGLES: readonly ChannelToggleConfig[] = [
  { type: 'push', label: 'Push Notifications', description: 'Browser and in-app push alerts', identifier: 'browser' },
  { type: 'email', label: 'Email Notifications', description: 'Task reminders and weekly digests', identifier: 'default' },
  { type: 'whatsapp', label: 'WhatsApp Reminders', description: 'Receive reminders via WhatsApp', identifier: 'default' },
  { type: 'telegram', label: 'Telegram Reminders', description: 'Receive reminders via Telegram bot', identifier: 'default' },
];

function NotificationsSection() {
  const queryClient = useQueryClient();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('unjynx-sound-enabled') !== 'false';
  });
  const [mutatingChannel, setMutatingChannel] = useState<ChannelType | null>(null);

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    staleTime: 60_000,
  });

  const connectMutation = useMutation({
    mutationFn: (cfg: ChannelToggleConfig) =>
      addChannel({ type: cfg.type, identifier: cfg.identifier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onSettled: () => setMutatingChannel(null),
  });

  const disconnectMutation = useMutation({
    mutationFn: (channelId: string) => removeChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    },
    onSettled: () => setMutatingChannel(null),
  });

  const isChannelActive = (type: ChannelType): boolean =>
    channels.some((ch) => ch.type === type && (ch.status === 'active' || ch.status === 'pending'));

  const findChannel = (type: ChannelType): Channel | undefined =>
    channels.find((ch) => ch.type === type);

  const handleChannelToggle = (cfg: ChannelToggleConfig, enabled: boolean) => {
    setMutatingChannel(cfg.type);
    if (enabled) {
      connectMutation.mutate(cfg);
    } else {
      const existing = findChannel(cfg.type);
      if (existing) {
        disconnectMutation.mutate(existing.id);
      } else {
        setMutatingChannel(null);
      }
    }
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('unjynx-sound-enabled', String(enabled));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Notification Preferences
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Control how you receive reminders and alerts.
        </p>
      </div>

      {channelsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Shimmer key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-1 divide-y divide-[var(--border)]">
          {CHANNEL_TOGGLES.map((cfg) => (
            <div key={cfg.type} className="relative">
              <ToggleSwitch
                label={cfg.label}
                description={cfg.description}
                checked={isChannelActive(cfg.type)}
                onChange={(enabled) => handleChannelToggle(cfg, enabled)}
              />
              {mutatingChannel === cfg.type && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2">
                  <Loader2 size={14} className="animate-spin text-unjynx-violet" />
                </div>
              )}
            </div>
          ))}
          <ToggleSwitch
            label="Sound Effects"
            description="Play sounds for completed tasks and alerts"
            checked={soundEnabled}
            onChange={handleSoundToggle}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Account
// ---------------------------------------------------------------------------

function AccountSection() {
  const { user } = useAuth();

  const handleChangePassword = () => {
    window.location.href = '/forgot-password';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Account Information
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Manage your account details and security.
        </p>
      </div>

      {/* Email */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-surface)] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-unjynx-violet/15 flex items-center justify-center">
            <User size={18} className="text-unjynx-violet" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Email Address</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              {user?.email ?? 'Not set'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          Change
        </Button>
      </div>

      {/* Password */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--background-surface)] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-unjynx-gold/15 flex items-center justify-center">
            <Shield size={18} className="text-unjynx-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Password</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Last changed: Unknown
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleChangePassword}>
          Change
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Data
// ---------------------------------------------------------------------------

function DataSection() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importBanner, setImportBanner] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const { logout } = useAuth();

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      await logout();
    } catch {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [logout]);

  const handleImport = useCallback(() => {
    setImportBanner(true);
    setTimeout(() => setImportBanner(false), 3000);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const tasks = await getTasks({ limit: 10000 });
      const headers = ['id', 'title', 'description', 'priority', 'status', 'dueDate', 'dueTime', 'projectId', 'labels', 'createdAt'];
      const csvRows = [
        headers.join(','),
        ...tasks.map((t) =>
          headers
            .map((h) => {
              const value = t[h as keyof Task];
              if (value === null || value === undefined) return '';
              if (Array.isArray(value)) return `"${(value as readonly string[]).join(';')}"`;
              const str = String(value);
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(','),
        ),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unjynx-tasks-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch {
      // Export failed silently — user can retry
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Data Management
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Import, export, or delete your data.
        </p>
      </div>

      {/* Inline banners */}
      {importBanner && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-unjynx-gold/10 border border-unjynx-gold/20 text-sm text-unjynx-gold">
          <AlertTriangle size={16} />
          Import is coming soon. Stay tuned!
        </div>
      )}
      {exportSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-unjynx-emerald/10 border border-unjynx-emerald/20 text-sm text-unjynx-emerald">
          <Check size={16} />
          Export downloaded successfully.
        </div>
      )}

      {/* Import / Export */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleImport}
          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] hover:bg-[var(--background-elevated)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-unjynx-emerald/15 flex items-center justify-center">
            <Upload size={18} className="text-unjynx-emerald" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              Import Data
              <Badge variant="gold" size="sm" className="ml-2">Soon</Badge>
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Import from Todoist, Notion, CSV
            </p>
          </div>
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] hover:bg-[var(--background-elevated)] transition-colors text-left disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-lg bg-unjynx-violet/15 flex items-center justify-center">
            {isExporting ? (
              <Loader2 size={18} className="text-unjynx-violet animate-spin" />
            ) : (
              <Download size={18} className="text-unjynx-violet" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">Export Data</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Download all your tasks as CSV
            </p>
          </div>
        </button>
      </div>

      {/* Delete Account */}
      <div className="border-t border-[var(--border)] pt-4">
        <h4 className="font-outfit font-semibold text-sm text-unjynx-rose mb-2">
          Danger Zone
        </h4>

        {showDeleteConfirm ? (
          <div className="p-4 rounded-xl border border-unjynx-rose/30 bg-unjynx-rose/5">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle size={20} className="text-unjynx-rose flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Are you absolutely sure?
                </p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  This action is irreversible. All your tasks, projects, and settings will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                isLoading={isDeleting}
                onClick={handleDeleteAccount}
              >
                <Trash2 size={14} />
                Delete Everything
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-unjynx-rose/30 text-unjynx-rose hover:bg-unjynx-rose/10"
          >
            <Trash2 size={14} />
            Delete Account
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: Industry Mode
// ---------------------------------------------------------------------------

const INDUSTRY_MODES = [
  { id: 'general', label: 'General', description: 'Default productivity mode' },
  { id: 'legal', label: 'Legal', description: 'Case management, deadlines, court dates' },
  { id: 'healthcare', label: 'Healthcare', description: 'Patient follow-ups, appointments, compliance' },
  { id: 'dev', label: 'Dev Teams', description: 'Sprints, code reviews, deployments' },
  { id: 'education', label: 'Education', description: 'Assignments, exams, study schedules' },
  { id: 'construction', label: 'Construction', description: 'Site inspections, milestones, safety checks' },
  { id: 'realestate', label: 'Real Estate', description: 'Property showings, client follow-ups' },
  { id: 'finance', label: 'Finance', description: 'Audits, tax deadlines, compliance' },
  { id: 'hr', label: 'HR', description: 'Onboarding, reviews, policy tracking' },
  { id: 'marketing', label: 'Marketing', description: 'Campaigns, content calendar, analytics' },
  { id: 'family', label: 'Family', description: 'Chores, appointments, family events' },
  { id: 'student', label: 'Student', description: 'Classes, assignments, study groups' },
] as const;

function IndustryModeSection() {
  const [selectedMode, setSelectedMode] = useState('general');

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
          Industry Mode
          <Badge variant="gold" size="sm" className="ml-2">Coming Soon</Badge>
        </h3>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          Select your industry to customize task templates, labels, and AI suggestions.
          Industry modes will be available in a future update.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 opacity-60 pointer-events-none">
        {INDUSTRY_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150',
              selectedMode === mode.id
                ? 'border-unjynx-violet bg-unjynx-violet/10'
                : 'border-[var(--border)] bg-[var(--background-surface)] hover:border-unjynx-violet/40',
            )}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
                selectedMode === mode.id
                  ? 'border-unjynx-violet bg-unjynx-violet'
                  : 'border-[var(--muted-foreground)]',
              )}
            >
              {selectedMode === mode.id && (
                <div className="w-full h-full rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {mode.label}
                {mode.id !== 'general' && (
                  <Badge variant="gold" size="sm" className="ml-2">PRO</Badge>
                )}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {mode.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Shimmer className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Shimmer variant="card" className="h-[400px]" />
          <Shimmer variant="card" className="h-[400px] lg:col-span-3" />
        </div>
      </div>
    );
  }

  const sections: Record<SettingsTab, React.ReactNode> = {
    appearance: <AppearanceSection />,
    notifications: <NotificationsSection />,
    account: <AccountSection />,
    data: <DataSection />,
    industry: <IndustryModeSection />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">
        Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Sidebar Tabs */}
        <div className="glass-card p-2 lg:p-3 h-fit">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150',
                    activeTab === tab.id
                      ? 'bg-unjynx-violet/15 text-unjynx-violet'
                      : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-surface)] hover:text-[var(--foreground)]',
                  )}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <ChevronRight size={14} className="ml-auto hidden lg:block" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 glass-card p-5 lg:p-6">
          {sections[activeTab]}
        </div>
      </div>
    </div>
  );
}
