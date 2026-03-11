import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_auth/service_auth.dart' as auth;
import 'package:unjynx_core/contracts/auth_port.dart';

// Re-export auth providers from service_auth.
// The canonical auth providers live in service_auth.
export 'package:service_auth/service_auth.dart'
    show
        authPortProvider,
        currentUserProvider,
        isAuthenticatedProvider,
        authNotifierProvider,
        overrideServiceAuthPort;

// Legacy helper — delegates to service_auth's canonical override.
Override overrideAuthPort(AuthPort port) {
  return auth.authPortProvider.overrideWithValue(port);
}

/// User productivity statistics.
class UserStats {
  final int tasksCompleted;
  final int currentStreak;
  final int totalXp;

  const UserStats({
    this.tasksCompleted = 0,
    this.currentStreak = 0,
    this.totalXp = 0,
  });
}

/// Stats provider — defaults to zeros. Override in bootstrap for real data.
final userStatsProvider = FutureProvider<UserStats>((ref) async {
  return const UserStats();
});

/// Selected timezone. Defaults to India Standard Time.
final timezoneProvider = StateProvider<String>((ref) => 'Asia/Kolkata');
