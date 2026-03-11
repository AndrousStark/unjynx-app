import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/accountability_api_service.dart';
import 'package:service_api/src/services/gamification_api_service.dart';
import 'package:test/test.dart';

import 'api_client_test.dart';

void main() {
  late HttpServer server;
  late FakeAuthPort auth;

  setUp(() {
    auth = FakeAuthPort(token: 'test-token');
  });

  tearDown(() async {
    await server.close(force: true);
  });

  // ---------------------------------------------------------------------------
  // GamificationApiService
  // ---------------------------------------------------------------------------

  Future<GamificationApiService> createGamificationService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return GamificationApiService(client);
  }

  group('GamificationApiService', () {
    // -------------------------------------------------------------------------
    // getXpData
    // -------------------------------------------------------------------------
    test('getXpData sends GET to /gamification/xp', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'currentXp': 1250,
            'level': 5,
            'xpToNextLevel': 750,
          }))
          ..close();
      });

      final response = await service.getXpData();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/gamification/xp');
      expect(response.success, isTrue);
      expect(response.data!['currentXp'], 1250);
      expect(response.data!['level'], 5);
    });

    test('getXpData returns full XP payload', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'currentXp': 3400,
            'level': 12,
            'xpToNextLevel': 600,
            'totalXpEarned': 12400,
            'streakBonus': 1.5,
          }))
          ..close();
      });

      final response = await service.getXpData();

      expect(response.success, isTrue);
      expect(response.data!['totalXpEarned'], 12400);
      expect(response.data!['streakBonus'], 1.5);
      expect(response.data!['xpToNextLevel'], 600);
    });

    test('getXpData handles 401 unauthorized', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 401
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Token expired',
          }))
          ..close();
      });

      try {
        await service.getXpData();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    test('getXpData handles 500 server error', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 500
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Internal server error',
          }))
          ..close();
      });

      try {
        await service.getXpData();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // getAchievements
    // -------------------------------------------------------------------------
    test('getAchievements sends GET to /gamification/achievements', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'ach-1',
              'name': 'First Task',
              'unlocked': true,
            },
            {
              'id': 'ach-2',
              'name': 'Streak Master',
              'unlocked': false,
            },
          ]))
          ..close();
      });

      final response = await service.getAchievements();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/gamification/achievements');
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getAchievements returns achievement details', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'ach-1',
              'name': 'Early Bird',
              'description': 'Complete a task before 7 AM',
              'unlocked': true,
              'unlockedAt': '2026-03-10T06:30:00Z',
              'xpReward': 100,
            },
            {
              'id': 'ach-2',
              'name': '7-Day Streak',
              'description': 'Complete tasks 7 days in a row',
              'unlocked': false,
              'progress': 0.71,
              'xpReward': 250,
            },
          ]))
          ..close();
      });

      final response = await service.getAchievements();

      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
      final first = response.data![0] as Map<String, dynamic>;
      expect(first['unlocked'], isTrue);
      expect(first['xpReward'], 100);
      final second = response.data![1] as Map<String, dynamic>;
      expect(second['unlocked'], isFalse);
      expect(second['progress'], 0.71);
    });

    test('getAchievements returns empty list when none exist', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getAchievements();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -------------------------------------------------------------------------
    // getAchievement (single)
    // -------------------------------------------------------------------------
    test('getAchievement sends GET to /gamification/achievements/:id',
        () async {
      String? capturedPath;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'ach-42',
            'name': 'Perfectionist',
            'unlocked': true,
          }))
          ..close();
      });

      final response = await service.getAchievement('ach-42');

      expect(capturedPath, '/api/v1/gamification/achievements/ach-42');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'ach-42');
    });

    test('getAchievement handles 404 not found', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Achievement not found',
          }))
          ..close();
      });

      try {
        await service.getAchievement('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // getLeaderboard
    // -------------------------------------------------------------------------
    test('getLeaderboard sends GET to /gamification/leaderboard with defaults',
        () async {
      String? capturedPath;
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'rank': 1, 'userId': 'u-1', 'xp': 5000},
            {'rank': 2, 'userId': 'u-2', 'xp': 4800},
          ]))
          ..close();
      });

      final response = await service.getLeaderboard();

      expect(capturedPath, '/api/v1/gamification/leaderboard');
      expect(capturedUri, contains('scope=friends'));
      expect(capturedUri, contains('period=this_week'));
      expect(capturedUri, contains('limit=20'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getLeaderboard sends custom scope and period', () async {
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getLeaderboard(
        scope: 'global',
        period: 'all_time',
        limit: 50,
      );

      expect(capturedUri, contains('scope=global'));
      expect(capturedUri, contains('period=all_time'));
      expect(capturedUri, contains('limit=50'));
    });

    test('getLeaderboard returns ranked entries', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'rank': 1,
              'userId': 'u-leader',
              'displayName': 'TopUser',
              'xp': 15000,
              'level': 20,
            },
            {
              'rank': 2,
              'userId': 'u-me',
              'displayName': 'Me',
              'xp': 12400,
              'level': 18,
              'isCurrentUser': true,
            },
            {
              'rank': 3,
              'userId': 'u-other',
              'displayName': 'Rival',
              'xp': 11000,
              'level': 16,
            },
          ]))
          ..close();
      });

      final response = await service.getLeaderboard(
        scope: 'friends',
        period: 'this_month',
      );

      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
      final leader = response.data![0] as Map<String, dynamic>;
      expect(leader['rank'], 1);
      expect(leader['xp'], 15000);
      final me = response.data![1] as Map<String, dynamic>;
      expect(me['isCurrentUser'], isTrue);
    });

    // -------------------------------------------------------------------------
    // getChallenges
    // -------------------------------------------------------------------------
    test('getChallenges sends GET to /gamification/challenges', () async {
      String? capturedPath;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'id': 'ch-1', 'name': 'Weekly Sprint', 'status': 'active'},
          ]))
          ..close();
      });

      final response = await service.getChallenges();

      expect(capturedPath, '/api/v1/gamification/challenges');
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getChallenges sends status filter as query param', () async {
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getChallenges(status: 'active');

      expect(capturedUri, contains('status=active'));
    });

    test('getChallenges omits status when null', () async {
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getChallenges();

      expect(capturedUri, isNot(contains('status=')));
    });

    test('getChallenges with completed status filter', () async {
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'id': 'ch-3', 'name': 'Done Challenge', 'status': 'completed'},
          ]))
          ..close();
      });

      final response = await service.getChallenges(status: 'completed');

      expect(capturedUri, contains('status=completed'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getChallenges returns challenge details', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'ch-1',
              'name': 'Morning Warrior',
              'description': 'Complete 5 tasks before 9 AM',
              'status': 'active',
              'progress': 0.6,
              'xpReward': 500,
              'endsAt': '2026-03-17T23:59:59Z',
              'participants': 3,
            },
          ]))
          ..close();
      });

      final response = await service.getChallenges(status: 'active');

      expect(response.success, isTrue);
      final ch = response.data![0] as Map<String, dynamic>;
      expect(ch['name'], 'Morning Warrior');
      expect(ch['progress'], 0.6);
      expect(ch['xpReward'], 500);
      expect(ch['participants'], 3);
    });

    test('getChallenges returns empty list when no challenges', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getChallenges();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -------------------------------------------------------------------------
    // createChallenge
    // -------------------------------------------------------------------------
    test('createChallenge sends POST to /gamification/challenges', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'ch-new',
            'name': 'Custom Challenge',
            'status': 'active',
          }))
          ..close();
      });

      final response = await service.createChallenge({
        'name': 'Custom Challenge',
        'description': 'Complete 10 tasks in 3 days',
        'xpReward': 300,
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/gamification/challenges');
      expect(capturedBody!['name'], 'Custom Challenge');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'ch-new');
    });

    test('createChallenge sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createGamificationService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': 'ch-idem'}))
          ..close();
      });

      await service.createChallenge(
        {'name': 'Idem Challenge'},
        idempotencyKey: 'idem-ch-001',
      );

      expect(capturedIdempotency, 'idem-ch-001');
    });

    // -------------------------------------------------------------------------
    // acceptChallenge
    // -------------------------------------------------------------------------
    test('acceptChallenge sends PATCH to /gamification/challenges/:id/accept',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'ch-1',
            'status': 'accepted',
          }))
          ..close();
      });

      final response = await service.acceptChallenge('ch-1');

      expect(capturedMethod, 'PATCH');
      expect(capturedPath, '/api/v1/gamification/challenges/ch-1/accept');
      expect(response.success, isTrue);
      expect(response.data!['status'], 'accepted');
    });

    test('acceptChallenge handles 404 for nonexistent challenge', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Challenge not found',
          }))
          ..close();
      });

      try {
        await service.acceptChallenge('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
        expect(apiError.message, 'Challenge not found');
      }
    });

    test('acceptChallenge handles 409 already accepted', () async {
      final service = await createGamificationService((req) async {
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Challenge already accepted',
          }))
          ..close();
      });

      try {
        await service.acceptChallenge('ch-already');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
        expect(apiError.message, 'Challenge already accepted');
      }
    });

    // -------------------------------------------------------------------------
    // getXpHistory
    // -------------------------------------------------------------------------
    test('getXpHistory sends GET to /gamification/xp/history with default range',
        () async {
      String? capturedPath;
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedPath = req.uri.path;
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'date': '2026-03-01', 'xp': 120},
            {'date': '2026-03-02', 'xp': 85},
          ]))
          ..close();
      });

      final response = await service.getXpHistory();

      expect(capturedPath, '/api/v1/gamification/xp/history');
      expect(capturedUri, contains('range=30d'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getXpHistory sends custom range', () async {
      String? capturedUri;
      final service = await createGamificationService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getXpHistory(range: '7d');

      expect(capturedUri, contains('range=7d'));
    });

    // -------------------------------------------------------------------------
    // Auth header verification
    // -------------------------------------------------------------------------
    test('includes Bearer token in all requests', () async {
      String? capturedAuth;
      final service = await createGamificationService((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {}))
          ..close();
      });

      await service.getXpData();

      expect(capturedAuth, 'Bearer test-token');
    });
  });

  // ---------------------------------------------------------------------------
  // AccountabilityApiService
  // ---------------------------------------------------------------------------

  Future<AccountabilityApiService> createAccountabilityService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return AccountabilityApiService(client);
  }

  group('AccountabilityApiService', () {
    // -------------------------------------------------------------------------
    // getPartners
    // -------------------------------------------------------------------------
    test('getPartners sends GET to /accountability/partners', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'p-1',
              'displayName': 'Alice',
              'since': '2026-02-15',
            },
          ]))
          ..close();
      });

      final response = await service.getPartners();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/accountability/partners');
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getPartners returns multiple partners with details', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'p-1',
              'displayName': 'Alice',
              'avatarUrl': 'https://cdn.unjynx.com/avatars/alice.png',
              'since': '2026-02-15',
              'lastNudgedAt': '2026-03-10T08:00:00Z',
            },
            {
              'id': 'p-2',
              'displayName': 'Bob',
              'avatarUrl': null,
              'since': '2026-03-01',
              'lastNudgedAt': null,
            },
          ]))
          ..close();
      });

      final response = await service.getPartners();

      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
      final alice = response.data![0] as Map<String, dynamic>;
      expect(alice['displayName'], 'Alice');
      expect(alice['lastNudgedAt'], isNotNull);
      final bob = response.data![1] as Map<String, dynamic>;
      expect(bob['displayName'], 'Bob');
      expect(bob['lastNudgedAt'], isNull);
    });

    test('getPartners returns empty list when no partners', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getPartners();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    test('getPartners handles 401 unauthorized', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 401
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Token expired',
          }))
          ..close();
      });

      try {
        await service.getPartners();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // getSharedGoals
    // -------------------------------------------------------------------------
    test('getSharedGoals sends GET to /accountability/goals', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'g-1',
              'title': 'Exercise daily',
              'participants': ['user-1', 'user-2'],
            },
          ]))
          ..close();
      });

      final response = await service.getSharedGoals();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/accountability/goals');
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getSharedGoals returns goals with full metadata', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'g-1',
              'title': 'Exercise daily',
              'description': 'At least 30 minutes of exercise',
              'participants': ['user-1', 'user-2'],
              'startDate': '2026-03-01',
              'endDate': '2026-03-31',
              'overallProgress': 0.45,
            },
            {
              'id': 'g-2',
              'title': 'Read 4 books',
              'description': 'One book per week',
              'participants': ['user-1', 'user-3'],
              'startDate': '2026-03-01',
              'endDate': '2026-03-31',
              'overallProgress': 0.25,
            },
          ]))
          ..close();
      });

      final response = await service.getSharedGoals();

      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
      final goal = response.data![0] as Map<String, dynamic>;
      expect(goal['title'], 'Exercise daily');
      expect(goal['overallProgress'], 0.45);
    });

    test('getSharedGoals returns empty list when no goals', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getSharedGoals();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -------------------------------------------------------------------------
    // invitePartner
    // -------------------------------------------------------------------------
    test('invitePartner sends POST to /accountability/invite', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'inviteCode': 'INV-ABC-123',
            'expiresAt': '2026-03-18T00:00:00Z',
          }))
          ..close();
      });

      final response = await service.invitePartner({
        'email': 'partner@example.com',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/accountability/invite');
      expect(capturedBody!['email'], 'partner@example.com');
      expect(response.success, isTrue);
      expect(response.data!['inviteCode'], 'INV-ABC-123');
    });

    test('invitePartner sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createAccountabilityService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'inviteCode': 'INV-XYZ'}))
          ..close();
      });

      await service.invitePartner(
        {'email': 'test@example.com'},
        idempotencyKey: 'idem-invite-001',
      );

      expect(capturedIdempotency, 'idem-invite-001');
    });

    test('invitePartner can invite by userId', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createAccountabilityService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'inviteCode': 'INV-UID',
            'expiresAt': '2026-03-18T00:00:00Z',
          }))
          ..close();
      });

      await service.invitePartner({'userId': 'user-42'});

      expect(capturedBody!['userId'], 'user-42');
    });

    test('invitePartner handles 422 validation error', () async {
      final service = await createAccountabilityService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'email': 'Invalid email address'},
          }))
          ..close();
      });

      try {
        await service.invitePartner({'email': 'not-an-email'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors!['email'], 'Invalid email address');
      }
    });

    test('invitePartner handles 429 rate limit', () async {
      final service = await createAccountabilityService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 429
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Rate limit exceeded. Max 10 invites per day.',
          }))
          ..close();
      });

      try {
        await service.invitePartner({'email': 'test@example.com'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // acceptInvitation
    // -------------------------------------------------------------------------
    test('acceptInvitation sends POST to /accountability/accept/:code',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'partnerId': 'p-new',
            'displayName': 'NewPartner',
          }))
          ..close();
      });

      final response = await service.acceptInvitation('INV-ABC-123');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/accountability/accept/INV-ABC-123');
      expect(response.success, isTrue);
      expect(response.data!['partnerId'], 'p-new');
    });

    test('acceptInvitation handles 404 for expired/invalid code', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Invitation not found or expired',
          }))
          ..close();
      });

      try {
        await service.acceptInvitation('EXPIRED-CODE');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
        expect(apiError.message, 'Invitation not found or expired');
      }
    });

    test('acceptInvitation handles 409 already accepted', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Invitation already accepted',
          }))
          ..close();
      });

      try {
        await service.acceptInvitation('USED-CODE');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
      }
    });

    // -------------------------------------------------------------------------
    // removePartner
    // -------------------------------------------------------------------------
    test('removePartner sends DELETE to /accountability/partners/:id',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'deleted': true}))
          ..close();
      });

      final response = await service.removePartner('p-1');

      expect(capturedMethod, 'DELETE');
      expect(capturedPath, '/api/v1/accountability/partners/p-1');
      expect(response.success, isTrue);
    });

    test('removePartner handles 404 for nonexistent partner', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Partner not found',
          }))
          ..close();
      });

      try {
        await service.removePartner('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // nudgePartner
    // -------------------------------------------------------------------------
    test('nudgePartner sends POST to /accountability/nudge/:partnerId',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'nudged': true,
            'partnerId': 'p-1',
          }))
          ..close();
      });

      final response = await service.nudgePartner('p-1');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/accountability/nudge/p-1');
      expect(response.success, isTrue);
      expect(response.data!['nudged'], true);
    });

    test('nudgePartner handles 429 rate limit (1/day)', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 429
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Nudge limit exceeded. Max 1 nudge per partner per day.',
          }))
          ..close();
      });

      try {
        await service.nudgePartner('p-1');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
        expect(apiError.message, contains('Nudge limit'));
      }
    });

    test('nudgePartner handles 404 for nonexistent partner', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Partner not found',
          }))
          ..close();
      });

      try {
        await service.nudgePartner('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // createSharedGoal
    // -------------------------------------------------------------------------
    test('createSharedGoal sends POST to /accountability/goals', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'g-new',
            'title': 'Run 5K',
            'participants': ['user-1', 'user-2'],
          }))
          ..close();
      });

      final response = await service.createSharedGoal({
        'title': 'Run 5K',
        'description': 'Complete a 5K run together',
        'partnerIds': ['user-2'],
        'endDate': '2026-04-01',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/accountability/goals');
      expect(capturedBody!['title'], 'Run 5K');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'g-new');
    });

    test('createSharedGoal sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createAccountabilityService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': 'g-idem'}))
          ..close();
      });

      await service.createSharedGoal(
        {'title': 'Goal'},
        idempotencyKey: 'idem-goal-001',
      );

      expect(capturedIdempotency, 'idem-goal-001');
    });

    // -------------------------------------------------------------------------
    // getGoalProgress
    // -------------------------------------------------------------------------
    test('getGoalProgress sends GET to /accountability/goals/:id/progress',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createAccountabilityService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'goalId': 'g-1',
            'overallProgress': 0.65,
            'participants': [
              {'userId': 'user-1', 'progress': 0.7},
              {'userId': 'user-2', 'progress': 0.6},
            ],
          }))
          ..close();
      });

      final response = await service.getGoalProgress('g-1');

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/accountability/goals/g-1/progress');
      expect(response.success, isTrue);
      expect(response.data!['overallProgress'], 0.65);
    });

    test('getGoalProgress returns per-participant progress', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'goalId': 'g-1',
            'overallProgress': 0.5,
            'participants': [
              {
                'userId': 'user-1',
                'displayName': 'Me',
                'progress': 0.8,
                'tasksCompleted': 8,
                'totalTasks': 10,
              },
              {
                'userId': 'user-2',
                'displayName': 'Alice',
                'progress': 0.2,
                'tasksCompleted': 2,
                'totalTasks': 10,
              },
            ],
          }))
          ..close();
      });

      final response = await service.getGoalProgress('g-1');

      expect(response.success, isTrue);
      final participants =
          response.data!['participants'] as List<dynamic>;
      expect(participants, hasLength(2));
      final me = participants[0] as Map<String, dynamic>;
      expect(me['progress'], 0.8);
      expect(me['tasksCompleted'], 8);
    });

    test('getGoalProgress handles 404 for nonexistent goal', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Goal not found',
          }))
          ..close();
      });

      try {
        await service.getGoalProgress('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    test('getGoalProgress handles 500 server error', () async {
      final service = await createAccountabilityService((req) async {
        req.response
          ..statusCode = 500
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Internal server error',
          }))
          ..close();
      });

      try {
        await service.getGoalProgress('g-1');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    // -------------------------------------------------------------------------
    // Auth header verification
    // -------------------------------------------------------------------------
    test('includes Bearer token in all requests', () async {
      String? capturedAuth;
      final service = await createAccountabilityService((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getPartners();

      expect(capturedAuth, 'Bearer test-token');
    });
  });
}
