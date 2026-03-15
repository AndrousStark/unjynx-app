import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../providers/todo_providers.dart';

// =============================================================================
// Kanban column configuration
// =============================================================================

/// Defines how to group tasks into Kanban columns.
enum KanbanGroupBy { status, priority }

/// A single Kanban column definition.
class KanbanColumn {
  final String id;
  final String label;
  final Color color;
  final IconData icon;

  const KanbanColumn({
    required this.id,
    required this.label,
    required this.color,
    required this.icon,
  });
}

List<KanbanColumn> _statusColumns(ColorScheme colorScheme, UnjynxCustomColors ux) => [
  KanbanColumn(
    id: 'pending',
    label: 'To Do',
    color: colorScheme.onSurfaceVariant,
    icon: Icons.radio_button_unchecked,
  ),
  KanbanColumn(
    id: 'inProgress',
    label: 'In Progress',
    color: colorScheme.primary,
    icon: Icons.play_circle_outline,
  ),
  KanbanColumn(
    id: 'completed',
    label: 'Done',
    color: ux.success,
    icon: Icons.check_circle_outline,
  ),
  KanbanColumn(
    id: 'cancelled',
    label: 'Cancelled',
    color: colorScheme.error,
    icon: Icons.cancel_outlined,
  ),
];

List<KanbanColumn> _priorityColumns(
  ColorScheme colorScheme,
  UnjynxCustomColors ux,
  bool isLight,
) => [
  KanbanColumn(
    id: 'urgent',
    label: 'Urgent',
    color: colorScheme.error,
    icon: Icons.local_fire_department,
  ),
  KanbanColumn(
    id: 'high',
    label: 'High',
    // Light: amber-orange for contrast on light bg; Dark: yellow-gold
    color: isLight ? const Color(0xFFD97706) : const Color(0xFFFFD43B),
    icon: Icons.arrow_upward,
  ),
  KanbanColumn(
    id: 'medium',
    label: 'Medium',
    color: ux.warning,
    icon: Icons.remove,
  ),
  KanbanColumn(
    id: 'low',
    label: 'Low',
    color: colorScheme.primary,
    icon: Icons.arrow_downward,
  ),
  KanbanColumn(
    id: 'none',
    label: 'No Priority',
    color: colorScheme.onSurfaceVariant,
    icon: Icons.more_horiz,
  ),
];

// =============================================================================
// Providers
// =============================================================================

class _KanbanGroupByNotifier extends Notifier<KanbanGroupBy> {
  @override
  KanbanGroupBy build() => KanbanGroupBy.status;
  void set(KanbanGroupBy value) => state = value;
}

final kanbanGroupByProvider =
    NotifierProvider<_KanbanGroupByNotifier, KanbanGroupBy>(
  _KanbanGroupByNotifier.new,
);

class _KanbanCollapsedNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => {};
  void set(Set<String> value) => state = value;
}

final kanbanCollapsedProvider =
    NotifierProvider<_KanbanCollapsedNotifier, Set<String>>(
  _KanbanCollapsedNotifier.new,
);

// =============================================================================
// Main page
// =============================================================================

/// D4 - Kanban Board (Pro feature).
///
/// Displays tasks in configurable swim-lane columns with
/// drag-and-drop support for moving tasks between columns.
class KanbanBoardPage extends ConsumerWidget {
  const KanbanBoardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final groupBy = ref.watch(kanbanGroupByProvider);
    final todosAsync = ref.watch(todoListProvider);
    final columns = groupBy == KanbanGroupBy.status
        ? _statusColumns(colorScheme, ux)
        : _priorityColumns(colorScheme, ux, isLight);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Board'),
        actions: [
          _GroupByToggle(groupBy: groupBy, ref: ref),
        ],
      ),
      body: todosAsync.when(
        loading: () => Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: List.generate(
              3,
              (i) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Column(
                    children: [
                      const UnjynxShimmerLine(width: 80, height: 18),
                      const SizedBox(height: 12),
                      ...List.generate(
                        3,
                        (_) => const Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: UnjynxShimmerBox(height: 88),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        error: (e, _) => Center(
          child: Text(
            'Error: $e',
            style: TextStyle(color: colorScheme.error),
          ),
        ),
        data: (todos) {
          final grouped = _groupTodos(todos, groupBy);
          return _KanbanBoard(
            columns: columns,
            grouped: grouped,
            groupBy: groupBy,
          );
        },
      ),
    );
  }

  Map<String, List<Todo>> _groupTodos(
    List<Todo> todos,
    KanbanGroupBy groupBy,
  ) {
    final map = <String, List<Todo>>{};
    for (final todo in todos) {
      final key = groupBy == KanbanGroupBy.status
          ? todo.status.name
          : todo.priority.name;
      map.putIfAbsent(key, () => []).add(todo);
    }
    return map;
  }
}

// =============================================================================
// Group-by toggle
// =============================================================================

class _GroupByToggle extends StatelessWidget {
  const _GroupByToggle({required this.groupBy, required this.ref});

  final KanbanGroupBy groupBy;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return PopupMenuButton<KanbanGroupBy>(
      icon: const Icon(Icons.view_column_outlined),
      color: colorScheme.surface,
      onSelected: (value) {
        ref.read(kanbanGroupByProvider.notifier).set(value);
      },
      itemBuilder: (_) => [
        _menuItem(context, KanbanGroupBy.status, 'By Status', Icons.fact_check),
        _menuItem(
          context,
          KanbanGroupBy.priority,
          'By Priority',
          Icons.flag,
        ),
      ],
    );
  }

  PopupMenuEntry<KanbanGroupBy> _menuItem(
    BuildContext context,
    KanbanGroupBy value,
    String label,
    IconData icon,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final active = groupBy == value;
    return PopupMenuItem(
      value: value,
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: active
                ? ux.gold
                : colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 10),
          Text(
            label,
            style: TextStyle(
              color: active
                  ? ux.gold
                  : colorScheme.onSurface,
              fontWeight:
                  active ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Kanban board (horizontal scroll of columns)
// =============================================================================

class _KanbanBoard extends ConsumerWidget {
  const _KanbanBoard({
    required this.columns,
    required this.grouped,
    required this.groupBy,
  });

  final List<KanbanColumn> columns;
  final Map<String, List<Todo>> grouped;
  final KanbanGroupBy groupBy;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final collapsed = ref.watch(kanbanCollapsedProvider);
    final screenWidth = MediaQuery.of(context).size.width;
    final columnWidth = (screenWidth * 0.78).clamp(260.0, 320.0);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (final col in columns) ...[
            _KanbanColumnWidget(
              column: col,
              todos: grouped[col.id] ?? [],
              width: columnWidth,
              isCollapsed: collapsed.contains(col.id),
              onToggleCollapse: () {
                final s = ref.read(kanbanCollapsedProvider.notifier);
                final current = Set<String>.from(
                  ref.read(kanbanCollapsedProvider),
                );
                if (current.contains(col.id)) {
                  current.remove(col.id);
                } else {
                  current.add(col.id);
                }
                s.set(current);
              },
              onCardDropped: (todo) =>
                  _onCardDropped(ref, todo, col.id),
              groupBy: groupBy,
            ),
            const SizedBox(width: 10),
          ],
        ],
      ),
    );
  }

  Future<void> _onCardDropped(
    WidgetRef ref,
    Todo todo,
    String targetColumnId,
  ) async {
    final updateTodo = ref.read(updateTodoProvider);

    final updated = groupBy == KanbanGroupBy.status
        ? todo.copyWith(
            status: TodoStatus.values.firstWhere(
              (s) => s.name == targetColumnId,
              orElse: () => todo.status,
            ),
            updatedAt: DateTime.now(),
          )
        : todo.copyWith(
            priority: TodoPriority.values.firstWhere(
              (p) => p.name == targetColumnId,
              orElse: () => todo.priority,
            ),
            updatedAt: DateTime.now(),
          );

    await updateTodo(updated);
    ref.invalidate(todoListProvider);
  }
}

// =============================================================================
// Single Kanban column
// =============================================================================

class _KanbanColumnWidget extends StatelessWidget {
  const _KanbanColumnWidget({
    required this.column,
    required this.todos,
    required this.width,
    required this.isCollapsed,
    required this.onToggleCollapse,
    required this.onCardDropped,
    required this.groupBy,
  });

  final KanbanColumn column;
  final List<Todo> todos;
  final double width;
  final bool isCollapsed;
  final VoidCallback onToggleCollapse;
  final ValueChanged<Todo> onCardDropped;
  final KanbanGroupBy groupBy;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return DragTarget<Todo>(
      onWillAcceptWithDetails: (details) {
        final todo = details.data;
        // Don't accept if already in this column
        final currentKey = groupBy == KanbanGroupBy.status
            ? todo.status.name
            : todo.priority.name;
        return currentKey != column.id;
      },
      onAcceptWithDetails: (details) {
        HapticFeedback.mediumImpact();
        onCardDropped(details.data);
      },
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;

        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: width,
          decoration: BoxDecoration(
            // Light: white bg with purple border; Dark: surfaceContainer
            color: isHovering
                ? column.color.withValues(alpha: isLight ? 0.10 : 0.08)
                : isLight
                    ? Colors.white.withValues(alpha: 0.65)
                    : colorScheme.surfaceContainer,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isHovering
                  ? column.color.withValues(alpha: isLight ? 0.6 : 0.5)
                  : isLight
                      ? colorScheme.primary.withValues(alpha: 0.15)
                      : colorScheme.surfaceContainerHigh,
              width: isHovering ? 2 : 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Column header
              _ColumnHeader(
                column: column,
                count: todos.length,
                isCollapsed: isCollapsed,
                onToggle: onToggleCollapse,
              ),

              // Cards
              if (!isCollapsed)
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight:
                        MediaQuery.of(context).size.height * 0.65,
                  ),
                  child: todos.isEmpty
                      ? _EmptyColumn(color: column.color)
                      : ListView.builder(
                          shrinkWrap: true,
                          padding: const EdgeInsets.fromLTRB(
                            8, 0, 8, 8,
                          ),
                          itemCount: todos.length,
                          itemBuilder: (_, i) =>
                              _DraggableCard(todo: todos[i]),
                        ),
                ),
            ],
          ),
        );
      },
    );
  }
}

// =============================================================================
// Column header
// =============================================================================

class _ColumnHeader extends StatelessWidget {
  const _ColumnHeader({
    required this.column,
    required this.count,
    required this.isCollapsed,
    required this.onToggle,
  });

  final KanbanColumn column;
  final int count;
  final bool isCollapsed;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onToggle,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 12,
          vertical: 10,
        ),
        child: Row(
          children: [
            Icon(column.icon, size: 16, color: column.color),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                column.label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: column.color,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                // Light: higher opacity badge for contrast; Dark: subtle
                color: column.color.withValues(alpha: isLight ? 0.12 : 0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$count',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: column.color,
                ),
              ),
            ),
            const SizedBox(width: 6),
            AnimatedRotation(
              turns: isCollapsed ? -0.25 : 0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                Icons.expand_more,
                size: 18,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Empty column placeholder
// =============================================================================

class _EmptyColumn extends StatelessWidget {
  const _EmptyColumn({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 12,
        vertical: 24,
      ),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.drag_indicator,
              size: 28,
              // Light: higher opacity for readability on light bg
              color: color.withValues(alpha: isLight ? 0.4 : 0.3),
            ),
            const SizedBox(height: 6),
            Text(
              'Drop tasks here',
              style: TextStyle(
                fontSize: 12,
                // Light: more visible text; Dark: subtle
                color: color.withValues(alpha: isLight ? 0.65 : 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// Draggable task card
// =============================================================================

class _DraggableCard extends StatelessWidget {
  const _DraggableCard({required this.todo});

  final Todo todo;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: LongPressDraggable<Todo>(
        data: todo,
        delay: const Duration(milliseconds: 200),
        feedback: Material(
          color: Colors.transparent,
          child: SizedBox(
            width: 260,
            child: Transform.rotate(
              angle: 0.03,
              child: Opacity(
                opacity: 0.92,
                child: _KanbanCard(todo: todo, isDragging: true),
              ),
            ),
          ),
        ),
        childWhenDragging: Opacity(
          opacity: 0.3,
          child: _KanbanCard(todo: todo),
        ),
        child: _KanbanCard(todo: todo),
      ),
    );
  }
}

// =============================================================================
// Kanban card
// =============================================================================

class _KanbanCard extends StatelessWidget {
  const _KanbanCard({required this.todo, this.isDragging = false});

  final Todo todo;
  final bool isDragging;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: isDragging
            ? colorScheme.surfaceContainerHigh
            : isLight ? Colors.white : colorScheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isDragging
              ? colorScheme.primary.withValues(alpha: isLight ? 0.6 : 0.5)
              : isLight
                  ? colorScheme.primary.withValues(alpha: 0.1)
                  : colorScheme.surfaceContainerHigh,
        ),
        boxShadow: isDragging
            ? [
                BoxShadow(
                  // Light: purple-tinted shadow; Dark: primary glow
                  color: isLight
                      ? ux.shadowBase.withValues(alpha: 0.15)
                      : colorScheme.primary.withValues(alpha: 0.2),
                  blurRadius: 12,
                  spreadRadius: 2,
                ),
              ]
            : isLight
                ? [
                    BoxShadow(
                      color: ux.shadowBase.withValues(alpha: 0.06),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title + priority dot
            Row(
              children: [
                if (todo.priority != TodoPriority.none)
                  Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: unjynxPriorityColor(context, todo.priority.name),
                    ),
                  ),
                Expanded(
                  child: Text(
                    todo.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: colorScheme.onSurface,
                      decoration: todo.status == TodoStatus.completed
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                ),
              ],
            ),

            // Metadata row
            if (todo.dueDate != null || todo.projectId != null) ...[
              const SizedBox(height: 6),
              Row(
                children: [
                  if (todo.dueDate != null)
                    _DueDateChip(date: todo.dueDate!),
                  if (todo.projectId != null) ...[
                    if (todo.dueDate != null)
                      const SizedBox(width: 6),
                    Icon(
                      Icons.folder_outlined,
                      size: 12,
                      color: colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.7 : 0.6),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

}

// =============================================================================
// Due date chip
// =============================================================================

class _DueDateChip extends StatelessWidget {
  const _DueDateChip({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);
    final diff = dateOnly.difference(today).inDays;

    final (label, color) = switch (diff) {
      < 0 => ('${-diff}d overdue', colorScheme.error),
      0 => ('Today', ux.warning),
      1 => ('Tomorrow', ux.success),
      _ => (
          '${_monthAbbr(date.month)} ${date.day}',
          colorScheme.onSurfaceVariant,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 6,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        // Light: slightly higher opacity for readable tint; Dark: subtle
        color: color.withValues(alpha: isLight ? 0.10 : 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
    );
  }

  String _monthAbbr(int month) {
    const abbrs = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return abbrs[month - 1];
  }
}
