import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/plan_info.dart';
import '../../domain/models/subscription.dart';
import '../providers/billing_providers.dart';
import '../widgets/current_plan_banner.dart';
import '../widgets/plan_card.dart';

/// M2 - Plan & Billing page.
class BillingPage extends ConsumerWidget {
  const BillingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Plan & Billing')),
      body: ref.watch(subscriptionProvider).when(
            data: (subscription) => _BillingContent(
              subscription: subscription,
            ),
            loading: () => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  const UnjynxShimmerBox(
                    height: 120,
                    width: double.infinity,
                    borderRadius: 16,
                  ),
                  const SizedBox(height: 24),
                  const UnjynxShimmerBox(
                    height: 60,
                    width: double.infinity,
                    borderRadius: 16,
                  ),
                  const SizedBox(height: 16),
                  ...List.generate(3, (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: UnjynxShimmerBox(
                      height: 160,
                      width: double.infinity,
                      borderRadius: 16,
                    ),
                  )),
                ],
              ),
            ),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: colorScheme.error),
                  const SizedBox(height: 12),
                  Text(
                    'Failed to load billing info',
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => ref.invalidate(subscriptionProvider),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
    );
  }
}

class _BillingContent extends ConsumerWidget {
  const _BillingContent({
    required this.subscription,
  });

  final Subscription subscription;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;
    final isAnnual = ref.watch(isAnnualBillingProvider);
    final plansAsync = ref.watch(plansProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: StaggeredColumn(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Current plan banner
          CurrentPlanBanner(subscription: subscription),
          const SizedBox(height: 24),

          // Annual savings highlight
          _AnnualSavingsBanner(
            isAnnual: isAnnual,
            onToggle: (value) {
              HapticFeedback.selectionClick();
              ref.read(isAnnualBillingProvider.notifier).set(value);
            },
          ),
          const SizedBox(height: 16),

          // 7-day free trial toggle
          if (!subscription.isPaid) ...[
            const _FreeTrialToggle(),
            const SizedBox(height: 16),
          ],

          // Plan cards
          ...plansAsync.when(
            data: (plans) => plans.map((plan) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: PlanCard(
                    plan: plan,
                    isAnnual: isAnnual,
                    isCurrentPlan: _isCurrentPlan(plan.name),
                    onSelect: () => _selectPlan(context, plan.name),
                  ),
                )),
            loading: () => [
              for (var i = 0; i < 3; i++)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: UnjynxShimmerBox(
                    height: 160,
                    width: double.infinity,
                    borderRadius: 16,
                  ),
                ),
            ],
            error: (_, __) => PlanInfo.allPlans.map((plan) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: PlanCard(
                    plan: plan,
                    isAnnual: isAnnual,
                    isCurrentPlan: _isCurrentPlan(plan.name),
                    onSelect: () => _selectPlan(context, plan.name),
                  ),
                )),
          ),

          // Compare all features link
          const SizedBox(height: 8),
          Center(
            child: TextButton.icon(
              onPressed: () => GoRouter.of(context).push(
                '/billing/compare',
              ),
              icon: const Icon(Icons.compare_arrows_rounded, size: 18),
              label: const Text('Compare all features'),
            ),
          ),

          // Regional pricing note
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colorScheme.primary
                  .withValues(alpha: isLight ? 0.06 : 0.08),
              borderRadius: BorderRadius.circular(16),
              boxShadow: isLight
                  ? context.unjynxShadow(UnjynxElevation.md)
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 18,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Prices shown in USD. Indian users get regional pricing '
                    '(e.g. Pro at Rs 149/mo or Rs 99/mo annual).',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      height: 1.3,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Manage subscription (for paid users)
          if (subscription.isPaid) ...[
            const SizedBox(height: 24),
            _ManageSubscriptionSection(subscription: subscription),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  bool _isCurrentPlan(String planName) {
    return planName.toLowerCase() == subscription.plan.name.toLowerCase();
  }

  void _selectPlan(BuildContext context, String planName) {
    // Alpha phase — all features free, subscriptions not yet live
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'All features are free during alpha! '
          '$planName subscriptions coming soon.',
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Annual savings banner
// ---------------------------------------------------------------------------

class _AnnualSavingsBanner extends StatelessWidget {
  const _AnnualSavingsBanner({
    required this.isAnnual,
    required this.onToggle,
  });

  final bool isAnnual;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isAnnual
            ? ux.success.withValues(alpha: isLight ? 0.08 : 0.1)
            : colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
        border: isAnnual
            ? Border.all(color: ux.success.withValues(alpha: 0.3))
            : null,
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Row(
        children: [
          if (isAnnual)
            Icon(Icons.savings_rounded, size: 20, color: ux.success),
          if (isAnnual) const SizedBox(width: 8),
          Expanded(
            child: Text(
              isAnnual
                  ? 'Save up to 40% with annual billing!'
                  : 'Switch to annual for savings',
              style: textTheme.titleMedium?.copyWith(
                fontSize: 13,
                color: isAnnual ? ux.success : colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: false, label: Text('Monthly')),
              ButtonSegment(value: true, label: Text('Annual')),
            ],
            selected: {isAnnual},
            onSelectionChanged: (s) => onToggle(s.first),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Free trial toggle
// ---------------------------------------------------------------------------

class _FreeTrialToggle extends ConsumerWidget {
  const _FreeTrialToggle();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final enabled = ref.watch(freeTrialEnabledProvider);

    return SwitchListTile(
      title: Text(
        '7-day free trial',
        style: textTheme.titleMedium,
      ),
      subtitle: Text(
        'Try Pro features risk-free',
        style: textTheme.bodySmall?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
      ),
      value: enabled,
      activeColor: colorScheme.primary,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      tileColor: colorScheme.surfaceContainerHigh,
      onChanged: (value) {
        HapticFeedback.selectionClick();
        ref.read(freeTrialEnabledProvider.notifier).set(value);
      },
    );
  }
}

// ---------------------------------------------------------------------------
// Manage subscription section
// ---------------------------------------------------------------------------

class _ManageSubscriptionSection extends StatelessWidget {
  const _ManageSubscriptionSection({required this.subscription});

  final Subscription subscription;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: Icon(
              Icons.receipt_long_outlined,
              color: colorScheme.onSurfaceVariant,
            ),
            title: Text(
              'Invoices',
              style: textTheme.titleMedium,
            ),
            trailing: Icon(
              Icons.chevron_right,
              color: colorScheme.onSurfaceVariant,
            ),
            onTap: () {
              HapticFeedback.lightImpact();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Invoice history will be available with Pro subscriptions.',
                  ),
                ),
              );
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: Icon(
              Icons.cancel_outlined,
              color: colorScheme.error,
            ),
            title: Text(
              'Cancel Subscription',
              style: textTheme.titleMedium?.copyWith(
                color: colorScheme.error,
              ),
            ),
            onTap: () {
              HapticFeedback.lightImpact();
              _confirmCancel(context);
            },
          ),
        ],
      ),
    );
  }

  void _confirmCancel(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: Text(
          'Cancel Subscription?',
          style: textTheme.headlineSmall,
        ),
        content: Text(
          'You will lose access to Pro features at the end of your '
          'current billing period.',
          style: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Keep Plan'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: TextButton.styleFrom(foregroundColor: colorScheme.error),
            child: const Text('Cancel'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Cancellation request submitted. Your plan remains active '
              'until the end of the current billing period.',
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    });
  }
}
