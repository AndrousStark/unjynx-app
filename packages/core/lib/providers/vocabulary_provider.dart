import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Holds the vocabulary map from the user's active industry mode.
///
/// The map is `{ originalTerm: translatedTerm }`.
/// When empty (no mode or General mode), terms remain untranslated.
///
/// This provider should be overridden at app startup once the user's
/// active mode is fetched from `GET /modes/active`.
final vocabularyProvider = StateProvider<Map<String, String>>(
  (ref) => const <String, String>{},
);

/// Translates a UI label through the active industry mode vocabulary.
///
/// If the current mode maps [term] to a different word, that word is
/// returned. Otherwise [term] is returned unchanged.
///
/// Usage:
/// ```dart
/// final label = unjynxLabel(ref, 'Task'); // -> 'Deliverable' in Hustle mode
/// ```
String unjynxLabel(Ref ref, String term) {
  final vocab = ref.watch(vocabularyProvider);
  return vocab[term] ?? term;
}

/// Widget-friendly version that takes a [WidgetRef] instead of [Ref].
///
/// Usage in build methods:
/// ```dart
/// Text(unjynxLabelWidget(ref, 'Project')) // -> 'Client' in Hustle mode
/// ```
String unjynxLabelWidget(WidgetRef ref, String term) {
  final vocab = ref.watch(vocabularyProvider);
  return vocab[term] ?? term;
}
