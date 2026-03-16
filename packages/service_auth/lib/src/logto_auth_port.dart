import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

import 'logto_config.dart';

/// Logto implementation of [AuthPort].
///
/// Uses PKCE-based OAuth2 flow for secure mobile authentication.
class LogtoAuthPort implements AuthPort {
  final LogtoConfig _config;
  final Dio _dio;
  final FlutterSecureStorage _storage;

  String? _accessToken;
  String? _refreshToken;
  DateTime? _tokenExpiry;

  LogtoAuthPort({
    required LogtoConfig config,
    Dio? dio,
    FlutterSecureStorage? storage,
  })  : _config = config,
        _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage();

  @override
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null;
  }

  @override
  Future<String> signIn() async {
    // PKCE: Generate code_verifier and code_challenge (RFC 7636)
    final codeVerifier = _generateCodeVerifier();
    final codeChallenge = _generateCodeChallenge(codeVerifier);

    // Build authorization URL with PKCE parameters
    final authUrl = Uri.parse('${_config.endpoint}/oidc/auth').replace(
      queryParameters: {
        'client_id': _config.appId,
        'redirect_uri': _config.redirectUri,
        'response_type': 'code',
        'scope': _config.scopes.join(' '),
        'prompt': 'consent',
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
      },
    );

    // Launch browser for authentication
    final callbackUrl = await FlutterWebAuth2.authenticate(
      url: authUrl.toString(),
      callbackUrlScheme: 'unjynx',
    );

    // Extract authorization code
    final code = Uri.parse(callbackUrl).queryParameters['code'];
    if (code == null) {
      throw Exception('No authorization code received');
    }

    // Exchange code for tokens with PKCE code_verifier
    final response = await _dio.post<Map<String, dynamic>>(
      '${_config.endpoint}/oidc/token',
      data: {
        'grant_type': 'authorization_code',
        'client_id': _config.appId,
        'redirect_uri': _config.redirectUri,
        'code': code,
        'code_verifier': codeVerifier,
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
      ),
    );

    await _handleTokenResponse(response.data!);
    return _accessToken!;
  }

  @override
  Future<void> signOut() async {
    _accessToken = null;
    _refreshToken = null;
    _tokenExpiry = null;
    await _storage.delete(key: 'unjynx_access_token');
    await _storage.delete(key: 'unjynx_refresh_token');
    await _storage.delete(key: 'unjynx_token_expiry');
  }

  @override
  Future<String?> getAccessToken() async {
    // Check memory cache first
    if (_accessToken != null &&
        _tokenExpiry != null &&
        _tokenExpiry!.isAfter(DateTime.now())) {
      return _accessToken;
    }

    // Try to load from secure storage
    _accessToken = await _storage.read(key: 'unjynx_access_token');
    _refreshToken = await _storage.read(key: 'unjynx_refresh_token');
    final expiryStr = await _storage.read(key: 'unjynx_token_expiry');
    if (expiryStr != null) {
      _tokenExpiry = DateTime.tryParse(expiryStr);
    }

    // Check if token is still valid
    if (_accessToken != null &&
        _tokenExpiry != null &&
        _tokenExpiry!.isAfter(DateTime.now())) {
      return _accessToken;
    }

    // Try to refresh
    if (_refreshToken != null) {
      try {
        await _refreshAccessToken();
        return _accessToken;
      } catch (_) {
        await signOut();
      }
    }

    return null;
  }

  @override
  Future<String?> getUserId() async {
    final token = await getAccessToken();
    if (token == null) return null;

    final payload = _decodeJwtPayload(token);
    return payload['sub'] as String?;
  }

  @override
  Future<AuthUser?> getUserProfile() async {
    final token = await getAccessToken();
    if (token == null) return null;

    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '${_config.endpoint}/oidc/me',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final data = response.data!;
      return AuthUser(
        id: data['sub'] as String,
        email: data['email'] as String?,
        name: data['name'] as String?,
        avatarUrl: data['picture'] as String?,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<String> signInWithSocial({
    required String provider,
    required String idToken,
  }) async {
    // Exchange the social provider's ID token with Logto for access tokens.
    // Logto exposes a social verification endpoint for native apps.
    final response = await _dio.post<Map<String, dynamic>>(
      '${_config.endpoint}/api/interaction',
      data: {
        'event': 'SignIn',
        'identifier': {
          'connectorId': provider,
          'connectorData': {'id_token': idToken},
        },
      },
      options: Options(
        contentType: Headers.jsonContentType,
      ),
    );

    if (response.data == null) {
      throw Exception('Social sign-in failed: empty response');
    }

    // If Logto returns tokens directly, handle them.
    // Otherwise fall back to the standard OIDC flow with the social hint.
    if (response.data!.containsKey('access_token')) {
      await _handleTokenResponse(response.data!);
      return _accessToken!;
    }

    // Fallback: use the standard sign-in flow with social connector hint.
    // This opens the browser but pre-selects the social provider.
    final codeVerifier = _generateCodeVerifier();
    final codeChallenge = _generateCodeChallenge(codeVerifier);

    final authUrl = Uri.parse('${_config.endpoint}/oidc/auth').replace(
      queryParameters: {
        'client_id': _config.appId,
        'redirect_uri': _config.redirectUri,
        'response_type': 'code',
        'scope': _config.scopes.join(' '),
        'prompt': 'consent',
        'code_challenge': codeChallenge,
        'code_challenge_method': 'S256',
        'direct_sign_in': 'social:$provider',
      },
    );

    final callbackUrl = await FlutterWebAuth2.authenticate(
      url: authUrl.toString(),
      callbackUrlScheme: 'unjynx',
    );

    final code = Uri.parse(callbackUrl).queryParameters['code'];
    if (code == null) {
      throw Exception('No authorization code received from social sign-in');
    }

    final tokenResponse = await _dio.post<Map<String, dynamic>>(
      '${_config.endpoint}/oidc/token',
      data: {
        'grant_type': 'authorization_code',
        'client_id': _config.appId,
        'redirect_uri': _config.redirectUri,
        'code': code,
        'code_verifier': codeVerifier,
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
      ),
    );

    await _handleTokenResponse(tokenResponse.data!);
    return _accessToken!;
  }

  Future<void> _refreshAccessToken() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '${_config.endpoint}/oidc/token',
      data: {
        'grant_type': 'refresh_token',
        'client_id': _config.appId,
        'refresh_token': _refreshToken,
      },
      options: Options(
        contentType: Headers.formUrlEncodedContentType,
      ),
    );

    await _handleTokenResponse(response.data!);
  }

  Future<void> _handleTokenResponse(Map<String, dynamic> data) async {
    _accessToken = data['access_token'] as String;
    _refreshToken = data['refresh_token'] as String?;
    final expiresIn = data['expires_in'] as int? ?? 3600;
    _tokenExpiry = DateTime.now().add(Duration(seconds: expiresIn));

    await _storage.write(key: 'unjynx_access_token', value: _accessToken);
    if (_refreshToken != null) {
      await _storage.write(key: 'unjynx_refresh_token', value: _refreshToken);
    }
    await _storage.write(
      key: 'unjynx_token_expiry',
      value: _tokenExpiry!.toIso8601String(),
    );
  }

  Map<String, dynamic> _decodeJwtPayload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return {};

    final payload = parts[1];
    final normalized = base64Url.normalize(payload);
    final decoded = utf8.decode(base64Url.decode(normalized));
    return json.decode(decoded) as Map<String, dynamic>;
  }

  /// Generate a cryptographically random PKCE code_verifier (43-128 chars).
  String _generateCodeVerifier() {
    final random = Random.secure();
    final bytes = List<int>.generate(32, (_) => random.nextInt(256));
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  /// Generate PKCE code_challenge = base64url(SHA256(code_verifier)).
  String _generateCodeChallenge(String codeVerifier) {
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);
    return base64Url.encode(digest.bytes).replaceAll('=', '');
  }
}
