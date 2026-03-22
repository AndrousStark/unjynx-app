import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A single chat message bubble.
///
/// User messages appear on the right with gold accent.
/// AI messages appear on the left with purple accent.
class ChatBubble extends StatelessWidget {
  const ChatBubble({
    required this.content,
    required this.isUser,
    this.isStreaming = false,
    super.key,
  });

  /// The message text.
  final String content;

  /// Whether this is a user message (right-aligned, gold).
  final bool isUser;

  /// Whether the AI is still streaming this message.
  final bool isStreaming;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.78,
        ),
        margin: EdgeInsets.only(
          left: isUser ? 48 : 0,
          right: isUser ? 0 : 48,
          bottom: 8,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isUser
              ? (isLight ? unjynx.goldWash : const Color(0xFF2A2010))
              : (isLight
                  ? const Color(0xFFF0EAFC)
                  : const Color(0xFF1D1530)),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft:
                isUser ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight:
                isUser ? const Radius.circular(4) : const Radius.circular(16),
          ),
          border: Border.all(
            color: isUser
                ? (isLight
                    ? unjynx.gold.withValues(alpha: 0.3)
                    : unjynx.gold.withValues(alpha: 0.2))
                : (isLight
                    ? UnjynxLightColors.brandViolet.withValues(alpha: 0.15)
                    : UnjynxDarkColors.brandViolet.withValues(alpha: 0.2)),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (content.isEmpty && isStreaming)
              _TypingIndicator(isLight: isLight)
            else
              SelectableText(
                content,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isLight
                      ? UnjynxLightColors.textPrimary
                      : UnjynxDarkColors.textPrimary,
                  height: 1.5,
                ),
              ),
            if (isStreaming && content.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    color: isLight
                        ? UnjynxLightColors.brandViolet
                        : UnjynxDarkColors.brandViolet,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Animated typing dots indicator.
class _TypingIndicator extends StatefulWidget {
  const _TypingIndicator({required this.isLight});
  final bool isLight;

  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final delay = i * 0.2;
            final t = (_controller.value - delay).clamp(0.0, 1.0);
            final scale = 0.5 + 0.5 * (1 - (2 * t - 1).abs());
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Transform.scale(
                scale: scale,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: widget.isLight
                        ? UnjynxLightColors.brandViolet.withValues(alpha: 0.6)
                        : UnjynxDarkColors.brandViolet.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
