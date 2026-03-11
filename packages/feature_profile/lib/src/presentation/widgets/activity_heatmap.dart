import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// GitHub-style activity heatmap showing 52 weeks of task completion.
class ActivityHeatmap extends StatelessWidget {
  const ActivityHeatmap({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    // Generate mock data for 52 weeks x 7 days.
    final random = math.Random(42); // Deterministic for consistency.
    final data = List.generate(
      52 * 7,
      (i) => random.nextDouble() < 0.6 ? random.nextInt(8) : 0,
    );

    return SizedBox(
      height: 90,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: List.generate(52, (weekIdx) {
            return Padding(
              padding: const EdgeInsets.only(right: 2),
              child: Column(
                children: List.generate(7, (dayIdx) {
                  final index = weekIdx * 7 + dayIdx;
                  final value = index < data.length ? data[index] : 0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 2),
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: _cellColor(
                          value,
                          colorScheme,
                          ux,
                          isLight,
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            );
          }),
        ),
      ),
    );
  }

  Color _cellColor(
    int value,
    ColorScheme colorScheme,
    UnjynxCustomColors ux,
    bool isLight,
  ) {
    if (value == 0) {
      return isLight
          ? const Color(0xFFF0EAF5)
          : colorScheme.surfaceContainerHighest;
    }

    // 5-level color scale per spec
    final level = ((value / 7) * 4).ceil().clamp(1, 4);
    if (!isLight) {
      // Dark mode: lerp from subtle primary to full primary
      final intensity = (value / 7).clamp(0.0, 1.0);
      return Color.lerp(
        colorScheme.primary.withValues(alpha: 0.25),
        colorScheme.primary,
        intensity,
      )!;
    }

    switch (level) {
      case 1:
        return const Color(0xFFD1C4E9);
      case 2:
        return const Color(0xFF9333EA).withValues(alpha: 0.4);
      case 3:
        return colorScheme.primary;
      case 4:
        return ux.gold;
      default:
        return const Color(0xFFF0EAF5);
    }
  }
}
