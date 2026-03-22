import 'package:flutter/foundation.dart';

/// A comment on a task, created by a user.
@immutable
class TaskComment {
  const TaskComment({
    required this.id,
    required this.taskId,
    required this.userId,
    this.userName = 'Unknown',
    this.userAvatar,
    required this.content,
    required this.createdAt,
    required this.updatedAt,
    this.isOwn = false,
  });

  /// Unique comment ID (UUID from backend).
  final String id;

  /// The task this comment belongs to.
  final String taskId;

  /// Author's user/profile ID.
  final String userId;

  /// Display name of the author.
  final String userName;

  /// Optional avatar URL.
  final String? userAvatar;

  /// Comment body text.
  final String content;

  /// When the comment was created.
  final DateTime createdAt;

  /// When the comment was last updated.
  final DateTime updatedAt;

  /// Whether the current user authored this comment.
  final bool isOwn;

  /// Whether this comment has been edited.
  bool get isEdited => updatedAt.isAfter(
        createdAt.add(const Duration(seconds: 1)),
      );

  TaskComment copyWith({
    String? id,
    String? taskId,
    String? userId,
    String? userName,
    String? userAvatar,
    String? content,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isOwn,
  }) {
    return TaskComment(
      id: id ?? this.id,
      taskId: taskId ?? this.taskId,
      userId: userId ?? this.userId,
      userName: userName ?? this.userName,
      userAvatar: userAvatar ?? this.userAvatar,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isOwn: isOwn ?? this.isOwn,
    );
  }

  /// Parse from the backend JSON response.
  factory TaskComment.fromJson(
    Map<String, dynamic> json, {
    String? currentUserId,
  }) {
    final userId = json['userId'] as String? ?? '';
    return TaskComment(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      userId: userId,
      userName: json['userName'] as String? ?? 'Unknown',
      userAvatar: json['userAvatar'] as String?,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isOwn: currentUserId != null && userId == currentUserId,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'taskId': taskId,
        'userId': userId,
        'userName': userName,
        'userAvatar': userAvatar,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TaskComment &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'TaskComment(id: $id, userId: $userId, content: "${content.length > 30 ? '${content.substring(0, 30)}...' : content}")';
}
