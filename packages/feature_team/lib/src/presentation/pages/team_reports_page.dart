import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';
import 'package:service_api/service_api.dart';
import 'package:share_plus/share_plus.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_report.dart';
import '../providers/team_providers.dart';
import '../widgets/report_charts.dart';

/// N4 -- Team Reports page.
///
/// Period selector, productivity chart, contribution bar chart,
/// project completion rates, overdue by assignee, and export buttons.
class TeamReportsPage extends ConsumerStatefulWidget {
  const TeamReportsPage({super.key});

  @override
  ConsumerState<TeamReportsPage> createState() => _TeamReportsPageState();
}

class _TeamReportsPageState extends ConsumerState<TeamReportsPage> {
  bool _isExportingPdf = false;
  bool _isExportingCsv = false;

  /// Maps [ReportPeriod] to the backend query parameter value.
  String _periodToApiParam(ReportPeriod period) {
    switch (period) {
      case ReportPeriod.week:
        return 'week';
      case ReportPeriod.month:
        return 'month';
      case ReportPeriod.quarter:
        return 'month'; // Backend supports week|month; quarter maps to month.
    }
  }

  Future<void> _exportPdf() async {
    final team = ref.read(currentTeamProvider);
    final period = ref.read(reportPeriodProvider);
    final api = _tryReadApi();

    if (team == null || api == null) {
      _showError('No active team. Please select a team first.');
      return;
    }

    setState(() => _isExportingPdf = true);
    try {
      final bytes = await api.exportReportPdf(
        team.id,
        period: _periodToApiParam(period),
      );
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/unjynx-team-report-${period.name}.pdf',
      );
      await file.writeAsBytes(bytes);
      if (!mounted) return;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'UNJYNX Team Report - ${period.displayName}',
        ),
      );
    } on DioException catch (e) {
      if (!mounted) return;
      _showError(e.message ?? 'Failed to download PDF report.');
    } on Exception catch (e) {
      if (!mounted) return;
      _showError('Export failed: $e');
    } finally {
      if (mounted) setState(() => _isExportingPdf = false);
    }
  }

  Future<void> _exportCsv() async {
    final team = ref.read(currentTeamProvider);
    final period = ref.read(reportPeriodProvider);
    final api = _tryReadApi();

    if (team == null || api == null) {
      _showError('No active team. Please select a team first.');
      return;
    }

    setState(() => _isExportingCsv = true);
    try {
      final csvText = await api.exportReportCsv(
        team.id,
        period: _periodToApiParam(period),
      );
      final dir = await getTemporaryDirectory();
      final file = File(
        '${dir.path}/unjynx-team-report-${period.name}.csv',
      );
      await file.writeAsString(csvText);
      if (!mounted) return;
      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          text: 'UNJYNX Team Report - ${period.displayName}',
        ),
      );
    } on DioException catch (e) {
      if (!mounted) return;
      _showError(e.message ?? 'Failed to download CSV report.');
    } on Exception catch (e) {
      if (!mounted) return;
      _showError('Export failed: $e');
    } finally {
      if (mounted) setState(() => _isExportingCsv = false);
    }
  }

  /// Safely reads the team API provider, returning null if unavailable.
  TeamApiService? _tryReadApi() {
    try {
      return ref.read(teamApiProvider);
    } catch (_) {
      return null;
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final period = ref.watch(reportPeriodProvider);
    final reportAsync = ref.watch(teamReportProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Reports'),
        actions: [
          // PDF export button
          _isExportingPdf
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : IconButton(
                  icon: const Icon(Icons.picture_as_pdf_rounded),
                  tooltip: 'Export PDF',
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    _exportPdf();
                  },
                ),
          // CSV export button
          _isExportingCsv
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              : IconButton(
                  icon: const Icon(Icons.table_chart_rounded),
                  tooltip: 'Export CSV',
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    _exportCsv();
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
