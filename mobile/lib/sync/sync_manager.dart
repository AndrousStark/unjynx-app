import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:service_sync/service_sync.dart';

/// Orchestrates the [SyncEngine] lifecycle in the Flutter app.
///
/// Responsibilities:
/// - Observes [AppLifecycleState] to trigger sync on app resume.
/// - Starts periodic sync on [start] and stops on [stop].
/// - Triggers an initial sync after a short delay to let the app settle.
/// - Provides [syncNow] for manual sync triggers (e.g. pull-to-refresh).
class SyncManager with WidgetsBindingObserver {
  final SyncEngine _engine;

  SyncManager({required SyncEngine engine}) : _engine = engine;

  /// Start observing lifecycle and begin periodic sync.
  ///
  /// Triggers an initial sync after a 3-second delay so the app UI
  /// has time to render before network calls start.
  void start() {
    WidgetsBinding.instance.addObserver(this);
    _engine.startPeriodicSync();

    // Trigger initial sync after a short delay (let app settle).
    unawaited(
      Future<void>.delayed(
        const Duration(seconds: 3),
        () => _engine.sync(),
      ),
    );
  }

  /// Stop observing lifecycle and cancel periodic sync.
  void stop() {
    WidgetsBinding.instance.removeObserver(this);
    _engine.stopPeriodicSync();
  }

  /// Manually trigger a sync cycle (e.g. pull-to-refresh).
  Future<SyncSummary> syncNow() => _engine.sync();

  /// Current sync status from the engine.
  SyncStatus get status => _engine.status;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // App came back to foreground — sync to catch up.
      unawaited(_engine.sync());
    }
  }

  /// Release all resources.
  void dispose() {
    stop();
    _engine.dispose();
  }
}
