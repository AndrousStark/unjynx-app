import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../../domain/entities/todo_filter.dart';
import '../providers/todo_providers.dart';
import '../widgets/bulk_action_bar.dart';
import '../widgets/filter_chip_bar.dart';
import '../widgets/quick_create_sheet.dart';
import '../widgets/todo_card.dart';
import '../widgets/todo_grid_card.dart';

/// Enhanced TODO list page with filters, sort, view toggle, and bulk actions.
class TodoListPage extends ConsumerStatefulWidget {
  const TodoListPage({super.key});

  @override
  ConsumerState<TodoListPage> createState() => _TodoListPageState();
}

class _TodoListPageState extends ConsumerState<TodoListPage> {
  bool _isSearching = false;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final todosAsync = ref.watch(todoListProvider);
    final viewMode = ref.watch(taskViewModeProvider);
    final selectedIds = ref.watch(selectedTodoIdsProvider);
    final isBulkMode = ref.watch(isBulkModeProvider);
    final filter = ref.watch(todoFilterProvider);

    return Scaffold(
      appBar: _buildAppBar(isBulkMode, selectedIds.length),
      body: Stack(
        children: [
          Column(
            children: [
              const SizedBox(height: 8),

              // Filter chip bar
              FilterChipBar(
                filter: filter,
                onFilterChanged: (newFilter) {
                  ref.read(todoFilterProvider.notifier).set(newFilter);
                },
              ),
              const SizedBox(height: 8),

              // Task count + view toggle row
              _TaskCountHeader(
                todosAsync: todosAsync,
                viewMode: viewMode,
                onViewModeChanged: (mode) {
                  ref.read(taskViewModeProvider.notifier).set(mode);
                },
              ),
              const SizedBox(height: 8),

              // Task list / grid
              Expanded(
                child: todosAsync.when(
                  data: (todos) => todos.isEmpty
                      ? _isSearching
                          ? UnjynxEmptyState(
                              type: EmptyStateType.searchEmpty,
                            )
                          : _hasActiveFilter(filter)
                              ? UnjynxEmptyState(
                                  type: EmptyStateType.searchEmpty,
                                  title: 'No tasks match filters',
                                  subtitle: 'Adjust or clear your filters',
                                  actionLabel: 'Clear Filters',
                                  onAction: _clearFilters,
                                )
                              : UnjynxEmptyState(
                                  type: EmptyStateType.noTasks,
                                  onAction: () => _showCreateSheet(context),
                                )
                      : RefreshIndicator(
                          color: colorScheme.primary,
                          backgroundColor: colorScheme.surface,
                          onRefresh: () async {
                            ref.invalidate(todoListProvider);
                          },
                          child: viewMode == TaskViewMode.list
                              ? _TodoListView(
                                  todos: todos,
                                  selectedIds: selectedIds,
                                  isBulkMode: isBulkMode,
                                )
                              : _TodoGridView(
                                  todos: todos,
                                  selectedIds: selectedIds,
                                  isBulkMode: isBulkMode,
                                ),
                        ),
                  loading: () => Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: List.generate(
                        6,
                        (i) => const Padding(
                          padding: EdgeInsets.only(bottom: 12),
                          child: UnjynxShimmerCard(),
                        ),
                      ),
                    ),
                  ),
                  error: (error, _) => UnjynxErrorView(
                    type: ErrorViewType.serverError,
                    onRetry: () => ref.invalidate(todoListProvider),
                  ),
                ),
              ),
            ],
          ),

          // Bulk action bar (slides up from bottom)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: BulkActionBar(
              selectedCount: selectedIds.length,
              onCompleteAll: () => _bulkComplete(selectedIds),
              onDeleteAll: () => _bulkDelete(selectedIds),
              onChangePriority: (priority) =>
                  _bulkChangePriority(selectedIds, priority),
              onClearSelection: _clearSelection,
            ),
          ),
        ],
      ),
      floatingActionButton: isBulkMode
          ? null
          : Semantics(
              label: 'Create new task',
              button: true,
              child: FloatingActionButton(
                onPressed: () {
                  HapticFeedback.lightImpact();
                  _showCreateSheet(context);
                },
                child: const Icon(Icons.add),
              ),
            ),
    );
  }

  // ---------------------------------------------------------------------------
  // App Bar
  // ---------------------------------------------------------------------------

  PreferredSizeWidget _buildAppBar(bool isBulkMode, int selectedCount) {
    final colorScheme = Theme.of(context).colorScheme;

    if (isBulkMode) {
      return AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close),
          tooltip: 'Exit selection mode',
          onPressed: () {
            HapticFeedback.lightImpact();
            _clearSelection();
          },
        ),
        title: Text('$selectedCount selected'),
        actions: [
          TextButton(
            onPressed: _selectAll,
            child: Text(
              'Select all',
              style: TextStyle(color: colorScheme.primary),
            ),
          ),
        ],
      );
    }

    return AppBar(
      title: _isSearching
          ? TextField(
              controller: _searchController,
              autofocus: true,
              style: TextStyle(color: colorScheme.onSurface),
              decoration: InputDecoration(
                hintText: 'Search tasks...',
                hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
                border: InputBorder.none,
              ),
              onChanged: _onSearchChanged,
            )
          : Text(unjynxLabelWidget(ref, 'Tasks')),
      actions: [
        IconButton(
          icon: Icon(_isSearching ? Icons.close : Icons.search),
          tooltip: _isSearching ? 'Close search' : 'Search tasks',
          onPressed: () {
            HapticFeedback.lightImpact();
            _toggleSearch();
          },
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  void _toggleSearch() {
    setState(() {
      _isSearching = !_isSearching;
      if (!_isSearching) {
        _searchController.clear();
        ref.read(todoFilterProvider.notifier).set(
          ref.read(todoFilterProvider).copyWith(searchQuery: null),
        );
      }
    });
  }

  void _onSearchChanged(String query) {
    final trimmed = query.trim();
    ref.read(todoFilterProvider.notifier).set(
      ref.read(todoFilterProvider).copyWith(
        searchQuery: trimmed.isEmpty ? null : trimmed,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------

  bool _hasActiveFilter(TodoFilter filter) {
    return filter.status != null ||
        filter.priority != null ||
        filter.dateRange != null ||
        filter.searchQuery != null;
  }

  void _clearFilters() {
    ref.read(todoFilterProvider.notifier).set(const TodoFilter());
    _searchController.clear();
    setState(() => _isSearching = false);
  }

  // ---------------------------------------------------------------------------
  // Bulk operations
  // ---------------------------------------------------------------------------

  void _clearSelection() {
    ref.read(selectedTodoIdsProvider.notifier).set(const {});
  }

  void _selectAll() {
    final todosAsync = ref.read(todoListProvider);
    todosAsync.whenData((todos) {
      ref.read(selectedTodoIdsProvider.notifier).set(
        todos.map((t) => t.id).toSet(),
      );
    });
  }

  Future<void> _bulkComplete(Set<String> ids) async {
    final ux = context.unjynx;
    final completeTodo = ref.read(completeTodoProvider);
    final notificationPort = ref.read(notificationPortProvider);

    for (final id in ids) {
      await completeTodo(id);
      await notificationPort.cancel(id);
    }

    _clearSelection();
    ref.invalidate(todoListProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${ids.length} tasks completed'),
          backgroundColor: ux.success,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  Future<void> _bulkDelete(Set<String> ids) async {
    final colorScheme = Theme.of(context).colorScheme;
    final deleteTodo = ref.read(deleteTodoProvider);
    final notificationPort = ref.read(notificationPortProvider);

    for (final id in ids) {
      await deleteTodo(id);
      await notificationPort.cancel(id);
    }

    _clearSelection();
    ref.invalidate(todoListProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${ids.length} tasks deleted'),
          backgroundColor: colorScheme.error,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  Future<void> _bulkChangePriority(
    Set<String> ids,
    TodoPriority priority,
  ) async {
    final colorScheme = Theme.of(context).colorScheme;
    final updateTodo = ref.read(updateTodoProvider);
    final repo = ref.read(todoRepositoryProvider);

    for (final id in ids) {
      final result = await repo.getById(id);
      result.when(
        ok: (todo) async {
          await updateTodo(todo.copyWith(priority: priority));
        },
        err: (_, __) {},
      );
    }

    _clearSelection();
    ref.invalidate(todoListProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${ids.length} tasks set to '
            '${priority.name[0].toUpperCase()}${priority.name.substring(1)}',
          ),
          backgroundColor: colorScheme.primary,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Create sheet
  // ---------------------------------------------------------------------------

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const QuickCreateSheet(),
    );
  }
}

// =============================================================================
// Task count header with view toggle
// =============================================================================

class _TaskCountHeader extends StatelessWidget {
  const _TaskCountHeader({
    required this.todosAsync,
    required this.viewMode,
    required this.onViewModeChanged,
  });

  final AsyncValue<List<Todo>> todosAsync;
  final TaskViewMode viewMode;
  final ValueChanged<TaskViewMode> onViewModeChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Task count
          todosAsync.when(
            data: (todos) => Text(
              '${todos.length} task${todos.length == 1 ? '' : 's'}',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
                fontWeight: FontWeight.w500,
              ),
            ),
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
          ),

          const Spacer(),

          // View toggle
          Container(
            decoration: BoxDecoration(
              color: context.isLightMode
                  ? colorScheme.surfaceContainer
                  : colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _ViewToggleButton(
                  icon: Icons.view_list_rounded,
                  semanticLabel: 'List view',
                  isActive: viewMode == TaskViewMode.list,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onViewModeChanged(TaskViewMode.list);
                  },
                ),
                _ViewToggleButton(
                  icon: Icons.grid_view_rounded,
                  semanticLabel: 'Grid view',
                  isActive: viewMode == TaskViewMode.grid,
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onViewModeChanged(TaskViewMode.grid);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ViewToggleButton extends StatelessWidget {
  const _ViewToggleButton({
    required this.icon,
    required this.semanticLabel,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final String semanticLabel;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Semantics(
      label: semanticLabel,
      button: true,
      selected: isActive,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isActive
                  ? colorScheme.primary.withValues(alpha: isLight ? 0.12 : 0.2)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              icon,
              size: 18,
              color: isActive
                  ? colorScheme.primary
                  : colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// List view
// =============================================================================

class _TodoListView extends ConsumerWidget {
  const _TodoListView({
    required this.todos,
    required this.selectedIds,
    required this.isBulkMode,
  });

  final List<Todo> todos;
  final Set<String> selectedIds;
  final bool isBulkMode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: isBulkMode ? 100 : 80,
      ),
      itemCount: todos.length,
      itemBuilder: (context, index) {
        final todo = todos[index];
        final isSelected = selectedIds.contains(todo.id);

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _SelectableWrapper(
            isSelected: isSelected,
            isBulkMode: isBulkMode,
            child: TodoCard(
              todo: todo,
              onComplete: isBulkMode
                  ? null
                  : () => _completeTodo(ref, todo),
              onTap: isBulkMode
                  ? () => _toggleSelection(ref, todo.id)
                  : () => GoRouter.of(context).push('/todos/${todo.id}'),
              onLongPress: isBulkMode
                  ? null
                  : () => _enterBulkMode(ref, todo.id),
              onDelete: null,
            ),
          ),
        );
      },
    );
  }

  Future<void> _completeTodo(WidgetRef ref, Todo todo) async {
    final completeTodo = ref.read(completeTodoProvider);
    await completeTodo(todo.id);

    final notificationPort = ref.read(notificationPortProvider);
    await notificationPort.cancel(todo.id);

    ref.invalidate(todoListProvider);
  }

  void _toggleSelection(WidgetRef ref, String id) {
    final current = ref.read(selectedTodoIdsProvider);
    final updated = Set<String>.from(current);
    if (updated.contains(id)) {
      updated.remove(id);
    } else {
      updated.add(id);
    }
    ref.read(selectedTodoIdsProvider.notifier).set(updated);
    HapticFeedback.selectionClick();
  }

  void _enterBulkMode(WidgetRef ref, String id) {
    ref.read(selectedTodoIdsProvider.notifier).set({id});
    HapticFeedback.mediumImpact();
  }
}

// =============================================================================
// Grid view
// =============================================================================

class _TodoGridView extends ConsumerWidget {
  const _TodoGridView({
    required this.todos,
    required this.selectedIds,
    required this.isBulkMode,
  });

  final List<Todo> todos;
  final Set<String> selectedIds;
  final bool isBulkMode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GridView.builder(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        bottom: isBulkMode ? 100 : 80,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: todos.length,
      itemBuilder: (context, index) {
        final todo = todos[index];
        final isSelected = selectedIds.contains(todo.id);

        return TodoGridCard(
          todo: todo,
          isSelected: isSelected,
          onTap: isBulkMode
              ? () => _toggleSelection(ref, todo.id)
              : () => GoRouter.of(context).push('/todos/${todo.id}'),
          onLongPress: () => _enterBulkMode(ref, todo.id),
          onComplete: isBulkMode
              ? null
              : () => _completeTodo(ref, todo),
        );
      },
    );
  }

  Future<void> _completeTodo(WidgetRef ref, Todo todo) async {
    final completeTodo = ref.read(completeTodoProvider);
    await completeTodo(todo.id);

    final notificationPort = ref.read(notificationPortProvider);
    await notificationPort.cancel(todo.id);

    ref.invalidate(todoListProvider);
  }

  void _toggleSelection(WidgetRef ref, String id) {
    final current = ref.read(selectedTodoIdsProvider);
    final updated = Set<String>.from(current);
    if (updated.contains(id)) {
      updated.remove(id);
    } else {
      updated.add(id);
    }
    ref.read(selectedTodoIdsProvider.notifier).set(updated);
    HapticFeedback.selectionClick();
  }

  void _enterBulkMode(WidgetRef ref, String id) {
    ref.read(selectedTodoIdsProvider.notifier).set({id});
    HapticFeedback.mediumImpact();
  }
}

// =============================================================================
// Selectable wrapper for list cards
// =============================================================================

class _SelectableWrapper extends StatelessWidget {
  const _SelectableWrapper({
    required this.isSelected,
    required this.isBulkMode,
    required this.child,
  });

  final bool isSelected;
  final bool isBulkMode;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    if (!isBulkMode) return child;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        // Light: gold-wash selected; Dark: gold at 15%
        color: isSelected
            ? (isLight ? ux.goldWash : ux.gold.withValues(alpha: 0.15))
            : null,
        border: Border.all(
          color: isSelected
              ? colorScheme.primary.withValues(alpha: isLight ? 0.5 : 0.6)
              : Colors.transparent,
          width: 2,
        ),
      ),
      child: Stack(
        children: [
          child,
          if (isSelected)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check,
                  size: 14,
                  color: colorScheme.onPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Old _EmptyState and _ErrorState replaced by UnjynxEmptyState / UnjynxErrorView
// from unjynx_core.
