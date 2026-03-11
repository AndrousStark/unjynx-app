import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/accountability_partner.dart';

/// Card displaying an accountability partner with streak and nudge button.
class PartnerCard extends StatelessWidget {
  const PartnerCard({
    required this.partner,
    this.onNudge,
    this.onTap,
    super.key,
  });

  final AccountabilityPartner partner;
  final VoidCallback? onNudge;
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
            color: colorScheme.outlineVariant.withValues(alpha: 0.3),
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
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 24,
              backgroundColor: colorScheme.primary
                  .withValues(alpha: isLight ? 0.12 : 0.2),
              backgroundImage: partner.avatarUrl != null
                  ? NetworkImage(partner.avatarUrl!)
                  : null,
              child: partner.avatarUrl == null
                  ? Text(
                      partner.name.isNotEmpty
                          ? partner.name[0].toUpperCase()
                          : '?',
                      style: textTheme.headlineSmall?.copyWith(
                        fontSize: 18,
                        color: colorScheme.primary,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),

            // Name + streak
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    partner.name,
                    style: textTheme.titleMedium?.copyWith(
                      fontSize: 15,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.local_fire_department_rounded,
                        size: 14,
                        color: ux.gold,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${partner.sharedStreak} day streak',
                        style: textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${(partner.weeklyCompletionRate * 100).toStringAsFixed(0)}% this week',
                        style: textTheme.bodySmall?.copyWith(
                          color: ux.success,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Nudge button
            _NudgeButton(
              canNudge: partner.canNudge,
              onNudge: onNudge,
            ),
          ],
        ),
      ),
    );
  }
}

class _NudgeButton extends StatelessWidget {
  const _NudgeButton({
    required this.canNudge,
    this.onNudge,
  });

  final bool canNudge;
  final VoidCallback? onNudge;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;

    if (!canNudge) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(100),
        ),
        child: Text(
          'Nudged',
          style: textTheme.bodySmall?.copyWith(
            color: ux.textDisabled,
          ),
        ),
      );
    }

    return FilledButton.tonal(
      onPressed: () {
        HapticFeedback.lightImpact();
        onNudge?.call();
      },
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
      child: Text(
        'Nudge',
        style: textTheme.bodySmall?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
