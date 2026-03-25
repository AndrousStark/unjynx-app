import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

/// Manages the FCM device token lifecycle.
///
/// Handles token acquisition, refresh monitoring, foreground message display,
/// and backend registration via [ChannelApiService.connectPush].
///
/// Registration is deferred until the user is authenticated. If the user
/// is not yet logged in, registration retries with exponential backoff
/// (2s, 4s, 8s, 16s, 32s — max 5 attempts).
class FcmTokenManager {
  FcmTokenManager._();

  static String? _currentToken;
  static StreamSubscription<String>? _tokenRefreshSub;
  static StreamSubscription<RemoteMessage>? _foregroundMsgSub;
  static bool _registeredWithBackend = false;

  /// The current FCM device token (null until initialized).
  static String? get currentToken => _currentToken;

  /// Whether the token has been successfully registered with the backend.
  static bool get isRegistered => _registeredWithBackend;

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
  /// Registration is auth-aware: if the user is not yet authenticated, it
  /// retries with exponential backoff until the user logs in.
  static void startTokenSync({
    ChannelApiService? channelApi,
    AuthPort? authPort,
  }) {
    if (_currentToken != null && channelApi != null) {
      _registerWithRetry(channelApi, authPort, _currentToken!);
    }

    _tokenRefreshSub?.cancel();
    _tokenRefreshSub =
        FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      debugPrint(
        'FCM: token refreshed (${newToken.substring(0, 12)}...)',
      );
      _currentToken = newToken;
      _registeredWithBackend = false;

      if (channelApi != null) {
        _registerWithRetry(channelApi, authPort, newToken);
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

  /// Retry FCM backend registration after the user logs in.
  ///
  /// Call this from the auth flow (e.g. after successful login) to ensure
  /// the FCM token is registered with the backend.
  static Future<void> retryRegistration({
    required ChannelApiService channelApi,
  }) async {
    if (_registeredWithBackend || _currentToken == null) return;
    await _registerTokenWithBackend(channelApi, _currentToken!);
  }

  /// Clean up all stream subscriptions.
  static Future<void> dispose() async {
    await _tokenRefreshSub?.cancel();
    await _foregroundMsgSub?.cancel();
    _tokenRefreshSub = null;
    _foregroundMsgSub = null;
  }

  /// Register with exponential backoff, waiting for auth.
  static Future<void> _registerWithRetry(
    ChannelApiService channelApi,
    AuthPort? authPort,
    String token, {
    int attempt = 0,
    int maxAttempts = 5,
  }) async {
    if (_registeredWithBackend) return;

    // Check if the user is authenticated before attempting registration.
    if (authPort != null) {
      try {
        final isAuth = await authPort.isAuthenticated();
        if (!isAuth) {
          if (attempt < maxAttempts) {
            final delay = Duration(seconds: 2 << attempt); // 2, 4, 8, 16, 32s
            debugPrint(
              'FCM: user not authenticated, retrying in ${delay.inSeconds}s '
              '(attempt ${attempt + 1}/$maxAttempts)',
            );
            await Future<void>.delayed(delay);
            return _registerWithRetry(
              channelApi,
              authPort,
              token,
              attempt: attempt + 1,
              maxAttempts: maxAttempts,
            );
          } else {
            debugPrint(
              'FCM: skipping backend registration — user not authenticated '
              'after $maxAttempts attempts. Will register on next login.',
            );
            return;
          }
        }
      } on Exception catch (e) {
        debugPrint('FCM: auth check failed: $e');
        // Fall through and try anyway — the auth interceptor will handle 401
      }
    }

    await _registerTokenWithBackend(channelApi, token);
  }

  /// Register or update the FCM token with the backend.
  static Future<void> _registerTokenWithBackend(
    ChannelApiService channelApi,
    String token,
  ) async {
    try {
      final response = await channelApi.connectPush(token);
      if (response.success) {
        _registeredWithBackend = true;
        debugPrint('FCM: token registered with backend');
      } else {
        debugPrint('FCM: backend registration failed: ${response.error}');
      }
    } on Exception catch (e) {
      debugPrint('FCM: backend registration error: $e');
    }
  }
}
