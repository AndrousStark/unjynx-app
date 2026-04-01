/// Immutable organization entity matching backend `organizations` table.
class Organization {
  const Organization({
    required this.id,
    required this.name,
    required this.slug,
    required this.plan,
    this.logoUrl,
    this.industryMode,
    this.memberCount = 0,
  });

  final String id;
  final String name;
  final String slug;
  final String plan;
  final String? logoUrl;
  final String? industryMode;
  final int memberCount;

  /// Display label for the plan (e.g. "Free", "Pro", "Team").
  String get planLabel {
    switch (plan) {
      case 'pro':
        return 'Pro';
      case 'team':
        return 'Team';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Free';
    }
  }

  Organization copyWith({
    String? id,
    String? name,
    String? slug,
    String? plan,
    String? logoUrl,
    String? industryMode,
    int? memberCount,
  }) {
    return Organization(
      id: id ?? this.id,
      name: name ?? this.name,
      slug: slug ?? this.slug,
      plan: plan ?? this.plan,
      logoUrl: logoUrl ?? this.logoUrl,
      industryMode: industryMode ?? this.industryMode,
      memberCount: memberCount ?? this.memberCount,
    );
  }

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      plan: json['plan'] as String? ?? 'free',
      logoUrl: json['logoUrl'] as String?,
      industryMode: json['industryMode'] as String?,
      memberCount: json['memberCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'slug': slug,
    'plan': plan,
    'logoUrl': logoUrl,
    'industryMode': industryMode,
    'memberCount': memberCount,
  };
}
