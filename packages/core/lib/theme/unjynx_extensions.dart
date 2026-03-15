import 'package:flutter/material.dart';

import 'unjynx_colors.dart';
import 'unjynx_shadows.dart';

/// Custom color tokens not covered by Material [ColorScheme].
///
/// Access via `Theme.of(context).extension<UnjynxCustomColors>()!`
/// or the convenience getter `context.unjynx`.
@immutable
class UnjynxCustomColors extends ThemeExtension<UnjynxCustomColors> {
  const UnjynxCustomColors({
    required this.gold,
    required this.darkGold,
    required this.goldWash,
    required this.deepPurple,
    required this.success,
    required this.successWash,
    required this.warning,
    required this.warningWash,
    required this.info,
    required this.infoWash,
    required this.textTertiary,
    required this.textDisabled,
    required this.glassBackground,
    required this.glassBorder,
    required this.shadowBase,
    required this.whatsapp,
    required this.telegram,
    required this.instagram,
    required this.discord,
    required this.slack,
    required this.email,
  });

  final Color gold;
  final Color darkGold;
  final Color goldWash;
  final Color deepPurple;
  final Color success;
  final Color successWash;
  final Color warning;
  final Color warningWash;
  final Color info;
  final Color infoWash;
  final Color textTertiary;
  final Color textDisabled;
  final Color glassBackground;
  final Color glassBorder;
  final Color shadowBase;
  final Color whatsapp;
  final Color telegram;
  final Color instagram;
  final Color discord;
  final Color slack;
  final Color email;

  /// Light mode token set.
  static const light = UnjynxCustomColors(
    gold: UnjynxLightColors.richGold,
    darkGold: UnjynxLightColors.darkGold,
    goldWash: UnjynxLightColors.goldWash,
    deepPurple: UnjynxLightColors.deepPurple,
    success: UnjynxLightColors.success,
    successWash: UnjynxLightColors.successWash,
    warning: UnjynxLightColors.warning,
    warningWash: UnjynxLightColors.warningWash,
    info: UnjynxLightColors.info,
    infoWash: UnjynxLightColors.infoWash,
    textTertiary: UnjynxLightColors.textTertiary,
    textDisabled: UnjynxLightColors.textDisabled,
    glassBackground: UnjynxLightColors.glassBackground,
    glassBorder: UnjynxLightColors.glassBorder,
    shadowBase: UnjynxLightColors.shadowBase,
    whatsapp: UnjynxLightColors.whatsapp,
    telegram: UnjynxLightColors.telegram,
    instagram: UnjynxLightColors.instagram,
    discord: UnjynxLightColors.discord,
    slack: UnjynxLightColors.slack,
    email: UnjynxLightColors.email,
  );

  /// Dark mode token set.
  static const dark = UnjynxCustomColors(
    gold: UnjynxDarkColors.electricGold,
    darkGold: UnjynxDarkColors.darkGold,
    goldWash: Color(0x33FFD700), // 20% electric gold
    deepPurple: UnjynxDarkColors.deepPurple,
    success: UnjynxDarkColors.success,
    successWash: Color(0x1A51CF66),
    warning: UnjynxDarkColors.warning,
    warningWash: Color(0x1AFFD43B),
    info: UnjynxDarkColors.info,
    infoWash: Color(0x1A06B6D4),
    textTertiary: UnjynxDarkColors.textTertiary,
    textDisabled: UnjynxDarkColors.textDisabled,
    glassBackground: UnjynxDarkColors.glassBackground,
    glassBorder: UnjynxDarkColors.glassBorder,
    shadowBase: UnjynxDarkColors.shadowBase,
    whatsapp: UnjynxDarkColors.whatsapp,
    telegram: UnjynxDarkColors.telegram,
    instagram: UnjynxDarkColors.instagram,
    discord: UnjynxDarkColors.discord,
    slack: UnjynxDarkColors.slack,
    email: UnjynxDarkColors.email,
  );

  @override
  UnjynxCustomColors copyWith({
    Color? gold,
    Color? darkGold,
    Color? goldWash,
    Color? deepPurple,
    Color? success,
    Color? successWash,
    Color? warning,
    Color? warningWash,
    Color? info,
    Color? infoWash,
    Color? textTertiary,
    Color? textDisabled,
    Color? glassBackground,
    Color? glassBorder,
    Color? shadowBase,
    Color? whatsapp,
    Color? telegram,
    Color? instagram,
    Color? discord,
    Color? slack,
    Color? email,
  }) {
    return UnjynxCustomColors(
      gold: gold ?? this.gold,
      darkGold: darkGold ?? this.darkGold,
      goldWash: goldWash ?? this.goldWash,
      deepPurple: deepPurple ?? this.deepPurple,
      success: success ?? this.success,
      successWash: successWash ?? this.successWash,
      warning: warning ?? this.warning,
      warningWash: warningWash ?? this.warningWash,
      info: info ?? this.info,
      infoWash: infoWash ?? this.infoWash,
      textTertiary: textTertiary ?? this.textTertiary,
      textDisabled: textDisabled ?? this.textDisabled,
      glassBackground: glassBackground ?? this.glassBackground,
      glassBorder: glassBorder ?? this.glassBorder,
      shadowBase: shadowBase ?? this.shadowBase,
      whatsapp: whatsapp ?? this.whatsapp,
      telegram: telegram ?? this.telegram,
      instagram: instagram ?? this.instagram,
      discord: discord ?? this.discord,
      slack: slack ?? this.slack,
      email: email ?? this.email,
    );
  }

  @override
  UnjynxCustomColors lerp(UnjynxCustomColors? other, double t) {
    if (other is! UnjynxCustomColors) return this;
    return UnjynxCustomColors(
      gold: Color.lerp(gold, other.gold, t)!,
      darkGold: Color.lerp(darkGold, other.darkGold, t)!,
      goldWash: Color.lerp(goldWash, other.goldWash, t)!,
      deepPurple: Color.lerp(deepPurple, other.deepPurple, t)!,
      success: Color.lerp(success, other.success, t)!,
      successWash: Color.lerp(successWash, other.successWash, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      warningWash: Color.lerp(warningWash, other.warningWash, t)!,
      info: Color.lerp(info, other.info, t)!,
      infoWash: Color.lerp(infoWash, other.infoWash, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      textDisabled: Color.lerp(textDisabled, other.textDisabled, t)!,
      glassBackground: Color.lerp(glassBackground, other.glassBackground, t)!,
      glassBorder: Color.lerp(glassBorder, other.glassBorder, t)!,
      shadowBase: Color.lerp(shadowBase, other.shadowBase, t)!,
      whatsapp: Color.lerp(whatsapp, other.whatsapp, t)!,
      telegram: Color.lerp(telegram, other.telegram, t)!,
      instagram: Color.lerp(instagram, other.instagram, t)!,
      discord: Color.lerp(discord, other.discord, t)!,
      slack: Color.lerp(slack, other.slack, t)!,
      email: Color.lerp(email, other.email, t)!,
    );
  }
}

/// Convenience extension for accessing UNJYNX custom tokens.
extension UnjynxThemeExtension on BuildContext {
  /// Access custom UNJYNX color tokens.
  UnjynxCustomColors get unjynx =>
      Theme.of(this).extension<UnjynxCustomColors>()!;

  /// Get shadow list for an elevation level, auto-adapts to current theme.
  List<BoxShadow> unjynxShadow(UnjynxElevation level) =>
      UnjynxShadows.of(level, Theme.of(this).brightness);

  /// All shadow levels as a map, keyed by [UnjynxElevation].
  ///
  /// Useful when you need to reference multiple shadow levels in the same
  /// widget or need to iterate over available elevation options.
  Map<UnjynxElevation, List<BoxShadow>> get unjynxShadows {
    final brightness = Theme.of(this).brightness;
    return {
      for (final level in UnjynxElevation.values)
        level: UnjynxShadows.of(level, brightness),
    };
  }

  /// Whether the current theme is light mode.
  bool get isLightMode => Theme.of(this).brightness == Brightness.light;
}
