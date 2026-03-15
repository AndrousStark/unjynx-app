import 'package:flutter/foundation.dart';

/// Represents a connected notification delivery channel.
///
/// Each channel has a [type] (e.g. 'push', 'telegram'), an [identifier]
/// (e.g. token, chatId, email address), and connection metadata.
/// Immutable — use [copyWith] to produce a new instance.
@immutable
class NotificationChannel {
  const NotificationChannel({
    required this.type,
    required this.identifier,
    this.isConnected = false,
    this.lastVerified,
    this.displayName,
  });

  /// Channel type identifier.
  ///
  /// One of: push, telegram, email, whatsapp, sms, instagram, slack, discord.
  final String type;

  /// Channel-specific identifier (token, chatId, email, phone, username).
  final String identifier;

  /// Whether this channel is currently connected and active.
  final bool isConnected;

  /// When this channel was last verified/tested.
  final DateTime? lastVerified;

  /// Human-readable display name (e.g. "user@email.com", "+91 98xxx").
  final String? displayName;

  /// Creates a copy with the given fields replaced.
  NotificationChannel copyWith({
    String? type,
    String? identifier,
    bool? isConnected,
    DateTime? lastVerified,
    String? displayName,
  }) {
    return NotificationChannel(
      type: type ?? this.type,
      identifier: identifier ?? this.identifier,
      isConnected: isConnected ?? this.isConnected,
      lastVerified: lastVerified ?? this.lastVerified,
      displayName: displayName ?? this.displayName,
    );
  }

  /// Serializes to a JSON-compatible map for SharedPreferences storage.
  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'identifier': identifier,
      'isConnected': isConnected,
      'lastVerified': lastVerified?.toIso8601String(),
      'displayName': displayName,
    };
  }

  /// Deserializes from a JSON-compatible map.
  factory NotificationChannel.fromJson(Map<String, dynamic> json) {
    return NotificationChannel(
      type: json['type'] as String,
      identifier: json['identifier'] as String,
      isConnected: json['isConnected'] as bool? ?? false,
      lastVerified: json['lastVerified'] != null
          ? DateTime.parse(json['lastVerified'] as String)
          : null,
      displayName: json['displayName'] as String?,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is NotificationChannel &&
          type == other.type &&
          identifier == other.identifier &&
          isConnected == other.isConnected &&
          lastVerified == other.lastVerified &&
          displayName == other.displayName;

  @override
  int get hashCode => Object.hash(
        type,
        identifier,
        isConnected,
        lastVerified,
        displayName,
      );

  @override
  String toString() =>
      'NotificationChannel(type: $type, identifier: $identifier, '
      'connected: $isConnected, displayName: $displayName)';
}

/// All supported channel types.
abstract final class ChannelTypes {
  static const String push = 'push';
  static const String telegram = 'telegram';
  static const String email = 'email';
  static const String whatsapp = 'whatsapp';
  static const String sms = 'sms';
  static const String instagram = 'instagram';
  static const String slack = 'slack';
  static const String discord = 'discord';

  /// Ordered list of all channel types.
  static const List<String> all = [
    push,
    telegram,
    email,
    whatsapp,
    sms,
    instagram,
    slack,
    discord,
  ];
}
