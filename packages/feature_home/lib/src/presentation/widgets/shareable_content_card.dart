import 'dart:math' as math;

import 'package:flutter/material.dart';

/// A premium branded content card designed for screenshot capture and sharing.
///
/// This widget is NOT displayed on screen -- it is rendered off-screen by
/// `ScreenshotController.captureFromLongWidget` to produce a high-resolution
/// PNG image (1080x1920 at 3x pixel ratio) suitable for Instagram stories,
/// WhatsApp status, and other social media.
///
/// Layout (9:16 ratio):
/// ```text
/// ┌──────────────────────────────────┐
/// │  ✦ UNJYNX          [CATEGORY]   │
/// │                                  │
/// │         ❝                        │
/// │    "Quote text in                │
/// │     Playfair Display,            │
/// │     gold color"                  │
/// │         ❞                        │
/// │                                  │
/// │     — Author Name                │
/// │                                  │
/// │  ─────────────────────────────   │
/// │  unjynx.me                       │
/// │  Break the satisfactory.         │
/// └──────────────────────────────────┘
/// ```
class ShareableContentCard extends StatelessWidget {
  const ShareableContentCard({
    required this.quote,
    required this.author,
    required this.category,
    this.source,
    this.isDark = true,
    super.key,
  });

  /// The quote / content text to display.
  final String quote;

  /// Attribution author name.
  final String author;

  /// Content category (e.g. "Stoic Wisdom").
  final String category;

  /// Optional source (e.g. "Meditations").
  final String? source;

  /// Whether to use the dark theme variant.
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 1080,
      height: 1920,
      child: _CardBody(
        quote: quote,
        author: author,
        category: category,
        source: source,
        isDark: isDark,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Card body -- all visual content
// ---------------------------------------------------------------------------

class _CardBody extends StatelessWidget {
  const _CardBody({
    required this.quote,
    required this.author,
    required this.category,
    required this.isDark,
    this.source,
  });

  final String quote;
  final String author;
  final String category;
  final String? source;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    // --- Color palette ---
    final bgGradientStart =
        isDark ? const Color(0xFF0F0A1A) : const Color(0xFFF8F5FF);
    final bgGradientEnd =
        isDark ? const Color(0xFF2D1B69) : const Color(0xFFE8E0F5);
    final goldColor =
        isDark ? const Color(0xFFFFD700) : const Color(0xFFB8860B);
    final goldDimmed = isDark
        ? const Color(0xFFFFD700).withValues(alpha: 0.3)
        : const Color(0xFFB8860B).withValues(alpha: 0.15);
    final textSecondary = isDark
        ? const Color(0xFFC4B0E8)
        : const Color(0xFF6B21A8);
    final textTertiary = isDark
        ? const Color(0xFF8B7DAF)
        : const Color(0xFF475569);
    final borderColor = goldColor.withValues(alpha: isDark ? 0.4 : 0.3);
    final dividerColor = goldColor.withValues(alpha: isDark ? 0.2 : 0.15);

    // --- Adaptive font size for long quotes ---
    final quoteFontSize = _adaptiveQuoteFontSize(quote.length);

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [bgGradientStart, bgGradientEnd],
          stops: const [0.0, 1.0],
        ),
        borderRadius: BorderRadius.circular(48),
        border: Border.all(color: borderColor, width: 2),
      ),
      child: Stack(
        children: [
          // --- Subtle radial glow behind the quote ---
          Positioned(
            top: 580,
            left: 180,
            child: Container(
              width: 720,
              height: 720,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    goldColor.withValues(alpha: isDark ? 0.08 : 0.06),
                    goldColor.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),

          // --- Corner ornaments ---
          _CornerOrnament(
            alignment: Alignment.topLeft,
            color: goldDimmed,
          ),
          _CornerOrnament(
            alignment: Alignment.bottomRight,
            color: goldDimmed,
            isFlipped: true,
          ),

          // --- Main content ---
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 72, vertical: 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Top: Logo + Category ──
                _TopBar(
                  category: category,
                  goldColor: goldColor,
                  textSecondary: textSecondary,
                  isDark: isDark,
                ),

                const Spacer(flex: 2),

                // ── Opening quotation mark ──
                _OrnamentalQuoteMark(
                  color: goldColor.withValues(alpha: 0.5),
                ),

                const SizedBox(height: 32),

                // ── Quote text ──
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      quote,
                      style: TextStyle(
                        fontFamily: 'PlayfairDisplay',
                        fontSize: quoteFontSize,
                        fontWeight: FontWeight.w500,
                        fontStyle: FontStyle.italic,
                        height: 1.5,
                        color: goldColor,
                        letterSpacing: 0.3,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // ── Closing quotation mark ──
                Align(
                  alignment: Alignment.centerRight,
                  child: _OrnamentalQuoteMark(
                    color: goldColor.withValues(alpha: 0.5),
                    isClosing: true,
                  ),
                ),

                const SizedBox(height: 48),

                // ── Author attribution ──
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Small decorative dash above author.
                      Container(
                        width: 60,
                        height: 2,
                        decoration: BoxDecoration(
                          color: goldColor.withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(1),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        '\u2014 $author',
                        style: TextStyle(
                          fontFamily: 'DMSans',
                          fontSize: 36,
                          fontWeight: FontWeight.w500,
                          color: textSecondary,
                          letterSpacing: 0.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (source != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          source!,
                          style: TextStyle(
                            fontFamily: 'DMSans',
                            fontSize: 28,
                            fontWeight: FontWeight.w400,
                            fontStyle: FontStyle.italic,
                            color: textTertiary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                ),

                const Spacer(flex: 3),

                // ── Bottom: Divider + Watermark ──
                Container(
                  height: 1,
                  color: dividerColor,
                ),

                const SizedBox(height: 40),

                _BottomWatermark(
                  goldColor: goldColor,
                  textTertiary: textTertiary,
                  isDark: isDark,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Returns a font size that scales down for longer quotes so they fit
  /// comfortably within the card without truncation.
  double _adaptiveQuoteFontSize(int charCount) {
    if (charCount <= 80) return 56;
    if (charCount <= 150) return 48;
    if (charCount <= 250) return 42;
    if (charCount <= 400) return 36;
    return 30;
  }
}

// ---------------------------------------------------------------------------
// Top bar -- UNJYNX logo + category badge
// ---------------------------------------------------------------------------

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.category,
    required this.goldColor,
    required this.textSecondary,
    required this.isDark,
  });

  final String category;
  final Color goldColor;
  final Color textSecondary;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // UNJYNX logo text.
        Text(
          'UNJYNX',
          style: TextStyle(
            fontFamily: 'BebasNeue',
            fontSize: 48,
            fontWeight: FontWeight.w400,
            color: goldColor,
            letterSpacing: 4,
          ),
        ),
        const Spacer(),
        // Category badge.
        Flexible(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
            decoration: BoxDecoration(
              color: goldColor.withValues(alpha: isDark ? 0.15 : 0.12),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: goldColor.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              category.toUpperCase().replaceAll('_', ' '),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontFamily: 'DMSans',
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: goldColor,
                letterSpacing: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom watermark -- unjynx.me + tagline
// ---------------------------------------------------------------------------

class _BottomWatermark extends StatelessWidget {
  const _BottomWatermark({
    required this.goldColor,
    required this.textTertiary,
    required this.isDark,
  });

  final Color goldColor;
  final Color textTertiary;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'unjynx.me',
              style: TextStyle(
                fontFamily: 'DMSans',
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: goldColor.withValues(alpha: 0.7),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Break the satisfactory.',
              style: TextStyle(
                fontFamily: 'PlayfairDisplay',
                fontSize: 24,
                fontWeight: FontWeight.w400,
                fontStyle: FontStyle.italic,
                color: textTertiary.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
        const Spacer(),
        // Small sparkle icon.
        Icon(
          Icons.auto_awesome,
          size: 36,
          color: goldColor.withValues(alpha: 0.4),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Ornamental quotation mark
// ---------------------------------------------------------------------------

class _OrnamentalQuoteMark extends StatelessWidget {
  const _OrnamentalQuoteMark({
    required this.color,
    this.isClosing = false,
  });

  final Color color;
  final bool isClosing;

  @override
  Widget build(BuildContext context) {
    return Text(
      isClosing ? '\u201D' : '\u201C',
      style: TextStyle(
        fontFamily: 'PlayfairDisplay',
        fontSize: 96,
        fontWeight: FontWeight.w700,
        color: color,
        height: 0.6,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Corner ornament -- subtle decorative L-shape in corners
// ---------------------------------------------------------------------------

class _CornerOrnament extends StatelessWidget {
  const _CornerOrnament({
    required this.alignment,
    required this.color,
    this.isFlipped = false,
  });

  final AlignmentGeometry alignment;
  final Color color;
  final bool isFlipped;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: alignment,
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Transform(
          alignment: Alignment.center,
          transform: isFlipped
              ? (Matrix4.identity()..rotateZ(math.pi))
              : Matrix4.identity(),
          child: SizedBox(
            width: 80,
            height: 80,
            child: CustomPaint(
              painter: _CornerPainter(color: color),
            ),
          ),
        ),
      ),
    );
  }
}

class _CornerPainter extends CustomPainter {
  const _CornerPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Vertical line (top-left corner shape).
    canvas
      ..drawLine(
        Offset.zero,
        Offset(0, size.height * 0.6),
        paint,
      )

      // Horizontal line.
      ..drawLine(
        Offset.zero,
        Offset(size.width * 0.6, 0),
        paint,
      );
  }

  @override
  bool shouldRepaint(covariant _CornerPainter oldDelegate) =>
      color != oldDelegate.color;
}
