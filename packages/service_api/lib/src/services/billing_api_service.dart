import '../api_client.dart';
import '../api_response.dart';

/// API service for billing, subscriptions, and plan management.
class BillingApiService {
  final ApiClient _client;

  const BillingApiService(this._client);

  /// Get current user's subscription.
  Future<ApiResponse<Map<String, dynamic>>> getSubscription() {
    return _client.get('/billing/subscription');
  }

  /// Get available plans.
  Future<ApiResponse<List<dynamic>>> getPlans() {
    return _client.get('/billing/plans');
  }

  /// Subscribe to a plan.
  Future<ApiResponse<Map<String, dynamic>>> subscribe(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/billing/subscribe',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Cancel subscription.
  Future<ApiResponse<Map<String, dynamic>>> cancelSubscription() {
    return _client.post('/billing/subscription/cancel');
  }

  /// Resume a canceled subscription.
  Future<ApiResponse<Map<String, dynamic>>> resumeSubscription() {
    return _client.post('/billing/subscription/resume');
  }

  /// Change billing period (monthly <-> annual).
  Future<ApiResponse<Map<String, dynamic>>> changePeriod(
    Map<String, dynamic> data,
  ) {
    return _client.patch('/billing/subscription/period', data: data);
  }

  /// Validate a coupon/promo code.
  Future<ApiResponse<Map<String, dynamic>>> validateCoupon(String code) {
    return _client.post('/billing/coupon/validate', data: {'code': code});
  }

  /// Get invoices.
  Future<ApiResponse<List<dynamic>>> getInvoices({
    int page = 1,
    int limit = 20,
  }) {
    return _client.get('/billing/invoices', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }

  /// Start free trial.
  Future<ApiResponse<Map<String, dynamic>>> startTrial(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/billing/trial',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }
}
