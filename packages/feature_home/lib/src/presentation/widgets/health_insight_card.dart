import 'package:flutter/material.dart';

/// Health insight card for the home dashboard.
///
/// Phase 10 feature: Shows health-productivity correlation data
/// from Apple Health / Google Health Connect.
///
/// Requires: `health` package (add when integrating).
/// For now, this is a UI-ready card with placeholder health data.
class HealthInsightCard extends StatelessWidget {
  const HealthInsightCard({
    this.sleepHours,
    this.stepsToday,
    this.restingHeartRate,
    this.productivityScore,
    super.key,
  });

  /// Hours of sleep last night (from HealthKit/Health Connect).
  final double? sleepHours;

  /// Steps walked today.
  final int? stepsToday;

  /// Resting heart rate (bpm).
  final int? restingHeartRate;

  /// AI-computed productivity correlation score (0-100).
  final int? productivityScore;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    // Don't show if no health data
    if (sleepHours == null && stepsToday == null && restingHeartRate == null) {
      return const SizedBox.shrink();
    }

    final sleepQuality = _sleepQuality(sleepHours);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: colorScheme.outlineVariant.withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Icon(
                Icons.favorite_rounded,
                size: 18,
                color: const Color(0xFFFF6B8A),
              ),
              const SizedBox(width: 8),
              Text(
                'Health & Productivity',
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              if (productivityScore != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: _scoreColor(
                      productivityScore!,
                    ).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$productivityScore%',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: _scoreColor(productivityScore!),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Metrics row
          Row(
            children: [
              if (sleepHours != null)
                Expanded(
                  child: _MetricTile(
                    icon: Icons.bedtime_rounded,
                    value: '${sleepHours!.toStringAsFixed(1)}h',
                    label: 'Sleep',
                    color: sleepQuality.color,
                    subtitle: sleepQuality.label,
                  ),
                ),
              if (stepsToday != null)
                Expanded(
                  child: _MetricTile(
                    icon: Icons.directions_walk_rounded,
                    value: _formatNumber(stepsToday!),
                    label: 'Steps',
                    color: stepsToday! >= 8000
                        ? const Color(0xFF22C55E)
                        : colorScheme.onSurfaceVariant,
                  ),
                ),
              if (restingHeartRate != null)
                Expanded(
                  child: _MetricTile(
                    icon: Icons.monitor_heart_rounded,
                    value: '${restingHeartRate!}',
                    label: 'BPM',
                    color: restingHeartRate! <= 70
                        ? const Color(0xFF22C55E)
                        : const Color(0xFFF59E0B),
                  ),
                ),
            ],
          ),

          // Insight text
          if (sleepHours != null && sleepHours! < 6) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.lightbulb_rounded,
                    size: 16,
                    color: Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Low sleep detected. Consider lighter tasks today and an earlier bedtime.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  ({String label, Color color}) _sleepQuality(double? hours) {
    if (hours == null) return (label: '', color: Colors.grey);
    if (hours >= 7.5) return (label: 'Great', color: const Color(0xFF22C55E));
    if (hours >= 6) return (label: 'OK', color: const Color(0xFFF59E0B));
    return (label: 'Low', color: const Color(0xFFEF4444));
  }

  Color _scoreColor(int score) {
    if (score >= 80) return const Color(0xFF22C55E);
    if (score >= 50) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  String _formatNumber(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _MetricTile extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final String? subtitle;

  const _MetricTile({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: theme.textTheme.labelSmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
            fontSize: 10,
          ),
        ),
        if (subtitle != null)
          Text(
            subtitle!,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
      ],
    );
  }
}
