import 'package:flutter/foundation.dart';

/// Manages the FCM device token lifecycle.
///
/// **Stubbed out** — firebase_core/firebase_messaging are not yet in pubspec
/// because google-services.json hasn't been created. When Firebase is ready:
/// 1. Create Firebase project & download google-services.json
/// 2. Uncomment firebase_core/firebase_messaging in pubspec.yaml
/// 3. Replace this stub with the real implementation
///
/// All methods gracefully return defaults so the app works without Firebase.
class FcmTokenManager {
  FcmTokenManager._();

  static String? _currentToken;

  /// The current FCM device token (null until Firebase is configured).
  static String? get currentToken => _currentToken;

  /// Initialize Firebase and request notification permissions.
  ///
  /// Returns null (stubbed) until Firebase is configured.
  static Future<String?> initialize() async {
    debugPrint('FCM: stubbed (firebase not yet configured)');
    return null;
  }

  /// Start listening for token refreshes (no-op when stubbed).
  static void startTokenSync() {
    debugPrint('FCM: startTokenSync stubbed');
  }

  /// Stop listening for token refreshes (no-op when stubbed).
  static Future<void> dispose() async {}
}
