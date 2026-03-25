import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/contracts/notification_port.dart';

import 'notification_channels.dart';

/// Callback type for handling task completion from notification action buttons.
typedef NotificationCompleteCallback = Future<void> Function(String todoId);

/// [awesome_notifications] implementation of [NotificationPort].
///
/// Handles local notification scheduling, cancellation,
/// and permission management for UNJYNX.
class AwesomeNotificationPort implements NotificationPort {
  final AwesomeNotifications _notifications;

  /// Static callback set from bootstrap so notification actions can complete tasks.
  static NotificationCompleteCallback? onComplete;

  AwesomeNotificationPort({
    AwesomeNotifications? notifications,
  }) : _notifications = notifications ?? AwesomeNotifications();

  @override
  Future<void> initialize() async {
    await _notifications.initialize(
      null, // use default app icon
      unjynxNotificationChannels,
      channelGroups: unjynxChannelGroups,
      debug: false,
    );

    // Listen for notification actions
    _notifications.setListeners(
      onActionReceivedMethod: _onActionReceived,
      onNotificationCreatedMethod: _onNotificationCreated,
      onDismissActionReceivedMethod: _onDismissActionReceived,
    );
  }

  @override
  Future<void> schedule({
    required String id,
    required String title,
    required String body,
    required DateTime scheduledAt,
    Map<String, String>? payload,
  }) async {
    final notificationId = id.hashCode.abs() % 2147483647;

    await _notifications.createNotification(
      content: NotificationContent(
        id: notificationId,
        channelKey: NotificationChannels.taskReminders,
        title: title,
        body: body,
        category: NotificationCategory.Reminder,
        notificationLayout: NotificationLayout.Default,
        wakeUpScreen: true,
        payload: {
          'todo_id': id,
          ...?payload,
        },
      ),
      schedule: NotificationCalendar.fromDate(
        date: scheduledAt,
        allowWhileIdle: true,
        preciseAlarm: true,
      ),
      actionButtons: [
        NotificationActionButton(
          key: 'COMPLETE',
          label: 'Done',
          actionType: ActionType.SilentBackgroundAction,
        ),
        NotificationActionButton(
          key: 'SNOOZE',
          label: 'Snooze 10m',
          actionType: ActionType.SilentBackgroundAction,
        ),
      ],
    );
  }

  @override
  Future<void> cancel(String id) async {
    final notificationId = id.hashCode.abs() % 2147483647;
    await _notifications.cancel(notificationId);
  }

  @override
  Future<void> cancelAll() async {
    await _notifications.cancelAll();
  }

  @override
  Future<bool> isPermitted() async {
    return _notifications.isNotificationAllowed();
  }

  @override
  Future<bool> requestPermission() async {
    return _notifications.requestPermissionToSendNotifications();
  }

  /// Handle notification taps and action button presses.
  @pragma('vm:entry-point')
  static Future<void> _onActionReceived(
    ReceivedAction receivedAction,
  ) async {
    final todoId = receivedAction.payload?['todo_id'];
    if (todoId == null) return;

    switch (receivedAction.buttonKeyPressed) {
      case 'COMPLETE':
        debugPrint('Notification action: completing todo $todoId');
        await AwesomeNotifications().cancel(receivedAction.id!);
        if (onComplete != null) {
          await onComplete!(todoId);
        }
      case 'SNOOZE':
        // Reschedule 10 minutes from now
        final snoozeTime = DateTime.now().add(const Duration(minutes: 10));
        await AwesomeNotifications().createNotification(
          content: NotificationContent(
            id: receivedAction.id!,
            channelKey: NotificationChannels.taskReminders,
            title: receivedAction.title,
            body: receivedAction.body,
            category: NotificationCategory.Reminder,
            payload: receivedAction.payload,
          ),
          schedule: NotificationCalendar.fromDate(
            date: snoozeTime,
            allowWhileIdle: true,
            preciseAlarm: true,
          ),
        );
      default:
        // Tapped notification body — navigate to detail page
        debugPrint('Notification tapped for todo $todoId');
    }
  }

  @pragma('vm:entry-point')
  static Future<void> _onNotificationCreated(
    ReceivedNotification receivedNotification,
  ) async {
    // Analytics or logging hook
  }

  @pragma('vm:entry-point')
  static Future<void> _onDismissActionReceived(
    ReceivedAction receivedAction,
  ) async {
    // Track dismissed notifications
  }
}
