import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/notification_channel.dart';
import '../providers/notification_providers.dart';
import '../widgets/channel_card.dart';

/// J1 — Notification Hub overview page.
///
/// Shows connected channels at a glance with cards for each channel type,
/// grouped by category (Messaging, Social, Standard). Includes a master
/// toggle to enable/disable all notifications.
class NotificationHubPage extends ConsumerWidget {
  const NotificationHubPage({super.key});

  /// Channel categories for grouped display.
  static const _categories = <String, List<String>>{
    'Messaging': ['whatsapp', 'telegram', 'sms'],
    'Social': ['instagram', 'discord', 'slack'],
    'Standard': ['push', 'email'],
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final channelsAsync = ref.watch(channelsProvider);
    final channels = channelsAsync.value ?? [];
    final prefs = ref.watch(preferencesProvider);

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
            color: Theme.of(context).colorScheme.primary,
            onRefresh: () async {
              ref.invalidate(channelsProvider);
            },
            child: CustomScrollView(
              slivers: [
                // Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Notification Hub',
                        style: textTheme.headlineMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Manage your delivery channels',
                        style: textTheme.bodyMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant
                              .withValues(alpha: isLight ? 0.7 : 0.55),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Master toggle
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 4, 24, 16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: isLight
                          ? Colors.white.withValues(alpha: 0.7)
                          : colorScheme.surfaceContainer
                              .withValues(alpha: 0.5),
                      border: Border.all(
                        color: isLight
                            ? colorScheme.outlineVariant
                                .withValues(alpha: 0.4)
                            : ux.glassBorder,
                        width: 0.5,
                      ),
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
                    child: Row(
                      children: [
                        Icon(
                          Icons.notifications_active_rounded,
                          size: 22,
                          color: isLight
                              ? ux.deepPurple
                              : colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Enable All Notifications',
                            style: textTheme.titleMedium?.copyWith(
                              color: colorScheme.onSurface,
                            ),
                          ),
                        ),
                        SizedBox(
                          width: 44,
                          height: 44,
                          child: FittedBox(
                            child: Switch.adaptive(
                              value: prefs.notificationsEnabled,
                              onChanged: (value) {
                                HapticFeedback.selectionClick();
                                ref
                                    .read(preferencesProvider.notifier)
                                    .updatePreferences(
                                      prefs.copyWith(
                                        notificationsEnabled: value,
                                      ),
                                    );
                              },
                              activeColor: ux.gold,
                              activeTrackColor: ux.goldWash,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Channel grid grouped by category
              if (channelsAsync.isLoading)
                ...[
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    sliver: SliverGrid.count(
                      crossAxisCount: 2,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.35,
                      children: List.generate(8, (_) => const UnjynxShimmerBox(
                        height: 100,
                        width: double.infinity,
                        borderRadius: 16,
                      )),
                    ),
                  ),
                ]
              else
                ..._categories.entries.expand((entry) {
                  final categoryName = entry.key;
                  final categoryTypes = entry.value;

                  return [
                    // Category header
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
                        child: Text(
                          categoryName,
                          style: textTheme.titleMedium?.copyWith(
                            color: colorScheme.onSurface,
                          ),
                        ),
                      ),
                    ),

                    // Category grid
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      sliver: SliverGrid.count(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.35,
                        children: categoryTypes.map((type) {
                          final channel = _findChannel(channels, type);
                          final isConnected = channel?.isConnected ?? false;
                          final isPrimary = prefs.primaryChannel == type;
                          return ChannelCard(
                            channelType: type,
                            displayName: channel?.displayName,
                            isConnected: isConnected,
                            isPrimary: isPrimary,
                            lastVerified: channel?.lastVerified,
                            onConnect: () {
                              HapticFeedback.lightImpact();
                              GoRouter.of(context)
                                  .go('/notifications/channels');
                            },
                            onTest: () {
                              HapticFeedback.lightImpact();
                              GoRouter.of(context).go('/notifications/test');
                            },
                          );
                        }).toList(),
                      ),
                    ),

                    const SliverToBoxAdapter(child: SizedBox(height: 12)),
                  ];
                }),

              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              // Quick links section
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Settings',
                    style: textTheme.headlineSmall?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 12)),

              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      _QuickLinkTile(
                        icon: Icons.swap_vert_rounded,
                        label: 'Escalation Chain',
                        subtitle: 'Configure fallback delivery order',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          GoRouter.of(context)
                              .go('/notifications/escalation');
                        },
                      ),
                      const SizedBox(height: 8),
                      _QuickLinkTile(
                        icon: Icons.do_not_disturb_on_rounded,
                        label: 'Quiet Hours',
                        subtitle: 'Set do-not-disturb windows',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          GoRouter.of(context)
                              .go('/notifications/quiet-hours');
                        },
                      ),
                      const SizedBox(height: 8),
                      _QuickLinkTile(
                        icon: Icons.history_rounded,
                        label: 'Delivery History',
                        subtitle: 'View recent notification logs',
                        onTap: () {
                          HapticFeedback.lightImpact();
                          GoRouter.of(context)
                              .go('/notifications/history');
                        },
                      ),
                    ],
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

  NotificationChannel? _findChannel(
    List<NotificationChannel> channels,
    String type,
  ) {
    for (final channel in channels) {
      if (channel.type == type) return channel;
    }
    return null;
  }
}

class _QuickLinkTile extends StatelessWidget {
  const _QuickLinkTile({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String subtitle;
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
          padding: const EdgeInsets.all(16),
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
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color:
                      ux.deepPurple.withValues(alpha: isLight ? 0.08 : 0.2),
                ),
                child: Icon(
                  icon,
                  size: 22,
                  color: isLight ? ux.deepPurple : colorScheme.primary,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: textTheme.titleMedium?.copyWith(
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.6 : 0.5),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 44,
                height: 44,
                child: Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.5 : 0.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
