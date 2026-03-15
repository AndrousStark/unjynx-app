/// XP (experience points) data for the current user.
class XpData {
  /// Total accumulated XP.
  final int totalXp;

  /// Current level number.
  final int level;

  /// XP required to reach the next level.
  final int nextLevelXp;

  /// XP earned toward the current level (progress within this level).
  final int currentLevelXp;

  const XpData({
    required this.totalXp,
    required this.level,
    required this.nextLevelXp,
    required this.currentLevelXp,
  });

  /// Percentage progress toward the next level (0.0 to 1.0).
  double get percentToNext {
    if (nextLevelXp <= 0) return 1.0;
    return (currentLevelXp / nextLevelXp).clamp(0.0, 1.0);
  }

  /// Create a copy with optional overrides.
  XpData copyWith({
    int? totalXp,
    int? level,
    int? nextLevelXp,
    int? currentLevelXp,
  }) {
    return XpData(
      totalXp: totalXp ?? this.totalXp,
      level: level ?? this.level,
      nextLevelXp: nextLevelXp ?? this.nextLevelXp,
      currentLevelXp: currentLevelXp ?? this.currentLevelXp,
    );
  }

  /// Parse from backend JSON.
  factory XpData.fromJson(Map<String, dynamic> json) {
    return XpData(
      totalXp: json['totalXp'] as int? ?? 0,
      level: json['level'] as int? ?? 1,
      nextLevelXp: json['nextLevelXp'] as int? ?? 100,
      currentLevelXp: json['currentLevelXp'] as int? ?? 0,
    );
  }

  /// Serialize to JSON.
  Map<String, dynamic> toJson() => {
        'totalXp': totalXp,
        'level': level,
        'nextLevelXp': nextLevelXp,
        'currentLevelXp': currentLevelXp,
      };

  static const empty = XpData(
    totalXp: 0,
    level: 1,
    nextLevelXp: 100,
    currentLevelXp: 0,
  );
}
