import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import 'icon_picker.dart';

/// Card displaying a project with color indicator, icon, name, and task count.
class ProjectCard extends ConsumerWidget {
  const ProjectCard({
    required this.project,
    required this.onTap,
    this.onArchive,
    super.key,
  });

  final Project project;
  final VoidCallback onTap;
  final VoidCallback? onArchive;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final taskCountAsync = ref.watch(
      projectTaskCountProvider(project.id),
    );
    final color = hexToColor(project.color);

    // Deepen project color slightly on light backgrounds for better contrast
    final displayColor = isLight
        ? HSLColor.fromColor(color)
            .withSaturation(
              (HSLColor.fromColor(color).saturation * 1.15).clamp(0.0, 1.0),
            )
            .withLightness(
              (HSLColor.fromColor(color).lightness * 0.85).clamp(0.0, 1.0),
            )
            .toColor()
        : color;

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Card(
        margin: EdgeInsets.zero,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isLight
              ? BorderSide(
                  color: colorScheme.primary.withValues(alpha: 0.12),
                )
              : BorderSide.none,
        ),
        child: Container(
          decoration: isLight
              ? BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: context.unjynxShadow(UnjynxElevation.sm),
                )
              : null,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Color + icon indicator
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: displayColor.withValues(
                      alpha: isLight ? 0.12 : 0.15,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    border: isLight
                        ? Border.all(
                            color: displayColor.withValues(alpha: 0.2),
                          )
                        : null,
                  ),
                  child: Icon(
                    resolveProjectIcon(project.icon),
                    color: displayColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),

                // Name + task count
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      taskCountAsync.when(
                        data: (count) => Text(
                          '$count task${count == 1 ? '' : 's'}',
                          style: TextStyle(
                            fontSize: 13,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        loading: () => Text(
                          '...',
                          style: TextStyle(
                            fontSize: 13,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ),

                // Archive action
                if (onArchive != null)
                  IconButton(
                    icon: const Icon(Icons.archive_outlined, size: 20),
                    color: colorScheme.onSurfaceVariant,
                    onPressed: () {
                      HapticFeedback.mediumImpact();
                      onArchive!();
                    },
                  ),

                Icon(
                  Icons.chevron_right,
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.6 : 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

}
