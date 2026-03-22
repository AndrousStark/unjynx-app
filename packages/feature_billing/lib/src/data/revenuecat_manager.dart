import '../domain/models/subscription.dart';
import 'purchase_manager.dart';

/// Legacy RevenueCat facade -- now delegates to [PurchaseManager].
///
/// Retained for backward compatibility with existing provider code.
/// New code should use [PurchaseManager] directly.
@Deprecated('Use PurchaseManager instead')
class RevenueCatManager {
  RevenueCatManager._();

  /// Whether the purchase system has been initialized.
  static bool get isInitialized => PurchaseManager.instance.isInitialized;

  /// Initialize the purchase system.
  static Future<void> initialize({
    required String apiKey,
    String? userId,
  }) async {
    await PurchaseManager.instance.initialize();
  }

  /// Log in the user (no-op for in_app_purchase -- identity handled by store).
  static Future<void> logIn(String userId) async {
    // Identity is tied to the App Store / Play Store account.
  }

  /// Log out the user (no-op).
  static Future<void> logOut() async {
    // No sign-out concept in native store billing.
  }

  /// Get current subscription.
  static Future<Subscription> getSubscription() async {
    return PurchaseManager.instance.currentSubscription;
  }

  /// Restore purchases.
  static Future<Subscription> restorePurchases() async {
    final result = await PurchaseManager.instance.restorePurchases();
    return result.subscription;
  }
}
