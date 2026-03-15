import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Step 2: Wins -- celebrate completed tasks.
class WinsStep extends StatelessWidget {
  const WinsStep({super.key, required this.ref});

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
            Icons.emoji_events_rounded,
            size: 44,
            color: ux.gold,
          ),
          const SizedBox(height: 24),

          Text(
            "Today's Wins",
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
            'Celebrate what you accomplished',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 28),

          tasksAsync.when(
            data: (tasks) {
              final completed = tasks
                  .where((t) => t.isCompleted)
                  .toList(growable: false);

              if (completed.isEmpty) {
                return const _EmptyWinsMessage();
              }

              return Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  itemCount: completed.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    return _WinTile(task: completed[index]);
                  },
                ),
              );
            },
            loading: () => CircularProgressIndicator(
              color: ux.gold,
              strokeWidth: 2,
            ),
            error: (_, __) => Text(
              'Could not load completed tasks.',
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
// Empty wins encouraging message
// ---------------------------------------------------------------------------

class _EmptyWinsMessage extends StatelessWidget {
  const _EmptyWinsMessage();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.primary.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.wb_twilight_rounded,
            size: 40,
            color: colorScheme.primary.withValues(alpha: 0.6),
          ),
          const SizedBox(height: 16),
          Text(
            'Tomorrow is a fresh start',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Not every day will feel productive, and '
            "that's perfectly okay. Rest is part of the process.",
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Win tile (completed task with checkmark)
// ---------------------------------------------------------------------------

class _WinTile extends StatelessWidget {
  const _WinTile({required this.task});

  final HomeTask task;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: ux.success.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        children: [
          // Success checkmark
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: ux.success.withValues(alpha: 0.15),
            ),
            child: Center(
              child: Icon(
                Icons.check_rounded,
                size: 18,
                color: ux.success,
              ),
            ),
          ),

          const SizedBox(width: 14),

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
        ],
      ),
    );
  }
}
