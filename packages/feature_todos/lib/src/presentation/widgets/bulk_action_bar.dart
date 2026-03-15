import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/entities/todo.dart';

/// Bottom bar that slides up when tasks are selected in bulk mode.
///
/// Actions: complete all, delete all, change priority, clear selection.
class BulkActionBar extends StatelessWidget {
  const BulkActionBar({
    super.key,
    required this.selectedCount,
    required this.onCompleteAll,
    required this.onDeleteAll,
    required this.onChangePriority,
    required this.onClearSelection,
  });

  final int selectedCount;
  final VoidCallback onCompleteAll;
  final VoidCallback onDeleteAll;
  final ValueChanged<TodoPriority> onChangePriority;
  final VoidCallback onClearSelection;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return AnimatedSlide(
      duration: const Duration(milliseconds: 250),
      curve: Curves.easeOutCubic,
      offset: selectedCount > 0 ? Offset.zero : const Offset(0, 1),
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: selectedCount > 0 ? 1.0 : 0.0,
        child: Container(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 12,
            bottom: MediaQuery.of(context).padding.bottom + 12,
          ),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            border: Border(
              top: BorderSide(
                color: colorScheme.surfaceContainerHigh,
                width: 1,
              ),
            ),
            boxShadow: context.unjynxShadow(UnjynxElevation.lg),
          ),
          child: Row(
            children: [
              // Selection count + clear
              GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  onClearSelection();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: colorScheme.primary
                        .withValues(alpha: context.isLightMode ? 0.10 : 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$selectedCount',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Icon(
                        Icons.close,
                        size: 16,
                        color: colorScheme.primary,
                      ),
                    ],
                  ),
                ),
              ),

              const Spacer(),

              // Complete all
              _BulkActionButton(
                icon: Icons.check_circle_outline,
                label: 'Done',
                color: ux.success,
                onTap: () {
                  HapticFeedback.mediumImpact();
                  _confirmComplete(context);
                },
              ),
              const SizedBox(width: 8),

              // Change priority
              _BulkActionButton(
                icon: Icons.flag_outlined,
                label: 'Priority',
                color: ux.warning,
                onTap: () {
                  HapticFeedback.mediumImpact();
                  _showPriorityPicker(context);
                },
              ),
              const SizedBox(width: 8),

              // Delete all
              _BulkActionButton(
                icon: Icons.delete_outline,
                label: 'Delete',
                color: colorScheme.error,
                onTap: () {
                  HapticFeedback.mediumImpact();
                  _confirmDelete(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showPriorityPicker(BuildContext context) {
    showModalBottomSheet<TodoPriority>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        return Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Set priority for $selectedCount tasks',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: cs.onSurface,
                    ),
                  ),
                ),
                for (final p
                    in TodoPriority.values.where((p) => p != TodoPriority.none))
                  ListTile(
                    leading: Icon(Icons.flag, color: unjynxPriorityColor(context, p.name)),
                    title: Text(
                      '${p.name[0].toUpperCase()}${p.name.substring(1)}',
                      style: TextStyle(color: cs.onSurface),
                    ),
                    onTap: () {
                      HapticFeedback.selectionClick();
                      Navigator.of(context).pop(p);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    ).then((selected) {
      if (selected != null) onChangePriority(selected);
    });
  }

  void _confirmComplete(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        final ux = context.unjynx;
        return AlertDialog(
          backgroundColor: cs.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'Complete tasks?',
            style: TextStyle(color: cs.onSurface),
          ),
          content: Text(
            'Are you sure you want to mark $selectedCount tasks as completed?',
            style: TextStyle(color: cs.onSurfaceVariant),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Cancel',
                style: TextStyle(color: cs.onSurfaceVariant),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                'Complete',
                style: TextStyle(color: ux.success),
              ),
            ),
          ],
        );
      },
    ).then((confirmed) {
      if (confirmed == true) {
        HapticFeedback.heavyImpact();
        onCompleteAll();
      }
    });
  }

  void _confirmDelete(BuildContext context) {
    showDialog<bool>(
      context: context,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        return AlertDialog(
          backgroundColor: cs.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            'Delete tasks?',
            style: TextStyle(color: cs.onSurface),
          ),
          content: Text(
            'Are you sure you want to delete $selectedCount tasks? '
            'This action cannot be undone.',
            style: TextStyle(color: cs.onSurfaceVariant),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(
                'Cancel',
                style: TextStyle(color: cs.onSurfaceVariant),
              ),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(
                'Delete',
                style: TextStyle(color: cs.error),
              ),
            ),
          ],
        );
      },
    ).then((confirmed) {
      if (confirmed == true) {
        HapticFeedback.heavyImpact();
        onDeleteAll();
      }
    });
  }

}

class _BulkActionButton extends StatelessWidget {
  const _BulkActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isLight ? 0.10 : 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: color.withValues(alpha: isLight ? 0.25 : 0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
