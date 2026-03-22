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
      appBar: AppBar(title: Text(unjynxLabelWidget(ref, 'Projects'))),
      body: RefreshIndicator(
        color: colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(projectListProvider);
        },
        child: projectsAsync.when(
          data: (projects) => projects.isEmpty
              ? ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    UnjynxEmptyState(
                      type: EmptyStateType.noProjects,
                      onAction: () => _showCreateSheet(context),
                    ),
                  ],
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
              children: List.generate(5, (i) => const Padding(
                padding: EdgeInsets.only(bottom: 12),
                child: UnjynxShimmerBox(height: 80, borderRadius: 16),
              )),
            ),
          ),
          error: (error, _) => UnjynxErrorView(
            type: ErrorViewType.serverError,
            onRetry: () => ref.invalidate(projectListProvider),
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

// Old _EmptyState replaced by UnjynxEmptyState from unjynx_core.
