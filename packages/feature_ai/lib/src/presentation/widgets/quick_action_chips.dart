import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Quick action chips shown above the chat input.
///
/// Each chip represents a pre-built prompt the user can tap.
class QuickActionChips extends StatelessWidget {
  const QuickActionChips({
    required this.onChipTapped,
    super.key,
  });

  /// Called when the user taps a chip with the prompt text.
  final ValueChanged<String> onChipTapped;

  static const _actions = [
    (icon: Icons.center_focus_strong_rounded, label: 'What should I focus on?'),
    (icon: Icons.call_split_rounded, label: 'Break down my tasks'),
    (icon: Icons.schedule_rounded, label: 'Schedule my day'),
    (icon: Icons.trending_up_rounded, label: 'How am I doing?'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _actions.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final action = _actions[index];
          return PressableScale(
            onTap: () {
              UnjynxHaptics.lightImpact();
              onChipTapped(action.label);
            },
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: isLight
                    ? const Color(0xFFF0EAFC)
                    : const Color(0xFF1D1530),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isLight
                      ? UnjynxLightColors.brandViolet.withValues(alpha: 0.15)
                      : UnjynxDarkColors.brandViolet.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    action.icon,
                    size: 14,
                    color: isLight
                        ? UnjynxLightColors.brandViolet
                        : UnjynxDarkColors.brandViolet,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    action.label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: isLight
                          ? UnjynxLightColors.textSecondary
                          : UnjynxDarkColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
