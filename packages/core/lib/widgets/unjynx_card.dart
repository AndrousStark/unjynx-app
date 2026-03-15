import 'package:flutter/material.dart';
import 'package:unjynx_core/theme/unjynx_extensions.dart';
import 'package:unjynx_core/theme/unjynx_shadows.dart';
import 'package:unjynx_core/widgets/pressable_scale.dart';

// ── Color constants ─────────────────────────────────────────────────

/// Light mode card colors.
abstract final class _LightCard {
  /// Solid white -- task cards need maximum text readability.
  static const Color solidBackground = Color(0xFFFFFFFF);

  /// Subtle purple border (8% brand violet).
  static const Color solidBorder = Color(0x146B21A8);

  /// Stat card -- faint purple tint for visual distinction.
  static const Color statBackground = Color(0xFFF5F0FF);
}

/// Dark mode card colors.
abstract final class _DarkCard {
  /// 4% white overlay on dark surface.
  static const Color solidBackground = Color(0x0AFFFFFF);

  /// Subtle white border (6%).
  static const Color solidBorder = Color(0x0FFFFFFF);

  /// Stat card -- slightly brighter surface.
  static const Color statBackground = Color(0x14FFFFFF);
}

// ── UnjynxSolidCard ─────────────────────────────────────────────────

/// A solid-background card designed for task lists and content that
/// requires maximum text readability.
///
/// Light mode: opaque white background with purple-tinted shadow.
/// Dark mode: 4% white overlay with subtle black shadow.
///
/// When [onTap] is provided the card wraps itself in [PressableScale]
/// for a press micro-interaction.
///
/// ```dart
/// UnjynxSolidCard(
///   onTap: () => openTask(),
///   child: TaskRow(task: task),
/// )
/// ```
class UnjynxSolidCard extends StatelessWidget {
  const UnjynxSolidCard({
    required this.child,
    this.onTap,
    this.borderRadius = 16.0,
    this.padding = const EdgeInsets.all(16),
    this.elevation = UnjynxElevation.md,
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final UnjynxElevation elevation;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;
    final shadows = context.unjynxShadow(elevation);

    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: isLight
            ? _LightCard.solidBackground
            : _DarkCard.solidBackground,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isLight
              ? _LightCard.solidBorder
              : _DarkCard.solidBorder,
        ),
        boxShadow: shadows,
      ),
      child: child,
    );

    if (onTap != null) {
      return PressableScale(onTap: onTap, child: card);
    }
    return card;
  }
}

// ── UnjynxStatCard ──────────────────────────────────────────────────

/// A lightly-tinted card for stat displays, progress rings, streaks.
///
/// Uses a faint purple tint in light mode and a brighter surface
/// overlay in dark mode to visually distinguish stats from task cards.
///
/// ```dart
/// UnjynxStatCard(
///   child: StreakCounter(count: 42),
/// )
/// ```
class UnjynxStatCard extends StatelessWidget {
  const UnjynxStatCard({
    required this.child,
    this.onTap,
    this.borderRadius = 16.0,
    this.padding = const EdgeInsets.all(16),
    this.elevation = UnjynxElevation.sm,
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final UnjynxElevation elevation;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;
    final shadows = context.unjynxShadow(elevation);

    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: isLight
            ? _LightCard.statBackground
            : _DarkCard.statBackground,
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: isLight
              ? _LightCard.solidBorder
              : _DarkCard.solidBorder,
        ),
        boxShadow: shadows,
      ),
      child: child,
    );

    if (onTap != null) {
      return PressableScale(onTap: onTap, child: card);
    }
    return card;
  }
}
