import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../providers/nlp_input_providers.dart';

/// Displays extracted NLP fields as colored chips beneath the text input.
///
/// Each chip fades in with [AnimatedOpacity] as the corresponding field
/// is detected by the parser. Light/dark adaptive via [colorScheme] and
/// [context.unjynx].
class ParsedPreviewBar extends StatelessWidget {
  const ParsedPreviewBar({
    required this.result,
    super.key,
  });

  final ParsedTaskResult result;

  @override
  Widget build(BuildContext context) {
    final hasAnyChip =
        result.date != null || result.time != null || result.priority != null;

    if (!hasAnyChip) return const SizedBox.shrink();

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (result.date != null)
          _FadeInChip(
            visible: true,
            icon: Icons.calendar_today_rounded,
            label: result.date!,
            chipType: _ChipType.date,
          ),
        if (result.time != null)
          _FadeInChip(
            visible: true,
            icon: Icons.access_time_rounded,
            label: result.time!,
            chipType: _ChipType.time,
          ),
        if (result.priority != null)
          _FadeInChip(
            visible: true,
            icon: Icons.flag_rounded,
            label: result.priority!,
            chipType: _ChipType.priority,
          ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Chip types
// ---------------------------------------------------------------------------

enum _ChipType { date, time, priority }

// ---------------------------------------------------------------------------
// Animated chip widget
// ---------------------------------------------------------------------------

class _FadeInChip extends StatelessWidget {
  const _FadeInChip({
    required this.visible,
    required this.icon,
    required this.label,
    required this.chipType,
  });

  final bool visible;
  final IconData icon;
  final String label;
  final _ChipType chipType;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final chipColor = _resolveColor(colorScheme, ux, isLight);

    return AnimatedOpacity(
      opacity: visible ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: chipColor.withValues(alpha: isLight ? 0.10 : 0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: chipColor.withValues(alpha: isLight ? 0.30 : 0.35),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: chipColor),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: chipColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _resolveColor(
    ColorScheme colorScheme,
    UnjynxCustomColors ux,
    bool isLight,
  ) {
    return switch (chipType) {
      _ChipType.date => ux.gold,
      _ChipType.time => colorScheme.primary,
      _ChipType.priority => _priorityColor(ux, isLight),
    };
  }

  Color _priorityColor(UnjynxCustomColors ux, bool isLight) {
    return switch (label) {
      'P1' => isLight ? const Color(0xFFB8860B) : const Color(0xFFFFD700),
      'P2' => isLight ? const Color(0xFFD97706) : const Color(0xFFFFD43B),
      'P4' => isLight ? const Color(0xFF475569) : const Color(0xFFA0A0B0),
      _ => ux.gold,
    };
  }
}
