import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/subscription.dart';

/// Banner showing the user's current plan and renewal date.
class CurrentPlanBanner extends StatelessWidget {
  const CurrentPlanBanner({
    required this.subscription,
    super.key,
  });

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: subscription.isPaid
              ? (isLight
                  ? [ux.gold.withValues(alpha: 0.15), ux.goldWash]
                  : [ux.gold.withValues(alpha: 0.12), ux.deepPurple])
              : (isLight
                  ? [colorScheme.surfaceContainer, colorScheme.surface]
                  : [
                      colorScheme.surfaceContainerHigh,
                      colorScheme.surfaceContainerHighest,
                    ]),
        ),
        borderRadius: BorderRadius.circular(16),
        border: subscription.isPaid
            ? Border.all(
                color: ux.gold.withValues(alpha: isLight ? 0.3 : 0.2),
              )
            : null,
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Plan name + badge
          Row(
            children: [
              Text(
                'Current Plan',
                style: textTheme.labelMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 3,
                ),
                decoration: BoxDecoration(
                  color: _statusColor(ux, colorScheme),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  _statusLabel,
                  style: textTheme.labelMedium?.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _planName,
            style: textTheme.headlineMedium?.copyWith(
              color: subscription.isPaid ? ux.gold : colorScheme.onSurface,
            ),
          ),

          // Renewal date
          if (subscription.periodEnd != null) ...[
            const SizedBox(height: 8),
            Text(
              subscription.autoRenew
                  ? 'Renews on ${_formatDate(subscription.periodEnd!)}'
                  : 'Expires on ${_formatDate(subscription.periodEnd!)}',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],

          // Trial badge
          if (subscription.isTrial && subscription.trialEnd != null) ...[
            const SizedBox(height: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: ux.info.withValues(alpha: isLight ? 0.12 : 0.15),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'Trial ends ${_formatDate(subscription.trialEnd!)}',
                style: textTheme.bodySmall?.copyWith(
                  color: ux.info,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String get _planName {
    switch (subscription.plan) {
      case PlanType.free:
        return 'Free';
      case PlanType.pro:
        return 'Pro';
      case PlanType.team:
        return 'Team';
      case PlanType.family:
        return 'Family';
      case PlanType.enterprise:
        return 'Enterprise';
    }
  }

  String get _statusLabel {
    switch (subscription.status) {
      case SubscriptionStatus.active:
        return 'Active';
      case SubscriptionStatus.trialing:
        return 'Trial';
      case SubscriptionStatus.pastDue:
        return 'Past Due';
      case SubscriptionStatus.canceled:
        return 'Canceled';
      case SubscriptionStatus.expired:
        return 'Expired';
    }
  }

  Color _statusColor(UnjynxCustomColors ux, ColorScheme colorScheme) {
    switch (subscription.status) {
      case SubscriptionStatus.active:
        return ux.success;
      case SubscriptionStatus.trialing:
        return ux.info;
      case SubscriptionStatus.pastDue:
        return ux.warning;
      case SubscriptionStatus.canceled:
      case SubscriptionStatus.expired:
        return colorScheme.error;
    }
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }
}
