import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Helper for obtaining a Google ID token via [GoogleSignIn].
///
/// The ID token is then passed to Logto's social connector
/// to complete authentication. This does NOT use firebase_auth —
/// it uses the google_sign_in package directly.
class GoogleSignInHelper {
  GoogleSignInHelper._();

  /// Scopes requested for basic authentication.
  static const _authScopes = ['email', 'profile'];

  /// Additional scope for read-only Google Calendar access.
  static const _calendarScope =
      'https://www.googleapis.com/auth/calendar.readonly';

  /// Sign in with Google and return the ID token.
  ///
  /// [webClientId] is the OAuth 2.0 Web Client ID from Google Cloud Console
  /// (required for Android to get an ID token).
  ///
  /// Returns null if the user cancels or sign-in fails.
  static Future<String?> getIdToken({required String webClientId}) async {
    try {
      final googleSignIn = GoogleSignIn(
        scopes: _authScopes,
        serverClientId: webClientId,
      );

      final account = await googleSignIn.signIn();
      if (account == null) {
        debugPrint('Google Sign-In: user cancelled');
        return null;
      }

      final auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) {
        debugPrint('Google Sign-In: no ID token received');
        // Sign out to reset state for next attempt.
        await googleSignIn.signOut();
        return null;
      }

      debugPrint(
        'Google Sign-In: token acquired '
        '(${idToken.substring(0, 20)}...)',
      );
      return idToken;
    } on Exception catch (e) {
      debugPrint('Google Sign-In failed: $e');
      return null;
    }
  }

  /// Sign in with Google requesting calendar.readonly scope and return
  /// the server auth code for backend token exchange.
  ///
  /// [webClientId] is the OAuth 2.0 Web Client ID from Google Cloud Console.
  ///
  /// Returns null if the user cancels or sign-in fails.
  static Future<String?> getCalendarAuthCode({
    required String webClientId,
  }) async {
    try {
      final googleSignIn = GoogleSignIn(
        scopes: [..._authScopes, _calendarScope],
        serverClientId: webClientId,
      );

      final account = await googleSignIn.signIn();
      if (account == null) {
        debugPrint('Google Calendar Auth: user cancelled');
        return null;
      }

      final serverAuthCode = account.serverAuthCode;
      if (serverAuthCode == null) {
        debugPrint('Google Calendar Auth: no server auth code received');
        await googleSignIn.signOut();
        return null;
      }

      debugPrint(
        'Google Calendar Auth: auth code acquired '
        '(${serverAuthCode.substring(0, serverAuthCode.length.clamp(0, 10))}...)',
      );
      return serverAuthCode;
    } on Exception catch (e) {
      debugPrint('Google Calendar Auth failed: $e');
      return null;
    }
  }

  /// Sign out from Google (clears cached credentials).
  static Future<void> signOut() async {
    try {
      await GoogleSignIn().signOut();
    } on Exception catch (e) {
      debugPrint('Google Sign-Out failed: $e');
    }
  }
}
