import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/personalization_providers.dart';
import '../widgets/channel_toggle_list.dart';
import '../widgets/content_category_grid.dart';
import '../widgets/goal_chip_selector.dart';
import '../widgets/identity_selector.dart';
import '../widgets/progress_bar_widget.dart';

/// 4-step personalization flow (B2 onboarding).
///
/// Steps:
/// 0. Identity selection ("What describes you best?")
/// 1. Goal selection ("What do you want to unjynx?")
/// 2. Channel toggles ("Where should we remind you?")
/// 3. Content categories ("Pick your daily inspiration")
class PersonalizationPage extends ConsumerStatefulWidget {
  const PersonalizationPage({super.key});

  @override
  ConsumerState<PersonalizationPage> createState() =>
      _PersonalizationPageState();
}

class _PersonalizationPageState extends ConsumerState<PersonalizationPage> {
  final _pageController = PageController();

  static const _totalSteps = 4;
  static const _pageDuration = Duration(milliseconds: 300);
  static const _pageCurve = Curves.easeInOut;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final currentStep = ref.watch(
      personalizationStateProvider.select((s) => s.currentStep),
    );

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
          child: Column(
            children: [
              // Progress bar.
              ProgressBarWidget(
                totalSteps: _totalSteps,
                currentStep: currentStep,
              ),

              // Scrollable page content.
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildStep(
                      title: 'What describes you best?',
                      subtitle: 'This helps us tailor your experience',
                      child: const IdentitySelector(),
                    ),
                    _buildStep(
                      title: 'What do you want to unjynx?',
                      subtitle: 'Pick as many as you like',
                      child: const GoalChipSelector(),
                    ),
                    _buildStep(
                      title: 'Where should we remind you?',
                      subtitle: 'Turn on the channels you use most',
                      child: const ChannelToggleList(),
                    ),
                    _buildStep(
                      title: 'Pick your daily inspiration',
                      subtitle: 'Free plan: 1 category',
                      child: const ContentCategoryGrid(),
                    ),
                  ],
                ),
              ),

              // Bottom navigation buttons.
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                child: Row(
                  children: [
                    // Back button (only visible on steps 1-3).
                    if (currentStep > 0)
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: OutlinedButton(
                            onPressed: _goBack,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: colorScheme.onSurfaceVariant,
                              side: BorderSide(
                                color: colorScheme.onSurfaceVariant
                                    .withValues(
                                        alpha: isLight ? 0.25 : 0.2),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: const Text(
                              'Back',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),

                    if (currentStep > 0) const SizedBox(width: 12),

                    // Next / Let's go! button.
                    Expanded(
                      flex: currentStep > 0 ? 2 : 1,
                      child: SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: _isLastStep(currentStep)
                              ? _finishPersonalization
                              : _goNext,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ux.gold,
                            foregroundColor: isLight
                                ? const Color(0xFF1A0533)
                                : Colors.black,
                            elevation: isLight ? 2 : 0,
                            shadowColor: isLight
                                ? const Color(0xFF1A0533)
                                    .withValues(alpha: 0.15)
                                : Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            _isLastStep(currentStep) ? "Let's go!" : 'Next',
                            style: const TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds a scrollable step layout with title, subtitle, and content.
  Widget _buildStep({
    required String title,
    required String subtitle,
    required Widget child,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return SingleChildScrollView(
      padding: const EdgeInsets.only(top: 8, bottom: 16),
      child: StaggeredColumn(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              title,
              style: TextStyle(
                fontSize: 26,
                fontWeight: isLight ? FontWeight.w800 : FontWeight.bold,
                color: colorScheme.onSurface,
                height: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 6),

          // Subtitle.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              subtitle,
              style: TextStyle(
                fontSize: 15,
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.7 : 0.55),
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Step-specific content widget.
          child,
        ],
      ),
    );
  }

  bool _isLastStep(int step) => step == _totalSteps - 1;

  void _goNext() {
    HapticFeedback.lightImpact();
    ref.read(personalizationStateProvider.notifier).nextStep();
    _pageController.nextPage(
      duration: _pageDuration,
      curve: _pageCurve,
    );
  }

  void _goBack() {
    HapticFeedback.lightImpact();
    ref.read(personalizationStateProvider.notifier).previousStep();
    _pageController.previousPage(
      duration: _pageDuration,
      curve: _pageCurve,
    );
  }

  Future<void> _finishPersonalization() async {
    HapticFeedback.mediumImpact();
    try {
      await ref
          .read(personalizationStateProvider.notifier)
          .savePreferences();
    } catch (e) {
      // Log but don't block navigation — preferences can be re-entered later.
      debugPrint('Failed to save personalization preferences: $e');
    }

    if (mounted) {
      GoRouter.of(context).go('/onboarding/first-task');
    }
  }
}
