import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/task_comment.dart';
import '../providers/comment_providers.dart';

/// Collapsible comment section for the task detail page.
///
/// Loads comments asynchronously and independently from the task itself,
/// so it never blocks the detail page from rendering.
class CommentSection extends ConsumerStatefulWidget {
  const CommentSection({
    super.key,
    required this.taskId,
  });

  final String taskId;

  @override
  ConsumerState<CommentSection> createState() => _CommentSectionState();
}

class _CommentSectionState extends ConsumerState<CommentSection> {
  bool _isExpanded = false;
  final _inputController = TextEditingController();
  final _inputFocusNode = FocusNode();
  bool _isSending = false;

  // Editing state
  String? _editingCommentId;
  final _editController = TextEditingController();

  @override
  void dispose() {
    _inputController.dispose();
    _inputFocusNode.dispose();
    _editController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final commentsAsync = ref.watch(commentsProvider(widget.taskId));

    final commentCount = commentsAsync.whenOrNull(
          data: (page) => page.total,
        ) ??
        0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header (tap to expand)
        InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() => _isExpanded = !_isExpanded);
          },
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(
                  Icons.chat_bubble_outline_rounded,
                  size: 18,
                  color: colorScheme.onSurfaceVariant,
                ),
                const SizedBox(width: 8),
                Text(
                  'Comments',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: 8),
                if (commentCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$commentCount',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.primary,
                      ),
                    ),
                  ),
                const Spacer(),
                AnimatedRotation(
                  turns: _isExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    Icons.expand_more,
                    size: 20,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Expanded content
        AnimatedCrossFade(
          firstChild: const SizedBox.shrink(),
          secondChild: _buildExpandedContent(commentsAsync),
          crossFadeState: _isExpanded
              ? CrossFadeState.showSecond
              : CrossFadeState.showFirst,
          duration: const Duration(milliseconds: 200),
        ),
      ],
    );
  }

  Widget _buildExpandedContent(AsyncValue<CommentsPage> commentsAsync) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Comment input
        _buildCommentInput(),
        const SizedBox(height: 12),

        // Comment list
        commentsAsync.when(
          data: (page) => page.items.isEmpty
              ? _buildEmptyState()
              : _buildCommentList(page.items),
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: UnjynxShimmerBox(height: 60, borderRadius: 12)),
          ),
          error: (e, _) => _buildErrorState(),
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Comment input
  // ---------------------------------------------------------------------------

  Widget _buildCommentInput() {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: isLight
            ? colorScheme.surfaceContainerLow
            : colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        boxShadow: isLight ? UnjynxShadows.lightSm : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: _inputController,
              focusNode: _inputFocusNode,
              maxLines: 4,
              minLines: 1,
              textCapitalization: TextCapitalization.sentences,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface,
              ),
              decoration: InputDecoration(
                hintText: 'Add a comment...',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 4, bottom: 4),
            child: _isSending
                ? const Padding(
                    padding: EdgeInsets.all(10),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    icon: Icon(
                      Icons.send_rounded,
                      color: ux.gold,
                      size: 20,
                    ),
                    onPressed: _submitComment,
                    tooltip: 'Send comment',
                  ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Comment list
  // ---------------------------------------------------------------------------

  Widget _buildCommentList(List<TaskComment> comments) {
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(commentsProvider(widget.taskId));
      },
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: comments.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final comment = comments[index];
          if (_editingCommentId == comment.id) {
            return _buildEditingTile(comment);
          }
          return _CommentTile(
            comment: comment,
            onEdit: () => _startEditing(comment),
            onDelete: () => _deleteComment(comment),
          );
        },
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Empty + error states
  // ---------------------------------------------------------------------------

  Widget _buildEmptyState() {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Column(
          children: [
            Icon(
              Icons.chat_bubble_outline_rounded,
              size: 32,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
            ),
            const SizedBox(height: 8),
            Text(
              'No comments yet. Start the conversation.',
              style: TextStyle(
                fontSize: 13,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 28, color: colorScheme.error),
            const SizedBox(height: 8),
            Text(
              'Failed to load comments',
              style: TextStyle(fontSize: 13, color: colorScheme.error),
            ),
            const SizedBox(height: 4),
            TextButton(
              onPressed: () =>
                  ref.invalidate(commentsProvider(widget.taskId)),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Inline edit tile
  // ---------------------------------------------------------------------------

  Widget _buildEditingTile(TaskComment comment) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: colorScheme.primary.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: colorScheme.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _editController,
            autofocus: true,
            maxLines: 4,
            minLines: 1,
            style: TextStyle(fontSize: 14, color: colorScheme.onSurface),
            decoration: const InputDecoration(
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: _cancelEditing,
                child: Text(
                  'Cancel',
                  style: TextStyle(color: colorScheme.onSurfaceVariant),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: ux.gold,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                ),
                onPressed: () => _saveEdit(comment),
                child: const Text('Save'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  Future<void> _submitComment() async {
    final content = _inputController.text.trim();
    if (content.isEmpty) return;

    HapticFeedback.mediumImpact();
    setState(() => _isSending = true);

    final notifier = ref.read(commentActionsProvider(widget.taskId).notifier);
    final result = await notifier.createComment(content);

    if (mounted) {
      setState(() => _isSending = false);
      if (result != null) {
        _inputController.clear();
        _inputFocusNode.unfocus();
      } else {
        _showSnackBar('Failed to post comment. Please try again.');
      }
    }
  }

  void _startEditing(TaskComment comment) {
    HapticFeedback.lightImpact();
    setState(() {
      _editingCommentId = comment.id;
      _editController.text = comment.content;
    });
  }

  void _cancelEditing() {
    setState(() {
      _editingCommentId = null;
      _editController.clear();
    });
  }

  Future<void> _saveEdit(TaskComment comment) async {
    final newContent = _editController.text.trim();
    if (newContent.isEmpty || newContent == comment.content) {
      _cancelEditing();
      return;
    }

    HapticFeedback.mediumImpact();
    final notifier = ref.read(commentActionsProvider(widget.taskId).notifier);
    final success = await notifier.updateComment(comment.id, newContent);

    if (mounted) {
      if (success) {
        _cancelEditing();
      } else {
        _showSnackBar('Failed to update comment.');
      }
    }
  }

  Future<void> _deleteComment(TaskComment comment) async {
    HapticFeedback.lightImpact();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        final cs = Theme.of(dialogContext).colorScheme;
        return AlertDialog(
          backgroundColor: cs.surface,
          title: Text(
            'Delete Comment?',
            style: TextStyle(color: cs.onSurface),
          ),
          content: Text(
            'This comment will be permanently deleted.',
            style: TextStyle(color: cs.onSurfaceVariant),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              style: TextButton.styleFrom(foregroundColor: cs.error),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !mounted) return;

    final notifier = ref.read(commentActionsProvider(widget.taskId).notifier);
    final success = await notifier.deleteComment(comment.id);

    if (mounted && !success) {
      _showSnackBar('Failed to delete comment.');
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Individual comment tile
// ---------------------------------------------------------------------------

class _CommentTile extends StatelessWidget {
  const _CommentTile({
    required this.comment,
    required this.onEdit,
    required this.onDelete,
  });

  final TaskComment comment;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onLongPress: comment.isOwn ? () => _showActionMenu(context) : null,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isLight
              ? colorScheme.surface
              : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isLight ? UnjynxShadows.lightSm : null,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            _Avatar(
              userName: comment.userName,
              avatarUrl: comment.userAvatar,
            ),
            const SizedBox(width: 10),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name + time row
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          comment.userName,
                          style: textTheme.labelMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                            color: colorScheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _formatRelativeTime(comment.createdAt),
                        style: textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      if (comment.isEdited) ...[
                        const SizedBox(width: 4),
                        Text(
                          '(edited)',
                          style: textTheme.bodySmall?.copyWith(
                            fontSize: 10,
                            fontStyle: FontStyle.italic,
                            color: colorScheme.onSurfaceVariant
                                .withValues(alpha: 0.6),
                          ),
                        ),
                      ],
                      // Three-dot menu for own comments
                      if (comment.isOwn) ...[
                        const SizedBox(width: 4),
                        SizedBox(
                          width: 24,
                          height: 24,
                          child: PopupMenuButton<String>(
                            padding: EdgeInsets.zero,
                            iconSize: 16,
                            icon: Icon(
                              Icons.more_vert,
                              size: 16,
                              color: colorScheme.onSurfaceVariant,
                            ),
                            color: colorScheme.surface,
                            onSelected: (action) {
                              switch (action) {
                                case 'edit':
                                  onEdit();
                                case 'delete':
                                  onDelete();
                              }
                            },
                            itemBuilder: (_) => [
                              const PopupMenuItem(
                                value: 'edit',
                                child: Row(
                                  children: [
                                    Icon(Icons.edit_outlined, size: 16),
                                    SizedBox(width: 8),
                                    Text('Edit'),
                                  ],
                                ),
                              ),
                              PopupMenuItem(
                                value: 'delete',
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.delete_outline,
                                      size: 16,
                                      color: colorScheme.error,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Delete',
                                      style:
                                          TextStyle(color: colorScheme.error),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),

                  // Comment body
                  Text(
                    comment.content,
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showActionMenu(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet<String>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        final isLight = context.isLightMode;
        return Container(
          decoration: BoxDecoration(
            color: isLight ? Colors.white : cs.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 8),
                Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: cs.onSurfaceVariant.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 16),
                ListTile(
                  leading: Icon(
                    Icons.edit_outlined,
                    color: cs.onSurface,
                  ),
                  title: Text('Edit', style: TextStyle(color: cs.onSurface)),
                  onTap: () {
                    Navigator.pop(context);
                    onEdit();
                  },
                ),
                ListTile(
                  leading: Icon(Icons.delete_outline, color: cs.error),
                  title: Text('Delete', style: TextStyle(color: cs.error)),
                  onTap: () {
                    Navigator.pop(context);
                    onDelete();
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );
  }

  static String _formatRelativeTime(DateTime timestamp) {
    final now = DateTime.now();
    final diff = now.difference(timestamp);

    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[timestamp.month - 1]} ${timestamp.day}';
  }
}

// ---------------------------------------------------------------------------
// Avatar widget
// ---------------------------------------------------------------------------

class _Avatar extends StatelessWidget {
  const _Avatar({
    required this.userName,
    this.avatarUrl,
  });

  final String userName;
  final String? avatarUrl;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: 16,
        backgroundImage: NetworkImage(avatarUrl!),
        backgroundColor: colorScheme.surfaceContainerHighest,
      );
    }

    // Generate a deterministic color from the name
    final initial = userName.isNotEmpty ? userName[0].toUpperCase() : '?';
    final colorIndex = userName.hashCode.abs() % _avatarColors.length;

    return CircleAvatar(
      radius: 16,
      backgroundColor: _avatarColors[colorIndex].withValues(alpha: 0.15),
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: _avatarColors[colorIndex],
        ),
      ),
    );
  }

  static const _avatarColors = [
    Color(0xFF7C4DFF), // purple
    Color(0xFFFF6D00), // orange
    Color(0xFF00BFA5), // teal
    Color(0xFFE53935), // red
    Color(0xFF1E88E5), // blue
    Color(0xFF43A047), // green
    Color(0xFFF4B400), // gold
    Color(0xFFAB47BC), // violet
  ];
}
