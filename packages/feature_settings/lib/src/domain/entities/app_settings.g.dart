// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_settings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_AppSettings _$AppSettingsFromJson(Map<String, dynamic> json) => _AppSettings(
  defaultPriority: json['defaultPriority'] as String? ?? 'none',
  defaultProjectId: json['defaultProjectId'] as String?,
  startOfWeek: (json['startOfWeek'] as num?)?.toInt() ?? 1,
  notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
  quietHoursStart: (json['quietHoursStart'] as num?)?.toInt(),
  quietHoursEnd: (json['quietHoursEnd'] as num?)?.toInt(),
  defaultReminderMinutes:
      (json['defaultReminderMinutes'] as num?)?.toInt() ?? 15,
  autoArchiveDays: (json['autoArchiveDays'] as num?)?.toInt() ?? 7,
  offlineMode: json['offlineMode'] as bool? ?? true,
  ghostModeEnabled: json['ghostModeEnabled'] as bool? ?? false,
  smartSuggestionsEnabled:
      json['smartSuggestionsEnabled'] as bool? ?? true,
  proactiveInsightsEnabled:
      json['proactiveInsightsEnabled'] as bool? ?? true,
  pomodoroWorkMinutes:
      (json['pomodoroWorkMinutes'] as num?)?.toInt() ?? 25,
  pomodoroBreakMinutes:
      (json['pomodoroBreakMinutes'] as num?)?.toInt() ?? 5,
  morningRitualTime: json['morningRitualTime'] as String? ?? '07:00',
  eveningRitualTime: json['eveningRitualTime'] as String? ?? '21:00',
  contentDeliveryTime:
      json['contentDeliveryTime'] as String? ?? '08:00',
  dateFormat: json['dateFormat'] as String? ?? 'DD/MM/YYYY',
  timeFormat: json['timeFormat'] as String? ?? '12-hour',
);

Map<String, dynamic> _$AppSettingsToJson(_AppSettings instance) =>
    <String, dynamic>{
      'defaultPriority': instance.defaultPriority,
      'defaultProjectId': instance.defaultProjectId,
      'startOfWeek': instance.startOfWeek,
      'notificationsEnabled': instance.notificationsEnabled,
      'quietHoursStart': instance.quietHoursStart,
      'quietHoursEnd': instance.quietHoursEnd,
      'defaultReminderMinutes': instance.defaultReminderMinutes,
      'autoArchiveDays': instance.autoArchiveDays,
      'offlineMode': instance.offlineMode,
      'ghostModeEnabled': instance.ghostModeEnabled,
      'smartSuggestionsEnabled': instance.smartSuggestionsEnabled,
      'proactiveInsightsEnabled': instance.proactiveInsightsEnabled,
      'pomodoroWorkMinutes': instance.pomodoroWorkMinutes,
      'pomodoroBreakMinutes': instance.pomodoroBreakMinutes,
      'morningRitualTime': instance.morningRitualTime,
      'eveningRitualTime': instance.eveningRitualTime,
      'contentDeliveryTime': instance.contentDeliveryTime,
      'dateFormat': instance.dateFormat,
      'timeFormat': instance.timeFormat,
    };
