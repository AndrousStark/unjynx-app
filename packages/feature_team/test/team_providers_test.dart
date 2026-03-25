import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:service_api/service_api.dart';

import 'package:feature_team/feature_team.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Pumps the Dart event queue so async StateNotifier operations settle.
Future<void> _pumpEventQueue({int times = 5}) async {
  for (var i = 0; i < times; i++) {
    await Future<void>.delayed(Duration.zero);
  }
}

/// Creates a [ProviderContainer] with API providers overridden to throw,
/// so that `_tryRead` returns null and notifiers operate in local-only mode.
ProviderContainer _makeContainer() {
  return ProviderContainer(
    overrides: [
      teamApiProvider.overrideWith(
        (ref) => throw StateError('No API in tests'),
      ),
    ],
  );
}

void main() {
  group('Team model', () {
    test('creates team from JSON', () {
      final json = {
        'id': 't1',
        'name': 'Dev Team',
        'ownerId': 'u1',
        'plan': 'pro',
        'memberCount': 5,
        'createdAt': '2026-01-01T00:00:00.000Z',
      };

      final team = Team.fromJson(json);
      expect(team.id, 't1');
      expect(team.name, 'Dev Team');
      expect(team.plan, 'pro');
      expect(team.memberCount, 5);
    });

    test('copyWith returns new instance', () {
      final team = Team(
        id: 't1',
        name: 'Old Name',
        ownerId: 'u1',
        plan: 'free',
        memberCount: 1,
        createdAt: DateTime(2026),
      );
      final updated = team.copyWith(name: 'New Name');
      expect(updated.name, 'New Name');
      expect(updated.id, 't1'); // unchanged
      expect(identical(team, updated), isFalse);
    });

    test('toJson round-trips correctly', () {
      final team = Team(
        id: 't2',
        name: 'Round Trip',
        ownerId: 'u2',
        plan: 'team',
        memberCount: 3,
        createdAt: DateTime.utc(2026, 3, 10),
      );
      final json = team.toJson();
      final restored = Team.fromJson(json);
      expect(restored.id, team.id);
      expect(restored.name, team.name);
    });
  });

  group('TeamMember model', () {
    test('creates member from JSON', () {
      final json = {
        'id': 'm1',
        'userId': 'u1',
        'name': 'Alice',
        'role': 'admin',
        'status': 'active',
        'tasksAssigned': 10,
        'completionRate': 0.85,
      };

      final member = TeamMember.fromJson(json);
      expect(member.role, TeamRole.admin);
      expect(member.status, MemberStatus.active);
      expect(member.completionRate, 0.85);
    });

    test('defaults to member role for unknown string', () {
      final role = TeamRole.fromString('unknown');
      expect(role, TeamRole.member);
    });

    test('copyWith preserves unchanged fields', () {
      const member = TeamMember(
        id: 'm1',
        userId: 'u1',
        name: 'Bob',
        role: TeamRole.member,
        status: MemberStatus.active,
        tasksAssigned: 5,
      );
      final updated = member.copyWith(role: TeamRole.admin);
      expect(updated.role, TeamRole.admin);
      expect(updated.name, 'Bob');
    });
  });

  group('TeamInvite model', () {
    test('creates invite from JSON', () {
      final json = {
        'id': 'i1',
        'email': 'test@example.com',
        'role': 'member',
        'inviteCode': 'UNJYNX-ABC123',
        'status': 'pending',
        'expiresAt': '2026-12-31T23:59:59.000Z',
      };

      final invite = TeamInvite.fromJson(json);
      expect(invite.email, 'test@example.com');
      expect(invite.status, InviteStatus.pending);
      expect(invite.isExpired, isFalse);
    });

    test('detects expired invite', () {
      final invite = TeamInvite(
        id: 'i2',
        email: 'old@example.com',
        role: TeamRole.member,
        inviteCode: 'OLD',
        status: InviteStatus.pending,
        expiresAt: DateTime(2020),
      );
      expect(invite.isExpired, isTrue);
    });
  });

  group('StandupEntry model', () {
    test('creates entry from JSON', () {
      final json = {
        'id': 's1',
        'userId': 'u1',
        'name': 'Alice',
        'doneYesterday': ['Task A', 'Task B'],
        'plannedToday': ['Task C'],
        'blockers': ['Waiting on API'],
        'submittedAt': '2026-03-10T09:00:00.000Z',
      };

      final entry = StandupEntry.fromJson(json);
      expect(entry.doneYesterday.length, 2);
      expect(entry.hasBlockers, isTrue);
    });

    test('hasBlockers is false when empty', () {
      final entry = StandupEntry(
        id: 's2',
        userId: 'u1',
        name: 'Bob',
        submittedAt: DateTime.now(),
      );
      expect(entry.hasBlockers, isFalse);
    });

    test('toJson round-trips correctly', () {
      final entry = StandupEntry(
        id: 's3',
        userId: 'u1',
        name: 'Carol',
        doneYesterday: const ['X'],
        plannedToday: const ['Y'],
        blockers: const ['Z'],
        submittedAt: DateTime.utc(2026, 3, 10),
      );
      final json = entry.toJson();
      final restored = StandupEntry.fromJson(json);
      expect(restored.id, entry.id);
      expect(restored.doneYesterday, entry.doneYesterday);
      expect(restored.blockers, entry.blockers);
    });
  });

  group('TeamReport model', () {
    test('creates report from JSON', () {
      final json = {
        'period': 'month',
        'completionRate': 0.72,
        'overdueCount': 3,
        'memberStats': [
          {
            'userId': 'u1',
            'name': 'Alice',
            'tasksCompleted': 20,
            'tasksOverdue': 2,
            'completionRate': 0.8,
          },
        ],
        'projectStats': [
          {
            'projectId': 'p1',
            'name': 'Project Alpha',
            'totalTasks': 50,
            'completedTasks': 35,
          },
        ],
      };

      final report = TeamReport.fromJson(json);
      expect(report.period, ReportPeriod.month);
      expect(report.memberStats.length, 1);
      expect(report.projectStats.first.completionRate, 0.7);
    });
  });

  group('MembersNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = _makeContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('addMember adds to state', () async {
      await container.read(membersProvider.future);
      final notifier = container.read(membersProvider.notifier);
      const member = TeamMember(
        id: 'm1',
        userId: 'u1',
        name: 'Alice',
        role: TeamRole.member,
        status: MemberStatus.active,
      );

      notifier.addMember(member);
      expect(container.read(membersProvider).value?.length, 1);
      expect(
        container.read(membersProvider).value?.first.name,
        'Alice',
      );
    });

    test('removeMember removes by ID', () async {
      await container.read(membersProvider.future);
      final notifier = container.read(membersProvider.notifier);
      const member = TeamMember(
        id: 'm1',
        userId: 'u1',
        name: 'Alice',
        role: TeamRole.member,
        status: MemberStatus.active,
      );

      notifier.addMember(member);
      await notifier.removeMember('m1');
      expect(
        container.read(membersProvider).value?.isEmpty,
        isTrue,
      );
    });

    test('updateRole changes member role', () async {
      await container.read(membersProvider.future);
      final notifier = container.read(membersProvider.notifier);
      const member = TeamMember(
        id: 'm1',
        userId: 'u1',
        name: 'Alice',
        role: TeamRole.member,
        status: MemberStatus.active,
      );

      notifier.addMember(member);
      await notifier.updateRole('m1', TeamRole.admin);
      expect(
        container.read(membersProvider).value?.first.role,
        TeamRole.admin,
      );
    });

    test('removeMember does nothing for unknown ID', () async {
      await container.read(membersProvider.future);
      final notifier = container.read(membersProvider.notifier);
      const member = TeamMember(
        id: 'm1',
        userId: 'u1',
        name: 'Alice',
        role: TeamRole.member,
        status: MemberStatus.active,
      );

      notifier.addMember(member);
      await notifier.removeMember('unknown');
      expect(container.read(membersProvider).value?.length, 1);
    });

    test('build returns empty list when no team exists', () async {
      final members = await container.read(membersProvider.future);
      expect(members, isEmpty);
    });
  });

  group('InvitesNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = _makeContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('sendInvite adds invite to state', () async {
      await container.read(invitesProvider.future);
      final notifier = container.read(invitesProvider.notifier);
      await notifier.sendInvite(
        email: 'test@example.com',
        role: TeamRole.member,
        teamId: 't1',
      );
      final invites = container.read(invitesProvider).value ?? [];
      expect(invites.length, 1);
      expect(invites.first.email, 'test@example.com');
      expect(invites.first.status, InviteStatus.pending);
    });

    test('revokeInvite changes status to revoked', () async {
      await container.read(invitesProvider.future);
      final notifier = container.read(invitesProvider.notifier);
      await notifier.sendInvite(
        email: 'revoke@example.com',
        role: TeamRole.viewer,
        teamId: 't1',
      );
      final id =
          container.read(invitesProvider).value!.first.id;
      notifier.revokeInvite(id);
      expect(
        container.read(invitesProvider).value?.first.status,
        InviteStatus.revoked,
      );
    });
  });

  group('StandupNotifier', () {
    late ProviderContainer container;

    setUp(() {
      container = _makeContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('submitStandup adds entry to front of list', () async {
      await container.read(standupProvider.future);
      final notifier = container.read(standupProvider.notifier);
      final entry = StandupEntry(
        id: 's1',
        userId: 'u1',
        name: 'Alice',
        doneYesterday: const ['Task A'],
        plannedToday: const ['Task B'],
        submittedAt: DateTime.now(),
      );

      await notifier.submitStandup(entry);
      expect(container.read(standupProvider).value?.length, 1);
      expect(
        container.read(standupProvider).value?.first.id,
        's1',
      );
    });

    test('new standups appear at the top', () async {
      await container.read(standupProvider.future);
      final notifier = container.read(standupProvider.notifier);
      final entry1 = StandupEntry(
        id: 's1',
        userId: 'u1',
        name: 'Alice',
        submittedAt: DateTime.now(),
      );
      final entry2 = StandupEntry(
        id: 's2',
        userId: 'u2',
        name: 'Bob',
        submittedAt: DateTime.now(),
      );

      await notifier.submitStandup(entry1);
      await notifier.submitStandup(entry2);
      expect(
        container.read(standupProvider).value?.first.id,
        's2',
      );
    });

    test('build returns empty list when no team exists', () async {
      final standups = await container.read(standupProvider.future);
      expect(standups, isEmpty);
    });
  });

  group('ReportPeriod', () {
    test('displayName returns human-readable strings', () {
      expect(ReportPeriod.week.displayName, 'This Week');
      expect(ReportPeriod.month.displayName, 'This Month');
      expect(ReportPeriod.quarter.displayName, 'This Quarter');
    });

    test('apiValue returns correct range strings', () {
      expect(ReportPeriod.week.apiValue, '7d');
      expect(ReportPeriod.month.apiValue, '30d');
      expect(ReportPeriod.quarter.apiValue, '90d');
    });

    test('fromString parses valid values', () {
      expect(ReportPeriod.fromString('week'), ReportPeriod.week);
      expect(ReportPeriod.fromString('month'), ReportPeriod.month);
    });

    test('fromString defaults to week for unknown', () {
      expect(ReportPeriod.fromString('unknown'), ReportPeriod.week);
    });
  });

  group('teamReportProvider', () {
    test('returns empty report when no team or API', () async {
      final container = _makeContainer();
      final report = await container.read(teamReportProvider.future);
      expect(report.completionRate, 0.0);
      expect(report.overdueCount, 0);
      container.dispose();
    });
  });

  group('teamActivityProvider', () {
    test('returns empty list when no team or API', () async {
      final container = _makeContainer();
      final activity = await container.read(teamActivityProvider.future);
      expect(activity, isEmpty);
      container.dispose();
    });
  });

  group('currentTeamProvider', () {
    test('returns null when API is unavailable', () async {
      final container = _makeContainer();
      final team = await container.read(currentTeamProvider.future);
      expect(team, isNull);
      expect(container.read(teamLoadedProvider), isTrue);
      container.dispose();
    });
  });

  group('hasTeamPlanProvider', () {
    test('returns false when no team', () {
      final container = _makeContainer();
      expect(container.read(hasTeamPlanProvider), isFalse);
      container.dispose();
    });
  });
}
