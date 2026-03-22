import 'dart:math' as math;

import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Apple Watch-inspired concentric progress rings for tasks, focus, and habits.
///
/// Three concentric arcs are painted via [_ProgressRingsPainter]:
/// - **Outer (gold)**: Task completion progress
/// - **Middle (vivid purple)**: Focus time progress
/// - **Inner (success green)**: Habit completion progress
///
/// Center text shows the overall percentage with an encouraging word.
/// Below the rings, three stat rows display the numeric breakdown.
class ProgressRings extends ConsumerWidget {
  const ProgressRings({super.key, this.navigateOnTap = true});

  /// Whether tapping the rings navigates to the Progress Hub.
  ///
  /// Set to `false` when the rings are already displayed inside the
  /// Progress Hub to avoid an infinite navigation loop.
  final bool navigateOnTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ringsAsync = ref.watch(homeProgressRingsProvider);

    final container = Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: context.unjynxShadow(UnjynxElevation.sm),
      ),
      child: ringsAsync.when(
        data: (data) => _RingsContent(data: data),
        loading: () => const _RingsShimmer(),
        error: (error, _) => _ErrorState(message: '$error'),
      ),
    );

    if (!navigateOnTap) return container;

    return GestureDetector(
      onTap: () => GoRouter.of(context).push('/progress'),
      child: container,
    );
  }
}

// ---------------------------------------------------------------------------
// Rings content (data loaded)
// ---------------------------------------------------------------------------

class _RingsContent extends StatelessWidget {
  const _RingsContent({required this.data});

  final ProgressRingsData data;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final percentage = (data.overallProgress * 100).round();

    return Semantics(
      label: progressRingsSemanticLabel(
        percentage: percentage,
        tasksCompleted: data.tasksCompleted,
        tasksTotal: data.tasksTotal,
        focusMinutes: data.focusMinutes,
        focusGoalMinutes: data.focusGoalMinutes,
        habitsCompleted: data.habitsCompleted,
        habitsTotal: data.habitsTotal,
      ),
      child: Column(
      children: [
        // --- Concentric rings with center text + draw animation ---
        SizedBox(
          height: 180,
          width: 180,
          child: TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 800),
            curve: Curves.easeOutCubic,
            builder: (context, animValue, child) {
              return CustomPaint(
                painter: _ProgressRingsPainter(
                  taskProgress: data.taskProgress * animValue,
                  focusProgress: data.focusProgress * animValue,
                  habitProgress: data.habitProgress * animValue,
                  goldColor: ux.gold,
                  primaryColor: colorScheme.primary,
                  successColor: ux.success,
                  isLight: isLight,
                  trackColor: isLight
                      ? const Color(0xFF6B21A8).withValues(alpha: 0.06)
                      : colorScheme.surfaceContainerHigh,
                ),
                child: child,
              );
            },
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _encouragementText(percentage),
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        const SizedBox(height: 20),

        // --- Stat rows ---
        _StatRow(
          icon: Icons.check_circle_outline,
          iconColor: ux.gold,
          label: 'Tasks',
          value: '${data.tasksCompleted} of ${data.tasksTotal}',
        ),
        const SizedBox(height: 10),
        _StatRow(
          icon: Icons.timer_outlined,
          iconColor: colorScheme.primary,
          label: 'Focus',
          value: '${data.focusMinutes} min / ${data.focusGoalMinutes} min',
        ),
        const SizedBox(height: 10),
        _StatRow(
          icon: Icons.loop_rounded,
          iconColor: ux.success,
          label: 'Habits',
          value: '${data.habitsCompleted} of ${data.habitsTotal}',
        ),
      ],
    ),
    );
  }

  /// Returns an encouraging word based on overall percentage.
  static String _encouragementText(int percentage) {
    if (percentage >= 100) return 'Complete!';
    if (percentage >= 75) return 'Almost there!';
    if (percentage >= 50) return 'Halfway!';
    if (percentage >= 25) return 'Good start!';
    if (percentage > 0) return 'Keep going!';
    return "Let's begin!";
  }
}

// ---------------------------------------------------------------------------
// Stat row
// ---------------------------------------------------------------------------

class _StatRow extends StatelessWidget {
  const _StatRow({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(
            color: colorScheme.onSurfaceVariant,
            fontSize: 14,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            color: colorScheme.onSurface,
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Loading shimmer placeholder
// ---------------------------------------------------------------------------

class _RingsShimmer extends StatelessWidget {
  const _RingsShimmer();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final shimmerAlpha = isLight ? 0.5 : 0.4;

    return Column(
      children: [
        Container(
          width: 180,
          height: 180,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: colorScheme.surfaceContainerHigh
                .withValues(alpha: shimmerAlpha),
          ),
        ),
        const SizedBox(height: 20),
        for (var i = 0; i < 3; i++) ...[
          if (i > 0) const SizedBox(height: 10),
          Container(
            height: 20,
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh
                  .withValues(alpha: shimmerAlpha),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Text(
          'Failed to load progress: $message',
          style: TextStyle(color: colorScheme.error, fontSize: 13),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// CustomPainter - three concentric progress arcs
// ---------------------------------------------------------------------------

class _ProgressRingsPainter extends CustomPainter {
  _ProgressRingsPainter({
    required this.taskProgress,
    required this.focusProgress,
    required this.habitProgress,
    required this.goldColor,
    required this.primaryColor,
    required this.successColor,
    required this.isLight,
    required this.trackColor,
  });

  final double taskProgress;
  final double focusProgress;
  final double habitProgress;
  final Color goldColor;
  final Color primaryColor;
  final Color successColor;
  final bool isLight;
  final Color trackColor;

  /// Width of each ring stroke.
  static const double _ringWidth = 12;

  /// Gap between concentric rings.
  static const double _ringGap = 6;

  /// Start at 12 o'clock position.
  static const double _startAngle = -math.pi / 2;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // Radii: outer -> inner
    final outerRadius = (size.width / 2) - (_ringWidth / 2);
    final middleRadius = outerRadius - _ringWidth - _ringGap;
    final innerRadius = middleRadius - _ringWidth - _ringGap;

    // Outer ring: Tasks (gold)
    _drawRing(
      canvas: canvas,
      center: center,
      radius: outerRadius,
      progress: taskProgress,
      color: goldColor,
    );

    // Middle ring: Focus (vivid purple)
    _drawRing(
      canvas: canvas,
      center: center,
      radius: middleRadius,
      progress: focusProgress,
      color: primaryColor,
    );

    // Inner ring: Habits (success green)
    _drawRing(
      canvas: canvas,
      center: center,
      radius: innerRadius,
      progress: habitProgress,
      color: successColor,
    );
  }

  void _drawRing({
    required Canvas canvas,
    required Offset center,
    required double radius,
    required double progress,
    required Color color,
  }) {
    final rect = Rect.fromCircle(center: center, radius: radius);

    // Background track
    // Light: lavender track with deeper stroke tint; Dark: dark track
    final bgPaint = Paint()
      ..color = isLight
          ? trackColor
          : color.withValues(alpha: 0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = _ringWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect, 0, 2 * math.pi, false, bgPaint);

    // Foreground arc (progress)
    if (progress > 0) {
      final fgPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = _ringWidth
        ..strokeCap = StrokeCap.round;
      final sweepAngle = 2 * math.pi * progress.clamp(0.0, 1.0);
      canvas.drawArc(rect, _startAngle, sweepAngle, false, fgPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _ProgressRingsPainter oldDelegate) {
    return oldDelegate.taskProgress != taskProgress ||
        oldDelegate.focusProgress != focusProgress ||
        oldDelegate.habitProgress != habitProgress ||
        oldDelegate.goldColor != goldColor ||
        oldDelegate.primaryColor != primaryColor ||
        oldDelegate.successColor != successColor ||
        oldDelegate.isLight != isLight ||
        oldDelegate.trackColor != trackColor;
  }
}
