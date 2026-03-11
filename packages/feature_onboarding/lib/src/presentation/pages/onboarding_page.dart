import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../widgets/onboarding_slide.dart';
import '../widgets/page_indicator.dart';

/// Onboarding flow with 3 value-proposition slides.
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _pageController = PageController();
  int _currentPage = 0;

  static const _slideCount = 3;

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

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            // Light: white to lavender (warm, editorial feel)
            // Dark: deep purple to midnight (immersive depth)
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: StaggeredColumn(
            mainAxisSize: MainAxisSize.max,
            children: [
              // Skip button
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextButton(
                    onPressed: _completeOnboarding,
                    child: Text(
                      _isLastPage ? '' : 'Skip',
                      style: TextStyle(
                        // Light needs higher opacity for readability
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: isLight ? 0.65 : 0.5),
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
              ),

              // Slides
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (index) =>
                      setState(() => _currentPage = index),
                  children: [
                    OnboardingSlide(
                      icon: Icons.bolt_rounded,
                      iconColor: ux.gold,
                      title: 'Break the Satisfactory',
                      subtitle:
                          'UNJYNX is not just another TODO app. '
                          'It\'s your AI-powered productivity partner that '
                          'reminds you where you actually are — WhatsApp, '
                          'Telegram, SMS, and more.',
                    ),
                    OnboardingSlide(
                      icon: Icons.notifications_active_rounded,
                      iconColor: colorScheme.primary,
                      title: 'Reminders That Find You',
                      subtitle:
                          'Missed the push notification? We\'ll escalate to '
                          'WhatsApp. Still missed it? SMS. Then a call. '
                          'Your tasks won\'t slip through the cracks.',
                    ),
                    OnboardingSlide(
                      icon: Icons.auto_awesome_rounded,
                      iconColor: ux.success,
                      title: 'Daily Fuel for Growth',
                      subtitle:
                          'Start each day with handpicked quotes, growth '
                          'mindset tips, and wisdom from legends. '
                          'Delivered to your favorite channel.',
                    ),
                  ],
                ),
              ),

              // Indicator + button
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                child: Column(
                  children: [
                    PageIndicator(
                      count: _slideCount,
                      currentIndex: _currentPage,
                    ),
                    const SizedBox(height: 32),

                    // Next / Get Started button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLastPage
                            ? _completeOnboarding
                            : _nextPage,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isLastPage
                              ? ux.gold
                              : colorScheme.primary,
                          // Light: dark text on gold/primary for contrast
                          // Dark: white/black text for contrast
                          foregroundColor: _isLastPage
                              ? (isLight
                                  ? const Color(0xFF1A0533)
                                  : Colors.black)
                              : Colors.white,
                          elevation: isLight ? 2 : 0,
                          shadowColor: isLight
                              ? const Color(0xFF1A0533).withValues(alpha: 0.15)
                              : Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: Text(
                          _isLastPage ? 'Get Started' : 'Next',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
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

  bool get _isLastPage => _currentPage == _slideCount - 1;

  void _nextPage() {
    HapticFeedback.lightImpact();
    _pageController.nextPage(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  void _completeOnboarding() {
    HapticFeedback.lightImpact();
    GoRouter.of(context).go('/onboarding/personalize');
  }
}
