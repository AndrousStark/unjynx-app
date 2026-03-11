import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/import_preview.dart';

/// Card representing an import source (Todoist, TickTick, etc.).
class SourceCard extends StatelessWidget {
  const SourceCard({
    required this.source,
    required this.onTap,
    this.isSelected = false,
    super.key,
  });

  final ImportSource source;
  final VoidCallback onTap;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return PressableScale(
      onTap: onTap,
      child: Card(
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isSelected
              ? BorderSide(color: colorScheme.primary, width: 2)
              : isLight
                  ? BorderSide(
                      color: colorScheme.primary.withValues(alpha: 0.1),
                    )
                  : BorderSide.none,
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: isLight
                ? [
                    BoxShadow(
                      color: const Color(0xFF6B21A8).withValues(alpha: isSelected ? 0.12 : 0.06),
                      blurRadius: isSelected ? 12 : 8,
                      offset: const Offset(0, 3),
                    ),
                  ]
                : null,
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    color: isSelected
                        ? colorScheme.primary.withValues(
                            alpha: isLight ? 0.15 : 0.2,
                          )
                        : colorScheme.surfaceContainerHigh.withValues(
                            alpha: isLight ? 0.7 : 1.0,
                          ),
                  ),
                  child: Icon(
                    _sourceIcon(source),
                    size: 24,
                    color: isSelected
                        ? colorScheme.primary
                        : colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        source.displayName,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        source.description,
                        style: TextStyle(
                          fontSize: 12,
                          color: colorScheme.onSurfaceVariant.withValues(
                            alpha: isLight ? 0.6 : 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (isSelected)
                  Icon(
                    Icons.check_circle_rounded,
                    color: colorScheme.primary,
                    size: 22,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static IconData _sourceIcon(ImportSource source) {
    switch (source) {
      case ImportSource.todoist:
        return Icons.check_box_outlined;
      case ImportSource.tickTick:
        return Icons.timer_outlined;
      case ImportSource.appleReminders:
        return Icons.notifications_outlined;
      case ImportSource.googleTasks:
        return Icons.task_outlined;
      case ImportSource.genericCsv:
        return Icons.table_chart_outlined;
    }
  }
}
