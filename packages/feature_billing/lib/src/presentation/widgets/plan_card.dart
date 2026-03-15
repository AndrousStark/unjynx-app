import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/plan_info.dart';

/// Card displaying a plan with name, price, features, and CTA.
class PlanCard extends StatelessWidget {
  const PlanCard({
    required this.plan,
    required this.isAnnual,
    this.isCurrentPlan = false,
    this.onSelect,
    super.key,
  });

  final PlanInfo plan;
  final bool isAnnual;
  final bool isCurrentPlan;
  final VoidCallback? onSelect;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final price = isAnnual
        ? (plan.annualPricePerMonth ?? plan.monthlyPrice)
        : plan.monthlyPrice;

    final borderColor =
        colorScheme.outlineVariant.withValues(alpha: 0.3);
    final hasGoldBorder = plan.isPopular || isCurrentPlan;

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onSelect?.call();
      },
      child: Container(
        decoration: BoxDecoration(
          color: isLight
              ? colorScheme.surface
              : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: hasGoldBorder ? ux.gold : borderColor,
            width: hasGoldBorder ? 2 : 1,
          ),
          boxShadow: isLight
              ? [
                  BoxShadow(
                    color: const Color(0xFF1A0533)
                        .withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: const Color(0xFF1A0533)
                        .withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Badge
            if (plan.badge != null)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isLight
                        ? [ux.gold, ux.darkGold]
                        : [ux.gold, const Color(0xFFFFA500)],
                  ),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(14),
                  ),
                ),
                child: Text(
                  plan.badge!,
                  textAlign: TextAlign.center,
                  style: textTheme.labelMedium?.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isLight ? Colors.white : Colors.black,
                    letterSpacing: 1,
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name
                  Text(
                    plan.name,
                    style: textTheme.headlineSmall?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        price == null
                            ? 'Contact Sales'
                            : price == 0
                                ? 'Free'
                                : '\$${price.toStringAsFixed(2)}',
                        style: price == null
                            ? textTheme.titleMedium?.copyWith(
                                color: colorScheme.onSurface,
                              )
                            : textTheme.displayMedium?.copyWith(
                                color: plan.isPopular
                                    ? ux.gold
                                    : colorScheme.onSurface,
                              ),
                      ),
                      if (price != null && price > 0) ...[
                        const SizedBox(width: 4),
                        Text(
                          '/mo',
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ],
                  ),

                  // Annual savings
                  if (isAnnual &&
                      plan.monthlyPrice != null &&
                      plan.annualPricePerMonth != null &&
                      plan.monthlyPrice! > 0) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Save ${_savingsPercent(plan)}% vs monthly',
                      style: textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: ux.success,
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Features
                  ...plan.features.map(
                    (f) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Icon(
                            Icons.check_rounded,
                            size: 16,
                            color: ux.success,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              f,
                              style: textTheme.bodySmall?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // CTA button
                  SizedBox(
                    width: double.infinity,
                    child: isCurrentPlan
                        ? OutlinedButton(
                            onPressed: null,
                            child: const Text('Current Plan'),
                          )
                        : FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: ux.gold,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: () {
                              HapticFeedback.mediumImpact();
                              onSelect?.call();
                            },
                            child: Text(
                              plan.monthlyPrice == 0
                                  ? 'Get Started'
                                  : plan.isPopular
                                      ? 'Upgrade'
                                      : 'Choose Plan',
                            ),
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

  static int _savingsPercent(PlanInfo plan) {
    if (plan.monthlyPrice == null ||
        plan.annualPricePerMonth == null ||
        plan.monthlyPrice == 0) {
      return 0;
    }
    final savings =
        ((plan.monthlyPrice! - plan.annualPricePerMonth!) /
                plan.monthlyPrice! *
                100)
            .round();
    return savings;
  }
}
