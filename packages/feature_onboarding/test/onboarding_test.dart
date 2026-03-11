import 'package:feature_onboarding/src/data/onboarding_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  group('OnboardingRepository', () {
    late OnboardingRepository repository;

    setUp(() async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      repository = OnboardingRepository(prefs);
    });

    test('isComplete returns false by default', () {
      expect(repository.isComplete, isFalse);
    });

    test('markComplete sets isComplete to true', () async {
      await repository.markComplete();
      expect(repository.isComplete, isTrue);
    });

    test('reset clears completion state', () async {
      await repository.markComplete();
      expect(repository.isComplete, isTrue);

      await repository.reset();
      expect(repository.isComplete, isFalse);
    });
  });
}
