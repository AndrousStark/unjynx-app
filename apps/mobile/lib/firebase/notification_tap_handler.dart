import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:unjynx_mobile/routing/app_router.dart';

/// Handles navigation when the user taps a push notification.
///
/// Supports two scenarios:
/// 1. **Background tap** - App is in background, user taps notification.
///    Uses [FirebaseMessaging.onMessageOpenedApp].
/// 2. **Terminated tap** - App was killed, opened via notification.
///    Uses [FirebaseMessaging.instance.getInitialMessage].
///
/// Notification payloads must include `type` and optionally `id` in
/// [RemoteMessage.data] to enable targeted routing.
class NotificationTapHandler {
  NotificationTapHandler._();

  static StreamSubscription<RemoteMessage>? _onMessageOpenedSub;

  /// Wire up notification tap listeners.
  ///
  /// Call once after [FirebaseInit.initialize] and after the GoRouter
  /// has been created (i.e. after `runApp`).
  static Future<void> initialize() async {
    // 1. App was terminated and opened via notification tap.
    try {
      final initialMessage =
          await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        // Delay slightly to allow the router to finish first frame.
        await Future<void>.delayed(const Duration(milliseconds: 500));
        _handleNotificationTap(initialMessage);
      }
    } on Exception catch (e) {
      debugPrint('NotificationTapHandler: getInitialMessage failed: $e');
    }

    // 2. App is in background and user taps notification.
    _onMessageOpenedSub?.cancel();
    _onMessageOpenedSub =
        FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  /// Extract `type` and `id` from the notification data and navigate.
  ///
  /// Expected data format:
  /// ```json
  /// { "type": "task_reminder", "id": "abc-123" }
  /// ```
  ///
  /// Routing map:
  /// - `task_reminder` -> `/todos/{id}`
  /// - `content`       -> `/content`
  /// - `team`          -> `/team`
  /// - `achievement`   -> `/gamification/game-mode`
  /// - default         -> home (/)
  static void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    final type = data['type'] as String?;
    final id = data['id'] as String?;

    final route = _resolveRoute(type: type, id: id);

    debugPrint(
      'NotificationTapHandler: type=$type, id=$id -> route=$route',
    );

    _navigateTo(route);
  }

  /// Map notification type + id to a GoRouter path.
  static String _resolveRoute({String? type, String? id}) {
    switch (type) {
      case 'task_reminder':
        if (id != null && id.isNotEmpty) {
          return '/todos/$id';
        }
        return '/todos';
      case 'content':
        return '/content';
      case 'team':
        return '/team';
      case 'achievement':
        return '/gamification/game-mode';
      default:
        return '/';
    }
  }

  /// Navigate using the global [rootNavigatorKey] so we don't need
  /// a BuildContext.
  static void _navigateTo(String route) {
    final context = rootNavigatorKey.currentContext;
    if (context == null) {
      debugPrint(
        'NotificationTapHandler: navigator context not available, '
        'cannot navigate to $route',
      );
      return;
    }

    try {
      GoRouter.of(context).go(route);
    } on Exception catch (e) {
      debugPrint('NotificationTapHandler: navigation failed: $e');
    }
  }

  /// Clean up stream subscriptions.
  static Future<void> dispose() async {
    await _onMessageOpenedSub?.cancel();
    _onMessageOpenedSub = null;
  }
}
