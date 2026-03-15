import 'package:flutter/material.dart';

/// A wrapper widget that adds press-scale micro-interaction to any child.
///
/// On tap down the child scales to 0.97 over 100ms.
/// On tap up / cancel it springs back to 1.0 over 150ms with an
/// [Curves.easeOutBack] overshoot for a satisfying "pop" feel.
///
/// ```dart
/// PressableScale(
///   onTap: () => print('tapped'),
///   child: MyCard(),
/// )
/// ```
class PressableScale extends StatefulWidget {
  const PressableScale({
    required this.child,
    this.onTap,
    this.enabled = true,
    this.pressedScale = 0.97,
    super.key,
  });

  /// The widget to wrap with scale animation.
  final Widget child;

  /// Called when the user taps the widget. If null, the widget is
  /// visually inert (no scale animation plays).
  final VoidCallback? onTap;

  /// Whether the press interaction is enabled.
  /// When false, [onTap] is ignored and no animation plays.
  final bool enabled;

  /// The target scale when pressed. Defaults to 0.97 (3% shrink).
  final double pressedScale;

  @override
  State<PressableScale> createState() => _PressableScaleState();
}

class _PressableScaleState extends State<PressableScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;

  static const _pressDownDuration = Duration(milliseconds: 100);
  static const _releaseUpDuration = Duration(milliseconds: 150);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: _pressDownDuration,
      reverseDuration: _releaseUpDuration,
    );
    _scaleAnimation = Tween<double>(
      begin: 1,
      end: widget.pressedScale,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
        reverseCurve: Curves.easeOutBack,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  bool get _isInteractive => widget.enabled && widget.onTap != null;

  void _onTapDown(TapDownDetails _) {
    if (!_isInteractive) return;
    _controller.forward();
  }

  void _onTapUp(TapUpDetails _) {
    if (!_isInteractive) return;
    _controller.reverse();
    widget.onTap?.call();
  }

  void _onTapCancel() {
    if (!_isInteractive) return;
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInteractive) return widget.child;

    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      behavior: HitTestBehavior.opaque,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: child,
        ),
        child: widget.child,
      ),
    );
  }
}
