import 'dart:async';

import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/breathing_text.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

// Ghost Mode is always dark regardless of system brightness.
// We use UnjynxTheme.dark to force dark tokens throughout.

/// Ghost Mode -- the anti-overwhelm, ultra-minimal task screen.
///
/// Shows a single task at a time in a calming dark gradient. The user
/// taps a large gold circle to complete the task, which triggers a gentle
/// shimmer animation before the next task slides in from below.
///
/// When every task is done, a zen "All caught up" screen appears with a
/// breathing circle.
class GhostModePage extends ConsumerStatefulWidget {
  const GhostModePage({super.key});

  @override
  ConsumerState<GhostModePage> createState() => _GhostModePageState();
}

class _GhostModePageState extends ConsumerState<GhostModePage>
    with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _isCompleting = false;

  // Animation for task card entrance/exit.
  late AnimationController _slideController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  // Animation for the gold shimmer on completion.
  late AnimationController _shimmerController;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();

    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
    );

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _slideController, curve: Curves.easeOut),
    );

    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _shimmerAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut),
    );

    // Haptic feedback on Ghost Mode activation.
    HapticFeedback.heavyImpact();

    // Animate in the first task.
    _slideController.forward();
  }

  @override
  void dispose() {
    _slideController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }

  Future<void> _completeTask(List<HomeTask> tasks) async {
    if (_isCompleting || _currentIndex >= tasks.length) return;

    setState(() => _isCompleting = true);

    // Haptic feedback on task completion.
    HapticFeedback.lightImpact();

    // Play shimmer.
    await _shimmerController.forward();

    // Slide out current task.
    await _slideController.reverse();

    // Move to next task.
    _shimmerController.reset();
    setState(() {
      _currentIndex++;
      _isCompleting = false;
    });

    // If there are more tasks, slide in the next one.
    if (_currentIndex < tasks.length) {
      unawaited(_slideController.forward());
    }
  }

  void _exitGhostMode() {
    HapticFeedback.mediumImpact();
    ref.read(ghostModeActiveProvider.notifier).set(false);
    if (context.mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final tasksAsync = ref.watch(ghostModeTasksProvider);

    // Ghost Mode is always dark regardless of system brightness.
    // Wrap in Theme override so all descendant widgets get dark tokens.
    return Theme(
      data: UnjynxTheme.dark,
      child: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) {
            _exitGhostMode();
          }
        },
        child: Scaffold(
          body: Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF2D1B69), // deepPurple
                  Color(0xFF0F0A1A), // midnight
                ],
              ),
            ),
            child: SafeArea(
              child: tasksAsync.when(
                data: _buildContent,
                loading: _buildLoading,
                error: (error, _) => _buildError(error),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(List<HomeTask> tasks) {
    // Use dark color scheme directly -- Ghost Mode is always dark.
    final colorScheme = UnjynxTheme.dark.colorScheme;

    // Filter to incomplete tasks only.
    final incompleteTasks =
        tasks.where((t) => !t.isCompleted).toList(growable: false);

    if (incompleteTasks.isEmpty || _currentIndex >= incompleteTasks.length) {
      return _ZenScreen(onExit: _exitGhostMode);
    }

    final task = incompleteTasks[_currentIndex];
    final remaining = incompleteTasks.length - _currentIndex;

    return Stack(
      children: [
        // Exit button -- top right, muted.
        Positioned(
          top: 16,
          right: 20,
          child: GestureDetector(
            onTap: _exitGhostMode,
            child: Text(
              'Exit',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
              ),
            ),
          ),
        ),

        // Progress indicator -- top left, very subtle.
        Positioned(
          top: 20,
          left: 20,
          child: Text(
            '${_currentIndex + 1} / ${incompleteTasks.length}',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
              letterSpacing: 1,
            ),
          ),
        ),

        // Main content -- centered.
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Task card with slide animation.
                SlideTransition(
                  position: _slideAnimation,
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: _TaskCard(
                      task: task,
                      remaining: remaining,
                    ),
                  ),
                ),

                const SizedBox(height: 48),

                // Breathing motivation text.
                BreathingText(
                  text: 'This is all that matters right now.',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w300,
                    color: colorScheme.onSurfaceVariant,
                    letterSpacing: 0.5,
                    height: 1.6,
                  ),
                ),

                const SizedBox(height: 56),

                // Completion button.
                _CompletionButton(
                  isCompleting: _isCompleting,
                  shimmerAnimation: _shimmerAnimation,
                  onTap: () => _completeTask(incompleteTasks),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            UnjynxShimmerBox(
              height: 160,
              width: double.infinity,
              borderRadius: 16,
            ),
            SizedBox(height: 48),
            UnjynxShimmerLine(width: 240, height: 16),
            SizedBox(height: 56),
            UnjynxShimmerCircle(diameter: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildError(Object error) {
    final colorScheme = UnjynxTheme.dark.colorScheme;
    const ux = UnjynxCustomColors.dark;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load tasks',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: _exitGhostMode,
              child: Text(
                'Go Back',
                style: TextStyle(color: ux.gold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Task Card -- the single focused task display
// ---------------------------------------------------------------------------

class _TaskCard extends StatelessWidget {
  const _TaskCard({
    required this.task,
    required this.remaining,
  });

  final HomeTask task;
  final int remaining;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Priority indicator (small dot).
        if (task.priority != HomeTaskPriority.none)
          Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: unjynxPriorityColor(context, task.priority.name),
              ),
            ),
          ),

        // Task title -- large, centered, breathing room.
        Text(
          task.title,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurface,
            height: 1.4,
            letterSpacing: -0.5,
          ),
          textAlign: TextAlign.center,
          maxLines: 4,
          overflow: TextOverflow.ellipsis,
        ),

        // Due date if present.
        if (task.dueDate != null) ...[
          const SizedBox(height: 16),
          _DueDateChip(dueDate: task.dueDate!),
        ],

        // Remaining count.
        if (remaining > 1) ...[
          const SizedBox(height: 24),
          Text(
            '${remaining - 1} more after this',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
              letterSpacing: 0.3,
            ),
          ),
        ],
      ],
    );
  }

}

// ---------------------------------------------------------------------------
// Due Date Chip
// ---------------------------------------------------------------------------

class _DueDateChip extends StatelessWidget {
  const _DueDateChip({required this.dueDate});

  final DateTime dueDate;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final isOverdue = dueDate.isBefore(todayStart);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: (isOverdue ? colorScheme.error : colorScheme.surfaceContainerHigh)
            .withValues(alpha: 0.3),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isOverdue
                ? Icons.warning_amber_rounded
                : Icons.access_time_rounded,
            size: 14,
            color: isOverdue ? colorScheme.error : colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 6),
          Text(
            _formatDueDate(dueDate, isOverdue: isOverdue),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w400,
              color:
                  isOverdue ? colorScheme.error : colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }

  static String _formatDueDate(DateTime dt, {required bool isOverdue}) {
    if (isOverdue) return 'Overdue';

    final hour = dt.hour;
    final minute = dt.minute;
    if (hour == 0 && minute == 0) return 'Today';

    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    final displayMinute = minute.toString().padLeft(2, '0');
    return 'Today at $displayHour:$displayMinute $period';
  }
}

// ---------------------------------------------------------------------------
// Completion Button -- large gold circle with check icon
// ---------------------------------------------------------------------------

class _CompletionButton extends StatelessWidget {
  const _CompletionButton({
    required this.isCompleting,
    required this.shimmerAnimation,
    required this.onTap,
  });

  final bool isCompleting;
  final Animation<double> shimmerAnimation;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;

    return GestureDetector(
      onTap: isCompleting ? null : onTap,
      child: AnimatedBuilder(
        animation: shimmerAnimation,
        builder: (context, child) {
          final shimmerValue = shimmerAnimation.value;
          final glowRadius = shimmerValue * 30;
          final glowOpacity = (1.0 - shimmerValue) * 0.6;

          return Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: ux.gold.withValues(
                  alpha: 0.6 + (shimmerValue * 0.4),
                ),
                width: 2.5,
              ),
              boxShadow: [
                if (shimmerValue > 0)
                  BoxShadow(
                    color: ux.gold.withValues(alpha: glowOpacity),
                    blurRadius: glowRadius,
                    spreadRadius: glowRadius * 0.3,
                  ),
              ],
            ),
            child: Center(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: isCompleting
                    ? Icon(
                        Icons.check_rounded,
                        key: const ValueKey('check'),
                        size: 36,
                        color: ux.gold.withValues(
                          alpha: 0.8 + (shimmerValue * 0.2),
                        ),
                      )
                    : Icon(
                        Icons.check_rounded,
                        key: const ValueKey('idle'),
                        size: 32,
                        color: ux.gold.withValues(alpha: 0.5),
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
// Zen Screen -- shown when all tasks are complete
// ---------------------------------------------------------------------------

class _ZenScreen extends StatelessWidget {
  const _ZenScreen({required this.onExit});

  final VoidCallback onExit;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Stack(
      children: [
        // Exit button.
        Positioned(
          top: 16,
          right: 20,
          child: GestureDetector(
            onTap: onExit,
            child: Text(
              'Done',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: ux.gold.withValues(alpha: 0.7),
              ),
            ),
          ),
        ),

        // Centered zen content.
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Breathing circle.
              const _BreathingCircle(),

              const SizedBox(height: 48),

              Text(
                'All caught up',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  color: colorScheme.onSurface,
                  letterSpacing: -0.5,
                ),
              ),

              const SizedBox(height: 16),

              BreathingText(
                text: 'Nothing left to do.\nYou earned this stillness.',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w300,
                  color: colorScheme.onSurfaceVariant,
                  height: 1.8,
                  letterSpacing: 0.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Breathing Circle -- gentle pulsing ring for the zen screen
// ---------------------------------------------------------------------------

class _BreathingCircle extends StatefulWidget {
  const _BreathingCircle();

  @override
  State<_BreathingCircle> createState() => _BreathingCircleState();
}

class _BreathingCircleState extends State<_BreathingCircle>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);

    final curved = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1).animate(curved);
    _opacityAnimation = Tween<double>(begin: 0.3, end: 0.7).animate(curved);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _opacityAnimation.value,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: ux.gold.withValues(alpha: 0.4),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: ux.gold
                        .withValues(alpha: _opacityAnimation.value * 0.15),
                    blurRadius: 40,
                    spreadRadius: 10,
                  ),
                ],
              ),
              child: Center(
                child: Icon(
                  Icons.spa_rounded,
                  size: 40,
                  color: ux.gold
                      .withValues(alpha: _opacityAnimation.value),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
