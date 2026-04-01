import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/team_api_service.dart';
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

  Future<TeamApiService> createService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return TeamApiService(client);
  }

  group('TeamApiService', () {
    // -----------------------------------------------------------------------
    // getTeams
    // -----------------------------------------------------------------------
    test('getTeams sends GET to /teams', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'id': 'team-1', 'name': 'Engineering'},
            {'id': 'team-2', 'name': 'Design'},
          ]))
          ..close();
      });

      final response = await service.getTeams();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/teams');
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getTeams returns empty list when user has no teams', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getTeams();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -----------------------------------------------------------------------
    // createTeam
    // -----------------------------------------------------------------------
    test('createTeam sends POST to /teams with data', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'team-new',
            'name': 'Backend Team',
            'description': 'Handles API development',
          }))
          ..close();
      });

      final response = await service.createTeam({
        'name': 'Backend Team',
        'description': 'Handles API development',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/teams');
      expect(capturedBody!['name'], 'Backend Team');
      expect(capturedBody!['description'], 'Handles API development');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'team-new');
    });

    test('createTeam sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': 'team-new', 'name': 'DevOps'}))
          ..close();
      });

      await service.createTeam(
        {'name': 'DevOps'},
        idempotencyKey: 'idem-team-001',
      );

      expect(capturedIdempotency, 'idem-team-001');
    });

    test('createTeam handles 422 validation error', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'name': 'Team name is required'},
          }))
          ..close();
      });

      try {
        await service.createTeam({});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors, isNotNull);
        expect(apiError.errors!['name'], 'Team name is required');
      }
    });

    // -----------------------------------------------------------------------
    // getTeam
    // -----------------------------------------------------------------------
    test('getTeam sends GET to /teams/:teamId', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'team-abc',
            'name': 'Engineering',
            'description': 'Core platform team',
            'memberCount': 12,
          }))
          ..close();
      });

      final response = await service.getTeam('team-abc');

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/teams/team-abc');
      expect(response.success, isTrue);
      expect(response.data!['name'], 'Engineering');
      expect(response.data!['memberCount'], 12);
    });

    test('getTeam handles 404 not found', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Team not found',
          }))
          ..close();
      });

      try {
        await service.getTeam('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
        expect(apiError.message, 'Team not found');
      }
    });

    // -----------------------------------------------------------------------
    // updateTeam
    // -----------------------------------------------------------------------
    test('updateTeam sends PATCH to /teams/:teamId with data', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'team-abc',
            'name': 'Engineering v2',
            'description': 'Updated description',
          }))
          ..close();
      });

      final response = await service.updateTeam('team-abc', {
        'name': 'Engineering v2',
        'description': 'Updated description',
      });

      expect(capturedMethod, 'PATCH');
      expect(capturedPath, '/api/v1/teams/team-abc');
      expect(capturedBody!['name'], 'Engineering v2');
      expect(capturedBody!['description'], 'Updated description');
      expect(response.success, isTrue);
      expect(response.data!['name'], 'Engineering v2');
    });

    test('updateTeam handles 403 forbidden', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 403
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Only team admins can update settings',
          }))
          ..close();
      });

      try {
        await service.updateTeam('team-abc', {'name': 'Hack'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isForbidden, isTrue);
        expect(apiError.message, 'Only team admins can update settings');
      }
    });

    // -----------------------------------------------------------------------
    // deleteTeam
    // -----------------------------------------------------------------------
    test('deleteTeam sends DELETE to /teams/:teamId', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'deleted': true}))
          ..close();
      });

      final response = await service.deleteTeam('team-abc');

      expect(capturedMethod, 'DELETE');
      expect(capturedPath, '/api/v1/teams/team-abc');
      expect(response.success, isTrue);
      expect(response.data!['deleted'], true);
    });

    test('deleteTeam handles 404 not found', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Team not found',
          }))
          ..close();
      });

      try {
        await service.deleteTeam('nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // getMembers
    // -----------------------------------------------------------------------
    test('getMembers sends GET to /teams/:teamId/members', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'userId': 'user-1',
              'name': 'Alice',
              'role': 'admin',
              'joinedAt': '2026-01-15T10:00:00Z',
            },
            {
              'userId': 'user-2',
              'name': 'Bob',
              'role': 'member',
              'joinedAt': '2026-02-01T08:30:00Z',
            },
          ]))
          ..close();
      });

      final response = await service.getMembers('team-abc');

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/teams/team-abc/members');
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getMembers returns empty list for team with no members', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getMembers('team-empty');

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    test('getMembers returns full member metadata', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'userId': 'user-1',
              'name': 'Alice',
              'email': 'alice@example.com',
              'role': 'admin',
              'joinedAt': '2026-01-15T10:00:00Z',
              'avatarUrl': 'https://cdn.unjynx.com/avatars/alice.png',
            },
          ]))
          ..close();
      });

      final response = await service.getMembers('team-abc');

      expect(response.success, isTrue);
      final member = response.data![0] as Map<String, dynamic>;
      expect(member['userId'], 'user-1');
      expect(member['role'], 'admin');
      expect(member['email'], 'alice@example.com');
    });

    // -----------------------------------------------------------------------
    // inviteMember
    // -----------------------------------------------------------------------
    test('inviteMember sends POST to /teams/:teamId/invite', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'inviteId': 'inv-123',
            'email': 'newmember@example.com',
            'role': 'member',
            'status': 'pending',
          }))
          ..close();
      });

      final response = await service.inviteMember('team-abc', {
        'email': 'newmember@example.com',
        'role': 'member',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/teams/team-abc/invite');
      expect(capturedBody!['email'], 'newmember@example.com');
      expect(capturedBody!['role'], 'member');
      expect(response.success, isTrue);
      expect(response.data!['inviteId'], 'inv-123');
      expect(response.data!['status'], 'pending');
    });

    test('inviteMember sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'inviteId': 'inv-456',
            'status': 'pending',
          }))
          ..close();
      });

      await service.inviteMember(
        'team-abc',
        {'email': 'bob@example.com', 'role': 'member'},
        idempotencyKey: 'idem-invite-001',
      );

      expect(capturedIdempotency, 'idem-invite-001');
    });

    test('inviteMember handles 409 conflict for duplicate invite', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'User already invited to this team',
          }))
          ..close();
      });

      try {
        await service.inviteMember('team-abc', {
          'email': 'existing@example.com',
          'role': 'member',
        });
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
        expect(apiError.message, 'User already invited to this team');
      }
    });

    // -----------------------------------------------------------------------
    // removeMember
    // -----------------------------------------------------------------------
    test('removeMember sends DELETE to /teams/:teamId/members/:userId',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'removed': true}))
          ..close();
      });

      final response = await service.removeMember('team-abc', 'user-42');

      expect(capturedMethod, 'DELETE');
      expect(capturedPath, '/api/v1/teams/team-abc/members/user-42');
      expect(response.success, isTrue);
      expect(response.data!['removed'], true);
    });

    test('removeMember handles 403 when not admin', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 403
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Only admins can remove members',
          }))
          ..close();
      });

      try {
        await service.removeMember('team-abc', 'user-42');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isForbidden, isTrue);
        expect(apiError.message, 'Only admins can remove members');
      }
    });

    test('removeMember handles 404 for nonexistent member', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Member not found in team',
          }))
          ..close();
      });

      try {
        await service.removeMember('team-abc', 'user-nonexistent');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // updateMemberRole
    // -----------------------------------------------------------------------
    test(
        'updateMemberRole sends PATCH to /teams/:teamId/members/:userId '
        'with role data', () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'userId': 'user-42',
            'role': 'admin',
          }))
          ..close();
      });

      final response = await service.updateMemberRole(
        'team-abc',
        'user-42',
        {'role': 'admin'},
      );

      expect(capturedMethod, 'PATCH');
      expect(capturedPath, '/api/v1/teams/team-abc/members/user-42');
      expect(capturedBody!['role'], 'admin');
      expect(response.success, isTrue);
      expect(response.data!['role'], 'admin');
    });

    test('updateMemberRole handles 422 for invalid role', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'role': 'Invalid role. Must be admin, member, or viewer'},
          }))
          ..close();
      });

      try {
        await service.updateMemberRole(
          'team-abc',
          'user-42',
          {'role': 'superadmin'},
        );
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors!['role'], contains('Invalid role'));
      }
    });

    // -----------------------------------------------------------------------
    // getReport
    // -----------------------------------------------------------------------
    test('getReport sends GET to /teams/:teamId/reports with range param',
        () async {
      String? capturedPath;
      String? capturedMethod;
      String? capturedUri;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'teamId': 'team-abc',
            'range': '7d',
            'tasksCompleted': 45,
            'tasksPending': 12,
            'avgCompletionTime': '2.3h',
            'topPerformers': [
              {'userId': 'user-1', 'completed': 20},
              {'userId': 'user-2', 'completed': 15},
            ],
          }))
          ..close();
      });

      final response = await service.getReport('team-abc');

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/teams/team-abc/reports');
      expect(capturedUri, contains('range=7d'));
      expect(response.success, isTrue);
      expect(response.data!['tasksCompleted'], 45);
    });

    test('getReport uses default range of 7d', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'range': '7d'}))
          ..close();
      });

      await service.getReport('team-abc');

      expect(capturedUri, contains('range=7d'));
    });

    test('getReport accepts custom range parameter', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'range': '30d'}))
          ..close();
      });

      await service.getReport('team-abc', range: '30d');

      expect(capturedUri, contains('range=30d'));
    });

    test('getReport returns full analytics payload', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'teamId': 'team-abc',
            'range': '30d',
            'tasksCompleted': 150,
            'tasksPending': 30,
            'tasksOverdue': 5,
            'avgCompletionTime': '1.8h',
            'completionRate': 0.83,
            'topPerformers': [
              {'userId': 'user-1', 'name': 'Alice', 'completed': 60},
              {'userId': 'user-2', 'name': 'Bob', 'completed': 45},
            ],
            'dailyBreakdown': [
              {'date': '2026-03-01', 'completed': 5},
              {'date': '2026-03-02', 'completed': 8},
            ],
          }))
          ..close();
      });

      final response = await service.getReport('team-abc', range: '30d');

      expect(response.success, isTrue);
      expect(response.data!['completionRate'], 0.83);
      expect(response.data!['topPerformers'], hasLength(2));
      expect(response.data!['dailyBreakdown'], hasLength(2));
    });

    // -----------------------------------------------------------------------
    // getStandups
    // -----------------------------------------------------------------------
    test('getStandups sends GET to /teams/:teamId/standups with limit',
        () async {
      String? capturedPath;
      String? capturedMethod;
      String? capturedUri;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'standup-1',
              'userId': 'user-1',
              'yesterday': 'Fixed auth bug',
              'today': 'Working on reports',
              'blockers': 'None',
              'submittedAt': '2026-03-10T09:00:00Z',
            },
          ]))
          ..close();
      });

      final response = await service.getStandups('team-abc');

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/teams/team-abc/standups');
      expect(capturedUri, contains('limit=7'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getStandups uses default limit of 7', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getStandups('team-abc');

      expect(capturedUri, contains('limit=7'));
    });

    test('getStandups accepts custom limit parameter', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getStandups('team-abc', limit: 30);

      expect(capturedUri, contains('limit=30'));
    });

    test('getStandups returns empty list when no standups submitted',
        () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getStandups('team-abc');

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    test('getStandups returns multiple standups with full metadata', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'standup-1',
              'userId': 'user-1',
              'userName': 'Alice',
              'yesterday': 'Completed API integration',
              'today': 'Starting unit tests',
              'blockers': 'Waiting on design specs',
              'submittedAt': '2026-03-10T09:00:00Z',
            },
            {
              'id': 'standup-2',
              'userId': 'user-2',
              'userName': 'Bob',
              'yesterday': 'Code review',
              'today': 'Bug fixes',
              'blockers': 'None',
              'submittedAt': '2026-03-10T09:15:00Z',
            },
            {
              'id': 'standup-3',
              'userId': 'user-3',
              'userName': 'Charlie',
              'yesterday': 'Database migration',
              'today': 'Performance optimization',
              'blockers': 'Need staging access',
              'submittedAt': '2026-03-10T09:30:00Z',
            },
          ]))
          ..close();
      });

      final response = await service.getStandups('team-abc', limit: 10);

      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
      final first = response.data![0] as Map<String, dynamic>;
      expect(first['userName'], 'Alice');
      expect(first['blockers'], 'Waiting on design specs');
    });

    // -----------------------------------------------------------------------
    // submitStandup
    // -----------------------------------------------------------------------
    test('submitStandup sends POST to /teams/:teamId/standups with data',
        () async {
      String? capturedPath;
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'standup-new',
            'yesterday': 'Fixed login bug',
            'today': 'Working on dashboard',
            'blockers': 'None',
            'submittedAt': '2026-03-11T09:00:00Z',
          }))
          ..close();
      });

      final response = await service.submitStandup('team-abc', {
        'yesterday': 'Fixed login bug',
        'today': 'Working on dashboard',
        'blockers': 'None',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/teams/team-abc/standups');
      expect(capturedBody!['yesterday'], 'Fixed login bug');
      expect(capturedBody!['today'], 'Working on dashboard');
      expect(capturedBody!['blockers'], 'None');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'standup-new');
    });

    test('submitStandup sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'standup-new',
            'submittedAt': '2026-03-11T09:00:00Z',
          }))
          ..close();
      });

      await service.submitStandup(
        'team-abc',
        {'yesterday': 'Test', 'today': 'Test', 'blockers': 'None'},
        idempotencyKey: 'idem-standup-001',
      );

      expect(capturedIdempotency, 'idem-standup-001');
    });

    test('submitStandup handles 422 validation error', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'today': 'Today field is required'},
          }))
          ..close();
      });

      try {
        await service.submitStandup('team-abc', {'yesterday': 'Stuff'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors!['today'], 'Today field is required');
      }
    });

    test('submitStandup handles 409 duplicate standup for today', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Standup already submitted for today',
          }))
          ..close();
      });

      try {
        await service.submitStandup('team-abc', {
          'yesterday': 'Test',
          'today': 'Test',
          'blockers': 'None',
        });
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
        expect(apiError.message, 'Standup already submitted for today');
      }
    });

    // -----------------------------------------------------------------------
    // Auth header verification
    // -----------------------------------------------------------------------
    test('includes Bearer token in all requests', () async {
      String? capturedAuth;
      final service = await createService((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getTeams();

      expect(capturedAuth, 'Bearer test-token');
    });

    // -----------------------------------------------------------------------
    // Error handling
    // -----------------------------------------------------------------------
    test('handles 401 unauthorized across team endpoints', () async {
      final service = await createService((req) async {
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
        await service.getTeams();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    test('handles 500 server error', () async {
      final service = await createService((req) async {
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
        await service.getTeam('team-abc');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    test('handles 429 rate limit', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        if (body.isNotEmpty) jsonDecode(body);
        req.response
          ..statusCode = 429
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Rate limit exceeded',
          }))
          ..close();
      });

      try {
        await service.createTeam({'name': 'Spam Team'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
      }
    });
  });
}
