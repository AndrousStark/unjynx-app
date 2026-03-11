import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Permission status
// ---------------------------------------------------------------------------

/// Current notification permission status.
///
/// Values: `'not_asked'` | `'granted'` | `'denied'`.
final notificationPermissionStatusProvider =
    StateProvider<String>((ref) => 'not_asked');

// ---------------------------------------------------------------------------
// Optional NotificationPort provider (may not be wired during onboarding)
// ---------------------------------------------------------------------------

/// Notification port provider for the onboarding flow.
///
/// If the real [NotificationPort] is available in the DI tree it will be
/// read; otherwise the helper below simulates a successful grant.
final onboardingNotificationPortProvider = Provider<NotificationPort?>(
  (ref) {
    // Try to read from a parent override. If no override exists this
    // will throw — which we catch and return null.
    try {
      return ref.read(_externalNotificationPortProvider);
    } catch (_) {
      return null;
    }
  },
);

/// An override point for the real NotificationPort.
/// Feature shells that have a real implementation should override this.
final _externalNotificationPortProvider = Provider<NotificationPort>(
  (ref) => throw StateError(
    'NotificationPort not available during onboarding. '
    'Override _externalNotificationPortProvider if a real port exists.',
  ),
);

/// Override helper to wire the real notification port into the
/// onboarding scope.
Override overrideOnboardingNotificationPort(NotificationPort port) {
  return _externalNotificationPortProvider.overrideWithValue(port);
}

// ---------------------------------------------------------------------------
// Permission request helper
// ---------------------------------------------------------------------------

/// Requests notification permission.
///
/// Reads [NotificationPort] from the Riverpod tree if available.
/// Falls back to simulating a granted state (useful during early
/// development or test environments).
///
/// Returns `true` if permission was granted, `false` otherwise.
Future<bool> requestNotificationPermission(WidgetRef ref) async {
  final port = ref.read(onboardingNotificationPortProvider);

  if (port != null) {
    final granted = await port.requestPermission();
    ref.read(notificationPermissionStatusProvider.notifier).state =
        granted ? 'granted' : 'denied';
    return granted;
  }

  // Simulate — no real port available yet.
  await Future<void>.delayed(const Duration(milliseconds: 300));
  ref.read(notificationPermissionStatusProvider.notifier).state = 'granted';
  return true;
}
