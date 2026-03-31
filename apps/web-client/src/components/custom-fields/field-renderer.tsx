'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { CustomFieldDefinition } from '@/lib/api/custom-fields';
import { Check, X } from 'lucide-react';

interface FieldRendererProps {
  readonly field: CustomFieldDefinition;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
  readonly readonly?: boolean;
}

export function FieldRenderer({ field, value, onChange, readonly = false }: FieldRendererProps) {
  const inputClass = cn(
    'w-full px-3 py-1.5 rounded-lg text-sm text-[var(--foreground)] outline-none transition-all',
    readonly
      ? 'bg-transparent cursor-default'
      : 'bg-[var(--background-surface)] border border-[var(--border)] focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/10',
  );

  switch (field.fieldType) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <input
          type={field.fieldType === 'email' ? 'email' : field.fieldType === 'url' ? 'url' : 'text'}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.options?.placeholder ?? field.name}
          readOnly={readonly}
          className={inputClass}
        />
      );

    case 'number':
    case 'currency':
      return (
        <div className="flex items-center gap-1">
          {field.fieldType === 'currency' && field.options?.currency && (
            <span className="text-xs text-[var(--muted-foreground)]">{field.options.currency}</span>
          )}
          <input
            type="number"
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            min={field.options?.min}
            max={field.options?.max}
            readOnly={readonly}
            className={inputClass}
          />
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          readOnly={readonly}
          className={inputClass}
        />
      );

    case 'checkbox':
      return (
        <button
          type="button"
          onClick={() => !readonly && onChange(!value)}
          disabled={readonly}
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            value
              ? 'bg-[var(--accent)] border-[var(--accent)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]',
          )}
        >
          {!!value && <Check size={12} className="text-white" />}
        </button>
      );

    case 'select':
      return (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={readonly}
          className={inputClass}
        >
          <option value="">Select...</option>
          {field.options?.choices?.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      );

    case 'multi_select': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex flex-wrap gap-1">
          {field.options?.choices?.map((choice) => {
            const isSelected = selected.includes(choice.value);
            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => {
                  if (readonly) return;
                  const next = isSelected
                    ? selected.filter((v) => v !== choice.value)
                    : [...selected, choice.value];
                  onChange(next);
                }}
                disabled={readonly}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors',
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)]/30',
                )}
                style={choice.color ? { borderColor: isSelected ? choice.color : undefined, color: isSelected ? choice.color : undefined } : undefined}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      );
    }

    case 'user':
      // Simplified — in production, use AssigneePicker
      return (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="User ID"
          readOnly={readonly}
          className={inputClass}
        />
      );

    case 'rich_text':
      return (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.name}
          readOnly={readonly}
          rows={3}
          className={cn(inputClass, 'resize-none')}
        />
      );

    case 'label':
      return (
        <span
          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
        >
          {(value as string) ?? field.name}
        </span>
      );

    default:
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readonly}
          className={inputClass}
        />
      );
  }
}

// ─── Field List for Task Detail ──────────────────────────────────

interface CustomFieldsListProps {
  readonly fields: readonly CustomFieldDefinition[];
  readonly values: Record<string, unknown>;
  readonly onChange: (fieldId: string, value: unknown) => void;
  readonly readonly?: boolean;
}

export function CustomFieldsList({ fields, values, onChange, readonly = false }: CustomFieldsListProps) {
  if (fields.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Custom Fields
      </h4>
      {fields.map((field) => (
        <div key={field.id} className="flex items-start gap-2">
          <label className="text-xs text-[var(--foreground)] min-w-[100px] pt-1.5 truncate">
            {field.name}
            {field.isRequired && <span className="text-[var(--destructive)] ml-0.5">*</span>}
          </label>
          <div className="flex-1">
            <FieldRenderer
              field={field}
              value={values[field.id] ?? field.defaultValue ?? null}
              onChange={(v) => onChange(field.id, v)}
              readonly={readonly}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
