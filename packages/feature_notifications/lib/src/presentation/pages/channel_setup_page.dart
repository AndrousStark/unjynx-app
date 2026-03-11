import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/notification_channel.dart';
import '../providers/channel_connection_providers.dart';
import '../providers/notification_providers.dart';
import 'channel_setup/channel_setup_row.dart';
import 'channel_setup/channel_setup_sheet.dart';

/// Re-export [ChannelSetupResult] and [ChannelSetupSheet] so that existing
/// imports of this file continue to compile without changes.
export 'channel_setup/channel_setup_sheet.dart'
    show ChannelSetupResult, ChannelSetupSheet;

/// J2 — Channel Setup page.
///
/// Step-by-step channel connection flow. Each channel type has its own
/// connection UI (push permission, bot link, email verify, phone OTP, etc.).
class ChannelSetupPage extends ConsumerWidget {
  const ChannelSetupPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final channelsAsync = ref.watch(channelsProvider);
    final channels = channelsAsync.valueOrNull ?? [];

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
          child: Column(
            children: [
              // App bar
              _buildAppBar(context, colorScheme, textTheme, isLight),
              const SizedBox(height: 16),

              // Channel list
              Expanded(
                child: channelsAsync.isLoading
                    ? _buildShimmerList()
                    : _buildChannelList(context, ref, channels),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(
    BuildContext context,
    ColorScheme colorScheme,
    TextTheme textTheme,
    bool isLight,
  ) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 24, 0),
          child: Row(
            children: [
              IconButton(
                onPressed: () => GoRouter.of(context).go('/notifications'),
                icon: Icon(
                  Icons.arrow_back_rounded,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'Connect Channels',
                  style: textTheme.headlineMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'Connect channels to receive reminders wherever you are',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.7 : 0.55),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildShimmerList() {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: 6,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) => const UnjynxShimmerBox(
        height: 80,
        width: double.infinity,
        borderRadius: 16,
      ),
    );
  }

  Widget _buildChannelList(
    BuildContext context,
    WidgetRef ref,
    List<NotificationChannel> channels,
  ) {
    return RefreshIndicator(
      color: Theme.of(context).colorScheme.primary,
      onRefresh: () async {
        ref.invalidate(channelsProvider);
      },
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        itemCount: ChannelTypes.all.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final type = ChannelTypes.all[index];
          final existing = _findChannel(channels, type);
          final isConnected = existing?.isConnected ?? false;
          final connectionState =
              ref.watch(channelConnectionStateProvider(type));

          return ChannelSetupRow(
            channelType: type,
            isConnected: isConnected,
            displayName: existing?.displayName,
            connectionState: connectionState,
            onConnect: () => _connectChannel(context, ref, type),
            onDisconnect: () => _disconnectChannel(ref, type),
          );
        },
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

  Future<void> _connectChannel(
    BuildContext context,
    WidgetRef ref,
    String type,
  ) async {
    HapticFeedback.mediumImpact();

    // Show channel-specific setup dialog
    final result = await showModalBottomSheet<ChannelSetupResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ChannelSetupSheet(channelType: type),
    );

    if (result == null) return;

    await connectChannelViaApi(
      ref,
      type,
      result.identifier,
      displayName: result.displayName,
    );
  }

  Future<void> _disconnectChannel(WidgetRef ref, String type) async {
    HapticFeedback.mediumImpact();
    await disconnectChannelViaApi(ref, type);
  }
}
