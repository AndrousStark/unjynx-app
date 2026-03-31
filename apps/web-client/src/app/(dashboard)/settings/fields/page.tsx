'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shimmer } from '@/components/ui/shimmer';
import {
  getFieldDefinitions, createFieldDefinition, archiveFieldDefinition,
  type CustomFieldDefinition,
} from '@/lib/api/custom-fields';
import {
  ArrowLeft, Plus, Loader2, Trash2, Settings2,
  Type, Hash, Calendar, List, CheckSquare, User,
  Link2, Mail, Phone, FileText, Tag, DollarSign, Layers,
} from 'lucide-react';
import Link from 'next/link';

// ─── Field Type Config ───────────────────────────────────────────

const FIELD_TYPES: readonly {
  value: string; label: string; icon: React.ElementType; description: string;
}[] = [
  { value: 'text', label: 'Text', icon: Type, description: 'Single line text' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Numeric value' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { value: 'select', label: 'Select', icon: List, description: 'Dropdown single choice' },
  { value: 'multi_select', label: 'Multi Select', icon: Layers, description: 'Multiple choices' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'True/false toggle' },
  { value: 'user', label: 'User', icon: User, description: 'Team member reference' },
  { value: 'url', label: 'URL', icon: Link2, description: 'Web link' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Email address' },
  { value: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
  { value: 'rich_text', label: 'Rich Text', icon: FileText, description: 'Multi-line formatted text' },
  { value: 'label', label: 'Label', icon: Tag, description: 'Read-only label/badge' },
  { value: 'currency', label: 'Currency', icon: DollarSign, description: 'Money amount' },
];

// ─── Create Field Modal ──────────────────────────────────────────

function CreateFieldModal({ onClose, onCreated }: {
  readonly onClose: () => void;
  readonly onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const fieldKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const mutation = useMutation({
    mutationFn: () => createFieldDefinition({
      name: name.trim(),
      fieldKey,
      fieldType,
      description: description.trim() || undefined,
      isRequired,
    }),
    onSuccess: () => { onCreated(); onClose(); },
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-outfit text-lg font-bold text-[var(--foreground)] mb-4">Create Custom Field</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Field Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Case Number, Client Name"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
              autoFocus
            />
            {fieldKey && (
              <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                Key: <code className="px-1 py-0.5 rounded bg-[var(--background-surface)]">{fieldKey}</code>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Field Type</label>
            <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
              {FIELD_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.value}
                    type="button"
                    onClick={() => setFieldType(ft.value)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all text-[10px]',
                      fieldType === ft.value
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)]'
                        : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/30',
                    )}
                  >
                    <Icon size={12} />
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this field for?"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded" />
            <span className="text-xs text-[var(--foreground)]">Required field</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || !fieldKey || mutation.isPending}>
            {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
            Create Field
          </Button>
        </div>

        {mutation.isError && (
          <p className="text-xs text-[var(--destructive)] mt-2">{(mutation.error as Error).message}</p>
        )}
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function CustomFieldsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: fields, isLoading } = useQuery({
    queryKey: ['custom-field-definitions'],
    queryFn: getFieldDefinitions,
    staleTime: 60_000,
  });

  const archiveMutation = useMutation({
    mutationFn: archiveFieldDefinition,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] }),
  });

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
            <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center shadow-lg">
            <Settings2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">Custom Fields</h1>
            <p className="text-[10px] text-[var(--muted-foreground)]">Define custom data fields for your tasks</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus size={12} className="mr-1" /> Add Field
        </Button>
      </div>

      {/* Field List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => <Shimmer key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !fields || fields.length === 0 ? (
        <div className="text-center py-16">
          <Settings2 size={40} className="mx-auto text-[var(--muted-foreground)] mb-3" />
          <p className="text-sm text-[var(--foreground)]">No custom fields yet</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-4">
            Create fields to capture industry-specific data on your tasks.
          </p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1.5" /> Create First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => {
            const typeConfig = FIELD_TYPES.find((t) => t.value === field.fieldType);
            const Icon = typeConfig?.icon ?? Type;
            return (
              <div key={field.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{field.name}</span>
                    <Badge variant="outline" className="text-[9px]">{typeConfig?.label ?? field.fieldType}</Badge>
                    {field.isRequired && <Badge variant="outline" className="text-[9px] text-[var(--destructive)]">Required</Badge>}
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">
                    Key: {field.fieldKey}
                    {field.description && ` — ${field.description}`}
                  </p>
                </div>
                <button
                  onClick={() => { if (confirm('Archive this field?')) archiveMutation.mutate(field.id); }}
                  className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--destructive)]/5 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateFieldModal
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['custom-field-definitions'] })}
        />
      )}
    </div>
  );
}
