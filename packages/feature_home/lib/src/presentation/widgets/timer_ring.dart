import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A circular progress ring that visualises remaining time.
///
/// [progress] runs from `1.0` (full) to `0.0` (empty). The foreground arc
/// decrements counter-clockwise from the 12-o'clock position.
///
/// Place timer text (or any widget) in the [child] slot -- it renders at
/// the centre of the ring.
class TimerRing extends StatelessWidget {
  const TimerRing({
    required this.progress,
    required this.color,
    this.size = 240,
    this.strokeWidth = 10,
    this.child,
    super.key,
  });

  /// 0.0 (empty) to 1.0 (full circle).
  final double progress;

  /// Foreground arc colour. Background track adapts to light/dark.
  final Color color;

  /// Outer diameter of the ring.
  final double size;

  /// Thickness of the arc stroke.
  final double strokeWidth;

  /// Widget rendered at the centre of the ring (e.g. timer text).
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _TimerRingPainter(
              progress: progress.clamp(0.0, 1.0),
              color: color,
              strokeWidth: strokeWidth,
              isLight: isLight,
            ),
          ),
          if (child != null) child!,
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// CustomPainter -- draws background + foreground arcs
// ---------------------------------------------------------------------------

class _TimerRingPainter extends CustomPainter {
  _TimerRingPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
    required this.isLight,
  });

  final double progress;
  final Color color;
  final double strokeWidth;
  final bool isLight;

  @override
  void paint(Canvas canvas, Size size) {
    final centre = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: centre, radius: radius);

    // Background ring: light uses higher opacity tint,
    // dark uses subtle opacity.
    final bgPaint = Paint()
      ..color = color.withValues(alpha: isLight ? 0.12 : 0.15)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;
    canvas.drawCircle(centre, radius, bgPaint);

    // Foreground arc.
    if (progress > 0) {
      final fgPaint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      // Start at 12-o'clock (-pi/2) and sweep clockwise.
      const startAngle = -math.pi / 2;
      final sweepAngle = 2 * math.pi * progress;

      canvas.drawArc(rect, startAngle, sweepAngle, false, fgPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _TimerRingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.isLight != isLight;
  }
}
