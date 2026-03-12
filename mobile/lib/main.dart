import 'dart:async';

import 'package:flutter/material.dart';

import 'package:unjynx_mobile/bootstrap.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Error boundary: catch any uncaught async errors so the app
  // doesn't silently die with a grey screen.
  runZonedGuarded(
    () async {
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        debugPrint('FlutterError: ${details.exception}');
      };
      await bootstrap();
    },
    (error, stackTrace) {
      debugPrint('Uncaught error in bootstrap: $error');
      debugPrintStack(stackTrace: stackTrace);
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
