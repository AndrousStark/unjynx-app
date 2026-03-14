import 'package:flutter/material.dart';

/// UNJYNX typography system.
///
/// Font families (bundled as assets — no network fetching):
/// - **Outfit**: Headlines, titles (modern geometric sans)
/// - **DM Sans**: Body text, labels, UI (clean geometric sans)
/// - **Bebas Neue**: Numbers, stats, timers (display condensed)
/// - **Playfair Display**: Quotes, content cards (editorial serif)
///
/// Light mode uses slightly lighter font weights than dark mode
/// due to the irradiation illusion (dark text on light backgrounds
/// appears heavier than the same weight on dark backgrounds).
abstract final class UnjynxTypography {
  static const _bebasNeue = 'BebasNeue';
  static const _outfit = 'Outfit';
  static const _playfairDisplay = 'PlayfairDisplay';
  static const _dmSans = 'DMSans';

  /// Build a complete [TextTheme] adapted for [brightness].
  static TextTheme textTheme(Brightness brightness) {
    final bool isLight = brightness == Brightness.light;

    // Headline weight: w600 in light (appears same as w700 in dark)
    final FontWeight headlineWeight =
        isLight ? FontWeight.w600 : FontWeight.w700;

    // Body weight stays w400 — DM Sans has consistent optical weight
    const FontWeight bodyWeight = FontWeight.w400;

    return TextTheme(
      // ── Display (Bebas Neue — stats, hero numbers, timers) ──
      displayLarge: const TextStyle(
        fontFamily: _bebasNeue,
        fontSize: 48,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.2,
      ),
      displayMedium: const TextStyle(
        fontFamily: _bebasNeue,
        fontSize: 36,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.0,
      ),
      displaySmall: const TextStyle(
        fontFamily: _bebasNeue,
        fontSize: 28,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.8,
      ),

      // ── Headlines (Outfit — screen titles, section headers) ──
      headlineLarge: TextStyle(
        fontFamily: _outfit,
        fontSize: 28,
        fontWeight: headlineWeight,
        letterSpacing: -0.5,
      ),
      headlineMedium: TextStyle(
        fontFamily: _outfit,
        fontSize: 24,
        fontWeight: headlineWeight,
        letterSpacing: -0.3,
      ),
      headlineSmall: TextStyle(
        fontFamily: _outfit,
        fontSize: 20,
        fontWeight: isLight ? FontWeight.w500 : FontWeight.w600,
      ),

      // ── Titles (Outfit — card titles, nav labels) ──
      titleLarge: TextStyle(
        fontFamily: _outfit,
        fontSize: 18,
        fontWeight: isLight ? FontWeight.w500 : FontWeight.w600,
      ),
      // Playfair Display for content titles (quotes, daily content)
      titleMedium: TextStyle(
        fontFamily: _playfairDisplay,
        fontSize: 16,
        fontWeight: isLight ? FontWeight.w400 : FontWeight.w500,
        fontStyle: FontStyle.italic,
      ),
      titleSmall: const TextStyle(
        fontFamily: _playfairDisplay,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        fontStyle: FontStyle.italic,
      ),

      // ── Body (DM Sans — primary reading text) ──
      bodyLarge: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 16,
        fontWeight: bodyWeight,
        height: 1.6,
      ),
      bodyMedium: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 14,
        fontWeight: bodyWeight,
        height: 1.5,
      ),
      bodySmall: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 12,
        fontWeight: bodyWeight,
        height: 1.4,
      ),

      // ── Labels (DM Sans — buttons, chips, badges) ──
      labelLarge: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 14,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.1,
      ),
      labelMedium: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.5,
      ),
      labelSmall: const TextStyle(
        fontFamily: _dmSans,
        fontSize: 11,
        fontWeight: FontWeight.w500,
        letterSpacing: 0.5,
      ),
    );
  }
}
