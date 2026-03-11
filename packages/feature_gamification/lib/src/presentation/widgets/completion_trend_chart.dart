import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Line chart showing completion trends over 30/90/365 days.
class CompletionTrendChart extends StatelessWidget {
  const CompletionTrendChart({
    required this.dataPoints,
    this.height = 200,
    super.key,
  });

  /// List of (dayOffset, completedCount) pairs.
  final List<(int, double)> dataPoints;
  final double height;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    if (dataPoints.isEmpty) {
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

    final spots = dataPoints
        .map((p) => FlSpot(p.$1.toDouble(), p.$2))
        .toList();

    return SizedBox(
      height: height,
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: _interval(spots),
            getDrawingHorizontalLine: (value) => FlLine(
              color: isLight
                  ? const Color(0xFFEDE5F7)
                  : colorScheme.outlineVariant.withValues(alpha: 0.3),
              strokeWidth: 1,
            ),
          ),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                getTitlesWidget: (value, meta) => Text(
                  value.toInt().toString(),
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 10,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
            bottomTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.3,
              color: colorScheme.primary,
              barWidth: 2,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    colorScheme.primary
                        .withValues(alpha: isLight ? 0.125 : 0.10),
                    colorScheme.primary.withValues(alpha: 0.02),
                  ],
                ),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => isLight
                  ? colorScheme.surface
                  : colorScheme.surfaceContainerHighest,
            ),
          ),
        ),
      ),
    );
  }

  double _interval(List<FlSpot> spots) {
    if (spots.isEmpty) return 5;
    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    if (maxY <= 10) return 2;
    if (maxY <= 50) return 10;
    return 20;
  }
}
