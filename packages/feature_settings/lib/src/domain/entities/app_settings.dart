import 'package:freezed_annotation/freezed_annotation.dart';

part 'app_settings.freezed.dart';
part 'app_settings.g.dart';

/// User preferences persisted via shared_preferences.
@freezed
abstract class AppSettings with _$AppSettings {
  const factory AppSettings({
    /// Default task priority when creating new tasks.
    @Default('none') String defaultPriority,

    /// Default project ID for new tasks (null = no project).
    String? defaultProjectId,

    /// First day of the week (1 = Monday, 7 = Sunday).
    @Default(1) int startOfWeek,

    /// Whether notifications are globally enabled.
    @Default(true) bool notificationsEnabled,

    /// Quiet hours start (hour in 24h format, null = disabled).
    int? quietHoursStart,

    /// Quiet hours end (hour in 24h format).
    int? quietHoursEnd,

    /// Default reminder offset in minutes before due date.
    @Default(15) int defaultReminderMinutes,

    /// Whether completed tasks should auto-archive after N days.
    @Default(7) int autoArchiveDays,

    /// Whether offline mode is enabled (work without internet, sync later).
    @Default(true) bool offlineMode,

    /// Whether ghost mode is enabled (hide all notifications temporarily).
    @Default(false) bool ghostModeEnabled,

    /// Whether AI smart suggestions are enabled.
    @Default(true) bool smartSuggestionsEnabled,

    /// Whether AI proactive insights are enabled.
    @Default(true) bool proactiveInsightsEnabled,

    /// Pomodoro work duration in minutes.
    @Default(25) int pomodoroWorkMinutes,

    /// Pomodoro break duration in minutes.
    @Default(5) int pomodoroBreakMinutes,

    /// Morning ritual time as "HH:mm" string.
    @Default('07:00') String morningRitualTime,

    /// Evening ritual time as "HH:mm" string.
    @Default('21:00') String eveningRitualTime,

    /// Content delivery time as "HH:mm" string.
    @Default('08:00') String contentDeliveryTime,

    /// Date format preference.
    @Default('DD/MM/YYYY') String dateFormat,

    /// Time format preference ('12-hour' or '24-hour').
    @Default('12-hour') String timeFormat,
  }) = _AppSettings;

  factory AppSettings.fromJson(Map<String, dynamic> json) =>
      _$AppSettingsFromJson(json);
}
