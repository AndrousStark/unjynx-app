import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../../domain/entities/todo_filter.dart';

/// Horizontal scrollable chip bar for filtering tasks.
///
/// Includes time-based filters (All, Today, Upcoming, Overdue, No Date,
/// Completed), priority filter, and sort selector.
class FilterChipBar extends StatelessWidget {
  const FilterChipBar({
    super.key,
    required this.filter,
    required this.onFilterChanged,
  });

  final TodoFilter filter;
  final ValueChanged<TodoFilter> onFilterChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Status/time filter chips
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _FilterChipItem(
                label: 'All',
                isSelected: filter.status == null && filter.dateRange == null,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: null,
                      dateRange: null,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              _FilterChipItem(
                label: 'Today',
                icon: Icons.today,
                isSelected: filter.dateRange == DateRange.today,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: null,
                      dateRange: DateRange.today,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              _FilterChipItem(
                label: 'Upcoming',
                icon: Icons.upcoming_outlined,
                isSelected: filter.dateRange == DateRange.upcoming,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: null,
                      dateRange: DateRange.upcoming,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              _FilterChipItem(
                label: 'Overdue',
                icon: Icons.warning_amber_rounded,
                isSelected: filter.dateRange == DateRange.overdue,
                color: colorScheme.error,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: null,
                      dateRange: DateRange.overdue,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              _FilterChipItem(
                label: 'No Date',
                icon: Icons.event_busy_outlined,
                isSelected: filter.dateRange == DateRange.noDate,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: null,
                      dateRange: DateRange.noDate,
                    ),
                  );
                },
              ),
              const SizedBox(width: 8),
              _FilterChipItem(
                label: 'Done',
                icon: Icons.check_circle_outline,
                isSelected: filter.status == TodoStatus.completed,
                color: ux.success,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onFilterChanged(
                    filter.copyWith(
                      status: TodoStatus.completed,
                      dateRange: null,
                    ),
                  );
                },
              ),
              const SizedBox(width: 16),

              // Priority filter dropdown
              _PriorityDropdown(
                selectedPriority: filter.priority,
                onChanged: (priority) => onFilterChanged(
                  filter.copyWith(priority: priority),
                ),
              ),
              const SizedBox(width: 8),

              // Sort selector
              _SortDropdown(
                sortBy: filter.sortBy,
                ascending: filter.ascending,
                onChanged: (sortBy, ascending) => onFilterChanged(
                  filter.copyWith(sortBy: sortBy, ascending: ascending),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FilterChipItem extends StatelessWidget {
  const _FilterChipItem({
    required this.label,
    this.icon,
    required this.isSelected,
    this.color,
    required this.onTap,
  });

  final String label;
  final IconData? icon;
  final bool isSelected;
  final Color? color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final activeColor = color ?? colorScheme.primary;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? isLight
                  ? activeColor.withValues(alpha: 0.10)
                  : activeColor.withValues(alpha: 0.15)
              : isLight
                  ? Colors.white
                  : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? activeColor.withValues(alpha: isLight ? 0.4 : 0.5)
                : isLight
                    ? colorScheme.primary.withValues(alpha: 0.2)
                    : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 14,
                color: isSelected ? activeColor : colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? activeColor : colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriorityDropdown extends StatelessWidget {
  const _PriorityDropdown({
    required this.selectedPriority,
    required this.onChanged,
  });

  final TodoPriority? selectedPriority;
  final ValueChanged<TodoPriority?> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final hasFilter = selectedPriority != null;

    return GestureDetector(
      onTap: () => _showPicker(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: hasFilter
              ? unjynxPriorityColor(context, selectedPriority!.name)
                  .withValues(alpha: isLight ? 0.10 : 0.15)
              : isLight
                  ? Colors.white
                  : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: hasFilter
                ? unjynxPriorityColor(context, selectedPriority!.name)
                    .withValues(alpha: isLight ? 0.4 : 0.5)
                : isLight
                    ? colorScheme.primary.withValues(alpha: 0.2)
                    : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.flag_outlined,
              size: 14,
              color: hasFilter
                  ? unjynxPriorityColor(context, selectedPriority!.name)
                  : colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              hasFilter ? selectedPriority!.name : 'Priority',
              style: TextStyle(
                fontSize: 13,
                color: hasFilter
                    ? unjynxPriorityColor(context, selectedPriority!.name)
                    : colorScheme.onSurfaceVariant,
              ),
            ),
            if (hasFilter) ...[
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onChanged(null);
                },
                child: SizedBox(
                  width: 44,
                  height: 44,
                  child: Center(
                    child: Icon(Icons.close, size: 14,
                        color: colorScheme.onSurfaceVariant),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showPicker(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet<TodoPriority>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        final uxInner = context.unjynx;
        return Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Filter by Priority',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface,
                      )),
                ),
                for (final p in TodoPriority.values.where(
                    (p) => p != TodoPriority.none))
                  ListTile(
                    leading: Icon(Icons.flag, color: unjynxPriorityColor(context, p.name)),
                    title: Text(
                      '${p.name[0].toUpperCase()}${p.name.substring(1)}',
                      style: TextStyle(color: cs.onSurface),
                    ),
                    trailing: p == selectedPriority
                        ? Icon(Icons.check, color: uxInner.gold)
                        : null,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      Navigator.of(context).pop(p);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    ).then((selected) {
      if (selected != null) onChanged(selected);
    });
  }

}

class _SortDropdown extends StatelessWidget {
  const _SortDropdown({
    required this.sortBy,
    required this.ascending,
    required this.onChanged,
  });

  final TodoSortBy sortBy;
  final bool ascending;
  final void Function(TodoSortBy, bool) onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: () => _showSortPicker(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isLight ? Colors.white : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: isLight
              ? Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.2),
                )
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              ascending ? Icons.arrow_upward : Icons.arrow_downward,
              size: 14,
              color: colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              _sortLabel(sortBy),
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _sortLabel(TodoSortBy sort) {
    return switch (sort) {
      TodoSortBy.dueDate => 'Due date',
      TodoSortBy.priority => 'Priority',
      TodoSortBy.createdAt => 'Created',
      TodoSortBy.title => 'A-Z',
      TodoSortBy.updatedAt => 'Updated',
      TodoSortBy.sortOrder => 'Custom',
    };
  }

  void _showSortPicker(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        final uxInner = context.unjynx;
        return Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text('Sort by',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface,
                      )),
                ),
                for (final sort in TodoSortBy.values)
                  ListTile(
                    title: Text(
                      _sortLabel(sort),
                      style: TextStyle(color: cs.onSurface),
                    ),
                    trailing: sort == sortBy
                        ? Icon(
                            ascending
                                ? Icons.arrow_upward
                                : Icons.arrow_downward,
                            color: uxInner.gold,
                            size: 18,
                          )
                        : null,
                    selected: sort == sortBy,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      Navigator.of(context).pop();
                      // Toggle direction if same sort, otherwise default desc
                      if (sort == sortBy) {
                        onChanged(sort, !ascending);
                      } else {
                        onChanged(sort, false);
                      }
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
