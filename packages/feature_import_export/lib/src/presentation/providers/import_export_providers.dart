import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/export_format.dart';
import '../../domain/models/import_preview.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely tries to read a provider that may not exist in the scope.
///
/// When feature_import_export is used without service_api providers
/// being overridden (e.g. in tests), this returns null instead of throwing.
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Simple CSV line parser that respects quoted fields.
List<String> _parseCsvLine(String line) {
  final fields = <String>[];
  final buffer = StringBuffer();
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    final char = line[i];
    if (char == '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] == '"') {
        buffer.write('"');
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char == ',' && !inQuotes) {
      fields.add(buffer.toString().trim());
      buffer.clear();
    } else {
      buffer.write(char);
    }
  }
  fields.add(buffer.toString().trim());
  return fields;
}

/// Parses a CSV file into a list of row maps keyed by header columns.
///
/// Returns `(headers, rows)` where each row is a `Map<String, String>`.
(List<String>, List<Map<String, String>>) _parseCsvContent(String content) {
  final lines = const LineSplitter().convert(content)
      .where((line) => line.trim().isNotEmpty)
      .toList();
  if (lines.isEmpty) return (const [], const []);

  final headers = _parseCsvLine(lines.first);
  final rows = <Map<String, String>>[];
  for (var i = 1; i < lines.length; i++) {
    final values = _parseCsvLine(lines[i]);
    final row = <String, String>{};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = j < values.length ? values[j] : '';
    }
    rows.add(row);
  }
  return (headers, rows);
}

// ---------------------------------------------------------------------------
// Import state machine
// ---------------------------------------------------------------------------

/// Import flow step enum.
enum ImportStep { selectSource, upload, preview, mapping, executing, summary }

/// Current import step.
final importStepProvider = StateProvider<ImportStep>(
  (_) => ImportStep.selectSource,
);

/// Selected import source.
final importSourceProvider = StateProvider<ImportSource?>((_) => null);

/// Import preview data (after parsing).
final importPreviewProvider = StateProvider<ImportPreview?>((_) => null);

/// Column mapping state (editable during mapping step).
final columnMappingProvider = StateProvider<Map<String, String>>(
  (_) => const {},
);

/// Import progress (0.0 to 1.0).
final importProgressProvider = StateProvider<double>((_) => 0.0);

/// Import result (after execution).
final importResultProvider = StateProvider<ImportResult?>((_) => null);

/// Import error message (shown on failure).
final importErrorProvider = StateProvider<String?>((_) => null);

/// Raw parsed rows from the CSV file (kept for executeImport payload).
final _importParsedRowsProvider =
    StateProvider<List<Map<String, String>>>((_) => const []);

/// Manages the import flow state machine.
class ImportFlowNotifier extends StateNotifier<ImportStep> {
  ImportFlowNotifier(this._ref) : super(ImportStep.selectSource);

  final Ref _ref;

  /// Selects a source and advances to upload step.
  void selectSource(ImportSource source) {
    _ref.read(importSourceProvider.notifier).state = source;
    _ref.read(importErrorProvider.notifier).state = null;
    state = ImportStep.upload;
  }

  /// Reads the file at [filePath], parses CSV client-side, then calls
  /// the `previewImport` API for server-side validation.
  ///
  /// Falls back to client-side-only preview if the API is unavailable.
  Future<void> uploadFile(String filePath) async {
    _ref.read(importErrorProvider.notifier).state = null;
    final source =
        _ref.read(importSourceProvider) ?? ImportSource.genericCsv;

    // ── 1. Read and parse file locally ──
    final String content;
    try {
      content = await File(filePath).readAsString();
    } on FileSystemException catch (e) {
      _ref.read(importErrorProvider.notifier).state =
          'Failed to read file: ${e.message}';
      return;
    }

    if (content.trim().isEmpty) {
      _ref.read(importErrorProvider.notifier).state =
          'The selected file is empty.';
      return;
    }

    final (headers, rows) = _parseCsvContent(content);
    if (headers.isEmpty || rows.isEmpty) {
      _ref.read(importErrorProvider.notifier).state =
          'No data rows found in the file.';
      return;
    }

    // Store raw rows for the execute step
    _ref.read(_importParsedRowsProvider.notifier).state = rows;

    // Build a default column mapping from headers
    final defaultMapping = <String, String>{
      for (final header in headers) header: ImportTargetFields.skip,
    };

    // Take up to 5 sample rows for preview
    final sampleTasks = rows.length > 5 ? rows.sublist(0, 5) : rows;

    // ── 2. Call previewImport API for server-side validation ──
    final api = _tryRead(_ref, importExportApiProvider);
    if (api != null) {
      try {
        final response = await api.previewImport({
          'source': source.name,
          'headers': headers,
          'rows': rows,
        });

        if (response.success && response.data != null) {
          final serverPreview = ImportPreview.fromJson(response.data!);
          // Merge server validation with local parsing
          final preview = serverPreview.copyWith(
            source: source,
            sampleTasks: serverPreview.sampleTasks.isNotEmpty
                ? serverPreview.sampleTasks
                : sampleTasks,
            columnMapping: serverPreview.columnMapping.isNotEmpty
                ? serverPreview.columnMapping
                : defaultMapping,
          );
          _ref.read(importPreviewProvider.notifier).state = preview;
          _ref.read(columnMappingProvider.notifier).state =
              preview.columnMapping;
          state = ImportStep.preview;
          return;
        }
      } on DioException {
        // Network error -- fall through to client-side preview
      } on ApiException {
        // API error -- fall through to client-side preview
      }
    }

    // ── 3. Fallback: client-side-only preview ──
    final preview = ImportPreview(
      totalRows: rows.length,
      source: source,
      sampleTasks: sampleTasks,
      columnMapping: defaultMapping,
      validRows: rows.length,
    );
    _ref.read(importPreviewProvider.notifier).state = preview;
    _ref.read(columnMappingProvider.notifier).state = defaultMapping;
    state = ImportStep.preview;
  }

  /// Advances to mapping step.
  void proceedToMapping() {
    state = ImportStep.mapping;
  }

  /// Executes the import with current column mapping via the API.
  ///
  /// On API failure, sets an error message and transitions to summary
  /// with zero-count result so the UI can display the error.
  Future<void> executeImport() async {
    state = ImportStep.executing;
    _ref.read(importErrorProvider.notifier).state = null;
    final progressNotifier = _ref.read(importProgressProvider.notifier);
    progressNotifier.state = 0.0;

    final source =
        _ref.read(importSourceProvider) ?? ImportSource.genericCsv;
    final mapping = _ref.read(columnMappingProvider);
    final rows = _ref.read(_importParsedRowsProvider);

    final api = _tryRead(_ref, importExportApiProvider);
    if (api == null) {
      _ref.read(importErrorProvider.notifier).state =
          'API service unavailable. Please try again later.';
      _ref.read(importResultProvider.notifier).state = const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      );
      state = ImportStep.summary;
      return;
    }

    // Indicate import has started
    progressNotifier.state = 0.1;

    final idempotencyKey =
        'import-${DateTime.now().microsecondsSinceEpoch}';

    try {
      final response = await api.executeImport(
        {
          'source': source.name,
          'columnMapping': mapping,
          'rows': rows,
        },
        idempotencyKey: idempotencyKey,
      );

      progressNotifier.state = 1.0;

      if (response.success && response.data != null) {
        final result = ImportResult.fromJson(response.data!);
        _ref.read(importResultProvider.notifier).state = result;
      } else {
        _ref.read(importErrorProvider.notifier).state =
            response.error ?? 'Import failed. Please try again.';
        _ref.read(importResultProvider.notifier).state = const ImportResult(
          imported: 0,
          skipped: 0,
          duplicates: 0,
          errors: 0,
        );
      }
    } on DioException catch (e) {
      progressNotifier.state = 1.0;
      _ref.read(importErrorProvider.notifier).state =
          'Network error: ${e.message ?? 'Connection failed'}';
      _ref.read(importResultProvider.notifier).state = const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      );
    } on ApiException catch (e) {
      progressNotifier.state = 1.0;
      _ref.read(importErrorProvider.notifier).state = e.message;
      _ref.read(importResultProvider.notifier).state = const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      );
    }

    state = ImportStep.summary;
  }

  /// Resets to initial state for a new import.
  void reset() {
    _ref.read(importSourceProvider.notifier).state = null;
    _ref.read(importPreviewProvider.notifier).state = null;
    _ref.read(columnMappingProvider.notifier).state = {};
    _ref.read(importProgressProvider.notifier).state = 0.0;
    _ref.read(importResultProvider.notifier).state = null;
    _ref.read(importErrorProvider.notifier).state = null;
    _ref.read(_importParsedRowsProvider.notifier).state = const [];
    state = ImportStep.selectSource;
  }
}

/// Import flow state machine provider.
final importFlowProvider =
    StateNotifierProvider<ImportFlowNotifier, ImportStep>(
  (ref) => ImportFlowNotifier(ref),
);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/// Selected export format.
final exportFormatProvider = StateProvider<ExportFormat?>((_) => null);

/// Export date range filter.
final exportDateRangeProvider = StateProvider<DateTimeRange?>((_) => null);

/// Export project filter.
final exportProjectFilterProvider = StateProvider<String?>((_) => null);

/// Whether export is in progress.
final exportLoadingProvider = StateProvider<bool>((_) => false);

/// Export error message.
final exportErrorProvider = StateProvider<String?>((_) => null);

/// Executes an export based on the selected format and filters.
///
/// Returns the raw response data on success, or null on failure
/// (sets [exportErrorProvider] with the error message).
final exportProvider = FutureProvider.autoDispose<dynamic>((ref) async {
  final format = ref.watch(exportFormatProvider);
  if (format == null) return null;

  final api = _tryRead(ref, importExportApiProvider);
  if (api == null) {
    ref.read(exportErrorProvider.notifier).state =
        'API service unavailable.';
    return null;
  }

  final dateRange = ref.read(exportDateRangeProvider);
  final project = ref.read(exportProjectFilterProvider);

  final dateFrom = dateRange?.start.toIso8601String().split('T').first;
  final dateTo = dateRange?.end.toIso8601String().split('T').first;

  ref.read(exportLoadingProvider.notifier).state = true;
  ref.read(exportErrorProvider.notifier).state = null;

  try {
    final ApiResponse<dynamic> response;

    switch (format) {
      case ExportFormat.csv:
        response = await api.exportCsv(
          project: project,
          dateFrom: dateFrom,
          dateTo: dateTo,
        );
      case ExportFormat.json:
        response = await api.exportJson();
      case ExportFormat.ics:
        response = await api.exportIcs(
          project: project,
          dateFrom: dateFrom,
          dateTo: dateTo,
        );
    }

    ref.read(exportLoadingProvider.notifier).state = false;

    if (response.success) {
      return response.data;
    } else {
      ref.read(exportErrorProvider.notifier).state =
          response.error ?? 'Export failed.';
      return null;
    }
  } on DioException catch (e) {
    ref.read(exportLoadingProvider.notifier).state = false;
    ref.read(exportErrorProvider.notifier).state =
        'Network error: ${e.message ?? 'Connection failed'}';
    return null;
  } on ApiException catch (e) {
    ref.read(exportLoadingProvider.notifier).state = false;
    ref.read(exportErrorProvider.notifier).state = e.message;
    return null;
  }
});

// ---------------------------------------------------------------------------
// GDPR - Data export request
// ---------------------------------------------------------------------------

/// Requests a GDPR-compliant full data export (processed within 72h).
///
/// Returns the API response data on success (e.g. `{ "requestId": "..." }`),
/// or throws on failure.
final requestDataExportProvider =
    FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final api = _tryRead(ref, importExportApiProvider);
  if (api == null) return null;

  try {
    final response = await api.requestDataExport();
    if (response.success && response.data != null) {
      return response.data!;
    }
    return null;
  } on DioException {
    return null;
  } on ApiException {
    return null;
  }
});

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

/// Deletes the user account (30-day grace period).
///
/// Returns the API response data on success, or null on failure.
final deleteAccountProvider =
    FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final api = _tryRead(ref, importExportApiProvider);
  if (api == null) return null;

  try {
    final response = await api.deleteAccount();
    if (response.success && response.data != null) {
      return response.data!;
    }
    return null;
  } on DioException {
    return null;
  } on ApiException {
    return null;
  }
});
