import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/unjynx_extensions.dart';
import 'pressable_scale.dart';

/// Identifies which empty-state illustration and copy to render.
enum EmptyStateType {
  /// No tasks exist yet.
  noTasks,

  /// First-time user — onboarding nudge.
  newUser,

  /// Search returned zero results.
  searchEmpty,

  /// Ghost Mode complete — all tasks done.
  ghostModeDone,

  /// Device is offline.
  offline,

  /// No projects created.
  noProjects,

  /// Notification list is empty.
  noNotifications,

  /// No team members invited.
  noTeamMembers,

  /// No saved content items.
  noContent,

  /// No tasks scheduled for the selected calendar day.
  noCalendarTasks,
}

/// A branded empty-state widget with icon, title, subtitle, and optional CTA.
///
/// Each [EmptyStateType] maps to curated defaults. All text and the CTA can
/// be overridden for one-off use.
///
/// Animates in with a combined scale (0.9 -> 1.0) and fade (300ms) entrance.
///
/// ```dart
/// UnjynxEmptyState(
///   type: EmptyStateType.noTasks,
///   onAction: () => showCreateSheet(context),
/// )
/// ```
class UnjynxEmptyState extends StatefulWidget {
  const UnjynxEmptyState({
    required this.type,
    this.onAction,
    this.icon,
    this.title,
    this.subtitle,
    this.actionLabel,
    super.key,
  });

  /// The empty-state variant to render.
  final EmptyStateType type;

  /// Called when the user taps the CTA button. If null, no button is shown.
  final VoidCallback? onAction;

  /// Override the default icon.
  final IconData? icon;

  /// Override the default title text.
  final String? title;

  /// Override the default subtitle text.
  final String? subtitle;

  /// Override the default CTA button label.
  final String? actionLabel;

  @override
  State<UnjynxEmptyState> createState() => _UnjynxEmptyStateState();
}

class _UnjynxEmptyStateState extends State<UnjynxEmptyState>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;
  late final Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _scaleAnim = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  // ── Defaults per type ─────────────────────────────────────────────

  static const _defaults = <EmptyStateType, _EmptyDefaults>{
    EmptyStateType.noTasks: _EmptyDefaults(
      icon: Icons.task_alt_rounded,
      title: 'Nothing on the plate',
      subtitle: 'Go live your life! Or tap below to add a task.',
      actionLabel: 'Create Task',
    ),
    EmptyStateType.newUser: _EmptyDefaults(
      icon: Icons.bolt_rounded,
      title: 'Your first curse to break',
      subtitle: 'Is just one tap away. Start your UNJYNX journey.',
      actionLabel: 'Get Started',
    ),
    EmptyStateType.searchEmpty: _EmptyDefaults(
      icon: Icons.search_off_rounded,
      title: 'Nothing here... yet',
      subtitle: 'The curse hides things well. Try a different search.',
      actionLabel: null,
    ),
    EmptyStateType.ghostModeDone: _EmptyDefaults(
      icon: Icons.self_improvement_rounded,
      title: 'Peace',
      subtitle: "You've conquered the day. Enjoy the calm.",
      actionLabel: null,
    ),
    EmptyStateType.offline: _EmptyDefaults(
      icon: Icons.wifi_off_rounded,
      title: "We're offline",
      subtitle: 'Your tasks are still here. Reconnect when ready.',
      actionLabel: 'Retry',
    ),
    EmptyStateType.noProjects: _EmptyDefaults(
      icon: Icons.folder_open_rounded,
      title: 'No projects yet',
      subtitle: 'Start building something great.',
      actionLabel: 'New Project',
    ),
    EmptyStateType.noNotifications: _EmptyDefaults(
      icon: Icons.notifications_off_rounded,
      title: 'All clear',
      subtitle: 'No notifications to show. Enjoy the silence.',
      actionLabel: null,
    ),
    EmptyStateType.noTeamMembers: _EmptyDefaults(
      icon: Icons.group_add_rounded,
      title: 'Your team awaits',
      subtitle: 'Invite someone to join and break curses together.',
      actionLabel: 'Invite',
    ),
    EmptyStateType.noContent: _EmptyDefaults(
      icon: Icons.bookmark_border_rounded,
      title: 'No content saved yet',
      subtitle: 'Explore and save what inspires you.',
      actionLabel: 'Browse',
    ),
    EmptyStateType.noCalendarTasks: _EmptyDefaults(
      icon: Icons.event_available_rounded,
      title: 'No tasks scheduled',
      subtitle: 'No tasks for this day. Enjoy the freedom.',
      actionLabel: 'Add Task',
    ),
  };

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final defaults = _defaults[widget.type]!;
    final resolvedIcon = widget.icon ?? defaults.icon;
    final resolvedTitle = widget.title ?? defaults.title;
    final resolvedSubtitle = widget.subtitle ?? defaults.subtitle;
    final resolvedLabel = widget.actionLabel ?? defaults.actionLabel;

    // Choose icon tint: gold for positive / brand states, purple for neutral.
    final bool isGoldTint = widget.type == EmptyStateType.newUser ||
        widget.type == EmptyStateType.ghostModeDone ||
        widget.type == EmptyStateType.noTasks;

    final iconCircleColor = isGoldTint
        ? ux.gold.withValues(alpha: isLight ? 0.10 : 0.15)
        : colorScheme.primary.withValues(alpha: isLight ? 0.08 : 0.12);
    final iconColor = isGoldTint ? ux.gold : colorScheme.primary;

    return FadeTransition(
      opacity: _fadeAnim,
      child: ScaleTransition(
        scale: _scaleAnim,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ── Icon container ──
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: iconCircleColor,
                  ),
                  child: Icon(
                    resolvedIcon,
                    size: 44,
                    color: iconColor,
                  ),
                ),

                const SizedBox(height: 24),

                // ── Title (Outfit) ──
                Text(
                  resolvedTitle,
                  textAlign: TextAlign.center,
                  style: textTheme.headlineSmall?.copyWith(
                    fontFamily: 'Outfit',
                    fontWeight: FontWeight.w700,
                    color: colorScheme.onSurface,
                  ),
                ),

                const SizedBox(height: 8),

                // ── Subtitle (DM Sans) ──
                Text(
                  resolvedSubtitle,
                  textAlign: TextAlign.center,
                  style: textTheme.bodyMedium?.copyWith(
                    fontFamily: 'DMSans',
                    color: isLight
                        ? ux.textTertiary
                        : colorScheme.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),

                // ── CTA button ──
                if (widget.onAction != null && resolvedLabel != null) ...[
                  const SizedBox(height: 24),
                  PressableScale(
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      widget.onAction?.call();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 28,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: ux.gold,
                        borderRadius: BorderRadius.circular(100),
                        boxShadow: [
                          BoxShadow(
                            color: ux.gold.withValues(alpha: 0.25),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        resolvedLabel,
                        style: TextStyle(
                          fontFamily: 'DMSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isLight ? Colors.white : Colors.black,
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Internal value object holding default copy for each [EmptyStateType].
class _EmptyDefaults {
  const _EmptyDefaults({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
}
