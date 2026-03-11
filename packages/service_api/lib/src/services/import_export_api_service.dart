import '../api_client.dart';
import '../api_response.dart';

/// API service for data import and export operations.
class ImportExportApiService {
  final ApiClient _client;

  const ImportExportApiService(this._client);

  // ── Import ──

  /// Preview parsed tasks from CSV/JSON data before importing.
  Future<ApiResponse<Map<String, dynamic>>> previewImport(
    Map<String, dynamic> data,
  ) {
    return _client.post('/import/preview', data: data);
  }

  /// Execute the import with column mapping and parsed rows.
  Future<ApiResponse<Map<String, dynamic>>> executeImport(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/import/execute',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  // ── Export ──

  /// Export tasks as CSV.
  Future<ApiResponse<dynamic>> exportCsv({
    String? project,
    String? dateFrom,
    String? dateTo,
  }) {
    return _client.get('/export/csv', queryParameters: {
      if (project != null) 'project': project,
      if (dateFrom != null) 'dateFrom': dateFrom,
      if (dateTo != null) 'dateTo': dateTo,
    });
  }

  /// Export all user data as JSON (GDPR compliant).
  Future<ApiResponse<dynamic>> exportJson() {
    return _client.get('/export/json');
  }

  /// Export tasks as ICS (RFC 5545 calendar format).
  Future<ApiResponse<dynamic>> exportIcs({
    String? project,
    String? dateFrom,
    String? dateTo,
  }) {
    return _client.get('/export/ics', queryParameters: {
      if (project != null) 'project': project,
      if (dateFrom != null) 'dateFrom': dateFrom,
      if (dateTo != null) 'dateTo': dateTo,
    });
  }

  // ── GDPR / Account ──

  /// Request a GDPR-compliant data export (processed within 72h).
  Future<ApiResponse<Map<String, dynamic>>> requestDataExport() {
    return _client.post('/data/request');
  }

  /// Delete user account (30-day grace period).
  Future<ApiResponse<Map<String, dynamic>>> deleteAccount() {
    return _client.delete('/data/account');
  }
}
