/// Type of challenge.
enum ChallengeType {
  /// Complete N tasks in a time window.
  taskCount,

  /// Maintain a streak for N days.
  streakDays,

  /// Earn N XP.
  xpEarned,

  /// Complete tasks in a specific category.
  categoryFocus,
}

/// Challenge status.
enum ChallengeStatus {
  /// Challenge is currently active.
  active,

  /// User completed the challenge.
  completed,

  /// Challenge expired without completion.
  expired,

  /// Waiting for opponent to accept.
  pending,
}

/// A competitive or personal challenge.
class Challenge {
  /// Unique server ID.
  final String id;

  /// Challenge type.
  final ChallengeType type;

  /// Human-readable title.
  final String title;

  /// Description of the challenge.
  final String description;

  /// Target value to reach.
  final int targetValue;

  /// Current progress.
  final int currentProgress;

  /// Opponent's name (null for personal challenges).
  final String? opponentName;

  /// Opponent's avatar URL.
  final String? opponentAvatarUrl;

  /// Opponent's progress.
  final int opponentProgress;

  /// Challenge status.
  final ChallengeStatus status;

  /// XP reward for completion.
  final int xpReward;

  /// When the challenge ends.
  final DateTime? endsAt;

  /// When the challenge was created.
  final DateTime createdAt;

  const Challenge({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.targetValue,
    this.currentProgress = 0,
    this.opponentName,
    this.opponentAvatarUrl,
    this.opponentProgress = 0,
    required this.status,
    required this.xpReward,
    this.endsAt,
    required this.createdAt,
  });

  /// Percentage progress for the current user (0.0 to 1.0).
  double get progressPercent {
    if (targetValue <= 0) return 1.0;
    return (currentProgress / targetValue).clamp(0.0, 1.0);
  }

  /// Percentage progress for the opponent (0.0 to 1.0).
  double get opponentProgressPercent {
    if (targetValue <= 0) return 1.0;
    return (opponentProgress / targetValue).clamp(0.0, 1.0);
  }

  /// Whether this is a head-to-head challenge.
  bool get isVsChallenge => opponentName != null;

  Challenge copyWith({
    String? id,
    ChallengeType? type,
    String? title,
    String? description,
    int? targetValue,
    int? currentProgress,
    String? opponentName,
    String? opponentAvatarUrl,
    int? opponentProgress,
    ChallengeStatus? status,
    int? xpReward,
    DateTime? endsAt,
    DateTime? createdAt,
  }) {
    return Challenge(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      description: description ?? this.description,
      targetValue: targetValue ?? this.targetValue,
      currentProgress: currentProgress ?? this.currentProgress,
      opponentName: opponentName ?? this.opponentName,
      opponentAvatarUrl: opponentAvatarUrl ?? this.opponentAvatarUrl,
      opponentProgress: opponentProgress ?? this.opponentProgress,
      status: status ?? this.status,
      xpReward: xpReward ?? this.xpReward,
      endsAt: endsAt ?? this.endsAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  factory Challenge.fromJson(Map<String, dynamic> json) {
    return Challenge(
      id: json['id'] as String,
      type: ChallengeType.values.firstWhere(
        (t) => t.name == json['type'],
        orElse: () => ChallengeType.taskCount,
      ),
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      targetValue: json['targetValue'] as int? ?? 0,
      currentProgress: json['currentProgress'] as int? ?? 0,
      opponentName: json['opponentName'] as String?,
      opponentAvatarUrl: json['opponentAvatarUrl'] as String?,
      opponentProgress: json['opponentProgress'] as int? ?? 0,
      status: ChallengeStatus.values.firstWhere(
        (s) => s.name == json['status'],
        orElse: () => ChallengeStatus.active,
      ),
      xpReward: json['xpReward'] as int? ?? 0,
      endsAt: json['endsAt'] != null
          ? DateTime.parse(json['endsAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'title': title,
        'description': description,
        'targetValue': targetValue,
        'currentProgress': currentProgress,
        'opponentName': opponentName,
        'opponentAvatarUrl': opponentAvatarUrl,
        'opponentProgress': opponentProgress,
        'status': status.name,
        'xpReward': xpReward,
        'endsAt': endsAt?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}
