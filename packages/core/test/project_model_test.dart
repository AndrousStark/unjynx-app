import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/models/project.dart';

void main() {
  final now = DateTime(2026, 3, 6);

  group('Project model', () {
    test('creates with required fields', () {
      final project = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Work',
        createdAt: now,
        updatedAt: now,
      );

      expect(project.id, 'p1');
      expect(project.name, 'Work');
      expect(project.color, '#6C5CE7');
      expect(project.icon, 'folder');
      expect(project.isArchived, isFalse);
      expect(project.sortOrder, 0);
      expect(project.description, isNull);
    });

    test('creates with all fields', () {
      final project = Project(
        id: 'p2',
        userId: 'u1',
        name: 'Personal',
        description: 'My stuff',
        color: '#FF0000',
        icon: 'star',
        isArchived: true,
        sortOrder: 5,
        createdAt: now,
        updatedAt: now,
      );

      expect(project.description, 'My stuff');
      expect(project.color, '#FF0000');
      expect(project.icon, 'star');
      expect(project.isArchived, isTrue);
      expect(project.sortOrder, 5);
    });

    test('copyWith creates new immutable instance', () {
      final original = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Work',
        createdAt: now,
        updatedAt: now,
      );

      final modified = original.copyWith(name: 'Personal', color: '#00FF00');

      expect(original.name, 'Work');
      expect(original.color, '#6C5CE7');
      expect(modified.name, 'Personal');
      expect(modified.color, '#00FF00');
      expect(modified.id, original.id);
    });

    test('equality by value', () {
      final a = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Work',
        createdAt: now,
        updatedAt: now,
      );
      final b = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Work',
        createdAt: now,
        updatedAt: now,
      );

      expect(a, equals(b));
      expect(a.hashCode, b.hashCode);
    });

    test('inequality on different fields', () {
      final a = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Work',
        createdAt: now,
        updatedAt: now,
      );
      final b = a.copyWith(name: 'Personal');

      expect(a, isNot(equals(b)));
    });

    test('fromJson/toJson roundtrip', () {
      final project = Project(
        id: 'p1',
        userId: 'u1',
        name: 'Test',
        description: 'Desc',
        color: '#ABCDEF',
        icon: 'book',
        isArchived: true,
        sortOrder: 3,
        createdAt: now,
        updatedAt: now,
      );

      final json = project.toJson();
      final restored = Project.fromJson(json);

      expect(restored, equals(project));
    });
  });
}
