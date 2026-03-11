import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import '../widgets/edit_project_sheet.dart';
import '../widgets/icon_picker.dart';

/// Project detail page showing project info, stats, and actions.
class ProjectDetailPage extends ConsumerWidget {
  const ProjectDetailPage({required this.projectId, super.key});

  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final projectAsync = ref.watch(projectByIdProvider(projectId));

    return projectAsync.when(
      data: (project) {
        if (project == null) {
          return Scaffold(
            appBar: AppBar(),
            body: Center(
              child: Text(
                'Project not found',
                style: TextStyle(color: colorScheme.onSurfaceVariant),
              ),
            ),
          );
        }

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
        final taskCountAsync = ref.watch(projectTaskCountProvider(projectId));

        return Scaffold(
          appBar: AppBar(
            title: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  resolveProjectIcon(project.icon),
                  color: displayColor,
                  size: 22,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    project.name,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  _showEditSheet(context, ref);
                },
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: StaggeredColumn(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Color accent bar
                Container(
                height: 4,
                decoration: BoxDecoration(
                  color: displayColor,
                  borderRadius: BorderRadius.circular(2),
                  boxShadow: isLight
                      ? context.unjynxShadow(UnjynxElevation.md)
                      : null,
                ),
              ),
              const SizedBox(height: 16),

              // Description
              if (project.description != null &&
                  project.description!.isNotEmpty) ...[
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: isLight
                        ? BorderSide(
                            color: colorScheme.primary.withValues(alpha: 0.12),
                          )
                        : BorderSide.none,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DESCRIPTION',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          project.description!,
                          style: TextStyle(
                            fontSize: 15,
                            color: colorScheme.onSurface,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Stats card
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: isLight
                      ? BorderSide(
                          color: colorScheme.primary.withValues(alpha: 0.12),
                        )
                      : BorderSide.none,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _InfoRow(
                        icon: Icons.checklist_outlined,
                        label: 'Active Tasks',
                        value: taskCountAsync.when(
                          data: (count) => '$count',
                          loading: () => '...',
                          error: (_, __) => '0',
                        ),
                        valueColor: displayColor,
                      ),
                      const Divider(height: 24),
                      _InfoRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Created',
                        value: _formatDate(project.createdAt),
                      ),
                      if (project.updatedAt.difference(project.createdAt).inMinutes >
                          1) ...[
                        const Divider(height: 24),
                        _InfoRow(
                          icon: Icons.update_outlined,
                          label: 'Last updated',
                          value: _formatDate(project.updatedAt),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Archive action
              if (!project.isArchived)
                Card(
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: isLight
                        ? BorderSide(
                            color: colorScheme.primary.withValues(alpha: 0.12),
                          )
                        : BorderSide.none,
                  ),
                  child: ListTile(
                    leading: Icon(
                      Icons.archive_outlined,
                      color: ux.warning,
                    ),
                    title: const Text('Archive Project'),
                    subtitle: Text(
                      'Move to archive. Tasks will remain.',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      _confirmArchive(context, ref);
                    },
                  ),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Scaffold(
        appBar: AppBar(),
        body: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const UnjynxShimmerCircle(diameter: 48),
                  const SizedBox(width: 16),
                  Expanded(
                    child: UnjynxShimmerLine(width: 160, height: 20),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              UnjynxShimmerBox(height: 100, borderRadius: 16),
              const SizedBox(height: 16),
              UnjynxShimmerBox(height: 60, borderRadius: 16),
            ],
          ),
        ),
      ),
      error: (error, _) => Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Text(
            'Error: $error',
            style: TextStyle(color: colorScheme.error),
          ),
        ),
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref) {
    final project = ref.read(projectByIdProvider(projectId)).valueOrNull;
    if (project == null) return;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => EditProjectSheet(project: project),
    );
  }

  void _confirmArchive(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Archive Project?'),
        content: const Text(
          'This project will be moved to the archive. Its tasks will remain.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.of(context).pop(false);
            },
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              HapticFeedback.mediumImpact();
              Navigator.of(context).pop(true);
            },
            style: TextButton.styleFrom(
              foregroundColor: ux.warning,
            ),
            child: const Text('Archive'),
          ),
        ],
      ),
    ).then((confirmed) async {
      if (confirmed == true) {
        final archiveProject = ref.read(archiveProjectProvider);
        await archiveProject(projectId);
        ref.invalidate(projectListProvider);
        if (context.mounted) {
          Navigator.of(context).pop();
        }
      }
    });
  }

  static String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Row(
      children: [
        Icon(icon, size: 20, color: colorScheme.onSurfaceVariant),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: valueColor ?? colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}
