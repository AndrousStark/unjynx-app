import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Providers (lazy-loaded per tab)
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

final _standupProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final api = _tryRead(ref, aiTeamApiProvider);
  if (api == null) return null;
  try {
    final r = await api.getStandup();
    return r.success ? r.data : null;
  } on DioException {
    return null;
  }
});

final _risksProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final api = _tryRead(ref, aiTeamApiProvider);
  if (api == null) return null;
  try {
    final r = await api.detectRisks();
    return r.success ? r.data : null;
  } on DioException {
    return null;
  }
});

final _costProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final api = _tryRead(ref, aiTeamApiProvider);
  if (api == null) return null;
  try {
    final r = await api.getCostSummary();
    return r.success ? r.data : null;
  } on DioException {
    return null;
  }
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/// AI Team Intelligence dashboard with 4 tabs:
/// Standup, Risks, Smart Assign, Usage/Cost.
class AiTeamPage extends ConsumerStatefulWidget {
  const AiTeamPage({super.key});

  @override
  ConsumerState<AiTeamPage> createState() => _AiTeamPageState();
}

class _AiTeamPageState extends ConsumerState<AiTeamPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _taskTitleController = TextEditingController();
  List<Map<String, dynamic>>? _assigneeSuggestions;
  bool _isSuggesting = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _taskTitleController.dispose();
    super.dispose();
  }

  Future<void> _suggestAssignee() async {
    final title = _taskTitleController.text.trim();
    if (title.length < 3) return;

    setState(() {
      _isSuggesting = true;
      _assigneeSuggestions = null;
    });
    HapticFeedback.mediumImpact();

    try {
      final api = ref.read(aiTeamApiProvider);
      final response = await api.suggestAssignee(taskTitle: title);
      if (mounted && response.success && response.data != null) {
        final suggestions =
            (response.data!['suggestions'] as List<dynamic>?)
                ?.cast<Map<String, dynamic>>() ??
            <Map<String, dynamic>>[];
        setState(() => _assigneeSuggestions = suggestions);
      }
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('AI service unavailable')));
      }
    } finally {
      if (mounted) setState(() => _isSuggesting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Team Intelligence'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: const [
            Tab(icon: Icon(Icons.auto_awesome_rounded), text: 'Standup'),
            Tab(icon: Icon(Icons.warning_amber_rounded), text: 'Risks'),
            Tab(icon: Icon(Icons.people_rounded), text: 'Assign'),
            Tab(icon: Icon(Icons.bar_chart_rounded), text: 'Usage'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _StandupTab(colorScheme: colorScheme, theme: theme),
          _RisksTab(colorScheme: colorScheme, theme: theme),
          _AssignTab(
            controller: _taskTitleController,
            suggestions: _assigneeSuggestions,
            isSuggesting: _isSuggesting,
            onSuggest: _suggestAssignee,
            colorScheme: colorScheme,
            theme: theme,
          ),
          _CostTab(colorScheme: colorScheme, theme: theme),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Standup Tab
// ---------------------------------------------------------------------------

class _StandupTab extends ConsumerWidget {
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _StandupTab({required this.colorScheme, required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final standupAsync = ref.watch(_standupProvider);

    return standupAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(child: Text('Failed to load standup')),
      data: (data) {
        if (data == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.auto_awesome_rounded,
                  size: 48,
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                ),
                const SizedBox(height: 12),
                Text(
                  'No standup data yet',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          );
        }

        final summary = data['summary'] as String? ?? 'Team standup summary';
        final completed =
            (data['completedYesterday'] as List<dynamic>?) ?? <dynamic>[];
        final inProgress =
            (data['inProgressToday'] as List<dynamic>?) ?? <dynamic>[];
        final blockers = (data['blockers'] as List<dynamic>?) ?? <dynamic>[];

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_standupProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // AI Summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      colorScheme.primary.withValues(alpha: 0.1),
                      colorScheme.tertiary.withValues(alpha: 0.05),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.auto_awesome_rounded,
                      color: colorScheme.primary,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        summary,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              _SectionCard(
                title: 'Completed Yesterday',
                icon: Icons.check_circle_rounded,
                color: Colors.green,
                items: completed,
                theme: theme,
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'In Progress Today',
                icon: Icons.schedule_rounded,
                color: colorScheme.primary,
                items: inProgress,
                theme: theme,
                colorScheme: colorScheme,
              ),
              const SizedBox(height: 12),
              if (blockers.isNotEmpty)
                _SectionCard(
                  title: 'Blockers',
                  icon: Icons.warning_rounded,
                  color: colorScheme.error,
                  items: blockers,
                  theme: theme,
                  colorScheme: colorScheme,
                ),
            ],
          ),
        );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final List<dynamic> items;
  final ThemeData theme;
  final ColorScheme colorScheme;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.items,
    required this.theme,
    required this.colorScheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 8),
              Text(
                title,
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Text(
                '${items.length}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          if (items.isNotEmpty) ...[
            const SizedBox(height: 8),
            for (final item in items)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  '${item is Map ? (item['title'] ?? item.toString()) : item}',
                  style: theme.textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ] else
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'None',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Risks Tab
// ---------------------------------------------------------------------------

class _RisksTab extends ConsumerWidget {
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _RisksTab({required this.colorScheme, required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final risksAsync = ref.watch(_risksProvider);

    return risksAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(child: Text('Failed to detect risks')),
      data: (data) {
        if (data == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.check_circle_rounded,
                  size: 48,
                  color: Colors.green.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 12),
                Text(
                  'All clear — no risks detected',
                  style: theme.textTheme.bodyMedium,
                ),
              ],
            ),
          );
        }

        final level = data['riskLevel'] as String? ?? 'low';
        final overdue = (data['overdueTasks'] as List<dynamic>?) ?? <dynamic>[];
        final stale = (data['staleTasks'] as List<dynamic>?) ?? <dynamic>[];
        final unassigned =
            (data['unassignedHighPriority'] as List<dynamic>?) ?? <dynamic>[];

        final riskColor = switch (level) {
          'critical' => colorScheme.error,
          'high' => Colors.orange,
          'medium' => Colors.amber.shade700,
          _ => Colors.green,
        };

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_risksProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Risk level banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: riskColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: riskColor.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.shield_rounded, color: riskColor, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      'Risk Level: ${level.toUpperCase()}',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: riskColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (overdue.isNotEmpty)
                _SectionCard(
                  title: 'Overdue Tasks',
                  icon: Icons.warning_rounded,
                  color: colorScheme.error,
                  items: overdue,
                  theme: theme,
                  colorScheme: colorScheme,
                ),
              if (overdue.isNotEmpty) const SizedBox(height: 12),

              if (stale.isNotEmpty)
                _SectionCard(
                  title: 'Stale Tasks (7+ days)',
                  icon: Icons.schedule_rounded,
                  color: Colors.orange,
                  items: stale,
                  theme: theme,
                  colorScheme: colorScheme,
                ),
              if (stale.isNotEmpty) const SizedBox(height: 12),

              if (unassigned.isNotEmpty)
                _SectionCard(
                  title: 'Unassigned High Priority',
                  icon: Icons.person_off_rounded,
                  color: Colors.amber.shade700,
                  items: unassigned,
                  theme: theme,
                  colorScheme: colorScheme,
                ),
            ],
          ),
        );
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Smart Assign Tab
// ---------------------------------------------------------------------------

class _AssignTab extends StatelessWidget {
  final TextEditingController controller;
  final List<Map<String, dynamic>>? suggestions;
  final bool isSuggesting;
  final VoidCallback onSuggest;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _AssignTab({
    required this.controller,
    required this.suggestions,
    required this.isSuggesting,
    required this.onSuggest,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Task title input
        TextField(
          controller: controller,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            labelText: 'Task title',
            hintText: 'e.g. Implement payment webhook handler',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            suffixIcon: IconButton(
              icon: isSuggesting
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: colorScheme.primary,
                      ),
                    )
                  : Icon(
                      Icons.auto_awesome_rounded,
                      color: colorScheme.primary,
                    ),
              onPressed: isSuggesting ? null : onSuggest,
            ),
          ),
          onSubmitted: (_) => onSuggest(),
        ),
        const SizedBox(height: 20),

        // Results
        if (suggestions != null && suggestions!.isEmpty)
          Center(
            child: Text(
              'No suggestions available',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),

        if (suggestions != null)
          for (var i = 0; i < suggestions!.length; i++) ...[
            _AssigneeSuggestionCard(
              suggestion: suggestions![i],
              isTopPick: i == 0,
              colorScheme: colorScheme,
              theme: theme,
            ),
            const SizedBox(height: 8),
          ],
      ],
    );
  }
}

class _AssigneeSuggestionCard extends StatelessWidget {
  final Map<String, dynamic> suggestion;
  final bool isTopPick;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _AssigneeSuggestionCard({
    required this.suggestion,
    required this.isTopPick,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final name = suggestion['name'] as String? ?? 'Unknown';
    final reason = suggestion['reason'] as String? ?? '';
    final confidence = (suggestion['confidence'] as num?)?.toInt() ?? 0;
    final taskCount = (suggestion['currentTasks'] as num?)?.toInt() ?? 0;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isTopPick
            ? colorScheme.primaryContainer.withValues(alpha: 0.2)
            : colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: isTopPick
            ? Border.all(color: colorScheme.primary.withValues(alpha: 0.3))
            : null,
      ),
      child: Row(
        children: [
          // Avatar
          CircleAvatar(
            radius: 20,
            backgroundColor: colorScheme.primary.withValues(alpha: 0.12),
            child: Text(
              name[0].toUpperCase(),
              style: TextStyle(
                color: colorScheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (isTopPick) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 1,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Best Match',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 9,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                if (reason.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    reason,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  '$taskCount active tasks',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          // Confidence
          Text(
            '$confidence%',
            style: theme.textTheme.titleMedium?.copyWith(
              color: colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Cost Tab
// ---------------------------------------------------------------------------

class _CostTab extends ConsumerWidget {
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _CostTab({required this.colorScheme, required this.theme});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final costAsync = ref.watch(_costProvider);

    return costAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, __) => const Center(child: Text('Failed to load usage data')),
      data: (data) {
        if (data == null) {
          return Center(
            child: Text(
              'No usage data available',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          );
        }

        final totalOps = (data['totalOperations'] as num?)?.toInt() ?? 0;
        final totalTokens = (data['totalTokens'] as num?)?.toInt() ?? 0;
        final byType =
            (data['byOperationType'] as Map<String, dynamic>?) ??
            <String, dynamic>{};

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(_costProvider),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // KPI cards
              Row(
                children: [
                  Expanded(
                    child: _KpiCard(
                      label: 'Operations (30d)',
                      value: _formatNumber(totalOps),
                      icon: Icons.bolt_rounded,
                      color: colorScheme.primary,
                      colorScheme: colorScheme,
                      theme: theme,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _KpiCard(
                      label: 'Tokens (30d)',
                      value: _formatNumber(totalTokens),
                      icon: Icons.token_rounded,
                      color: colorScheme.tertiary,
                      colorScheme: colorScheme,
                      theme: theme,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // By operation type
              Text(
                'By Operation Type',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              for (final entry in byType.entries) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.3,
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          entry.key.replaceAll('_', ' '),
                          style: theme.textTheme.bodyMedium,
                        ),
                      ),
                      Text(
                        '${entry.value}',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
              ],
            ],
          ),
        );
      },
    );
  }

  String _formatNumber(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _KpiCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.colorScheme,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.headlineSmall?.copyWith(
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
    );
  }
}
