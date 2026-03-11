import 'package:flutter/material.dart';

/// Complete UNJYNX color token system for both light and dark modes.
///
/// All colors are scientifically validated against WCAG 2.2 contrast
/// requirements. Light mode uses deepened variants where standard colors
/// fail contrast on #F8F5FF background.
abstract final class UnjynxDarkColors {
  // ── Backgrounds ──
  static const Color background = Color(0xFF0F0A1A);
  static const Color surface = Color(0xFF1D1B20);
  static const Color surfaceContainer = Color(0xFF2B2930);
  static const Color surfaceContainerHigh = Color(0xFF363440);
  static const Color surfaceContainerHighest = Color(0xFF414050);

  // ── Brand ──
  static const Color midnightPurple = Color(0xFF1A0A2E);
  static const Color deepPurple = Color(0xFF2D1B69);
  static const Color brandViolet = Color(0xFF6C5CE7);
  static const Color electricGold = Color(0xFFFFD700);
  static const Color darkGold = Color(0xFFB8960F);

  // ── Text ──
  static const Color textPrimary = Color(0xFFF5F0FF);
  static const Color textSecondary = Color(0xFFC4B0E8);
  static const Color textTertiary = Color(0xFF8B7DAF);
  static const Color textDisabled = Color(0xFF5C5470);

  // ── Semantic ──
  static const Color error = Color(0xFFFF6B6B);
  static const Color success = Color(0xFF51CF66);
  static const Color warning = Color(0xFFFFD43B);
  static const Color info = Color(0xFF06B6D4);

  // ── Glass ──
  static const Color glassBackground = Color(0x14FFFFFF); // 8% white
  static const Color glassBorder = Color(0x1AFFFFFF); // 10% white

  // ── Shadows (not used in dark — glow instead) ──
  static const Color shadowBase = Color(0xFF000000);

  // ── Channel brands ──
  static const Color whatsapp = Color(0xFF25D366);
  static const Color telegram = Color(0xFF06B6D4);
  static const Color instagram = Color(0xFFE4405F);
  static const Color discord = Color(0xFF5865F2);
  static const Color slack = Color(0xFF611F69);
  static const Color email = Color(0xFF3B82F6);
}

/// Light mode color tokens.
///
/// Key principle: #F8F5FF not #FFFFFF. Pure white is clinical.
/// Gold shifts #FFD700 → #B8860B because electric gold washes out on light.
/// All semantic colors are deepened for WCAG contrast on light backgrounds.
abstract final class UnjynxLightColors {
  // ── Backgrounds ──
  /// Purple Mist — warm purple-tinted off-white (NOT pure white).
  static const Color background = Color(0xFFF8F5FF);
  static const Color surface = Color(0xFFF0EAFC);
  static const Color surfaceContainer = Color(0xFFEDE5F7);
  static const Color surfaceContainerHigh = Color(0xFFE2D9F3);
  static const Color surfaceContainerHighest = Color(0xFFD4C8E8);

  // ── Brand ──
  static const Color midnightPurple = Color(0xFF1A0533);
  static const Color deepPurple = Color(0xFF2D1B69);
  static const Color brandViolet = Color(0xFF6B21A8);
  static const Color richGold = Color(0xFFB8860B);
  static const Color darkGold = Color(0xFF8B6508);

  /// Warm gold tint for selections, active states, highlights.
  static const Color goldWash = Color(0xFFFFF8E1);

  // ── Text ──
  /// 17.51:1 contrast on #F8F5FF — exceeds AAA.
  static const Color textPrimary = Color(0xFF1A0533);

  /// 8.10:1 contrast on #F8F5FF — exceeds AAA.
  static const Color textSecondary = Color(0xFF6B21A8);

  /// 7.04:1 contrast on #F8F5FF — exceeds AAA.
  static const Color textTertiary = Color(0xFF475569);
  static const Color textDisabled = Color(0xFF94A3B8);

  // ── Semantic (deepened for light bg contrast) ──
  /// #E11D48 on #F8F5FF = 4.36:1 (AA Large pass).
  static const Color error = Color(0xFFE11D48);

  /// #059669 on #F8F5FF = 3.50:1 (AA Large pass).
  static const Color success = Color(0xFF059669);

  /// #D97706 on #F8F5FF = 2.80:1 (use at large size).
  static const Color warning = Color(0xFFD97706);
  static const Color info = Color(0xFF0891B2);

  // ── Semantic washes (subtle background tints) ──
  static const Color errorWash = Color(0xFFFFF1F2);
  static const Color successWash = Color(0xFFECFDF5);
  static const Color warningWash = Color(0xFFFFFBEB);
  static const Color infoWash = Color(0xFFECFEFF);

  // ── Glass ──
  static const Color glassBackground = Color(0xA6FFFFFF); // 65% white
  static const Color glassBorder = Color(0x146B21A8); // 8% violet

  // ── Shadows (purple-tinted, NEVER gray) ──
  static const Color shadowBase = Color(0xFF1A0533);

  // ── Channel brands (deepened for light bg) ──
  static const Color whatsapp = Color(0xFF16A34A);
  static const Color telegram = Color(0xFF0891B2);
  static const Color instagram = Color(0xFFDC2626);
  static const Color discord = Color(0xFF4F46E5);
  static const Color slack = Color(0xFF581C87);
  static const Color email = Color(0xFF2563EB);
}
