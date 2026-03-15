import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_report.dart';
import '../providers/team_providers.dart';
import '../widgets/report_charts.dart';

/// N4 -- Team Reports page.
///
/// Period selector, productivity chart, contribution bar chart,
/// project completion rates, overdue by assignee, and export buttons.
class TeamReportsPage extends ConsumerWidget {
  const TeamReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final period = ref.watch(reportPeriodProvider);
    final reportAsync = ref.watch(teamReportProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Reports'),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_rounded),
            tooltip: 'Export PDF',
            onPressed: () {
              HapticFeedback.lightImpact();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('PDF export coming soon')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.table_chart_rounded),
            tooltip: 'Export CSV',
            onPressed: () {
              HapticFeedback.lightImpact();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('CSV export coming soon')),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: Theme.of(context).colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(teamReportProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Period selector
          SegmentedButton<ReportPeriod>(
            segments: ReportPeriod.values
                .map(
                  (p) => ButtonSegment(
                    value: p,
                    label: Text(p.displayName),
                  ),
                )
                .toList(),
            selected: {period},
            onSelectionChanged: (values) {
              HapticFeedback.selectionClick();
              ref.read(reportPeriodProvider.notifier).set(values.first);
            },
          ),
          const SizedBox(height: 20),

          reportAsync.when(
            data: (report) => Column(
              children: [
                _StatsRow(report: report),
                const SizedBox(height: 16),
                ChartCard(
                  title: 'TEAM PRODUCTIVITY',
                  child: ProductivityChart(
                    completionRate: report.completionRate,
                  ),
                ),
                const SizedBox(height: 12),
                ChartCard(
                  title: 'INDIVIDUAL CONTRIBUTIONS',
                  child: report.memberStats.isEmpty
                      ? const EmptyChart(
                          message: 'No member data for this period',
                        )
                      : ContributionBars(members: report.memberStats),
                ),
                const SizedBox(height: 12),
                ChartCard(
                  title: 'PROJECT COMPLETION',
                  child: report.projectStats.isEmpty
                      ? const EmptyChart(
                          message: 'No project data for this period',
                        )
                      : ProjectCompletionList(
                          projects: report.projectStats,
                        ),
                ),
                const SizedBox(height: 12),
                ChartCard(
                  title: 'OVERDUE BY ASSIGNEE',
                  child: report.memberStats.isEmpty
                      ? const EmptyChart(message: 'No overdue tasks')
                      : OverdueList(members: report.memberStats),
                ),
              ],
            ),
            loading: () => const Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: UnjynxShimmerBox(
                        height: 80,
                        width: double.infinity,
                        borderRadius: 16,
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: UnjynxShimmerBox(
                        height: 80,
                        width: double.infinity,
                        borderRadius: 16,
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: UnjynxShimmerBox(
                        height: 80,
                        width: double.infinity,
                        borderRadius: 16,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                UnjynxShimmerBox(
                  height: 200,
                  width: double.infinity,
                  borderRadius: 16,
                ),
                SizedBox(height: 12),
                UnjynxShimmerBox(
                  height: 200,
                  width: double.infinity,
                  borderRadius: 16,
                ),
                SizedBox(height: 12),
                UnjynxShimmerBox(
                  height: 200,
                  width: double.infinity,
                  borderRadius: 16,
                ),
              ],
            ),
            error: (error, _) => Center(
              child: Text(
                'Failed to load report: $error',
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.error,
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.report});

  final TeamReport report;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Row(
      children: [
        Expanded(
          child: _StatTile(
            label: 'Completion',
            value: '${(report.completionRate * 100).round()}%',
            color: ux.success,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatTile(
            label: 'Overdue',
            value: '${report.overdueCount}',
            color: report.overdueCount > 0 ? ux.warning : ux.success,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatTile(
            label: 'Members',
            value: '${report.memberStats.length}',
            color: colorScheme.primary,
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: isLight
            ? Border.all(
                color: colorScheme.primary.withValues(alpha: 0.1),
              )
            : null,
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
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Text(
              value,
              style: textTheme.displaySmall?.copyWith(
                fontSize: 22,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
