import 'package:flutter/foundation.dart';

import '../domain/models/subscription.dart';

/// RevenueCat SDK wrapper for in-app purchase management.
///
/// **Stubbed out** — purchases_flutter has a freezed_annotation version
/// conflict with the rest of the monorepo. When RevenueCat is ready:
/// 1. Add `purchases_flutter: ^9.x` (needs freezed_annotation ^3.0.0 compat)
/// 2. Replace this stub with the real implementation
///
/// All methods gracefully return defaults so the billing UI works.
class RevenueCatManager {
  RevenueCatManager._();

  static bool _initialized = false;

  /// Whether RevenueCat has been successfully initialized.
  static bool get isInitialized => _initialized;

  /// Initialize RevenueCat with the given API key.
  static Future<void> initialize({
    required String apiKey,
    String? userId,
  }) async {
    if (apiKey.isEmpty) {
      debugPrint('RevenueCat: skipped (no API key)');
      return;
    }
    debugPrint('RevenueCat: stubbed (purchases_flutter not yet compatible)');
  }

  /// Log in the user (call after auth to link purchases).
  static Future<void> logIn(String userId) async {
    if (!_initialized) return;
    debugPrint('RevenueCat: logIn stubbed');
  }

  /// Log out the user (call on sign-out).
  static Future<void> logOut() async {
    if (!_initialized) return;
    debugPrint('RevenueCat: logOut stubbed');
  }

  /// Get the current subscription — always returns free (stubbed).
  static Future<Subscription> getSubscription() async {
    return Subscription.free;
  }

  /// Restore previous purchases — always returns free (stubbed).
  static Future<Subscription> restorePurchases() async {
    return Subscription.free;
  }
}
