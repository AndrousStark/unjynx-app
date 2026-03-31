import '../api_client.dart';
import '../api_response.dart';

/// API service for organization CRUD, members, and invites.
class OrganizationApiService {
  final ApiClient _client;

  const OrganizationApiService(this._client);

  // ── Organization CRUD ──────────────────────────────────────────

  /// List user's organizations.
  Future<ApiResponse<List<dynamic>>> getOrganizations() {
    return _client.get('/orgs');
  }

  /// Get organization by ID.
  Future<ApiResponse<Map<String, dynamic>>> getOrganization(String orgId) {
    return _client.get('/orgs/$orgId');
  }

  /// Create a new organization.
  Future<ApiResponse<Map<String, dynamic>>> createOrganization({
    required String name,
    required String slug,
    String? logoUrl,
    String? industryMode,
  }) {
    return _client.post('/orgs', data: {
      'name': name,
      'slug': slug,
      if (logoUrl != null) 'logoUrl': logoUrl,
      if (industryMode != null) 'industryMode': industryMode,
    });
  }

  /// Update organization.
  Future<ApiResponse<Map<String, dynamic>>> updateOrganization(
    String orgId, {
    String? name,
    String? slug,
    String? logoUrl,
    String? industryMode,
    Map<String, dynamic>? settings,
  }) {
    return _client.patch('/orgs/$orgId', data: {
      if (name != null) 'name': name,
      if (slug != null) 'slug': slug,
      if (logoUrl != null) 'logoUrl': logoUrl,
      if (industryMode != null) 'industryMode': industryMode,
      if (settings != null) 'settings': settings,
    });
  }

  /// Delete organization (owner only).
  Future<ApiResponse<void>> deleteOrganization(String orgId) {
    return _client.delete('/orgs/$orgId');
  }

  // ── Members ────────────────────────────────────────────────────

  /// List organization members.
  Future<ApiResponse<List<dynamic>>> getMembers(String orgId) {
    return _client.get('/orgs/$orgId/members');
  }

  /// Invite a member by email.
  Future<ApiResponse<Map<String, dynamic>>> inviteMember(
    String orgId, {
    required String email,
    String role = 'member',
  }) {
    return _client.post('/orgs/$orgId/invite', data: {
      'email': email,
      'role': role,
    });
  }

  /// Get pending invites.
  Future<ApiResponse<List<dynamic>>> getPendingInvites(String orgId) {
    return _client.get('/orgs/$orgId/invites');
  }

  /// Update member role.
  Future<ApiResponse<Map<String, dynamic>>> updateMemberRole(
    String orgId,
    String userId,
    String role,
  ) {
    return _client.patch('/orgs/$orgId/members/$userId', data: {
      'role': role,
    });
  }

  /// Remove member.
  Future<ApiResponse<void>> removeMember(String orgId, String userId) {
    return _client.delete('/orgs/$orgId/members/$userId');
  }

  /// Leave organization.
  Future<ApiResponse<void>> leaveOrganization(String orgId) {
    return _client.post('/orgs/$orgId/leave');
  }

  /// Accept invite by code.
  Future<ApiResponse<Map<String, dynamic>>> acceptInvite(String inviteCode) {
    return _client.post('/orgs/accept-invite', data: {
      'inviteCode': inviteCode,
    });
  }

  // ── GDPR ───────────────────────────────────────────────────────

  /// Export all org data (owner only).
  Future<ApiResponse<Map<String, dynamic>>> exportOrgData(String orgId) {
    return _client.get('/orgs/$orgId/export');
  }

  /// Permanently delete all org data (owner only, GDPR erasure).
  Future<ApiResponse<void>> deleteOrgData(String orgId) {
    return _client.delete('/orgs/$orgId/data');
  }
}
