import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Step 3: Carry Forward -- review incomplete tasks and optionally reschedule.
class CarryForwardStep extends StatelessWidget {
  const CarryForwardStep({super.key, required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final tasksAsync = ref.watch(homeTodayTasksProvider);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.arrow_forward_rounded,
            size: 44,
            color: ux.warning.withValues(alpha: 0.8),
          ),
          const SizedBox(height: 24),

          Text(
            'Incomplete Tasks',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          Text(
            'Review what carries into tomorrow',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          tasksAsync.when(
            data: (tasks) {
              final incomplete = tasks
                  .where((t) => !t.isCompleted)
                  .toList(growable: false);

              if (incomplete.isEmpty) {
                return _AllDoneMessage();
              }

              final rescheduleCallback =
                  ref.read(rescheduleTaskCallbackProvider);

              return Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  itemCount: incomplete.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    return _CarryForwardTile(
                      task: incomplete[index],
                      onReschedule: rescheduleCallback,
                    );
                  },
                ),
              );
            },
            loading: () => CircularProgressIndicator(
              color: ux.warning,
              strokeWidth: 2,
            ),
            error: (_, __) => Text(
              'Could not load incomplete tasks.',
              style: TextStyle(
                color: colorScheme.onSurfaceVariant,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// All tasks done message
// ---------------------------------------------------------------------------

class _AllDoneMessage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Icon(
            Icons.star_rounded,
            size: 36,
            color: ux.gold,
          ),
          const SizedBox(height: 12),
          Text(
            'Everything done!',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'You cleared the board today. Incredible.',
            style: TextStyle(
              fontSize: 13,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: 0.8),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Carry forward tile
// ---------------------------------------------------------------------------

class _CarryForwardTile extends StatelessWidget {
  const _CarryForwardTile({
    required this.task,
    required this.onReschedule,
  });

  final HomeTask task;
  final Future<void> Function(String taskId) onReschedule;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () async {
        HapticFeedback.selectionClick();
        try {
          await onReschedule(task.id);
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('\"${task.title}\" moved to tomorrow'),
                duration: const Duration(seconds: 2),
                backgroundColor: colorScheme.surfaceContainerHigh,
              ),
            );
          }
        } on Exception catch (_) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Text('Failed to reschedule task'),
                duration: const Duration(seconds: 2),
                backgroundColor: colorScheme.error,
              ),
            );
          }
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
          ),
        ),
        child: Row(
          children: [
            // Priority dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: unjynxPriorityColor(context, task.priority.name),
              ),
            ),

            const SizedBox(width: 14),

            // Task title
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurface,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),

            const SizedBox(width: 8),

            // "Move to tomorrow" chip -- tapping the tile reschedules
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.schedule_rounded,
                    size: 12,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Tomorrow',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
