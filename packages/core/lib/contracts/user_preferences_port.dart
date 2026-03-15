import 'package:flutter/foundation.dart';

/// Port for user onboarding preferences (identity, goals, channels, content).
///
/// Implementations: Drift adapter (local), API adapter (remote sync).
abstract class UserPreferencesPort {
  /// Get the current user preferences.
  Future<UserPreferences> getPreferences();

  /// Save the selected identity (Student, Professional, etc.).
  Future<void> saveIdentity(String identity);

  /// Save selected goal strings.
  Future<void> saveGoals(List<String> goals);

  /// Save channel preference toggles.
  Future<void> saveChannelPrefs(Map<String, bool> prefs);

  /// Save content category selections and delivery time.
  Future<void> saveContentCategories(
    List<String> categories,
    String deliverAt,
  );

  /// Save notification permission status.
  Future<void> saveNotificationPermission(String status);
}

/// Immutable snapshot of user onboarding preferences.
class UserPreferences {
  final String? identity;
  final List<String> goals;
  final Map<String, bool> channelPrefs;
  final List<String> contentCategories;
  final String contentDeliverAt;
  final String notificationPermission;

  const UserPreferences({
    this.identity,
    this.goals = const [],
    this.channelPrefs = const {},
    this.contentCategories = const [],
    this.contentDeliverAt = '07:00',
    this.notificationPermission = 'not_asked',
  });

  UserPreferences copyWith({
    String? identity,
    List<String>? goals,
    Map<String, bool>? channelPrefs,
    List<String>? contentCategories,
    String? contentDeliverAt,
    String? notificationPermission,
  }) {
    return UserPreferences(
      identity: identity ?? this.identity,
      goals: goals ?? this.goals,
      channelPrefs: channelPrefs ?? this.channelPrefs,
      contentCategories: contentCategories ?? this.contentCategories,
      contentDeliverAt: contentDeliverAt ?? this.contentDeliverAt,
      notificationPermission:
          notificationPermission ?? this.notificationPermission,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserPreferences &&
          identity == other.identity &&
          listEquals(goals, other.goals) &&
          mapEquals(channelPrefs, other.channelPrefs) &&
          listEquals(contentCategories, other.contentCategories) &&
          contentDeliverAt == other.contentDeliverAt &&
          notificationPermission == other.notificationPermission;

  @override
  int get hashCode => Object.hash(
        identity,
        Object.hashAll(goals),
        Object.hashAll(channelPrefs.entries),
        Object.hashAll(contentCategories),
        contentDeliverAt,
        notificationPermission,
      );
}
