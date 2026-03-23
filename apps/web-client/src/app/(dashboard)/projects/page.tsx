'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  getProjects,
  createProject,
  archiveProject,
  type Project,
  type CreateProjectPayload,
} from '@/lib/api/projects';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import {
  FolderKanban,
  Plus,
  Archive,
  Star,
  CheckCircle2,
  Clock,
  X,
  Palette,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
};

// ---------------------------------------------------------------------------
// Color picker
// ---------------------------------------------------------------------------

const PROJECT_COLORS = [
  '#6C3CE0', '#FFD700', '#00C896', '#FF6B6B', '#0088CC',
  '#FF9F1C', '#E1306C', '#5865F2', '#4A154B', '#34A853',
  '#FF4500', '#8B5CF6',
] as const;

function ColorPicker({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            'w-7 h-7 rounded-full transition-all duration-150',
            value === color
              ? 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-unjynx-violet scale-110'
              : 'hover:scale-110',
          )}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Project Dialog
// ---------------------------------------------------------------------------

function CreateProjectForm({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      onCreated();
      onClose();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
        setError('Project name is required.');
        return;
      }
      setError(null);
      createMutation.mutate({
        name: trimmedName,
        description: description.trim() || undefined,
        color,
      });
    },
    [name, description, color, createMutation],
  );

  return (
    <div className="glass-card p-5 border-unjynx-violet/20 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-outfit font-semibold text-base text-[var(--foreground)]">
          Create Project
        </h3>
        <button
          onClick={onClose}
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-unjynx-rose/10 border border-unjynx-rose/20 text-sm text-unjynx-rose">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="projectName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          icon={<FolderKanban size={16} />}
          autoFocus
        />

        <Input
          id="projectDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />

        <div>
          <label className="block text-xs font-medium text-[var(--foreground-secondary)] mb-2">
            <Palette size={12} className="inline mr-1" />
            Color
          </label>
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            className="flex-1"
          >
            <Plus size={16} />
            Create Project
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Project Card
// ---------------------------------------------------------------------------

function ProjectCard({ project }: { readonly project: Project }) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    mutationFn: () => archiveProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() });
    },
  });

  const completionPercent =
    project.taskCount > 0
      ? Math.round((project.completedTaskCount / project.taskCount) * 100)
      : 0;

  return (
    <Link
      href={`/tasks?projectId=${project.id}`}
      className={cn(
        'glass-card p-5 group hover:shadow-unjynx-card-dark transition-all duration-200 hover:-translate-y-0.5 block',
        project.isArchived && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-[var(--background-surface)]"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] truncate">
            {project.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {project.isFavorite && (
            <Star size={14} className="text-unjynx-gold fill-unjynx-gold" />
          )}
          {project.isArchived && (
            <Badge variant="default" size="sm">Archived</Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--muted-foreground)]">Progress</span>
          <span className="text-xs font-medium text-[var(--foreground)]">
            {completionPercent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${completionPercent}%`,
              backgroundColor: project.color,
            }}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <CheckCircle2 size={12} />
            <span>{project.completedTaskCount}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Clock size={12} />
            <span>{project.taskCount - project.completedTaskCount} remaining</span>
          </div>
        </div>

        {/* Archive button (stop propagation) */}
        {!project.isArchived && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              archiveMutation.mutate();
            }}
            className="opacity-0 group-hover:opacity-100 text-[var(--muted-foreground)] hover:text-unjynx-amber transition-all"
            title="Archive project"
          >
            <Archive size={14} />
          </button>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Projects Page
// ---------------------------------------------------------------------------

export default function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: projectKeys.list(),
    queryFn: getProjects,
    staleTime: 60_000,
  });

  const activeProjects = (projects ?? []).filter((p) => !p.isArchived);
  const archivedProjects = (projects ?? []).filter((p) => p.isArchived);
  const displayedProjects = showArchived ? archivedProjects : activeProjects;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Shimmer className="h-8 w-32" />
          <Shimmer className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Shimmer key={i} variant="card" className="h-[180px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">
            Projects
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {activeProjects.length} active project{activeProjects.length !== 1 ? 's' : ''}
            {archivedProjects.length > 0 && (
              <span className="text-[var(--muted-foreground)]">
                {' '}&middot; {archivedProjects.length} archived
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Archive toggle */}
          {archivedProjects.length > 0 && (
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive size={14} />
              {showArchived ? 'Active' : 'Archived'}
            </Button>
          )}

          {/* Create project button */}
          <Button
            variant="default"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            New Project
          </Button>
        </div>
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <CreateProjectForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => setShowCreateForm(false)}
        />
      )}

      {/* Project Grid */}
      {displayedProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={32} className="text-unjynx-gold" />}
          title={showArchived ? 'No archived projects' : 'No projects yet'}
          description={
            showArchived
              ? 'Projects you archive will appear here.'
              : 'Create your first project to organize your tasks by context.'
          }
          action={
            !showArchived ? (
              <Button variant="gold" onClick={() => setShowCreateForm(true)}>
                <Plus size={16} />
                Create First Project
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
