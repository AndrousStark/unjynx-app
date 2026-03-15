import 'package:feature_onboarding/feature_onboarding.dart';
import 'package:feature_settings/feature_settings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_auth/service_auth.dart';
import 'package:unjynx_core/core.dart';

import 'package:unjynx_mobile/routing/app_router.dart';

/// Root widget for the UNJYNX application.
class UnjynxApp extends ConsumerStatefulWidget {
  const UnjynxApp({required this.registry, super.key});

  final PluginRegistry registry;

  @override
  ConsumerState<UnjynxApp> createState() => _UnjynxAppState();
}

class _UnjynxAppState extends ConsumerState<UnjynxApp> {
  late GoRouter _router;
  bool _lastOnboarding = false;
  bool _lastAuth = true;
  bool _initialized = false;

  GoRouter _buildRouter({
    required bool isOnboardingComplete,
    required bool isAuthenticated,
  }) {
    _lastOnboarding = isOnboardingComplete;
    _lastAuth = isAuthenticated;
    _initialized = true;
    return createAppRouter(
      widget.registry,
      isOnboardingComplete: isOnboardingComplete,
      isAuthenticated: isAuthenticated,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isComplete = ref.watch(isOnboardingCompleteProvider);
    final themeMode = ref.watch(themeModeProvider);

    // Watch auth state reactively. MockAuthPort always returns true,
    // LogtoAuthPort will return actual state when wired.
    final authAsync = ref.watch(isAuthenticatedProvider);

    // Show branded splash while auth state resolves to avoid
    // flashing authenticated UI to unauthenticated users.
    if (authAsync.isLoading) {
      return MaterialApp(
        title: 'UNJYNX',
        debugShowCheckedModeBanner: false,
        theme: UnjynxTheme.light,
        darkTheme: UnjynxTheme.dark,
        themeMode: themeMode,
        home: const UnjynxSplash(),
      );
    }

    final isAuthenticated = authAsync.value ?? false;

    // Rebuild router if onboarding or auth state changed
    if (!_initialized ||
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
    );
  }
}
