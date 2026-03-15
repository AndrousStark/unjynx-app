import 'package:flutter/material.dart';

/// A column (or row) whose children animate in with a staggered
/// fade + slide-from-right entrance.
///
/// Each child fades in and slides 20px from the right over 300ms,
/// with a 50ms delay between consecutive items. At most [maxAnimated]
/// items are animated; the rest appear instantly.
///
/// Respects `MediaQuery.disableAnimations` -- when true, all children
/// render immediately without animation.
///
/// ```dart
/// StaggeredColumn(
///   children: [TaskCard(), TaskCard(), TaskCard()],
/// )
/// ```
class StaggeredColumn extends StatefulWidget {
  const StaggeredColumn({
    required this.children,
    this.crossAxisAlignment = CrossAxisAlignment.start,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.mainAxisSize = MainAxisSize.min,
    this.maxAnimated = 10,
    this.itemDelay = const Duration(milliseconds: 50),
    this.itemDuration = const Duration(milliseconds: 300),
    this.slideOffset = 20.0,
    super.key,
  });

  /// The widgets to display with staggered animation.
  final List<Widget> children;

  final CrossAxisAlignment crossAxisAlignment;
  final MainAxisAlignment mainAxisAlignment;
  final MainAxisSize mainAxisSize;

  /// Maximum number of children that receive the stagger animation.
  /// Children beyond this index appear immediately.
  final int maxAnimated;

  /// Delay between consecutive item animations.
  final Duration itemDelay;

  /// Duration of each item's fade + slide animation.
  final Duration itemDuration;

  /// Horizontal slide offset in logical pixels (positive = from right).
  final double slideOffset;

  @override
  State<StaggeredColumn> createState() => _StaggeredColumnState();
}

class _StaggeredColumnState extends State<StaggeredColumn>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();

    final animatedCount = widget.children.length.clamp(0, widget.maxAnimated);
    final totalMs = animatedCount > 0
        ? widget.itemDuration.inMilliseconds +
            (animatedCount - 1) * widget.itemDelay.inMilliseconds
        : 0;

    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: totalMs),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final disableAnimations =
        MediaQuery.maybeDisableAnimationsOf(context) ?? false;

    return Column(
      crossAxisAlignment: widget.crossAxisAlignment,
      mainAxisAlignment: widget.mainAxisAlignment,
      mainAxisSize: widget.mainAxisSize,
      children: [
        for (int i = 0; i < widget.children.length; i++)
          if (disableAnimations || i >= widget.maxAnimated)
            widget.children[i]
          else
            _StaggeredItem(
              controller: _controller,
              index: i,
              itemDelay: widget.itemDelay,
              itemDuration: widget.itemDuration,
              totalDuration: _controller.duration!,
              slideOffset: widget.slideOffset,
              child: widget.children[i],
            ),
      ],
    );
  }
}

/// Internal widget that computes an [Interval] for its stagger position
/// and animates opacity + horizontal translation.
class _StaggeredItem extends StatelessWidget {
  const _StaggeredItem({
    required this.controller,
    required this.index,
    required this.itemDelay,
    required this.itemDuration,
    required this.totalDuration,
    required this.slideOffset,
    required this.child,
  });

  final AnimationController controller;
  final int index;
  final Duration itemDelay;
  final Duration itemDuration;
  final Duration totalDuration;
  final double slideOffset;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final totalMs = totalDuration.inMilliseconds;
    if (totalMs == 0) return child;

    final startMs = index * itemDelay.inMilliseconds;
    final endMs = startMs + itemDuration.inMilliseconds;
    final begin = startMs / totalMs;
    final end = (endMs / totalMs).clamp(0.0, 1.0);

    final curvedAnimation = CurvedAnimation(
      parent: controller,
      curve: Interval(begin, end, curve: Curves.easeOutCubic),
    );

    return AnimatedBuilder(
      animation: curvedAnimation,
      builder: (context, child) => Opacity(
        opacity: curvedAnimation.value,
        child: Transform.translate(
          offset: Offset(
            slideOffset * (1.0 - curvedAnimation.value),
            0,
          ),
          child: child,
        ),
      ),
      child: child,
    );
  }
}
