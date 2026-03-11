import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/personalization_state.dart';

/// Port provider — must be overridden in ProviderScope.
final userPreferencesPortProvider = Provider<UserPreferencesPort>(
  (ref) => throw StateError(
    'userPreferencesPortProvider must be overridden. '
    'Call overrideUserPreferencesPort() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideUserPreferencesPort(UserPreferencesPort port) {
  return userPreferencesPortProvider.overrideWithValue(port);
}

/// Central state for the personalization flow.
final personalizationStateProvider =
    StateNotifierProvider<PersonalizationNotifier, PersonalizationState>(
  (ref) {
    final port = ref.watch(userPreferencesPortProvider);
    return PersonalizationNotifier(port);
  },
);

/// Manages the 4-step personalization state machine.
class PersonalizationNotifier extends StateNotifier<PersonalizationState> {
  PersonalizationNotifier(this._prefsPort)
      : super(
          PersonalizationState(
            channelPrefs: _buildDefaultChannelPrefs(),
          ),
        );

  final UserPreferencesPort _prefsPort;

  static const _totalSteps = 4;

  /// Build default channel preferences from channel definitions.
  static Map<String, bool> _buildDefaultChannelPrefs() {
    return {
      for (final channel in channelDefinitions)
        channel.id: channel.defaultEnabled,
    };
  }

  // ── Identity (Step 0) ──

  /// Select a single identity. Selecting the same one deselects it.
  void selectIdentity(String identityId) {
    final newIdentity = state.identity == identityId ? null : identityId;
    state = state.copyWith(identity: newIdentity);
  }

  // ── Goals (Step 1) ──

  /// Toggle a goal on/off (multi-select).
  void toggleGoal(String goalId) {
    final updated = Set<String>.from(state.goals);
    if (updated.contains(goalId)) {
      updated.remove(goalId);
    } else {
      updated.add(goalId);
    }
    state = state.copyWith(goals: updated);
  }

  // ── Channels (Step 2) ──

  /// Set a single channel preference toggle.
  void setChannelPref(String channelId, {required bool enabled}) {
    final updated = Map<String, bool>.from(state.channelPrefs);
    updated[channelId] = enabled;
    state = state.copyWith(channelPrefs: updated);
  }

  // ── Content (Step 3) ──

  /// Toggle a content category on/off.
  ///
  /// Returns `false` if the toggle was rejected (e.g. free tier max reached).
  /// The caller can show a snackbar in that case.
  bool toggleContentCategory(String categoryId, {int maxFree = 1}) {
    final updated = List<String>.from(state.contentCategories);
    if (updated.contains(categoryId)) {
      updated.remove(categoryId);
      state = state.copyWith(contentCategories: updated);
      return true;
    }

    // Enforce free tier limit.
    if (updated.length >= maxFree) {
      return false;
    }

    updated.add(categoryId);
    state = state.copyWith(contentCategories: updated);
    return true;
  }

  /// Update the delivery time for daily content.
  void setDeliverAt(String time) {
    state = state.copyWith(contentDeliverAt: time);
  }

  // ── Navigation ──

  /// Move to the next step (clamped at max).
  void nextStep() {
    final next = state.currentStep + 1;
    if (next < _totalSteps) {
      state = state.copyWith(currentStep: next);
    }
  }

  /// Move to the previous step (clamped at 0).
  void previousStep() {
    final prev = state.currentStep - 1;
    if (prev >= 0) {
      state = state.copyWith(currentStep: prev);
    }
  }

  // ── Persistence ──

  /// Persist all preferences to the port.
  Future<void> savePreferences() async {
    final s = state;

    // Save in parallel for speed.
    await Future.wait([
      if (s.identity != null) _prefsPort.saveIdentity(s.identity!),
      if (s.goals.isNotEmpty) _prefsPort.saveGoals(s.goals.toList()),
      if (s.channelPrefs.isNotEmpty)
        _prefsPort.saveChannelPrefs(s.channelPrefs),
      _prefsPort.saveContentCategories(
        s.contentCategories,
        s.contentDeliverAt,
      ),
    ]);
  }
}
