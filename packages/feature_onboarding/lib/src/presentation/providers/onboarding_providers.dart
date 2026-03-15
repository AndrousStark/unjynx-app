import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;

import '../../data/onboarding_repository.dart';

/// Repository provider — must be overridden in ProviderScope.
final onboardingRepositoryProvider = Provider<OnboardingRepository>(
  (ref) => throw StateError(
    'onboardingRepositoryProvider must be overridden. '
    'Call overrideOnboardingRepository() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideOnboardingRepository(OnboardingRepository repository) {
  return onboardingRepositoryProvider.overrideWithValue(repository);
}

/// Whether onboarding has been completed.
final isOnboardingCompleteProvider = Provider<bool>((ref) {
  final repo = ref.watch(onboardingRepositoryProvider);
  return repo.isComplete;
});

/// Notifier to complete onboarding (triggers rebuild).
final completeOnboardingProvider = Provider<Future<void> Function()>((ref) {
  final repo = ref.read(onboardingRepositoryProvider);
  return () async {
    await repo.markComplete();
    ref.invalidateSelf();
    ref.invalidate(isOnboardingCompleteProvider);
  };
});
