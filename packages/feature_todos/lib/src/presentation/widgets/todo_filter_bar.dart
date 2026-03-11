import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';
import '../../domain/entities/todo_filter.dart';
import '../providers/todo_providers.dart';

/// Filter bar for the TODO list.
class TodoFilterBar extends ConsumerWidget {
  const TodoFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(todoFilterProvider);

    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _FilterChip(
            label: 'All',
            isSelected: filter.status == null,
            onTap: () {
              HapticFeedback.selectionClick();
              ref.read(todoFilterProvider.notifier).state =
                  filter.copyWith(status: null);
            },
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Pending',
            isSelected: filter.status == TodoStatus.pending,
            onTap: () {
              HapticFeedback.selectionClick();
              ref.read(todoFilterProvider.notifier).state =
                  filter.copyWith(status: TodoStatus.pending);
            },
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'In Progress',
            isSelected: filter.status == TodoStatus.inProgress,
            onTap: () {
              HapticFeedback.selectionClick();
              ref.read(todoFilterProvider.notifier).state =
                  filter.copyWith(status: TodoStatus.inProgress);
            },
          ),
          const SizedBox(width: 8),
          _FilterChip(
            label: 'Completed',
            isSelected: filter.status == TodoStatus.completed,
            onTap: () {
              HapticFeedback.selectionClick();
              ref.read(todoFilterProvider.notifier).state =
                  filter.copyWith(status: TodoStatus.completed);
            },
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? colorScheme.primary
              : isLight
                  ? Colors.white
                  : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? colorScheme.primary
                : isLight
                    ? colorScheme.primary.withValues(alpha: 0.2)
                    : colorScheme.surfaceContainerHigh,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            color: isSelected
                ? colorScheme.onPrimary
                : colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
