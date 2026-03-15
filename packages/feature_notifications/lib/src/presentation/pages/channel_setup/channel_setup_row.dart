import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../providers/channel_connection_providers.dart';
import '../../widgets/channel_status_indicator.dart';

/// A single row in the channel list showing channel info, status, and
/// connect / disconnect actions.
class ChannelSetupRow extends StatelessWidget {
  const ChannelSetupRow({
    super.key,
    required this.channelType,
    required this.isConnected,
    required this.connectionState,
    required this.onConnect,
    required this.onDisconnect,
    this.displayName,
  });

  final String channelType;
  final bool isConnected;
  final String? displayName;
  final ChannelConnectionState connectionState;
  final VoidCallback onConnect;
  final VoidCallback onDisconnect;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final iconColor = _resolveChannelColor(channelType, ux, colorScheme);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isLight
            ? Colors.white.withValues(alpha: 0.7)
            : colorScheme.surfaceContainer.withValues(alpha: 0.5),
        border: Border.all(
          color: isConnected
              ? ux.success.withValues(alpha: isLight ? 0.4 : 0.3)
              : isLight
                  ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                  : ux.glassBorder,
          width: isConnected ? 1 : 0.5,
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
              _channelIcon(channelType),
              size: 22,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 14),

          // Name + status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      _channelLabel(channelType),
                      style: textTheme.titleMedium?.copyWith(
                        color: colorScheme.onSurface,
                      ),
                    ),
                    if (isConnected) ...[
                      const SizedBox(width: 8),
                      const ChannelStatusIndicator(
                        status: ChannelStatus.connected,
                      ),
                    ],
                  ],
                ),
                if (displayName != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      displayName!,
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.6 : 0.5),
                      ),
                    ),
                  ),
                Text(
                  _channelDescription(channelType),
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.5 : 0.4),
                  ),
                ),
              ],
            ),
          ),

          // Connect/Disconnect button
          if (connectionState == ChannelConnectionState.connecting)
            const SizedBox(
              width: 44,
              height: 44,
              child: Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (isConnected)
            TextButton(
              onPressed: onDisconnect,
              style: TextButton.styleFrom(
                foregroundColor: colorScheme.error,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                minimumSize: const Size(44, 44),
              ),
              child: Text(
                'Disconnect',
                style: textTheme.labelMedium?.copyWith(
                  color: colorScheme.error,
                ),
              ),
            )
          else
            ElevatedButton(
              onPressed: onConnect,
              style: ElevatedButton.styleFrom(
                backgroundColor: ux.gold,
                foregroundColor:
                    isLight ? const Color(0xFF1A0533) : Colors.black,
                elevation: isLight ? 1 : 0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                minimumSize: const Size(44, 44),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                'Connect',
                style: textTheme.labelMedium?.copyWith(
                  color:
                      isLight ? const Color(0xFF1A0533) : Colors.black,
                ),
              ),
            ),
        ],
      ),
    );
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

  String _channelDescription(String type) {
    return switch (type) {
      'push' => 'Request device notification permission',
      'telegram' => 'Start our bot and enter verification code',
      'email' => 'Enter email and verify via magic link',
      'whatsapp' => 'Enter phone number with country code',
      'sms' => 'Enter phone number for text messages',
      'instagram' => 'Enter username, follow-back required',
      'slack' => 'Connect via OAuth (simulated)',
      'discord' => 'Connect via OAuth (simulated)',
      _ => 'Connect this channel',
    };
  }
}
