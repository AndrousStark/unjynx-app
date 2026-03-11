import 'package:flutter_test/flutter_test.dart';
import 'package:service_sync/service_sync.dart';

void main() {
  final t1 = DateTime(2026, 3, 6, 10, 0);
  final t2 = DateTime(2026, 3, 6, 11, 0);

  group('SyncRecord', () {
    test('withUpdatedFields creates new record with updated values', () {
      final record = SyncRecord(
        id: 'r1',
        entityType: 'task',
        fields: {'title': 'Old', 'status': 'pending'},
        fieldTimestamps: {'title': t1, 'status': t1},
        updatedAt: t1,
        createdAt: t1,
        needsSync: false,
      );

      final updated = record.withUpdatedFields({'title': 'New'}, t2);

      expect(updated.fields['title'], 'New');
      expect(updated.fields['status'], 'pending'); // untouched
      expect(updated.fieldTimestamps['title'], t2);
      expect(updated.fieldTimestamps['status'], t1); // untouched
      expect(updated.updatedAt, t2);
      expect(updated.needsSync, isTrue);

      // Original unchanged (immutability)
      expect(record.fields['title'], 'Old');
      expect(record.needsSync, isFalse);
    });

    test('markSynced sets needsSync to false', () {
      final record = SyncRecord(
        id: 'r1',
        entityType: 'task',
        fields: const {'title': 'Test'},
        fieldTimestamps: {'title': t1},
        updatedAt: t1,
        createdAt: t1,
        needsSync: true,
      );

      final synced = record.markSynced();

      expect(synced.needsSync, isFalse);
      expect(record.needsSync, isTrue); // original unchanged
    });

    test('markDeleted sets isDeleted and needsSync', () {
      final record = SyncRecord(
        id: 'r1',
        entityType: 'task',
        fields: const {'title': 'Test'},
        fieldTimestamps: {'title': t1},
        updatedAt: t1,
        createdAt: t1,
        needsSync: false,
      );

      final deleted = record.markDeleted(t2);

      expect(deleted.isDeleted, isTrue);
      expect(deleted.needsSync, isTrue);
      expect(deleted.updatedAt, t2);
      expect(record.isDeleted, isFalse); // original unchanged
    });

    test('withUpdatedFields adds new fields', () {
      final record = SyncRecord(
        id: 'r1',
        entityType: 'task',
        fields: const {'title': 'Test'},
        fieldTimestamps: {'title': t1},
        updatedAt: t1,
        createdAt: t1,
      );

      final updated = record.withUpdatedFields({'description': 'New'}, t2);

      expect(updated.fields['description'], 'New');
      expect(updated.fieldTimestamps['description'], t2);
      expect(updated.fields['title'], 'Test'); // preserved
    });
  });
}
