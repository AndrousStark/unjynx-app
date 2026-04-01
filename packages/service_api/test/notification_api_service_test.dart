import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/notification_api_service.dart';
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

  Future<NotificationApiService> createService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return NotificationApiService(client);
  }

  group('NotificationApiService', () {
    // -----------------------------------------------------------------------
    // getPreferences
    // -----------------------------------------------------------------------
    test('getPreferences sends GET to /notifications/preferences', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'primaryChannel': 'push',
            'fallbackChain': ['push', 'telegram'],
            'timezone': 'UTC',
          }))
          ..close();
      });

      final response = await service.getPreferences();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/notifications/preferences');
      expect(response.success, isTrue);
      expect(response.data!['primaryChannel'], 'push');
    });

    test('getPreferences returns full preferences payload', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'primaryChannel': 'telegram',
            'fallbackChain': ['telegram', 'push', 'email'],
            'timezone': 'Asia/Kolkata',
            'quietStart': '22:00',
            'quietEnd': '07:30',
            'maxRemindersPerDay': 20,
            'digestMode': 'daily',
            'advanceReminderMinutes': 15,
          }))
          ..close();
      });

      final response = await service.getPreferences();

      expect(response.success, isTrue);
      expect(response.data!['timezone'], 'Asia/Kolkata');
      expect(response.data!['fallbackChain'], hasLength(3));
      expect(response.data!['maxRemindersPerDay'], 20);
      expect(response.data!['digestMode'], 'daily');
    });

    test('getPreferences handles 401 unauthorized', () async {
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
        await service.getPreferences();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // updatePreferences
    // -----------------------------------------------------------------------
    test('updatePreferences sends PUT with data', () async {
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'primaryChannel': 'telegram',
            'fallbackChain': ['telegram', 'push'],
          }))
          ..close();
      });

      final response = await service.updatePreferences({
        'primaryChannel': 'telegram',
        'fallbackChain': ['telegram', 'push'],
      });

      expect(capturedMethod, 'PUT');
      expect(capturedBody!['primaryChannel'], 'telegram');
      expect(response.success, isTrue);
    });

    test('updatePreferences sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'primaryChannel': 'push'}))
          ..close();
      });

      await service.updatePreferences(
        {'primaryChannel': 'push'},
        idempotencyKey: 'idem-pref-001',
      );

      expect(capturedIdempotency, 'idem-pref-001');
    });

    test('updatePreferences sends full preferences payload', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: capturedBody))
          ..close();
      });

      final data = {
        'primaryChannel': 'whatsapp',
        'fallbackChain': ['whatsapp', 'sms', 'push'],
        'quietStart': '23:00',
        'quietEnd': '06:00',
        'timezone': 'Asia/Kolkata',
        'maxRemindersPerDay': 30,
        'digestMode': 'weekly',
        'advanceReminderMinutes': 10,
      };
      final response = await service.updatePreferences(data);

      expect(capturedBody!['quietStart'], '23:00');
      expect(capturedBody!['timezone'], 'Asia/Kolkata');
      expect(response.success, isTrue);
    });

    test('updatePreferences handles 422 validation error', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'primaryChannel': 'invalid channel type'},
          }))
          ..close();
      });

      try {
        await service.updatePreferences({'primaryChannel': 'invalid'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors, isNotNull);
        expect(apiError.errors!['primaryChannel'], 'invalid channel type');
      }
    });

    // -----------------------------------------------------------------------
    // getQuota
    // -----------------------------------------------------------------------
    test('getQuota sends GET to /notifications/quota', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'push': {'used': 5, 'limit': 100},
            'telegram': {'used': 2, 'limit': 50},
          }))
          ..close();
      });

      final response = await service.getQuota();

      expect(capturedPath, '/api/v1/notifications/quota');
      expect(response.success, isTrue);
      expect(response.data!['push'], isNotNull);
    });

    test('getQuota returns per-channel usage details', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'push': {'used': 42, 'limit': 100, 'remaining': 58},
            'telegram': {'used': 10, 'limit': 50, 'remaining': 40},
            'email': {'used': 0, 'limit': 20, 'remaining': 20},
            'whatsapp': {'used': 3, 'limit': 10, 'remaining': 7},
            'sms': {'used': 1, 'limit': 5, 'remaining': 4},
          }))
          ..close();
      });

      final response = await service.getQuota();

      expect(response.success, isTrue);
      final pushQuota = response.data!['push'] as Map<String, dynamic>;
      expect(pushQuota['used'], 42);
      expect(pushQuota['limit'], 100);
      expect(pushQuota['remaining'], 58);
      expect(response.data!.keys, hasLength(5));
    });

    test('getQuota handles 500 server error', () async {
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
        await service.getQuota();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // getDeliveryHistory
    // -----------------------------------------------------------------------
    test('getDeliveryHistory sends GET with limit query param', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'id': '1', 'channel': 'push', 'status': 'delivered'},
            {'id': '2', 'channel': 'telegram', 'status': 'failed'},
          ]))
          ..close();
      });

      final response = await service.getDeliveryHistory(limit: 50);

      expect(capturedUri, contains('limit=50'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(2));
    });

    test('getDeliveryHistory uses default limit of 20', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getDeliveryHistory();

      expect(capturedUri, contains('limit=20'));
    });

    test('getDeliveryHistory sends to /notifications/status', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getDeliveryHistory();

      expect(capturedPath, '/api/v1/notifications/status');
    });

    test('getDeliveryHistory returns entries with full metadata', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'notif-1',
              'channel': 'push',
              'status': 'delivered',
              'sentAt': '2026-03-10T14:30:00Z',
              'deliveredAt': '2026-03-10T14:30:01Z',
              'taskTitle': 'Buy groceries',
            },
            {
              'id': 'notif-2',
              'channel': 'telegram',
              'status': 'failed',
              'sentAt': '2026-03-10T14:35:00Z',
              'error': 'Chat not found',
            },
            {
              'id': 'notif-3',
              'channel': 'email',
              'status': 'pending',
              'sentAt': '2026-03-10T14:40:00Z',
            },
          ]))
          ..close();
      });

      final response = await service.getDeliveryHistory(limit: 100);

      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
      final first = response.data![0] as Map<String, dynamic>;
      expect(first['status'], 'delivered');
      expect(first['channel'], 'push');
      final second = response.data![1] as Map<String, dynamic>;
      expect(second['status'], 'failed');
      expect(second['error'], 'Chat not found');
    });

    test('getDeliveryHistory returns empty list when no history', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getDeliveryHistory();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -----------------------------------------------------------------------
    // sendTest
    // -----------------------------------------------------------------------
    test('sendTest sends POST with channel in body', () async {
      String? capturedMethod;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedMethod = req.method;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'sent': true, 'channel': 'push'}))
          ..close();
      });

      final response = await service.sendTest('push');

      expect(capturedMethod, 'POST');
      expect(capturedBody!['channel'], 'push');
      expect(response.success, isTrue);
      expect(response.data!['sent'], true);
    });

    test('sendTest sends to /notifications/send-test', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'sent': true, 'channel': 'telegram'}))
          ..close();
      });

      await service.sendTest('telegram');

      expect(capturedPath, '/api/v1/notifications/send-test');
    });

    test('sendTest works with each channel type', () async {
      const channelTypes = [
        'push', 'telegram', 'email', 'whatsapp',
        'sms', 'instagram', 'slack', 'discord',
      ];

      for (final channelType in channelTypes) {
        Map<String, dynamic>? capturedBody;
        // Create a new server for each channel type
        final localServer = await startMockServer((req) async {
          final body = await utf8.decoder.bind(req).join();
          capturedBody = jsonDecode(body) as Map<String, dynamic>;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {'sent': true, 'channel': channelType}))
            ..close();
        });

        final config = ApiConfig(
          baseUrl: 'http://localhost:${localServer.port}',
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        );
        final client = ApiClient(auth: auth, config: config);
        final service = NotificationApiService(client);

        final response = await service.sendTest(channelType);

        expect(response.success, isTrue,
            reason: 'sendTest should succeed for $channelType');
        expect(capturedBody!['channel'], channelType,
            reason: 'Body should contain channel=$channelType');

        await localServer.close(force: true);
      }
    });

    test('sendTest handles 429 rate limit', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 429
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Rate limit exceeded. Max 5 test sends per hour.',
          }))
          ..close();
      });

      try {
        await service.sendTest('push');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
        expect(apiError.message, contains('Rate limit'));
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
          ..write(envelope(data: {}))
          ..close();
      });

      await service.getPreferences();

      expect(capturedAuth, 'Bearer test-token');
    });
  });
}
