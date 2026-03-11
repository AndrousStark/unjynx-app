import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Drag-to-reorder editor for the escalation chain.
///
/// Each item shows channel icon, name, and a delay dropdown. Connected
/// channels only. Uses [ReorderableListView] for drag reorder.
class EscalationChainEditor extends StatelessWidget {
  const EscalationChainEditor({
    super.key,
    required this.chain,
    required this.delays,
    required this.onReorder,
    required this.onDelayChanged,
  });

  final List<String> chain;
  final Map<String, int> delays;
  final void Function(int oldIndex, int newIndex) onReorder;
  final void Function(String channelType, int minutes) onDelayChanged;

  @override
  Widget build(BuildContext context) {
    return ReorderableListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      itemCount: chain.length,
      onReorder: onReorder,
      proxyDecorator: (child, index, animation) {
        // Haptic on drag start
        HapticFeedback.mediumImpact();
        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            final elevation = Tween<double>(begin: 0, end: 6)
                .animate(animation)
                .value;
            return Material(
              elevation: elevation,
              borderRadius: BorderRadius.circular(16),
              color: Colors.transparent,
              child: child,
            );
          },
          child: child,
        );
      },
      itemBuilder: (context, index) {
        final type = chain[index];
        final delay = delays[type] ?? 5;
        return _ChainItem(
          key: ValueKey(type),
          channelType: type,
          position: index + 1,
          delay: delay,
          isFirst: index == 0,
          isLast: index == chain.length - 1,
          onDelayChanged: (minutes) => onDelayChanged(type, minutes),
        );
      },
    );
  }
}

class _ChainItem extends StatelessWidget {
  const _ChainItem({
    super.key,
    required this.channelType,
    required this.position,
    required this.delay,
    required this.isFirst,
    required this.isLast,
    required this.onDelayChanged,
  });

  final String channelType;
  final int position;
  final int delay;
  final bool isFirst;
  final bool isLast;
  final ValueChanged<int> onDelayChanged;

  static const _delayOptions = [0, 1, 5, 15, 30, 60];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final iconColor = _resolveChannelColor(channelType, ux, colorScheme);

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: isLight
              ? Colors.white.withValues(alpha: 0.7)
              : colorScheme.surfaceContainer.withValues(alpha: 0.5),
          border: Border.all(
            color: isFirst
                ? ux.gold.withValues(alpha: isLight ? 0.3 : 0.2)
                : isLight
                    ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                    : ux.glassBorder,
            width: isFirst ? 1 : 0.5,
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
            // Position number — 44x44 touch target
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isFirst
                    ? ux.gold.withValues(alpha: isLight ? 0.15 : 0.2)
                    : ux.deepPurple.withValues(alpha: isLight ? 0.08 : 0.15),
              ),
              child: Center(
                child: Text(
                  '$position',
                  style: textTheme.displaySmall?.copyWith(
                    fontSize: 16,
                    color: isFirst
                        ? isLight
                            ? ux.darkGold
                            : ux.gold
                        : isLight
                            ? ux.deepPurple
                            : colorScheme.primary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),

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

            // Name
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _channelLabel(channelType),
                    style: textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  if (!isFirst)
                    Text(
                      'After ${_formatDelay(delay)}',
                      style: textTheme.bodySmall?.copyWith(
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.6 : 0.5),
                      ),
                    ),
                  if (isFirst)
                    Text(
                      'Immediate',
                      style: textTheme.bodySmall?.copyWith(
                        color:
                            ux.gold.withValues(alpha: isLight ? 0.8 : 0.7),
                      ),
                    ),
                ],
              ),
            ),

            // Delay dropdown (not for first item)
            if (!isFirst)
              PopupMenuButton<int>(
                initialValue: delay,
                onSelected: (minutes) {
                  HapticFeedback.selectionClick();
                  onDelayChanged(minutes);
                },
                itemBuilder: (context) => _delayOptions.map((d) {
                  return PopupMenuItem<int>(
                    value: d,
                    height: 44,
                    child: Text(_formatDelay(d)),
                  );
                }).toList(),
                child: Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: isLight
                        ? colorScheme.surfaceContainer.withValues(alpha: 0.5)
                        : colorScheme.surfaceContainerHigh
                            .withValues(alpha: 0.3),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatDelay(delay),
                        style: textTheme.labelMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        Icons.arrow_drop_down_rounded,
                        size: 16,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ],
                  ),
                ),
              ),

            // Drag handle — 44x44 touch target
            SizedBox(
              width: 44,
              height: 44,
              child: Icon(
                Icons.drag_handle_rounded,
                size: 20,
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.4 : 0.3),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDelay(int minutes) {
    if (minutes == 0) return 'Instant';
    if (minutes < 60) return '$minutes min';
    final hours = minutes ~/ 60;
    return '$hours hr';
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
