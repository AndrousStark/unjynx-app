/// Subscription plan type.
enum PlanType { free, pro, team, family, enterprise }

/// Subscription billing period.
enum BillingPeriod { monthly, annual }

/// Subscription status.
enum SubscriptionStatus {
  active,
  trialing,
  pastDue,
  canceled,
  expired,
}

/// Current user's subscription info.
class Subscription {
  /// Active plan.
  final PlanType plan;

  /// Subscription status.
  final SubscriptionStatus status;

  /// Billing period (null for free).
  final BillingPeriod? period;

  /// When the current period ends.
  final DateTime? periodEnd;

  /// Whether the subscription auto-renews.
  final bool autoRenew;

  /// List of features included in the current plan.
  final List<String> features;

  /// Whether currently in a trial.
  final bool isTrial;

  /// Trial end date (if applicable).
  final DateTime? trialEnd;

  const Subscription({
    required this.plan,
    required this.status,
    this.period,
    this.periodEnd,
    this.autoRenew = true,
    this.features = const [],
    this.isTrial = false,
    this.trialEnd,
  });

  /// Whether this is a paid plan.
  bool get isPaid => plan != PlanType.free;

  /// Whether the subscription is in good standing.
  bool get isActive =>
      status == SubscriptionStatus.active ||
      status == SubscriptionStatus.trialing;

  Subscription copyWith({
    PlanType? plan,
    SubscriptionStatus? status,
    BillingPeriod? period,
    DateTime? periodEnd,
    bool? autoRenew,
    List<String>? features,
    bool? isTrial,
    DateTime? trialEnd,
  }) {
    return Subscription(
      plan: plan ?? this.plan,
      status: status ?? this.status,
      period: period ?? this.period,
      periodEnd: periodEnd ?? this.periodEnd,
      autoRenew: autoRenew ?? this.autoRenew,
      features: features ?? this.features,
      isTrial: isTrial ?? this.isTrial,
      trialEnd: trialEnd ?? this.trialEnd,
    );
  }

  factory Subscription.fromJson(Map<String, dynamic> json) {
    return Subscription(
      plan: PlanType.values.firstWhere(
        (p) => p.name == json['plan'],
        orElse: () => PlanType.free,
      ),
      status: SubscriptionStatus.values.firstWhere(
        (s) => s.name == json['status'],
        orElse: () => SubscriptionStatus.active,
      ),
      period: json['period'] != null
          ? BillingPeriod.values.firstWhere(
              (p) => p.name == json['period'],
              orElse: () => BillingPeriod.monthly,
            )
          : null,
      periodEnd: json['periodEnd'] != null
          ? DateTime.parse(json['periodEnd'] as String)
          : null,
      autoRenew: json['autoRenew'] as bool? ?? true,
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      isTrial: json['isTrial'] as bool? ?? false,
      trialEnd: json['trialEnd'] != null
          ? DateTime.parse(json['trialEnd'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'plan': plan.name,
        'status': status.name,
        'period': period?.name,
        'periodEnd': periodEnd?.toIso8601String(),
        'autoRenew': autoRenew,
        'features': features,
        'isTrial': isTrial,
        'trialEnd': trialEnd?.toIso8601String(),
      };

  static const free = Subscription(
    plan: PlanType.free,
    status: SubscriptionStatus.active,
    features: [
      'Up to 50 active tasks',
      'Push notifications only',
      'Basic recurring tasks',
      'Single project',
    ],
  );
}
