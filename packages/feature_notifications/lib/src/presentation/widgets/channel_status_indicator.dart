import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Visual status of a notification channel.
enum ChannelStatus {
  /// Channel is connected and verified.
  connected,

  /// Channel needs attention (e.g. verification pending).
  warning,

  /// Channel is disconnected.
  disconnected,
}

/// A small colored dot indicating a channel's connection status.
///
/// Green = connected, yellow = warning, red = disconnected.
class ChannelStatusIndicator extends StatelessWidget {
  const ChannelStatusIndicator({
    super.key,
    required this.status,
    this.size = 10,
  });

  final ChannelStatus status;
  final double size;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final color = switch (status) {
      ChannelStatus.connected => ux.success,
      ChannelStatus.warning => ux.warning,
      ChannelStatus.disconnected => isLight
          ? Theme.of(context)
              .colorScheme
              .onSurfaceVariant
              .withValues(alpha: 0.3)
          : Theme.of(context)
              .colorScheme
              .onSurfaceVariant
              .withValues(alpha: 0.2),
    };

    final glowColor = switch (status) {
      ChannelStatus.connected =>
        ux.success.withValues(alpha: isLight ? 0.2 : 0.3),
      ChannelStatus.warning =>
        ux.warning.withValues(alpha: isLight ? 0.2 : 0.3),
      ChannelStatus.disconnected => Colors.transparent,
    };

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: status != ChannelStatus.disconnected
            ? [
                BoxShadow(
                  color: glowColor,
                  blurRadius: 4,
                  spreadRadius: 1,
                ),
              ]
            : null,
      ),
    );
  }
}
