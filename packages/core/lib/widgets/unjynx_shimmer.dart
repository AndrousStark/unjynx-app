import 'package:flutter/material.dart';

/// UNJYNX-branded shimmer / skeleton loading effect.
///
/// Uses a left-to-right gradient sweep with purple-tinted colors
/// that match the light and dark theme palettes.
///
/// Provides convenience constructors for common skeleton shapes:
/// - [UnjynxShimmerBox] -- rounded rectangle placeholder
/// - [UnjynxShimmerCircle] -- circular avatar placeholder
/// - [UnjynxShimmerLine] -- text line placeholder
/// - [UnjynxShimmerCard] -- full card skeleton with avatar + text lines

// ── Color constants ─────────────────────────────────────────────────

/// Light mode shimmer colors (purple-mist palette).
abstract final class _LightShimmer {
  static const Color base = Color(0xFFF0EAF5);
  static const Color highlight = Color(0xFFF8F5FF);
  static const Color peak = Color(0xFFFFFFFF);
}

/// Dark mode shimmer colors (midnight purple palette).
abstract final class _DarkShimmer {
  static const Color base = Color(0xFF1A0F2E);
  static const Color highlight = Color(0xFF2A1F3E);
  static const Color peak = Color(0xFF3A2F4E);
}

// ── Shimmer effect widget ───────────────────────────────────────────

/// A container that paints a shimmering gradient sweep over its [child].
///
/// Typically you don't use this directly -- use the convenience widgets
/// [UnjynxShimmerBox], [UnjynxShimmerCircle], [UnjynxShimmerLine],
/// or [UnjynxShimmerCard].
class UnjynxShimmer extends StatefulWidget {
  const UnjynxShimmer({
    required this.child,
    this.duration = const Duration(milliseconds: 1500),
    super.key,
  });

  /// The skeleton shape to paint the shimmer over.
  final Widget child;

  /// Duration of one full left-to-right sweep. Defaults to 1500ms.
  final Duration duration;

  @override
  State<UnjynxShimmer> createState() => _UnjynxShimmerState();
}

class _UnjynxShimmerState extends State<UnjynxShimmer>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final base = isLight ? _LightShimmer.base : _DarkShimmer.base;
    final highlight =
        isLight ? _LightShimmer.highlight : _DarkShimmer.highlight;
    final peak = isLight ? _LightShimmer.peak : _DarkShimmer.peak;

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => ShaderMask(
        blendMode: BlendMode.srcATop,
        shaderCallback: (bounds) {
          // Slide the gradient from left (-1x) to right (+2x)
          // so it fully sweeps across.
          final dx = _controller.value * 3 - 1;
          return LinearGradient(
            colors: [base, highlight, peak, highlight, base],
            stops: const [0.0, 0.35, 0.5, 0.65, 1.0],
            transform: _SlidingGradientTransform(dx),
          ).createShader(bounds);
        },
        // The child is always non-null when passed to AnimatedBuilder.
        // ignore: unnecessary_null_checks
        child: child!,
      ),
      child: widget.child,
    );
  }
}

/// Slides a gradient by [dx] fraction of its width.
class _SlidingGradientTransform extends GradientTransform {
  const _SlidingGradientTransform(this.dx);
  final double dx;

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * dx, 0, 0);
  }
}

// ── Convenience skeleton shapes ─────────────────────────────────────

/// A rounded rectangle shimmer placeholder.
///
/// ```dart
/// UnjynxShimmerBox(width: 120, height: 40)
/// ```
class UnjynxShimmerBox extends StatelessWidget {
  const UnjynxShimmerBox({
    this.width,
    this.height,
    this.borderRadius = 8.0,
    super.key,
  });

  final double? width;
  final double? height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final baseColor = isLight ? _LightShimmer.base : _DarkShimmer.base;

    return UnjynxShimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// A circular shimmer placeholder (e.g. avatar skeleton).
///
/// ```dart
/// UnjynxShimmerCircle(diameter: 48)
/// ```
class UnjynxShimmerCircle extends StatelessWidget {
  const UnjynxShimmerCircle({
    required this.diameter,
    super.key,
  });

  final double diameter;

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final baseColor = isLight ? _LightShimmer.base : _DarkShimmer.base;

    return UnjynxShimmer(
      child: Container(
        width: diameter,
        height: diameter,
        decoration: BoxDecoration(
          color: baseColor,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

/// A single text-line shimmer placeholder.
///
/// ```dart
/// UnjynxShimmerLine(width: 200, height: 14)
/// ```
class UnjynxShimmerLine extends StatelessWidget {
  const UnjynxShimmerLine({
    this.width,
    this.height = 14,
    super.key,
  });

  final double? width;
  final double height;

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final baseColor = isLight ? _LightShimmer.base : _DarkShimmer.base;

    return UnjynxShimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(height / 2),
        ),
      ),
    );
  }
}

/// A full card skeleton with avatar circle + three text lines.
///
/// Mimics a typical task/content card layout with an avatar circle
/// on the left and three text line placeholders on the right.
class UnjynxShimmerCard extends StatelessWidget {
  const UnjynxShimmerCard({
    this.borderRadius = 16.0,
    super.key,
  });

  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final baseColor = isLight ? _LightShimmer.base : _DarkShimmer.base;

    return UnjynxShimmer(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: baseColor,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        child: Row(
          children: [
            // Avatar placeholder
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isLight
                    ? _LightShimmer.highlight
                    : _DarkShimmer.highlight,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            // Text lines placeholder
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 14,
                    decoration: BoxDecoration(
                      color: isLight
                          ? _LightShimmer.highlight
                          : _DarkShimmer.highlight,
                      borderRadius: BorderRadius.circular(7),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FractionallySizedBox(
                    widthFactor: 0.7,
                    child: Container(
                      height: 12,
                      decoration: BoxDecoration(
                        color: isLight
                            ? _LightShimmer.highlight
                            : _DarkShimmer.highlight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FractionallySizedBox(
                    widthFactor: 0.45,
                    child: Container(
                      height: 12,
                      decoration: BoxDecoration(
                        color: isLight
                            ? _LightShimmer.highlight
                            : _DarkShimmer.highlight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
