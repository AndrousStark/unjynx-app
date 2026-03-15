import 'team_member.dart';

/// Immutable team invite entity.
class TeamInvite {
  const TeamInvite({
    required this.id,
    required this.email,
    required this.role,
    required this.inviteCode,
    required this.status,
    required this.expiresAt,
    this.teamId,
  });

  final String id;
  final String? teamId;
  final String email;
  final TeamRole role;
  final String inviteCode;
  final InviteStatus status;
  final DateTime expiresAt;

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  TeamInvite copyWith({
    String? id,
    String? teamId,
    String? email,
    TeamRole? role,
    String? inviteCode,
    InviteStatus? status,
    DateTime? expiresAt,
  }) {
    return TeamInvite(
      id: id ?? this.id,
      teamId: teamId ?? this.teamId,
      email: email ?? this.email,
      role: role ?? this.role,
      inviteCode: inviteCode ?? this.inviteCode,
      status: status ?? this.status,
      expiresAt: expiresAt ?? this.expiresAt,
    );
  }

  factory TeamInvite.fromJson(Map<String, dynamic> json) {
    return TeamInvite(
      id: json['id'] as String,
      teamId: json['teamId'] as String?,
      email: json['email'] as String,
      role: TeamRole.fromString(json['role'] as String? ?? 'member'),
      inviteCode: json['inviteCode'] as String,
      status: InviteStatus.fromString(json['status'] as String? ?? 'pending'),
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'teamId': teamId,
        'email': email,
        'role': role.name,
        'inviteCode': inviteCode,
        'status': status.name,
        'expiresAt': expiresAt.toIso8601String(),
      };
}

/// Status of a team invite.
enum InviteStatus {
  pending,
  accepted,
  expired,
  revoked;

  static InviteStatus fromString(String value) {
    return InviteStatus.values.firstWhere(
      (s) => s.name == value,
      orElse: () => InviteStatus.pending,
    );
  }
}
