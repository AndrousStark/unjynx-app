import 'dart:typed_data';

import '../api_client.dart';
import '../api_response.dart';

/// API service for team management: CRUD, members, invites, reports.
class TeamApiService {
  final ApiClient _client;

  const TeamApiService(this._client);

  // ── Teams ──

  /// List teams the user belongs to.
  Future<ApiResponse<List<dynamic>>> getTeams() {
    return _client.get('/teams');
  }

  /// Create a new team.
  Future<ApiResponse<Map<String, dynamic>>> createTeam(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/teams',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Get team details.
  Future<ApiResponse<Map<String, dynamic>>> getTeam(String teamId) {
    return _client.get('/teams/$teamId');
  }

  /// Update team settings.
  Future<ApiResponse<Map<String, dynamic>>> updateTeam(
    String teamId,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/teams/$teamId', data: data);
  }

  /// Delete a team.
  Future<ApiResponse<Map<String, dynamic>>> deleteTeam(String teamId) {
    return _client.delete('/teams/$teamId');
  }

  // ── Members ──

  /// List team members.
  Future<ApiResponse<List<dynamic>>> getMembers(String teamId) {
    return _client.get('/teams/$teamId/members');
  }

  /// Invite a member by email.
  Future<ApiResponse<Map<String, dynamic>>> inviteMember(
    String teamId,
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/teams/$teamId/invite',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Remove a member from the team.
  Future<ApiResponse<Map<String, dynamic>>> removeMember(
    String teamId,
    String userId,
  ) {
    return _client.delete('/teams/$teamId/members/$userId');
  }

  /// Update a member's role.
  Future<ApiResponse<Map<String, dynamic>>> updateMemberRole(
    String teamId,
    String userId,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/teams/$teamId/members/$userId', data: data);
  }

  // ── Reports & Standups ──

  /// Get team analytics report.
  Future<ApiResponse<Map<String, dynamic>>> getReport(
    String teamId, {
    String range = '7d',
  }) {
    return _client.get('/teams/$teamId/reports', queryParameters: {
      'range': range,
    });
  }

  /// Get standup summaries.
  Future<ApiResponse<List<dynamic>>> getStandups(
    String teamId, {
    int limit = 7,
  }) {
    return _client.get('/teams/$teamId/standups', queryParameters: {
      'limit': limit,
    });
  }

  /// Submit daily standup.
  Future<ApiResponse<Map<String, dynamic>>> submitStandup(
    String teamId,
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/teams/$teamId/standups',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  // ── Report Exports ──

  /// Download team report as CSV text.
  ///
  /// Returns raw CSV string (UTF-8 BOM + comma-separated).
  Future<String> exportReportCsv(
    String teamId, {
    String period = 'week',
  }) {
    return _client.getText(
      '/teams/$teamId/reports/export/csv',
      queryParameters: {'period': period},
    );
  }

  /// Download team report as PDF bytes.
  ///
  /// Returns raw PDF binary data for writing to file.
  Future<Uint8List> exportReportPdf(
    String teamId, {
    String period = 'week',
  }) {
    return _client.getBytes(
      '/teams/$teamId/reports/export/pdf',
      queryParameters: {'period': period},
    );
  }
}
