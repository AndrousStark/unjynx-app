/// Supported export formats.
enum ExportFormat {
  csv('CSV', 'Comma-separated values for spreadsheets'),
  json('JSON (GDPR)', 'Full data export for GDPR compliance'),
  ics('ICS (Calendar)', 'iCalendar format for calendar import');

  const ExportFormat(this.displayName, this.description);

  final String displayName;
  final String description;
}

/// Result of an export operation.
class ExportResult {
  const ExportResult({
    required this.format,
    required this.taskCount,
    required this.filePath,
  });

  final ExportFormat format;
  final int taskCount;
  final String filePath;
}

/// Result summary of an import operation.
class ImportResult {
  const ImportResult({
    required this.imported,
    required this.skipped,
    required this.duplicates,
    required this.errors,
    this.errorDetails = const [],
  });

  final int imported;
  final int skipped;
  final int duplicates;
  final int errors;

  /// Per-row error details from the server.
  final List<String> errorDetails;

  int get total => imported + skipped + duplicates + errors;

  /// Parse from API response JSON.
  factory ImportResult.fromJson(Map<String, dynamic> json) {
    final errorDetails = (json['errorDetails'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        const [];

    return ImportResult(
      imported: json['imported'] as int? ?? 0,
      skipped: json['skipped'] as int? ?? 0,
      duplicates: json['duplicates'] as int? ?? 0,
      errors: json['errors'] as int? ?? 0,
      errorDetails: errorDetails,
    );
  }

  /// Serialize to JSON.
  Map<String, dynamic> toJson() {
    return {
      'imported': imported,
      'skipped': skipped,
      'duplicates': duplicates,
      'errors': errors,
      'errorDetails': errorDetails,
    };
  }
}
