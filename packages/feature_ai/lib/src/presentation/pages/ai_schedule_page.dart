import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/schedule_suggestion.dart';
import '../providers/ai_providers.dart';

/// K2 — AI Auto-Schedule Screen.
///
/// Split view showing:
/// - Unscheduled tasks at the top
/// - AI-suggested schedule at the bottom
/// - Accept/reject per task + "Accept All" action
class AiSchedulePage extends ConsumerWidget {
  const AiSchedulePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheduleAsync = ref.watch(scheduleResultProvider);
    final actions = ref.watch(scheduleActionsProvider);
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'AI Schedule',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          scheduleAsync.whenOrNull(
                data: (result) => result.slots.isNotEmpty
                    ? TextButton.icon(
                        onPressed: () {
                          UnjynxHaptics.mediumImpact();
                          final ids =
                              result.slots.map((s) => s.taskId).toList();
                          ref
                              .read(scheduleActionsProvider.notifier)
                              .acceptAll(ids);
                        },
                        icon: const Icon(Icons.check_circle_outline_rounded,
                            size: 18),
                        label: const Text('Accept All'),
                      )
                    : null,
              ) ??
              const SizedBox.shrink(),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          UnjynxHaptics.pullToRefresh();
          ref.invalidate(scheduleResultProvider);
          ref.read(scheduleActionsProvider.notifier).reset();
        },
        child: scheduleAsync.when(
          loading: () => const _ScheduleLoadingState(),
          error: (error, _) => error is AiUnavailableException
              ? const _AiComingSoonState()
              : _ScheduleErrorState(
                  error: error.toString(),
                  onRetry: () {
                    ref.invalidate(scheduleResultProvider);
                    ref.read(scheduleActionsProvider.notifier).reset();
                  },
                ),
          data: (result) => result.slots.isEmpty
              ? const _ScheduleEmptyState()
              : _ScheduleContent(
                  result: result,
                  actions: actions,
                  isLight: isLight,
                  unjynx: unjynx,
                ),
        ),
      ),
    );
  }
}

/// Main content when schedule data is available.
class _ScheduleContent extends ConsumerWidget {
  const _ScheduleContent({
    required this.result,
    required this.actions,
    required this.isLight,
    required this.unjynx,
  });

  final ScheduleResult result;
  final Map<String, bool> actions;
  final bool isLight;
  final UnjynxCustomColors unjynx;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Insights card
        if (result.insights.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: UnjynxStatCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.lightbulb_outline_rounded,
                    size: 20,
                    color: unjynx.gold,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      result.insights,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Section header
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            'SUGGESTED SCHEDULE',
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
              color: isLight
                  ? UnjynxLightColors.textTertiary
                  : UnjynxDarkColors.textTertiary,
            ),
          ),
        ),

        // Schedule slots
        ...result.slots.map((slot) {
          final isAccepted = actions[slot.taskId] == true;
          final isRejected = actions[slot.taskId] == false;

          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _ScheduleSlotCard(
              slot: slot,
              isAccepted: isAccepted,
              isRejected: isRejected,
              isLight: isLight,
              unjynx: unjynx,
              onAccept: () {
                UnjynxHaptics.lightImpact();
                ref
                    .read(scheduleActionsProvider.notifier)
                    .accept(slot.taskId);
              },
              onReject: () {
                UnjynxHaptics.lightImpact();
                ref
                    .read(scheduleActionsProvider.notifier)
                    .reject(slot.taskId);
              },
            ),
          );
        }),
      ],
    );
  }
}

/// A single schedule slot card with accept/reject actions.
class _ScheduleSlotCard extends StatelessWidget {
  const _ScheduleSlotCard({
    required this.slot,
    required this.isAccepted,
    required this.isRejected,
    required this.isLight,
    required this.unjynx,
    required this.onAccept,
    required this.onReject,
  });

  final ScheduleSlot slot;
  final bool isAccepted;
  final bool isRejected;
  final bool isLight;
  final UnjynxCustomColors unjynx;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color? cardColor;
    if (isAccepted) {
      cardColor = isLight
          ? unjynx.successWash
          : unjynx.success.withValues(alpha: 0.1);
    } else if (isRejected) {
      cardColor = isLight
          ? const Color(0xFFFFF1F2)
          : Colors.red.withValues(alpha: 0.08);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      child: UnjynxSolidCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Time slot header
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isLight
                        ? UnjynxLightColors.brandViolet.withValues(alpha: 0.1)
                        : UnjynxDarkColors.brandViolet.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${slot.suggestedStart} - ${slot.suggestedEnd}',
                    style: theme.textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isLight
                          ? UnjynxLightColors.brandViolet
                          : UnjynxDarkColors.brandViolet,
                    ),
                  ),
                ),
                const Spacer(),
                if (isAccepted)
                  Icon(Icons.check_circle_rounded,
                      size: 20, color: unjynx.success)
                else if (isRejected)
                  Icon(Icons.cancel_rounded,
                      size: 20,
                      color: isLight
                          ? UnjynxLightColors.error
                          : UnjynxDarkColors.error),
              ],
            ),
            const SizedBox(height: 10),

            // Task title
            Text(
              slot.taskTitle,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
                decoration: isRejected ? TextDecoration.lineThrough : null,
              ),
            ),
            const SizedBox(height: 4),

            // AI reason
            Text(
              slot.reason,
              style: theme.textTheme.bodySmall?.copyWith(
                color: isLight
                    ? UnjynxLightColors.textTertiary
                    : UnjynxDarkColors.textTertiary,
                height: 1.4,
              ),
            ),

            // Action buttons (only if not yet acted on)
            if (!isAccepted && !isRejected) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  PressableScale(
                    onTap: onReject,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isLight
                              ? UnjynxLightColors.error.withValues(alpha: 0.4)
                              : UnjynxDarkColors.error.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        'Skip',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: isLight
                              ? UnjynxLightColors.error
                              : UnjynxDarkColors.error,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PressableScale(
                    onTap: onAccept,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: isLight
                            ? UnjynxLightColors.brandViolet
                            : UnjynxDarkColors.brandViolet,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Accept',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Shimmer loading state for the schedule page.
class _ScheduleLoadingState extends StatelessWidget {
  const _ScheduleLoadingState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Insights shimmer
        const UnjynxShimmerBox(height: 80, borderRadius: 16),
        const SizedBox(height: 16),
        const UnjynxShimmerLine(width: 160),
        const SizedBox(height: 16),
        // Slot shimmers
        for (var i = 0; i < 4; i++) ...[
          const UnjynxShimmerCard(),
          const SizedBox(height: 12),
        ],
      ],
    );
  }
}

/// Error state for the schedule page.
class _ScheduleErrorState extends StatelessWidget {
  const _ScheduleErrorState({
    required this.error,
    required this.onRetry,
  });

  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: UnjynxErrorView(
        type: ErrorViewType.serverError,
        title: 'Could not load schedule',
        subtitle: error,
        actionLabel: 'Retry',
        onRetry: onRetry,
      ),
    );
  }
}

/// Empty state when no schedule suggestions are available.
class _ScheduleEmptyState extends StatelessWidget {
  const _ScheduleEmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: UnjynxEmptyState(
        type: EmptyStateType.noCalendarTasks,
        icon: Icons.calendar_today_rounded,
        title: 'No tasks to schedule',
        subtitle: 'Add some tasks first, then let AI schedule your day.',
      ),
    );
  }
}

/// State shown when the AI service is not yet configured (503).
class _AiComingSoonState extends StatelessWidget {
  const _AiComingSoonState();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: isLight
                    ? unjynx.gold.withValues(alpha: 0.12)
                    : unjynx.gold.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.schedule_rounded,
                size: 40,
                color: unjynx.gold,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'AI Scheduling Coming Soon',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                fontFamily: 'BebasNeue',
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'The AI service is being set up.\n'
              'Smart scheduling will be available soon!',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isLight
                    ? UnjynxLightColors.textTertiary
                    : UnjynxDarkColors.textTertiary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
