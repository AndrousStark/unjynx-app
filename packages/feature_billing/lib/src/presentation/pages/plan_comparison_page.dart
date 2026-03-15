import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../providers/billing_providers.dart';
import '../widgets/feature_comparison_row.dart';

/// Side-by-side plan comparison page (Free vs Pro vs Team).
class PlanComparisonPage extends ConsumerWidget {
  const PlanComparisonPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ux = context.unjynx;
    final comparisons = ref.watch(featureComparisonProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Compare Plans')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header row
            const FeatureComparisonRowWidget(
              feature: 'Feature',
              freeValue: 'Free',
              proValue: 'Pro',
              teamValue: 'Team',
              isHeader: true,
            ),

            // Feature rows
            ...comparisons.map((row) => FeatureComparisonRowWidget(
                  feature: row.feature,
                  freeValue: row.free,
                  proValue: row.pro,
                  teamValue: row.team,
                )),

            const SizedBox(height: 24),

            // CTA
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: ux.gold,
                  foregroundColor: Colors.white,
                ),
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  Navigator.of(context).pop();
                },
                child: const Text('Choose a Plan'),
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
