/// Plan information for the comparison table.
class PlanInfo {
  /// Plan display name.
  final String name;

  /// Monthly price in USD (null for enterprise).
  final double? monthlyPrice;

  /// Annual price per month in USD (null for enterprise).
  final double? annualPricePerMonth;

  /// List of feature descriptions.
  final List<String> features;

  /// Whether this plan is highlighted as popular.
  final bool isPopular;

  /// Badge text (e.g. 'BEST VALUE', 'MOST POPULAR').
  final String? badge;

  /// Monthly price in INR for India pricing.
  final double? monthlyPriceInr;

  /// Annual price per month in INR.
  final double? annualPricePerMonthInr;

  const PlanInfo({
    required this.name,
    this.monthlyPrice,
    this.annualPricePerMonth,
    required this.features,
    this.isPopular = false,
    this.badge,
    this.monthlyPriceInr,
    this.annualPricePerMonthInr,
  });

  PlanInfo copyWith({
    String? name,
    double? monthlyPrice,
    double? annualPricePerMonth,
    List<String>? features,
    bool? isPopular,
    String? badge,
    double? monthlyPriceInr,
    double? annualPricePerMonthInr,
  }) {
    return PlanInfo(
      name: name ?? this.name,
      monthlyPrice: monthlyPrice ?? this.monthlyPrice,
      annualPricePerMonth: annualPricePerMonth ?? this.annualPricePerMonth,
      features: features ?? this.features,
      isPopular: isPopular ?? this.isPopular,
      badge: badge ?? this.badge,
      monthlyPriceInr: monthlyPriceInr ?? this.monthlyPriceInr,
      annualPricePerMonthInr:
          annualPricePerMonthInr ?? this.annualPricePerMonthInr,
    );
  }

  factory PlanInfo.fromJson(Map<String, dynamic> json) {
    return PlanInfo(
      name: json['name'] as String,
      monthlyPrice: (json['monthlyPrice'] as num?)?.toDouble(),
      annualPricePerMonth: (json['annualPricePerMonth'] as num?)?.toDouble(),
      features: (json['features'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      isPopular: json['isPopular'] as bool? ?? false,
      badge: json['badge'] as String?,
      monthlyPriceInr: (json['monthlyPriceInr'] as num?)?.toDouble(),
      annualPricePerMonthInr:
          (json['annualPricePerMonthInr'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'monthlyPrice': monthlyPrice,
        'annualPricePerMonth': annualPricePerMonth,
        'features': features,
        'isPopular': isPopular,
        'badge': badge,
        'monthlyPriceInr': monthlyPriceInr,
        'annualPricePerMonthInr': annualPricePerMonthInr,
      };

  /// Standard plans for comparison.
  static const allPlans = [freePlan, proPlan, teamPlan, familyPlan];

  static const freePlan = PlanInfo(
    name: 'Free',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    features: [
      'Up to 50 active tasks',
      'Push notifications only',
      'Basic recurring tasks',
      'Single project',
      'Community support',
    ],
  );

  static const proPlan = PlanInfo(
    name: 'Pro',
    monthlyPrice: 6.99,
    annualPricePerMonth: 4.99,
    monthlyPriceInr: 149,
    annualPricePerMonthInr: 99,
    isPopular: true,
    badge: 'MOST POPULAR',
    features: [
      'Unlimited tasks',
      'All notification channels',
      'WhatsApp & Telegram reminders',
      'Advanced recurring (RRULE)',
      'Unlimited projects',
      'Priority support',
      'AI smart scheduling',
      'Export to PDF',
      'Custom themes',
    ],
  );

  static const teamPlan = PlanInfo(
    name: 'Team',
    monthlyPrice: 8.99,
    annualPricePerMonth: 6.99,
    badge: 'BEST FOR TEAMS',
    features: [
      'Everything in Pro',
      'Team workspaces',
      'Shared projects',
      'Team leaderboard',
      'Admin panel',
      'Daily standups',
      'Team analytics',
      'SSO (coming soon)',
    ],
  );

  static const familyPlan = PlanInfo(
    name: 'Family',
    monthlyPrice: 9.99,
    annualPricePerMonth: null,
    features: [
      'Everything in Pro',
      'Up to 5 family members',
      'Shared family calendar',
      'Family activity feed',
      'Parental controls',
    ],
  );
}
