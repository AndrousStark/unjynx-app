import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../domain/models/sprint.dart';
import '../providers/sprint_providers.dart';

/// Velocity chart page showing committed vs completed points per sprint.
class VelocityPage extends ConsumerWidget {
  const VelocityPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final velocityAsync = ref.watch(velocityProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Velocity'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: velocityAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text(
            'Failed to load velocity data',
            style: theme.textTheme.bodyMedium,
          ),
        ),
        data: (data) {
          if (data.sprints.isEmpty) {
            return Center(
              child: Text(
                'Complete at least one sprint\nto see velocity data.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(velocityProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Average velocity card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.speed_rounded,
                        color: colorScheme.primary,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Average Velocity',
                            style: theme.textTheme.labelMedium?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Text(
                            '${data.averageVelocity.toStringAsFixed(1)} pts/sprint',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Sprint bars
                Text(
                  'Sprint History',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),

                for (final entry in data.sprints) ...[
                  _VelocityBar(entry: entry, colorScheme: colorScheme),
                  const SizedBox(height: 8),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _VelocityBar extends StatelessWidget {
  final VelocityEntry entry;
  final ColorScheme colorScheme;

  const _VelocityBar({required this.entry, required this.colorScheme});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maxPoints = entry.committed > entry.completed
        ? entry.committed
        : entry.completed;
    final committedRatio = maxPoints > 0 ? entry.committed / maxPoints : 0.0;
    final completedRatio = maxPoints > 0 ? entry.completed / maxPoints : 0.0;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            entry.name,
            style: theme.textTheme.labelMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          // Committed bar
          Row(
            children: [
              SizedBox(
                width: 70,
                child: Text(
                  'Committed',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 10,
                  ),
                ),
              ),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: committedRatio.clamp(0, 1).toDouble(),
                    minHeight: 8,
                    backgroundColor: colorScheme.outlineVariant.withValues(
                      alpha: 0.2,
                    ),
                    color: colorScheme.outline,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 28,
                child: Text(
                  '${entry.committed}',
                  style: theme.textTheme.labelSmall,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          // Completed bar
          Row(
            children: [
              SizedBox(
                width: 70,
                child: Text(
                  'Completed',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontSize: 10,
                  ),
                ),
              ),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: completedRatio.clamp(0, 1).toDouble(),
                    minHeight: 8,
                    backgroundColor: colorScheme.outlineVariant.withValues(
                      alpha: 0.2,
                    ),
                    color: colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 28,
                child: Text(
                  '${entry.completed}',
                  style: theme.textTheme.labelSmall,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
