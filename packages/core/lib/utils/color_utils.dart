import 'dart:ui';

/// Converts a hex color string (e.g. `#6C5CE7` or `FF6C5CE7`) to a [Color].
///
/// Accepts formats:
/// - `#RRGGBB` (7 chars) -- adds FF alpha
/// - `#AARRGGBB` (9 chars)
/// - `RRGGBB` (6 chars) -- adds FF alpha
/// - `AARRGGBB` (8 chars)
Color hexToColor(String hex) {
  final buffer = StringBuffer();
  final clean = hex.replaceFirst('#', '');
  if (clean.length == 6) buffer.write('FF');
  buffer.write(clean);
  return Color(int.parse(buffer.toString(), radix: 16));
}
