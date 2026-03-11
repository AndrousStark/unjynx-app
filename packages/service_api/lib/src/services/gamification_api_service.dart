import '../api_client.dart';
import '../api_response.dart';

/// API service for gamification features: XP, achievements, leaderboard.
class GamificationApiService {
  final ApiClient _client;

  const GamificationApiService(this._client);

  /// Get current user's XP and level data.
  Future<ApiResponse<Map<String, dynamic>>> getXpData() {
    return _client.get('/gamification/xp');
  }

  /// Get all achievements with unlock status.
  Future<ApiResponse<List<dynamic>>> getAchievements() {
    return _client.get('/gamification/achievements');
  }

  /// Get a specific achievement detail.
  Future<ApiResponse<Map<String, dynamic>>> getAchievement(String id) {
    return _client.get('/gamification/achievements/$id');
  }

  /// Get leaderboard entries.
  Future<ApiResponse<List<dynamic>>> getLeaderboard({
    String scope = 'friends',
    String period = 'this_week',
    int limit = 20,
  }) {
    return _client.get('/gamification/leaderboard', queryParameters: {
      'scope': scope,
      'period': period,
      'limit': limit,
    });
  }

  /// Get active challenges.
  Future<ApiResponse<List<dynamic>>> getChallenges({
    String? status,
  }) {
    return _client.get('/gamification/challenges', queryParameters: {
      if (status != null) 'status': status,
    });
  }

  /// Create a new challenge.
  Future<ApiResponse<Map<String, dynamic>>> createChallenge(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/gamification/challenges',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Accept a challenge invitation.
  Future<ApiResponse<Map<String, dynamic>>> acceptChallenge(String id) {
    return _client.patch('/gamification/challenges/$id/accept');
  }

  /// Get XP history (for charts).
  Future<ApiResponse<List<dynamic>>> getXpHistory({
    String range = '30d',
  }) {
    return _client.get('/gamification/xp/history', queryParameters: {
      'range': range,
    });
  }
}
