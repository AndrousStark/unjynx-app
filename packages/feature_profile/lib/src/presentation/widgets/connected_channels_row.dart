import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Data class representing a channel's display status.
class ChannelDisplayData {
  final IconData icon;
  final String label;
  final Color color;
  final bool isConnected;

  const ChannelDisplayData({
    required this.icon,
    required this.label,
    required this.color,
    required this.isConnected,
  });
}

/// Row of connected channel icons with status dots.
///
/// Accepts [channels] to display real data instead of hardcoded values.
/// When [onTap] is provided, tapping a channel icon invokes it.
/// If [channels] is null, shows the default set of channels as disconnected.
class ConnectedChannelsRow extends StatelessWidget {
  const ConnectedChannelsRow({
    this.channels,
    this.onTap,
    super.key,
  });

  /// Channel display data. If null, shows default channels (all disconnected).
  final List<ChannelDisplayData>? channels;

  /// Callback invoked when any channel icon is tapped.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final displayChannels = channels ??
        [
          ChannelDisplayData(
            icon: Icons.notifications_rounded,
            label: 'Push',
            color: Theme.of(context).colorScheme.primary,
            isConnected: false,
          ),
          ChannelDisplayData(
            icon: Icons.telegram,
            label: 'Telegram',
            color: ux.telegram,
            isConnected: false,
          ),
          ChannelDisplayData(
            icon: Icons.chat_rounded,
            label: 'WhatsApp',
            color: ux.whatsapp,
            isConnected: false,
          ),
          ChannelDisplayData(
            icon: Icons.email_outlined,
            label: 'Email',
            color: ux.email,
            isConnected: false,
          ),
          ChannelDisplayData(
            icon: Icons.discord,
            label: 'Discord',
            color: ux.discord,
            isConnected: false,
          ),
          ChannelDisplayData(
            icon: Icons.tag,
            label: 'Slack',
            color: ux.slack,
            isConnected: false,
          ),
        ];

    return Wrap(
      spacing: 16,
      runSpacing: 12,
      children: displayChannels.map((ch) {
        return GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap?.call();
          },
          child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: ch.color
                        .withValues(alpha: isLight ? 0.1 : 0.15),
                  ),
                  child: Icon(ch.icon, size: 20, color: ch.color),
                ),
                // Status dot
                Positioned(
                  right: -2,
                  bottom: -2,
                  child: Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: ch.isConnected
                          ? ux.success
                          : ux.textDisabled,
                      border: Border.all(
                        color: Theme.of(context).colorScheme.surface,
                        width: 2,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              ch.label,
              style: TextStyle(
                fontSize: 10,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
          ),
        );
      }).toList(),
    );
  }
}
