import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Donut chart showing task distribution by category.
class CategoryBreakdownChart extends StatelessWidget {
  const CategoryBreakdownChart({
    required this.data,
    this.height = 220,
    super.key,
  });

  /// List of (categoryName, count) pairs.
  final List<(String, double)> data;
  final double height;

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

    final total = data.fold(0.0, (sum, d) => sum + d.$2);
    final colors = _chartColors(colorScheme, ux, isLight);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: SizedBox(
        height: height,
        child: Row(
          children: [
            // Donut chart
            Expanded(
              flex: 3,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 40,
                  sections: data.asMap().entries.map((e) {
                    final percent =
                        total > 0 ? (e.value.$2 / total * 100) : 0.0;
                    return PieChartSectionData(
                      value: e.value.$2,
                      color: colors[e.key % colors.length],
                      radius: 36,
                      title: '${percent.toStringAsFixed(0)}%',
                      titleStyle: textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Legend
            Expanded(
              flex: 2,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: data.asMap().entries.map((e) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: colors[e.key % colors.length],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            e.value.$1,
                            style: textTheme.bodySmall?.copyWith(
                              color: colorScheme.onSurface,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          e.value.$2.toInt().toString(),
                          style: textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Color> _chartColors(
    ColorScheme colorScheme,
    UnjynxCustomColors ux,
    bool isLight,
  ) {
    return [
      colorScheme.primary,
      ux.gold,
      ux.success,
      ux.info,
      colorScheme.tertiary,
      ux.warning,
      ux.instagram,
      ux.telegram,
    ];
  }
}
