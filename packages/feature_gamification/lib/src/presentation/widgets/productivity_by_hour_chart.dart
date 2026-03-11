import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Heatmap showing productivity intensity by hour and day.
class ProductivityByHourChart extends StatelessWidget {
  const ProductivityByHourChart({
    required this.data,
    this.height = 200,
    super.key,
  });

  /// List of (hour 0-23, dayOfWeek 0-6, intensity 0.0-1.0).
  final List<(int, int, double)> data;
  final double height;

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    if (data.isEmpty) {
      return SizedBox(
        height: height,
        child: Center(
          child: Text(
            'No data yet',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
      );
    }

    // Build a lookup map for quick cell access.
    final grid = <(int, int), double>{};
    for (final entry in data) {
      grid[(entry.$1, entry.$2)] = entry.$3;
    }

    return SizedBox(
      height: height,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day labels
          Column(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: _dayLabels
                .map((d) => SizedBox(
                      height: height / 7,
                      child: Center(
                        child: Text(
                          d,
                          style: textTheme.bodySmall?.copyWith(
                            fontSize: 10,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(width: 4),

          // Grid
          Expanded(
            child: GridView.builder(
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 24,
                childAspectRatio: 1,
                crossAxisSpacing: 1,
                mainAxisSpacing: 1,
              ),
              itemCount: 24 * 7,
              itemBuilder: (context, index) {
                final hour = index % 24;
                final day = index ~/ 24;
                final intensity = grid[(hour, day)] ?? 0.0;

                return Container(
                  decoration: BoxDecoration(
                    color: _cellColor(intensity, colorScheme, ux, isLight),
                    borderRadius: BorderRadius.circular(2),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// 5-level discrete brand scale for heatmap cells.
  Color _cellColor(
    double intensity,
    ColorScheme colorScheme,
    UnjynxCustomColors ux,
    bool isLight,
  ) {
    if (intensity < 0.01) {
      // Level 0: no tasks
      return isLight
          ? const Color(0xFFF0EAF5)
          : colorScheme.surfaceContainerHighest;
    }
    if (intensity < 0.25) {
      // Level 1: low
      return isLight
          ? const Color(0xFFD1C4E9)
          : const Color(0xFFD1C4E9).withValues(alpha: 0.3);
    }
    if (intensity < 0.5) {
      // Level 2: medium
      return isLight
          ? const Color(0xFF9333EA).withValues(alpha: 0.4)
          : const Color(0xFF9333EA).withValues(alpha: 0.5);
    }
    if (intensity < 0.75) {
      // Level 3: high
      return colorScheme.primary;
    }
    // Level 4: peak
    return ux.gold;
  }
}
