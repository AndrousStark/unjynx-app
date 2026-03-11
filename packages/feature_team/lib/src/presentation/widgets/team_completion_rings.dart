import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Aggregate team completion rings (3 concentric rings).
///
/// - Outer: Overall completion rate
/// - Middle: On-time rate
/// - Inner: Active members ratio
///
/// Animated from 0 to full value over 800ms with easeOutCubic.
class TeamCompletionRings extends StatelessWidget {
  const TeamCompletionRings({
    required this.completionRate,
    required this.onTimeRate,
    required this.activeMemberRate,
    this.size = 120,
    super.key,
  });

  final double completionRate;
  final double onTimeRate;
  final double activeMemberRate;
  final double size;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return SizedBox(
      width: size,
      height: size,
      child: TweenAnimationBuilder<double>(
        tween: Tween<double>(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 800),
        curve: Curves.easeOutCubic,
        builder: (context, animValue, child) {
          return CustomPaint(
            painter: _RingsPainter(
              completionRate: completionRate * animValue,
              onTimeRate: onTimeRate * animValue,
              activeMemberRate: activeMemberRate * animValue,
              completionColor: ux.success,
              onTimeColor: colorScheme.primary,
              activeColor: ux.gold,
              trackColor: colorScheme.surfaceContainerHigh.withValues(
                alpha: isLight ? 0.6 : 0.3,
              ),
              strokeWidth: size * 0.08,
            ),
            child: child,
          );
        },
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${(completionRate * 100).round()}%',
                style: textTheme.displaySmall?.copyWith(
                  fontSize: size * 0.18,
                  color: colorScheme.onSurface,
                ),
              ),
              Text(
                'Team',
                style: textTheme.bodySmall?.copyWith(
                  fontSize: size * 0.09,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RingsPainter extends CustomPainter {
  _RingsPainter({
    required this.completionRate,
    required this.onTimeRate,
    required this.activeMemberRate,
    required this.completionColor,
    required this.onTimeColor,
    required this.activeColor,
    required this.trackColor,
    required this.strokeWidth,
  });

  final double completionRate;
  final double onTimeRate;
  final double activeMemberRate;
  final Color completionColor;
  final Color onTimeColor;
  final Color activeColor;
  final Color trackColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final gap = strokeWidth * 1.4;

    final outerRadius = size.width / 2 - strokeWidth / 2;
    final middleRadius = outerRadius - gap;
    final innerRadius = middleRadius - gap;

    _drawRing(canvas, center, outerRadius, completionRate, completionColor);
    _drawRing(canvas, center, middleRadius, onTimeRate, onTimeColor);
    _drawRing(canvas, center, innerRadius, activeMemberRate, activeColor);
  }

  void _drawRing(
    Canvas canvas,
    Offset center,
    double radius,
    double fraction,
    Color color,
  ) {
    // Track
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..color = trackColor,
    );

    // Progress arc
    if (fraction > 0) {
      final sweepAngle = 2 * math.pi * fraction.clamp(0.0, 1.0);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        sweepAngle,
        false,
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round
          ..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(_RingsPainter oldDelegate) {
    return completionRate != oldDelegate.completionRate ||
        onTimeRate != oldDelegate.onTimeRate ||
        activeMemberRate != oldDelegate.activeMemberRate;
  }
}
