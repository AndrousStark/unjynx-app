import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/billing_page.dart';
import 'presentation/pages/plan_comparison_page.dart';

/// Billing plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the billing flow:
///   /billing          -> M2: Plan & Billing
///   /billing/compare  -> Side-by-side plan comparison
class BillingPlugin implements UnjynxPlugin {
  @override
  String get id => 'billing';

  @override
  String get name => 'Billing';

  @override
  String get version => '0.1.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed at this stage.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/billing',
          builder: () => const BillingPage(),
          label: 'Plan & Billing',
          icon: Icons.credit_card_rounded,
          sortOrder: -1,
        ),
        PluginRoute(
          path: '/billing/compare',
          builder: () => const PlanComparisonPage(),
          label: 'Compare Plans',
          icon: Icons.compare_arrows_rounded,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
