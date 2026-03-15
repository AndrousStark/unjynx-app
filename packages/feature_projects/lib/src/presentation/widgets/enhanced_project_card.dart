import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/models/project.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import 'icon_picker.dart';

/// Enhanced project card with progress bar, member avatars, and long-press actions.
class EnhancedProjectCard extends ConsumerWidget {
  const EnhancedProjectCard({
    required this.project,
    required this.onTap,
    this.onArchive,
    this.onDelete,
    this.onShare,
    super.key,
  });

  final Project project;
  final VoidCallback onTap;
  final VoidCallback? onArchive;
  final VoidCallback? onDelete;
  final VoidCallback? onShare;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final taskCountAsync = ref.watch(
      projectTaskCountProvider(project.id),
    );
    final color = hexToColor(project.color);

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

    return GestureDetector(
      onLongPress: () {
        HapticFeedback.mediumImpact();
        _showQuickActions(context);
      },
      child: PressableScale(
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Color dot + icon
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
                                color:
                                    displayColor.withValues(alpha: 0.2),
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

                    // Member avatar stack (placeholder for team projects)
                    _MemberAvatarStack(
                      memberCount: 0,
                      displayColor: displayColor,
                    ),

                    Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.6 : 0.5,
                      ),
                    ),
                  ],
                ),

                // Progress bar
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: 0, // Phase 4: Wire to actual completion
                    backgroundColor:
                        colorScheme.surfaceContainerHigh.withValues(
                      alpha: isLight ? 0.5 : 0.3,
                    ),
                    valueColor: AlwaysStoppedAnimation(displayColor),
                    minHeight: 4,
                  ),
                ),
              ],
            ),
          ),
        ),
        ),
      ),
    );
  }

  void _showQuickActions(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Project name header
                Text(
                  project.name,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 16),

                if (onShare != null)
                  ListTile(
                    leading: const Icon(Icons.share_rounded),
                    title: const Text('Share'),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.of(context).pop();
                      onShare!();
                    },
                  ),
                if (onArchive != null)
                  ListTile(
                    leading: Icon(Icons.archive_rounded, color: ux.warning),
                    title: Text(
                      'Archive',
                      style: TextStyle(color: ux.warning),
                    ),
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      Navigator.of(context).pop();
                      onArchive!();
                    },
                  ),
                if (onDelete != null)
                  ListTile(
                    leading: Icon(
                      Icons.delete_rounded,
                      color: colorScheme.error,
                    ),
                    title: Text(
                      'Delete',
                      style: TextStyle(color: colorScheme.error),
                    ),
                    onTap: () {
                      HapticFeedback.heavyImpact();
                      Navigator.of(context).pop();
                      onDelete!();
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

}

/// Stacked member avatars (max 3 + overflow count).
class _MemberAvatarStack extends StatelessWidget {
  const _MemberAvatarStack({
    required this.memberCount,
    required this.displayColor,
  });

  final int memberCount;
  final Color displayColor;

  @override
  Widget build(BuildContext context) {
    if (memberCount == 0) return const SizedBox.shrink();

    final colorScheme = Theme.of(context).colorScheme;
    final visibleCount = memberCount.clamp(0, 3);
    final overflow = memberCount - visibleCount;

    return SizedBox(
      width: visibleCount * 18.0 + (overflow > 0 ? 24 : 0) + 8,
      height: 28,
      child: Stack(
        children: [
          for (var i = 0; i < visibleCount; i++)
            Positioned(
              left: i * 18.0,
              child: CircleAvatar(
                radius: 14,
                backgroundColor: colorScheme.surface,
                child: CircleAvatar(
                  radius: 12,
                  backgroundColor: displayColor.withValues(alpha: 0.2),
                  child: Text(
                    '?',
                    style: TextStyle(
                      fontSize: 10,
                      color: displayColor,
                    ),
                  ),
                ),
              ),
            ),
          if (overflow > 0)
            Positioned(
              left: visibleCount * 18.0,
              child: CircleAvatar(
                radius: 14,
                backgroundColor: colorScheme.surfaceContainerHigh,
                child: Text(
                  '+$overflow',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
