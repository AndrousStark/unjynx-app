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
class _ImportStepNotifier extends Notifier<ImportStep> {
  @override
  ImportStep build() => ImportStep.selectSource;
  void set(ImportStep value) => state = value;
}

final importStepProvider =
    NotifierProvider<_ImportStepNotifier, ImportStep>(
  _ImportStepNotifier.new,
);

/// Selected import source.
class _ImportSourceNotifier extends Notifier<ImportSource?> {
  @override
  ImportSource? build() => null;
  void set(ImportSource? value) => state = value;
}

final importSourceProvider =
    NotifierProvider<_ImportSourceNotifier, ImportSource?>(
  _ImportSourceNotifier.new,
);

/// Import preview data (after parsing).
class _ImportPreviewNotifier extends Notifier<ImportPreview?> {
  @override
  ImportPreview? build() => null;
  void set(ImportPreview? value) => state = value;
}

final importPreviewProvider =
    NotifierProvider<_ImportPreviewNotifier, ImportPreview?>(
  _ImportPreviewNotifier.new,
);

/// Column mapping state (editable during mapping step).
class _ColumnMappingNotifier extends Notifier<Map<String, String>> {
  @override
  Map<String, String> build() => const {};
  void set(Map<String, String> value) => state = value;
}

final columnMappingProvider =
    NotifierProvider<_ColumnMappingNotifier, Map<String, String>>(
  _ColumnMappingNotifier.new,
);

/// Import progress (0.0 to 1.0).
class _ImportProgressNotifier extends Notifier<double> {
  @override
  double build() => 0.0;
  void set(double value) => state = value;
}

final importProgressProvider =
    NotifierProvider<_ImportProgressNotifier, double>(
  _ImportProgressNotifier.new,
);

/// Import result (after execution).
class _ImportResultNotifier extends Notifier<ImportResult?> {
  @override
  ImportResult? build() => null;
  void set(ImportResult? value) => state = value;
}

final importResultProvider =
    NotifierProvider<_ImportResultNotifier, ImportResult?>(
  _ImportResultNotifier.new,
);

/// Import error message (shown on failure).
class _ImportErrorNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final importErrorProvider =
    NotifierProvider<_ImportErrorNotifier, String?>(
  _ImportErrorNotifier.new,
);

/// Raw parsed rows from the CSV file (kept for executeImport payload).
class _ImportParsedRowsNotifier
    extends Notifier<List<Map<String, String>>> {
  @override
  List<Map<String, String>> build() => const [];
  void set(List<Map<String, String>> value) => state = value;
}

final _importParsedRowsProvider =
    NotifierProvider<_ImportParsedRowsNotifier, List<Map<String, String>>>(
  _ImportParsedRowsNotifier.new,
);

/// Manages the import flow state machine.
class ImportFlowNotifier extends Notifier<ImportStep> {
  @override
  ImportStep build() => ImportStep.selectSource;

  /// Selects a source and advances to upload step.
  void selectSource(ImportSource source) {
    ref.read(importSourceProvider.notifier).set(source);
    ref.read(importErrorProvider.notifier).set(null);
    state = ImportStep.upload;
  }

  /// Reads the file at [filePath], parses CSV client-side, then calls
  /// the `previewImport` API for server-side validation.
  ///
  /// Falls back to client-side-only preview if the API is unavailable.
  Future<void> uploadFile(String filePath) async {
    ref.read(importErrorProvider.notifier).set(null);
    final source =
        ref.read(importSourceProvider) ?? ImportSource.genericCsv;

    // ── 1. Read and parse file locally ──
    final String content;
    try {
      content = await File(filePath).readAsString();
    } on FileSystemException catch (e) {
      ref.read(importErrorProvider.notifier).set(
        'Failed to read file: ${e.message}',
      );
      return;
    }

    if (content.trim().isEmpty) {
      ref.read(importErrorProvider.notifier).set(
        'The selected file is empty.',
      );
      return;
    }

    final (headers, rows) = _parseCsvContent(content);
    if (headers.isEmpty || rows.isEmpty) {
      ref.read(importErrorProvider.notifier).set(
        'No data rows found in the file.',
      );
      return;
    }

    // Store raw rows for the execute step
    ref.read(_importParsedRowsProvider.notifier).set(rows);

    // Build a default column mapping from headers
    final defaultMapping = <String, String>{
      for (final header in headers) header: ImportTargetFields.skip,
    };

    // Take up to 5 sample rows for preview
    final sampleTasks = rows.length > 5 ? rows.sublist(0, 5) : rows;

    // ── 2. Call previewImport API for server-side validation ──
    final api = _tryRead(ref, importExportApiProvider);
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
          ref.read(importPreviewProvider.notifier).set(preview);
          ref.read(columnMappingProvider.notifier).set(
            preview.columnMapping,
          );
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
    ref.read(importPreviewProvider.notifier).set(preview);
    ref.read(columnMappingProvider.notifier).set(defaultMapping);
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
    ref.read(importErrorProvider.notifier).set(null);
    final progressNotifier = ref.read(importProgressProvider.notifier);
    progressNotifier.set(0.0);

    final source =
        ref.read(importSourceProvider) ?? ImportSource.genericCsv;
    final mapping = ref.read(columnMappingProvider);
    final rows = ref.read(_importParsedRowsProvider);

    final api = _tryRead(ref, importExportApiProvider);
    if (api == null) {
      ref.read(importErrorProvider.notifier).set(
        'API service unavailable. Please try again later.',
      );
      ref.read(importResultProvider.notifier).set(const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      ));
      state = ImportStep.summary;
      return;
    }

    // Indicate import has started
    progressNotifier.set(0.1);

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

      progressNotifier.set(1.0);

      if (response.success && response.data != null) {
        final result = ImportResult.fromJson(response.data!);
        ref.read(importResultProvider.notifier).set(result);
      } else {
        ref.read(importErrorProvider.notifier).set(
          response.error ?? 'Import failed. Please try again.',
        );
        ref.read(importResultProvider.notifier).set(const ImportResult(
          imported: 0,
          skipped: 0,
          duplicates: 0,
          errors: 0,
        ));
      }
    } on DioException catch (e) {
      progressNotifier.set(1.0);
      ref.read(importErrorProvider.notifier).set(
        'Network error: ${e.message ?? 'Connection failed'}',
      );
      ref.read(importResultProvider.notifier).set(const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      ));
    } on ApiException catch (e) {
      progressNotifier.set(1.0);
      ref.read(importErrorProvider.notifier).set(e.message);
      ref.read(importResultProvider.notifier).set(const ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      ));
    }

    state = ImportStep.summary;
  }

  /// Resets to initial state for a new import.
  void reset() {
    ref.read(importSourceProvider.notifier).set(null);
    ref.read(importPreviewProvider.notifier).set(null);
    ref.read(columnMappingProvider.notifier).set({});
    ref.read(importProgressProvider.notifier).set(0.0);
    ref.read(importResultProvider.notifier).set(null);
    ref.read(importErrorProvider.notifier).set(null);
    ref.read(_importParsedRowsProvider.notifier).set(const []);
    state = ImportStep.selectSource;
  }
}

/// Import flow state machine provider.
final importFlowProvider =
    NotifierProvider<ImportFlowNotifier, ImportStep>(
  ImportFlowNotifier.new,
);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/// Selected export format.
class _ExportFormatNotifier extends Notifier<ExportFormat?> {
  @override
  ExportFormat? build() => null;
  void set(ExportFormat? value) => state = value;
}

final exportFormatProvider =
    NotifierProvider<_ExportFormatNotifier, ExportFormat?>(
  _ExportFormatNotifier.new,
);

/// Export date range filter.
class _ExportDateRangeNotifier extends Notifier<DateTimeRange?> {
  @override
  DateTimeRange? build() => null;
  void set(DateTimeRange? value) => state = value;
}

final exportDateRangeProvider =
    NotifierProvider<_ExportDateRangeNotifier, DateTimeRange?>(
  _ExportDateRangeNotifier.new,
);

/// Export project filter.
class _ExportProjectFilterNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final exportProjectFilterProvider =
    NotifierProvider<_ExportProjectFilterNotifier, String?>(
  _ExportProjectFilterNotifier.new,
);

/// Whether export is in progress.
class _ExportLoadingNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void set(bool value) => state = value;
}

final exportLoadingProvider =
    NotifierProvider<_ExportLoadingNotifier, bool>(
  _ExportLoadingNotifier.new,
);

/// Export error message.
class _ExportErrorNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final exportErrorProvider =
    NotifierProvider<_ExportErrorNotifier, String?>(
  _ExportErrorNotifier.new,
);

/// Executes an export based on the selected format and filters.
///
/// Returns the raw response data on success, or null on failure
/// (sets [exportErrorProvider] with the error message).
final exportProvider = FutureProvider.autoDispose<dynamic>((ref) async {
  final format = ref.watch(exportFormatProvider);
  if (format == null) return null;

  final api = _tryRead(ref, importExportApiProvider);
  if (api == null) {
    ref.read(exportErrorProvider.notifier).set('API service unavailable.');
    return null;
  }

  final dateRange = ref.read(exportDateRangeProvider);
  final project = ref.read(exportProjectFilterProvider);

  final dateFrom = dateRange?.start.toIso8601String().split('T').first;
  final dateTo = dateRange?.end.toIso8601String().split('T').first;

  ref.read(exportLoadingProvider.notifier).set(true);
  ref.read(exportErrorProvider.notifier).set(null);

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

    ref.read(exportLoadingProvider.notifier).set(false);

    if (response.success) {
      return response.data;
    } else {
      ref.read(exportErrorProvider.notifier).set(
        response.error ?? 'Export failed.',
      );
      return null;
    }
  } on DioException catch (e) {
    ref.read(exportLoadingProvider.notifier).set(false);
    ref.read(exportErrorProvider.notifier).set(
      'Network error: ${e.message ?? 'Connection failed'}',
    );
    return null;
  } on ApiException catch (e) {
    ref.read(exportLoadingProvider.notifier).set(false);
    ref.read(exportErrorProvider.notifier).set(e.message);
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
