/// Port for notification operations.
///
/// Implementations: Local (awesome_notifications), Push (FCM),
/// WhatsApp, Telegram, SMS, Email.
abstract class NotificationPort {
  /// Initialize the notification service.
  Future<void> initialize();

  /// Schedule a notification.
  Future<void> schedule({
    required String id,
    required String title,
    required String body,
    required DateTime scheduledAt,
    Map<String, String>? payload,
  });

  /// Cancel a scheduled notification.
  Future<void> cancel(String id);

  /// Cancel all scheduled notifications.
  Future<void> cancelAll();

  /// Check if notifications are permitted.
  Future<bool> isPermitted();

  /// Request notification permissions.
  Future<bool> requestPermission();
}
