import 'dart:async';

import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:unjynx_mobile/bootstrap.dart';
import 'package:unjynx_mobile/config/app_config.dart';
import 'package:unjynx_mobile/firebase/firebase_init.dart';

void main() {
  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      // Initialize Firebase (Crashlytics, Analytics, FCM background handler).
      // Must happen before Sentry and runApp.
      await FirebaseInit.initialize();

      // Initialize Sentry for crash reporting (skips if DSN not provided).
      if (AppConfig.sentryDsn.isNotEmpty) {
        await SentryFlutter.init(
          (options) {
            options
              ..dsn = AppConfig.sentryDsn
              ..environment = AppConfig.env
              ..sendDefaultPii = false
              ..tracesSampleRate = kDebugMode ? 1.0 : 0.2;
          },
        );
      }

      // Forward Flutter errors to both Sentry and Crashlytics.
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        debugPrint('FlutterError: ${details.exception}');

        if (AppConfig.sentryDsn.isNotEmpty) {
          Sentry.captureException(
            details.exception,
            stackTrace: details.stack,
          );
        }
        if (FirebaseInit.isInitialized && !kDebugMode) {
          FirebaseCrashlytics.instance.recordFlutterFatalError(details);
        }
      };

      await bootstrap();
    },
    (error, stackTrace) {
      debugPrint('Uncaught error in bootstrap: $error');
      debugPrintStack(stackTrace: stackTrace);

      if (AppConfig.sentryDsn.isNotEmpty) {
        Sentry.captureException(error, stackTrace: stackTrace);
      }
      if (FirebaseInit.isInitialized && !kDebugMode) {
        FirebaseCrashlytics.instance
            .recordError(error, stackTrace, fatal: true);
      }

      runApp(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'UNJYNX failed to start.\n\n$error',
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ),
      );
    },
  );
}
