import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart' show UnjynxConnectionState;

/// Watches network connectivity by periodically probing DNS.
///
/// Emits [UnjynxConnectionState] values that drive the [UnjynxConnectionBanner].
/// Uses `InternetAddress.lookup` instead of a third-party package so we
/// avoid adding a dependency just for this check.
///
/// The provider polls every 5 seconds while active (i.e. while something
/// is watching it). When connectivity changes from offline to online it
/// briefly emits [UnjynxConnectionState.backOnline] before settling to
/// [UnjynxConnectionState.online].
final connectivityProvider =
    StateNotifierProvider<ConnectivityNotifier, UnjynxConnectionState>(
  ConnectivityNotifier.new,
);

class ConnectivityNotifier extends StateNotifier<UnjynxConnectionState> {
  ConnectivityNotifier(this._ref) : super(UnjynxConnectionState.online) {
    _startPolling();
  }

  final Ref _ref;
  Timer? _pollTimer;
  bool _wasOffline = false;

  static const _pollInterval = Duration(seconds: 5);
  static const _backOnlineDisplay = Duration(seconds: 2);

  void _startPolling() {
    // Check immediately on creation.
    _check();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _check());
  }

  Future<void> _check() async {
    final isOnline = await _probe();

    if (!mounted) return;

    if (!isOnline) {
      _wasOffline = true;
      state = UnjynxConnectionState.offline;
    } else if (_wasOffline) {
      // Transition: offline -> backOnline -> online.
      _wasOffline = false;
      state = UnjynxConnectionState.backOnline;
      Future.delayed(_backOnlineDisplay, () {
        if (mounted) state = UnjynxConnectionState.online;
      });
    } else {
      state = UnjynxConnectionState.online;
    }
  }

  /// Probes DNS to determine connectivity. Returns true when online.
  static Future<bool> _probe() async {
    try {
      final results = await InternetAddress.lookup('example.com')
          .timeout(const Duration(seconds: 3));
      return results.isNotEmpty && results.first.rawAddress.isNotEmpty;
    } on SocketException {
      return false;
    } on TimeoutException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Manually trigger a connectivity check (e.g. from a retry button).
  Future<void> recheck() => _check();

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }
}
