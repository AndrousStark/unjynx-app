import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A calming text widget that gently pulses in scale and opacity,
/// mimicking a breathing rhythm.
///
/// Used in Ghost Mode to reinforce a sense of calm focus.
/// The animation cycle is 3 seconds with smooth ease-in-out curves.
///
/// Respects the system "reduce motion" preference: when active, the text
/// is rendered at full opacity with no animation.
class BreathingText extends StatefulWidget {
  const BreathingText({
    required this.text,
    this.style,
    this.textAlign = TextAlign.center,
    super.key,
  });

  /// The text to display with the breathing animation.
  final String text;

  /// Optional text style. Defaults to a muted secondary style.
  final TextStyle? style;

  /// Text alignment. Defaults to center.
  final TextAlign textAlign;

  @override
  State<BreathingText> createState() => _BreathingTextState();
}

class _BreathingTextState extends State<BreathingText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );

    final curved = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    // Subtle scale pulse: 1.0 -> 1.02
    _scaleAnimation = Tween<double>(begin: 1, end: 1.02).animate(curved);

    // Opacity pulse: 0.7 -> 1.0
    _opacityAnimation = Tween<double>(begin: 0.7, end: 1).animate(curved);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Start or stop animation based on reduce-motion setting.
    final reduceMotion = accessibleDuration(
      context,
      const Duration(seconds: 1),
    ) == Duration.zero;

    if (reduceMotion) {
      _controller.stop();
      _controller.value = 1.0; // Full opacity, no pulse.
    } else if (!_controller.isAnimating) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: _opacityAnimation.value,
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: child,
          ),
        );
      },
      child: Text(
        widget.text,
        style: widget.style,
        textAlign: widget.textAlign,
      ),
    );
  }
}
