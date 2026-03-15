/// An accountability partner connection.
class AccountabilityPartner {
  /// Unique ID for this partnership.
  final String id;

  /// Partner's user ID.
  final String userId;

  /// Partner's display name.
  final String name;

  /// Partner's avatar URL.
  final String? avatarUrl;

  /// Current streak together (days).
  final int sharedStreak;

  /// When the last nudge was sent to this partner.
  final DateTime? lastNudgedAt;

  /// Whether a nudge can be sent (1/day limit).
  final bool canNudge;

  /// Partner's task completion rate this week (0.0 to 1.0).
  final double weeklyCompletionRate;

  const AccountabilityPartner({
    required this.id,
    required this.userId,
    required this.name,
    this.avatarUrl,
    this.sharedStreak = 0,
    this.lastNudgedAt,
    this.canNudge = true,
    this.weeklyCompletionRate = 0.0,
  });

  AccountabilityPartner copyWith({
    String? id,
    String? userId,
    String? name,
    String? avatarUrl,
    int? sharedStreak,
    DateTime? lastNudgedAt,
    bool? canNudge,
    double? weeklyCompletionRate,
  }) {
    return AccountabilityPartner(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      sharedStreak: sharedStreak ?? this.sharedStreak,
      lastNudgedAt: lastNudgedAt ?? this.lastNudgedAt,
      canNudge: canNudge ?? this.canNudge,
      weeklyCompletionRate:
          weeklyCompletionRate ?? this.weeklyCompletionRate,
    );
  }

  factory AccountabilityPartner.fromJson(Map<String, dynamic> json) {
    return AccountabilityPartner(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      sharedStreak: json['sharedStreak'] as int? ?? 0,
      lastNudgedAt: json['lastNudgedAt'] != null
          ? DateTime.parse(json['lastNudgedAt'] as String)
          : null,
      canNudge: json['canNudge'] as bool? ?? true,
      weeklyCompletionRate:
          (json['weeklyCompletionRate'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'avatarUrl': avatarUrl,
        'sharedStreak': sharedStreak,
        'lastNudgedAt': lastNudgedAt?.toIso8601String(),
        'canNudge': canNudge,
        'weeklyCompletionRate': weeklyCompletionRate,
      };
}

/// A shared goal between accountability partners.
class SharedGoal {
  final String id;
  final String title;
  final double myProgress;
  final double partnerProgress;
  final int targetValue;
  final DateTime? deadline;

  const SharedGoal({
    required this.id,
    required this.title,
    this.myProgress = 0.0,
    this.partnerProgress = 0.0,
    required this.targetValue,
    this.deadline,
  });

  SharedGoal copyWith({
    String? id,
    String? title,
    double? myProgress,
    double? partnerProgress,
    int? targetValue,
    DateTime? deadline,
  }) {
    return SharedGoal(
      id: id ?? this.id,
      title: title ?? this.title,
      myProgress: myProgress ?? this.myProgress,
      partnerProgress: partnerProgress ?? this.partnerProgress,
      targetValue: targetValue ?? this.targetValue,
      deadline: deadline ?? this.deadline,
    );
  }

  factory SharedGoal.fromJson(Map<String, dynamic> json) {
    return SharedGoal(
      id: json['id'] as String,
      title: json['title'] as String,
      myProgress: (json['myProgress'] as num?)?.toDouble() ?? 0.0,
      partnerProgress: (json['partnerProgress'] as num?)?.toDouble() ?? 0.0,
      targetValue: json['targetValue'] as int? ?? 0,
      deadline: json['deadline'] != null
          ? DateTime.parse(json['deadline'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'myProgress': myProgress,
        'partnerProgress': partnerProgress,
        'targetValue': targetValue,
        'deadline': deadline?.toIso8601String(),
      };
}
