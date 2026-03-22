import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/unjynx_extensions.dart';
import 'pressable_scale.dart';

/// The kind of error to display. Each variant maps to a distinct icon,
/// title, and subtitle so screens can show contextual error feedback.
enum ErrorViewType {
  /// Device has no network connectivity.
  connectionLost,

  /// Server returned a 5xx or unexpected error.
  serverError,

  /// Request exceeded the timeout threshold.
  timeout,

  /// Generic empty / no-data state.
  emptyData,
}

/// A reusable, theme-aware error view for the UNJYNX design system.
///
/// Provides four built-in variants via [ErrorViewType] with sensible defaults,
/// plus full customisation through [icon], [title], [subtitle], and
/// [actionLabel] overrides.
///
/// Animates in with a combined fade + scale entrance (250ms).
/// The retry button uses [PressableScale] and fires
/// [HapticFeedback.mediumImpact] on press.
///
/// ```dart
/// UnjynxErrorView(
///   type: ErrorViewType.connectionLost,
///   onRetry: () => ref.invalidate(myProvider),
/// )
/// ```
class UnjynxErrorView extends StatefulWidget {
  const UnjynxErrorView({
    this.type = ErrorViewType.serverError,
    this.onRetry,
    this.icon,
    this.title,
    this.subtitle,
    this.actionLabel,
    this.compact = false,
    super.key,
  });

  /// The error variant to render. Defaults to [ErrorViewType.serverError].
  final ErrorViewType type;

  /// Called when the user taps the retry / action button.
  final VoidCallback? onRetry;

  /// Override the default icon for the selected [type].
  final IconData? icon;

  /// Override the default title text.
  final String? title;

  /// Override the default subtitle text.
  final String? subtitle;

  /// Override the default button label (defaults to "Retry").
  final String? actionLabel;

  /// When true, renders a smaller inline variant (e.g. inside a chart card).
  final bool compact;

  @override
  State<UnjynxErrorView> createState() => _UnjynxErrorViewState();
}

class _UnjynxErrorViewState extends State<UnjynxErrorView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );
    _scaleAnimation = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  // ── Default content per type ──────────────────────────────────────

  static const _defaults = <ErrorViewType, _ErrorDefaults>{
    ErrorViewType.connectionLost: _ErrorDefaults(
      icon: Icons.wifi_off_rounded,
      title: "You're offline",
      subtitle: 'Your tasks are safe locally. Reconnect to sync.',
      actionLabel: 'Retry',
    ),
    ErrorViewType.serverError: _ErrorDefaults(
      icon: Icons.cloud_off_rounded,
      title: 'Something went wrong',
      subtitle: "We're on it. Please try again in a moment.",
      actionLabel: 'Retry',
    ),
    ErrorViewType.timeout: _ErrorDefaults(
      icon: Icons.timer_off_rounded,
      title: 'Taking too long',
      subtitle: 'The request timed out. Check your connection and retry.',
      actionLabel: 'Retry',
    ),
    ErrorViewType.emptyData: _ErrorDefaults(
      icon: Icons.inbox_rounded,
      title: 'Nothing here yet',
      subtitle: 'When you add items they will appear here.',
      actionLabel: 'Refresh',
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

    final iconSize = widget.compact ? 36.0 : 56.0;
    final titleStyle = widget.compact
        ? textTheme.titleLarge?.copyWith(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurface,
          )
        : textTheme.headlineSmall?.copyWith(
            fontFamily: 'Outfit',
            fontWeight: FontWeight.w700,
            color: colorScheme.onSurface,
          );
    final subtitleStyle = textTheme.bodyMedium?.copyWith(
      fontFamily: 'DMSans',
      color: isLight ? ux.textTertiary : colorScheme.onSurfaceVariant,
    );

    // Icon container colour depends on error type.
    final iconBgColor = widget.type == ErrorViewType.emptyData
        ? colorScheme.primary.withValues(alpha: isLight ? 0.08 : 0.12)
        : colorScheme.error.withValues(alpha: isLight ? 0.08 : 0.12);
    final iconColor = widget.type == ErrorViewType.emptyData
        ? colorScheme.primary
        : colorScheme.error;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Center(
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: widget.compact ? 16 : 32,
              vertical: widget.compact ? 16 : 48,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // ── Icon circle ──
                Container(
                  width: iconSize + 24,
                  height: iconSize + 24,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: iconBgColor,
                  ),
                  child: Icon(
                    resolvedIcon,
                    size: iconSize,
                    color: iconColor,
                  ),
                ),

                SizedBox(height: widget.compact ? 12 : 20),

                // ── Title ──
                Text(
                  resolvedTitle,
                  textAlign: TextAlign.center,
                  style: titleStyle,
                ),

                const SizedBox(height: 8),

                // ── Subtitle ──
                Text(
                  resolvedSubtitle,
                  textAlign: TextAlign.center,
                  style: subtitleStyle,
                ),

                // ── Retry button ──
                if (widget.onRetry != null) ...[
                  SizedBox(height: widget.compact ? 16 : 24),
                  PressableScale(
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      widget.onRetry?.call();
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
                            color: ux.gold.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.refresh_rounded,
                            size: 18,
                            color: isLight ? Colors.white : Colors.black,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            resolvedLabel,
                            style: TextStyle(
                              fontFamily: 'DMSans',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: isLight ? Colors.white : Colors.black,
                            ),
                          ),
                        ],
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

/// Internal value object holding default copy for each [ErrorViewType].
class _ErrorDefaults {
  const _ErrorDefaults({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.actionLabel,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String actionLabel;
}
