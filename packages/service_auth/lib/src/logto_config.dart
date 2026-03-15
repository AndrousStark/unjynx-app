/// Configuration for Logto authentication.
class LogtoConfig {
  /// Logto endpoint URL.
  final String endpoint;

  /// Application ID from Logto admin console.
  final String appId;

  /// Redirect URI for OAuth callback.
  final String redirectUri;

  /// Scopes to request.
  final List<String> scopes;

  const LogtoConfig({
    required this.endpoint,
    required this.appId,
    this.redirectUri = 'unjynx://auth/callback',
    this.scopes = const ['openid', 'profile', 'email', 'offline_access'],
  });
}
