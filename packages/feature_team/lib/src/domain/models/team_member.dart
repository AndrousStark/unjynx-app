/// Immutable team member entity.
class TeamMember {
  const TeamMember({
    required this.id,
    required this.userId,
    required this.name,
    required this.role,
    required this.status,
    this.avatar,
    this.tasksAssigned = 0,
    this.completionRate = 0.0,
  });

  final String id;
  final String userId;
  final String name;
  final String? avatar;

  /// One of: owner, admin, member, viewer.
  final TeamRole role;
  final MemberStatus status;
  final int tasksAssigned;
  final double completionRate;

  TeamMember copyWith({
    String? id,
    String? userId,
    String? name,
    String? avatar,
    TeamRole? role,
    MemberStatus? status,
    int? tasksAssigned,
    double? completionRate,
  }) {
    return TeamMember(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      status: status ?? this.status,
      tasksAssigned: tasksAssigned ?? this.tasksAssigned,
      completionRate: completionRate ?? this.completionRate,
    );
  }

  factory TeamMember.fromJson(Map<String, dynamic> json) {
    return TeamMember(
      id: json['id'] as String,
      userId: json['userId'] as String,
      name: json['name'] as String,
      avatar: json['avatar'] as String?,
      role: TeamRole.fromString(json['role'] as String? ?? 'member'),
      status: MemberStatus.fromString(json['status'] as String? ?? 'active'),
      tasksAssigned: json['tasksAssigned'] as int? ?? 0,
      completionRate: (json['completionRate'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'userId': userId,
        'name': name,
        'avatar': avatar,
        'role': role.name,
        'status': status.name,
        'tasksAssigned': tasksAssigned,
        'completionRate': completionRate,
      };
}

/// Team member role with display properties.
enum TeamRole {
  owner,
  admin,
  member,
  viewer;

  static TeamRole fromString(String value) {
    return TeamRole.values.firstWhere(
      (r) => r.name == value,
      orElse: () => TeamRole.member,
    );
  }
}

/// Member online/offline status.
enum MemberStatus {
  active,
  idle,
  offline;

  static MemberStatus fromString(String value) {
    return MemberStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => MemberStatus.offline,
    );
  }
}
