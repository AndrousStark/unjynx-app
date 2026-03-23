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
    NotifierProvider<ConnectivityNotifier, UnjynxConnectionState>(
  ConnectivityNotifier.new,
);

class ConnectivityNotifier extends Notifier<UnjynxConnectionState> {
  Timer? _pollTimer;
  bool _wasOffline = false;

  static const _pollInterval = Duration(seconds: 5);
  static const _backOnlineDisplay = Duration(seconds: 2);

  @override
  UnjynxConnectionState build() {
    _startPolling();
    ref.onDispose(() {
      _pollTimer?.cancel();
    });
    return UnjynxConnectionState.online;
  }

  void _startPolling() {
    // Check immediately on creation.
    _check();
    _pollTimer = Timer.periodic(_pollInterval, (_) => _check());
  }

  Future<void> _check() async {
    final isOnline = await _probe();

    if (!isOnline) {
      _wasOffline = true;
      state = UnjynxConnectionState.offline;
    } else if (_wasOffline) {
      // Transition: offline -> backOnline -> online.
      _wasOffline = false;
      state = UnjynxConnectionState.backOnline;
      Future.delayed(_backOnlineDisplay, () {
        try {
          state = UnjynxConnectionState.online;
        } catch (_) {
          // Notifier already disposed.
        }
      });
    } else {
      state = UnjynxConnectionState.online;
    }
  }

  /// Probes DNS to determine connectivity. Returns true when online.
  ///
  /// Tries multiple domains for reliability — some ISPs/networks fail to
  /// resolve certain domains (e.g. `example.com` on Jio India). We fall
  /// through to the next host on failure, so a single DNS miss does not
  /// cause a false-offline state.
  static const _probeHosts = ['google.com', 'cloudflare.com', 'one.one.one.one'];
  static const _probeTimeout = Duration(seconds: 2);

  static Future<bool> _probe() async {
    for (final host in _probeHosts) {
      try {
        final results = await InternetAddress.lookup(host)
            .timeout(_probeTimeout);
        if (results.isNotEmpty && results.first.rawAddress.isNotEmpty) {
          return true;
        }
      } catch (_) {
        // Try the next host.
        continue;
      }
    }
    return false;
  }

  /// Manually trigger a connectivity check (e.g. from a retry button).
  Future<void> recheck() => _check();
}
