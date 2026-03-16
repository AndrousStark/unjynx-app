import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

/// Helper for obtaining a Google ID token via [GoogleSignIn].
///
/// The ID token is then passed to Logto's social connector
/// to complete authentication. This does NOT use firebase_auth —
/// it uses the google_sign_in package directly.
class GoogleSignInHelper {
  GoogleSignInHelper._();

  /// Sign in with Google and return the ID token.
  ///
  /// [webClientId] is the OAuth 2.0 Web Client ID from Google Cloud Console
  /// (required for Android to get an ID token).
  ///
  /// Returns null if the user cancels or sign-in fails.
  static Future<String?> getIdToken({required String webClientId}) async {
    try {
      final googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
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

  /// Sign out from Google (clears cached credentials).
  static Future<void> signOut() async {
    try {
      await GoogleSignIn().signOut();
    } on Exception catch (e) {
      debugPrint('Google Sign-Out failed: $e');
    }
  }
}
