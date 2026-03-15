import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/notification_channel.dart';
import '../providers/channel_connection_providers.dart';
import '../providers/notification_providers.dart';

/// J3 — Test Notification page.
///
/// Lists connected channels with "Send Test" button next to each.
/// Shows delivery status with animated check/cross icons.
class TestNotificationPage extends ConsumerWidget {
  const TestNotificationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final connected = ref.watch(connectedChannelsProvider);

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
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 24, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () =>
                          GoRouter.of(context).go('/notifications'),
                      icon: Icon(
                        Icons.arrow_back_rounded,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Test Notifications',
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
                  'Send a test message to verify each channel works',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.7 : 0.55),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Connected channels list
              Expanded(
                child: connected.isEmpty
                    ? _EmptyState(isLight: isLight)
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: connected.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final channel = connected[index];
                          return _TestChannelRow(
                            channel: channel,
                            onSendTest: () =>
                                _sendTest(ref, channel.type),
                          );
                        },
                      ),
              ),

              // Send to All button
              if (connected.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: () => _sendToAll(ref, connected),
                      icon: const Icon(Icons.send_rounded, size: 20),
                      label: Text(
                        'Send to All',
                        style: textTheme.titleMedium?.copyWith(
                          color:
                              isLight ? const Color(0xFF1A0533) : Colors.black,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ux.gold,
                        foregroundColor:
                            isLight ? const Color(0xFF1A0533) : Colors.black,
                        elevation: isLight ? 2 : 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _sendTest(WidgetRef ref, String channelType) async {
    HapticFeedback.mediumImpact();
    await sendTestViaApi(ref, channelType);
  }

  Future<void> _sendToAll(
    WidgetRef ref,
    List<NotificationChannel> channels,
  ) async {
    HapticFeedback.mediumImpact();
    for (final channel in channels) {
      await _sendTest(ref, channel.type);
    }
  }
}

/// A single test channel row that properly animates status transitions.
class _TestChannelRow extends ConsumerStatefulWidget {
  const _TestChannelRow({
    required this.channel,
    required this.onSendTest,
  });

  final NotificationChannel channel;
  final VoidCallback onSendTest;

  @override
  ConsumerState<_TestChannelRow> createState() => _TestChannelRowState();
}

class _TestChannelRowState extends ConsumerState<_TestChannelRow>
    with SingleTickerProviderStateMixin {
  late AnimationController _scaleController;
  late Animation<double> _scaleAnimation;
  TestState? _previousState;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _scaleController, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final testState =
        ref.watch(testNotificationStateProvider(widget.channel.type));
    final iconColor =
        _resolveChannelColor(widget.channel.type, ux, colorScheme);

    // Trigger animation when state changes to delivered or failed
    if (testState != _previousState) {
      if (testState == TestState.delivered || testState == TestState.failed) {
        _scaleController.forward(from: 0.0);
      }
      _previousState = testState;
    }

    return Container(
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
                  color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Row(
        children: [
          // Channel icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: iconColor.withValues(alpha: isLight ? 0.10 : 0.15),
            ),
            child: Icon(
              _channelIcon(widget.channel.type),
              size: 22,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 14),

          // Label + display name
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _channelLabel(widget.channel.type),
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                if (widget.channel.displayName != null)
                  Text(
                    widget.channel.displayName!,
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.6 : 0.5),
                    ),
                  ),
              ],
            ),
          ),

          // Status / Send button
          _buildAction(context, testState, ux, isLight, textTheme),
        ],
      ),
    );
  }

  Widget _buildAction(
    BuildContext context,
    TestState testState,
    UnjynxCustomColors ux,
    bool isLight,
    TextTheme textTheme,
  ) {
    switch (testState) {
      case TestState.idle:
        return ElevatedButton(
          onPressed: widget.onSendTest,
          style: ElevatedButton.styleFrom(
            backgroundColor: ux.gold,
            foregroundColor: isLight ? const Color(0xFF1A0533) : Colors.black,
            elevation: 0,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            minimumSize: const Size(44, 44),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Text(
            'Send Test',
            style: textTheme.labelMedium?.copyWith(
              color: isLight ? const Color(0xFF1A0533) : Colors.black,
            ),
          ),
        );
      case TestState.sending:
        return SizedBox(
          width: 44,
          height: 44,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: ux.gold,
            ),
          ),
        );
      case TestState.delivered:
        return SizedBox(
          width: 44,
          height: 44,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Icon(
              Icons.check_circle_rounded,
              color: ux.success,
              size: 28,
            ),
          ),
        );
      case TestState.failed:
        return SizedBox(
          width: 44,
          height: 44,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Icon(
              Icons.cancel_rounded,
              color: Theme.of(context).colorScheme.error,
              size: 28,
            ),
          ),
        );
    }
  }

  Color _resolveChannelColor(
    String channelType,
    UnjynxCustomColors ux,
    ColorScheme colorScheme,
  ) {
    return switch (channelType) {
      'push' => colorScheme.primary,
      'whatsapp' => ux.whatsapp,
      'telegram' => ux.telegram,
      'instagram' => ux.instagram,
      'discord' => ux.discord,
      'slack' => ux.slack,
      'email' => ux.email,
      'sms' => const Color(0xFFFFA726),
      _ => colorScheme.primary,
    };
  }

  IconData _channelIcon(String type) {
    return switch (type) {
      'push' => Icons.notifications_active_rounded,
      'telegram' => Icons.telegram,
      'email' => Icons.email_rounded,
      'whatsapp' => Icons.chat_rounded,
      'sms' => Icons.sms_rounded,
      'instagram' => Icons.camera_alt_rounded,
      'slack' => Icons.tag_rounded,
      'discord' => Icons.headset_mic_rounded,
      _ => Icons.notifications_rounded,
    };
  }

  String _channelLabel(String type) {
    return switch (type) {
      'push' => 'Push Notifications',
      'telegram' => 'Telegram',
      'email' => 'Email',
      'whatsapp' => 'WhatsApp',
      'sms' => 'SMS',
      'instagram' => 'Instagram',
      'slack' => 'Slack',
      'discord' => 'Discord',
      _ => type,
    };
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.isLight});

  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.notifications_off_rounded,
              size: 64,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.3 : 0.2),
            ),
            const SizedBox(height: 16),
            Text(
              'No channels connected',
              style: textTheme.headlineSmall?.copyWith(
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Connect a channel first to send test notifications',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.6 : 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
