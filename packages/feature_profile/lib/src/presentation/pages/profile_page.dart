import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_auth/service_auth.dart';
import 'package:unjynx_core/core.dart';

import '../providers/profile_providers.dart';
import '../widgets/activity_heatmap.dart';
import '../widgets/connected_channels_row.dart';
import '../widgets/profile_header.dart';
import '../widgets/stats_card.dart';

/// L1 - Full profile page with stats, quick links, heatmap, channels.
class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final userAsync = ref.watch(currentUserProvider);
    final statsAsync = ref.watch(userStatsProvider);
    final heatmapAsync = ref.watch(profileActivityHeatmapProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Collapsing header with avatar
          SliverToBoxAdapter(
            child: userAsync.when(
              data: (user) => ProfileHeader(user: user),
              loading: () => const ProfileHeader(user: null),
              error: (_, __) => const ProfileHeader(user: null),
            ),
          ),

          // Staggered profile sections
          SliverToBoxAdapter(
            child: StaggeredColumn(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Stats row
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: statsAsync.when(
                    data: (stats) => StatsCard(
                      tasksCompleted: stats.tasksCompleted,
                      currentStreak: stats.currentStreak,
                      totalXp: stats.totalXp,
                    ),
                    loading: () => const StatsCard(),
                    error: (_, __) => const StatsCard(),
                  ),
                ),

                // Quick links
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 20, 12, 0),
                  child: _QuickLinksGrid(),
                ),

                // Activity heatmap (GitHub-style)
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 20, 12, 0),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.grid_on_rounded,
                                size: 18,
                                color: colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Activity',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          heatmapAsync.when(
                            data: (data) => ActivityHeatmap(activityData: data),
                            loading: () => const ActivityHeatmap(),
                            error: (_, __) => const ActivityHeatmap(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Connected channels
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.link_rounded,
                                size: 18,
                                color: colorScheme.primary,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Connected Channels',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: colorScheme.onSurface,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ConnectedChannelsRow(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              GoRouter.of(context)
                                  .push('/notifications/channels');
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Account actions
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
                  child: Card(
                    child: Column(
                      children: [
                        ListTile(
                          leading: Icon(
                            Icons.person_outline,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          title: const Text('Edit Profile'),
                          trailing: Icon(
                            Icons.chevron_right,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          onTap: () {
                            HapticFeedback.lightImpact();
                            GoRouter.of(context).push('/profile/edit');
                          },
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: Icon(
                            Icons.settings_outlined,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          title: const Text('Settings'),
                          trailing: Icon(
                            Icons.chevron_right,
                            color: colorScheme.onSurfaceVariant,
                          ),
                          onTap: () {
                            HapticFeedback.lightImpact();
                            GoRouter.of(context).push('/settings');
                          },
                        ),
                      ],
                    ),
                  ),
                ),

                // Sign out
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 16, 12, 0),
                  child: Card(
                    child: ListTile(
                      leading: Icon(
                        Icons.logout,
                        color: colorScheme.error,
                      ),
                      title: Text(
                        'Sign Out',
                        style: TextStyle(color: colorScheme.error),
                      ),
                      onTap: () => _confirmSignOut(context, ref),
                    ),
                  ),
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _confirmSignOut(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;

    showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Sign Out?'),
        content: const Text(
          'Your data is saved locally and will sync when you sign back in.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: colorScheme.error,
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    ).then((confirmed) async {
      if (confirmed == true) {
        await ref.read(authNotifierProvider.notifier).signOut();
        if (context.mounted) {
          GoRouter.of(context).go('/login');
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Quick links grid
// ---------------------------------------------------------------------------

class _QuickLinksGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final links = [
      _QuickLink(
        icon: Icons.insights_rounded,
        label: 'Progress Hub',
        route: '/progress',
        color: colorScheme.primary,
      ),
      _QuickLink(
        icon: Icons.bar_chart_rounded,
        label: 'Dashboard',
        route: '/gamification/dashboard',
        color: ux.gold,
      ),
      _QuickLink(
        icon: Icons.people_outline_rounded,
        label: 'Accountability',
        route: '/gamification/accountability',
        color: ux.success,
      ),
      _QuickLink(
        icon: Icons.sports_esports_rounded,
        label: 'Game Mode',
        route: '/gamification/game-mode',
        color: ux.info,
      ),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      childAspectRatio: 0.85,
      crossAxisSpacing: 8,
      mainAxisSpacing: 8,
      children: links.map((link) {
        return GestureDetector(
          onTap: () => GoRouter.of(context).push(link.route),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: link.color
                      .withValues(alpha: isLight ? 0.1 : 0.15),
                ),
                child: Icon(link.icon, size: 22, color: link.color),
              ),
              const SizedBox(height: 6),
              Text(
                link.label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _QuickLink {
  final IconData icon;
  final String label;
  final String route;
  final Color color;

  const _QuickLink({
    required this.icon,
    required this.label,
    required this.route,
    required this.color,
  });
}
