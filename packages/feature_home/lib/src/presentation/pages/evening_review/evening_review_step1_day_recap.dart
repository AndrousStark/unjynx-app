import 'dart:math' as math;

import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// Step 1: Day Recap -- completion ring + stats overview.
class DayRecapStep extends StatelessWidget {
  const DayRecapStep({super.key, required this.ref});

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
          // Moon icon -- evening vibes
          Icon(
            Icons.nightlight_round,
            size: 44,
            color: colorScheme.primary.withValues(alpha: 0.8),
          ),
          const SizedBox(height: 24),

          Text(
            'Your day in review',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          tasksAsync.when(
            data: (tasks) {
              final completed =
                  tasks.where((t) => t.isCompleted).length;
              final total = tasks.length;
              final progress =
                  total == 0 ? 0.0 : (completed / total).clamp(0.0, 1.0);

              final isLight = context.isLightMode;

              return Column(
                children: [
                  // Completion ring -- emerald arc on calmer violet tones
                  SizedBox(
                    width: 160,
                    height: 160,
                    child: CustomPaint(
                      painter: CompletionRingPainter(
                        progress: progress,
                        trackColor: isLight
                            ? const Color(0xFFE2D9F3)
                            : colorScheme.surfaceContainerHigh,
                        primaryColor: colorScheme.primary,
                        successColor: ux.success,
                      ),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '${(progress * 100).round()}%',
                              style: TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.w700,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'complete',
                              style: TextStyle(
                                fontSize: 13,
                                color: colorScheme.onSurfaceVariant
                                    .withValues(alpha: 0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Stats
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _StatColumn(
                          value: '$completed',
                          label: 'Done',
                          color: ux.success,
                        ),
                        Container(
                          width: 1,
                          height: 36,
                          color: colorScheme.surfaceContainerHigh,
                        ),
                        _StatColumn(
                          value: '${total - completed}',
                          label: 'Remaining',
                          color: colorScheme.onSurfaceVariant,
                        ),
                        Container(
                          width: 1,
                          height: 36,
                          color: colorScheme.surfaceContainerHigh,
                        ),
                        _StatColumn(
                          value: '$total',
                          label: 'Total',
                          color: colorScheme.primary,
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
            loading: () => CircularProgressIndicator(
              color: colorScheme.primary,
              strokeWidth: 2,
            ),
            error: (_, __) => Text(
              'Could not load task data.',
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
// Stat column for day recap
// ---------------------------------------------------------------------------

class _StatColumn extends StatelessWidget {
  const _StatColumn({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Completion ring painter
// ---------------------------------------------------------------------------

/// Custom painter for the circular completion ring in the day recap step.
class CompletionRingPainter extends CustomPainter {
  const CompletionRingPainter({
    required this.progress,
    required this.trackColor,
    required this.primaryColor,
    required this.successColor,
  });

  final double progress;
  final Color trackColor;
  final Color primaryColor;
  final Color successColor;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 8;
    const strokeWidth = 10.0;
    const startAngle = -math.pi / 2;

    // Background track
    final bgPaint = Paint()
      ..color = trackColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(center, radius, bgPaint);

    // Progress arc
    if (progress > 0) {
      final fgPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          startAngle: startAngle,
          endAngle: startAngle + 2 * math.pi,
          colors: [
            primaryColor,
            successColor,
          ],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(
          Rect.fromCircle(center: center, radius: radius),
        );

      final sweepAngle = 2 * math.pi * progress.clamp(0.0, 1.0);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        fgPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CompletionRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.primaryColor != primaryColor ||
        oldDelegate.successColor != successColor;
  }
}
