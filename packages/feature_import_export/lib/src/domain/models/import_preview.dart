/// Preview of an import operation before execution.
class ImportPreview {
  const ImportPreview({
    required this.totalRows,
    required this.source,
    this.sampleTasks = const [],
    this.columnMapping = const {},
    this.validRows = 0,
    this.errorRows = 0,
    this.warnings = const [],
  });

  final int totalRows;
  final ImportSource source;
  final List<Map<String, String>> sampleTasks;

  /// Maps source column names to UNJYNX field names.
  final Map<String, String> columnMapping;

  /// Number of rows that passed server-side validation.
  final int validRows;

  /// Number of rows that failed server-side validation.
  final int errorRows;

  /// Validation warnings from the server.
  final List<String> warnings;

  /// Parse from API response JSON.
  factory ImportPreview.fromJson(Map<String, dynamic> json) {
    final source = ImportSource.values.firstWhere(
      (s) => s.name == json['source'],
      orElse: () => ImportSource.genericCsv,
    );
    final sampleTasks = (json['sampleTasks'] as List<dynamic>?)
            ?.map((row) => (row as Map<String, dynamic>)
                .map((k, v) => MapEntry(k, v.toString())))
            .toList() ??
        const [];
    final columnMapping =
        (json['columnMapping'] as Map<String, dynamic>?)
                ?.map((k, v) => MapEntry(k, v.toString())) ??
            const {};
    final warnings = (json['warnings'] as List<dynamic>?)
            ?.map((w) => w.toString())
            .toList() ??
        const [];

    return ImportPreview(
      totalRows: json['totalRows'] as int? ?? 0,
      source: source,
      sampleTasks: sampleTasks,
      columnMapping: columnMapping,
      validRows: json['validRows'] as int? ?? 0,
      errorRows: json['errorRows'] as int? ?? 0,
      warnings: warnings,
    );
  }

  /// Serialize to JSON for API requests.
  Map<String, dynamic> toJson() {
    return {
      'totalRows': totalRows,
      'source': source.name,
      'sampleTasks': sampleTasks,
      'columnMapping': columnMapping,
      'validRows': validRows,
      'errorRows': errorRows,
      'warnings': warnings,
    };
  }

  ImportPreview copyWith({
    int? totalRows,
    ImportSource? source,
    List<Map<String, String>>? sampleTasks,
    Map<String, String>? columnMapping,
    int? validRows,
    int? errorRows,
    List<String>? warnings,
  }) {
    return ImportPreview(
      totalRows: totalRows ?? this.totalRows,
      source: source ?? this.source,
      sampleTasks: sampleTasks ?? this.sampleTasks,
      columnMapping: columnMapping ?? this.columnMapping,
      validRows: validRows ?? this.validRows,
      errorRows: errorRows ?? this.errorRows,
      warnings: warnings ?? this.warnings,
    );
  }
}

/// Supported import sources.
enum ImportSource {
  todoist('Todoist', 'Import from Todoist CSV export'),
  tickTick('TickTick', 'Import from TickTick backup'),
  appleReminders('Apple Reminders', 'Import via ICS export'),
  googleTasks('Google Tasks', 'Import from Google Takeout'),
  genericCsv('Generic CSV', 'Import from any CSV file');

  const ImportSource(this.displayName, this.description);

  final String displayName;
  final String description;
}

/// Target fields that source columns can map to.
abstract final class ImportTargetFields {
  static const title = 'title';
  static const description = 'description';
  static const dueDate = 'dueDate';
  static const priority = 'priority';
  static const project = 'project';
  static const tags = 'tags';
  static const status = 'status';
  static const skip = '(skip)';

  static const all = [
    title,
    description,
    dueDate,
    priority,
    project,
    tags,
    status,
    skip,
  ];
}
