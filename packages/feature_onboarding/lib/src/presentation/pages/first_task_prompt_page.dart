import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/nlp_input_providers.dart';
import '../widgets/parsed_preview_bar.dart';
import '../widgets/voice_input_button.dart';

/// B3 — First Task Prompt screen.
///
/// Lets the user create their very first task using natural-language input.
/// Example chips auto-fill the text field; a live [ParsedPreviewBar] shows
/// extracted date / time / priority. On submit a spring-scale success
/// animation plays before navigating to the notification permission screen.
class FirstTaskPromptPage extends ConsumerStatefulWidget {
  const FirstTaskPromptPage({super.key});

  @override
  ConsumerState<FirstTaskPromptPage> createState() =>
      _FirstTaskPromptPageState();
}

class _FirstTaskPromptPageState extends ConsumerState<FirstTaskPromptPage>
    with TickerProviderStateMixin {
  final _textController = TextEditingController();
  late final AnimationController _successController;
  late final Animation<double> _successScale;

  static const _exampleChips = [
    'Buy milk Monday 9am',
    'Call dentist',
    'Finish report by Friday',
  ];

  @override
  void initState() {
    super.initState();

    _textController.addListener(_onTextChanged);

    // Spring scale: 0 -> 1.2 -> 1.0 (overshoot then settle)
    _successController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _successScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.0, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.elasticOut)),
        weight: 40,
      ),
    ]).animate(_successController);
  }

  @override
  void dispose() {
    _textController.removeListener(_onTextChanged);
    _textController.dispose();
    _successController.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    ref.read(nlpInputProvider.notifier).set(_textController.text);
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final rawInput = ref.watch(nlpInputProvider);
    final parsed = parseTaskInput(rawInput);
    final isSubmitting = ref.watch(firstTaskSubmittingProvider);
    final isCreated = ref.watch(firstTaskCreatedProvider);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: isCreated
                ? _buildSuccessState(ux, colorScheme, isLight)
                : _buildInputState(ux, colorScheme, isLight, parsed, isSubmitting),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Input state
  // ---------------------------------------------------------------------------

  Widget _buildInputState(
    UnjynxCustomColors ux,
    ColorScheme colorScheme,
    bool isLight,
    ParsedTaskResult parsed,
    bool isSubmitting,
  ) {
    final inputNotEmpty = _textController.text.trim().isNotEmpty;

    return SingleChildScrollView(
      child: Column(
      children: [
        const SizedBox(height: 48),

        // Title
        Text(
          'Create your first task',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: isLight ? FontWeight.w800 : FontWeight.bold,
            color: colorScheme.onSurface,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 8),

        // Subtitle
        Text(
          'Go ahead, say it however you want',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            color: colorScheme.onSurfaceVariant
                .withValues(alpha: isLight ? 0.85 : 0.7),
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),

        // Example chips
        Wrap(
          spacing: 8,
          runSpacing: 8,
          alignment: WrapAlignment.center,
          children: _exampleChips.map((text) {
            return _ExampleChip(
              label: text,
              onTap: () {
                HapticFeedback.lightImpact();
                _textController.text = text;
                _textController.selection = TextSelection.fromPosition(
                  TextPosition(offset: text.length),
                );
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // Text field
        TextField(
          controller: _textController,
          autofocus: true,
          enabled: !isSubmitting,
          textInputAction: TextInputAction.done,
          onSubmitted: inputNotEmpty ? (_) => _submit() : null,
          style: TextStyle(
            color: colorScheme.onSurface,
            fontSize: 16,
          ),
          decoration: InputDecoration(
            hintText: 'e.g. "Buy groceries tomorrow 3pm"',
            hintStyle: TextStyle(
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.50 : 0.35),
            ),
            filled: true,
            fillColor: isLight
                ? Colors.white.withValues(alpha: 0.7)
                : colorScheme.surfaceContainerHigh.withValues(alpha: 0.4),
            suffixIcon: Padding(
              padding: const EdgeInsets.only(right: 4),
              child: VoiceInputButton(
                onResult: (text) {
                  _textController.text = text;
                  _textController.selection = TextSelection.fromPosition(
                    TextPosition(offset: text.length),
                  );
                },
              ),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: isLight
                    ? const Color(0xFF1A0533).withValues(alpha: 0.08)
                    : colorScheme.outlineVariant.withValues(alpha: 0.15),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(
                color: ux.gold.withValues(alpha: isLight ? 0.5 : 0.6),
                width: 1.5,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Parsed preview chips
        ParsedPreviewBar(result: parsed),
        const SizedBox(height: 24),

        // Submit button
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: inputNotEmpty && !isSubmitting ? _submit : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: ux.gold,
              foregroundColor: isLight
                  ? const Color(0xFF1A0533)
                  : Colors.black,
              disabledBackgroundColor: ux.gold.withValues(alpha: 0.3),
              disabledForegroundColor: isLight
                  ? const Color(0xFF1A0533).withValues(alpha: 0.4)
                  : Colors.black.withValues(alpha: 0.4),
              elevation: isLight ? 2 : 0,
              shadowColor: isLight
                  ? const Color(0xFF1A0533).withValues(alpha: 0.15)
                  : Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
            child: isSubmitting
                ? SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: isLight
                          ? const Color(0xFF1A0533)
                          : Colors.black,
                    ),
                  )
                : const Text(
                    'Your journey begins!',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),

        const SizedBox(height: 48),
      ],
    ),
    );
  }

  // ---------------------------------------------------------------------------
  // Success state
  // ---------------------------------------------------------------------------

  Widget _buildSuccessState(
    UnjynxCustomColors ux,
    ColorScheme colorScheme,
    bool isLight,
  ) {
    return Column(
      children: [
        const Spacer(),
        AnimatedBuilder(
          animation: _successScale,
          builder: (context, child) {
            return Transform.scale(
              scale: _successScale.value,
              child: child,
            );
          },
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Gold sparkle icons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Transform.rotate(
                    angle: -math.pi / 8,
                    child: Icon(
                      Icons.auto_awesome,
                      size: 28,
                      color: ux.gold.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(Icons.auto_awesome, size: 48, color: ux.gold),
                  const SizedBox(width: 8),
                  Transform.rotate(
                    angle: math.pi / 8,
                    child: Icon(
                      Icons.auto_awesome,
                      size: 28,
                      color: ux.gold.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Task created!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: isLight ? FontWeight.w800 : FontWeight.bold,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                "You're all set. Let's make sure you never miss it.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.85 : 0.7),
                ),
              ),
            ],
          ),
        ),
        const Spacer(),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Submit logic
  // ---------------------------------------------------------------------------

  Future<void> _submit() async {
    if (_textController.text.trim().isEmpty) return;

    // Haptic feedback
    HapticFeedback.mediumImpact();

    ref.read(firstTaskSubmittingProvider.notifier).set(true);

    // Simulate task creation (backend not wired during onboarding)
    await Future<void>.delayed(const Duration(milliseconds: 500));

    if (!mounted) return;

    ref.read(firstTaskSubmittingProvider.notifier).set(false);
    ref.read(firstTaskCreatedProvider.notifier).set(true);

    // Play success animation
    _successController.forward();

    // Stronger haptic for success
    HapticFeedback.heavyImpact();

    // Wait for animation, then navigate
    await Future<void>.delayed(const Duration(milliseconds: 1200));

    if (mounted) {
      context.go('/onboarding/notifications');
    }
  }
}

// ---------------------------------------------------------------------------
// Example chip widget
// ---------------------------------------------------------------------------

class _ExampleChip extends StatelessWidget {
  const _ExampleChip({
    required this.label,
    required this.onTap,
  });

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isLight
              ? colorScheme.primaryContainer.withValues(alpha: 0.35)
              : colorScheme.primaryContainer.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isLight
                ? colorScheme.primary.withValues(alpha: 0.15)
                : colorScheme.primary.withValues(alpha: 0.20),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: colorScheme.onSurfaceVariant
                .withValues(alpha: isLight ? 0.80 : 0.65),
          ),
        ),
      ),
    );
  }
}
