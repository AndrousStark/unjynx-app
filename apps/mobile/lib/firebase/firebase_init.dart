import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'package:unjynx_mobile/firebase/fcm_background_handler.dart';

/// Centralized Firebase initialization.
///
/// Call [initialize] once in `main()` before `runApp()`.
/// All Firebase services (Crashlytics, Analytics, FCM) are set up here.
class FirebaseInit {
  FirebaseInit._();

  static bool _initialized = false;

  /// Whether Firebase was successfully initialized.
  static bool get isInitialized => _initialized;

  /// Firebase Analytics instance (available after [initialize]).
  static FirebaseAnalytics? analytics;

  /// Initialize Firebase Core, Crashlytics, Analytics, and FCM background
  /// handler. Gracefully no-ops if Firebase is not configured.
  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      _initialized = true;
    } on Exception catch (e) {
      debugPrint('Firebase init failed: $e');
      return;
    }

    // --- Crashlytics ---
    // Error handlers (FlutterError.onError, PlatformDispatcher.instance.onError)
    // are configured in main.dart so they can forward to BOTH Crashlytics AND
    // Sentry. We only toggle collection here.
    if (kDebugMode) {
      await FirebaseCrashlytics.instance
          .setCrashlyticsCollectionEnabled(false);
    }

    // --- Analytics ---
    analytics = FirebaseAnalytics.instance;
    await analytics!.setAnalyticsCollectionEnabled(!kDebugMode);

    // --- FCM background handler ---
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }
}
