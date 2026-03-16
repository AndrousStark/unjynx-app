import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:service_api/service_api.dart';

/// Manages the FCM device token lifecycle.
///
/// Handles token acquisition, refresh monitoring, foreground message display,
/// and backend registration via [ChannelApiService.connectPush].
class FcmTokenManager {
  FcmTokenManager._();

  static String? _currentToken;
  static StreamSubscription<String>? _tokenRefreshSub;
  static StreamSubscription<RemoteMessage>? _foregroundMsgSub;

  /// The current FCM device token (null until initialized).
  static String? get currentToken => _currentToken;

  /// Initialize FCM: request permission and acquire the device token.
  ///
  /// Returns the FCM token, or null if unavailable (e.g. simulator, no
  /// Google Play Services, or user denied permission).
  static Future<String?> initialize() async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Request permission (required on iOS, Android 13+).
      final settings = await messaging.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('FCM: notification permission denied');
        return null;
      }

      // On iOS, ensure APNs token is available before requesting FCM token.
      // This is automatically handled by the SDK, but we log for debugging.
      final apnsToken = await messaging.getAPNSToken();
      debugPrint('FCM: APNs token=${apnsToken != null ? "present" : "null"}');

      // Get the FCM device token.
      _currentToken = await messaging.getToken();
      debugPrint('FCM: token acquired (${_currentToken?.substring(0, 12)}...)');

      // Configure foreground notification presentation on iOS.
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      return _currentToken;
    } on Exception catch (e) {
      debugPrint('FCM: initialization failed: $e');
      return null;
    }
  }

  /// Start listening for token refreshes and sync new tokens to the backend.
  ///
  /// Also registers the initial token with the backend.
  static void startTokenSync({ChannelApiService? channelApi}) {
    if (_currentToken != null && channelApi != null) {
      _registerTokenWithBackend(channelApi, _currentToken!);
    }

    _tokenRefreshSub?.cancel();
    _tokenRefreshSub =
        FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      debugPrint(
        'FCM: token refreshed (${newToken.substring(0, 12)}...)',
      );
      _currentToken = newToken;

      if (channelApi != null) {
        _registerTokenWithBackend(channelApi, newToken);
      }
    });
  }

  /// Start listening for foreground messages.
  ///
  /// On Android, FCM does NOT auto-display notifications when the app is in
  /// the foreground. This listener logs them; the actual display is handled
  /// by awesome_notifications via the [onForegroundMessage] callback.
  static void setupForegroundHandler({
    void Function(RemoteMessage)? onForegroundMessage,
  }) {
    _foregroundMsgSub?.cancel();
    _foregroundMsgSub =
        FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint(
        'FCM foreground: ${message.messageId} '
        'title=${message.notification?.title}',
      );
      onForegroundMessage?.call(message);
    });
  }

  /// Handle the case where the user taps a notification that opened the app.
  static Future<RemoteMessage?> getInitialMessage() async {
    try {
      return await FirebaseMessaging.instance.getInitialMessage();
    } on Exception {
      return null;
    }
  }

  /// Clean up all stream subscriptions.
  static Future<void> dispose() async {
    await _tokenRefreshSub?.cancel();
    await _foregroundMsgSub?.cancel();
    _tokenRefreshSub = null;
    _foregroundMsgSub = null;
  }

  /// Register or update the FCM token with the backend.
  static Future<void> _registerTokenWithBackend(
    ChannelApiService channelApi,
    String token,
  ) async {
    try {
      final response = await channelApi.connectPush(token);
      if (response.success) {
        debugPrint('FCM: token registered with backend');
      } else {
        debugPrint('FCM: backend registration failed: ${response.error}');
      }
    } on Exception catch (e) {
      debugPrint('FCM: backend registration error: $e');
    }
  }
}
