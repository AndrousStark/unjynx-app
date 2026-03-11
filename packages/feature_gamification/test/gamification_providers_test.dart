import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:feature_gamification/src/domain/models/achievement.dart';
import 'package:feature_gamification/src/domain/models/accountability_partner.dart';
import 'package:feature_gamification/src/domain/models/challenge.dart';
import 'package:feature_gamification/src/domain/models/leaderboard_entry.dart';
import 'package:feature_gamification/src/domain/models/xp_data.dart';
import 'package:feature_gamification/src/presentation/providers/gamification_providers.dart';

void main() {
  group('XpData model', () {
    test('percentToNext is 0.0 when currentLevelXp is 0', () {
      const xp = XpData(totalXp: 0, level: 1, nextLevelXp: 100, currentLevelXp: 0);
      expect(xp.percentToNext, 0.0);
    });

    test('percentToNext is 0.5 when half way', () {
      const xp = XpData(totalXp: 50, level: 1, nextLevelXp: 100, currentLevelXp: 50);
      expect(xp.percentToNext, 0.5);
    });

    test('percentToNext clamps to 1.0 when over', () {
      const xp = XpData(totalXp: 150, level: 1, nextLevelXp: 100, currentLevelXp: 120);
      expect(xp.percentToNext, 1.0);
    });

    test('percentToNext returns 1.0 when nextLevelXp is 0', () {
      const xp = XpData(totalXp: 0, level: 1, nextLevelXp: 0, currentLevelXp: 0);
      expect(xp.percentToNext, 1.0);
    });

    test('copyWith creates a new instance', () {
      const original = XpData(totalXp: 100, level: 2, nextLevelXp: 200, currentLevelXp: 50);
      final copy = original.copyWith(totalXp: 200);
      expect(copy.totalXp, 200);
      expect(copy.level, 2);
      expect(copy.currentLevelXp, 50);
    });

    test('fromJson parses correctly', () {
      final json = {
        'totalXp': 500,
        'level': 3,
        'nextLevelXp': 300,
        'currentLevelXp': 150,
      };
      final xp = XpData.fromJson(json);
      expect(xp.totalXp, 500);
      expect(xp.level, 3);
      expect(xp.nextLevelXp, 300);
      expect(xp.currentLevelXp, 150);
    });

    test('toJson round-trips', () {
      const xp = XpData(totalXp: 100, level: 2, nextLevelXp: 200, currentLevelXp: 80);
      final json = xp.toJson();
      final restored = XpData.fromJson(json);
      expect(restored.totalXp, xp.totalXp);
      expect(restored.level, xp.level);
    });

    test('empty constant has expected defaults', () {
      expect(XpData.empty.totalXp, 0);
      expect(XpData.empty.level, 1);
      expect(XpData.empty.nextLevelXp, 100);
    });
  });

  group('Achievement model', () {
    test('fromJson parses correctly', () {
      final json = {
        'id': 'a1',
        'key': 'first_task',
        'name': 'First Step',
        'description': 'Complete first task',
        'category': 'tasks',
        'xpReward': 10,
        'isUnlocked': true,
      };
      final a = Achievement.fromJson(json);
      expect(a.id, 'a1');
      expect(a.category, AchievementCategory.tasks);
      expect(a.isUnlocked, true);
    });

    test('copyWith changes isUnlocked', () {
      const a = Achievement(
        id: '1', key: 'k', name: 'N', description: 'D',
        category: AchievementCategory.streaks, xpReward: 50,
      );
      final unlocked = a.copyWith(isUnlocked: true);
      expect(unlocked.isUnlocked, true);
      expect(unlocked.key, 'k');
    });

    test('toJson includes all fields', () {
      const a = Achievement(
        id: '1', key: 'k', name: 'N', description: 'D',
        category: AchievementCategory.milestones, xpReward: 100,
        isUnlocked: false,
      );
      final json = a.toJson();
      expect(json['category'], 'milestones');
      expect(json['xpReward'], 100);
    });
  });

  group('LeaderboardEntry model', () {
    test('fromJson parses correctly', () {
      final json = {
        'userId': 'u1',
        'name': 'Test User',
        'xp': 500,
        'rank': 1,
        'isCurrentUser': true,
      };
      final entry = LeaderboardEntry.fromJson(json);
      expect(entry.userId, 'u1');
      expect(entry.isCurrentUser, true);
      expect(entry.rank, 1);
    });

    test('copyWith updates rank', () {
      const entry = LeaderboardEntry(
        userId: 'u1', name: 'A', xp: 100, rank: 3,
      );
      final updated = entry.copyWith(rank: 1);
      expect(updated.rank, 1);
      expect(updated.name, 'A');
    });
  });

  group('Challenge model', () {
    test('progressPercent is correct', () {
      final c = Challenge(
        id: '1', type: ChallengeType.taskCount,
        title: 'Test', description: 'D', targetValue: 20,
        currentProgress: 10, status: ChallengeStatus.active,
        xpReward: 100, createdAt: DateTime(2026),
      );
      expect(c.progressPercent, 0.5);
    });

    test('progressPercent clamps to 1.0', () {
      final c = Challenge(
        id: '1', type: ChallengeType.taskCount,
        title: 'Test', description: 'D', targetValue: 10,
        currentProgress: 15, status: ChallengeStatus.active,
        xpReward: 100, createdAt: DateTime(2026),
      );
      expect(c.progressPercent, 1.0);
    });

    test('isVsChallenge returns true when opponent set', () {
      final c = Challenge(
        id: '1', type: ChallengeType.taskCount,
        title: 'Test', description: 'D', targetValue: 10,
        opponentName: 'Alex', status: ChallengeStatus.active,
        xpReward: 100, createdAt: DateTime(2026),
      );
      expect(c.isVsChallenge, true);
    });

    test('isVsChallenge returns false when no opponent', () {
      final c = Challenge(
        id: '1', type: ChallengeType.taskCount,
        title: 'Test', description: 'D', targetValue: 10,
        status: ChallengeStatus.active,
        xpReward: 100, createdAt: DateTime(2026),
      );
      expect(c.isVsChallenge, false);
    });

    test('fromJson parses type enum', () {
      final json = {
        'id': '1',
        'type': 'streakDays',
        'title': 'T',
        'description': 'D',
        'targetValue': 7,
        'status': 'completed',
        'xpReward': 50,
        'createdAt': '2026-01-01T00:00:00.000Z',
      };
      final c = Challenge.fromJson(json);
      expect(c.type, ChallengeType.streakDays);
      expect(c.status, ChallengeStatus.completed);
    });
  });

  group('AccountabilityPartner model', () {
    test('fromJson parses all fields', () {
      final json = {
        'id': 'p1',
        'userId': 'u2',
        'name': 'Alex',
        'sharedStreak': 14,
        'canNudge': false,
        'weeklyCompletionRate': 0.85,
      };
      final p = AccountabilityPartner.fromJson(json);
      expect(p.name, 'Alex');
      expect(p.sharedStreak, 14);
      expect(p.canNudge, false);
      expect(p.weeklyCompletionRate, closeTo(0.85, 0.01));
    });

    test('copyWith updates canNudge', () {
      const p = AccountabilityPartner(
        id: '1', userId: 'u1', name: 'X', canNudge: true,
      );
      final nudged = p.copyWith(canNudge: false);
      expect(nudged.canNudge, false);
    });
  });

  group('SharedGoal model', () {
    test('fromJson parses progress fields', () {
      final json = {
        'id': 'g1',
        'title': '50 tasks',
        'myProgress': 32.0,
        'partnerProgress': 28.0,
        'targetValue': 50,
      };
      final g = SharedGoal.fromJson(json);
      expect(g.myProgress, 32.0);
      expect(g.partnerProgress, 28.0);
      expect(g.targetValue, 50);
    });

    test('copyWith updates title', () {
      const g = SharedGoal(id: '1', title: 'Old', targetValue: 10);
      final updated = g.copyWith(title: 'New');
      expect(updated.title, 'New');
      expect(updated.targetValue, 10);
    });
  });

  group('Providers (defaults)', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer();
    });

    tearDown(() {
      container.dispose();
    });

    test('xpDataProvider returns mock data', () async {
      final xp = await container.read(xpDataProvider.future);
      expect(xp.totalXp, 1250);
      expect(xp.level, 5);
    });

    test('achievementsProvider returns 9 mock achievements', () async {
      final list = await container.read(achievementsProvider.future);
      expect(list.length, 9);
    });

    test('leaderboardProvider returns 5 mock entries', () async {
      final list = await container.read(leaderboardProvider.future);
      expect(list.length, 5);
    });

    test('activeChallengesProvider returns 1 mock challenge', () async {
      final list = await container.read(activeChallengesProvider.future);
      expect(list.length, 1);
    });

    test('partnersProvider returns 2 mock partners', () async {
      final list = await container.read(partnersProvider.future);
      expect(list.length, 2);
    });

    test('sharedGoalsProvider returns 2 mock goals', () async {
      final list = await container.read(sharedGoalsProvider.future);
      expect(list.length, 2);
    });

    test('trendRangeProvider defaults to days30', () {
      final range = container.read(trendRangeProvider);
      expect(range, TrendRange.days30);
    });

    test('leaderboardPeriodProvider defaults to thisWeek', () {
      final period = container.read(leaderboardPeriodProvider);
      expect(period, LeaderboardPeriod.thisWeek);
    });

    test('leaderboardScopeProvider defaults to friends', () {
      final scope = container.read(leaderboardScopeProvider);
      expect(scope, LeaderboardScope.friends);
    });
  });
}
