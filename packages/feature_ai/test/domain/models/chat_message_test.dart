import 'package:feature_ai/feature_ai.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ChatMessage', () {
    test('creates with required fields', () {
      final msg = ChatMessage(
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: DateTime(2026, 3, 22),
      );

      expect(msg.id, '1');
      expect(msg.role, 'user');
      expect(msg.content, 'Hello');
      expect(msg.isStreaming, false);
    });

    test('copyWith creates a new instance with updated fields', () {
      final original = ChatMessage(
        id: '1',
        role: 'assistant',
        content: 'Initial',
        timestamp: DateTime(2026, 3, 22),
        isStreaming: true,
      );

      final updated = original.copyWith(
        content: 'Updated',
        isStreaming: false,
      );

      expect(updated.content, 'Updated');
      expect(updated.isStreaming, false);
      expect(updated.id, original.id);
      expect(updated.role, original.role);

      // Immutability: original is unchanged
      expect(original.content, 'Initial');
      expect(original.isStreaming, true);
    });

    test('equality compares by id, role, content, and isStreaming', () {
      final a = ChatMessage(
        id: '1',
        role: 'user',
        content: 'Hi',
        timestamp: DateTime(2026, 3, 22),
      );

      final b = ChatMessage(
        id: '1',
        role: 'user',
        content: 'Hi',
        timestamp: DateTime(2026, 3, 23), // different timestamp
      );

      expect(a, equals(b));
    });

    test('different content means not equal', () {
      final a = ChatMessage(
        id: '1',
        role: 'user',
        content: 'Hi',
        timestamp: DateTime(2026, 3, 22),
      );

      final b = ChatMessage(
        id: '1',
        role: 'user',
        content: 'Bye',
        timestamp: DateTime(2026, 3, 22),
      );

      expect(a, isNot(equals(b)));
    });
  });

  group('AiPersona', () {
    test('has 5 values', () {
      expect(AiPersona.values.length, 5);
    });

    test('defaultPersona has correct apiValue', () {
      expect(AiPersona.defaultPersona.apiValue, 'default');
    });

    test('drill_sergeant has correct display name', () {
      expect(AiPersona.drillSergeant.displayName, 'Drill Sergeant');
      expect(AiPersona.drillSergeant.apiValue, 'drill_sergeant');
    });

    test('all personas have non-empty names and subtitles', () {
      for (final persona in AiPersona.values) {
        expect(persona.displayName, isNotEmpty);
        expect(persona.subtitle, isNotEmpty);
        expect(persona.apiValue, isNotEmpty);
      }
    });
  });
}
