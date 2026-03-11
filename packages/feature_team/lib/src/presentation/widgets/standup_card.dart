import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/standup_entry.dart';

/// Summary card for a single standup entry.
class StandupCard extends StatelessWidget {
  const StandupCard({required this.entry, super.key});

  final StandupEntry entry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
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
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header: name + time
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: colorScheme.primary.withValues(
                    alpha: isLight ? 0.12 : 0.15,
                  ),
                  child: Text(
                    entry.name.isNotEmpty ? entry.name[0].toUpperCase() : '?',
                    style: textTheme.labelMedium?.copyWith(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    entry.name,
                    style: textTheme.titleMedium?.copyWith(
                      fontSize: 15,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
                Text(
                  _formatTime(entry.submittedAt),
                  style: textTheme.labelMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Done yesterday
            if (entry.doneYesterday.isNotEmpty) ...[
              _SectionLabel(
                icon: Icons.check_circle_outline_rounded,
                label: 'Done Yesterday',
                color: ux.success,
              ),
              const SizedBox(height: 4),
              ...entry.doneYesterday.map(
                (item) => _BulletItem(text: item),
              ),
              const SizedBox(height: 10),
            ],

            // Planned today
            if (entry.plannedToday.isNotEmpty) ...[
              _SectionLabel(
                icon: Icons.schedule_rounded,
                label: 'Planned Today',
                color: colorScheme.primary,
              ),
              const SizedBox(height: 4),
              ...entry.plannedToday.map(
                (item) => _BulletItem(text: item),
              ),
              const SizedBox(height: 10),
            ],

            // Blockers
            if (entry.hasBlockers) ...[
              _SectionLabel(
                icon: Icons.warning_amber_rounded,
                label: 'Blockers',
                color: ux.warning,
              ),
              const SizedBox(height: 4),
              ...entry.blockers.map(
                (item) => _BulletItem(text: item, isBlocker: true),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _formatTime(DateTime dt) {
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(
          label,
          style: textTheme.labelMedium?.copyWith(
            color: color,
            letterSpacing: 0.3,
          ),
        ),
      ],
    );
  }
}

class _BulletItem extends StatelessWidget {
  const _BulletItem({required this.text, this.isBlocker = false});

  final String text;
  final bool isBlocker;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    return Padding(
      padding: const EdgeInsets.only(left: 20, top: 2, bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Container(
              width: 4,
              height: 4,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isBlocker ? ux.warning : colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: textTheme.bodySmall?.copyWith(
                fontSize: 13,
                color: colorScheme.onSurface,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
