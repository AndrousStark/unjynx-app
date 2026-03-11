import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

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
// Team
// ---------------------------------------------------------------------------

/// Current active team. Override from app shell via ProviderScope.
final currentTeamProvider = StateProvider<Team?>((_) => null);

/// Whether the user has an active team subscription.
final hasTeamPlanProvider = Provider<bool>((ref) {
  final team = ref.watch(currentTeamProvider);
  return team != null && team.plan != 'free';
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

/// Search query for member list filtering.
final memberSearchQueryProvider = StateProvider<String>((_) => '');

/// Manages the team member list with async API operations.
class MembersNotifier extends StateNotifier<AsyncValue<List<TeamMember>>> {
  MembersNotifier(this._ref) : super(const AsyncData([]));

  final Ref _ref;

  /// Loads members from the team API.
  ///
  /// Falls back to an empty list when the API is unavailable or errors.
  Future<void> loadMembers(String teamId) async {
    state = const AsyncLoading();
    final api = _tryRead(_ref, teamApiProvider);
    if (api == null) {
      state = const AsyncData([]);
      return;
    }

    try {
      final response = await api.getMembers(teamId);
      if (response.success && response.data != null) {
        final members = response.data!
            .map((e) =>
                TeamMember.fromJson(e as Map<String, dynamic>))
            .toList();
        state = AsyncData(List.unmodifiable(members));
      } else {
        state = AsyncError(
          response.error ?? 'Failed to load members',
          StackTrace.current,
        );
      }
    } on DioException catch (e, st) {
      state = AsyncError(e.message ?? 'Network error', st);
    }
  }

  /// Adds a new member optimistically.
  void addMember(TeamMember member) {
    final current = state.valueOrNull ?? [];
    state = AsyncData(List.unmodifiable([...current, member]));
  }

  /// Removes a member by ID, syncing with the API.
  Future<void> removeMember(String memberId, {String? teamId}) async {
    final current = state.valueOrNull ?? [];
    final removed = current.where((m) => m.id != memberId).toList();
    state = AsyncData(List.unmodifiable(removed));

    final api = _tryRead(_ref, teamApiProvider);
    if (api != null && teamId != null) {
      try {
        final response = await api.removeMember(teamId, memberId);
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
  Future<void> updateRole(
    String memberId,
    TeamRole newRole, {
    String? teamId,
  }) async {
    final current = state.valueOrNull ?? [];
    final updated = current
        .map((m) => m.id == memberId ? m.copyWith(role: newRole) : m)
        .toList();
    state = AsyncData(List.unmodifiable(updated));

    final api = _tryRead(_ref, teamApiProvider);
    if (api != null && teamId != null) {
      try {
        final response = await api.updateMemberRole(
          teamId,
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
    StateNotifierProvider<MembersNotifier, AsyncValue<List<TeamMember>>>(
  (ref) => MembersNotifier(ref),
);

/// Filtered members based on search query.
final filteredMembersProvider = Provider<List<TeamMember>>((ref) {
  final members = ref.watch(membersProvider).valueOrNull ?? [];
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
class InvitesNotifier extends StateNotifier<AsyncValue<List<TeamInvite>>> {
  InvitesNotifier(this._ref) : super(const AsyncData([]));

  final Ref _ref;

  /// Sends a new invite via the API with optimistic local state update.
  ///
  /// On API failure, rolls back to the previous state.
  Future<void> sendInvite({
    required String email,
    required TeamRole role,
    required String teamId,
  }) async {
    final current = state.valueOrNull ?? [];

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

    final api = _tryRead(_ref, teamApiProvider);
    if (api == null) return;

    try {
      final response = await api.inviteMember(teamId, {
        'email': email,
        'role': role.name,
      });

      if (response.success && response.data != null) {
        // Replace optimistic invite with server-confirmed invite.
        final serverInvite =
            TeamInvite.fromJson(response.data!);
        final updated = state.valueOrNull ?? [];
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
    final current = state.valueOrNull ?? [];
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
    StateNotifierProvider<InvitesNotifier, AsyncValue<List<TeamInvite>>>(
  (ref) => InvitesNotifier(ref),
);

// ---------------------------------------------------------------------------
// Standups
// ---------------------------------------------------------------------------

/// Manages async standup entries with API integration.
class StandupNotifier extends StateNotifier<AsyncValue<List<StandupEntry>>> {
  StandupNotifier(this._ref) : super(const AsyncData([]));

  final Ref _ref;

  /// Submits a standup entry with optimistic local add and API sync.
  ///
  /// On API failure, rolls back to the previous state.
  Future<void> submitStandup(StandupEntry entry, {String? teamId}) async {
    final current = state.valueOrNull ?? [];
    // Optimistic: add to front of list.
    state = AsyncData(List.unmodifiable([entry, ...current]));

    final api = _tryRead(_ref, teamApiProvider);
    if (api == null || teamId == null) return;

    try {
      final response = await api.submitStandup(teamId, entry.toJson());

      if (response.success && response.data != null) {
        // Replace optimistic entry with server-confirmed entry.
        final serverEntry =
            StandupEntry.fromJson(response.data!);
        final updated = state.valueOrNull ?? [];
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

  /// Loads standup history from the API.
  ///
  /// Falls back to an empty list when the API is unavailable or errors.
  Future<void> loadHistory(String teamId) async {
    state = const AsyncLoading();
    final api = _tryRead(_ref, teamApiProvider);
    if (api == null) {
      state = const AsyncData([]);
      return;
    }

    try {
      final response = await api.getStandups(teamId);
      if (response.success && response.data != null) {
        final entries = response.data!
            .map((e) =>
                StandupEntry.fromJson(e as Map<String, dynamic>))
            .toList();
        state = AsyncData(List.unmodifiable(entries));
      } else {
        state = AsyncError(
          response.error ?? 'Failed to load standups',
          StackTrace.current,
        );
      }
    } on DioException catch (e, st) {
      state = AsyncError(e.message ?? 'Network error', st);
    }
  }
}

/// Standup provider.
final standupProvider =
    StateNotifierProvider<StandupNotifier, AsyncValue<List<StandupEntry>>>(
  (ref) => StandupNotifier(ref),
);

/// Currently selected delivery channel for standups.
final standupChannelProvider = StateProvider<String>((_) => 'slack');

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/// Selected report period.
final reportPeriodProvider = StateProvider<ReportPeriod>(
  (_) => ReportPeriod.week,
);

/// Team report for the selected period, fetched from the API.
final teamReportProvider = FutureProvider<TeamReport>((ref) async {
  final period = ref.watch(reportPeriodProvider);
  final team = ref.watch(currentTeamProvider);
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
/// Returns an empty list when the API is unavailable or the team is null.
final teamActivityProvider = FutureProvider<List<TeamActivity>>((ref) async {
  final team = ref.watch(currentTeamProvider);
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
