import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

/// Custom auth implementation that calls the backend directly.
///
/// Replaces [LogtoAuthPort]. All auth is handled by the backend at
/// `/api/v1/auth/*` — no external OIDC provider needed.
class ApiAuthPort implements AuthPort {
  final String _apiBaseUrl;
  final Dio _dio;
  final FlutterSecureStorage _storage;

  String? _accessToken;
  String? _refreshToken;
  DateTime? _tokenExpiry;

  ApiAuthPort({
    required String apiBaseUrl,
    Dio? dio,
    FlutterSecureStorage? storage,
  })  : _apiBaseUrl = apiBaseUrl,
        _dio = dio ?? Dio(),
        _storage = storage ?? const FlutterSecureStorage();

  // ── AuthPort Implementation ────────────────────────────────────

  @override
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null;
  }

  @override
  Future<String> signIn() async {
    // For OIDC flow compatibility — called by AuthNotifier.signIn().
    // With custom auth, the login page calls login() directly.
    if (_accessToken != null) return _accessToken!;
    throw Exception('Use login() with email and password');
  }

  /// Sign in with email and password.
  Future<String> login(String email, String password) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '$_apiBaseUrl/api/v1/auth/login',
      data: {'email': email, 'password': password},
    );

    final data = response.data!;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Login failed');
    }

    await _handleTokenResponse(data['data'] as Map<String, dynamic>);
    return _accessToken!;
  }

  @override
  Future<String> signInWithSocial({
    required String provider,
    required String idToken,
  }) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '$_apiBaseUrl/api/v1/auth/social',
      data: {'provider': provider, 'idToken': idToken},
    );

    final data = response.data!;
    if (data['success'] != true) {
      throw Exception(data['error'] ?? 'Social sign-in failed');
    }

    await _handleTokenResponse(data['data'] as Map<String, dynamic>);
    return _accessToken!;
  }

  @override
  Future<void> signOut() async {
    final token = _accessToken;
    if (token != null) {
      try {
        await _dio.post(
          '$_apiBaseUrl/api/v1/auth/logout',
          options: Options(headers: {'Authorization': 'Bearer $token'}),
        );
      } catch (_) {
        // Fire-and-forget
      }
    }

    _accessToken = null;
    _refreshToken = null;
    _tokenExpiry = null;
    await _storage.delete(key: 'unjynx_access_token');
    await _storage.delete(key: 'unjynx_refresh_token');
    await _storage.delete(key: 'unjynx_token_expiry');
  }

  @override
  Future<String?> getAccessToken() async {
    // Check memory cache
    if (_accessToken != null &&
        _tokenExpiry != null &&
        _tokenExpiry!.isAfter(DateTime.now())) {
      return _accessToken;
    }

    // Load from secure storage
    _accessToken = await _storage.read(key: 'unjynx_access_token');
    _refreshToken = await _storage.read(key: 'unjynx_refresh_token');
    final expiryStr = await _storage.read(key: 'unjynx_token_expiry');
    if (expiryStr != null) {
      _tokenExpiry = DateTime.tryParse(expiryStr);
    }

    // Check if still valid
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

    try {
      final payload = _decodeJwtPayload(token);
      return payload['sub'] as String?;
    } catch (_) {
      return null;
    }
  }

  @override
  Future<AuthUser?> getUserProfile() async {
    final token = await getAccessToken();
    if (token == null) return null;

    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '$_apiBaseUrl/api/v1/auth/me',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      final data = response.data!['data'] as Map<String, dynamic>;
      return AuthUser(
        id: data['id'] as String,
        email: data['email'] as String?,
        name: data['name'] as String?,
        avatarUrl: data['avatarUrl'] as String?,
      );
    } catch (_) {
      // Fallback: decode JWT claims
      try {
        final payload = _decodeJwtPayload(_accessToken!);
        return AuthUser(
          id: payload['sub'] as String,
          email: payload['email'] as String?,
        );
      } catch (_) {
        return null;
      }
    }
  }

  // ── Token Management ──────────────────────────────────────────

  Future<void> _refreshAccessToken() async {
    final response = await _dio.post<Map<String, dynamic>>(
      '$_apiBaseUrl/api/v1/auth/refresh',
      data: {'refreshToken': _refreshToken},
    );

    final data = response.data!;
    if (data['success'] != true) {
      throw Exception('Refresh failed');
    }

    await _handleTokenResponse(data['data'] as Map<String, dynamic>);
  }

  Future<void> _handleTokenResponse(Map<String, dynamic> data) async {
    _accessToken = data['accessToken'] as String;
    _refreshToken = data['refreshToken'] as String?;
    final expiresIn = data['expiresIn'] as int? ?? 900;
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
    final normalized = base64Url.normalize(parts[1]);
    final decoded = utf8.decode(base64Url.decode(normalized));
    return json.decode(decoded) as Map<String, dynamic>;
  }

  // ── Organization Context ──────────────────────────────────────

  String? _selectedOrgId;

  @override
  String? get selectedOrgId => _selectedOrgId;

  @override
  Future<void> setSelectedOrg(String? orgId) async {
    _selectedOrgId = orgId;
    if (orgId != null) {
      await _storage.write(key: 'unjynx_selected_org', value: orgId);
    } else {
      await _storage.delete(key: 'unjynx_selected_org');
    }
  }

  @override
  Future<bool> isFirstLogin() async {
    final onboarded = await _storage.read(key: 'unjynx_onboarded');
    return onboarded != 'true';
  }

  @override
  Future<void> completeOnboarding() async {
    await _storage.write(key: 'unjynx_onboarded', value: 'true');
  }

  /// Load saved org selection from secure storage.
  Future<void> loadSavedOrgSelection() async {
    _selectedOrgId = await _storage.read(key: 'unjynx_selected_org');
  }
}
