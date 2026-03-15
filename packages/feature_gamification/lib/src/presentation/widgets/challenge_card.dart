import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/challenge.dart';

/// Card displaying an active challenge with progress bars.
class ChallengeCard extends StatelessWidget {
  const ChallengeCard({
    required this.challenge,
    this.onTap,
    super.key,
  });

  final Challenge challenge;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isLight
              ? colorScheme.surface
              : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: colorScheme.primary.withValues(alpha: isLight ? 0.15 : 0.2),
          ),
          boxShadow: isLight
              ? [
                  BoxShadow(
                    color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  Icons.emoji_events_rounded,
                  size: 20,
                  color: ux.gold,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    challenge.title,
                    style: textTheme.titleMedium?.copyWith(
                      fontSize: 15,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: ux.gold.withValues(alpha: isLight ? 0.12 : 0.15),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    '+${challenge.xpReward} XP',
                    style: textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: ux.gold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // My progress bar
            _ProgressRow(
              label: 'You',
              progress: challenge.progressPercent,
              value:
                  '${challenge.currentProgress}/${challenge.targetValue}',
              color: colorScheme.primary,
              isLight: isLight,
            ),

            // Opponent progress (if vs challenge)
            if (challenge.isVsChallenge) ...[
              const SizedBox(height: 8),
              _ProgressRow(
                label: challenge.opponentName ?? 'Opponent',
                progress: challenge.opponentProgressPercent,
                value:
                    '${challenge.opponentProgress}/${challenge.targetValue}',
                color: colorScheme.error,
                isLight: isLight,
              ),
            ],

            // Time remaining
            if (challenge.endsAt != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.timer_outlined,
                    size: 14,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _timeRemaining(challenge.endsAt!),
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _timeRemaining(DateTime endsAt) {
    final remaining = endsAt.difference(DateTime.now());
    if (remaining.isNegative) return 'Ended';
    if (remaining.inDays > 0) return '${remaining.inDays}d remaining';
    if (remaining.inHours > 0) return '${remaining.inHours}h remaining';
    return '${remaining.inMinutes}m remaining';
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({
    required this.label,
    required this.progress,
    required this.value,
    required this.color,
    required this.isLight,
  });

  final String label;
  final double progress;
  final String value;
  final Color color;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        SizedBox(
          width: 64,
          child: Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w500,
              color: colorScheme.onSurfaceVariant,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0, end: progress),
              duration: const Duration(milliseconds: 600),
              curve: Curves.easeOutCubic,
              builder: (context, animatedProgress, child) {
                return LinearProgressIndicator(
                  value: animatedProgress,
                  minHeight: 8,
                  backgroundColor:
                      color.withValues(alpha: isLight ? 0.1 : 0.15),
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                );
              },
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: textTheme.labelMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}
