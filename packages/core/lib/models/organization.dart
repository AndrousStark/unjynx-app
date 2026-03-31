import 'package:freezed_annotation/freezed_annotation.dart';

part 'organization.freezed.dart';
part 'organization.g.dart';

/// Immutable organization entity (multi-tenant root).
@freezed
abstract class Organization with _$Organization {
  const factory Organization({
    required String id,
    required String name,
    required String slug,
    String? logoUrl,
    @Default('free') String plan,
    String? billingEmail,
    required String ownerId,
    String? logtoOrgId,
    String? industryMode,
    @Default(5) int maxMembers,
    @Default(3) int maxProjects,
    @Default(500) int maxStorageMb,
    @Default(false) bool isPersonal,
    @Default(true) bool isActive,
    DateTime? trialEndsAt,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Organization;

  factory Organization.fromJson(Map<String, dynamic> json) =>
      _$OrganizationFromJson(json);
}

/// Organization membership.
@freezed
abstract class OrgMembership with _$OrgMembership {
  const factory OrgMembership({
    required String id,
    required String orgId,
    required String userId,
    @Default('member') String role,
    @Default('active') String status,
    String? invitedBy,
    DateTime? invitedAt,
    required DateTime joinedAt,
    required DateTime lastActiveAt,
  }) = _OrgMembership;

  factory OrgMembership.fromJson(Map<String, dynamic> json) =>
      _$OrgMembershipFromJson(json);
}

/// Organization invite.
@freezed
abstract class OrgInvite with _$OrgInvite {
  const factory OrgInvite({
    required String id,
    required String orgId,
    required String email,
    @Default('member') String role,
    required String inviteCode,
    @Default('email') String inviteType,
    required String invitedBy,
    required DateTime expiresAt,
    DateTime? acceptedAt,
    @Default('pending') String status,
    required DateTime createdAt,
  }) = _OrgInvite;

  factory OrgInvite.fromJson(Map<String, dynamic> json) =>
      _$OrgInviteFromJson(json);
}
