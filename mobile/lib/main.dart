import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'package:unjynx_mobile/bootstrap.dart';
import 'package:unjynx_mobile/config/app_config.dart';

void main() {
  // Error boundary: catch any uncaught async errors so the app
  // doesn't silently die with a grey screen.
  runZonedGuarded(
    () async {
      // Must be called inside the same zone as runApp to avoid zone mismatch.
      WidgetsFlutterBinding.ensureInitialized();

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

      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        debugPrint('FlutterError: ${details.exception}');
        if (AppConfig.sentryDsn.isNotEmpty) {
          Sentry.captureException(
            details.exception,
            stackTrace: details.stack,
          );
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
      // Show a minimal error UI so the user sees something
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
