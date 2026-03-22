import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Retention Hook #5: Completion Momentum.
///
/// After the user completes a task, this card appears showing the next
/// highest-priority incomplete task as a "Next up:" suggestion. Tapping
/// navigates to the task detail page.
///
/// Watches today's tasks and only renders when there is at least one
/// completed task AND at least one remaining incomplete task. This creates
/// a natural "one more" momentum loop.
class CompletionMomentumCard extends ConsumerWidget {
  const CompletionMomentumCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(homeTodayTasksProvider);

    return tasksAsync.when(
      data: (tasks) {
        // Only show when there's momentum (at least one done + one left).
        final completedCount = tasks.where((t) => t.isCompleted).length;
        if (completedCount == 0) return const SizedBox.shrink();

        final incomplete = tasks.where((t) => !t.isCompleted).toList();
        if (incomplete.isEmpty) return const SizedBox.shrink();

        // Sort by priority: urgent > high > medium > low > none.
        final sorted = [...incomplete]..sort((a, b) {
            final order = {
              HomeTaskPriority.urgent: 0,
              HomeTaskPriority.high: 1,
              HomeTaskPriority.medium: 2,
              HomeTaskPriority.low: 3,
              HomeTaskPriority.none: 4,
            };
            return (order[a.priority] ?? 4).compareTo(order[b.priority] ?? 4);
          });

        final nextTask = sorted.first;

        return _MomentumCard(
          nextTask: nextTask,
          completedCount: completedCount,
          remainingCount: incomplete.length,
        );
      },
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _MomentumCard extends StatelessWidget {
  const _MomentumCard({
    required this.nextTask,
    required this.completedCount,
    required this.remainingCount,
  });

  final HomeTask nextTask;
  final int completedCount;
  final int remainingCount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PressableScale(
        onTap: () {
          HapticFeedback.lightImpact();
          GoRouter.of(context).push('/todos/${nextTask.id}');
        },
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isLight
                ? ux.successWash
                : ux.success.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: ux.success.withValues(alpha: isLight ? 0.2 : 0.15),
            ),
          ),
          child: Row(
            children: [
              // Checkmark momentum icon.
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: ux.success.withValues(alpha: isLight ? 0.15 : 0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.trending_up_rounded,
                  color: ux.success,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),

              // Next up text.
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$completedCount done! Next up:',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: ux.success,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      nextTask.title,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),

              // Arrow.
              Icon(
                Icons.chevron_right_rounded,
                color: colorScheme.onSurfaceVariant,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
