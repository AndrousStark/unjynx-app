/// A single entry in the leaderboard ranking.
class LeaderboardEntry {
  /// User's server ID.
  final String userId;

  /// Display name.
  final String name;

  /// Avatar URL (nullable).
  final String? avatarUrl;

  /// Total XP for the leaderboard period.
  final int xp;

  /// Rank position (1-based).
  final int rank;

  /// Whether this entry represents the current user.
  final bool isCurrentUser;

  const LeaderboardEntry({
    required this.userId,
    required this.name,
    this.avatarUrl,
    required this.xp,
    required this.rank,
    this.isCurrentUser = false,
  });

  LeaderboardEntry copyWith({
    String? userId,
    String? name,
    String? avatarUrl,
    int? xp,
    int? rank,
    bool? isCurrentUser,
  }) {
    return LeaderboardEntry(
      userId: userId ?? this.userId,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      xp: xp ?? this.xp,
      rank: rank ?? this.rank,
      isCurrentUser: isCurrentUser ?? this.isCurrentUser,
    );
  }

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      userId: json['userId'] as String,
      name: json['name'] as String,
      avatarUrl: json['avatarUrl'] as String?,
      xp: json['xp'] as int? ?? 0,
      rank: json['rank'] as int? ?? 0,
      isCurrentUser: json['isCurrentUser'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'name': name,
        'avatarUrl': avatarUrl,
        'xp': xp,
        'rank': rank,
        'isCurrentUser': isCurrentUser,
      };
}
