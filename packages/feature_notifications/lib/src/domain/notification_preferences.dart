import 'package:flutter/material.dart';

/// Immutable notification delivery preferences.
///
/// Controls escalation chain order, delays, quiet hours, and urgency override.
/// Use [copyWith] to produce a modified copy.
@immutable
class NotificationPreferences {
  const NotificationPreferences({
    this.notificationsEnabled = true,
    this.primaryChannel = 'push',
    this.fallbackChain = const ['push', 'telegram', 'email', 'whatsapp', 'sms'],
    this.escalationDelays = const {
      'push': 0,
      'telegram': 5,
      'email': 15,
      'whatsapp': 30,
      'sms': 60,
    },
    this.quietStart,
    this.quietEnd,
    this.quietDays = const [],
    this.overrideForUrgent = true,
    this.timezone = 'UTC',
  });

  /// Whether all notifications are enabled globally.
  final bool notificationsEnabled;

  /// The primary (first-attempt) channel type.
  final String primaryChannel;

  /// Ordered list of fallback channel types for escalation.
  final List<String> fallbackChain;

  /// Delay in minutes before escalating to each channel.
  /// Keyed by channel type.
  final Map<String, int> escalationDelays;

  /// Quiet hours start time (do-not-disturb window start).
  final TimeOfDay? quietStart;

  /// Quiet hours end time (do-not-disturb window end).
  final TimeOfDay? quietEnd;

  /// Days of the week when quiet hours are active.
  /// 1 = Monday, 7 = Sunday.
  final List<int> quietDays;

  /// Whether urgent notifications bypass quiet hours.
  final bool overrideForUrgent;

  /// User's timezone identifier.
  final String timezone;

  /// Creates a copy with the given fields replaced.
  NotificationPreferences copyWith({
    bool? notificationsEnabled,
    String? primaryChannel,
    List<String>? fallbackChain,
    Map<String, int>? escalationDelays,
    TimeOfDay? quietStart,
    TimeOfDay? quietEnd,
    List<int>? quietDays,
    bool? overrideForUrgent,
    String? timezone,
    bool clearQuietStart = false,
    bool clearQuietEnd = false,
  }) {
    return NotificationPreferences(
      notificationsEnabled:
          notificationsEnabled ?? this.notificationsEnabled,
      primaryChannel: primaryChannel ?? this.primaryChannel,
      fallbackChain: fallbackChain ?? this.fallbackChain,
      escalationDelays: escalationDelays ?? this.escalationDelays,
      quietStart: clearQuietStart ? null : (quietStart ?? this.quietStart),
      quietEnd: clearQuietEnd ? null : (quietEnd ?? this.quietEnd),
      quietDays: quietDays ?? this.quietDays,
      overrideForUrgent: overrideForUrgent ?? this.overrideForUrgent,
      timezone: timezone ?? this.timezone,
    );
  }

  /// Serializes to a JSON-compatible map for SharedPreferences storage.
  Map<String, dynamic> toJson() {
    return {
      'notificationsEnabled': notificationsEnabled,
      'primaryChannel': primaryChannel,
      'fallbackChain': fallbackChain,
      'escalationDelays':
          escalationDelays.map((k, v) => MapEntry(k, v)),
      'quietStartHour': quietStart?.hour,
      'quietStartMinute': quietStart?.minute,
      'quietEndHour': quietEnd?.hour,
      'quietEndMinute': quietEnd?.minute,
      'quietDays': quietDays,
      'overrideForUrgent': overrideForUrgent,
      'timezone': timezone,
    };
  }

  /// Deserializes from a JSON-compatible map.
  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    final quietStartHour = json['quietStartHour'] as int?;
    final quietStartMinute = json['quietStartMinute'] as int?;
    final quietEndHour = json['quietEndHour'] as int?;
    final quietEndMinute = json['quietEndMinute'] as int?;

    return NotificationPreferences(
      notificationsEnabled:
          json['notificationsEnabled'] as bool? ?? true,
      primaryChannel: json['primaryChannel'] as String? ?? 'push',
      fallbackChain: (json['fallbackChain'] as List<dynamic>?)
              ?.cast<String>() ??
          const ['push', 'telegram', 'email', 'whatsapp', 'sms'],
      escalationDelays: (json['escalationDelays'] as Map<String, dynamic>?)
              ?.map((k, v) => MapEntry(k, v as int)) ??
          const {
            'push': 0,
            'telegram': 5,
            'email': 15,
            'whatsapp': 30,
            'sms': 60,
          },
      quietStart: quietStartHour != null && quietStartMinute != null
          ? TimeOfDay(hour: quietStartHour, minute: quietStartMinute)
          : null,
      quietEnd: quietEndHour != null && quietEndMinute != null
          ? TimeOfDay(hour: quietEndHour, minute: quietEndMinute)
          : null,
      quietDays:
          (json['quietDays'] as List<dynamic>?)?.cast<int>() ?? const [],
      overrideForUrgent: json['overrideForUrgent'] as bool? ?? true,
      timezone: json['timezone'] as String? ?? 'UTC',
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationPreferences &&
          notificationsEnabled == other.notificationsEnabled &&
          primaryChannel == other.primaryChannel &&
          _listEquals(fallbackChain, other.fallbackChain) &&
          _mapEquals(escalationDelays, other.escalationDelays) &&
          quietStart == other.quietStart &&
          quietEnd == other.quietEnd &&
          _listEquals(quietDays, other.quietDays) &&
          overrideForUrgent == other.overrideForUrgent &&
          timezone == other.timezone;

  @override
  int get hashCode {
    // Hash map entries by key-value pairs (MapEntry doesn't override hashCode).
    final delayHash = Object.hashAll(
      escalationDelays.entries.map((e) => Object.hash(e.key, e.value)),
    );
    return Object.hash(
      notificationsEnabled,
      primaryChannel,
      Object.hashAll(fallbackChain),
      delayHash,
      quietStart,
      quietEnd,
      Object.hashAll(quietDays),
      overrideForUrgent,
      timezone,
    );
  }

  @override
  String toString() =>
      'NotificationPreferences(enabled: $notificationsEnabled, '
      'primary: $primaryChannel, '
      'chain: ${fallbackChain.length} channels, '
      'quiet: $quietStart-$quietEnd, '
      'urgent override: $overrideForUrgent)';
}

bool _listEquals<T>(List<T> a, List<T> b) {
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; i++) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

bool _mapEquals<K, V>(Map<K, V> a, Map<K, V> b) {
  if (a.length != b.length) return false;
  for (final entry in a.entries) {
    if (b[entry.key] != entry.value) return false;
  }
  return true;
}
