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

  /// Sign in using a social provider (e.g. Google).
  ///
  /// [provider] is the social connector name (e.g. 'google').
  /// [idToken] is the identity token obtained from the social provider.
  /// Returns the access token on success.
  Future<String> signInWithSocial({
    required String provider,
    required String idToken,
  });

  // ── Organization Context ────────────────────────────────────────

  /// Get the currently selected organization ID.
  /// Returns null if using personal workspace.
  String? get selectedOrgId;

  /// Set the selected organization ID.
  /// Pass null to switch to personal workspace.
  Future<void> setSelectedOrg(String? orgId);

  /// Check if this is the user's first login (no onboarding completed).
  Future<bool> isFirstLogin();

  /// Mark onboarding as complete.
  Future<void> completeOnboarding();
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
