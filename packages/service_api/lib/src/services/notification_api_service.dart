import '../api_client.dart';
import '../api_response.dart';

/// API service for notification preferences, quota, and delivery history.
class NotificationApiService {
  final ApiClient _client;

  const NotificationApiService(this._client);

  /// Get user's notification preferences.
  Future<ApiResponse<Map<String, dynamic>>> getPreferences() {
    return _client.get('/notifications/preferences');
  }

  /// Update notification preferences.
  ///
  /// [data] should contain fields matching the backend schema:
  /// primaryChannel, fallbackChain, quietStart (HH:mm), quietEnd (HH:mm),
  /// timezone, maxRemindersPerDay, digestMode, advanceReminderMinutes.
  Future<ApiResponse<Map<String, dynamic>>> updatePreferences(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.put(
      '/notifications/preferences',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Get the user's notification quota usage.
  ///
  /// Returns a map keyed by channel type with quota info.
  Future<ApiResponse<Map<String, dynamic>>> getQuota() {
    return _client.get('/notifications/quota');
  }

  /// Get delivery history / status of recent notifications.
  ///
  /// [limit] controls how many entries to return (default 20, max 100).
  Future<ApiResponse<List<dynamic>>> getDeliveryHistory({
    int limit = 20,
  }) {
    return _client.get('/notifications/status', queryParameters: {
      'limit': limit,
    });
  }

  /// Send a test notification via a specific channel.
  ///
  /// [channel] is one of: push, telegram, email, whatsapp, sms,
  /// instagram, slack, discord.
  Future<ApiResponse<Map<String, dynamic>>> sendTest(String channel) {
    return _client.post(
      '/notifications/send-test',
      data: {'channel': channel},
    );
  }
}
