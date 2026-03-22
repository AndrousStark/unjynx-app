import 'package:dio/dio.dart';

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

  /// Update the current user's profile fields (name, avatarUrl, timezone).
  ///
  /// Only provided fields are sent to the backend.
  /// Set [clearAvatar] to true to explicitly remove the avatar (sends null).
  Future<ApiResponse<Map<String, dynamic>>> updateProfile({
    String? name,
    String? avatarUrl,
    String? timezone,
    bool clearAvatar = false,
  }) {
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (clearAvatar) {
      data['avatarUrl'] = null;
    } else if (avatarUrl != null) {
      data['avatarUrl'] = avatarUrl;
    }
    if (timezone != null) data['timezone'] = timezone;

    return _client.patch('/auth/me', data: data);
  }

  /// Upload a profile avatar image via multipart form data.
  ///
  /// Returns the new avatar URL on success.
  Future<ApiResponse<Map<String, dynamic>>> uploadAvatar(
    String filePath,
  ) async {
    final formData = FormData.fromMap({
      'avatar': await MultipartFile.fromFile(
        filePath,
        filename: filePath.split('/').last,
      ),
    });

    // Use the underlying Dio directly for multipart — the ApiClient
    // envelope-unwrapping helper expects JSON content-type by default.
    final response = await _client.dio.post<Map<String, dynamic>>(
      '/auth/me/avatar',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return ApiResponse.fromJson(response.data!, null);
  }
}
