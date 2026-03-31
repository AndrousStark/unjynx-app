'use client';

import { useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { cn } from '@/lib/utils/cn';
import { Send, Bold, Italic, Code, List, ListOrdered, Strikethrough } from 'lucide-react';

// ─── Mention Suggestion (simplified — full impl needs floating UI) ──

const MentionSuggestion = {
  items: ({ query }: { query: string }) => {
    // In production, this would search org members via API
    return ['everyone', 'channel', 'here']
      .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  },
  render: () => {
    // Simplified: render suggestions inline
    // Full implementation would use @tiptap/extension-mention with tippy.js
    return {
      onStart: () => {},
      onUpdate: () => {},
      onExit: () => {},
      onKeyDown: () => false,
    };
  },
};

// ─── Toolbar Button ──────────────────────────────────────────────

function ToolbarButton({
  icon: Icon,
  active,
  onClick,
  title,
}: {
  readonly icon: React.ElementType;
  readonly active?: boolean;
  readonly onClick: () => void;
  readonly title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1 rounded transition-colors',
        active
          ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)]',
      )}
    >
      <Icon size={14} />
    </button>
  );
}

// ─── Rich Message Input ──────────────────────────────────────────

export interface RichMessageInputHandle {
  focus: () => void;
  clear: () => void;
}

interface RichMessageInputProps {
  readonly onSend: (content: string, html: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly showToolbar?: boolean;
}

export const RichMessageInput = forwardRef<RichMessageInputHandle, RichMessageInputProps>(
  function RichMessageInput(
    { onSend, placeholder = 'Type a message...', disabled = false, showToolbar = true },
    ref,
  ) {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false, // No headings in chat messages
          horizontalRule: false,
          blockquote: { HTMLAttributes: { class: 'border-l-2 border-[var(--accent)] pl-3 italic' } },
          codeBlock: { HTMLAttributes: { class: 'bg-[var(--background-surface)] rounded-lg p-3 font-mono text-sm' } },
          code: { HTMLAttributes: { class: 'bg-[var(--background-surface)] px-1.5 py-0.5 rounded text-sm font-mono text-[var(--accent)]' } },
        }),
        Placeholder.configure({ placeholder }),
        Mention.configure({
          HTMLAttributes: { class: 'text-[var(--accent)] font-medium bg-[var(--accent)]/10 px-1 rounded' },
          suggestion: MentionSuggestion,
        }),
      ],
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none text-[var(--foreground)] outline-none min-h-[40px] max-h-[200px] overflow-y-auto',
            'prose-p:my-0 prose-ul:my-1 prose-ol:my-1 prose-li:my-0',
            '[&_.is-editor-empty:first-child::before]:text-[var(--muted-foreground)] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none',
          ),
        },
        handleKeyDown: (view, event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
            return true;
          }
          return false;
        },
      },
      editable: !disabled,
    });

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(),
    }));

    const handleSend = useCallback(() => {
      if (!editor) return;
      const text = editor.getText().trim();
      if (!text) return;

      const html = editor.getHTML();
      onSend(text, html);
      editor.commands.clearContent();
    }, [editor, onSend]);

    if (!editor) return null;

    return (
      <div className="border-t border-[var(--border)] p-3 bg-[var(--background)]">
        {/* Formatting Toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-0.5 mb-1.5 px-1">
            <ToolbarButton
              icon={Bold}
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Cmd+B)"
            />
            <ToolbarButton
              icon={Italic}
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Cmd+I)"
            />
            <ToolbarButton
              icon={Strikethrough}
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            />
            <ToolbarButton
              icon={Code}
              active={editor.isActive('code')}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code"
            />
            <div className="w-px h-4 bg-[var(--border)] mx-1" />
            <ToolbarButton
              icon={List}
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            />
            <ToolbarButton
              icon={ListOrdered}
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] px-3 py-2 focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all">
          <div className="flex-1 min-w-0">
            <EditorContent editor={editor} />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={disabled || !editor.getText().trim()}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-lg transition-colors',
              editor.getText().trim()
                ? 'bg-[var(--accent)] text-white hover:opacity-90'
                : 'text-[var(--muted-foreground)]',
            )}
          >
            <Send size={16} />
          </button>
        </div>

        <p className="text-[9px] text-[var(--muted-foreground)] mt-1 px-1">
          Enter to send &bull; Shift+Enter for new line &bull; **bold** &bull; *italic* &bull; `code` &bull; @mention
        </p>
      </div>
    );
  },
);
