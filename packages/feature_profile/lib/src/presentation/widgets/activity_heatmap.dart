import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// GitHub-style activity heatmap showing 52 weeks of task completion.
///
/// Accepts [activityData] as a list of integers (one per day, 52*7 = 364 days).
/// Each value represents the number of tasks completed that day (0-7+).
/// If [activityData] is null or empty, shows an empty-state message.
class ActivityHeatmap extends StatelessWidget {
  const ActivityHeatmap({this.activityData, super.key});

  /// Activity counts per day for the last 52 weeks (364 values).
  /// Index 0 = oldest day, last index = most recent day.
  /// If null or empty, an empty-state placeholder is shown.
  final List<int>? activityData;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final data = activityData;
    final hasData = data != null &&
        data.isNotEmpty &&
        data.any((v) => v > 0);

    if (!hasData) {
      return SizedBox(
        height: 90,
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.grid_on_rounded,
                size: 28,
                color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
              ),
              const SizedBox(height: 8),
              Text(
                'Complete tasks to see your activity',
                style: TextStyle(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Pad data to 52*7 if shorter.
    final paddedData = List<int>.filled(52 * 7, 0);
    final offset = paddedData.length - data!.length;
    for (int i = 0; i < data.length && i < paddedData.length; i++) {
      final targetIdx = offset + i;
      if (targetIdx >= 0) {
        paddedData[targetIdx] = data[i];
      }
    }

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
                  final value =
                      index < paddedData.length ? paddedData[index] : 0;
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
