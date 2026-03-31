'use client';

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { useOrgStore, useCurrentOrg } from '@/lib/store/org-store';
import { apiClient } from '@/lib/api/client';
import { Shimmer } from '@/components/ui/shimmer';
import {
  BarChart3, Clock, Target, Shield, CheckCircle2,
  AlertTriangle, Calendar, Cloud, BookOpen, Users,
  TrendingUp, Zap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Widget Type Registry ────────────────────────────────────────

interface WidgetConfig {
  readonly widgetType: string;
  readonly configJson: Record<string, unknown>;
  readonly sortOrder: number;
}

interface ModeDetail {
  readonly mode: { slug: string; name: string };
  readonly widgets: readonly WidgetConfig[];
}

const WIDGET_ICONS: Record<string, React.ElementType> = {
  kpi_counter: Target,
  bar_chart: BarChart3,
  timeline: Clock,
  burndown: TrendingUp,
  pipeline: Zap,
  calendar_upcoming: Calendar,
  compliance_tracker: Shield,
  weather_forecast: Cloud,
  chore_chart: CheckCircle2,
  study_timer: BookOpen,
};

// ─── KPI Counter Widget ──────────────────────────────────────────

function KpiCounterWidget({ config }: { readonly config: Record<string, unknown> }) {
  const label = (config.label as string) ?? 'Metric';
  const icon = (config.icon as string) ?? 'target';

  // In production, this would query real data based on config.metric
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-2">
        <Target size={14} className="text-[var(--accent)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">—</p>
      <p className="text-[9px] text-[var(--muted-foreground)] mt-1">Connect data source</p>
    </div>
  );
}

// ─── Bar Chart Widget ────────────────────────────────────────────

function BarChartWidget({ config }: { readonly config: Record<string, unknown> }) {
  const label = (config.label as string) ?? 'Chart';
  // Placeholder data
  const data = [
    { name: 'Mon', value: 4 }, { name: 'Tue', value: 7 },
    { name: 'Wed', value: 3 }, { name: 'Thu', value: 8 },
    { name: 'Fri', value: 5 },
  ];

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <h4 className="text-xs font-semibold text-[var(--foreground)] mb-3">{label}</h4>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
            <Bar dataKey="value" fill="var(--accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Calendar Upcoming Widget ────────────────────────────────────

function CalendarUpcomingWidget({ config }: { readonly config: Record<string, unknown> }) {
  const label = (config.label as string) ?? 'Upcoming';
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-3">
        <Calendar size={14} className="text-[var(--accent)]" />
        <h4 className="text-xs font-semibold text-[var(--foreground)]">{label}</h4>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">No upcoming items</p>
    </div>
  );
}

// ─── Compliance Tracker Widget ───────────────────────────────────

function ComplianceTrackerWidget({ config }: { readonly config: Record<string, unknown> }) {
  const label = (config.label as string) ?? 'Compliance';
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} className="text-[var(--warning)]" />
        <h4 className="text-xs font-semibold text-[var(--foreground)]">{label}</h4>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">No deadlines tracked</p>
    </div>
  );
}

// ─── Generic Placeholder Widget ──────────────────────────────────

function PlaceholderWidget({ widgetType, config }: { readonly widgetType: string; readonly config: Record<string, unknown> }) {
  const label = (config.label as string) ?? widgetType.replace(/_/g, ' ');
  const Icon = WIDGET_ICONS[widgetType] ?? Target;
  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[var(--muted-foreground)]" />
        <span className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">{label}</span>
      </div>
      <p className="text-xs text-[var(--muted-foreground)]">Widget: {widgetType}</p>
    </div>
  );
}

// ─── Widget Registry ─────────────────────────────────────────────

function renderWidget(widget: WidgetConfig) {
  switch (widget.widgetType) {
    case 'kpi_counter':
      return <KpiCounterWidget config={widget.configJson} />;
    case 'bar_chart':
      return <BarChartWidget config={widget.configJson} />;
    case 'calendar_upcoming':
      return <CalendarUpcomingWidget config={widget.configJson} />;
    case 'compliance_tracker':
      return <ComplianceTrackerWidget config={widget.configJson} />;
    default:
      return <PlaceholderWidget widgetType={widget.widgetType} config={widget.configJson} />;
  }
}

// ─── Main Component ──────────────────────────────────────────────

export function ModeWidgets() {
  const currentOrg = useCurrentOrg();
  const modeSlug = currentOrg?.industryMode;

  const { data: modeDetail, isLoading } = useQuery({
    queryKey: ['mode-detail', modeSlug],
    queryFn: () => apiClient.get<ModeDetail>(`/api/v1/modes/${modeSlug}`),
    enabled: !!modeSlug,
    staleTime: 5 * 60_000,
  });

  if (!modeSlug) return null; // No mode selected = no mode widgets
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  const widgets = modeDetail?.widgets ?? [];
  if (widgets.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
        {modeDetail?.mode.name ?? 'Industry'} Dashboard
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[...widgets]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((widget, i) => (
            <div key={i}>{renderWidget(widget)}</div>
          ))}
      </div>
    </div>
  );
}
