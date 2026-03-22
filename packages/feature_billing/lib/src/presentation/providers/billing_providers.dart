import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:service_api/service_api.dart';

import '../../data/purchase_manager.dart';
import '../../domain/models/plan_info.dart';
import '../../domain/models/subscription.dart';

/// Safely tries to read a provider that may not exist in the scope.
///
/// When feature_billing is used without service_api providers
/// being overridden (e.g. in tests), this returns null instead of throwing.
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Purchase manager singleton
// ---------------------------------------------------------------------------

/// Provides the [PurchaseManager] singleton with backend verification wired in.
final purchaseManagerProvider = Provider<PurchaseManager>((ref) {
  final manager = PurchaseManager.instance;
  final api = _tryRead(ref, billingApiProvider);

  // Wire up receipt verification to the backend
  if (api != null) {
    manager.onVerifyReceipt = (receipt, productId) async {
      final platform = Platform.isIOS ? 'ios' : 'android';
      final response = await api.verifyReceipt(
        receipt: receipt,
        productId: productId,
        platform: platform,
      );
      if (response.success && response.data != null) {
        return Subscription.fromJson(response.data!);
      }
      return Subscription.free;
    };
  }

  return manager;
});

/// Initialize the purchase manager at app startup.
final purchaseManagerInitProvider = FutureProvider<void>((ref) async {
  final manager = ref.watch(purchaseManagerProvider);
  await manager.initialize();
});

// ---------------------------------------------------------------------------
// Subscription state
// ---------------------------------------------------------------------------

/// Current user's subscription.
///
/// Checks the purchase manager first (instant, works offline), then
/// falls back to the billing API. Returns [Subscription.free] when
/// neither source is available.
final subscriptionProvider = FutureProvider<Subscription>((ref) async {
  final manager = ref.watch(purchaseManagerProvider);

  // PurchaseManager is the source of truth for subscription status
  if (manager.isInitialized && manager.currentSubscription.isPaid) {
    return manager.currentSubscription;
  }

  // Fallback to backend API
  final api = _tryRead(ref, billingApiProvider);
  if (api == null) return Subscription.free;

  try {
    final response = await api.getSubscription();
    if (response.success && response.data != null) {
      return Subscription.fromJson(response.data!);
    }
    return Subscription.free;
  } on ApiException {
    return Subscription.free;
  } catch (_) {
    return Subscription.free;
  }
});

// ---------------------------------------------------------------------------
// Available plans
// ---------------------------------------------------------------------------

/// All available plans.
///
/// Fetches from the billing API; falls back to [PlanInfo.allPlans] when the
/// API is unavailable.
final plansProvider = FutureProvider<List<PlanInfo>>((ref) async {
  final api = _tryRead(ref, billingApiProvider);
  if (api == null) return PlanInfo.allPlans;

  try {
    final response = await api.getPlans();
    if (response.success && response.data != null) {
      return (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map(PlanInfo.fromJson)
          .toList();
    }
    return PlanInfo.allPlans;
  } on ApiException {
    return PlanInfo.allPlans;
  } catch (_) {
    return PlanInfo.allPlans;
  }
});

/// Store product details fetched from App Store / Play Store.
final storeProductsProvider = Provider<List<ProductDetails>>((ref) {
  final manager = ref.watch(purchaseManagerProvider);
  return manager.products;
});

// ---------------------------------------------------------------------------
// Derived providers
// ---------------------------------------------------------------------------

/// Whether the user is on a free plan.
final isFreePlanProvider = Provider<AsyncValue<bool>>((ref) {
  return ref.watch(subscriptionProvider).whenData(
        (sub) => sub.plan == PlanType.free,
      );
});

/// Whether the user is on a Pro or higher plan.
final isProProvider = Provider<AsyncValue<bool>>((ref) {
  return ref.watch(subscriptionProvider).whenData(
        (sub) => sub.plan != PlanType.free,
      );
});

// ---------------------------------------------------------------------------
// Purchase actions
// ---------------------------------------------------------------------------

/// Purchase a plan by product ID.
///
/// Returns a [PurchaseResult] and invalidates the subscription provider
/// on success to refresh the UI.
Future<PurchaseResult> purchasePlan(
  WidgetRef ref,
  String productId,
) async {
  final manager = ref.read(purchaseManagerProvider);
  final result = await manager.purchase(productId);

  if (result.success) {
    ref.invalidate(subscriptionProvider);
  }

  return result;
}

/// Restore previous purchases.
Future<PurchaseResult> restorePurchases(WidgetRef ref) async {
  final manager = ref.read(purchaseManagerProvider);
  final result = await manager.restorePurchases();
  ref.invalidate(subscriptionProvider);
  return result;
}

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------

/// Notifier for the annual billing toggle.
class _IsAnnualBillingNotifier extends Notifier<bool> {
  @override
  bool build() => true;
  void set(bool value) => state = value;
}

/// Notifier for the free trial toggle.
class _FreeTrialEnabledNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void set(bool value) => state = value;
}

/// Annual billing toggle state.
final isAnnualBillingProvider =
    NotifierProvider<_IsAnnualBillingNotifier, bool>(
  _IsAnnualBillingNotifier.new,
);

/// Free trial toggle state.
final freeTrialEnabledProvider =
    NotifierProvider<_FreeTrialEnabledNotifier, bool>(
  _FreeTrialEnabledNotifier.new,
);

/// Feature comparison data for the comparison page.
final featureComparisonProvider =
    Provider<List<FeatureComparisonRow>>((ref) {
  return [
    const FeatureComparisonRow(
      feature: 'Active tasks',
      free: '50',
      pro: 'Unlimited',
      team: 'Unlimited',
    ),
    const FeatureComparisonRow(
      feature: 'Projects',
      free: '1',
      pro: 'Unlimited',
      team: 'Unlimited + Shared',
    ),
    const FeatureComparisonRow(
      feature: 'Push notifications',
      free: 'Yes',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'WhatsApp reminders',
      free: 'No',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Telegram reminders',
      free: 'No',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Email reminders',
      free: 'No',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'AI smart scheduling',
      free: 'No',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Export to PDF',
      free: 'No',
      pro: 'Yes',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Team workspaces',
      free: 'No',
      pro: 'No',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Admin panel',
      free: 'No',
      pro: 'No',
      team: 'Yes',
    ),
    const FeatureComparisonRow(
      feature: 'Daily standups',
      free: 'No',
      pro: 'No',
      team: 'Yes',
    ),
  ];
});

/// A row in the feature comparison table.
class FeatureComparisonRow {
  final String feature;
  final String free;
  final String pro;
  final String team;

  const FeatureComparisonRow({
    required this.feature,
    required this.free,
    required this.pro,
    required this.team,
  });
}
