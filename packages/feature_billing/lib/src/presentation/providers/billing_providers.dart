import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../data/revenuecat_manager.dart';
import '../../domain/models/plan_info.dart';
import '../../domain/models/subscription.dart';

/// Safely tries to read a provider that may not exist in the scope.
///
/// When feature_billing is used without service_api providers
/// being overridden (e.g. in tests), this returns null instead of throwing.
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } on StateError {
    return null;
  }
}

/// Current user's subscription.
///
/// Checks RevenueCat entitlements first (instant, works offline), then
/// falls back to the billing API. Returns [Subscription.free] when
/// neither source is available.
final subscriptionProvider = FutureProvider<Subscription>((ref) async {
  // RevenueCat is the source of truth for subscription status
  if (RevenueCatManager.isInitialized) {
    final sub = await RevenueCatManager.getSubscription();
    if (sub.isPaid) return sub;
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

/// Restore previous purchases.
Future<Subscription> restorePurchases(WidgetRef ref) async {
  final sub = await RevenueCatManager.restorePurchases();
  ref.invalidate(subscriptionProvider);
  return sub;
}

/// Annual billing toggle state.
final isAnnualBillingProvider = StateProvider<bool>((ref) => true);

/// Free trial toggle state.
final freeTrialEnabledProvider = StateProvider<bool>((ref) => false);

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
