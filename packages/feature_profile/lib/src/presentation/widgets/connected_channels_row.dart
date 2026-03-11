import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Row of connected channel icons with status dots.
class ConnectedChannelsRow extends StatelessWidget {
  const ConnectedChannelsRow({super.key});

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    // Mock connected channels. In production, watch a provider.
    final channels = [
      _ChannelStatus(
        icon: Icons.notifications_rounded,
        label: 'Push',
        color: Theme.of(context).colorScheme.primary,
        isConnected: true,
      ),
      _ChannelStatus(
        icon: Icons.telegram,
        label: 'Telegram',
        color: ux.telegram,
        isConnected: true,
      ),
      _ChannelStatus(
        icon: Icons.chat_rounded,
        label: 'WhatsApp',
        color: ux.whatsapp,
        isConnected: false,
      ),
      _ChannelStatus(
        icon: Icons.email_outlined,
        label: 'Email',
        color: ux.email,
        isConnected: true,
      ),
      _ChannelStatus(
        icon: Icons.discord,
        label: 'Discord',
        color: ux.discord,
        isConnected: false,
      ),
      _ChannelStatus(
        icon: Icons.tag,
        label: 'Slack',
        color: ux.slack,
        isConnected: false,
      ),
    ];

    return Wrap(
      spacing: 16,
      runSpacing: 12,
      children: channels.map((ch) {
        return GestureDetector(
          onTap: () => HapticFeedback.lightImpact(),
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

class _ChannelStatus {
  final IconData icon;
  final String label;
  final Color color;
  final bool isConnected;

  const _ChannelStatus({
    required this.icon,
    required this.label,
    required this.color,
    required this.isConnected,
  });
}
