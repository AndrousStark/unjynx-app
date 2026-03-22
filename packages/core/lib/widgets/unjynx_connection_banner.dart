import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/unjynx_colors.dart';
import '../theme/unjynx_extensions.dart';

/// Network connectivity state that the banner reflects.
enum UnjynxConnectionState {
  /// Device is online and idle.
  online,

  /// Device has no network connectivity.
  offline,

  /// Data is actively syncing to/from the server.
  syncing,

  /// Connectivity was just restored (shows a green flash).
  backOnline,
}

/// A slim, animated banner that communicates the current network state.
///
/// Place at the top of the scaffold body (above the page content) so it
/// appears consistently across all screens.
///
/// The banner auto-dismisses [backOnline] after 2 seconds, reverting to
/// [UnjynxConnectionState.online] via the [onAutoDismiss] callback.
///
/// ```dart
/// Column(
///   children: [
///     UnjynxConnectionBanner(
///       state: connectionState,
///       onAutoDismiss: () => setState(() => connectionState = UnjynxConnectionState.online),
///     ),
///     Expanded(child: pageContent),
///   ],
/// )
/// ```
class UnjynxConnectionBanner extends StatefulWidget {
  const UnjynxConnectionBanner({
    required this.state,
    this.onAutoDismiss,
    super.key,
  });

  /// Current connectivity state to display.
  final UnjynxConnectionState state;

  /// Called after the [backOnline] banner auto-dismisses (2s timeout).
  /// The parent should set state back to [UnjynxConnectionState.online].
  final VoidCallback? onAutoDismiss;

  @override
  State<UnjynxConnectionBanner> createState() =>
      _UnjynxConnectionBannerState();
}

class _UnjynxConnectionBannerState extends State<UnjynxConnectionBanner>
    with SingleTickerProviderStateMixin {
  Timer? _autoDismissTimer;
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _updatePulse();
    _scheduleAutoDismiss();
  }

  @override
  void didUpdateWidget(UnjynxConnectionBanner oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _updatePulse();
      _scheduleAutoDismiss();
    }
  }

  @override
  void dispose() {
    _autoDismissTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _updatePulse() {
    if (widget.state == UnjynxConnectionState.offline ||
        widget.state == UnjynxConnectionState.syncing) {
      if (!_pulseController.isAnimating) {
        _pulseController.repeat(reverse: true);
      }
    } else {
      _pulseController.stop();
      _pulseController.value = 1.0;
    }
  }

  void _scheduleAutoDismiss() {
    _autoDismissTimer?.cancel();
    if (widget.state == UnjynxConnectionState.backOnline) {
      _autoDismissTimer = Timer(
        const Duration(seconds: 2),
        () => widget.onAutoDismiss?.call(),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Hide when online (no banner needed).
    if (widget.state == UnjynxConnectionState.online) {
      return const SizedBox.shrink();
    }

    final isLight = context.isLightMode;

    final _BannerStyle style;
    switch (widget.state) {
      case UnjynxConnectionState.offline:
        style = _BannerStyle(
          backgroundColor: isLight
              ? const Color(0xFFE8E3EE)
              : const Color(0xFF2A2535),
          textColor: isLight
              ? UnjynxLightColors.textTertiary
              : UnjynxDarkColors.textSecondary,
          icon: Icons.cloud_off_rounded,
          text: 'Offline -- your tasks are safe locally',
        );
      case UnjynxConnectionState.syncing:
        style = _BannerStyle(
          backgroundColor: isLight
              ? const Color(0xFFEDE5F7)
              : UnjynxDarkColors.deepPurple,
          textColor: isLight
              ? UnjynxLightColors.brandViolet
              : UnjynxDarkColors.brandViolet,
          icon: Icons.cloud_sync_rounded,
          text: 'Syncing...',
        );
      case UnjynxConnectionState.backOnline:
        style = _BannerStyle(
          backgroundColor: isLight
              ? const Color(0xFFECFDF5)
              : const Color(0xFF0A2E1A),
          textColor: isLight
              ? UnjynxLightColors.success
              : UnjynxDarkColors.success,
          icon: Icons.cloud_done_rounded,
          text: 'Back online',
        );
      case UnjynxConnectionState.online:
        // Already handled above with SizedBox.shrink().
        return const SizedBox.shrink();
    }

    return AnimatedSize(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      child: AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          final opacity = widget.state == UnjynxConnectionState.offline
              ? 0.7 + 0.3 * _pulseController.value
              : 1.0;
          return Opacity(opacity: opacity, child: child);
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: style.backgroundColor,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _AnimatedIcon(
                icon: style.icon,
                color: style.textColor,
                animate: widget.state == UnjynxConnectionState.syncing,
              ),
              const SizedBox(width: 8),
              Text(
                style.text,
                style: TextStyle(
                  fontFamily: 'DMSans',
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: style.textColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// An icon that optionally rotates continuously (for the syncing state).
class _AnimatedIcon extends StatefulWidget {
  const _AnimatedIcon({
    required this.icon,
    required this.color,
    required this.animate,
  });

  final IconData icon;
  final Color color;
  final bool animate;

  @override
  State<_AnimatedIcon> createState() => _AnimatedIconState();
}

class _AnimatedIconState extends State<_AnimatedIcon>
    with SingleTickerProviderStateMixin {
  late final AnimationController _rotationController;

  @override
  void initState() {
    super.initState();
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    if (widget.animate) _rotationController.repeat();
  }

  @override
  void didUpdateWidget(_AnimatedIcon oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animate && !_rotationController.isAnimating) {
      _rotationController.repeat();
    } else if (!widget.animate && _rotationController.isAnimating) {
      _rotationController.stop();
      _rotationController.value = 0;
    }
  }

  @override
  void dispose() {
    _rotationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.animate) {
      return Icon(widget.icon, size: 16, color: widget.color);
    }

    return RotationTransition(
      turns: _rotationController,
      child: Icon(widget.icon, size: 16, color: widget.color),
    );
  }
}

/// Internal style data for each connection state variant.
class _BannerStyle {
  const _BannerStyle({
    required this.backgroundColor,
    required this.textColor,
    required this.icon,
    required this.text,
  });

  final Color backgroundColor;
  final Color textColor;
  final IconData icon;
  final String text;
}
