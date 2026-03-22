import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:feature_billing/src/data/purchase_manager.dart';
import 'package:feature_billing/src/domain/models/plan_info.dart';
import 'package:feature_billing/src/domain/models/subscription.dart';
import 'package:feature_billing/src/presentation/providers/billing_providers.dart';

void main() {
  group('Subscription model', () {
    test('free subscription is not paid', () {
      expect(Subscription.free.isPaid, false);
    });

    test('free subscription is active', () {
      expect(Subscription.free.isActive, true);
    });

    test('pro subscription is paid', () {
      const sub = Subscription(
        plan: PlanType.pro,
        status: SubscriptionStatus.active,
      );
      expect(sub.isPaid, true);
    });

    test('trialing subscription is active', () {
      const sub = Subscription(
        plan: PlanType.pro,
        status: SubscriptionStatus.trialing,
        isTrial: true,
      );
      expect(sub.isActive, true);
    });

    test('canceled subscription is not active', () {
      const sub = Subscription(
        plan: PlanType.pro,
        status: SubscriptionStatus.canceled,
      );
      expect(sub.isActive, false);
    });

    test('fromJson parses plan and status', () {
      final json = {
        'plan': 'pro',
        'status': 'active',
        'period': 'annual',
        'autoRenew': true,
        'features': ['f1', 'f2'],
      };
      final sub = Subscription.fromJson(json);
      expect(sub.plan, PlanType.pro);
      expect(sub.status, SubscriptionStatus.active);
      expect(sub.period, BillingPeriod.annual);
      expect(sub.features.length, 2);
    });

    test('toJson round-trips', () {
      const sub = Subscription(
        plan: PlanType.team,
        status: SubscriptionStatus.active,
        period: BillingPeriod.monthly,
      );
      final json = sub.toJson();
      final restored = Subscription.fromJson(json);
      expect(restored.plan, PlanType.team);
      expect(restored.period, BillingPeriod.monthly);
    });

    test('copyWith updates plan', () {
      final updated = Subscription.free.copyWith(plan: PlanType.pro);
      expect(updated.plan, PlanType.pro);
      expect(updated.status, SubscriptionStatus.active);
    });
  });

  group('PlanInfo model', () {
    test('allPlans has 4 entries', () {
      expect(PlanInfo.allPlans.length, 4);
    });

    test('proPlan is popular', () {
      expect(PlanInfo.proPlan.isPopular, true);
    });

    test('freePlan has zero monthly price', () {
      expect(PlanInfo.freePlan.monthlyPrice, 0);
    });

    test('fromJson parses correctly', () {
      final json = {
        'name': 'Custom',
        'monthlyPrice': 9.99,
        'features': ['a', 'b'],
        'isPopular': false,
      };
      final plan = PlanInfo.fromJson(json);
      expect(plan.name, 'Custom');
      expect(plan.monthlyPrice, 9.99);
      expect(plan.features.length, 2);
    });

    test('copyWith updates name', () {
      final updated = PlanInfo.proPlan.copyWith(name: 'Pro+');
      expect(updated.name, 'Pro+');
      expect(updated.isPopular, true);
    });
  });

  group('FeatureComparisonRow', () {
    test('has expected fields', () {
      const row = FeatureComparisonRow(
        feature: 'Tasks',
        free: '50',
        pro: 'Unlimited',
        team: 'Unlimited',
      );
      expect(row.feature, 'Tasks');
      expect(row.free, '50');
    });
  });

  group('ProductIds', () {
    test('has 5 product IDs', () {
      expect(ProductIds.all.length, 5);
    });

    test('contains expected IDs', () {
      expect(ProductIds.all, contains(ProductIds.proMonthly));
      expect(ProductIds.all, contains(ProductIds.proAnnual));
      expect(ProductIds.all, contains(ProductIds.teamMonthly));
      expect(ProductIds.all, contains(ProductIds.teamAnnual));
      expect(ProductIds.all, contains(ProductIds.familyMonthly));
    });
  });

  group('PurchaseResult', () {
    test('ok result has success true', () {
      const result = PurchaseResult.ok(Subscription.free);
      expect(result.success, true);
      expect(result.errorMessage, isNull);
      expect(result.subscription, Subscription.free);
    });

    test('error result has success false', () {
      const result = PurchaseResult.error('Something went wrong');
      expect(result.success, false);
      expect(result.errorMessage, 'Something went wrong');
      expect(result.subscription.plan, PlanType.free);
    });
  });

  group('PurchaseManager singleton', () {
    test('instance returns same object', () {
      final a = PurchaseManager.instance;
      final b = PurchaseManager.instance;
      expect(identical(a, b), true);
    });

    test('default state is not initialized', () {
      // Note: isInitialized may already be true if previous test
      // initialized it, but this tests the accessor works.
      expect(PurchaseManager.instance.currentSubscription, Subscription.free);
    });
  });

  group('Providers (defaults)', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('subscriptionProvider returns free by default', () async {
      final sub = await container.read(subscriptionProvider.future);
      expect(sub.plan, PlanType.free);
    });

    test('plansProvider returns all plans', () async {
      final plans = await container.read(plansProvider.future);
      expect(plans.length, 4);
    });

    test('isAnnualBillingProvider defaults to true', () {
      final isAnnual = container.read(isAnnualBillingProvider);
      expect(isAnnual, true);
    });

    test('freeTrialEnabledProvider defaults to false', () {
      final enabled = container.read(freeTrialEnabledProvider);
      expect(enabled, false);
    });

    test('featureComparisonProvider has rows', () {
      final rows = container.read(featureComparisonProvider);
      expect(rows.isNotEmpty, true);
      expect(rows.first.feature, 'Active tasks');
    });
  });
}
