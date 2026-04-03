import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';

/// Sort field for the table.
enum _SortField { title, status, priority, dueDate, createdAt }

/// Spreadsheet-style table view of tasks.
///
/// Sortable columns, inline status/priority badges, overdue highlighting,
/// tap to navigate to task detail. Matches the web client's table view.
class TableViewPage extends ConsumerStatefulWidget {
  const TableViewPage({super.key});

  @override
  ConsumerState<TableViewPage> createState() => _TableViewPageState();
}

class _TableViewPageState extends ConsumerState<TableViewPage> {
  _SortField _sortField = _SortField.createdAt;
  bool _sortAsc = false;
  final Set<String> _selectedIds = {};

  List<Todo> _sorted(List<Todo> todos) {
    final sorted = List<Todo>.of(todos);
    sorted.sort((a, b) {
      int cmp;
      switch (_sortField) {
        case _SortField.title:
          cmp = a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case _SortField.status:
          cmp = a.status.index.compareTo(b.status.index);
        case _SortField.priority:
          cmp = b.priority.index.compareTo(a.priority.index); // higher first
        case _SortField.dueDate:
          final ad = a.dueDate ?? DateTime(2099);
          final bd = b.dueDate ?? DateTime(2099);
          cmp = ad.compareTo(bd);
        case _SortField.createdAt:
          cmp = a.createdAt.compareTo(b.createdAt);
      }
      return _sortAsc ? cmp : -cmp;
    });
    return sorted;
  }

  void _toggleSort(_SortField field) {
    HapticFeedback.selectionClick();
    setState(() {
      if (_sortField == field) {
        _sortAsc = !_sortAsc;
      } else {
        _sortField = field;
        _sortAsc = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final todosAsync = ref.watch(todoListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Table View'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          if (_selectedIds.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Center(
                child: Text(
                  '${_selectedIds.length} selected',
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: colorScheme.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: todosAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('Failed to load tasks')),
        data: (todos) {
          final sorted = _sorted(
            todos.where((t) => t.status != TodoStatus.cancelled).toList(),
          );

          if (sorted.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.table_chart_rounded,
                    size: 56,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No tasks yet',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(todoListProvider),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: SizedBox(
                width: 720,
                child: Column(
                  children: [
                    // Header row
                    _HeaderRow(
                      sortField: _sortField,
                      sortAsc: _sortAsc,
                      onSort: _toggleSort,
                      allSelected: _selectedIds.length == sorted.length,
                      onSelectAll: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          if (_selectedIds.length == sorted.length) {
                            _selectedIds.clear();
                          } else {
                            _selectedIds
                              ..clear()
                              ..addAll(sorted.map((t) => t.id));
                          }
                        });
                      },
                      colorScheme: colorScheme,
                      theme: theme,
                    ),
                    // Data rows
                    Expanded(
                      child: ListView.builder(
                        itemCount: sorted.length,
                        itemBuilder: (context, i) => _DataRow(
                          task: sorted[i],
                          isSelected: _selectedIds.contains(sorted[i].id),
                          onSelect: (selected) {
                            HapticFeedback.selectionClick();
                            setState(() {
                              if (selected) {
                                _selectedIds.add(sorted[i].id);
                              } else {
                                _selectedIds.remove(sorted[i].id);
                              }
                            });
                          },
                          onTap: () {
                            HapticFeedback.lightImpact();
                            context.push('/todos/${sorted[i].id}');
                          },
                          colorScheme: colorScheme,
                          theme: theme,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Header row
// ---------------------------------------------------------------------------

class _HeaderRow extends StatelessWidget {
  final _SortField sortField;
  final bool sortAsc;
  final ValueChanged<_SortField> onSort;
  final bool allSelected;
  final VoidCallback onSelectAll;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _HeaderRow({
    required this.sortField,
    required this.sortAsc,
    required this.onSort,
    required this.allSelected,
    required this.onSelectAll,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        border: Border(
          bottom: BorderSide(
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
      ),
      child: Row(
        children: [
          // Checkbox
          SizedBox(
            width: 44,
            child: Checkbox(
              value: allSelected,
              onChanged: (_) => onSelectAll(),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          _SortableHeader('Title', _SortField.title, flex: 3),
          _SortableHeader('Status', _SortField.status, flex: 2),
          _SortableHeader('Priority', _SortField.priority, flex: 2),
          _SortableHeader('Due Date', _SortField.dueDate, flex: 2),
          _SortableHeader('Created', _SortField.createdAt, flex: 2),
        ],
      ),
    );
  }

  Widget _SortableHeader(String label, _SortField field, {int flex = 1}) {
    final isActive = sortField == field;
    return Expanded(
      flex: flex,
      child: GestureDetector(
        onTap: () => onSort(field),
        child: Row(
          children: [
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: isActive
                    ? colorScheme.primary
                    : colorScheme.onSurfaceVariant,
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 2),
              Icon(
                sortAsc
                    ? Icons.arrow_upward_rounded
                    : Icons.arrow_downward_rounded,
                size: 12,
                color: colorScheme.primary,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Data row
// ---------------------------------------------------------------------------

class _DataRow extends StatelessWidget {
  final Todo task;
  final bool isSelected;
  final ValueChanged<bool> onSelect;
  final VoidCallback onTap;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _DataRow({
    required this.task,
    required this.isSelected,
    required this.onSelect,
    required this.onTap,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final isOverdue =
        task.dueDate != null &&
        task.dueDate!.isBefore(DateTime.now()) &&
        task.status != TodoStatus.completed;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: isSelected
              ? colorScheme.primary.withValues(alpha: 0.05)
              : null,
          border: Border(
            bottom: BorderSide(
              color: colorScheme.outlineVariant.withValues(alpha: 0.15),
            ),
          ),
        ),
        child: Row(
          children: [
            // Checkbox
            SizedBox(
              width: 44,
              child: Checkbox(
                value: isSelected,
                onChanged: (v) => onSelect(v ?? false),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),

            // Title
            Expanded(
              flex: 3,
              child: Text(
                task.title,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w500,
                  decoration: task.status == TodoStatus.completed
                      ? TextDecoration.lineThrough
                      : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Status badge
            Expanded(
              flex: 2,
              child: _StatusBadge(
                status: task.status,
                colorScheme: colorScheme,
                theme: theme,
              ),
            ),

            // Priority badge
            Expanded(
              flex: 2,
              child: _PriorityBadge(
                priority: task.priority,
                context: context,
                theme: theme,
              ),
            ),

            // Due date
            Expanded(
              flex: 2,
              child: Text(
                task.dueDate != null
                    ? '${task.dueDate!.day}/${task.dueDate!.month}/${task.dueDate!.year}'
                    : '-',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: isOverdue
                      ? colorScheme.error
                      : colorScheme.onSurfaceVariant,
                  fontWeight: isOverdue ? FontWeight.w600 : null,
                ),
              ),
            ),

            // Created date
            Expanded(
              flex: 2,
              child: Text(
                _relativeTime(task.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}';
  }
}

class _StatusBadge extends StatelessWidget {
  final TodoStatus status;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _StatusBadge({
    required this.status,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (status) {
      TodoStatus.pending => ('Todo', colorScheme.outline),
      TodoStatus.inProgress => ('In Progress', colorScheme.primary),
      TodoStatus.completed => ('Done', const Color(0xFF22C55E)),
      TodoStatus.cancelled => ('Cancelled', colorScheme.error),
    };

    return Row(
      children: [
        Container(
          width: 7,
          height: 7,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: color,
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  final TodoPriority priority;
  final BuildContext context;
  final ThemeData theme;

  const _PriorityBadge({
    required this.priority,
    required this.context,
    required this.theme,
  });

  @override
  Widget build(BuildContext buildContext) {
    if (priority == TodoPriority.none) {
      return Text(
        '-',
        style: theme.textTheme.bodySmall?.copyWith(
          color: theme.colorScheme.onSurfaceVariant,
        ),
      );
    }

    final color = unjynxPriorityColor(context, priority.name);
    return Row(
      children: [
        Icon(Icons.flag_rounded, size: 12, color: color),
        const SizedBox(width: 4),
        Text(
          priority.name[0].toUpperCase() + priority.name.substring(1),
          style: theme.textTheme.labelSmall?.copyWith(
            color: color,
            fontSize: 10,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
