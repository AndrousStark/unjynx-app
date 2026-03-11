import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:feature_import_export/feature_import_export.dart';

void main() {
  group('ImportPreview model', () {
    test('creates preview with defaults', () {
      const preview = ImportPreview(
        totalRows: 50,
        source: ImportSource.todoist,
      );
      expect(preview.totalRows, 50);
      expect(preview.source, ImportSource.todoist);
      expect(preview.sampleTasks, isEmpty);
      expect(preview.columnMapping, isEmpty);
    });

    test('copyWith updates fields immutably', () {
      const preview = ImportPreview(
        totalRows: 10,
        source: ImportSource.genericCsv,
      );
      final updated = preview.copyWith(totalRows: 20);
      expect(updated.totalRows, 20);
      expect(updated.source, ImportSource.genericCsv);
      expect(identical(preview, updated), isFalse);
    });
  });

  group('ImportSource enum', () {
    test('has correct display names', () {
      expect(ImportSource.todoist.displayName, 'Todoist');
      expect(ImportSource.tickTick.displayName, 'TickTick');
      expect(ImportSource.appleReminders.displayName, 'Apple Reminders');
      expect(ImportSource.googleTasks.displayName, 'Google Tasks');
      expect(ImportSource.genericCsv.displayName, 'Generic CSV');
    });

    test('has 5 sources', () {
      expect(ImportSource.values.length, 5);
    });
  });

  group('ExportFormat enum', () {
    test('has correct display names', () {
      expect(ExportFormat.csv.displayName, 'CSV');
      expect(ExportFormat.json.displayName, 'JSON (GDPR)');
      expect(ExportFormat.ics.displayName, 'ICS (Calendar)');
    });

    test('has 3 formats', () {
      expect(ExportFormat.values.length, 3);
    });
  });

  group('ImportResult model', () {
    test('calculates total correctly', () {
      const result = ImportResult(
        imported: 45,
        skipped: 3,
        duplicates: 2,
        errors: 0,
      );
      expect(result.total, 50);
    });

    test('handles all zeros', () {
      const result = ImportResult(
        imported: 0,
        skipped: 0,
        duplicates: 0,
        errors: 0,
      );
      expect(result.total, 0);
    });
  });

  group('ImportTargetFields', () {
    test('contains required fields', () {
      expect(ImportTargetFields.all, contains('title'));
      expect(ImportTargetFields.all, contains('description'));
      expect(ImportTargetFields.all, contains('dueDate'));
      expect(ImportTargetFields.all, contains('priority'));
      expect(ImportTargetFields.all, contains('project'));
      expect(ImportTargetFields.all, contains('(skip)'));
    });

    test('has 8 fields', () {
      expect(ImportTargetFields.all.length, 8);
    });
  });

  group('ImportFlowNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('starts at selectSource step', () {
      final step = container.read(importFlowProvider);
      expect(step, ImportStep.selectSource);
    });

    test('selectSource advances to upload', () {
      container
          .read(importFlowProvider.notifier)
          .selectSource(ImportSource.todoist);
      expect(container.read(importFlowProvider), ImportStep.upload);
      expect(container.read(importSourceProvider), ImportSource.todoist);
    });

    test('reset returns to selectSource', () {
      container
          .read(importFlowProvider.notifier)
          .selectSource(ImportSource.todoist);
      container.read(importFlowProvider.notifier).reset();
      expect(container.read(importFlowProvider), ImportStep.selectSource);
      expect(container.read(importSourceProvider), isNull);
    });
  });
}
