import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/channel_api_service.dart';
import 'package:test/test.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

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

  Future<ChannelApiService> createService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return ChannelApiService(client);
  }

  group('ChannelApiService', () {
    // -----------------------------------------------------------------------
    // getChannels
    // -----------------------------------------------------------------------
    test('getChannels sends GET to /channels', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'type': 'push',
              'identifier': 'token_abc',
              'isConnected': true,
            },
          ]))
          ..close();
      });

      final response = await service.getChannels();

      expect(capturedPath, '/api/v1/channels');
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getChannels returns multiple connected channels', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'type': 'push',
              'identifier': 'fcm_token_abc',
              'isConnected': true,
            },
            {
              'type': 'telegram',
              'identifier': 'chat_123',
              'isConnected': true,
            },
            {
              'type': 'email',
              'identifier': 'user@example.com',
              'isConnected': false,
            },
          ]))
          ..close();
      });

      final response = await service.getChannels();

      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
    });

    test('getChannels returns empty list when no channels configured',
        () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getChannels();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    // -----------------------------------------------------------------------
    // connectPush
    // -----------------------------------------------------------------------
    test('connectPush sends POST to /channels/push/connect', () async {
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
            'type': 'push',
            'identifier': 'token_xyz',
            'isConnected': true,
          }))
          ..close();
      });

      final response = await service.connectPush('token_xyz');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/channels/push/connect');
      expect(capturedBody!['token'], 'token_xyz');
      expect(response.success, isTrue);
    });

    // -----------------------------------------------------------------------
    // connectTelegram
    // -----------------------------------------------------------------------
    test('connectTelegram sends POST to /channels/telegram/connect', () async {
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
            'type': 'telegram',
            'identifier': 'tg_verify_token',
            'isConnected': true,
          }))
          ..close();
      });

      final response = await service.connectTelegram('tg_verify_token');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/channels/telegram/connect');
      expect(capturedBody!['token'], 'tg_verify_token');
      expect(response.success, isTrue);
      expect(response.data!['type'], 'telegram');
    });

    // -----------------------------------------------------------------------
    // connectWhatsApp
    // -----------------------------------------------------------------------
    test('connectWhatsApp sends phoneNumber and countryCode', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'whatsapp',
            'identifier': '+919800000000',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectWhatsApp(
        phoneNumber: '9800000000',
        countryCode: '+91',
      );

      expect(capturedBody!['phoneNumber'], '9800000000');
      expect(capturedBody!['countryCode'], '+91');
    });

    test('connectWhatsApp sends to /channels/whatsapp/connect', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        final body = await utf8.decoder.bind(req).join();
        // consume body to prevent stream errors
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'whatsapp',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectWhatsApp(
        phoneNumber: '1234567890',
        countryCode: '+1',
      );

      expect(capturedPath, '/api/v1/channels/whatsapp/connect');
    });

    // -----------------------------------------------------------------------
    // connectEmail
    // -----------------------------------------------------------------------
    test('connectEmail sends email in body', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'email',
            'identifier': 'test@example.com',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectEmail('test@example.com');

      expect(capturedBody!['email'], 'test@example.com');
    });

    test('connectEmail sends to /channels/email/connect', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'email',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectEmail('admin@unjynx.com');

      expect(capturedPath, '/api/v1/channels/email/connect');
    });

    // -----------------------------------------------------------------------
    // connectSms
    // -----------------------------------------------------------------------
    test('connectSms sends phoneNumber and countryCode', () async {
      String? capturedPath;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'sms',
            'identifier': '+919876543210',
            'isConnected': true,
          }))
          ..close();
      });

      final response = await service.connectSms(
        phoneNumber: '9876543210',
        countryCode: '+91',
      );

      expect(capturedPath, '/api/v1/channels/sms/connect');
      expect(capturedBody!['phoneNumber'], '9876543210');
      expect(capturedBody!['countryCode'], '+91');
      expect(response.success, isTrue);
      expect(response.data!['type'], 'sms');
    });

    // -----------------------------------------------------------------------
    // connectInstagram
    // -----------------------------------------------------------------------
    test('connectInstagram sends username in body', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'instagram',
            'identifier': 'myuser',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectInstagram('myuser');

      expect(capturedBody!['username'], 'myuser');
    });

    test('connectInstagram sends to /channels/instagram/connect', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'instagram',
            'isConnected': true,
          }))
          ..close();
      });

      await service.connectInstagram('@unjynx_official');

      expect(capturedPath, '/api/v1/channels/instagram/connect');
    });

    // -----------------------------------------------------------------------
    // connectOAuth (slack, discord)
    // -----------------------------------------------------------------------
    test('connectOAuth sends POST to /channels/slack/connect', () async {
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
            'type': 'slack',
            'identifier': 'slack_oauth_token',
            'isConnected': true,
          }))
          ..close();
      });

      final response =
          await service.connectOAuth('slack', 'slack_oauth_token');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/channels/slack/connect');
      expect(capturedBody!['token'], 'slack_oauth_token');
      expect(response.success, isTrue);
      expect(response.data!['type'], 'slack');
    });

    test('connectOAuth sends POST to /channels/discord/connect', () async {
      String? capturedPath;
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'type': 'discord',
            'identifier': 'discord_bot_token',
            'isConnected': true,
          }))
          ..close();
      });

      final response =
          await service.connectOAuth('discord', 'discord_bot_token');

      expect(capturedPath, '/api/v1/channels/discord/connect');
      expect(capturedBody!['token'], 'discord_bot_token');
      expect(response.success, isTrue);
    });

    // -----------------------------------------------------------------------
    // testChannel
    // -----------------------------------------------------------------------
    test('testChannel sends POST to /channels/:type/test', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'success': true, 'channel': 'telegram'}))
          ..close();
      });

      final response = await service.testChannel('telegram');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/channels/telegram/test');
      expect(response.success, isTrue);
    });

    test('testChannel works for push channel', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'success': true, 'channel': 'push'}))
          ..close();
      });

      final response = await service.testChannel('push');

      expect(capturedPath, '/api/v1/channels/push/test');
      expect(response.success, isTrue);
    });

    test('testChannel works for whatsapp channel', () async {
      String? capturedPath;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'success': true, 'channel': 'whatsapp'}))
          ..close();
      });

      final response = await service.testChannel('whatsapp');

      expect(capturedPath, '/api/v1/channels/whatsapp/test');
      expect(response.success, isTrue);
    });

    // -----------------------------------------------------------------------
    // disconnectChannel
    // -----------------------------------------------------------------------
    test('disconnectChannel sends DELETE to /channels/:type', () async {
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

      final response = await service.disconnectChannel('email');

      expect(capturedMethod, 'DELETE');
      expect(capturedPath, '/api/v1/channels/email');
      expect(response.success, isTrue);
    });

    test('disconnectChannel for telegram', () async {
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

      final response = await service.disconnectChannel('telegram');

      expect(capturedMethod, 'DELETE');
      expect(capturedPath, '/api/v1/channels/telegram');
      expect(response.success, isTrue);
    });

    test('disconnectChannel handles 404 for non-connected channel', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Channel not found',
          }))
          ..close();
      });

      try {
        await service.disconnectChannel('slack');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
        expect(apiError.message, 'Channel not found');
      }
    });

    // -----------------------------------------------------------------------
    // getTelegramBotLink
    // -----------------------------------------------------------------------
    test('getTelegramBotLink returns deep link with userId', () async {
      // No server needed for this method
      server = await startMockServer((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {}))
          ..close();
      });

      final config = ApiConfig(
        baseUrl: 'http://localhost:${server.port}',
      );
      final client = ApiClient(auth: auth, config: config);
      final service = ChannelApiService(client);

      final link = service.getTelegramBotLink('user-123');

      expect(link, 'https://t.me/unjynx_bot?start=user-123');
    });

    test('getTelegramBotLink encodes userId in URL', () async {
      server = await startMockServer((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {}))
          ..close();
      });

      final config = ApiConfig(
        baseUrl: 'http://localhost:${server.port}',
      );
      final client = ApiClient(auth: auth, config: config);
      final service = ChannelApiService(client);

      final link = service.getTelegramBotLink('abc-def-123');

      expect(link, contains('start=abc-def-123'));
      expect(link, startsWith('https://t.me/unjynx_bot?'));
    });

    // -----------------------------------------------------------------------
    // Error handling
    // -----------------------------------------------------------------------
    test('handles 400 error response gracefully', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 400
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Push token is required',
          }))
          ..close();
      });

      expect(
        () => service.connectPush(''),
        throwsA(anything),
      );
    });

    test('handles 401 unauthorized error', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 401
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Authentication required',
          }))
          ..close();
      });

      try {
        await service.getChannels();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    test('handles 500 server error on connect', () async {
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
        await service.connectEmail('test@example.com');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // Auth header verification
    // -----------------------------------------------------------------------
    test('includes Bearer token in requests', () async {
      String? capturedAuth;
      final service = await createService((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getChannels();

      expect(capturedAuth, 'Bearer test-token');
    });
  });
}
