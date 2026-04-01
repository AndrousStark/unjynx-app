import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/organization.dart';
import '../../domain/models/standup_entry.dart';
import '../../domain/models/team.dart';
import '../../domain/models/team_invite.dart';
import '../../domain/models/team_member.dart';
import '../../domain/models/team_report.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely reads a provider that may not be overridden in test environments.
///
/// Returns null instead of throwing when the provider's dependency chain
/// is not available (e.g. when service_api providers are not overridden).
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

/// Fetches the user's organizations from the API.
///
/// Returns an empty list when the API is unavailable or on network error.
class OrganizationsNotifier extends AsyncNotifier<List<Organization>> {
  @override
  Future<List<Organization>> build() async {
    final api = _tryRead(ref, organizationApiProvider);
    if (api == null) return const [];

    try {
      final response = await api.getOrganizations();
      if (response.success && response.data != null) {
        final orgs = response.data!
            .map((e) => Organization.fromJson(e as Map<String, dynamic>))
            .toList();
        return List.unmodifiable(orgs);
      }
    } on DioException {
      // Network error — return empty list rather than crashing.
    } on ApiException {
      // API error — return empty list rather than crashing.
    }

    return const [];
  }

  /// Force-refresh the organizations list from the API.
  Future<void> refresh() async {
    ref.invalidateSelf();
  }
}

/// All organizations the current user belongs to.
final organizationsProvider =
    AsyncNotifierProvider<OrganizationsNotifier, List<Organization>>(
  OrganizationsNotifier.new,
);

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

/// Whether the initial team fetch has completed (success or failure).
///
/// Used to distinguish "loading" from "no team found" in the UI.
class _TeamLoadedNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void set(bool value) => state = value;
}

final teamLoadedProvider = NotifierProvider<_TeamLoadedNotifier, bool>(
  _TeamLoadedNotifier.new,
);

/// Current active team, fetched from the API on first access.
///
/// Override from app shell via ProviderScope for testing.
class CurrentTeamNotifier extends AsyncNotifier<Team?> {
  @override
  Future<Team?> build() async {
    final api = _tryRead(ref, teamApiProvider);
    if (api == null) {
      ref.read(teamLoadedProvider.notifier).set(true);
      return null;
    }

    try {
      final response = await api.getTeams();
      ref.read(teamLoadedProvider.notifier).set(true);

      if (response.success && response.data != null && response.data!.isNotEmpty) {
        // Use the first team the user belongs to.
        final teamJson = response.data!.first as Map<String, dynamic>;
        return Team.fromJson(teamJson);
      }
    } on DioException {
      // Network error -- treat as "no team" rather than crashing.
      ref.read(teamLoadedProvider.notifier).set(true);
    } on ApiException {
      ref.read(teamLoadedProvider.notifier).set(true);
    }

    return null;
  }

  /// Sets the team directly (e.g. after creating a new team).
  void set(Team? value) {
    state = AsyncData(value);
    ref.read(teamLoadedProvider.notifier).set(true);
  }

  /// Creates a new team via the API and sets it as the current team.
  ///
  /// Returns the created [Team] on success, or null on failure.
  Future<Team?> createTeam({
    required String name,
    String? idempotencyKey,
  }) async {
    final api = _tryRead(ref, teamApiProvider);
    if (api == null) return null;

    try {
      final response = await api.createTeam(
        {'name': name},
        idempotencyKey: idempotencyKey,
      );
      if (response.success && response.data != null) {
        final team = Team.fromJson(response.data!);
        state = AsyncData(team);
        ref.read(teamLoadedProvider.notifier).set(true);
        return team;
      }
    } on DioException {
      // Network error.
    } on ApiException {
      // API error.
    }
    return null;
  }
}

final currentTeamProvider =
    AsyncNotifierProvider<CurrentTeamNotifier, Team?>(
  CurrentTeamNotifier.new,
);

/// Convenience provider for synchronous access to the current team.
///
/// Returns null while loading or on error.
final currentTeamValueProvider = Provider<Team?>((ref) {
  return ref.watch(currentTeamProvider).value;
});

/// Whether the user has an active team subscription.
final hasTeamPlanProvider = Provider<bool>((ref) {
  final team = ref.watch(currentTeamValueProvider);
  return team != null && team.plan != 'free';
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

/// Search query for member list filtering.
class _MemberSearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';
  void set(String value) => state = value;
}

final memberSearchQueryProvider =
    NotifierProvider<_MemberSearchQueryNotifier, String>(
  _MemberSearchQueryNotifier.new,
);

/// Manages the team member list with async API operations.
///
/// Automatically loads members when the current team changes.
class MembersNotifier extends AsyncNotifier<List<TeamMember>> {
  @override
  Future<List<TeamMember>> build() async {
    final team = ref.watch(currentTeamValueProvider);
    if (team == null) return const [];

    final api = _tryRead(ref, teamApiProvider);
    if (api == null) return const [];

    try {
      final response = await api.getMembers(team.id);
      if (response.success && response.data != null) {
        final members = response.data!
            .map((e) => TeamMember.fromJson(e as Map<String, dynamic>))
            .toList();
        return List.unmodifiable(members);
      }
    } on DioException {
      // Network error -- return empty list rather than throwing.
    } on ApiException {
      // API error -- return empty list rather than throwing.
    }

    return const [];
  }

  /// Adds a new member optimistically.
  void addMember(TeamMember member) {
    final current = state.value ?? [];
    state = AsyncData(List.unmodifiable([...current, member]));
  }

  /// Removes a member by ID, syncing with the API.
  Future<void> removeMember(String memberId) async {
    final current = state.value ?? [];
    final removed = current.where((m) => m.id != memberId).toList();
    state = AsyncData(List.unmodifiable(removed));

    final team = ref.read(currentTeamValueProvider);
    final api = _tryRead(ref, teamApiProvider);
    if (api != null && team != null) {
      try {
        final response = await api.removeMember(team.id, memberId);
        if (!response.success) {
          // Rollback on failure.
          state = AsyncData(List.unmodifiable(current));
        }
      } on DioException {
        // Rollback on network error.
        state = AsyncData(List.unmodifiable(current));
      }
    }
  }

  /// Updates a member's role, syncing with the API.
  Future<void> updateRole(String memberId, TeamRole newRole) async {
    final current = state.value ?? [];
    final updated = current
        .map((m) => m.id == memberId ? m.copyWith(role: newRole) : m)
        .toList();
    state = AsyncData(List.unmodifiable(updated));

    final team = ref.read(currentTeamValueProvider);
    final api = _tryRead(ref, teamApiProvider);
    if (api != null && team != null) {
      try {
        final response = await api.updateMemberRole(
          team.id,
          memberId,
          {'role': newRole.name},
        );
        if (!response.success) {
          // Rollback on failure.
          state = AsyncData(List.unmodifiable(current));
        }
      } on DioException {
        // Rollback on network error.
        state = AsyncData(List.unmodifiable(current));
      }
    }
  }
}

/// Team members provider.
final membersProvider =
    AsyncNotifierProvider<MembersNotifier, List<TeamMember>>(
  MembersNotifier.new,
);

/// Filtered members based on search query.
final filteredMembersProvider = Provider<List<TeamMember>>((ref) {
  final members = ref.watch(membersProvider).value ?? [];
  final query = ref.watch(memberSearchQueryProvider).toLowerCase();
  if (query.isEmpty) return members;
  return List.unmodifiable(
    members.where((m) => m.name.toLowerCase().contains(query)),
  );
});

// ---------------------------------------------------------------------------
// Invites
// ---------------------------------------------------------------------------

/// Manages pending invites with optimistic updates and API sync.
class InvitesNotifier extends AsyncNotifier<List<TeamInvite>> {
  @override
  Future<List<TeamInvite>> build() async => const [];

  /// Sends a new invite via the API with optimistic local state update.
  ///
  /// On API failure, rolls back to the previous state.
  Future<void> sendInvite({
    required String email,
    required TeamRole role,
    required String teamId,
  }) async {
    final current = state.value ?? [];

    // Optimistic placeholder invite.
    final optimisticInvite = TeamInvite(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      teamId: teamId,
      email: email,
      role: role,
      inviteCode: _generateCode(),
      status: InviteStatus.pending,
      expiresAt: DateTime.now().add(const Duration(days: 7)),
    );
    state = AsyncData(List.unmodifiable([...current, optimisticInvite]));

    final api = _tryRead(ref, teamApiProvider);
    if (api == null) return;

    try {
      final response = await api.inviteMember(teamId, {
        'email': email,
        'role': role.name,
      });

      if (response.success && response.data != null) {
        // Replace optimistic invite with server-confirmed invite.
        final serverInvite = TeamInvite.fromJson(response.data!);
        final updated = state.value ?? [];
        final reconciled = updated
            .map((i) => i.id == optimisticInvite.id ? serverInvite : i)
            .toList();
        state = AsyncData(List.unmodifiable(reconciled));
      } else {
        // Rollback on API error.
        state = AsyncData(List.unmodifiable(current));
      }
    } on DioException {
      // Rollback on network error.
      state = AsyncData(List.unmodifiable(current));
    }
  }

  /// Revokes an existing invite.
  void revokeInvite(String inviteId) {
    final current = state.value ?? [];
    state = AsyncData(
      List.unmodifiable(
        current.map(
          (i) => i.id == inviteId
              ? i.copyWith(status: InviteStatus.revoked)
              : i,
        ),
      ),
    );
  }

  static String _generateCode() {
    final now = DateTime.now().millisecondsSinceEpoch;
    return 'UNJYNX-${now.toRadixString(36).toUpperCase()}';
  }
}

/// Invites provider.
final invitesProvider =
    AsyncNotifierProvider<InvitesNotifier, List<TeamInvite>>(
  InvitesNotifier.new,
);

// ---------------------------------------------------------------------------
// Standups
// ---------------------------------------------------------------------------

/// Manages async standup entries with API integration.
///
/// Automatically loads standup history when the current team changes.
class StandupNotifier extends AsyncNotifier<List<StandupEntry>> {
  @override
  Future<List<StandupEntry>> build() async {
    final team = ref.watch(currentTeamValueProvider);
    if (team == null) return const [];

    final api = _tryRead(ref, teamApiProvider);
    if (api == null) return const [];

    try {
      final response = await api.getStandups(team.id);
      if (response.success && response.data != null) {
        final entries = response.data!
            .map((e) => StandupEntry.fromJson(e as Map<String, dynamic>))
            .toList();
        return List.unmodifiable(entries);
      }
    } on DioException {
      // Network error -- return empty list rather than throwing.
    } on ApiException {
      // API error -- return empty list rather than throwing.
    }

    return const [];
  }

  /// Submits a standup entry with optimistic local add and API sync.
  ///
  /// On API failure, rolls back to the previous state.
  Future<void> submitStandup(StandupEntry entry) async {
    final current = state.value ?? [];
    // Optimistic: add to front of list.
    state = AsyncData(List.unmodifiable([entry, ...current]));

    final team = ref.read(currentTeamValueProvider);
    final api = _tryRead(ref, teamApiProvider);
    if (api == null || team == null) return;

    try {
      final response = await api.submitStandup(team.id, entry.toJson());

      if (response.success && response.data != null) {
        // Replace optimistic entry with server-confirmed entry.
        final serverEntry = StandupEntry.fromJson(response.data!);
        final updated = state.value ?? [];
        final reconciled = updated
            .map((s) => s.id == entry.id ? serverEntry : s)
            .toList();
        state = AsyncData(List.unmodifiable(reconciled));
      } else {
        // Rollback on API error.
        state = AsyncData(List.unmodifiable(current));
      }
    } on DioException {
      // Rollback on network error.
      state = AsyncData(List.unmodifiable(current));
    }
  }
}

/// Standup provider.
final standupProvider =
    AsyncNotifierProvider<StandupNotifier, List<StandupEntry>>(
  StandupNotifier.new,
);

/// Currently selected delivery channel for standups.
class _StandupChannelNotifier extends Notifier<String> {
  @override
  String build() => 'slack';
  void set(String value) => state = value;
}

final standupChannelProvider =
    NotifierProvider<_StandupChannelNotifier, String>(
  _StandupChannelNotifier.new,
);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/// Selected report period.
class _ReportPeriodNotifier extends Notifier<ReportPeriod> {
  @override
  ReportPeriod build() => ReportPeriod.week;
  void set(ReportPeriod value) => state = value;
}

final reportPeriodProvider =
    NotifierProvider<_ReportPeriodNotifier, ReportPeriod>(
  _ReportPeriodNotifier.new,
);

/// Team report for the selected period, fetched from the API.
///
/// Returns an empty report when the API is unavailable or no team exists.
final teamReportProvider = FutureProvider<TeamReport>((ref) async {
  final period = ref.watch(reportPeriodProvider);
  final team = ref.watch(currentTeamValueProvider);
  final api = _tryRead(ref, teamApiProvider);

  if (api == null || team == null) {
    return TeamReport(
      period: period,
      completionRate: 0.0,
      overdueCount: 0,
    );
  }

  try {
    final response = await api.getReport(
      team.id,
      range: period.apiValue,
    );
    if (response.success && response.data != null) {
      return TeamReport.fromJson(response.data!);
    }
  } on DioException {
    // Fall through to empty report.
  } on ApiException {
    // Fall through to empty report.
  }

  return TeamReport(
    period: period,
    completionRate: 0.0,
    overdueCount: 0,
  );
});

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------

/// Recent team activity items, fetched from the API.
///
/// Returns an empty list when the API is unavailable or no team exists.
final teamActivityProvider = FutureProvider<List<TeamActivity>>((ref) async {
  final team = ref.watch(currentTeamValueProvider);
  final api = _tryRead(ref, teamApiProvider);

  if (api == null || team == null) return const [];

  try {
    final response = await api.getTeam(team.id);
    if (response.success && response.data != null) {
      final activityJson =
          response.data!['recentActivity'] as List<dynamic>?;
      if (activityJson != null) {
        return List.unmodifiable(
          activityJson.map(
            (e) => TeamActivity.fromJson(e as Map<String, dynamic>),
          ),
        );
      }
    }
  } on DioException {
    // Fall through to empty list.
  } on ApiException {
    // Fall through to empty list.
  }

  return const [];
});

/// Represents a team activity event.
class TeamActivity {
  const TeamActivity({
    required this.id,
    required this.userId,
    required this.userName,
    required this.action,
    required this.target,
    required this.timestamp,
  });

  final String id;
  final String userId;
  final String userName;
  final String action;
  final String target;
  final DateTime timestamp;

  factory TeamActivity.fromJson(Map<String, dynamic> json) {
    return TeamActivity(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      action: json['action'] as String,
      target: json['target'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }
}
