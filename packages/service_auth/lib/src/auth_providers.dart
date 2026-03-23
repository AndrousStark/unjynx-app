import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
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
class AuthNotifier extends Notifier<AsyncValue<bool>> {
  @override
  AsyncValue<bool> build() {
    return const AsyncData(false);
  }

  Future<void> signIn() async {
    state = const AsyncLoading();
    try {
      await ref.read(authPortProvider).signIn();
      ref.invalidate(isAuthenticatedProvider);
      ref.invalidate(currentUserProvider);
      state = const AsyncData(true);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> signInWithSocial({
    required String provider,
    required String idToken,
  }) async {
    state = const AsyncLoading();
    try {
      await ref.read(authPortProvider).signInWithSocial(
            provider: provider,
            idToken: idToken,
          );
      ref.invalidate(isAuthenticatedProvider);
      ref.invalidate(currentUserProvider);
      state = const AsyncData(true);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    try {
      await ref.read(authPortProvider).signOut();
      ref.invalidate(isAuthenticatedProvider);
      ref.invalidate(currentUserProvider);
      state = const AsyncData(false);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }
}

/// Auth state notifier provider.
final authNotifierProvider =
    NotifierProvider<AuthNotifier, AsyncValue<bool>>(AuthNotifier.new);
