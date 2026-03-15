/// Immutable team entity.
class Team {
  const Team({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.plan,
    required this.memberCount,
    required this.createdAt,
    this.logoUrl,
  });

  final String id;
  final String name;
  final String ownerId;
  final String plan;
  final String? logoUrl;
  final int memberCount;
  final DateTime createdAt;

  Team copyWith({
    String? id,
    String? name,
    String? ownerId,
    String? plan,
    String? logoUrl,
    int? memberCount,
    DateTime? createdAt,
  }) {
    return Team(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      plan: plan ?? this.plan,
      logoUrl: logoUrl ?? this.logoUrl,
      memberCount: memberCount ?? this.memberCount,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerId: json['ownerId'] as String,
      plan: json['plan'] as String? ?? 'free',
      logoUrl: json['logoUrl'] as String?,
      memberCount: json['memberCount'] as int? ?? 0,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'ownerId': ownerId,
        'plan': plan,
        'logoUrl': logoUrl,
        'memberCount': memberCount,
        'createdAt': createdAt.toIso8601String(),
      };
}
