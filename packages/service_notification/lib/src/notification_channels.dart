import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';

/// Notification channel keys used across the app.
abstract final class NotificationChannels {
  /// Task reminders — due dates, scheduled alerts.
  static const taskReminders = 'task_reminders';

  /// Daily content — motivational quotes, tips.
  static const dailyContent = 'daily_content';

  /// Sync updates — background sync status.
  static const syncUpdates = 'sync_updates';
}

/// All notification channels for UNJYNX.
///
/// Called once during app initialization.
List<NotificationChannel> get unjynxNotificationChannels => [
      NotificationChannel(
        channelGroupKey: 'unjynx_tasks',
        channelKey: NotificationChannels.taskReminders,
        channelName: 'Task Reminders',
        channelDescription: 'Reminders for upcoming and overdue tasks',
        defaultColor: const Color(0xFF6C5CE7),
        ledColor: const Color(0xFFFFD700),
        importance: NotificationImportance.High,
        defaultRingtoneType: DefaultRingtoneType.Notification,
        channelShowBadge: true,
      ),
      NotificationChannel(
        channelGroupKey: 'unjynx_content',
        channelKey: NotificationChannels.dailyContent,
        channelName: 'Daily Content',
        channelDescription: 'Motivational quotes and productivity tips',
        defaultColor: const Color(0xFF6C5CE7),
        importance: NotificationImportance.Default,
      ),
      NotificationChannel(
        channelGroupKey: 'unjynx_system',
        channelKey: NotificationChannels.syncUpdates,
        channelName: 'Sync Updates',
        channelDescription: 'Background sync status notifications',
        defaultColor: const Color(0xFF6C5CE7),
        importance: NotificationImportance.Low,
        channelShowBadge: false,
      ),
    ];

/// Channel groups for organized notification settings.
List<NotificationChannelGroup> get unjynxChannelGroups => [
      NotificationChannelGroup(
        channelGroupKey: 'unjynx_tasks',
        channelGroupName: 'Tasks',
      ),
      NotificationChannelGroup(
        channelGroupKey: 'unjynx_content',
        channelGroupName: 'Content',
      ),
      NotificationChannelGroup(
        channelGroupKey: 'unjynx_system',
        channelGroupName: 'System',
      ),
    ];
