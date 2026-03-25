import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';
import '../providers/team_providers.dart';
import '../widgets/invite_dialog.dart';
import '../widgets/team_activity_feed.dart';
import '../widgets/team_completion_rings.dart';
import '../widgets/workload_heatmap.dart';

/// N1 -- Team Dashboard page.
///
/// Shows team overview: completion rings, active projects, activity feed,
/// upcoming deadlines, workload heatmap, and quick action buttons.
///
/// When no team exists, shows a "Create Team" call-to-action.
class TeamDashboardPage extends ConsumerWidget {
  const TeamDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(currentTeamProvider);

    return teamAsync.when(
      data: (team) {
        if (team == null) {
          return _NoTeamView();
        }
        return _TeamDashboardContent(key: ValueKey(team.id));
      },
      loading: () => Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const UnjynxShimmerBox(
                height: 200,
                width: 200,
                borderRadius: 100,
              ),
              const SizedBox(height: 24),
              Text(
                'Loading your team...',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
      error: (_, __) => _NoTeamView(),
    );
  }
}

/// Shown when the user has no team yet.
class _NoTeamView extends ConsumerStatefulWidget {
  @override
  ConsumerState<_NoTeamView> createState() => _NoTeamViewState();
}

class _NoTeamViewState extends ConsumerState<_NoTeamView> {
  bool _isCreating = false;
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

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
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: colorScheme.primary.withValues(
                        alpha: isLight ? 0.1 : 0.12,
                      ),
                    ),
                    child: Icon(
                      Icons.groups_rounded,
                      size: 56,
                      color: colorScheme.primary.withValues(
                        alpha: isLight ? 0.6 : 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Title
                  Text(
                    'No Team Yet',
                    style: textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subtitle
                  Text(
                    'Create a team to collaborate with others, '
                    'share projects, and track progress together.',
                    textAlign: TextAlign.center,
                    style: textTheme.bodyMedium?.copyWith(
                      fontSize: 15,
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.7 : 0.55,
                      ),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Create Team button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isCreating ? null : () => _showCreateTeamDialog(context),
                      icon: _isCreating
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.add_rounded),
                      label: Text(_isCreating ? 'Creating...' : 'Create a Team'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Info text
                  Text(
                    'Team features require a Team or higher plan.',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant.withValues(
                        alpha: isLight ? 0.5 : 0.4,
                      ),
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

  Future<void> _showCreateTeamDialog(BuildContext context) async {
    final colorScheme = Theme.of(context).colorScheme;

    final name = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Create Team'),
        content: TextField(
          controller: _nameController,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Team name',
            prefixIcon: Icon(Icons.group_add_rounded, size: 20),
          ),
          textCapitalization: TextCapitalization.words,
          onSubmitted: (value) => Navigator.pop(dialogContext, value.trim()),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () =>
                Navigator.pop(dialogContext, _nameController.text.trim()),
            child: const Text('Create'),
          ),
        ],
      ),
    );

    if (name == null || name.isEmpty || !mounted) return;

    setState(() => _isCreating = true);
    HapticFeedback.mediumImpact();

    try {
      final idempotencyKey =
          'create-team-${DateTime.now().microsecondsSinceEpoch}';
      final team = await ref.read(currentTeamProvider.notifier).createTeam(
        name: name,
        idempotencyKey: idempotencyKey,
      );

      if (!mounted) return;

      if (team != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Team "${team.name}" created!'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Failed to create team. Please check your connection and try again.',
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCreating = false);
        _nameController.clear();
      }
    }
  }
}

/// Main dashboard content when a team exists.
class _TeamDashboardContent extends ConsumerWidget {
  const _TeamDashboardContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final team = ref.watch(currentTeamValueProvider);
    final members = ref.watch(membersProvider).value ?? [];
    final activities = ref.watch(teamActivityProvider).value ?? [];
    final reportAsync = ref.watch(teamReportProvider);

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
            onRefresh: () async {
              ref.invalidate(currentTeamProvider);
              ref.invalidate(membersProvider);
              ref.invalidate(teamActivityProvider);
              ref.invalidate(teamReportProvider);
            },
            color: ux.gold,
            child: CustomScrollView(
              slivers: [
              // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  team?.name ?? 'My Team',
                                  style: textTheme.headlineMedium?.copyWith(
                                    fontSize: 28,
                                    fontWeight: isLight
                                        ? FontWeight.w800
                                        : FontWeight.bold,
                                    color: colorScheme.onSurface,
                                    height: 1.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${members.length} member${members.length == 1 ? '' : 's'}',
                                  style: textTheme.bodyMedium?.copyWith(
                                    fontSize: 15,
                                    color: colorScheme.onSurfaceVariant
                                        .withValues(
                                      alpha: isLight ? 0.7 : 0.55,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (team?.logoUrl != null)
                            CircleAvatar(
                              radius: 22,
                              backgroundImage: NetworkImage(team!.logoUrl!),
                            )
                          else
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: colorScheme.primary.withValues(
                                alpha: isLight ? 0.12 : 0.15,
                              ),
                              child: Icon(
                                Icons.groups_rounded,
                                color: colorScheme.primary,
                                size: 24,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Completion Rings
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  child: Center(
                    child: reportAsync.when(
                      data: (report) => TeamCompletionRings(
                        completionRate: report.completionRate,
                        onTimeRate: 0.0,
                        activeMemberRate: members.isEmpty
                            ? 0.0
                            : members
                                    .where(
                                      (m) =>
                                          m.status ==
                                          MemberStatus.active,
                                    )
                                    .length /
                                members.length,
                      ),
                      loading: () => const TeamCompletionRings(
                        completionRate: 0,
                        onTimeRate: 0,
                        activeMemberRate: 0,
                      ),
                      error: (_, __) => const TeamCompletionRings(
                        completionRate: 0,
                        onTimeRate: 0,
                        activeMemberRate: 0,
                      ),
                    ),
                  ),
                ),
              ),

              // Quick Actions
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    children: [
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.person_add_rounded,
                          label: 'Invite',
                          onTap: () {
                            HapticFeedback.lightImpact();
                            showInviteSheet(context);
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.create_new_folder_rounded,
                          label: 'New Project',
                          onTap: () {
                            HapticFeedback.lightImpact();
                            GoRouter.of(context).push('/projects');
                          },
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _QuickAction(
                          icon: Icons.analytics_rounded,
                          label: 'Reports',
                          onTap: () {
                            HapticFeedback.lightImpact();
                            GoRouter.of(context).push('/team/reports');
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),

              // Workload Heatmap
              if (members.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Container(
                      decoration: BoxDecoration(
                        color: colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: isLight
                            ? Border.all(
                                color: colorScheme.primary
                                    .withValues(alpha: 0.1),
                              )
                            : null,
                        boxShadow: isLight
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF1A0533)
                                      .withValues(alpha: 0.06),
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                                BoxShadow(
                                  color: const Color(0xFF1A0533)
                                      .withValues(alpha: 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : null,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: WorkloadHeatmap(members: members),
                      ),
                    ),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 16)),

              // Activity Feed
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Container(
                    decoration: BoxDecoration(
                      color: colorScheme.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: isLight
                          ? Border.all(
                              color: colorScheme.primary
                                  .withValues(alpha: 0.1),
                            )
                          : null,
                      boxShadow: isLight
                          ? [
                              BoxShadow(
                                color: const Color(0xFF1A0533)
                                    .withValues(alpha: 0.06),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                              BoxShadow(
                                color: const Color(0xFF1A0533)
                                    .withValues(alpha: 0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: TeamActivityFeed(activities: activities),
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

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isLight
                ? Colors.white.withValues(alpha: 0.7)
                : colorScheme.surfaceContainer.withValues(alpha: 0.5),
            border: Border.all(
              color: isLight
                  ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                  : ux.glassBorder,
              width: 0.5,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 22, color: colorScheme.primary),
              const SizedBox(height: 6),
              Text(
                label,
                style: textTheme.labelMedium?.copyWith(
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
