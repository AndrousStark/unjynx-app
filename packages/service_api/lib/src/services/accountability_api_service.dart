import '../api_client.dart';
import '../api_response.dart';

/// API service for accountability partners, nudges, and shared goals.
class AccountabilityApiService {
  final ApiClient _client;

  const AccountabilityApiService(this._client);

  /// Get current user's accountability partners.
  Future<ApiResponse<List<dynamic>>> getPartners() {
    return _client.get('/accountability/partners');
  }

  /// Invite a new accountability partner by email or user ID.
  Future<ApiResponse<Map<String, dynamic>>> invitePartner(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/accountability/invite',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Accept a partner invitation by code.
  Future<ApiResponse<Map<String, dynamic>>> acceptInvitation(
    String code,
  ) {
    return _client.post('/accountability/accept/$code');
  }

  /// Remove a partner.
  Future<ApiResponse<Map<String, dynamic>>> removePartner(String partnerId) {
    return _client.delete('/accountability/partners/$partnerId');
  }

  /// Send a nudge to a partner (1/day limit).
  Future<ApiResponse<Map<String, dynamic>>> nudgePartner(
    String partnerId,
  ) {
    return _client.post('/accountability/nudge/$partnerId');
  }

  /// Get shared goals.
  Future<ApiResponse<List<dynamic>>> getSharedGoals() {
    return _client.get('/accountability/goals');
  }

  /// Create a shared goal.
  Future<ApiResponse<Map<String, dynamic>>> createSharedGoal(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/accountability/goals',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Get progress for a shared goal.
  Future<ApiResponse<Map<String, dynamic>>> getGoalProgress(String goalId) {
    return _client.get('/accountability/goals/$goalId/progress');
  }
}
