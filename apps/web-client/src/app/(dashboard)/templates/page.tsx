'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { apiClient } from '@/lib/api/client';
import {
  Sparkles,
  Plus,
  Layers,
  Clock,
  Check,
  Trash2,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────

interface Template {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string | null;
  subtasks: string | null;
  usageCount: number;
  isGlobal: boolean;
}

interface ParsedSubtask {
  title: string;
  estimatedMinutes: number;
}

// ─── API ────────────────────────────────────────────────────────

function getTemplates(category?: string): Promise<readonly Template[]> {
  const params = category ? `?category=${category}` : '';
  return apiClient.get(`/api/v1/templates${params}`);
}

function useTemplateApi(id: string): Promise<{ taskId: string; subtaskCount: number }> {
  return apiClient.post(`/api/v1/templates/${id}/use`);
}

function deleteTemplateApi(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/templates/${id}`);
}

function seedTemplates(): Promise<{ seeded: number }> {
  return apiClient.post('/api/v1/templates/seed');
}

// ─── Categories ─────────────────────────────────────────────────

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'professional', label: 'Professional' },
  { value: 'development', label: 'Development' },
  { value: 'content', label: 'Content' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'personal', label: 'Personal' },
  { value: 'custom', label: 'Custom' },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-rose-400',
  high: 'text-amber-400',
  medium: 'text-blue-400',
  low: 'text-emerald-400',
  none: 'text-gray-400',
};

// ─── Template Card ──────────────────────────────────────────────

function TemplateCard({
  template,
  onUse,
  onDelete,
  isUsing,
}: {
  template: Template;
  onUse: () => void;
  onDelete: () => void;
  isUsing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  let subtasks: ParsedSubtask[] = [];
  try {
    if (template.subtasks) subtasks = JSON.parse(template.subtasks);
  } catch { /* invalid json */ }

  const totalMinutes = subtasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0);

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] hover:border-unjynx-violet/30 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{template.title}</h3>
            {template.isGlobal && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-unjynx-violet border-unjynx-violet/30">System</Badge>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-[var(--muted-foreground)] line-clamp-2 mb-2">{template.description}</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)]">
            <span className={PRIORITY_COLORS[template.priority ?? 'none']}>{template.priority}</span>
            <span>{template.category}</span>
            {subtasks.length > 0 && (
              <span className="flex items-center gap-1"><Layers size={10} />{subtasks.length} steps</span>
            )}
            {totalMinutes > 0 && (
              <span className="flex items-center gap-1"><Clock size={10} />~{totalMinutes}min</span>
            )}
            <span className="flex items-center gap-1"><Copy size={10} />{template.usageCount} uses</span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={onUse}
            disabled={isUsing}
            className="text-xs"
          >
            {isUsing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="mr-1" />}
            Use
          </Button>
          {!template.isGlobal && (
            <Button variant="ghost" size="icon-sm" onClick={onDelete} className="text-rose-400 hover:bg-rose-500/10">
              <Trash2 size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Subtasks expandable */}
      {subtasks.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-[10px] text-unjynx-violet hover:underline"
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {expanded ? 'Hide' : 'Show'} {subtasks.length} subtasks
          </button>
          {expanded && (
            <div className="mt-2 space-y-1 pl-3 border-l-2 border-unjynx-violet/20 animate-fade-in">
              {subtasks.map((sub, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-[var(--foreground-secondary)]">
                  <span>{i + 1}. {sub.title}</span>
                  {sub.estimatedMinutes > 0 && (
                    <span className="text-[10px] text-[var(--muted-foreground)]">{sub.estimatedMinutes}m</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('');
  const [usingId, setUsingId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', activeCategory],
    queryFn: () => getTemplates(activeCategory || undefined),
    staleTime: 60_000,
  });

  const useMutation2 = useMutation({
    mutationFn: (id: string) => {
      setUsingId(id);
      return useTemplateApi(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setUsingId(null);
    },
    onError: () => setUsingId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplateApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const seedMutation = useMutation({
    mutationFn: seedTemplates,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const templateList = templates ?? [];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-violet to-pink-500 flex items-center justify-center shadow-lg shadow-unjynx-violet/20">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Templates</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Reusable task blueprints with subtasks</p>
          </div>
        </div>

        {templateList.length === 0 && !isLoading && (
          <Button variant="outline" size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            {seedMutation.isPending ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Plus size={12} className="mr-1" />}
            Load templates
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat.value
                ? 'bg-unjynx-violet text-white'
                : 'bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => <Shimmer key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : templateList.length === 0 ? (
        <div className="text-center py-16">
          <Layers size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--foreground)]">No templates yet</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">
            Load system templates or create your own from AI task breakdowns.
          </p>
          <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            <Plus size={14} className="mr-1.5" />
            Load system templates
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templateList.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={() => useMutation2.mutate(template.id)}
              onDelete={() => deleteMutation.mutate(template.id)}
              isUsing={usingId === template.id}
            />
          ))}
        </div>
      )}

      {/* Tip */}
      <p className="text-[10px] text-[var(--muted-foreground)] mt-6 text-center">
        Tip: Type <code className="px-1 py-0.5 rounded bg-[var(--background-surface)] text-unjynx-violet">/template sprint</code> in AI Chat to quickly find and use templates.
      </p>
    </div>
  );
}
