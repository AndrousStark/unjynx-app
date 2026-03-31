'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import {
  getWorkflows, getWorkflowDetail, createWorkflow, addStatus, addTransition,
  type Workflow, type WorkflowDetail, type WorkflowStatus, type WorkflowTransition,
} from '@/lib/api/workflows';
import {
  ArrowLeft, Plus, Loader2, ChevronRight, ArrowRight,
  Circle, CheckCircle2, Clock, Settings2, Sparkles, X,
} from 'lucide-react';
import Link from 'next/link';

// ─── Status Category Colors ─────────────────────────────────────

const CATEGORY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  todo: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'To Do' },
  in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress' },
  done: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Done' },
};

// ─── Status Node ─────────────────────────────────────────────────

function StatusNode({ status }: { readonly status: WorkflowStatus }) {
  const cat = CATEGORY_STYLES[status.category] ?? CATEGORY_STYLES.todo;
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors',
      'border-[var(--border)] bg-[var(--card)]',
    )}>
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: status.color ?? '#6B7280' }}
      />
      <span className="text-sm font-medium text-[var(--foreground)]">{status.name}</span>
      <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4', cat.color, cat.bg)}>
        {cat.label}
      </Badge>
      {status.isInitial && <Badge className="text-[9px] bg-[var(--accent)] text-white">Start</Badge>}
      {status.isFinal && <Badge className="text-[9px] bg-[var(--success)] text-white">End</Badge>}
    </div>
  );
}

// ─── Transition Arrow ────────────────────────────────────────────

function TransitionArrow({
  transition,
  statuses,
}: {
  readonly transition: WorkflowTransition;
  readonly statuses: readonly WorkflowStatus[];
}) {
  const from = statuses.find((s) => s.id === transition.fromStatusId);
  const to = statuses.find((s) => s.id === transition.toStatusId);
  if (!from || !to) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--background-surface)] text-xs">
      <span className="text-[var(--foreground)]">{from.name}</span>
      <ArrowRight size={12} className="text-[var(--accent)]" />
      <span className="text-[var(--foreground)]">{to.name}</span>
      {transition.name && (
        <span className="text-[var(--muted-foreground)] ml-1">({transition.name})</span>
      )}
    </div>
  );
}

// ─── Workflow Detail View ────────────────────────────────────────

function WorkflowDetailView({
  workflow,
  onBack,
}: {
  readonly workflow: WorkflowDetail;
  readonly onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusCategory, setNewStatusCategory] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [newStatusColor, setNewStatusColor] = useState('#6C5CE7');

  const addStatusMutation = useMutation({
    mutationFn: () => addStatus(workflow.id, {
      name: newStatusName.trim(),
      category: newStatusCategory,
      color: newStatusColor,
      sortOrder: workflow.statuses.length,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-detail', workflow.id] });
      setNewStatusName('');
      setShowAddStatus(false);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--background-surface)]">
          <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
        </button>
        <div>
          <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">{workflow.name}</h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {workflow.description ?? 'Custom workflow'}
            {workflow.isSystem && ' (System)'}
          </p>
        </div>
      </div>

      {/* Visual Flow */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
          Statuses ({workflow.statuses.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {[...workflow.statuses]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((status, i) => (
              <div key={status.id} className="flex items-center gap-1">
                <StatusNode status={status} />
                {i < workflow.statuses.length - 1 && (
                  <ChevronRight size={14} className="text-[var(--muted-foreground)]" />
                )}
              </div>
            ))}
        </div>

        {/* Add Status */}
        {!workflow.isSystem && (
          <div className="mt-3">
            {showAddStatus ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--background-surface)]">
                <input
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Status name"
                  className="flex-1 px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] outline-none"
                  autoFocus
                />
                <select
                  value={newStatusCategory}
                  onChange={(e) => setNewStatusCategory(e.target.value as 'todo' | 'in_progress' | 'done')}
                  className="px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <input
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0"
                />
                <Button size="sm" onClick={() => addStatusMutation.mutate()} disabled={!newStatusName.trim() || addStatusMutation.isPending}>
                  {addStatusMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                </Button>
                <button onClick={() => setShowAddStatus(false)} className="p-1 text-[var(--muted-foreground)]">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddStatus(true)}
                className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline mt-2"
              >
                <Plus size={12} /> Add Status
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transitions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
          Transitions ({workflow.transitions.length})
        </h3>
        <div className="space-y-1.5">
          {workflow.transitions.map((t) => (
            <TransitionArrow key={t.id} transition={t} statuses={workflow.statuses} />
          ))}
        </div>
        {workflow.transitions.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)]">No transitions defined. Add statuses first.</p>
        )}
      </div>
    </div>
  );
}

// ─── Create Workflow Modal ───────────────────────────────────────

function CreateWorkflowForm({ onCreated }: { readonly onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createWorkflow({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setName('');
      setDescription('');
      onCreated();
    },
  });

  return (
    <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] space-y-3 mb-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">New Workflow</h3>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workflow name"
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
        autoFocus
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
      />
      <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
        {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
        Create Workflow
      </Button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function WorkflowsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    staleTime: 60_000,
  });

  const { data: selectedWorkflow } = useQuery({
    queryKey: ['workflow-detail', selectedId],
    queryFn: () => getWorkflowDetail(selectedId!),
    enabled: !!selectedId,
  });

  // Detail view
  if (selectedId && selectedWorkflow) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4 animate-fade-in">
        <WorkflowDetailView workflow={selectedWorkflow} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
            <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-emerald-500 flex items-center justify-center shadow-lg">
            <Settings2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Workflows</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Configure status pipelines for your projects</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={12} className="mr-1" /> New Workflow
        </Button>
      </div>

      {showCreate && <CreateWorkflowForm onCreated={() => setShowCreate(false)} />}

      {/* Workflow List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => <Shimmer key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : !workflows || workflows.length === 0 ? (
        <div className="text-center py-16">
          <Settings2 size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--foreground)]">No workflows</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Create a workflow to customize task statuses.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedId(wf.id)}
              className="flex items-center gap-3 w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <Settings2 size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{wf.name}</span>
                  {wf.isSystem && <Badge variant="outline" className="text-[9px]">System</Badge>}
                  {wf.isDefault && <Badge className="text-[9px] bg-[var(--accent)] text-white">Default</Badge>}
                </div>
                <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                  {wf.description ?? 'Custom workflow'}
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--muted-foreground)]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
