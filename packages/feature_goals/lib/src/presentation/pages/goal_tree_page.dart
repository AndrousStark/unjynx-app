import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/models/goal.dart';
import '../providers/goal_providers.dart';

/// Hierarchical goal tree page.
///
/// Shows company → team → individual goals in an expandable tree
/// with progress bars, status badges, and level indicators.
class GoalTreePage extends ConsumerWidget {
  const GoalTreePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final treeAsync = ref.watch(goalTreeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Goals'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            tooltip: 'Filter by level',
            onPressed: () => _showLevelFilter(context, ref),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/goals/create'),
        child: const Icon(Icons.add_rounded),
      ),
      body: treeAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(
            'Failed to load goals',
            style: theme.textTheme.bodyMedium,
          ),
        ),
        data: (goals) {
          if (goals.isEmpty) {
            return _EmptyState(colorScheme: colorScheme, theme: theme);
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(goalTreeProvider),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: goals.length,
              itemBuilder: (context, i) =>
                  _GoalTreeNode(goal: goals[i], depth: 0),
            ),
          );
        },
      ),
    );
  }

  void _showLevelFilter(BuildContext context, WidgetRef ref) {
    final current = ref.read(goalLevelFilterProvider);
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            ListTile(
              title: const Text('All Levels'),
              leading: const Icon(Icons.layers_rounded),
              selected: current == null,
              onTap: () {
                ref.read(goalLevelFilterProvider.notifier).set(null);
                Navigator.pop(ctx);
              },
            ),
            for (final level in GoalLevel.values)
              ListTile(
                title: Text(
                  level.name[0].toUpperCase() + level.name.substring(1),
                ),
                leading: Icon(_levelIcon(level)),
                selected: current == level,
                onTap: () {
                  ref.read(goalLevelFilterProvider.notifier).set(level);
                  Navigator.pop(ctx);
                },
              ),
          ],
        ),
      ),
    );
  }
}

IconData _levelIcon(GoalLevel level) {
  switch (level) {
    case GoalLevel.company:
      return Icons.business_rounded;
    case GoalLevel.team:
      return Icons.groups_rounded;
    case GoalLevel.individual:
      return Icons.person_rounded;
  }
}

Color _statusColor(GoalStatus status, ColorScheme cs) {
  switch (status) {
    case GoalStatus.onTrack:
      return Colors.green;
    case GoalStatus.atRisk:
      return Colors.amber.shade700;
    case GoalStatus.behind:
      return cs.error;
    case GoalStatus.completed:
      return cs.primary;
    case GoalStatus.cancelled:
      return cs.outline;
  }
}

/// Recursively rendered goal node with expand/collapse.
class _GoalTreeNode extends StatefulWidget {
  final Goal goal;
  final int depth;

  const _GoalTreeNode({required this.goal, required this.depth});

  @override
  State<_GoalTreeNode> createState() => _GoalTreeNodeState();
}

class _GoalTreeNodeState extends State<_GoalTreeNode> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final goal = widget.goal;
    final hasChildren = goal.children.isNotEmpty;
    final statusColor = _statusColor(goal.status, colorScheme);

    return Padding(
      padding: EdgeInsets.only(left: widget.depth * 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              HapticFeedback.lightImpact();
              GoRouter.of(context).push('/goals/${goal.id}');
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.3,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      // Level icon
                      Icon(
                        _levelIcon(goal.level),
                        size: 16,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      // Title
                      Expanded(
                        child: Text(
                          goal.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          goal.status.label,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: statusColor,
                            fontWeight: FontWeight.w600,
                            fontSize: 9,
                          ),
                        ),
                      ),
                      // Expand/collapse
                      if (hasChildren) ...[
                        const SizedBox(width: 4),
                        GestureDetector(
                          onTap: () => setState(() => _expanded = !_expanded),
                          child: Icon(
                            _expanded
                                ? Icons.expand_less_rounded
                                : Icons.expand_more_rounded,
                            size: 20,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Progress bar
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: goal.progress,
                            minHeight: 5,
                            backgroundColor: colorScheme.outlineVariant
                                .withValues(alpha: 0.3),
                            color: statusColor,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        goal.progressLabel,
                        style: theme.textTheme.labelSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                  // Owner
                  if (goal.ownerName != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      goal.ownerName!,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          // Children
          if (hasChildren && _expanded)
            for (final child in goal.children)
              _GoalTreeNode(goal: child, depth: widget.depth + 1),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final ColorScheme colorScheme;
  final ThemeData theme;

  const _EmptyState({required this.colorScheme, required this.theme});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.flag_rounded,
              size: 64,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 16),
            Text(
              'No goals yet',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Set company, team, and individual goals\nto align your organization.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
