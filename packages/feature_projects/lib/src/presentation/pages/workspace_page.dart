import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import '../widgets/icon_picker.dart';

/// E4 -- Workspace page (Team plan).
///
/// Org container with team info, member online status dots,
/// projects grid, activity feed, and quick stats bar.
class WorkspacePage extends ConsumerWidget {
  const WorkspacePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final projectsAsync = ref.watch(projectListProvider);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: RefreshIndicator(
            color: colorScheme.primary,
            onRefresh: () async {
              ref.invalidate(projectListProvider);
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: colorScheme.primary.withValues(
                          alpha: isLight ? 0.12 : 0.15,
                        ),
                        child: Icon(
                          Icons.business_rounded,
                          color: colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Workspace',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: isLight
                                    ? FontWeight.w800
                                    : FontWeight.bold,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            Text(
                              'Team plan',
                              style: TextStyle(
                                fontSize: 13,
                                color: colorScheme.onSurfaceVariant
                                    .withValues(alpha: isLight ? 0.6 : 0.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.settings_outlined),
                        onPressed: () {
                          HapticFeedback.lightImpact();
                          // Phase 4: Workspace settings
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // Quick stats bar
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      _QuickStat(
                        label: 'Projects',
                        value: projectsAsync.when(
                          data: (p) => '${p.length}',
                          loading: () => '-',
                          error: (_, __) => '0',
                        ),
                        icon: Icons.folder_rounded,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(width: 8),
                      _QuickStat(
                        label: 'Members',
                        value: '0',
                        icon: Icons.people_rounded,
                        color: ux.success,
                      ),
                      const SizedBox(width: 8),
                      _QuickStat(
                        label: 'Active',
                        value: '0',
                        icon: Icons.circle,
                        color: ux.success,
                      ),
                    ],
                  ),
                ),
              ),

              // Online members strip
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                      side: isLight
                          ? BorderSide(
                              color: colorScheme.primary
                                  .withValues(alpha: 0.1),
                            )
                          : BorderSide.none,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TEAM',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                              'No team members yet',
                              style: TextStyle(
                                fontSize: 14,
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // Projects grid
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'PROJECTS',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 1,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 8)),

              projectsAsync.when(
                data: (projects) {
                  if (projects.isEmpty) {
                    return SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(
                          child: Text(
                            'No projects yet. Create one to get started.',
                            style: TextStyle(
                              fontSize: 14,
                              color: colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    );
                  }
                  return SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverGrid.count(
                      crossAxisCount: 2,
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 1.4,
                      children: projects.where((p) => !p.isArchived).map(
                        (project) {
                          final color = hexToColor(project.color);
                          final displayColor = isLight
                              ? HSLColor.fromColor(color)
                                  .withSaturation(
                                    (HSLColor.fromColor(color).saturation * 1.15)
                                        .clamp(0.0, 1.0),
                                  )
                                  .withLightness(
                                    (HSLColor.fromColor(color).lightness * 0.85)
                                        .clamp(0.0, 1.0),
                                  )
                                  .toColor()
                              : color;

                          return Card(
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                              side: isLight
                                  ? BorderSide(
                                      color: displayColor
                                          .withValues(alpha: 0.2),
                                    )
                                  : BorderSide.none,
                            ),
                            child: InkWell(
                              onTap: () {
                                HapticFeedback.lightImpact();
                                GoRouter.of(context)
                                    .push('/projects/${project.id}');
                              },
                              borderRadius: BorderRadius.circular(14),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: displayColor
                                            .withValues(alpha: 0.15),
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        resolveProjectIcon(project.icon),
                                        color: displayColor,
                                        size: 20,
                                      ),
                                    ),
                                    const Spacer(),
                                    Text(
                                      project.name,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: colorScheme.onSurface,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ).toList(),
                    ),
                  );
                },
                loading: () => SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverGrid.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.2,
                    children: List.generate(
                      4,
                      (_) => UnjynxShimmerBox(height: 120, borderRadius: 16),
                    ),
                  ),
                ),
                error: (_, __) => SliverToBoxAdapter(
                  child: Center(
                    child: Text(
                      'Failed to load projects',
                      style: TextStyle(color: colorScheme.error),
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
          ),
        ),
      ),
    );
  }

}

class _QuickStat extends StatelessWidget {
  const _QuickStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Expanded(
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: isLight
              ? BorderSide(
                  color: colorScheme.primary.withValues(alpha: 0.08),
                )
              : BorderSide.none,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 14, color: color),
                  const SizedBox(width: 4),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
