import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import '../widgets/create_project_sheet.dart';
import '../widgets/enhanced_project_card.dart';

/// E1 -- Enhanced Project List page with collapsible sections.
///
/// Sections: Favorites, Active, Shared, Archived.
/// Features: long-press quick actions, progress bars, member avatars.
class EnhancedProjectListPage extends ConsumerWidget {
  const EnhancedProjectListPage({super.key});

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
                  child: Text(
                    'Projects',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight:
                          isLight ? FontWeight.w800 : FontWeight.bold,
                      color: colorScheme.onSurface,
                      height: 1.2,
                    ),
                  ),
                ),
              ),

              // Content
              projectsAsync.when(
                data: (projects) {
                  if (projects.isEmpty) {
                    return const SliverFillRemaining(
                      child: _EmptyState(),
                    );
                  }

                  final favorites = projects
                      .where((p) => !p.isArchived && p.sortOrder < 0)
                      .toList();
                  final active = projects
                      .where((p) => !p.isArchived && p.sortOrder >= 0)
                      .toList();
                  final archived =
                      projects.where((p) => p.isArchived).toList();

                  return SliverList(
                    delegate: SliverChildListDelegate([
                      if (favorites.isNotEmpty)
                        _ProjectSection(
                          title: 'Favorites',
                          icon: Icons.star_rounded,
                          projects: favorites,
                        ),
                      if (active.isNotEmpty)
                        _ProjectSection(
                          title: 'Active',
                          icon: Icons.folder_rounded,
                          projects: active,
                        ),
                      if (archived.isNotEmpty)
                        _ProjectSection(
                          title: 'Archived',
                          icon: Icons.archive_rounded,
                          projects: archived,
                          initiallyExpanded: false,
                        ),
                      const SizedBox(height: 80),
                    ]),
                  );
                },
                loading: () => SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, __) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: UnjynxShimmerBox(height: 80, borderRadius: 16),
                      ),
                      childCount: 5,
                    ),
                  ),
                ),
                error: (error, _) => SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'Failed to load projects: $error',
                      style: TextStyle(color: colorScheme.error),
                    ),
                  ),
                ),
              ),
            ],
          ),
          ),
        ),
      ),
      floatingActionButton: Semantics(
        label: 'Create new project',
        button: true,
        child: FloatingActionButton(
          onPressed: () => _showCreateSheet(context),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  void _showCreateSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const CreateProjectSheet(),
    );
  }
}

class _ProjectSection extends ConsumerStatefulWidget {
  const _ProjectSection({
    required this.title,
    required this.icon,
    required this.projects,
    this.initiallyExpanded = true,
  });

  final String title;
  final IconData icon;
  final List<Project> projects;
  final bool initiallyExpanded;

  @override
  ConsumerState<_ProjectSection> createState() => _ProjectSectionState();
}

class _ProjectSectionState extends ConsumerState<_ProjectSection> {
  late bool _expanded;

  @override
  void initState() {
    super.initState();
    _expanded = widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          GestureDetector(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              child: Row(
                children: [
                  Icon(
                    widget.icon,
                    size: 18,
                    color: colorScheme.onSurfaceVariant.withValues(
                      alpha: isLight ? 0.6 : 0.5,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    widget.title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '(${widget.projects.length})',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.5 : 0.4,
                      ),
                    ),
                  ),
                  const Spacer(),
                  AnimatedRotation(
                    turns: _expanded ? 0 : -0.25,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.expand_more_rounded,
                      size: 20,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.5 : 0.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Project cards
          AnimatedCrossFade(
            firstChild: Column(
              children: widget.projects.map((project) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: EnhancedProjectCard(
                    project: project,
                    onTap: () => GoRouter.of(context)
                        .push('/projects/${project.id}'),
                    onArchive: () async {
                      HapticFeedback.mediumImpact();
                      final archiveProject =
                          ref.read(archiveProjectProvider);
                      await archiveProject(project.id);
                      ref.invalidate(projectListProvider);
                    },
                    onDelete: () {
                      HapticFeedback.mediumImpact();
                      // Phase 4: Delete project
                    },
                  ),
                );
              }).toList(),
            ),
            secondChild: const SizedBox.shrink(),
            crossFadeState: _expanded
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 96,
            height: 96,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colorScheme.primary.withValues(
                alpha: isLight ? 0.1 : 0.15,
              ),
            ),
            child: Icon(
              Icons.folder_outlined,
              size: 48,
              color: colorScheme.primary.withValues(
                alpha: isLight ? 0.7 : 0.6,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'No projects yet',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap + to create your first project',
            style: TextStyle(
              fontSize: 14,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
