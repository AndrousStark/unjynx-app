import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/personalization_state.dart';
import '../providers/personalization_providers.dart';

/// List of notification channels with adaptive toggle switches.
///
/// Pro channels show a "Pro" badge chip and "Upgrade later" subtitle.
/// Push is enabled by default.
class ChannelToggleList extends ConsumerWidget {
  const ChannelToggleList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final channelPrefs = ref.watch(
      personalizationStateProvider.select((s) => s.channelPrefs),
    );

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: channelDefinitions.length,
      separatorBuilder: (_, __) => const SizedBox(height: 4),
      itemBuilder: (context, index) {
        final channel = channelDefinitions[index];
        final isEnabled = channelPrefs[channel.id] ?? false;
        return _ChannelRow(
          channel: channel,
          isEnabled: isEnabled,
          onChanged: (value) => ref
              .read(personalizationStateProvider.notifier)
              .setChannelPref(channel.id, enabled: value),
        );
      },
    );
  }
}

class _ChannelRow extends StatelessWidget {
  const _ChannelRow({
    required this.channel,
    required this.isEnabled,
    required this.onChanged,
  });

  final ChannelDefinition channel;
  final bool isEnabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    // Resolve channel-specific icon color from theme tokens.
    final iconColor = _resolveChannelColor(channel.id, ux, colorScheme);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isLight
            ? Colors.white.withValues(alpha: 0.7)
            : colorScheme.surfaceContainer.withValues(alpha: 0.5),
        border: Border.all(
          color: isLight
              ? colorScheme.outlineVariant.withValues(alpha: 0.4)
              : ux.glassBorder,
          width: 0.5,
        ),
      ),
      child: Row(
        children: [
          // Channel icon in a tinted circle.
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: iconColor.withValues(alpha: isLight ? 0.10 : 0.15),
            ),
            child: Icon(channel.icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),

          // Name + optional subtitle.
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        channel.label,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    if (channel.isPro) ...[
                      const SizedBox(width: 8),
                      _ProBadge(isLight: isLight, ux: ux),
                    ],
                  ],
                ),
                if (channel.subtitle != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(
                      channel.subtitle!,
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.6 : 0.5),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Toggle switch.
          Switch.adaptive(
            value: isEnabled,
            onChanged: (value) {
              HapticFeedback.selectionClick();
              onChanged(value);
            },
            activeColor: ux.gold,
            activeTrackColor: ux.goldWash,
            inactiveThumbColor: colorScheme.onSurfaceVariant
                .withValues(alpha: isLight ? 0.4 : 0.3),
            inactiveTrackColor: colorScheme.onSurfaceVariant
                .withValues(alpha: isLight ? 0.1 : 0.08),
          ),
        ],
      ),
    );
  }

  /// Resolve a channel's icon color from the theme extension.
  Color _resolveChannelColor(
    String channelId,
    UnjynxCustomColors ux,
    ColorScheme colorScheme,
  ) {
    return switch (channelId) {
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
}

class _ProBadge extends StatelessWidget {
  const _ProBadge({
    required this.isLight,
    required this.ux,
  });

  final bool isLight;
  final UnjynxCustomColors ux;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        color: isLight
            ? ux.goldWash
            : ux.gold.withValues(alpha: 0.15),
        border: Border.all(
          color: ux.gold.withValues(alpha: isLight ? 0.4 : 0.3),
          width: 0.5,
        ),
      ),
      child: Text(
        'Pro',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
          color: isLight ? ux.darkGold : ux.gold,
        ),
      ),
    );
  }
}
