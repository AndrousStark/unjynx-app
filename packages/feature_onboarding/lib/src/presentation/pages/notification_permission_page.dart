import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/notification_permission_providers.dart';
import '../providers/onboarding_providers.dart';
import '../widgets/permission_explainer_card.dart';

/// B4 — Notification Permission screen.
///
/// Shows a [PermissionExplainerCard], a gold CTA with a pulsing glow,
/// and a muted "Not now" skip button. On any exit path (granted, denied,
/// skip) the onboarding is marked complete and the user is routed to `/`.
class NotificationPermissionPage extends ConsumerStatefulWidget {
  const NotificationPermissionPage({super.key});

  @override
  ConsumerState<NotificationPermissionPage> createState() =>
      _NotificationPermissionPageState();
}

class _NotificationPermissionPageState
    extends ConsumerState<NotificationPermissionPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _glowController;
  bool _isRequesting = false;

  @override
  void initState() {
    super.initState();

    // Pulse glow: 3-second cycle for the CTA shadow
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();
  }

  @override
  void dispose() {
    _glowController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

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
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const Spacer(),

                // Explainer card
                const PermissionExplainerCard(),
                const SizedBox(height: 32),

                // Gold CTA with pulsing glow
                AnimatedBuilder(
                  animation: _glowController,
                  builder: (context, child) {
                    // Sine-based glow: shadow radius & opacity pulse
                    final pulse = (math.sin(
                              _glowController.value * 2 * math.pi,
                            ) +
                            1) /
                        2; // 0..1

                    final glowOpacity = isLight
                        ? 0.10 + pulse * 0.15
                        : 0.15 + pulse * 0.25;
                    final glowBlur = isLight
                        ? 8.0 + pulse * 12.0
                        : 12.0 + pulse * 20.0;
                    final glowSpread = isLight
                        ? 1.0 + pulse * 3.0
                        : 2.0 + pulse * 6.0;

                    return Container(
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: ux.gold.withValues(alpha: glowOpacity),
                            blurRadius: glowBlur,
                            spreadRadius: glowSpread,
                          ),
                        ],
                      ),
                      child: child,
                    );
                  },
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isRequesting ? null : _requestPermission,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ux.gold,
                        foregroundColor: isLight
                            ? const Color(0xFF1A0533)
                            : Colors.black,
                        elevation: isLight ? 2 : 0,
                        shadowColor: isLight
                            ? const Color(0xFF1A0533).withValues(alpha: 0.15)
                            : Colors.transparent,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: _isRequesting
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
                              'Enable Notifications',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Skip button
                TextButton(
                  onPressed: _isRequesting ? null : _skip,
                  child: Text(
                    'Not now',
                    style: TextStyle(
                      fontSize: 16,
                      color: colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.55 : 0.40),
                    ),
                  ),
                ),

                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _requestPermission() async {
    setState(() => _isRequesting = true);

    HapticFeedback.mediumImpact();

    final granted = await requestNotificationPermission(ref);

    if (!mounted) return;

    setState(() => _isRequesting = false);

    if (granted) {
      HapticFeedback.lightImpact();
    }

    // Complete onboarding regardless of outcome
    await _finishOnboarding();
  }

  Future<void> _skip() async {
    HapticFeedback.lightImpact();
    ref.read(notificationPermissionStatusProvider.notifier).set('denied');
    await _finishOnboarding();
  }

  Future<void> _finishOnboarding() async {
    final complete = ref.read(completeOnboardingProvider);
    await complete();

    if (mounted) {
      context.go('/home');
    }
  }
}
