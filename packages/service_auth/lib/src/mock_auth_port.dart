import 'dart:convert';

import 'package:unjynx_core/contracts/auth_port.dart';

/// Mock implementation of [AuthPort] for offline development.
///
/// Returns a local user whose profile is populated from:
///   1. Social sign-in JWT claims (Google/Apple ID token), or
///   2. Credentials set via [setCredentials] (email sign-in), or
///   3. Hardcoded defaults when neither is available.
///
/// Swap for [LogtoAuthPort] once the backend (Docker + Logto) is available.
class MockAuthPort implements AuthPort {
  static const _defaultUser = AuthUser(
    id: 'local-dev-user',
    email: 'dev@unjynx.local',
    name: 'Local Developer',
  );

  bool _authenticated = false;
  String? _email;
  String? _name;
  String? _avatarUrl;

  /// Pre-set credentials before calling [signIn] (email/password flow).
  ///
  /// Call this from the login page so [getUserProfile] returns the
  /// entered email instead of the hardcoded default.
  void setCredentials({String? email, String? name}) {
    _email = email;
    _name = name ?? _nameFromEmail(email);
  }

  @override
  Future<bool> isAuthenticated() async => _authenticated;

  @override
  Future<String> signIn() async {
    _authenticated = true;
    return 'mock-access-token';
  }

  @override
  Future<void> signOut() async {
    _authenticated = false;
    _email = null;
    _name = null;
    _avatarUrl = null;
  }

  @override
  Future<String?> getAccessToken() async =>
      _authenticated ? 'mock-access-token' : null;

  @override
  Future<String?> getUserId() async => _defaultUser.id;

  @override
  Future<AuthUser?> getUserProfile() async {
    if (!_authenticated) return null;
    return AuthUser(
      id: _defaultUser.id,
      email: _email ?? _defaultUser.email,
      name: _name ?? _defaultUser.name,
      avatarUrl: _avatarUrl,
    );
  }

  @override
  Future<String> signInWithSocial({
    required String provider,
    required String idToken,
  }) async {
    _authenticated = true;

    // Decode the social provider's JWT to extract user claims
    // (email, name, picture) so the profile page shows real data.
    try {
      final parts = idToken.split('.');
      if (parts.length == 3) {
        final payload = json.decode(
          utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
        ) as Map<String, dynamic>;
        _email = payload['email'] as String?;
        _name = payload['name'] as String?;
        _avatarUrl = payload['picture'] as String?;
      }
    } catch (_) {
      // If decoding fails, keep whatever was set before (or defaults).
    }

    return idToken;
  }

  /// Derive a display name from an email address.
  ///
  /// e.g. "archit.singh@example.com" → "Archit Singh"
  static String? _nameFromEmail(String? email) {
    if (email == null || !email.contains('@')) return null;
    final local = email.split('@').first;
    return local
        .split(RegExp('[._-]'))
        .where((s) => s.isNotEmpty)
        .map((s) => '${s[0].toUpperCase()}${s.substring(1)}')
        .join(' ');
  }
}
