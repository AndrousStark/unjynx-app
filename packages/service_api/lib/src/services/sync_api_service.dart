import '../api_client.dart';
import '../api_response.dart';

/// API service for offline sync (push/pull).
class SyncApiService {
  final ApiClient _client;

  const SyncApiService(this._client);

  /// Push local changes to the server.
  Future<ApiResponse<Map<String, dynamic>>> push(
    List<Map<String, dynamic>> records,
  ) {
    return _client.post('/sync/push', data: {'records': records});
  }

  /// Pull server changes since [since] timestamp.
  Future<ApiResponse<Map<String, dynamic>>> pull({required String since}) {
    return _client.post('/sync/pull', data: {'since': since});
  }

  /// Get current sync status.
  Future<ApiResponse<Map<String, dynamic>>> getStatus() {
    return _client.get('/sync/status');
  }
}
