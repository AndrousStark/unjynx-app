import '../api_client.dart';
import '../api_response.dart';

/// API service for org-level reports (velocity, cycle-time, workload, SLA).
class ReportApiService {
  final ApiClient _client;

  const ReportApiService(this._client);

  /// Sprint velocity data across recent sprints.
  Future<ApiResponse<Map<String, dynamic>>> getVelocity({
    required String projectId,
    int limit = 10,
  }) {
    return _client.get(
      '/reports/velocity',
      queryParameters: {'projectId': projectId, 'limit': limit.toString()},
    );
  }

  /// Average and median task cycle time.
  Future<ApiResponse<Map<String, dynamic>>> getCycleTime({
    String? projectId,
    int days = 30,
  }) {
    return _client.get(
      '/reports/cycle-time',
      queryParameters: {
        if (projectId != null) 'projectId': projectId,
        'days': days.toString(),
      },
    );
  }

  /// Team workload distribution.
  Future<ApiResponse<Map<String, dynamic>>> getWorkload({String? projectId}) {
    return _client.get(
      '/reports/workload',
      queryParameters: {if (projectId != null) 'projectId': projectId},
    );
  }

  /// SLA compliance rates.
  Future<ApiResponse<Map<String, dynamic>>> getSla({
    String? projectId,
    int days = 30,
  }) {
    return _client.get(
      '/reports/sla',
      queryParameters: {
        if (projectId != null) 'projectId': projectId,
        'days': days.toString(),
      },
    );
  }

  /// Top-level org summary KPIs.
  Future<ApiResponse<Map<String, dynamic>>> getSummary() {
    return _client.get('/reports/summary');
  }

  /// List saved report snapshots.
  Future<ApiResponse<List<dynamic>>> getSnapshots({
    required String reportType,
    String? projectId,
    int limit = 10,
  }) {
    return _client.get(
      '/reports/snapshots',
      queryParameters: {
        'reportType': reportType,
        if (projectId != null) 'projectId': projectId,
        'limit': limit.toString(),
      },
    );
  }

  /// Save a report snapshot (admin+ only).
  Future<ApiResponse<Map<String, dynamic>>> saveSnapshot({
    required String reportType,
    required Map<String, dynamic> data,
    String? projectId,
    String? periodStart,
    String? periodEnd,
  }) {
    return _client.post(
      '/reports/snapshots',
      data: {
        'reportType': reportType,
        'data': data,
        if (projectId != null) 'projectId': projectId,
        if (periodStart != null) 'periodStart': periodStart,
        if (periodEnd != null) 'periodEnd': periodEnd,
      },
    );
  }
}
