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
  }) = _AppSettings;

  factory AppSettings.fromJson(Map<String, dynamic> json) =>
      _$AppSettingsFromJson(json);
}
