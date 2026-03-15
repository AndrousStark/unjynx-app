import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'channel_status_indicator.dart';

/// A card displaying a notification channel's connection status.
///
/// Shows the channel icon, name, status indicator, and an action button
/// (Connect or Test). Gold accent for primary channel, purple for others.
class ChannelCard extends StatelessWidget {
  const ChannelCard({
    super.key,
    required this.channelType,
    required this.isConnected,
    required this.isPrimary,
    required this.onConnect,
    required this.onTest,
    this.displayName,
    this.lastVerified,
  });

  final String channelType;
  final bool isConnected;
  final bool isPrimary;
  final String? displayName;
  final DateTime? lastVerified;
  final VoidCallback onConnect;
  final VoidCallback onTest;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final iconColor = _resolveChannelColor(channelType, ux, colorScheme);

    return PressableScale(
      onTap: isConnected ? onTest : onConnect,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: isLight
              ? Colors.white.withValues(alpha: 0.7)
              : colorScheme.surfaceContainer.withValues(alpha: 0.5),
          border: Border.all(
            color: isPrimary
                ? ux.gold.withValues(alpha: isLight ? 0.4 : 0.3)
                : isConnected
                    ? ux.success.withValues(alpha: isLight ? 0.3 : 0.2)
                    : isLight
                        ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                        : ux.glassBorder,
            width: isPrimary ? 1.5 : 0.5,
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Icon row
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color:
                        iconColor.withValues(alpha: isLight ? 0.10 : 0.15),
                  ),
                  child: Icon(
                    _channelIcon(channelType),
                    size: 20,
                    color: iconColor,
                  ),
                ),
                const Spacer(),
                ChannelStatusIndicator(
                  status: isConnected
                      ? ChannelStatus.connected
                      : ChannelStatus.disconnected,
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Channel name
            Text(
              _channelLabel(channelType),
              style: textTheme.titleMedium?.copyWith(
                color: colorScheme.onSurface,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),

            // Status text
            const SizedBox(height: 2),
            Text(
              isConnected ? 'Connected' : 'Not connected',
              style: textTheme.bodySmall?.copyWith(
                fontSize: 11,
                color: isConnected
                    ? ux.success.withValues(alpha: isLight ? 0.8 : 0.7)
                    : colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.5 : 0.4),
              ),
            ),

            // Primary badge
            if (isPrimary) ...[
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  color: ux.goldWash,
                  border: Border.all(
                    color: ux.gold.withValues(alpha: isLight ? 0.3 : 0.2),
                    width: 0.5,
                  ),
                ),
                child: Text(
                  'Primary',
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: isLight ? ux.darkGold : ux.gold,
                  ),
                ),
              ),
            ],
          ],
        ),
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
      'push' => 'Push',
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
