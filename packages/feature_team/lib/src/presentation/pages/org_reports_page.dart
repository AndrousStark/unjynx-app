import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Org summary provider
// ---------------------------------------------------------------------------

/// Top-level org KPIs from /reports/summary.
class OrgSummary {
  const OrgSummary({
    this.totalTasks = 0,
    this.completedTasks = 0,
    this.overdueTasks = 0,
    this.activeMembers = 0,
    this.completionRate = 0,
    this.tasksCreatedThisWeek = 0,
    this.tasksCompletedThisWeek = 0,
  });

  final int totalTasks;
  final int completedTasks;
  final int overdueTasks;
  final int activeMembers;
  final double completionRate;
  final int tasksCreatedThisWeek;
  final int tasksCompletedThisWeek;

  factory OrgSummary.fromJson(Map<String, dynamic> json) {
    return OrgSummary(
      totalTasks: (json['totalTasks'] as num?)?.toInt() ?? 0,
      completedTasks: (json['completedTasks'] as num?)?.toInt() ?? 0,
      overdueTasks: (json['overdueTasks'] as num?)?.toInt() ?? 0,
      activeMembers: (json['activeMembers'] as num?)?.toInt() ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0,
      tasksCreatedThisWeek:
          (json['tasksCreatedThisWeek'] as num?)?.toInt() ?? 0,
      tasksCompletedThisWeek:
          (json['tasksCompletedThisWeek'] as num?)?.toInt() ?? 0,
    );
  }
}

final orgSummaryProvider = FutureProvider<OrgSummary>((ref) async {
  final api = _tryRead(ref, reportApiProvider);
  if (api == null) return const OrgSummary();

  try {
    final response = await api.getSummary();
    if (response.success && response.data != null) {
      return OrgSummary.fromJson(response.data!);
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const OrgSummary();
});

// ---------------------------------------------------------------------------
// Workload provider
// ---------------------------------------------------------------------------

class WorkloadMember {
  const WorkloadMember({
    required this.userId,
    this.name,
    this.activeTasks = 0,
    this.completedThisPeriod = 0,
    this.overdueCount = 0,
  });

  final String userId;
  final String? name;
  final int activeTasks;
  final int completedThisPeriod;
  final int overdueCount;

  factory WorkloadMember.fromJson(Map<String, dynamic> json) {
    return WorkloadMember(
      userId: json['userId'] as String,
      name: json['name'] as String?,
      activeTasks: (json['activeTasks'] as num?)?.toInt() ?? 0,
      completedThisPeriod: (json['completedThisPeriod'] as num?)?.toInt() ?? 0,
      overdueCount: (json['overdueCount'] as num?)?.toInt() ?? 0,
    );
  }
}

final orgWorkloadProvider = FutureProvider<List<WorkloadMember>>((ref) async {
  final api = _tryRead(ref, reportApiProvider);
  if (api == null) return const [];

  try {
    final response = await api.getWorkload();
    if (response.success && response.data != null) {
      final members = (response.data!['members'] as List<dynamic>?) ?? [];
      return List.unmodifiable(
        members
            .map((e) => WorkloadMember.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const [];
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/// Organization-level reports page with KPIs and workload distribution.
class OrgReportsPage extends ConsumerWidget {
  const OrgReportsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final summaryAsync = ref.watch(orgSummaryProvider);
    final workloadAsync = ref.watch(orgWorkloadProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Organization Reports'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(orgSummaryProvider);
          ref.invalidate(orgWorkloadProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPI cards
            summaryAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const SizedBox.shrink(),
              data: (summary) => _KpiGrid(
                summary: summary,
                colorScheme: colorScheme,
                theme: theme,
              ),
            ),
            const SizedBox(height: 24),

            // Workload section
            Text(
              'Team Workload',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            workloadAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => Text(
                'Failed to load workload data',
                style: theme.textTheme.bodySmall,
              ),
              data: (members) {
                if (members.isEmpty) {
                  return Text(
                    'No members with assigned tasks.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  );
                }
                return Column(
                  children: [
                    for (final member in members) ...[
                      _WorkloadTile(
                        member: member,
                        colorScheme: colorScheme,
                        theme: theme,
                      ),
                      const SizedBox(height: 8),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  final OrgSummary summary;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _KpiGrid({
    required this.summary,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _KpiCard(
          label: 'Total Tasks',
          value: '${summary.totalTasks}',
          icon: Icons.task_alt_rounded,
          color: colorScheme.primary,
          theme: theme,
          colorScheme: colorScheme,
        ),
        _KpiCard(
          label: 'Completed',
          value: '${summary.completedTasks}',
          icon: Icons.check_circle_rounded,
          color: Colors.green,
          theme: theme,
          colorScheme: colorScheme,
        ),
        _KpiCard(
          label: 'Overdue',
          value: '${summary.overdueTasks}',
          icon: Icons.warning_rounded,
          color: colorScheme.error,
          theme: theme,
          colorScheme: colorScheme,
        ),
        _KpiCard(
          label: 'Completion Rate',
          value: '${(summary.completionRate * 100).toStringAsFixed(0)}%',
          icon: Icons.trending_up_rounded,
          color: Colors.amber.shade700,
          theme: theme,
          colorScheme: colorScheme,
        ),
        _KpiCard(
          label: 'Active Members',
          value: '${summary.activeMembers}',
          icon: Icons.people_rounded,
          color: colorScheme.tertiary,
          theme: theme,
          colorScheme: colorScheme,
        ),
        _KpiCard(
          label: 'This Week',
          value:
              '+${summary.tasksCreatedThisWeek} / ${summary.tasksCompletedThisWeek} done',
          icon: Icons.calendar_today_rounded,
          color: colorScheme.secondary,
          theme: theme,
          colorScheme: colorScheme,
        ),
      ],
    );
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final ThemeData theme;
  final ColorScheme colorScheme;

  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.theme,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    final width = (MediaQuery.of(context).size.width - 40) / 2;
    return SizedBox(
      width: width,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WorkloadTile extends StatelessWidget {
  final WorkloadMember member;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _WorkloadTile({
    required this.member,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          // Avatar placeholder
          CircleAvatar(
            radius: 18,
            backgroundColor: colorScheme.primary.withValues(alpha: 0.12),
            child: Text(
              (member.name ?? '?')[0].toUpperCase(),
              style: TextStyle(
                color: colorScheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  member.name ?? 'Unknown',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  '${member.activeTasks} active · '
                  '${member.completedThisPeriod} done · '
                  '${member.overdueCount} overdue',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          if (member.overdueCount > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: colorScheme.error.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${member.overdueCount}',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: colorScheme.error,
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
