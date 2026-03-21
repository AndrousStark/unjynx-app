import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Microphone button with a pulsing animation when active.
///
/// Uses [SpeechService] from core to perform actual speech recognition.
/// The recognized text is delivered via the [onResult] callback.
class VoiceInputButton extends StatefulWidget {
  const VoiceInputButton({
    this.onResult,
    this.size = 40,
    super.key,
  });

  /// Called with the recognized text each time the speech engine produces
  /// a result (both partial and final).
  final ValueChanged<String>? onResult;

  /// Diameter of the circular button.
  final double size;

  @override
  State<VoiceInputButton> createState() => _VoiceInputButtonState();
}

class _VoiceInputButtonState extends State<VoiceInputButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  final SpeechService _speechService = SpeechService();
  bool _isListening = false;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _speechService.dispose();
    super.dispose();
  }

  Future<void> _toggle() async {
    HapticFeedback.mediumImpact();

    if (_isListening) {
      // Stop listening
      await _speechService.stopListening();
      _pulseController.stop();
      _pulseController.reset();
      setState(() => _isListening = false);
      return;
    }

    // Initialize on first use
    if (!_initialized) {
      final available = await _speechService.initialize();
      _initialized = true;
      if (!available) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Speech recognition is not available on this device'),
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
    }

    if (!_speechService.isAvailable) return;

    // Start listening
    setState(() => _isListening = true);
    _pulseController.repeat();

    await _speechService.startListening(
      onResult: (text) {
        widget.onResult?.call(text);
        // If the engine has stopped (final result), update UI state
        if (!_speechService.isListening && mounted) {
          _pulseController.stop();
          _pulseController.reset();
          setState(() => _isListening = false);
        }
      },
    );
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
        animation: _pulseController,
        builder: (context, child) {
          // Sine-based pulse: scale oscillates 1.0 -> 1.15 -> 1.0
          final pulse = _isListening
              ? 1.0 + 0.15 * math.sin(_pulseController.value * 2 * math.pi)
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
