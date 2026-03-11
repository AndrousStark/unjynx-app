import 'package:dio/dio.dart';
import 'package:service_api/service_api.dart';
import 'package:service_sync/service_sync.dart';

/// API-backed implementation of [SyncRemotePort].
///
/// Delegates push/pull operations to [SyncApiService] and converts
/// between [SyncRecord] and the JSON maps the API expects.
///
/// All network errors are caught and handled gracefully:
/// - [push] returns an empty list on failure (records stay needsSync=true).
/// - [pull] returns an empty list on failure (no remote changes applied).
/// - [isOnline] returns false on any error.
class ApiSyncRemoteAdapter implements SyncRemotePort {
  final SyncApiService _syncApi;

  const ApiSyncRemoteAdapter(this._syncApi);

  // ---------------------------------------------------------------------------
  // push
  // ---------------------------------------------------------------------------

  @override
  Future<List<SyncRecord>> push(
    String entityType,
    List<SyncRecord> records,
  ) async {
    if (records.isEmpty) return const [];

    try {
      final payload = records.map(_syncRecordToMap).toList();
      final response = await _syncApi.push(payload);

      if (!response.success || response.data == null) {
        return const [];
      }

      final responseRecords = response.data!['records'];
      if (responseRecords is! List) return const [];

      return responseRecords
          .whereType<Map<String, dynamic>>()
          .map((json) => _mapToSyncRecord(json, entityType))
          .toList();
    } on DioException catch (_) {
      // Network failure — records stay needsSync=true for retry.
      return const [];
    } on Exception catch (_) {
      return const [];
    }
  }

  // ---------------------------------------------------------------------------
  // pull
  // ---------------------------------------------------------------------------

  @override
  Future<List<SyncRecord>> pull(
    String entityType,
    DateTime? since,
  ) async {
    try {
      final sinceStr = since?.toUtc().toIso8601String() ?? '';
      final response = await _syncApi.pull(since: sinceStr);

      if (!response.success || response.data == null) {
        return const [];
      }

      final responseRecords = response.data!['records'];
      if (responseRecords is! List) return const [];

      return responseRecords
          .whereType<Map<String, dynamic>>()
          .where((json) => json['entityType'] == entityType)
          .map((json) => _mapToSyncRecord(json, entityType))
          .toList();
    } on DioException catch (_) {
      // Network failure — no remote changes to apply.
      return const [];
    } on Exception catch (_) {
      return const [];
    }
  }

  // ---------------------------------------------------------------------------
  // isOnline
  // ---------------------------------------------------------------------------

  @override
  Future<bool> isOnline() async {
    try {
      final response = await _syncApi.getStatus();
      return response.success;
    } on DioException catch (_) {
      return false;
    } on Exception catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Conversion helpers
  // ---------------------------------------------------------------------------

  /// Convert a [SyncRecord] to a JSON map for the API.
  Map<String, dynamic> _syncRecordToMap(SyncRecord record) {
    final fieldTimestamps = <String, String>{};
    for (final entry in record.fieldTimestamps.entries) {
      fieldTimestamps[entry.key] = entry.value.toUtc().toIso8601String();
    }

    return <String, dynamic>{
      'id': record.id,
      'entityType': record.entityType,
      'fields': record.fields,
      'fieldTimestamps': fieldTimestamps,
      'updatedAt': record.updatedAt.toUtc().toIso8601String(),
      'createdAt': record.createdAt.toUtc().toIso8601String(),
      'isDeleted': record.isDeleted,
      'needsSync': record.needsSync,
    };
  }

  /// Convert a JSON map from the API to a [SyncRecord].
  SyncRecord _mapToSyncRecord(Map<String, dynamic> json, String fallbackType) {
    final rawTimestamps = json['fieldTimestamps'];
    final fieldTimestamps = <String, DateTime>{};
    if (rawTimestamps is Map<String, dynamic>) {
      for (final entry in rawTimestamps.entries) {
        final dt = DateTime.tryParse(entry.value.toString());
        if (dt != null) {
          fieldTimestamps[entry.key] = dt;
        }
      }
    }

    final rawFields = json['fields'];
    final fields = <String, Object?>{};
    if (rawFields is Map<String, dynamic>) {
      fields.addAll(rawFields);
    }

    return SyncRecord(
      id: json['id'] as String? ?? '',
      entityType: json['entityType'] as String? ?? fallbackType,
      fields: fields,
      fieldTimestamps: fieldTimestamps,
      updatedAt: _parseDateTime(json['updatedAt']) ?? DateTime.now(),
      createdAt: _parseDateTime(json['createdAt']) ?? DateTime.now(),
      isDeleted: json['isDeleted'] as bool? ?? false,
      needsSync: json['needsSync'] as bool? ?? false,
    );
  }

  DateTime? _parseDateTime(Object? value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}
