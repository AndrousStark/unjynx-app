import 'package:flutter/foundation.dart';

/// A subtask belonging to a parent TODO.
@immutable
class Subtask {
  const Subtask({
    required this.id,
    required this.todoId,
    required this.title,
    this.isCompleted = false,
    required this.sortOrder,
    required this.createdAt,
  });

  final String id;
  final String todoId;
  final String title;
  final bool isCompleted;
  final int sortOrder;
  final DateTime createdAt;

  Subtask copyWith({
    String? id,
    String? todoId,
    String? title,
    bool? isCompleted,
    int? sortOrder,
    DateTime? createdAt,
  }) {
    return Subtask(
      id: id ?? this.id,
      todoId: todoId ?? this.todoId,
      title: title ?? this.title,
      isCompleted: isCompleted ?? this.isCompleted,
      sortOrder: sortOrder ?? this.sortOrder,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Subtask &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          todoId == other.todoId &&
          title == other.title &&
          isCompleted == other.isCompleted &&
          sortOrder == other.sortOrder &&
          createdAt == other.createdAt;

  @override
  int get hashCode =>
      Object.hash(id, todoId, title, isCompleted, sortOrder, createdAt);

  @override
  String toString() =>
      'Subtask(id: $id, title: "$title", completed: $isCompleted)';
}
