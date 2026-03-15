import '../api_client.dart';
import '../api_response.dart';

/// API service for auth-related backend endpoints.
class AuthApiService {
  final ApiClient _client;

  const AuthApiService(this._client);

  /// Get the current authenticated user's profile.
  Future<ApiResponse<Map<String, dynamic>>> getMe() {
    return _client.get('/auth/me');
  }

  /// Exchange authorization code for tokens.
  Future<ApiResponse<Map<String, dynamic>>> callback({
    required String code,
    required String codeVerifier,
    required String redirectUri,
  }) {
    return _client.post('/auth/callback', data: {
      'code': code,
      'code_verifier': codeVerifier,
      'redirect_uri': redirectUri,
    });
  }

  /// Refresh the access token.
  Future<ApiResponse<Map<String, dynamic>>> refreshToken({
    required String refreshToken,
  }) {
    return _client.post('/auth/refresh', data: {
      'refresh_token': refreshToken,
    });
  }

  /// Log out the current user.
  Future<ApiResponse<void>> logout() {
    return _client.post('/auth/logout');
  }
}
