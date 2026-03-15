import 'dart:ui';

import 'package:flutter/material.dart';

import 'unjynx_extensions.dart';
import 'unjynx_shadows.dart';

/// A glassmorphism card that auto-adapts to light/dark mode.
///
/// Light mode: 65% white opacity, 8px blur, purple border, purple shadow.
/// Dark mode: 8% white opacity, 12px blur, subtle white border, glow.
///
/// Wrap content in this widget for the signature UNJYNX frosted glass look.
class UnjynxGlassCard extends StatelessWidget {
  const UnjynxGlassCard({
    required this.child,
    this.borderRadius = 16,
    this.padding = const EdgeInsets.all(16),
    this.elevation = UnjynxElevation.md,
    this.hero = false,
    super.key,
  });

  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry padding;
  final UnjynxElevation elevation;

  /// Hero cards get extra blur, opacity, and gradient border.
  final bool hero;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;
    final colors = context.unjynx;
    final shadows = context.unjynxShadow(elevation);

    final sigma = hero
        ? (isLight ? 12.0 : 16.0)
        : (isLight ? 8.0 : 12.0);

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: isLight ? shadows : [],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: sigma, sigmaY: sigma),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: colors.glassBackground,
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: colors.glassBorder,
                width: isLight ? 1.0 : 0.5,
              ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
