import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_bottom_nav.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_completion_overlay.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_step1.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_step2.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_step3.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_step4.dart';
import 'package:feature_home/src/presentation/pages/morning_ritual/morning_ritual_step5.dart';
import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/ritual_step_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Morning Ritual (H3) -- a warm, sunrise-themed sequential flow.
///
/// Five steps guide the user through a morning check-in:
/// 1. Mood Check-in (emoji selector)
/// 2. Gratitude journaling
/// 3. Daily content preview (today's quote)
/// 4. Day preview (top 3 tasks)
/// 5. Intention setting + "Go Break the Curse!" CTA
///
/// Uses a [PageView] controlled by a page controller with a
/// [RitualStepIndicator] at the top. Local state holds mood, gratitude
/// text, and intention text. On completion, a gold checkmark animation
/// plays before popping back to the home screen.
class MorningRitualPage extends ConsumerStatefulWidget {
  const MorningRitualPage({super.key});

  @override
  ConsumerState<MorningRitualPage> createState() => _MorningRitualPageState();
}

class _MorningRitualPageState extends ConsumerState<MorningRitualPage>
    with SingleTickerProviderStateMixin {
  static const _totalSteps = 5;

  final _pageController = PageController();
  final _gratitudeController = TextEditingController();
  final _intentionController = TextEditingController();

  int _currentStep = 0;
  int? _selectedMood;
  bool _isCompleting = false;

  // Completion animation.
  late final AnimationController _completionController;
  late final Animation<double> _completionScale;
  late final Animation<double> _completionOpacity;

  @override
  void initState() {
    super.initState();

    _completionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _completionScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _completionController,
        curve: Curves.elasticOut,
      ),
    );

    _completionOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _completionController,
        curve: const Interval(0, 0.4, curve: Curves.easeOut),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    _gratitudeController.dispose();
    _intentionController.dispose();
    _completionController.dispose();
    super.dispose();
  }

  void _goToStep(int step) {
    if (step < 0 || step >= _totalSteps) return;

    setState(() => _currentStep = step);
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOutCubic,
    );
  }

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      HapticFeedback.lightImpact();
      _goToStep(_currentStep + 1);
    }
  }

  void _skipStep() {
    _nextStep();
  }

  Future<void> _completeRitual() async {
    if (_isCompleting) return;

    HapticFeedback.mediumImpact();
    setState(() => _isCompleting = true);

    // Persist morning ritual data via the ritual save callback.
    final gratitudeText = _gratitudeController.text.trim();
    final intentionText = _intentionController.text.trim();
    final saveCallback = ref.read(morningRitualSaveCallbackProvider);
    try {
      await saveCallback(
        mood: _selectedMood,
        gratitude: gratitudeText.isNotEmpty ? gratitudeText : null,
        intention: intentionText.isNotEmpty ? intentionText : null,
      );
    } on Exception catch (_) {
      // Non-blocking: allow ritual completion even if persist fails.
    }

    await _completionController.forward();
    await Future<void>.delayed(const Duration(milliseconds: 400));

    if (mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? const [
                    // Warm sunrise palette -- light
                    Color(0xFFFFF8E1), // gold wash
                    Color(0xFFF8F5FF), // purple mist
                    Color(0xFFF0EAFC), // lavender
                  ]
                : const [
                    // Warm sunrise palette -- dark
                    Color(0xFF2D1B69), // deepPurple
                    Color(0xFF1A0A2E), // midnightPurple
                    Color(0xFF1E1220), // hint of warm darkness
                  ],
            stops: const [0.0, 0.6, 1.0],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Main content
              Column(
                children: [
                  // -- Header bar with back + step indicator --
                  _HeaderBar(
                    currentStep: _currentStep,
                    totalSteps: _totalSteps,
                    onClose: () => context.pop(),
                  ),

                  const SizedBox(height: 8),

                  // -- PageView steps --
                  Expanded(
                    child: PageView(
                      controller: _pageController,
                      physics: const NeverScrollableScrollPhysics(),
                      onPageChanged: (index) {
                        setState(() => _currentStep = index);
                      },
                      children: [
                        MoodStep(
                          selectedMood: _selectedMood,
                          onMoodSelected: (mood) {
                            setState(() => _selectedMood = mood);
                          },
                        ),
                        GratitudeStep(controller: _gratitudeController),
                        DailyContentStep(ref: ref),
                        DayPreviewStep(ref: ref),
                        IntentionStep(controller: _intentionController),
                      ],
                    ),
                  ),

                  // -- Bottom nav (Next / Skip / Complete) --
                  MorningRitualBottomNav(
                    currentStep: _currentStep,
                    totalSteps: _totalSteps,
                    isLastStep: _currentStep == _totalSteps - 1,
                    onNext: _nextStep,
                    onSkip: _skipStep,
                    onComplete: _completeRitual,
                    isCompleting: _isCompleting,
                  ),
                ],
              ),

              // -- Completion overlay --
              if (_isCompleting)
                MorningRitualCompletionOverlay(
                  scaleAnimation: _completionScale,
                  opacityAnimation: _completionOpacity,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ===========================================================================
// Header Bar
// ===========================================================================

class _HeaderBar extends StatelessWidget {
  const _HeaderBar({
    required this.currentStep,
    required this.totalSteps,
    required this.onClose,
  });

  final int currentStep;
  final int totalSteps;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      child: Row(
        children: [
          // Close button
          IconButton(
            icon: Icon(
              Icons.close_rounded,
              color: colorScheme.onSurfaceVariant,
            ),
            onPressed: onClose,
            tooltip: 'Close',
          ),

          // Step indicator (centered)
          Expanded(
            child: RitualStepIndicator(
              totalSteps: totalSteps,
              currentStep: currentStep,
            ),
          ),

          // Spacer for symmetry
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}
