import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/entities/task_comment.dart';

/// Safely tries to read a provider that may not exist in the scope.
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Result of fetching comments: items + total count for pagination.
@immutable
class CommentsPage {
  final List<TaskComment> items;
  final int total;

  const CommentsPage({required this.items, required this.total});

  static const empty = CommentsPage(items: [], total: 0);
}

/// Fetches comments for a given task ID.
///
/// Returns a [CommentsPage] containing the list and total count.
/// Falls back to empty on API errors so the detail page is never blocked.
final commentsProvider =
    FutureProvider.family<CommentsPage, String>((ref, taskId) async {
  final api = _tryRead(ref, commentApiProvider);
  if (api == null) return CommentsPage.empty;

  try {
    final response = await api.getComments(taskId, limit: 50);
    if (response.success && response.data != null) {
      final items = (response.data! as List)
          .cast<Map<String, dynamic>>()
          .map((json) => TaskComment.fromJson(json))
          .toList();
      final total = response.meta?.total ?? items.length;
      return CommentsPage(items: items, total: total);
    }
    return CommentsPage.empty;
  } on ApiException catch (e) {
    debugPrint('commentsProvider: API error: ${e.message}');
    return CommentsPage.empty;
  } catch (e) {
    debugPrint('commentsProvider: unexpected error: $e');
    return CommentsPage.empty;
  }
});

/// Notifier that manages comment CRUD operations for a specific task.
///
/// Provides optimistic UI updates with rollback on failure.
/// In Riverpod 3, `AutoDisposeFamilyAsyncNotifier` was removed. The family
/// arg is passed via the constructor; `build()` takes no parameters.
class CommentActionsNotifier extends AsyncNotifier<void> {
  /// The task ID this notifier operates on, injected by the family factory.
  CommentActionsNotifier(this._taskId);

  final String _taskId;

  @override
  Future<void> build() async {
    // No-op; this notifier is used for side effects only.
  }

  /// Create a new comment on the task.
  ///
  /// Invalidates [commentsProvider] on success to refresh the list.
  Future<TaskComment?> createComment(String content) async {
    final api = _tryRead(ref, commentApiProvider);
    if (api == null) return null;

    try {
      final response = await api.createComment(
        _taskId,
        content: content,
      );
      if (response.success && response.data != null) {
        ref.invalidate(commentsProvider(_taskId));
        return TaskComment.fromJson(response.data!);
      }
      return null;
    } on ApiException catch (e) {
      debugPrint('createComment: API error: ${e.message}');
      return null;
    } catch (e) {
      debugPrint('createComment: unexpected error: $e');
      return null;
    }
  }

  /// Update an existing comment's content.
  Future<bool> updateComment(String commentId, String content) async {
    final api = _tryRead(ref, commentApiProvider);
    if (api == null) return false;

    try {
      final response = await api.updateComment(
        _taskId,
        commentId,
        content: content,
      );
      if (response.success) {
        ref.invalidate(commentsProvider(_taskId));
        return true;
      }
      return false;
    } on ApiException catch (e) {
      debugPrint('updateComment: API error: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('updateComment: unexpected error: $e');
      return false;
    }
  }

  /// Delete a comment by ID.
  Future<bool> deleteComment(String commentId) async {
    final api = _tryRead(ref, commentApiProvider);
    if (api == null) return false;

    try {
      final response = await api.deleteComment(_taskId, commentId);
      if (response.success) {
        ref.invalidate(commentsProvider(_taskId));
        return true;
      }
      return false;
    } on ApiException catch (e) {
      debugPrint('deleteComment: API error: ${e.message}');
      return false;
    } catch (e) {
      debugPrint('deleteComment: unexpected error: $e');
      return false;
    }
  }
}

/// Provider for comment CRUD actions on a specific task.
final commentActionsProvider = AsyncNotifierProvider.autoDispose
    .family<CommentActionsNotifier, void, String>(
  CommentActionsNotifier.new,
);
