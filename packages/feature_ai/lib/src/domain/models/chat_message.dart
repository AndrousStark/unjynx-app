import 'package:flutter/foundation.dart';

/// A single message in an AI chat conversation.
@immutable
class ChatMessage {
  /// Unique identifier for this message.
  final String id;

  /// Either 'user' or 'assistant'.
  final String role;

  /// The text content of the message.
  final String content;

  /// When the message was created.
  final DateTime timestamp;

  /// Whether this message is still being streamed.
  final bool isStreaming;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.isStreaming = false,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      content: json['content'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      isStreaming: json['isStreaming'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'isStreaming': isStreaming,
    };
  }

  /// Create a copy with updated fields (immutable update).
  ChatMessage copyWith({
    String? id,
    String? role,
    String? content,
    DateTime? timestamp,
    bool? isStreaming,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      role: role ?? this.role,
      content: content ?? this.content,
      timestamp: timestamp ?? this.timestamp,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ChatMessage &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          role == other.role &&
          content == other.content &&
          isStreaming == other.isStreaming;

  @override
  int get hashCode => Object.hash(id, role, content, isStreaming);
}

/// The currently selected AI persona.
enum AiPersona {
  defaultPersona('default', 'UNJYNX', 'Focused & efficient'),
  drillSergeant('drill_sergeant', 'Drill Sergeant', 'Tough love'),
  therapist('therapist', 'Therapist', 'Gentle & empathetic'),
  ceo('ceo', 'CEO', 'Strategic advisor'),
  coach('coach', 'Coach', 'Encouraging trainer');

  const AiPersona(this.apiValue, this.displayName, this.subtitle);

  /// Value sent to the API.
  final String apiValue;

  /// Human-readable name.
  final String displayName;

  /// Short description of the persona style.
  final String subtitle;
}
