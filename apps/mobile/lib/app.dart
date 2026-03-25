import 'package:feature_onboarding/feature_onboarding.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:get_it/get_it.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';
import 'package:service_auth/service_auth.dart';
import 'package:unjynx_core/core.dart';

import 'package:unjynx_mobile/fcm/fcm_token_manager.dart';
import 'package:unjynx_mobile/routing/app_router.dart';

/// Root widget for the UNJYNX application.
///
/// Uses a single [MaterialApp.router] with a splash overlay that fades
/// out once auth state resolves. This avoids the jarring full-tree rebuild
/// caused by switching between two separate [MaterialApp] widgets.
class UnjynxApp extends ConsumerStatefulWidget {
  const UnjynxApp({required this.registry, super.key});

  final PluginRegistry registry;

  @override
  ConsumerState<UnjynxApp> createState() => _UnjynxAppState();
}

class _UnjynxAppState extends ConsumerState<UnjynxApp> {
  late GoRouter _router;
  bool _lastOnboarding = false;
  bool _lastAuth = false;
  bool _routerInitialized = false;

  /// Whether the splash overlay has been dismissed.
  bool _splashDismissed = false;

  GoRouter _buildRouter({
    required bool isOnboardingComplete,
    required bool isAuthenticated,
  }) {
    _lastOnboarding = isOnboardingComplete;
    _lastAuth = isAuthenticated;
    _routerInitialized = true;
    return createAppRouter(
      widget.registry,
      isOnboardingComplete: isOnboardingComplete,
      isAuthenticated: isAuthenticated,
    );
  }

  void _retryFcmRegistration() {
    if (FcmTokenManager.isRegistered) return;
    try {
      final channelApi = ChannelApiService(GetIt.instance<ApiClient>());
      FcmTokenManager.retryRegistration(channelApi: channelApi);
    } on Exception catch (e) {
      debugPrint('FCM retry after login failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isComplete = ref.watch(isOnboardingCompleteProvider);
    final themeMode = ref.watch(themeModeProvider);

    // Watch auth state reactively. MockAuthPort always returns true,
    // LogtoAuthPort will return actual state when wired.
    final authAsync = ref.watch(isAuthenticatedProvider);
    final isLoading = authAsync.isLoading;

    // Default to unauthenticated while loading — the splash overlay
    // covers the screen so the underlying route is not visible.
    final isAuthenticated = authAsync.value ?? false;

    // Dismiss splash once auth resolves (one-way transition).
    if (!isLoading && !_splashDismissed) {
      _splashDismissed = true;
    }

    // When user transitions from unauthenticated → authenticated, retry
    // FCM token registration with the backend (fixes issue #23).
    if (isAuthenticated && !_lastAuth && _routerInitialized) {
      _retryFcmRegistration();
    }

    // Rebuild router if onboarding or auth state changed.
    if (!_routerInitialized ||
        _lastOnboarding != isComplete ||
        _lastAuth != isAuthenticated) {
      _router = _buildRouter(
        isOnboardingComplete: isComplete,
        isAuthenticated: isAuthenticated,
      );
    }

    return MaterialApp.router(
      title: 'UNJYNX',
      debugShowCheckedModeBanner: false,
      theme: UnjynxTheme.light,
      darkTheme: UnjynxTheme.dark,
      themeMode: themeMode,
      routerConfig: _router,
      builder: (context, child) {
        return Stack(
          children: [
            // The real app content (router)
            if (child != null) child,

            // Branded splash overlay — fades out once auth resolves.
            // AnimatedOpacity + IgnorePointer ensure no interaction during
            // the fade and the overlay is removed from the tree after
            // the animation completes.
            if (!_splashDismissed || isLoading)
              AnimatedOpacity(
                opacity: _splashDismissed ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 400),
                curve: Curves.easeOut,
                onEnd: () {
                  // Force rebuild to remove splash from tree entirely.
                  if (_splashDismissed) setState(() {});
                },
                child: const IgnorePointer(
                  child: UnjynxSplash(),
                ),
              ),
          ],
        );
      },
    );
  }
}
