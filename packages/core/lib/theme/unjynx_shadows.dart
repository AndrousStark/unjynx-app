import 'package:flutter/material.dart';

import 'unjynx_colors.dart';

/// UNJYNX elevation shadow system.
///
/// Light mode: Purple-tinted shadows (rgba(26,5,51,x)) — NEVER generic gray.
/// Dark mode: Minimal shadows — depth comes from surface color + border glow.
///
/// 5 elevation levels:
/// - none: Flat elements, dividers
/// - sm:   Input fields, inactive cards
/// - md:   Task cards, content cards (standard)
/// - lg:   Hero cards, FABs, bottom sheets
/// - xl:   Modals, dialogs, dropdown menus
/// - drag: Cards being dragged (Kanban reorder)
abstract final class UnjynxShadows {
  /// No shadow.
  static const List<BoxShadow> none = [];

  // ── Light mode shadows (purple-tinted) ──

  static const List<BoxShadow> lightSm = [
    BoxShadow(
      color: Color(0x0A1A0533), // 4% midnight purple
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> lightMd = [
    BoxShadow(
      color: Color(0x0F1A0533), // 6% midnight purple
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> lightLg = [
    BoxShadow(
      color: Color(0x141A0533), // 8% midnight purple
      blurRadius: 12,
      offset: Offset(0, 4),
    ),
    BoxShadow(
      color: Color(0x0A1A0533), // 4% — secondary shadow for depth
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> lightXl = [
    BoxShadow(
      color: Color(0x1F1A0533), // 12% midnight purple
      blurRadius: 20,
      offset: Offset(0, 8),
    ),
    BoxShadow(
      color: Color(0x0F1A0533),
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> lightDrag = [
    BoxShadow(
      color: Color(0x291A0533), // 16% midnight purple
      blurRadius: 28,
      offset: Offset(0, 12),
    ),
    BoxShadow(
      color: Color(0x141A0533),
      blurRadius: 8,
      offset: Offset(0, 4),
    ),
  ];

  // ── Dark mode shadows (minimal, subtle) ──

  static const List<BoxShadow> darkSm = [
    BoxShadow(
      color: Color(0x33000000), // 20% black
      blurRadius: 4,
      offset: Offset(0, 1),
    ),
  ];

  static const List<BoxShadow> darkMd = [
    BoxShadow(
      color: Color(0x40000000), // 25% black
      blurRadius: 8,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> darkLg = [
    BoxShadow(
      color: Color(0x4D000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  static const List<BoxShadow> darkXl = [
    BoxShadow(
      color: Color(0x59000000),
      blurRadius: 24,
      offset: Offset(0, 8),
    ),
  ];

  static const List<BoxShadow> darkDrag = [
    BoxShadow(
      color: Color(0x66000000),
      blurRadius: 32,
      offset: Offset(0, 12),
    ),
  ];

  /// Get shadow list for a specific [level] and [brightness].
  static List<BoxShadow> of(UnjynxElevation level, Brightness brightness) {
    final isLight = brightness == Brightness.light;
    return switch (level) {
      UnjynxElevation.none => none,
      UnjynxElevation.sm => isLight ? lightSm : darkSm,
      UnjynxElevation.md => isLight ? lightMd : darkMd,
      UnjynxElevation.lg => isLight ? lightLg : darkLg,
      UnjynxElevation.xl => isLight ? lightXl : darkXl,
      UnjynxElevation.drag => isLight ? lightDrag : darkDrag,
    };
  }
}

/// Named elevation levels for the UNJYNX shadow system.
enum UnjynxElevation { none, sm, md, lg, xl, drag }
