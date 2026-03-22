import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/accountability_partner.dart';
import '../providers/gamification_providers.dart';
import '../widgets/partner_card.dart';

/// I3 - Accountability partners page.
class AccountabilityPage extends ConsumerWidget {
  const AccountabilityPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isLight = context.isLightMode;

    return Scaffold(
      appBar: AppBar(title: const Text('Accountability')),
      body: RefreshIndicator(
        color: Theme.of(context).colorScheme.primary,
        onRefresh: () async {
          ref.invalidate(partnersProvider);
          ref.invalidate(sharedGoalsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          children: [
            // Partners section
          _SectionHeader(
            title: 'Partners',
            trailing: '(max 3)',
          ),
          const SizedBox(height: 8),
          ref.watch(partnersProvider).when(
                data: (partners) => _PartnersList(partners: partners),
                loading: () => Column(
                  children: List.generate(3, (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: UnjynxShimmerBox(
                      height: 80,
                      width: double.infinity,
                      borderRadius: 16,
                    ),
                  )),
                ),
                error: (e, _) => _ErrorCard(error: e),
              ),
          const SizedBox(height: 12),

          // Invite CTA
          _InviteCard(isLight: isLight),
          const SizedBox(height: 24),

          // Shared Goals
          const _SectionHeader(title: 'Shared Goals'),
          const SizedBox(height: 8),
          ref.watch(sharedGoalsProvider).when(
                data: (goals) => _SharedGoalsList(goals: goals),
                loading: () => Column(
                  children: List.generate(2, (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: UnjynxShimmerBox(
                      height: 100,
                      width: double.infinity,
                      borderRadius: 16,
                    ),
                  )),
                ),
                error: (e, _) => _ErrorCard(error: e),
              ),
          const SizedBox(height: 24),

          // Weekly Summary Preview
          _WeeklySummaryPreview(isLight: isLight),
          const SizedBox(height: 40),
        ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    this.trailing,
  });

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Text(
          title,
          style: textTheme.headlineSmall?.copyWith(
            color: colorScheme.onSurface,
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: 8),
          Text(
            trailing!,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Partners list
// ---------------------------------------------------------------------------

class _PartnersList extends StatelessWidget {
  const _PartnersList({required this.partners});

  final List<AccountabilityPartner> partners;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    if (partners.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isLight
              ? UnjynxShadows.lightMd
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Icon(
                Icons.people_outline_rounded,
                size: 48,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(height: 12),
              Text(
                'No partners yet',
                style: textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Invite a friend to keep each other accountable',
                style: textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: partners
          .map((p) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: PartnerCard(
                  partner: p,
                  onNudge: p.canNudge
                      ? () => _sendNudge(context, p)
                      : null,
                ),
              ))
          .toList(),
    );
  }

  void _sendNudge(BuildContext context, AccountabilityPartner partner) {
    HapticFeedback.lightImpact();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Nudge sent to ${partner.name}!'),
        backgroundColor: context.unjynx.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Invite card
// ---------------------------------------------------------------------------

class _InviteCard extends StatelessWidget {
  const _InviteCard({required this.isLight});

  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.person_add_alt_1_rounded,
              color: colorScheme.primary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Invite a partner',
                    style: textTheme.titleMedium?.copyWith(
                      color: colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    'Share link or QR code',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _shareLink(context);
                  },
                  icon: const Icon(Icons.link_rounded, size: 20),
                  tooltip: 'Share link',
                ),
                IconButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _shareQr(context);
                  },
                  icon: const Icon(Icons.qr_code_rounded, size: 20),
                  tooltip: 'Show QR code',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _shareLink(BuildContext context) {
    Share.share('Join me on UNJYNX! https://unjynx.app/invite/demo');
  }

  void _shareQr(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'QR Code',
          style: textTheme.headlineMedium,
        ),
        content: SizedBox(
          width: 200,
          height: 200,
          child: Center(
            child: Icon(
              Icons.qr_code_2_rounded,
              size: 150,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Shared goals list
// ---------------------------------------------------------------------------

class _SharedGoalsList extends StatelessWidget {
  const _SharedGoalsList({required this.goals});

  final List<SharedGoal> goals;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    if (goals.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isLight
              ? UnjynxShadows.lightMd
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            'No shared goals yet. Create one with a partner!',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Column(
      children: goals.map((goal) {
        final myPercent = goal.targetValue > 0
            ? (goal.myProgress / goal.targetValue).clamp(0.0, 1.0)
            : 0.0;
        final partnerPercent = goal.targetValue > 0
            ? (goal.partnerProgress / goal.targetValue).clamp(0.0, 1.0)
            : 0.0;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: colorScheme.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: isLight
                ? UnjynxShadows.lightMd
                : null,
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  goal.title,
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),

                // My progress
                _GoalProgressRow(
                  label: 'You',
                  progress: myPercent,
                  value: '${goal.myProgress.toInt()}/${goal.targetValue}',
                  color: colorScheme.primary,
                  isLight: isLight,
                ),
                const SizedBox(height: 6),

                // Partner progress
                _GoalProgressRow(
                  label: 'Partner',
                  progress: partnerPercent,
                  value: '${goal.partnerProgress.toInt()}/${goal.targetValue}',
                  color: ux.gold,
                  isLight: isLight,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _GoalProgressRow extends StatelessWidget {
  const _GoalProgressRow({
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
          width: 52,
          child: Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: color.withValues(alpha: isLight ? 0.1 : 0.15),
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          value,
          style: textTheme.labelMedium?.copyWith(
            color: colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------------------
// Weekly summary preview
// ---------------------------------------------------------------------------

class _WeeklySummaryPreview extends StatelessWidget {
  const _WeeklySummaryPreview({required this.isLight});

  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.summarize_outlined,
                  size: 18,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  'Weekly Summary',
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Your weekly accountability report will be generated every Sunday '
              'and shared with your partners. Track who completed more tasks, '
              'maintained their streak, and earned the most XP.',
              style: textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colorScheme.primary
                    .withValues(alpha: isLight ? 0.06 : 0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.schedule_rounded,
                    size: 16,
                    color: colorScheme.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Next summary: Sunday at 9:00 PM',
                    style: textTheme.bodySmall?.copyWith(
                      color: colorScheme.primary,
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
}

// ---------------------------------------------------------------------------
// Error card
// ---------------------------------------------------------------------------

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          'Failed to load data: $error',
          style: textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.error,
          ),
        ),
      ),
    );
  }
}
