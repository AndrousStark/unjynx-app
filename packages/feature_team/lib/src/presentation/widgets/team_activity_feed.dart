import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../providers/team_providers.dart';

/// Scrollable list of recent team activity items with vertical timeline line.
class TeamActivityFeed extends StatelessWidget {
  const TeamActivityFeed({required this.activities, super.key});

  final List<TeamActivity> activities;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    if (activities.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.history_rounded,
                size: 36,
                color: colorScheme.onSurfaceVariant.withValues(
                  alpha: isLight ? 0.4 : 0.3,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'No activity yet',
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final displayActivities = activities.take(10).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'RECENT ACTIVITY',
          style: textTheme.labelMedium?.copyWith(
            letterSpacing: 1,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 12),
        ...List.generate(displayActivities.length, (index) {
          final isLast = index == displayActivities.length - 1;
          return _ActivityRowWithTimeline(
            activity: displayActivities[index],
            isLast: isLast,
          );
        }),
      ],
    );
  }
}

class _ActivityRowWithTimeline extends StatelessWidget {
  const _ActivityRowWithTimeline({
    required this.activity,
    required this.isLast,
  });

  final TeamActivity activity;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column: dot + vertical line
          SizedBox(
            width: 18,
            child: Column(
              children: [
                const SizedBox(height: 6),
                // Dot - solid primary color
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                ),
                // Vertical line extending below the dot
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.only(top: 4),
                      color: const Color(0xFFF0EAFC),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: textTheme.bodySmall?.copyWith(
                        fontSize: 13,
                        color: colorScheme.onSurface,
                      ),
                      children: [
                        TextSpan(
                          text: activity.userName,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        TextSpan(text: ' ${activity.action} '),
                        TextSpan(
                          text: activity.target,
                          style: TextStyle(color: colorScheme.primary),
                        ),
                      ],
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _timeAgo(activity.timestamp),
                    style: textTheme.bodySmall?.copyWith(
                      fontSize: 11,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.6 : 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static String _timeAgo(DateTime timestamp) {
    final diff = DateTime.now().difference(timestamp);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${timestamp.month}/${timestamp.day}';
  }
}
