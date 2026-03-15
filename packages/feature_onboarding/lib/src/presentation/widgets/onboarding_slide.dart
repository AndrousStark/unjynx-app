import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A single onboarding slide with icon, title, and subtitle.
class OnboardingSlide extends StatelessWidget {
  const OnboardingSlide({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    super.key,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Glowing icon container
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              // Light: softer wash so color doesn't overpower white bg
              // Dark: slightly more fill for visual pop
              color: iconColor.withValues(alpha: isLight ? 0.10 : 0.15),
              boxShadow: [
                BoxShadow(
                  // Light: purple-tinted shadow for depth, less glow
                  // Dark: colored glow for dramatic effect
                  color: isLight
                      ? const Color(0xFF1A0533).withValues(alpha: 0.10)
                      : iconColor.withValues(alpha: 0.3),
                  blurRadius: isLight ? 24 : 40,
                  spreadRadius: isLight ? 2 : 8,
                ),
              ],
            ),
            child: Icon(icon, size: 56, color: iconColor),
          ),
          const SizedBox(height: 48),

          // Title
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: isLight ? FontWeight.w800 : FontWeight.bold,
              color: colorScheme.onSurface,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 16),

          // Subtitle
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              // Light: higher opacity for readability on white/lavender bg
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.85 : 0.7),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
