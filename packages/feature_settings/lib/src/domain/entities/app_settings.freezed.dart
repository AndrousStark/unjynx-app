// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'app_settings.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$AppSettings {

/// Default task priority when creating new tasks.
 String get defaultPriority;/// Default project ID for new tasks (null = no project).
 String? get defaultProjectId;/// First day of the week (1 = Monday, 7 = Sunday).
 int get startOfWeek;/// Whether notifications are globally enabled.
 bool get notificationsEnabled;/// Quiet hours start (hour in 24h format, null = disabled).
 int? get quietHoursStart;/// Quiet hours end (hour in 24h format).
 int? get quietHoursEnd;/// Default reminder offset in minutes before due date.
 int get defaultReminderMinutes;/// Whether completed tasks should auto-archive after N days.
 int get autoArchiveDays;/// Whether offline mode is enabled.
 bool get offlineMode;/// Whether ghost mode is enabled.
 bool get ghostModeEnabled;/// Whether AI smart suggestions are enabled.
 bool get smartSuggestionsEnabled;/// Whether AI proactive insights are enabled.
 bool get proactiveInsightsEnabled;/// Pomodoro work duration in minutes.
 int get pomodoroWorkMinutes;/// Pomodoro break duration in minutes.
 int get pomodoroBreakMinutes;/// Morning ritual time as "HH:mm" string.
 String get morningRitualTime;/// Evening ritual time as "HH:mm" string.
 String get eveningRitualTime;/// Content delivery time as "HH:mm" string.
 String get contentDeliveryTime;/// Date format preference.
 String get dateFormat;/// Time format preference.
 String get timeFormat;
/// Create a copy of AppSettings
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AppSettingsCopyWith<AppSettings> get copyWith => _$AppSettingsCopyWithImpl<AppSettings>(this as AppSettings, _$identity);

  /// Serializes this AppSettings to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is AppSettings&&(identical(other.defaultPriority, defaultPriority) || other.defaultPriority == defaultPriority)&&(identical(other.defaultProjectId, defaultProjectId) || other.defaultProjectId == defaultProjectId)&&(identical(other.startOfWeek, startOfWeek) || other.startOfWeek == startOfWeek)&&(identical(other.notificationsEnabled, notificationsEnabled) || other.notificationsEnabled == notificationsEnabled)&&(identical(other.quietHoursStart, quietHoursStart) || other.quietHoursStart == quietHoursStart)&&(identical(other.quietHoursEnd, quietHoursEnd) || other.quietHoursEnd == quietHoursEnd)&&(identical(other.defaultReminderMinutes, defaultReminderMinutes) || other.defaultReminderMinutes == defaultReminderMinutes)&&(identical(other.autoArchiveDays, autoArchiveDays) || other.autoArchiveDays == autoArchiveDays)&&(identical(other.offlineMode, offlineMode) || other.offlineMode == offlineMode)&&(identical(other.ghostModeEnabled, ghostModeEnabled) || other.ghostModeEnabled == ghostModeEnabled)&&(identical(other.smartSuggestionsEnabled, smartSuggestionsEnabled) || other.smartSuggestionsEnabled == smartSuggestionsEnabled)&&(identical(other.proactiveInsightsEnabled, proactiveInsightsEnabled) || other.proactiveInsightsEnabled == proactiveInsightsEnabled)&&(identical(other.pomodoroWorkMinutes, pomodoroWorkMinutes) || other.pomodoroWorkMinutes == pomodoroWorkMinutes)&&(identical(other.pomodoroBreakMinutes, pomodoroBreakMinutes) || other.pomodoroBreakMinutes == pomodoroBreakMinutes)&&(identical(other.morningRitualTime, morningRitualTime) || other.morningRitualTime == morningRitualTime)&&(identical(other.eveningRitualTime, eveningRitualTime) || other.eveningRitualTime == eveningRitualTime)&&(identical(other.contentDeliveryTime, contentDeliveryTime) || other.contentDeliveryTime == contentDeliveryTime)&&(identical(other.dateFormat, dateFormat) || other.dateFormat == dateFormat)&&(identical(other.timeFormat, timeFormat) || other.timeFormat == timeFormat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,defaultPriority,defaultProjectId,startOfWeek,notificationsEnabled,quietHoursStart,quietHoursEnd,defaultReminderMinutes,autoArchiveDays,offlineMode,ghostModeEnabled,smartSuggestionsEnabled,proactiveInsightsEnabled,pomodoroWorkMinutes,pomodoroBreakMinutes,morningRitualTime,eveningRitualTime,contentDeliveryTime,dateFormat,timeFormat);

@override
String toString() {
  return 'AppSettings(defaultPriority: $defaultPriority, defaultProjectId: $defaultProjectId, startOfWeek: $startOfWeek, notificationsEnabled: $notificationsEnabled, quietHoursStart: $quietHoursStart, quietHoursEnd: $quietHoursEnd, defaultReminderMinutes: $defaultReminderMinutes, autoArchiveDays: $autoArchiveDays, offlineMode: $offlineMode, ghostModeEnabled: $ghostModeEnabled, smartSuggestionsEnabled: $smartSuggestionsEnabled, proactiveInsightsEnabled: $proactiveInsightsEnabled, pomodoroWorkMinutes: $pomodoroWorkMinutes, pomodoroBreakMinutes: $pomodoroBreakMinutes, morningRitualTime: $morningRitualTime, eveningRitualTime: $eveningRitualTime, contentDeliveryTime: $contentDeliveryTime, dateFormat: $dateFormat, timeFormat: $timeFormat)';
}


}

/// @nodoc
abstract mixin class $AppSettingsCopyWith<$Res>  {
  factory $AppSettingsCopyWith(AppSettings value, $Res Function(AppSettings) _then) = _$AppSettingsCopyWithImpl;
@useResult
$Res call({
 String defaultPriority, String? defaultProjectId, int startOfWeek, bool notificationsEnabled, int? quietHoursStart, int? quietHoursEnd, int defaultReminderMinutes, int autoArchiveDays, bool offlineMode, bool ghostModeEnabled, bool smartSuggestionsEnabled, bool proactiveInsightsEnabled, int pomodoroWorkMinutes, int pomodoroBreakMinutes, String morningRitualTime, String eveningRitualTime, String contentDeliveryTime, String dateFormat, String timeFormat
});




}
/// @nodoc
class _$AppSettingsCopyWithImpl<$Res>
    implements $AppSettingsCopyWith<$Res> {
  _$AppSettingsCopyWithImpl(this._self, this._then);

  final AppSettings _self;
  final $Res Function(AppSettings) _then;

/// Create a copy of AppSettings
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? defaultPriority = null,Object? defaultProjectId = freezed,Object? startOfWeek = null,Object? notificationsEnabled = null,Object? quietHoursStart = freezed,Object? quietHoursEnd = freezed,Object? defaultReminderMinutes = null,Object? autoArchiveDays = null,Object? offlineMode = null,Object? ghostModeEnabled = null,Object? smartSuggestionsEnabled = null,Object? proactiveInsightsEnabled = null,Object? pomodoroWorkMinutes = null,Object? pomodoroBreakMinutes = null,Object? morningRitualTime = null,Object? eveningRitualTime = null,Object? contentDeliveryTime = null,Object? dateFormat = null,Object? timeFormat = null,}) {
  return _then(_self.copyWith(
defaultPriority: null == defaultPriority ? _self.defaultPriority : defaultPriority // ignore: cast_nullable_to_non_nullable
as String,defaultProjectId: freezed == defaultProjectId ? _self.defaultProjectId : defaultProjectId // ignore: cast_nullable_to_non_nullable
as String?,startOfWeek: null == startOfWeek ? _self.startOfWeek : startOfWeek // ignore: cast_nullable_to_non_nullable
as int,notificationsEnabled: null == notificationsEnabled ? _self.notificationsEnabled : notificationsEnabled // ignore: cast_nullable_to_non_nullable
as bool,quietHoursStart: freezed == quietHoursStart ? _self.quietHoursStart : quietHoursStart // ignore: cast_nullable_to_non_nullable
as int?,quietHoursEnd: freezed == quietHoursEnd ? _self.quietHoursEnd : quietHoursEnd // ignore: cast_nullable_to_non_nullable
as int?,defaultReminderMinutes: null == defaultReminderMinutes ? _self.defaultReminderMinutes : defaultReminderMinutes // ignore: cast_nullable_to_non_nullable
as int,autoArchiveDays: null == autoArchiveDays ? _self.autoArchiveDays : autoArchiveDays // ignore: cast_nullable_to_non_nullable
as int,offlineMode: null == offlineMode ? _self.offlineMode : offlineMode // ignore: cast_nullable_to_non_nullable
as bool,ghostModeEnabled: null == ghostModeEnabled ? _self.ghostModeEnabled : ghostModeEnabled // ignore: cast_nullable_to_non_nullable
as bool,smartSuggestionsEnabled: null == smartSuggestionsEnabled ? _self.smartSuggestionsEnabled : smartSuggestionsEnabled // ignore: cast_nullable_to_non_nullable
as bool,proactiveInsightsEnabled: null == proactiveInsightsEnabled ? _self.proactiveInsightsEnabled : proactiveInsightsEnabled // ignore: cast_nullable_to_non_nullable
as bool,pomodoroWorkMinutes: null == pomodoroWorkMinutes ? _self.pomodoroWorkMinutes : pomodoroWorkMinutes // ignore: cast_nullable_to_non_nullable
as int,pomodoroBreakMinutes: null == pomodoroBreakMinutes ? _self.pomodoroBreakMinutes : pomodoroBreakMinutes // ignore: cast_nullable_to_non_nullable
as int,morningRitualTime: null == morningRitualTime ? _self.morningRitualTime : morningRitualTime // ignore: cast_nullable_to_non_nullable
as String,eveningRitualTime: null == eveningRitualTime ? _self.eveningRitualTime : eveningRitualTime // ignore: cast_nullable_to_non_nullable
as String,contentDeliveryTime: null == contentDeliveryTime ? _self.contentDeliveryTime : contentDeliveryTime // ignore: cast_nullable_to_non_nullable
as String,dateFormat: null == dateFormat ? _self.dateFormat : dateFormat // ignore: cast_nullable_to_non_nullable
as String,timeFormat: null == timeFormat ? _self.timeFormat : timeFormat // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [AppSettings].
extension AppSettingsPatterns on AppSettings {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _AppSettings value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _AppSettings() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _AppSettings value)  $default,){
final _that = this;
switch (_that) {
case _AppSettings():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _AppSettings value)?  $default,){
final _that = this;
switch (_that) {
case _AppSettings() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String defaultPriority,  String? defaultProjectId,  int startOfWeek,  bool notificationsEnabled,  int? quietHoursStart,  int? quietHoursEnd,  int defaultReminderMinutes,  int autoArchiveDays,  bool offlineMode,  bool ghostModeEnabled,  bool smartSuggestionsEnabled,  bool proactiveInsightsEnabled,  int pomodoroWorkMinutes,  int pomodoroBreakMinutes,  String morningRitualTime,  String eveningRitualTime,  String contentDeliveryTime,  String dateFormat,  String timeFormat)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _AppSettings() when $default != null:
return $default(_that.defaultPriority,_that.defaultProjectId,_that.startOfWeek,_that.notificationsEnabled,_that.quietHoursStart,_that.quietHoursEnd,_that.defaultReminderMinutes,_that.autoArchiveDays,_that.offlineMode,_that.ghostModeEnabled,_that.smartSuggestionsEnabled,_that.proactiveInsightsEnabled,_that.pomodoroWorkMinutes,_that.pomodoroBreakMinutes,_that.morningRitualTime,_that.eveningRitualTime,_that.contentDeliveryTime,_that.dateFormat,_that.timeFormat);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String defaultPriority,  String? defaultProjectId,  int startOfWeek,  bool notificationsEnabled,  int? quietHoursStart,  int? quietHoursEnd,  int defaultReminderMinutes,  int autoArchiveDays,  bool offlineMode,  bool ghostModeEnabled,  bool smartSuggestionsEnabled,  bool proactiveInsightsEnabled,  int pomodoroWorkMinutes,  int pomodoroBreakMinutes,  String morningRitualTime,  String eveningRitualTime,  String contentDeliveryTime,  String dateFormat,  String timeFormat)  $default,) {final _that = this;
switch (_that) {
case _AppSettings():
return $default(_that.defaultPriority,_that.defaultProjectId,_that.startOfWeek,_that.notificationsEnabled,_that.quietHoursStart,_that.quietHoursEnd,_that.defaultReminderMinutes,_that.autoArchiveDays,_that.offlineMode,_that.ghostModeEnabled,_that.smartSuggestionsEnabled,_that.proactiveInsightsEnabled,_that.pomodoroWorkMinutes,_that.pomodoroBreakMinutes,_that.morningRitualTime,_that.eveningRitualTime,_that.contentDeliveryTime,_that.dateFormat,_that.timeFormat);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String defaultPriority,  String? defaultProjectId,  int startOfWeek,  bool notificationsEnabled,  int? quietHoursStart,  int? quietHoursEnd,  int defaultReminderMinutes,  int autoArchiveDays,  bool offlineMode,  bool ghostModeEnabled,  bool smartSuggestionsEnabled,  bool proactiveInsightsEnabled,  int pomodoroWorkMinutes,  int pomodoroBreakMinutes,  String morningRitualTime,  String eveningRitualTime,  String contentDeliveryTime,  String dateFormat,  String timeFormat)?  $default,) {final _that = this;
switch (_that) {
case _AppSettings() when $default != null:
return $default(_that.defaultPriority,_that.defaultProjectId,_that.startOfWeek,_that.notificationsEnabled,_that.quietHoursStart,_that.quietHoursEnd,_that.defaultReminderMinutes,_that.autoArchiveDays,_that.offlineMode,_that.ghostModeEnabled,_that.smartSuggestionsEnabled,_that.proactiveInsightsEnabled,_that.pomodoroWorkMinutes,_that.pomodoroBreakMinutes,_that.morningRitualTime,_that.eveningRitualTime,_that.contentDeliveryTime,_that.dateFormat,_that.timeFormat);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _AppSettings implements AppSettings {
  const _AppSettings({this.defaultPriority = 'none', this.defaultProjectId, this.startOfWeek = 1, this.notificationsEnabled = true, this.quietHoursStart, this.quietHoursEnd, this.defaultReminderMinutes = 15, this.autoArchiveDays = 7, this.offlineMode = true, this.ghostModeEnabled = false, this.smartSuggestionsEnabled = true, this.proactiveInsightsEnabled = true, this.pomodoroWorkMinutes = 25, this.pomodoroBreakMinutes = 5, this.morningRitualTime = '07:00', this.eveningRitualTime = '21:00', this.contentDeliveryTime = '08:00', this.dateFormat = 'DD/MM/YYYY', this.timeFormat = '12-hour'});
  factory _AppSettings.fromJson(Map<String, dynamic> json) => _$AppSettingsFromJson(json);

/// Default task priority when creating new tasks.
@override@JsonKey() final  String defaultPriority;
/// Default project ID for new tasks (null = no project).
@override final  String? defaultProjectId;
/// First day of the week (1 = Monday, 7 = Sunday).
@override@JsonKey() final  int startOfWeek;
/// Whether notifications are globally enabled.
@override@JsonKey() final  bool notificationsEnabled;
/// Quiet hours start (hour in 24h format, null = disabled).
@override final  int? quietHoursStart;
/// Quiet hours end (hour in 24h format).
@override final  int? quietHoursEnd;
/// Default reminder offset in minutes before due date.
@override@JsonKey() final  int defaultReminderMinutes;
/// Whether completed tasks should auto-archive after N days.
@override@JsonKey() final  int autoArchiveDays;
/// Whether offline mode is enabled.
@override@JsonKey() final  bool offlineMode;
/// Whether ghost mode is enabled.
@override@JsonKey() final  bool ghostModeEnabled;
/// Whether AI smart suggestions are enabled.
@override@JsonKey() final  bool smartSuggestionsEnabled;
/// Whether AI proactive insights are enabled.
@override@JsonKey() final  bool proactiveInsightsEnabled;
/// Pomodoro work duration in minutes.
@override@JsonKey() final  int pomodoroWorkMinutes;
/// Pomodoro break duration in minutes.
@override@JsonKey() final  int pomodoroBreakMinutes;
/// Morning ritual time as "HH:mm" string.
@override@JsonKey() final  String morningRitualTime;
/// Evening ritual time as "HH:mm" string.
@override@JsonKey() final  String eveningRitualTime;
/// Content delivery time as "HH:mm" string.
@override@JsonKey() final  String contentDeliveryTime;
/// Date format preference.
@override@JsonKey() final  String dateFormat;
/// Time format preference.
@override@JsonKey() final  String timeFormat;

/// Create a copy of AppSettings
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AppSettingsCopyWith<_AppSettings> get copyWith => __$AppSettingsCopyWithImpl<_AppSettings>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AppSettingsToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _AppSettings&&(identical(other.defaultPriority, defaultPriority) || other.defaultPriority == defaultPriority)&&(identical(other.defaultProjectId, defaultProjectId) || other.defaultProjectId == defaultProjectId)&&(identical(other.startOfWeek, startOfWeek) || other.startOfWeek == startOfWeek)&&(identical(other.notificationsEnabled, notificationsEnabled) || other.notificationsEnabled == notificationsEnabled)&&(identical(other.quietHoursStart, quietHoursStart) || other.quietHoursStart == quietHoursStart)&&(identical(other.quietHoursEnd, quietHoursEnd) || other.quietHoursEnd == quietHoursEnd)&&(identical(other.defaultReminderMinutes, defaultReminderMinutes) || other.defaultReminderMinutes == defaultReminderMinutes)&&(identical(other.autoArchiveDays, autoArchiveDays) || other.autoArchiveDays == autoArchiveDays)&&(identical(other.offlineMode, offlineMode) || other.offlineMode == offlineMode)&&(identical(other.ghostModeEnabled, ghostModeEnabled) || other.ghostModeEnabled == ghostModeEnabled)&&(identical(other.smartSuggestionsEnabled, smartSuggestionsEnabled) || other.smartSuggestionsEnabled == smartSuggestionsEnabled)&&(identical(other.proactiveInsightsEnabled, proactiveInsightsEnabled) || other.proactiveInsightsEnabled == proactiveInsightsEnabled)&&(identical(other.pomodoroWorkMinutes, pomodoroWorkMinutes) || other.pomodoroWorkMinutes == pomodoroWorkMinutes)&&(identical(other.pomodoroBreakMinutes, pomodoroBreakMinutes) || other.pomodoroBreakMinutes == pomodoroBreakMinutes)&&(identical(other.morningRitualTime, morningRitualTime) || other.morningRitualTime == morningRitualTime)&&(identical(other.eveningRitualTime, eveningRitualTime) || other.eveningRitualTime == eveningRitualTime)&&(identical(other.contentDeliveryTime, contentDeliveryTime) || other.contentDeliveryTime == contentDeliveryTime)&&(identical(other.dateFormat, dateFormat) || other.dateFormat == dateFormat)&&(identical(other.timeFormat, timeFormat) || other.timeFormat == timeFormat));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,defaultPriority,defaultProjectId,startOfWeek,notificationsEnabled,quietHoursStart,quietHoursEnd,defaultReminderMinutes,autoArchiveDays,offlineMode,ghostModeEnabled,smartSuggestionsEnabled,proactiveInsightsEnabled,pomodoroWorkMinutes,pomodoroBreakMinutes,morningRitualTime,eveningRitualTime,contentDeliveryTime,dateFormat,timeFormat);

@override
String toString() {
  return 'AppSettings(defaultPriority: $defaultPriority, defaultProjectId: $defaultProjectId, startOfWeek: $startOfWeek, notificationsEnabled: $notificationsEnabled, quietHoursStart: $quietHoursStart, quietHoursEnd: $quietHoursEnd, defaultReminderMinutes: $defaultReminderMinutes, autoArchiveDays: $autoArchiveDays, offlineMode: $offlineMode, ghostModeEnabled: $ghostModeEnabled, smartSuggestionsEnabled: $smartSuggestionsEnabled, proactiveInsightsEnabled: $proactiveInsightsEnabled, pomodoroWorkMinutes: $pomodoroWorkMinutes, pomodoroBreakMinutes: $pomodoroBreakMinutes, morningRitualTime: $morningRitualTime, eveningRitualTime: $eveningRitualTime, contentDeliveryTime: $contentDeliveryTime, dateFormat: $dateFormat, timeFormat: $timeFormat)';
}


}

/// @nodoc
abstract mixin class _$AppSettingsCopyWith<$Res> implements $AppSettingsCopyWith<$Res> {
  factory _$AppSettingsCopyWith(_AppSettings value, $Res Function(_AppSettings) _then) = __$AppSettingsCopyWithImpl;
@override @useResult
$Res call({
 String defaultPriority, String? defaultProjectId, int startOfWeek, bool notificationsEnabled, int? quietHoursStart, int? quietHoursEnd, int defaultReminderMinutes, int autoArchiveDays, bool offlineMode, bool ghostModeEnabled, bool smartSuggestionsEnabled, bool proactiveInsightsEnabled, int pomodoroWorkMinutes, int pomodoroBreakMinutes, String morningRitualTime, String eveningRitualTime, String contentDeliveryTime, String dateFormat, String timeFormat
});




}
/// @nodoc
class __$AppSettingsCopyWithImpl<$Res>
    implements _$AppSettingsCopyWith<$Res> {
  __$AppSettingsCopyWithImpl(this._self, this._then);

  final _AppSettings _self;
  final $Res Function(_AppSettings) _then;

/// Create a copy of AppSettings
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? defaultPriority = null,Object? defaultProjectId = freezed,Object? startOfWeek = null,Object? notificationsEnabled = null,Object? quietHoursStart = freezed,Object? quietHoursEnd = freezed,Object? defaultReminderMinutes = null,Object? autoArchiveDays = null,Object? offlineMode = null,Object? ghostModeEnabled = null,Object? smartSuggestionsEnabled = null,Object? proactiveInsightsEnabled = null,Object? pomodoroWorkMinutes = null,Object? pomodoroBreakMinutes = null,Object? morningRitualTime = null,Object? eveningRitualTime = null,Object? contentDeliveryTime = null,Object? dateFormat = null,Object? timeFormat = null,}) {
  return _then(_AppSettings(
defaultPriority: null == defaultPriority ? _self.defaultPriority : defaultPriority // ignore: cast_nullable_to_non_nullable
as String,defaultProjectId: freezed == defaultProjectId ? _self.defaultProjectId : defaultProjectId // ignore: cast_nullable_to_non_nullable
as String?,startOfWeek: null == startOfWeek ? _self.startOfWeek : startOfWeek // ignore: cast_nullable_to_non_nullable
as int,notificationsEnabled: null == notificationsEnabled ? _self.notificationsEnabled : notificationsEnabled // ignore: cast_nullable_to_non_nullable
as bool,quietHoursStart: freezed == quietHoursStart ? _self.quietHoursStart : quietHoursStart // ignore: cast_nullable_to_non_nullable
as int?,quietHoursEnd: freezed == quietHoursEnd ? _self.quietHoursEnd : quietHoursEnd // ignore: cast_nullable_to_non_nullable
as int?,defaultReminderMinutes: null == defaultReminderMinutes ? _self.defaultReminderMinutes : defaultReminderMinutes // ignore: cast_nullable_to_non_nullable
as int,autoArchiveDays: null == autoArchiveDays ? _self.autoArchiveDays : autoArchiveDays // ignore: cast_nullable_to_non_nullable
as int,offlineMode: null == offlineMode ? _self.offlineMode : offlineMode // ignore: cast_nullable_to_non_nullable
as bool,ghostModeEnabled: null == ghostModeEnabled ? _self.ghostModeEnabled : ghostModeEnabled // ignore: cast_nullable_to_non_nullable
as bool,smartSuggestionsEnabled: null == smartSuggestionsEnabled ? _self.smartSuggestionsEnabled : smartSuggestionsEnabled // ignore: cast_nullable_to_non_nullable
as bool,proactiveInsightsEnabled: null == proactiveInsightsEnabled ? _self.proactiveInsightsEnabled : proactiveInsightsEnabled // ignore: cast_nullable_to_non_nullable
as bool,pomodoroWorkMinutes: null == pomodoroWorkMinutes ? _self.pomodoroWorkMinutes : pomodoroWorkMinutes // ignore: cast_nullable_to_non_nullable
as int,pomodoroBreakMinutes: null == pomodoroBreakMinutes ? _self.pomodoroBreakMinutes : pomodoroBreakMinutes // ignore: cast_nullable_to_non_nullable
as int,morningRitualTime: null == morningRitualTime ? _self.morningRitualTime : morningRitualTime // ignore: cast_nullable_to_non_nullable
as String,eveningRitualTime: null == eveningRitualTime ? _self.eveningRitualTime : eveningRitualTime // ignore: cast_nullable_to_non_nullable
as String,contentDeliveryTime: null == contentDeliveryTime ? _self.contentDeliveryTime : contentDeliveryTime // ignore: cast_nullable_to_non_nullable
as String,dateFormat: null == dateFormat ? _self.dateFormat : dateFormat // ignore: cast_nullable_to_non_nullable
as String,timeFormat: null == timeFormat ? _self.timeFormat : timeFormat // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
