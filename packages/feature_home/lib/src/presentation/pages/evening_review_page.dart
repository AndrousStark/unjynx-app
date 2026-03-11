import 'package:feature_home/src/presentation/pages/evening_review/evening_review_completion_overlay.dart';
import 'package:feature_home/src/presentation/pages/evening_review/evening_review_step1_day_recap.dart';
import 'package:feature_home/src/presentation/pages/evening_review/evening_review_step2_wins.dart';
import 'package:feature_home/src/presentation/pages/evening_review/evening_review_step3_carry_forward.dart';
import 'package:feature_home/src/presentation/pages/evening_review/evening_review_step4_reflection.dart';
import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/ritual_step_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Evening Review (H4) -- a calming, cooler-toned retrospective flow.
///
/// Four steps guide the user through an end-of-day reflection:
/// 1. Day Recap - completion ring + stats
/// 2. Wins - completed tasks celebration
/// 3. Carry Forward - incomplete tasks (future: reschedule)
/// 4. Reflection - free-form journaling
///
/// Cooler color palette (indigo/blue accents) with gentler transitions
/// compared to the warm sunrise feel of the Morning Ritual.
class EveningReviewPage extends ConsumerStatefulWidget {
  const EveningReviewPage({super.key});

  @override
  ConsumerState<EveningReviewPage> createState() => _EveningReviewPageState();
}

class _EveningReviewPageState extends ConsumerState<EveningReviewPage>
    with SingleTickerProviderStateMixin {
  static const _totalSteps = 4;

  final _pageController = PageController();
  final _reflectionController = TextEditingController();

  int _currentStep = 0;
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
      duration: const Duration(milliseconds: 900),
    );

    _completionScale = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _completionController,
        curve: Curves.easeOutCubic,
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
    _reflectionController.dispose();
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

  Future<void> _completeReview() async {
    if (_isCompleting) return;

    HapticFeedback.mediumImpact();
    setState(() => _isCompleting = true);

    // Persist evening reflection text via the ritual save callback.
    final reflectionText = _reflectionController.text.trim();
    final saveCallback = ref.read(eveningReviewSaveCallbackProvider);
    try {
      await saveCallback(
        reflection: reflectionText.isNotEmpty ? reflectionText : null,
      );
    } on Exception catch (_) {
      // Non-blocking: allow review completion even if persist fails.
    }

    await _completionController.forward();
    await Future<void>.delayed(const Duration(milliseconds: 500));

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
                    // Cool evening palette -- light
                    Color(0xFFF0EAFC), // lavender
                    Color(0xFFE8E0F5), // deeper lavender
                    Color(0xFFE2D9F3), // softer violet
                  ]
                : const [
                    // Cool evening palette -- dark
                    Color(0xFF0F0A2E), // darker midnight
                    Color(0xFF1A0A2E), // midnightPurple
                    Color(0xFF0D0D1A), // near-black indigo
                  ],
            stops: const [0.0, 0.5, 1.0],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Main content
              Column(
                children: [
                  // -- Header bar --
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
                        DayRecapStep(ref: ref),
                        WinsStep(ref: ref),
                        CarryForwardStep(ref: ref),
                        ReflectionStep(controller: _reflectionController),
                      ],
                    ),
                  ),

                  // -- Bottom nav --
                  _BottomNav(
                    isLastStep: _currentStep == _totalSteps - 1,
                    onNext: _nextStep,
                    onSkip: _skipStep,
                    onComplete: _completeReview,
                    isCompleting: _isCompleting,
                  ),
                ],
              ),

              // -- Completion overlay --
              if (_isCompleting)
                EveningReviewCompletionOverlay(
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
          IconButton(
            icon: Icon(
              Icons.close_rounded,
              color: colorScheme.onSurfaceVariant,
            ),
            onPressed: onClose,
            tooltip: 'Close',
          ),
          Expanded(
            child: RitualStepIndicator(
              totalSteps: totalSteps,
              currentStep: currentStep,
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}

// ===========================================================================
// Bottom Navigation
// ===========================================================================

class _BottomNav extends StatelessWidget {
  const _BottomNav({
    required this.isLastStep,
    required this.onNext,
    required this.onSkip,
    required this.onComplete,
    required this.isCompleting,
  });

  final bool isLastStep;
  final VoidCallback onNext;
  final VoidCallback onSkip;
  final VoidCallback onComplete;
  final bool isCompleting;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Primary button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isCompleting
                  ? null
                  : (isLastStep ? onComplete : onNext),
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: colorScheme.onPrimary,
                disabledBackgroundColor:
                    colorScheme.primary.withValues(alpha: 0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: Text(
                isLastStep ? 'Complete Review' : 'Next',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),

          // Skip button (not on last step)
          if (!isLastStep) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: onSkip,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Text(
                  'Skip',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
