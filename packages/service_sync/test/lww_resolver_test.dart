import 'package:flutter_test/flutter_test.dart';
import 'package:service_sync/service_sync.dart';

void main() {
  const resolver = LwwResolver();

  final t1 = DateTime(2026, 3, 6, 10, 0);
  final t2 = DateTime(2026, 3, 6, 11, 0);
  final t3 = DateTime(2026, 3, 6, 12, 0);

  SyncRecord makeRecord({
    String id = 'r1',
    Map<String, Object?>? fields,
    Map<String, DateTime>? timestamps,
    DateTime? updatedAt,
    bool isDeleted = false,
    bool needsSync = false,
  }) {
    final f = fields ?? {'title': 'Test', 'status': 'pending'};
    final ts = timestamps ??
        {for (final key in f.keys) key: updatedAt ?? t1};
    return SyncRecord(
      id: id,
      entityType: 'task',
      fields: f,
      fieldTimestamps: ts,
      updatedAt: updatedAt ?? t1,
      createdAt: t1,
      isDeleted: isDeleted,
      needsSync: needsSync,
    );
  }

  group('LwwResolver', () {
    test('no conflict when records are identical', () {
      final local = makeRecord();
      final remote = makeRecord();

      final result = resolver.merge(local, remote);

      expect(result.outcome, MergeOutcome.noConflict);
      expect(result.conflictedFields, isEmpty);
      expect(result.record.fields['title'], 'Test');
    });

    test('remote field wins when it has later timestamp', () {
      final local = makeRecord(
        fields: {'title': 'Local Title', 'status': 'pending'},
        timestamps: {'title': t1, 'status': t1},
        updatedAt: t1,
      );
      final remote = makeRecord(
        fields: {'title': 'Remote Title', 'status': 'pending'},
        timestamps: {'title': t2, 'status': t1},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.fields['title'], 'Remote Title');
      expect(result.record.fields['status'], 'pending');
      expect(result.conflictedFields, contains('title'));
    });

    test('local field wins when it has later timestamp', () {
      final local = makeRecord(
        fields: {'title': 'Local Title', 'status': 'completed'},
        timestamps: {'title': t1, 'status': t3},
        updatedAt: t3,
      );
      final remote = makeRecord(
        fields: {'title': 'Remote Title', 'status': 'pending'},
        timestamps: {'title': t2, 'status': t1},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.fields['title'], 'Remote Title');
      expect(result.record.fields['status'], 'completed');
    });

    test('field-level merge picks best from each side', () {
      final local = makeRecord(
        fields: {'title': 'Local', 'status': 'completed', 'priority': 'high'},
        timestamps: {'title': t1, 'status': t3, 'priority': t1},
        updatedAt: t3,
      );
      final remote = makeRecord(
        fields: {
          'title': 'Remote',
          'status': 'pending',
          'priority': 'urgent',
        },
        timestamps: {'title': t2, 'status': t1, 'priority': t2},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      // title: remote wins (t2 > t1)
      expect(result.record.fields['title'], 'Remote');
      // status: local wins (t3 > t1)
      expect(result.record.fields['status'], 'completed');
      // priority: remote wins (t2 > t1)
      expect(result.record.fields['priority'], 'urgent');
      expect(result.outcome, MergeOutcome.merged);
    });

    test('same timestamp ties go to remote (server authority)', () {
      final local = makeRecord(
        fields: {'title': 'Local'},
        timestamps: {'title': t2},
        updatedAt: t2,
      );
      final remote = makeRecord(
        fields: {'title': 'Remote'},
        timestamps: {'title': t2},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.fields['title'], 'Remote');
    });

    test('new local field is preserved', () {
      final local = makeRecord(
        fields: {'title': 'Test', 'localOnly': 'value'},
        timestamps: {'title': t1, 'localOnly': t2},
        updatedAt: t2,
      );
      final remote = makeRecord(
        fields: {'title': 'Test'},
        timestamps: {'title': t1},
        updatedAt: t1,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.fields['localOnly'], 'value');
    });

    test('new remote field is preserved', () {
      final local = makeRecord(
        fields: {'title': 'Test'},
        timestamps: {'title': t1},
        updatedAt: t1,
      );
      final remote = makeRecord(
        fields: {'title': 'Test', 'remoteOnly': 42},
        timestamps: {'title': t1, 'remoteOnly': t2},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.fields['remoteOnly'], 42);
    });

    test('remote delete wins over local changes', () {
      final local = makeRecord(
        fields: {'title': 'Updated'},
        timestamps: {'title': t2},
        updatedAt: t2,
      );
      final remote = makeRecord(isDeleted: true, updatedAt: t3);

      final result = resolver.merge(local, remote);

      expect(result.outcome, MergeOutcome.remoteWins);
      expect(result.record.isDeleted, isTrue);
    });

    test('local delete pending push is preserved', () {
      final local = makeRecord(isDeleted: true, updatedAt: t2, needsSync: true);
      final remote = makeRecord(
        fields: {'title': 'Updated'},
        timestamps: {'title': t1},
        updatedAt: t1,
      );

      final result = resolver.merge(local, remote);

      expect(result.outcome, MergeOutcome.localWins);
      expect(result.record.isDeleted, isTrue);
    });

    test('both deleted picks later timestamp', () {
      final local = makeRecord(isDeleted: true, updatedAt: t2);
      final remote = makeRecord(isDeleted: true, updatedAt: t3);

      final result = resolver.merge(local, remote);

      expect(result.outcome, MergeOutcome.merged);
      expect(result.record.isDeleted, isTrue);
      expect(result.record.updatedAt, t3);
    });

    test('merged record updatedAt is max of all field timestamps', () {
      final local = makeRecord(
        fields: {'a': 1, 'b': 2},
        timestamps: {'a': t1, 'b': t3},
        updatedAt: t3,
      );
      final remote = makeRecord(
        fields: {'a': 10, 'b': 20},
        timestamps: {'a': t2, 'b': t1},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      // a: remote wins (t2 > t1), b: local wins (t3 > t1)
      // max timestamp is t3
      expect(result.record.updatedAt, t3);
    });

    test('needsSync is true when local field wins a conflict', () {
      final local = makeRecord(
        fields: {'title': 'Local'},
        timestamps: {'title': t3},
        updatedAt: t3,
      );
      final remote = makeRecord(
        fields: {'title': 'Remote'},
        timestamps: {'title': t1},
        updatedAt: t1,
      );

      final result = resolver.merge(local, remote);

      // Local field won, so we still need to push
      expect(result.record.needsSync, isTrue);
    });

    test('needsSync is false when all remote fields win', () {
      final local = makeRecord(
        fields: {'title': 'Local'},
        timestamps: {'title': t1},
        updatedAt: t1,
      );
      final remote = makeRecord(
        fields: {'title': 'Remote'},
        timestamps: {'title': t2},
        updatedAt: t2,
      );

      final result = resolver.merge(local, remote);

      expect(result.record.needsSync, isFalse);
    });
  });
}
