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
    };
