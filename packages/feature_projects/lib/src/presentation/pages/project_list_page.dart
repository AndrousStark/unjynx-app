import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/project_providers.dart';
import '../widgets/create_project_sheet.dart';
import '../widgets/project_card.dart';

/// Main projects list page.
class ProjectListPage extends ConsumerWidget {
  const ProjectListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final projectsAsync = ref.watch(projectListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Projects')),
      body: RefreshIndicator(
        color: colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(projectListProvider);
        },
        child: projectsAsync.when(
          data: (projects) => projects.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: const [_EmptyState()],
                )
              : ListView.separated(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  itemCount: projects.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final project = projects[index];
                    return ProjectCard(
                      project: project,
                      onTap: () =>
                          GoRouter.of(context).push('/projects/${project.id}'),
                      onArchive: () async {
                        final archiveProject =
                            ref.read(archiveProjectProvider);
                        await archiveProject(project.id);
                        ref.invalidate(projectListProvider);
                      },
                    );
                  },
                ),
          loading: () => Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: List.generate(5, (i) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: UnjynxShimmerBox(height: 80, borderRadius: 16),
              )),
            ),
          ),
          error: (error, _) => Center(
            child: Text(
              'Failed to load projects: $error',
              style: TextStyle(color: colorScheme.error),
            ),
          ),
        ),
      ),
      floatingActionButton: Semantics(
        label: 'Create new project',
        button: true,
        child: FloatingActionButton(
          onPressed: () {
            HapticFeedback.lightImpact();
            _showCreateSheet(context);
          },
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
