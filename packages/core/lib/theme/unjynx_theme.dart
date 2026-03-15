import 'package:flutter/material.dart';

import 'unjynx_colors.dart';
import 'unjynx_extensions.dart';
import 'unjynx_typography.dart';

// ── Legacy color class (backward compatibility) ──

/// UNJYNX brand colors.
///
/// **Deprecated**: Prefer `Theme.of(context).colorScheme` for standard colors
/// or `context.unjynx` for custom tokens (gold, success, glass, etc.).
/// This class remains for backward compatibility during migration.
@Deprecated('Use Theme.of(context).colorScheme or context.unjynx instead')
abstract final class UnjynxColors {
  static const Color midnightPurple = Color(0xFF1A0A2E);
  static const Color deepPurple = Color(0xFF2D1B69);
  static const Color vividPurple = Color(0xFF6C5CE7);
  static const Color gold = Color(0xFFFFD700);
  static const Color darkGold = Color(0xFFB8960F);
  static const Color surfaceDark = Color(0xFF1E1E2E);
  static const Color surfaceMedium = Color(0xFF2A2A3E);
  static const Color textPrimary = Color(0xFFF5F5F7);
  static const Color textSecondary = Color(0xFFA0A0B0);
  static const Color error = Color(0xFFFF6B6B);
  static const Color success = Color(0xFF51CF66);
  static const Color warning = Color(0xFFFFD43B);
}

// ── Theme builder ──

/// UNJYNX Material 3 theme with light and dark variants.
class UnjynxTheme {
  UnjynxTheme._();

  // ────────────────────────────────────────────────
  //  LIGHT THEME
  // ────────────────────────────────────────────────

  static ThemeData get light {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: UnjynxLightColors.brandViolet,
      brightness: Brightness.light,
      // Override with exact brand values
      primary: UnjynxLightColors.brandViolet,
      onPrimary: Colors.white,
      primaryContainer: UnjynxLightColors.surfaceContainer,
      onPrimaryContainer: UnjynxLightColors.midnightPurple,
      secondary: UnjynxLightColors.richGold,
      onSecondary: Colors.white,
      secondaryContainer: UnjynxLightColors.goldWash,
      onSecondaryContainer: const Color(0xFF5C4300),
      tertiary: UnjynxLightColors.success,
      onTertiary: Colors.white,
      surface: UnjynxLightColors.background,
      onSurface: UnjynxLightColors.textPrimary,
      surfaceContainerLowest: Colors.white,
      surfaceContainerLow: UnjynxLightColors.background,
      surfaceContainer: UnjynxLightColors.surface,
      surfaceContainerHigh: UnjynxLightColors.surfaceContainer,
      surfaceContainerHighest: UnjynxLightColors.surfaceContainerHigh,
      error: UnjynxLightColors.error,
      onError: Colors.white,
      outline: UnjynxLightColors.surfaceContainerHighest,
      outlineVariant: UnjynxLightColors.surfaceContainerHigh,
      shadow: UnjynxLightColors.shadowBase,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: UnjynxLightColors.background,
      // Disable M3 tonal elevation (conflicts with our purple bg)
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: UnjynxLightColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(
            color: UnjynxLightColors.glassBorder,
          ),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: UnjynxLightColors.richGold,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: UnjynxLightColors.brandViolet,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: UnjynxLightColors.surfaceContainerHigh,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(
            color: UnjynxLightColors.surfaceContainerHigh,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: UnjynxLightColors.brandViolet,
            width: 2,
          ),
        ),
        labelStyle: const TextStyle(color: UnjynxLightColors.textTertiary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: UnjynxLightColors.richGold,
        unselectedItemColor: UnjynxLightColors.textTertiary,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: UnjynxLightColors.goldWash,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: UnjynxLightColors.textTertiary,
          ),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: UnjynxLightColors.surfaceContainerHigh.withAlpha(100),
        thickness: 1,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      textTheme: UnjynxTypography.textTheme(Brightness.light),
      extensions: const [UnjynxCustomColors.light],
    );
  }

  // ────────────────────────────────────────────────
  //  DARK THEME
  // ────────────────────────────────────────────────

  static ThemeData get dark {
    final colorScheme = ColorScheme.dark(
      primary: UnjynxDarkColors.brandViolet,
      onPrimary: Colors.white,
      primaryContainer: UnjynxDarkColors.deepPurple,
      onPrimaryContainer: UnjynxDarkColors.textPrimary,
      secondary: UnjynxDarkColors.electricGold,
      onSecondary: Colors.black,
      secondaryContainer: const Color(0xFF3D3000),
      onSecondaryContainer: const Color(0xFFFFE088),
      tertiary: UnjynxDarkColors.success,
      onTertiary: Colors.black,
      surface: UnjynxDarkColors.surface,
      onSurface: UnjynxDarkColors.textPrimary,
      surfaceContainerLowest: UnjynxDarkColors.background,
      surfaceContainerLow: UnjynxDarkColors.surface,
      surfaceContainer: UnjynxDarkColors.surfaceContainer,
      surfaceContainerHigh: UnjynxDarkColors.surfaceContainerHigh,
      surfaceContainerHighest: UnjynxDarkColors.surfaceContainerHighest,
      error: UnjynxDarkColors.error,
      onError: Colors.white,
      outline: UnjynxDarkColors.surfaceContainerHigh,
      outlineVariant: UnjynxDarkColors.surfaceContainer,
      shadow: UnjynxDarkColors.shadowBase,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: UnjynxDarkColors.surface,
      appBarTheme: const AppBarTheme(
        backgroundColor: UnjynxDarkColors.surface,
        foregroundColor: UnjynxDarkColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: UnjynxDarkColors.surface,
        elevation: 2,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: UnjynxDarkColors.electricGold,
        foregroundColor: Colors.black,
        elevation: 4,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: UnjynxDarkColors.brandViolet,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: UnjynxDarkColors.surfaceContainer,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(
            color: UnjynxDarkColors.brandViolet,
            width: 2,
          ),
        ),
        labelStyle: const TextStyle(color: UnjynxDarkColors.textSecondary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: UnjynxDarkColors.surface,
        selectedItemColor: UnjynxDarkColors.electricGold,
        unselectedItemColor: UnjynxDarkColors.textSecondary,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: UnjynxDarkColors.surface,
        indicatorColor: UnjynxDarkColors.deepPurple,
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStatePropertyAll(
          TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: UnjynxDarkColors.textSecondary,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: UnjynxDarkColors.surfaceContainer,
        thickness: 1,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      textTheme: UnjynxTypography.textTheme(Brightness.dark),
      extensions: const [UnjynxCustomColors.dark],
    );
  }
}
