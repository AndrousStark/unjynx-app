import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

import 'mock_auth_port.dart';

/// Current auth port implementation.
///
/// Override in app bootstrap to switch between [MockAuthPort]
/// and [LogtoAuthPort].
final authPortProvider = Provider<AuthPort>(
  (ref) => MockAuthPort(),
);

/// Override helper for auth port.
///
/// Use in ProviderScope overrides during app bootstrap.
Override overrideServiceAuthPort(AuthPort port) {
  return authPortProvider.overrideWithValue(port);
}

/// Whether the user is currently authenticated.
final isAuthenticatedProvider = FutureProvider<bool>((ref) async {
  final auth = ref.watch(authPortProvider);
  return auth.isAuthenticated();
});

/// Current user profile.
final currentUserProvider = FutureProvider<AuthUser?>((ref) async {
  final auth = ref.watch(authPortProvider);
  return auth.getUserProfile();
});

/// Auth state notifier for login/logout actions.
class AuthNotifier extends StateNotifier<AsyncValue<bool>> {
  AuthNotifier(this._auth) : super(const AsyncData(false));

  final AuthPort _auth;

  Future<void> signIn() async {
    state = const AsyncLoading();
    try {
      await _auth.signIn();
      state = const AsyncData(true);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    try {
      await _auth.signOut();
      state = const AsyncData(false);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

/// Auth state notifier provider.
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<bool>>(
  (ref) => AuthNotifier(ref.watch(authPortProvider)),
);
