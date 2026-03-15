/// Port for authentication operations.
///
/// Implementation: Logto adapter.
abstract class AuthPort {
  /// Check if user is currently authenticated.
  Future<bool> isAuthenticated();

  /// Sign in the user. Returns the access token.
  Future<String> signIn();

  /// Sign out the current user.
  Future<void> signOut();

  /// Get the current access token (refreshing if needed).
  Future<String?> getAccessToken();

  /// Get the current user's ID (Logto subject).
  Future<String?> getUserId();

  /// Get the current user's profile info.
  Future<AuthUser?> getUserProfile();
}

/// Authenticated user info from the auth provider.
class AuthUser {
  final String id;
  final String? email;
  final String? name;
  final String? avatarUrl;

  const AuthUser({
    required this.id,
    this.email,
    this.name,
    this.avatarUrl,
  });
}
