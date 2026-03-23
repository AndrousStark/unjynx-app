'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProjects, type Project } from '@/lib/api/projects';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  format,
  differenceInDays,
  addDays,
  startOfWeek,
  eachDayOfInterval,
  isToday,
} from 'date-fns';

// ─── Project Health Indicator ───────────────────────────────────

function HealthDot({ completionRate }: { readonly completionRate: number }) {
  let color = '#00C896'; // green
  if (completionRate < 0.5) color = '#FF6B8A'; // red
  else if (completionRate < 0.75) color = '#FF9F1C'; // amber

  return (
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
      title={`${Math.round(completionRate * 100)}% complete`}
    />
  );
}

// ─── Progress Bar ───────────────────────────────────────────────

function ProgressBar({ value, color }: { readonly value: number; readonly color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-[var(--background-surface)]">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(value * 100, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Timeline Row ───────────────────────────────────────────────

function ProjectTimelineRow({
  project,
  startDate,
  days,
  cellWidth,
}: {
  readonly project: Project;
  readonly startDate: Date;
  readonly days: readonly Date[];
  readonly cellWidth: number;
}) {
  const completionRate = project.taskCount > 0 ? project.completedTaskCount / project.taskCount : 0;

  // Simulate project duration (from creation to ~30 days after)
  const projStart = new Date(project.createdAt);
  const projEnd = addDays(projStart, 30);
  const startOffset = Math.max(0, differenceInDays(projStart, startDate));
  const duration = Math.max(1, differenceInDays(projEnd, projStart));

  return (
    <div
      className="relative h-8 border-b border-[var(--border)]"
      style={{ width: `${days.length * cellWidth}px` }}
    >
      {startOffset < days.length && (
        <div
          className="absolute top-1.5 h-5 rounded-md flex items-center px-2 text-[10px] font-medium truncate"
          style={{
            left: `${startOffset * cellWidth}px`,
            width: `${Math.min(duration, days.length - startOffset) * cellWidth}px`,
            backgroundColor: project.color + '30',
            borderLeft: `3px solid ${project.color}`,
            color: project.color,
          }}
        >
          {Math.round(completionRate * 100)}%
        </div>
      )}
    </div>
  );
}

// ─── Portfolio Page ─────────────────────────────────────────────

export default function PortfolioPage() {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 60_000,
  });

  const cellWidth = 28;
  const baseDate = new Date();
  const rangeStart = addDays(startOfWeek(baseDate), -7);
  const rangeEnd = addDays(rangeStart, 56); // 8 weeks
  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart, rangeEnd],
  );

  const allProjects = projects ?? [];
  const activeProjects = allProjects.filter((p) => !p.isArchived);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">Portfolio</h2>
        <Shimmer variant="card" className="h-[300px]" />
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className="animate-fade-in">
        <h2 className="font-outfit text-lg font-bold text-[var(--foreground)] mb-4">Portfolio</h2>
        <EmptyState
          icon={<Briefcase size={32} className="text-unjynx-gold" />}
          title="No projects in portfolio"
          description="Create projects to see a cross-project timeline overview."
        />
      </div>
    );
  }

  // Summary stats
  const totalTasks = activeProjects.reduce((sum, p) => sum + p.taskCount, 0);
  const totalCompleted = activeProjects.reduce((sum, p) => sum + p.completedTaskCount, 0);
  const overallRate = totalTasks > 0 ? totalCompleted / totalTasks : 0;
  const atRisk = activeProjects.filter((p) => {
    const rate = p.taskCount > 0 ? p.completedTaskCount / p.taskCount : 0;
    return rate < 0.5 && p.taskCount > 0;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">Portfolio</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={14} className="text-unjynx-violet" />
            <span className="text-xs text-[var(--muted-foreground)]">Active Projects</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{activeProjects.length}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-unjynx-emerald" />
            <span className="text-xs text-[var(--muted-foreground)]">Overall Progress</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{Math.round(overallRate * 100)}%</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-unjynx-gold" />
            <span className="text-xs text-[var(--muted-foreground)]">Total Tasks</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{totalTasks}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-unjynx-rose" />
            <span className="text-xs text-[var(--muted-foreground)]">At Risk</span>
          </div>
          <p className="font-bebas text-2xl text-[var(--foreground)]">{atRisk}</p>
        </div>
      </div>

      {/* Project List + Timeline */}
      <div className="glass-card overflow-auto">
        <div className="flex min-w-[800px]">
          {/* Left: Project list */}
          <div className="flex-shrink-0 w-[280px] border-r border-[var(--border)]">
            <div className="h-8 border-b border-[var(--border)] px-3 flex items-center">
              <span className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Projects
              </span>
            </div>
            {activeProjects.map((project) => {
              const rate = project.taskCount > 0 ? project.completedTaskCount / project.taskCount : 0;
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-2 px-3 h-8 border-b border-[var(--border)] hover:bg-[var(--background-surface)] transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-xs text-[var(--foreground)] truncate flex-1">
                    {project.name}
                  </span>
                  <HealthDot completionRate={rate} />
                  <span className="text-[10px] text-[var(--muted-foreground)] w-8 text-right">
                    {Math.round(rate * 100)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Date headers */}
            <div className="flex h-8 border-b border-[var(--border)]">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'flex-shrink-0 flex items-center justify-center border-r border-[var(--border)] text-[9px]',
                    isToday(day) ? 'text-unjynx-gold font-bold bg-unjynx-gold/5' : 'text-[var(--muted-foreground)]',
                  )}
                  style={{ width: `${cellWidth}px` }}
                >
                  {format(day, 'd')}
                </div>
              ))}
            </div>

            {/* Project timeline rows */}
            {activeProjects.map((project) => (
              <ProjectTimelineRow
                key={project.id}
                project={project}
                startDate={rangeStart}
                days={days}
                cellWidth={cellWidth}
              />
            ))}

            {/* Today marker */}
            {(() => {
              const todayOffset = differenceInDays(new Date(), rangeStart);
              if (todayOffset >= 0 && todayOffset < days.length) {
                return (
                  <div
                    className="absolute top-8 bottom-0 w-0.5 bg-unjynx-gold z-10 pointer-events-none"
                    style={{ left: `${280 + todayOffset * cellWidth + cellWidth / 2}px` }}
                  />
                );
              }
              return null;
            })()}
          </div>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeProjects.map((project) => {
          const rate = project.taskCount > 0 ? project.completedTaskCount / project.taskCount : 0;
          return (
            <div key={project.id} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-4 h-4 rounded flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <h4 className="font-outfit font-semibold text-sm text-[var(--foreground)] truncate">
                  {project.name}
                </h4>
              </div>
              <ProgressBar value={rate} color={project.color} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {project.completedTaskCount}/{project.taskCount} tasks
                </span>
                <span className="text-[10px] font-medium" style={{ color: project.color }}>
                  {Math.round(rate * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
