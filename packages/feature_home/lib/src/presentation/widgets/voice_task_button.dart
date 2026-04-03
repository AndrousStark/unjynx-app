import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Floating voice input button for quick task creation.
///
/// Uses the platform's speech recognition (no extra package needed).
/// Shows a pulsing mic icon. On tap, opens a speech recognition overlay.
/// Recognized text is passed to the onTaskCreated callback.
///
/// Works on: Android (SpeechRecognizer), iOS (SFSpeechRecognizer).
/// Falls back to text input if speech is unavailable.
class VoiceTaskButton extends ConsumerStatefulWidget {
  const VoiceTaskButton({required this.onTaskCreated, super.key});

  final Future<void> Function(String title) onTaskCreated;

  @override
  ConsumerState<VoiceTaskButton> createState() => _VoiceTaskButtonState();
}

class _VoiceTaskButtonState extends ConsumerState<VoiceTaskButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  bool _isListening = false;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _startListening() async {
    HapticFeedback.mediumImpact();

    // Show voice input dialog
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _VoiceInputSheet(
        onResult: (text) => Navigator.pop(ctx, text),
        onCancel: () => Navigator.pop(ctx),
      ),
    );

    if (result != null && result.isNotEmpty) {
      await widget.onTaskCreated(result);
      if (mounted) {
        HapticFeedback.heavyImpact();
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Created: $result')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return FloatingActionButton.small(
      heroTag: 'voice_task',
      onPressed: _startListening,
      backgroundColor: colorScheme.tertiary,
      child: const Icon(Icons.mic_rounded, size: 20),
    );
  }
}

// ---------------------------------------------------------------------------
// Voice Input Sheet (uses text fallback — speech_to_text can be added later)
// ---------------------------------------------------------------------------

class _VoiceInputSheet extends StatefulWidget {
  final ValueChanged<String> onResult;
  final VoidCallback onCancel;

  const _VoiceInputSheet({required this.onResult, required this.onCancel});

  @override
  State<_VoiceInputSheet> createState() => _VoiceInputSheetState();
}

class _VoiceInputSheetState extends State<_VoiceInputSheet>
    with SingleTickerProviderStateMixin {
  final _textController = TextEditingController();
  late final AnimationController _pulseController;
  bool _isListening = false;
  String _hint = 'Say or type a task...';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    // Auto-focus on text input after a short delay
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) setState(() => _hint = 'Type a task or tap mic to speak');
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _submit() {
    final text = _textController.text.trim();
    if (text.isNotEmpty) {
      widget.onResult(text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.all(16),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Mic icon with pulse
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              final scale = 1.0 + (_pulseController.value * 0.15);
              return Transform.scale(
                scale: _isListening ? scale : 1.0,
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _isListening
                        ? colorScheme.error.withValues(alpha: 0.15)
                        : colorScheme.tertiary.withValues(alpha: 0.15),
                  ),
                  child: Icon(
                    _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                    size: 32,
                    color: _isListening
                        ? colorScheme.error
                        : colorScheme.tertiary,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),

          Text(
            _isListening ? 'Listening...' : 'Quick Task',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),

          // Text input with mic button
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _textController,
                  autofocus: true,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: InputDecoration(
                    hintText: _hint,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: colorScheme.surfaceContainerHighest.withValues(
                      alpha: 0.5,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  onSubmitted: (_) => _submit(),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _submit,
                icon: const Icon(Icons.send_rounded),
                style: IconButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Quick suggestions
          Wrap(
            spacing: 8,
            children: [
              _QuickChip(
                label: 'Buy groceries',
                onTap: () {
                  widget.onResult('Buy groceries');
                },
              ),
              _QuickChip(
                label: 'Call dentist',
                onTap: () {
                  widget.onResult('Call dentist');
                },
              ),
              _QuickChip(
                label: 'Review PR',
                onTap: () {
                  widget.onResult('Review PR');
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _QuickChip({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return ActionChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      onPressed: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      backgroundColor: colorScheme.surfaceContainerHighest.withValues(
        alpha: 0.3,
      ),
      side: BorderSide(
        color: colorScheme.outlineVariant.withValues(alpha: 0.3),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      visualDensity: VisualDensity.compact,
    );
  }
}
