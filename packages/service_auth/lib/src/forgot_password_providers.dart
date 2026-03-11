import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Signature for the backend forgot-password API call.
///
/// Accepts an email address and sends a password-reset link.
/// Throws on network or server errors.
typedef ForgotPasswordApiCall = Future<void> Function(String email);

/// Default no-op stub for the forgot-password API call.
///
/// Override [forgotPasswordApiProvider] at app bootstrap with a real
/// implementation backed by `AuthApiService` or a direct HTTP call
/// to `POST /api/v1/auth/forgot-password`.
Future<void> _defaultForgotPasswordApi(String email) async {
  // No-op stub. Override at app bootstrap.
}

/// Provider for the forgot-password backend API call.
///
/// Override at app bootstrap with the real implementation, e.g.:
/// ```dart
/// forgotPasswordApiProvider.overrideWithValue((email) async {
///   final client = ref.read(apiClientProvider);
///   await client.post('/auth/forgot-password', data: {'email': email});
/// });
/// ```
final forgotPasswordApiProvider = Provider<ForgotPasswordApiCall>(
  (ref) => _defaultForgotPasswordApi,
);

/// Notifier for the forgot-password (A3) flow.
///
/// Manages the async state of sending a password-reset link.
/// Delegates the actual API call to [ForgotPasswordApiCall] injected via
/// [forgotPasswordApiProvider].
class ForgotPasswordNotifier extends StateNotifier<AsyncValue<bool>> {
  ForgotPasswordNotifier(this._apiCall) : super(const AsyncData(false));

  final ForgotPasswordApiCall _apiCall;

  /// Request a password-reset email for [email].
  ///
  /// State transitions:
  ///   `AsyncData(false)` -> `AsyncLoading` -> `AsyncData(true)` (success)
  ///                                        -> `AsyncError`       (failure)
  Future<void> sendResetLink(String email) async {
    state = const AsyncLoading();
    try {
      // Validate email format before sending.
      final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
      if (!emailRegex.hasMatch(email)) {
        throw const FormatException('Please enter a valid email address.');
      }

      // Call the backend POST /api/v1/auth/forgot-password endpoint.
      await _apiCall(email);

      state = const AsyncData(true);
    } on FormatException catch (e, st) {
      state = AsyncError(e, st);
    } on Exception catch (e, st) {
      state = AsyncError(e, st);
    }
  }

  /// Reset to initial idle state so the form can be reused.
  void reset() {
    state = const AsyncData(false);
  }
}

/// Provider for the forgot-password notifier.
final forgotPasswordNotifierProvider =
    StateNotifierProvider<ForgotPasswordNotifier, AsyncValue<bool>>(
  (ref) => ForgotPasswordNotifier(ref.watch(forgotPasswordApiProvider)),
);
