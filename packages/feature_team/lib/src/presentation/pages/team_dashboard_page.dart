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
class TeamDashboardPage extends ConsumerWidget {
  const TeamDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final team = ref.watch(currentTeamProvider);
    final members = ref.watch(membersProvider).valueOrNull ?? [];
    final activities = ref.watch(teamActivityProvider).valueOrNull ?? [];
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
