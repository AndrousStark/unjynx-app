import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/api_response.dart';
import 'package:test/test.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

/// Fake AuthPort that returns a configurable token.
class FakeAuthPort implements AuthPort {
  String? token;

  FakeAuthPort({this.token = 'test-token-123'});

  @override
  Future<String?> getAccessToken() async => token;

  @override
  Future<String?> getUserId() async => 'user-1';

  @override
  Future<bool> isAuthenticated() async => token != null;

  @override
  Future<String> signIn() async => token ?? '';

  @override
  Future<void> signOut() async {
    token = null;
  }

  @override
  Future<AuthUser?> getUserProfile() async => const AuthUser(id: 'user-1');

  @override
  Future<String> signInWithSocial({
    required String provider,
    required String idToken,
  }) async =>
      token ?? '';

  @override
  String? get selectedOrgId => null;

  @override
  Future<void> setSelectedOrg(String? orgId) async {}

  @override
  Future<bool> isFirstLogin() async => false;

  @override
  Future<void> completeOnboarding() async {}
}

/// Helper to start a local HTTP server that returns controlled responses.
Future<HttpServer> startMockServer(
  Future<void> Function(HttpRequest request) handler,
) async {
  final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
  server.listen(handler);
  return server;
}

/// Encode a JSON response envelope.
String envelope({
  bool success = true,
  Object? data,
  String? error,
  Map<String, dynamic>? meta,
}) {
  return jsonEncode({
    'success': success,
    'data': data,
    'error': error,
    if (meta != null) 'meta': meta,
  });
}

void main() {
  group('ApiConfig', () {
    test('has sensible defaults', () {
      const config = ApiConfig();
      expect(config.baseUrl, 'http://10.0.2.2:3000');
      expect(config.connectTimeout, const Duration(seconds: 10));
      expect(config.receiveTimeout, const Duration(seconds: 30));
    });

    test('development static matches defaults', () {
      expect(ApiConfig.development.baseUrl, 'http://10.0.2.2:3000');
    });

    test('accepts custom values', () {
      const config = ApiConfig(
        baseUrl: 'https://api.unjynx.com',
        connectTimeout: Duration(seconds: 5),
        receiveTimeout: Duration(seconds: 15),
      );
      expect(config.baseUrl, 'https://api.unjynx.com');
      expect(config.connectTimeout, const Duration(seconds: 5));
      expect(config.receiveTimeout, const Duration(seconds: 15));
    });
  });

  group('ApiException', () {
    test('isUnauthorized for 401', () {
      const ex = ApiException(statusCode: 401, message: 'Unauthorized');
      expect(ex.isUnauthorized, isTrue);
      expect(ex.isForbidden, isFalse);
      expect(ex.isNotFound, isFalse);
      expect(ex.isRateLimited, isFalse);
      expect(ex.isServerError, isFalse);
    });

    test('isForbidden for 403', () {
      const ex = ApiException(statusCode: 403, message: 'Forbidden');
      expect(ex.isForbidden, isTrue);
      expect(ex.isUnauthorized, isFalse);
    });

    test('isNotFound for 404', () {
      const ex = ApiException(statusCode: 404, message: 'Not found');
      expect(ex.isNotFound, isTrue);
    });

    test('isRateLimited for 429', () {
      const ex = ApiException(statusCode: 429, message: 'Too many requests');
      expect(ex.isRateLimited, isTrue);
    });

    test('isServerError for 500+', () {
      const ex500 = ApiException(statusCode: 500, message: 'Internal');
      const ex502 = ApiException(statusCode: 502, message: 'Bad gateway');
      const ex503 = ApiException(statusCode: 503, message: 'Unavailable');
      expect(ex500.isServerError, isTrue);
      expect(ex502.isServerError, isTrue);
      expect(ex503.isServerError, isTrue);
    });

    test('toString formats correctly', () {
      const ex = ApiException(statusCode: 422, message: 'Validation failed');
      expect(ex.toString(), 'ApiException(422): Validation failed');
    });

    test('preserves type and errors fields', () {
      const ex = ApiException(
        statusCode: 400,
        message: 'Bad request',
        type: 'https://api.unjynx.com/errors/validation',
        errors: {'title': 'required'},
      );
      expect(ex.type, 'https://api.unjynx.com/errors/validation');
      expect(ex.errors, {'title': 'required'});
    });
  });

  group('ApiResponse', () {
    test('fromJson parses success response with data', () {
      final json = {
        'success': true,
        'data': {'id': '1', 'title': 'Test'},
        'error': null,
      };
      final response = ApiResponse<Map<String, dynamic>>.fromJson(json, null);
      expect(response.success, isTrue);
      expect(response.data, {'id': '1', 'title': 'Test'});
      expect(response.error, isNull);
      expect(response.meta, isNull);
    });

    test('fromJson parses error response', () {
      final json = {
        'success': false,
        'data': null,
        'error': 'Task not found',
      };
      final response = ApiResponse<Map<String, dynamic>>.fromJson(json, null);
      expect(response.success, isFalse);
      expect(response.data, isNull);
      expect(response.error, 'Task not found');
    });

    test('fromJson uses fromData converter', () {
      final json = {
        'success': true,
        'data': {'id': '1', 'title': 'Test'},
        'error': null,
      };
      final response = ApiResponse<String>.fromJson(
        json,
        (d) => (d as Map<String, dynamic>)['title'] as String,
      );
      expect(response.data, 'Test');
    });

    test('fromJson parses pagination meta', () {
      final json = {
        'success': true,
        'data': [1, 2, 3],
        'error': null,
        'meta': {
          'total': 100,
          'page': 2,
          'limit': 20,
          'totalPages': 5,
        },
      };
      final response = ApiResponse<List<dynamic>>.fromJson(json, null);
      expect(response.meta, isNotNull);
      expect(response.meta!.total, 100);
      expect(response.meta!.page, 2);
      expect(response.meta!.limit, 20);
      expect(response.meta!.totalPages, 5);
    });
  });

  group('PaginationMeta', () {
    test('fromJson parses all fields', () {
      final meta = PaginationMeta.fromJson({
        'total': 50,
        'page': 1,
        'limit': 10,
        'totalPages': 5,
      });
      expect(meta.total, 50);
      expect(meta.page, 1);
      expect(meta.limit, 10);
      expect(meta.totalPages, 5);
    });
  });

  group('ApiClient with mock HTTP server', () {
    late HttpServer server;
    late FakeAuthPort auth;
    late ApiClient client;

    setUp(() async {
      auth = FakeAuthPort(token: 'test-bearer-token');
    });

    tearDown(() async {
      await server.close(force: true);
    });

    Future<ApiClient> createClientWithServer(
      Future<void> Function(HttpRequest) handler,
    ) async {
      server = await startMockServer(handler);
      final config = ApiConfig(
        baseUrl: 'http://localhost:${server.port}',
        connectTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      );
      return ApiClient(auth: auth, config: config);
    }

    test('constructs with config and sets base URL', () async {
      client = await createClientWithServer((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {}))
          ..close();
      });

      expect(
        client.dio.options.baseUrl,
        'http://localhost:${server.port}/api/v1',
      );
    });

    test('auth interceptor adds Bearer token', () async {
      String? capturedAuth;
      client = await createClientWithServer((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': '1'}))
          ..close();
      });

      await client.get<dynamic>('/tasks');
      expect(capturedAuth, 'Bearer test-bearer-token');
    });

    test('auth interceptor skips when no token', () async {
      auth.token = null;
      String? capturedAuth;
      client = await createClientWithServer((req) async {
        capturedAuth = req.headers.value('authorization');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {}))
          ..close();
      });

      await client.get<dynamic>('/tasks');
      expect(capturedAuth, isNull);
    });

    test('GET passes query parameters', () async {
      String? capturedUri;
      client = await createClientWithServer((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await client.get<dynamic>('/tasks', queryParameters: {
        'page': 2,
        'limit': 10,
        'status': 'active',
      });

      expect(capturedUri, contains('page=2'));
      expect(capturedUri, contains('limit=10'));
      expect(capturedUri, contains('status=active'));
    });

    test('POST includes idempotency key header', () async {
      String? capturedIdempotency;
      client = await createClientWithServer((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': 'new-1'}))
          ..close();
      });

      await client.post<dynamic>(
        '/tasks',
        data: {'title': 'Test'},
        idempotencyKey: 'idem-abc-123',
      );
      expect(capturedIdempotency, 'idem-abc-123');
    });

    test('PATCH includes idempotency key header', () async {
      String? capturedIdempotency;
      String? capturedMethod;
      client = await createClientWithServer((req) async {
        capturedMethod = req.method;
        capturedIdempotency = req.headers.value('idempotency-key');
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'id': '1', 'title': 'Updated'}))
          ..close();
      });

      await client.patch<dynamic>(
        '/tasks/1',
        data: {'title': 'Updated'},
        idempotencyKey: 'idem-patch-456',
      );
      expect(capturedMethod, 'PATCH');
      expect(capturedIdempotency, 'idem-patch-456');
    });

    test('PUT works correctly', () async {
      String? capturedMethod;
      client = await createClientWithServer((req) async {
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'updated': true}))
          ..close();
      });

      final response = await client.put<dynamic>(
        '/content/preferences',
        data: {'category': 'motivation'},
      );
      expect(capturedMethod, 'PUT');
      expect(response.success, isTrue);
    });

    test('DELETE works correctly', () async {
      String? capturedMethod;
      client = await createClientWithServer((req) async {
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'deleted': true}))
          ..close();
      });

      final response = await client.delete<dynamic>('/tasks/1');
      expect(capturedMethod, 'DELETE');
      expect(response.success, isTrue);
    });

    test('error interceptor wraps 400 into ApiException', () async {
      client = await createClientWithServer((req) async {
        req.response
          ..statusCode = 400
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'type': 'https://api.unjynx.com/errors/validation',
            'errors': {'title': 'required'},
          }))
          ..close();
      });

      try {
        await client.get<dynamic>('/tasks');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 400);
        expect(apiError.message, 'Validation failed');
        expect(apiError.type, 'https://api.unjynx.com/errors/validation');
        expect(apiError.errors, {'title': 'required'});
      }
    });

    test('401 response produces isUnauthorized ApiException', () async {
      client = await createClientWithServer((req) async {
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
        await client.get<dynamic>('/auth/me');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
        expect(apiError.statusCode, 401);
      }
    });

    test('429 response produces isRateLimited ApiException', () async {
      client = await createClientWithServer((req) async {
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
        await client.get<dynamic>('/tasks');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
        expect(apiError.statusCode, 429);
      }
    });

    test('500 response produces isServerError ApiException', () async {
      client = await createClientWithServer((req) async {
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
        await client.get<dynamic>('/tasks');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
        expect(apiError.statusCode, 500);
      }
    });

    test('response with pagination meta is parsed', () async {
      client = await createClientWithServer((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(
            data: [
              {'id': '1', 'title': 'Task 1'},
              {'id': '2', 'title': 'Task 2'},
            ],
            meta: {
              'total': 42,
              'page': 1,
              'limit': 20,
              'totalPages': 3,
            },
          ))
          ..close();
      });

      final response = await client.get<List<dynamic>>('/tasks');
      expect(response.success, isTrue);
      expect(response.meta, isNotNull);
      expect(response.meta!.total, 42);
      expect(response.meta!.totalPages, 3);
    });
  });
}
