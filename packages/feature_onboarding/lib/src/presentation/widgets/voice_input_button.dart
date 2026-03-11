import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Microphone button with a pulsing animation when active.
///
/// Does NOT import `speech_to_text` — the actual speech recognition is
/// wired externally via [onVoiceResult]. The button only controls its
/// visual pulse state.
class VoiceInputButton extends StatefulWidget {
  const VoiceInputButton({
    this.onVoiceResult,
    this.size = 40,
    super.key,
  });

  /// Callback that will eventually deliver transcribed text.
  /// Currently a placeholder — no STT dependency is pulled in.
  final VoidCallback? onVoiceResult;

  /// Diameter of the circular button.
  final double size;

  @override
  State<VoiceInputButton> createState() => _VoiceInputButtonState();
}

class _VoiceInputButtonState extends State<VoiceInputButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggle() {
    HapticFeedback.mediumImpact();
    setState(() {
      _isListening = !_isListening;
    });

    if (_isListening) {
      _controller.repeat();
      widget.onVoiceResult?.call();
    } else {
      _controller.stop();
      _controller.reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final colorScheme = Theme.of(context).colorScheme;

    final activeColor = ux.gold;
    final idleColor = isLight
        ? colorScheme.onSurfaceVariant.withValues(alpha: 0.5)
        : colorScheme.onSurfaceVariant.withValues(alpha: 0.4);

    return GestureDetector(
      onTap: _toggle,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          // Sine-based pulse: scale oscillates 1.0 -> 1.15 -> 1.0
          final pulse = _isListening
              ? 1.0 + 0.15 * math.sin(_controller.value * 2 * math.pi)
              : 1.0;

          return Transform.scale(
            scale: pulse,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _isListening
                    ? activeColor.withValues(alpha: isLight ? 0.12 : 0.18)
                    : Colors.transparent,
                boxShadow: _isListening
                    ? [
                        BoxShadow(
                          color: activeColor.withValues(
                            alpha: isLight ? 0.20 : 0.35,
                          ),
                          blurRadius: isLight ? 12 : 20,
                          spreadRadius: isLight ? 1 : 3,
                        ),
                      ]
                    : [],
              ),
              child: Icon(
                Icons.mic_rounded,
                size: 22,
                color: _isListening ? activeColor : idleColor,
              ),
            ),
          );
        },
      ),
    );
  }
}
