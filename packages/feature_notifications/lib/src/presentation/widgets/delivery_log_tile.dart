import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A single delivery log entry tile in the notification history list.
///
/// Displays: channel icon, message preview, timestamp, and delivery status.
class DeliveryLogTile extends StatelessWidget {
  const DeliveryLogTile({
    super.key,
    required this.entry,
  });

  /// Expected keys: channelType, message, timestamp, status (delivered/failed/pending).
  final Map<String, dynamic> entry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final channelType = entry['channelType'] as String? ?? 'push';
    final message = entry['message'] as String? ?? '';
    final timestamp = entry['timestamp'] as String? ?? '';
    final status = entry['status'] as String? ?? 'pending';
    final iconColor = _resolveChannelColor(channelType, ux, colorScheme);

    return Container(
      padding: const EdgeInsets.all(14),
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
              _channelIcon(channelType),
              size: 20,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 12),

          // Message + timestamp
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.isNotEmpty ? message : 'No message',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  timestamp,
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.5 : 0.4),
                  ),
                ),
              ],
            ),
          ),

          // Status icon
          _StatusBadge(status: status),
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
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    final (IconData icon, Color color) = switch (status) {
      'delivered' => (Icons.check_circle_rounded, ux.success),
      'failed' => (Icons.cancel_rounded, colorScheme.error),
      'pending' => (Icons.schedule_rounded, ux.warning),
      _ => (Icons.help_outline_rounded, colorScheme.onSurfaceVariant),
    };

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: color.withValues(alpha: isLight ? 0.08 : 0.12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            _capitalize(status),
            style: textTheme.labelMedium?.copyWith(
              fontSize: 11,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  String _capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1);
  }
}
