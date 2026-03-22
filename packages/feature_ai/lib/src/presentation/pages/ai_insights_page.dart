import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/ai_insight.dart';
import '../providers/ai_providers.dart';

/// K3 — AI Insights Screen.
///
/// Weekly AI-generated report with sections:
/// - Summary
/// - Patterns (positive/negative/neutral)
/// - Energy forecast
/// - Suggestions
/// - Predictions
class AiInsightsPage extends ConsumerWidget {
  const AiInsightsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(aiInsightsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'AI Insights',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          UnjynxHaptics.pullToRefresh();
          ref.invalidate(aiInsightsProvider);
        },
        child: insightsAsync.when(
          loading: () => const _InsightsLoadingState(),
          error: (error, _) => _InsightsErrorState(
            error: error.toString(),
            onRetry: () => ref.invalidate(aiInsightsProvider),
          ),
          data: (report) => _InsightsContent(report: report),
        ),
      ),
    );
  }
}

/// Main content when insights data is available.
class _InsightsContent extends StatelessWidget {
  const _InsightsContent({required this.report});

  final AiInsightReport report;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Summary Section ──────────────────────────────────────
        _SectionHeader(
          icon: Icons.summarize_rounded,
          title: 'SUMMARY',
          color: unjynx.gold,
        ),
        const SizedBox(height: 8),
        UnjynxStatCard(
          child: Text(
            report.summary,
            style: theme.textTheme.bodyMedium?.copyWith(height: 1.6),
          ),
        ),
        const SizedBox(height: 24),

        // ── Patterns Section ─────────────────────────────────────
        if (report.patterns.isNotEmpty) ...[
          _SectionHeader(
            icon: Icons.pattern_rounded,
            title: 'PATTERNS',
            color: isLight
                ? UnjynxLightColors.brandViolet
                : UnjynxDarkColors.brandViolet,
          ),
          const SizedBox(height: 8),
          ...report.patterns.map((pattern) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _PatternCard(pattern: pattern, isLight: isLight),
              )),
          const SizedBox(height: 16),
        ],

        // ── Energy Section ───────────────────────────────────────
        if (report.energyForecast.isNotEmpty) ...[
          _SectionHeader(
            icon: Icons.bolt_rounded,
            title: 'ENERGY FORECAST',
            color: unjynx.gold,
          ),
          const SizedBox(height: 8),
          _EnergyChart(
            forecast: report.energyForecast,
            isLight: isLight,
            unjynx: unjynx,
          ),
          const SizedBox(height: 24),
        ],

        // ── Suggestions Section ──────────────────────────────────
        if (report.suggestions.isNotEmpty) ...[
          _SectionHeader(
            icon: Icons.lightbulb_outline_rounded,
            title: 'SUGGESTIONS',
            color: isLight
                ? UnjynxLightColors.info
                : UnjynxDarkColors.info,
          ),
          const SizedBox(height: 8),
          ...report.suggestions.map((suggestion) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _SuggestionCard(
                    suggestion: suggestion, isLight: isLight, unjynx: unjynx),
              )),
          const SizedBox(height: 16),
        ],

        // ── Prediction Section ───────────────────────────────────
        if (report.prediction.isNotEmpty) ...[
          _SectionHeader(
            icon: Icons.auto_graph_rounded,
            title: 'NEXT WEEK',
            color: isLight
                ? UnjynxLightColors.success
                : UnjynxDarkColors.success,
          ),
          const SizedBox(height: 8),
          UnjynxStatCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.trending_up_rounded,
                  size: 20,
                  color: isLight
                      ? UnjynxLightColors.success
                      : UnjynxDarkColors.success,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    report.prediction,
                    style:
                        theme.textTheme.bodyMedium?.copyWith(height: 1.6),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 32),
      ],
    );
  }
}

/// Section header with icon and label.
class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.icon,
    required this.title,
    required this.color,
  });

  final IconData icon;
  final String title;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;

    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.labelMedium?.copyWith(
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
            color: isLight
                ? UnjynxLightColors.textTertiary
                : UnjynxDarkColors.textTertiary,
          ),
        ),
      ],
    );
  }
}

/// Card for a single detected pattern.
class _PatternCard extends StatelessWidget {
  const _PatternCard({
    required this.pattern,
    required this.isLight,
  });

  final InsightPattern pattern;
  final bool isLight;

  IconData get _icon {
    switch (pattern.type) {
      case 'positive':
        return Icons.trending_up_rounded;
      case 'negative':
        return Icons.trending_down_rounded;
      default:
        return Icons.trending_flat_rounded;
    }
  }

  Color get _color {
    switch (pattern.type) {
      case 'positive':
        return isLight ? UnjynxLightColors.success : UnjynxDarkColors.success;
      case 'negative':
        return isLight ? UnjynxLightColors.error : UnjynxDarkColors.error;
      default:
        return isLight ? UnjynxLightColors.info : UnjynxDarkColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return UnjynxSolidCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: _color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(_icon, size: 18, color: _color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pattern.description,
                  style: theme.textTheme.bodyMedium?.copyWith(height: 1.4),
                ),
                const SizedBox(height: 4),
                Text(
                  '${(pattern.confidence * 100).round()}% confidence',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isLight
                        ? UnjynxLightColors.textTertiary
                        : UnjynxDarkColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Simplified energy bar chart using built-in Flutter widgets.
class _EnergyChart extends StatelessWidget {
  const _EnergyChart({
    required this.forecast,
    required this.isLight,
    required this.unjynx,
  });

  final List<EnergyHour> forecast;
  final bool isLight;
  final UnjynxCustomColors unjynx;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Show only daytime hours (6 AM - 10 PM)
    final daytimeHours =
        forecast.where((h) => h.hour >= 6 && h.hour <= 22).toList();

    if (daytimeHours.isEmpty) {
      return UnjynxStatCard(
        child: Text(
          'No energy data available yet.',
          style: theme.textTheme.bodyMedium,
        ),
      );
    }

    return UnjynxStatCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: daytimeHours.map((hour) {
                final normalizedHeight = (hour.energy / 5.0).clamp(0.0, 1.0);
                final isPeak = hour.energy >= 4.0;
                final isLow = hour.energy <= 2.0;

                Color barColor;
                if (isPeak) {
                  barColor = unjynx.gold;
                } else if (isLow) {
                  barColor = isLight
                      ? UnjynxLightColors.error.withValues(alpha: 0.6)
                      : UnjynxDarkColors.error.withValues(alpha: 0.6);
                } else {
                  barColor = isLight
                      ? UnjynxLightColors.brandViolet.withValues(alpha: 0.5)
                      : UnjynxDarkColors.brandViolet.withValues(alpha: 0.5);
                }

                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 1),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Flexible(
                          child: FractionallySizedBox(
                            heightFactor: normalizedHeight,
                            child: Container(
                              decoration: BoxDecoration(
                                color: barColor,
                                borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(3),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),
          // Hour labels (show every 3rd)
          Row(
            children: daytimeHours.map((hour) {
              final showLabel = hour.hour % 3 == 0;
              return Expanded(
                child: showLabel
                    ? Text(
                        '${hour.hour}',
                        textAlign: TextAlign.center,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: isLight
                              ? UnjynxLightColors.textDisabled
                              : UnjynxDarkColors.textDisabled,
                          fontSize: 9,
                        ),
                      )
                    : const SizedBox.shrink(),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Card for a single AI suggestion.
class _SuggestionCard extends StatelessWidget {
  const _SuggestionCard({
    required this.suggestion,
    required this.isLight,
    required this.unjynx,
  });

  final InsightSuggestion suggestion;
  final bool isLight;
  final UnjynxCustomColors unjynx;

  Color get _impactColor {
    switch (suggestion.impact) {
      case 'high':
        return unjynx.gold;
      case 'medium':
        return isLight ? UnjynxLightColors.info : UnjynxDarkColors.info;
      default:
        return isLight
            ? UnjynxLightColors.textTertiary
            : UnjynxDarkColors.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return UnjynxSolidCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  suggestion.title,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: _impactColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  suggestion.impact.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: _impactColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 10,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            suggestion.description,
            style: theme.textTheme.bodySmall?.copyWith(
              color: isLight
                  ? UnjynxLightColors.textTertiary
                  : UnjynxDarkColors.textTertiary,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// Shimmer loading state for insights.
class _InsightsLoadingState extends StatelessWidget {
  const _InsightsLoadingState();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        UnjynxShimmerLine(width: 120),
        SizedBox(height: 8),
        UnjynxShimmerBox(height: 80, borderRadius: 16),
        SizedBox(height: 24),
        UnjynxShimmerLine(width: 100),
        SizedBox(height: 8),
        UnjynxShimmerCard(),
        SizedBox(height: 8),
        UnjynxShimmerCard(),
        SizedBox(height: 24),
        UnjynxShimmerLine(width: 140),
        SizedBox(height: 8),
        UnjynxShimmerBox(height: 160, borderRadius: 16),
        SizedBox(height: 24),
        UnjynxShimmerLine(width: 110),
        SizedBox(height: 8),
        UnjynxShimmerCard(),
        SizedBox(height: 8),
        UnjynxShimmerCard(),
      ],
    );
  }
}

/// Error state for insights.
class _InsightsErrorState extends StatelessWidget {
  const _InsightsErrorState({
    required this.error,
    required this.onRetry,
  });

  final String error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: UnjynxErrorView(
        type: ErrorViewType.serverError,
        title: 'Could not load insights',
        subtitle: error,
        actionLabel: 'Retry',
        onRetry: onRetry,
      ),
    );
  }
}
