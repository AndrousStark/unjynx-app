import 'package:dio/dio.dart';
import 'package:feature_billing/feature_billing.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Billing action providers
// ---------------------------------------------------------------------------

/// Start a 7-day free trial via the backend API.
///
/// Returns true on success. Called from the Free Trial toggle on the billing
/// page when the user confirms trial activation.
final startTrialProvider = Provider<Future<bool> Function()>((ref) {
  return () async {
    final api = _tryRead(ref, billingApiProvider);
    if (api == null) return false;

    try {
      final response = await api.startTrial(<String, dynamic>{});
      if (response.success) {
        ref.invalidate(subscriptionProvider);
        return true;
      }
    } on DioException {
      // Swallow — return false.
    }

    return false;
  };
});

/// Validate a coupon/promo code via the backend API.
///
/// Returns the discount data map on success, or null on failure.
final validateCouponProvider =
    Provider<Future<Map<String, dynamic>?> Function(String)>((ref) {
      return (String code) async {
        final api = _tryRead(ref, billingApiProvider);
        if (api == null) return null;

        try {
          final response = await api.validateCoupon(code);
          if (response.success && response.data != null) {
            return response.data!;
          }
        } on DioException {
          // Swallow — return null.
        }

        return null;
      };
    });

/// Toggle billing period (monthly ↔ annual) via the backend API.
///
/// Returns true on success.
final changeBillingPeriodProvider = Provider<Future<bool> Function(String)>((
  ref,
) {
  return (String interval) async {
    final api = _tryRead(ref, billingApiProvider);
    if (api == null) return false;

    try {
      final response = await api.changePeriod({'interval': interval});
      if (response.success) {
        ref.invalidate(subscriptionProvider);
        return true;
      }
    } on DioException {
      // Swallow — return false.
    }

    return false;
  };
});

/// Resume a cancelled subscription via the backend API.
///
/// Returns true on success.
final resumeSubscriptionProvider = Provider<Future<bool> Function()>((ref) {
  return () async {
    final api = _tryRead(ref, billingApiProvider);
    if (api == null) return false;

    try {
      final response = await api.resumeSubscription();
      if (response.success) {
        ref.invalidate(subscriptionProvider);
        return true;
      }
    } on DioException {
      // Swallow — return false.
    }

    return false;
  };
});
