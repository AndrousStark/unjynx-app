import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/utils/result.dart';

void main() {
  group('Result', () {
    test('Ok holds a value', () {
      final result = Result.ok(42);
      expect(result.isOk, isTrue);
      expect(result.isErr, isFalse);
      expect(result.unwrap(), 42);
    });

    test('Err holds a message', () {
      final result = Result<int>.err('Something failed');
      expect(result.isErr, isTrue);
      expect(result.isOk, isFalse);
      expect(() => result.unwrap(), throwsStateError);
    });

    test('unwrapOr returns default on error', () {
      final result = Result<int>.err('fail');
      expect(result.unwrapOr(0), 0);
    });

    test('map transforms Ok value', () {
      final result = Result.ok(10);
      final mapped = result.map((v) => v * 2);
      expect(mapped.unwrap(), 20);
    });

    test('map passes through Err', () {
      final result = Result<int>.err('fail');
      final mapped = result.map((v) => v * 2);
      expect(mapped.isErr, isTrue);
    });

    test('when pattern matches Ok', () {
      final result = Result.ok('hello');
      final output = result.when(
        ok: (v) => v.toUpperCase(),
        err: (m, _) => m,
      );
      expect(output, 'HELLO');
    });

    test('when pattern matches Err', () {
      final result = Result<String>.err('bad input');
      final output = result.when(
        ok: (v) => v,
        err: (m, _) => 'Error: $m',
      );
      expect(output, 'Error: bad input');
    });
  });

  group('EventBus', () {
    // EventBus tests are in event_bus_test.dart
  });
}
