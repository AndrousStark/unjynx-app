/// Achievement category for grouping in the grid.
enum AchievementCategory {
  tasks,
  streaks,
  social,
  challenges,
  milestones,
}

/// A single achievement that can be unlocked by the user.
class Achievement {
  /// Unique server ID.
  final String id;

  /// Machine-readable key (e.g. 'first_task', 'week_streak').
  final String key;

  /// Human-readable name.
  final String name;

  /// Description of how to unlock this achievement.
  final String description;

  /// Category for grouping.
  final AchievementCategory category;

  /// XP reward when unlocked.
  final int xpReward;

  /// Whether the current user has unlocked this.
  final bool isUnlocked;

  /// When the user unlocked this (null if locked).
  final DateTime? unlockedAt;

  /// Icon identifier for SVG rendering.
  final String? iconKey;

  const Achievement({
    required this.id,
    required this.key,
    required this.name,
    required this.description,
    required this.category,
    required this.xpReward,
    this.isUnlocked = false,
    this.unlockedAt,
    this.iconKey,
  });

  Achievement copyWith({
    String? id,
    String? key,
    String? name,
    String? description,
    AchievementCategory? category,
    int? xpReward,
    bool? isUnlocked,
    DateTime? unlockedAt,
    String? iconKey,
  }) {
    return Achievement(
      id: id ?? this.id,
      key: key ?? this.key,
      name: name ?? this.name,
      description: description ?? this.description,
      category: category ?? this.category,
      xpReward: xpReward ?? this.xpReward,
      isUnlocked: isUnlocked ?? this.isUnlocked,
      unlockedAt: unlockedAt ?? this.unlockedAt,
      iconKey: iconKey ?? this.iconKey,
    );
  }

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id'] as String,
      key: json['key'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      category: AchievementCategory.values.firstWhere(
        (c) => c.name == json['category'],
        orElse: () => AchievementCategory.milestones,
      ),
      xpReward: json['xpReward'] as int? ?? 0,
      isUnlocked: json['isUnlocked'] as bool? ?? false,
      unlockedAt: json['unlockedAt'] != null
          ? DateTime.parse(json['unlockedAt'] as String)
          : null,
      iconKey: json['iconKey'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'key': key,
        'name': name,
        'description': description,
        'category': category.name,
        'xpReward': xpReward,
        'isUnlocked': isUnlocked,
        'unlockedAt': unlockedAt?.toIso8601String(),
        'iconKey': iconKey,
      };
}
