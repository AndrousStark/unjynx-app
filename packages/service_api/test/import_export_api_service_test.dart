import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/import_export_api_service.dart';
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

  Future<ImportExportApiService> createService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return ImportExportApiService(client);
  }

  group('ImportExportApiService', () {
    // -----------------------------------------------------------------------
    // previewImport
    // -----------------------------------------------------------------------
    group('previewImport', () {
      test('sends POST to /import/preview', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body); // consume body
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'rows': 10,
              'columns': ['title', 'dueDate', 'priority'],
              'preview': [
                {'title': 'Task 1', 'dueDate': '2026-04-01'},
              ],
            }))
            ..close();
        });

        final response = await service.previewImport({
          'format': 'csv',
          'content': 'title,dueDate\nTask 1,2026-04-01',
        });

        expect(capturedMethod, 'POST');
        expect(capturedPath, '/api/v1/import/preview');
        expect(response.success, isTrue);
        expect(response.data!['rows'], 10);
      });

      test('sends data payload in request body', () async {
        Map<String, dynamic>? capturedBody;
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          capturedBody = jsonDecode(body) as Map<String, dynamic>;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'rows': 5,
              'columns': ['title'],
              'preview': [],
            }))
            ..close();
        });

        await service.previewImport({
          'format': 'json',
          'content': '[{"title":"Buy milk"}]',
        });

        expect(capturedBody, isNotNull);
        expect(capturedBody!['format'], 'json');
        expect(capturedBody!['content'], '[{"title":"Buy milk"}]');
      });

      test('returns parsed preview with column mapping', () async {
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'rows': 3,
              'columns': ['title', 'dueDate', 'priority', 'project'],
              'preview': [
                {
                  'title': 'Task A',
                  'dueDate': '2026-04-01',
                  'priority': 'high',
                  'project': 'Work',
                },
                {
                  'title': 'Task B',
                  'dueDate': '2026-04-02',
                  'priority': 'low',
                  'project': 'Personal',
                },
                {
                  'title': 'Task C',
                  'dueDate': null,
                  'priority': 'medium',
                  'project': null,
                },
              ],
            }))
            ..close();
        });

        final response = await service.previewImport({
          'format': 'csv',
          'content': 'title,dueDate,priority,project\nTask A,...',
        });

        expect(response.success, isTrue);
        expect(response.data!['columns'], hasLength(4));
        final preview = response.data!['preview'] as List;
        expect(preview, hasLength(3));
        expect(
          (preview[0] as Map<String, dynamic>)['title'],
          'Task A',
        );
      });

      test('handles 400 for invalid import data', () async {
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 400
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Invalid CSV format',
            }))
            ..close();
        });

        try {
          await service.previewImport({'format': 'csv', 'content': ''});
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.statusCode, 400);
          expect(apiError.message, 'Invalid CSV format');
        }
      });

      test('handles 422 with field-level validation errors', () async {
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 422
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Validation failed',
              'errors': {
                'format': 'must be csv or json',
                'content': 'required',
              },
            }))
            ..close();
        });

        try {
          await service.previewImport({'format': 'xml'});
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.statusCode, 422);
          expect(apiError.errors, isNotNull);
          expect(apiError.errors!['format'], 'must be csv or json');
          expect(apiError.errors!['content'], 'required');
        }
      });
    });

    // -----------------------------------------------------------------------
    // executeImport
    // -----------------------------------------------------------------------
    group('executeImport', () {
      test('sends POST to /import/execute', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'imported': 10,
              'skipped': 2,
              'errors': [],
            }))
            ..close();
        });

        final response = await service.executeImport({
          'mapping': {'col1': 'title', 'col2': 'dueDate'},
          'rows': [
            {'col1': 'Task 1', 'col2': '2026-04-01'},
          ],
        });

        expect(capturedMethod, 'POST');
        expect(capturedPath, '/api/v1/import/execute');
        expect(response.success, isTrue);
        expect(response.data!['imported'], 10);
      });

      test('sends data payload in request body', () async {
        Map<String, dynamic>? capturedBody;
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          capturedBody = jsonDecode(body) as Map<String, dynamic>;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'imported': 5,
              'skipped': 0,
              'errors': [],
            }))
            ..close();
        });

        await service.executeImport({
          'mapping': {'title': 'title'},
          'rows': [
            {'title': 'Buy groceries'},
            {'title': 'Clean house'},
          ],
        });

        expect(capturedBody, isNotNull);
        expect(capturedBody!['mapping'], isNotNull);
        final rows = capturedBody!['rows'] as List;
        expect(rows, hasLength(2));
      });

      test('sends idempotency key when provided', () async {
        String? capturedIdempotency;
        final service = await createService((req) async {
          capturedIdempotency = req.headers.value('idempotency-key');
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'imported': 3,
              'skipped': 0,
              'errors': [],
            }))
            ..close();
        });

        await service.executeImport(
          {'mapping': {}, 'rows': []},
          idempotencyKey: 'import-abc-123',
        );

        expect(capturedIdempotency, 'import-abc-123');
      });

      test('does not send idempotency key when not provided', () async {
        String? capturedIdempotency;
        final service = await createService((req) async {
          capturedIdempotency = req.headers.value('idempotency-key');
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'imported': 0,
              'skipped': 0,
              'errors': [],
            }))
            ..close();
        });

        await service.executeImport({'mapping': {}, 'rows': []});

        expect(capturedIdempotency, isNull);
      });

      test('returns import result with errors', () async {
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'imported': 8,
              'skipped': 2,
              'errors': [
                {'row': 3, 'error': 'Invalid date format'},
                {'row': 7, 'error': 'Title too long'},
              ],
            }))
            ..close();
        });

        final response = await service.executeImport({
          'mapping': {'col1': 'title'},
          'rows': List.generate(10, (i) => {'col1': 'Task $i'}),
        });

        expect(response.success, isTrue);
        expect(response.data!['imported'], 8);
        expect(response.data!['skipped'], 2);
        final errors = response.data!['errors'] as List;
        expect(errors, hasLength(2));
      });

      test('handles 500 server error', () async {
        final service = await createService((req) async {
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 500
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Import processing failed',
            }))
            ..close();
        });

        try {
          await service.executeImport({'mapping': {}, 'rows': []});
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isServerError, isTrue);
          expect(apiError.message, 'Import processing failed');
        }
      });
    });

    // -----------------------------------------------------------------------
    // exportCsv
    // -----------------------------------------------------------------------
    group('exportCsv', () {
      test('sends GET to /export/csv', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'title,dueDate\nTask 1,2026-04-01'))
            ..close();
        });

        final response = await service.exportCsv();

        expect(capturedMethod, 'GET');
        expect(capturedPath, '/api/v1/export/csv');
        expect(response.success, isTrue);
      });

      test('sends project query parameter when provided', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'title\nTask 1'))
            ..close();
        });

        await service.exportCsv(project: 'work-project-id');

        expect(capturedUri, contains('project=work-project-id'));
      });

      test('sends dateFrom and dateTo query parameters', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'title\nTask 1'))
            ..close();
        });

        await service.exportCsv(
          dateFrom: '2026-01-01',
          dateTo: '2026-03-31',
        );

        expect(capturedUri, contains('dateFrom=2026-01-01'));
        expect(capturedUri, contains('dateTo=2026-03-31'));
      });

      test('sends all query parameters together', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'title\nFiltered Task'))
            ..close();
        });

        await service.exportCsv(
          project: 'proj-42',
          dateFrom: '2026-02-01',
          dateTo: '2026-02-28',
        );

        expect(capturedUri, contains('project=proj-42'));
        expect(capturedUri, contains('dateFrom=2026-02-01'));
        expect(capturedUri, contains('dateTo=2026-02-28'));
      });

      test('does not send query parameters when none provided', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'title\nAll Tasks'))
            ..close();
        });

        await service.exportCsv();

        expect(capturedUri, isNot(contains('project=')));
        expect(capturedUri, isNot(contains('dateFrom=')));
        expect(capturedUri, isNot(contains('dateTo=')));
      });

      test('handles 401 unauthorized', () async {
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
          await service.exportCsv();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isUnauthorized, isTrue);
        }
      });
    });

    // -----------------------------------------------------------------------
    // exportJson
    // -----------------------------------------------------------------------
    group('exportJson', () {
      test('sends GET to /export/json', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'tasks': [
                {'id': '1', 'title': 'Task 1'},
              ],
              'projects': [
                {'id': 'p1', 'name': 'Project 1'},
              ],
            }))
            ..close();
        });

        final response = await service.exportJson();

        expect(capturedMethod, 'GET');
        expect(capturedPath, '/api/v1/export/json');
        expect(response.success, isTrue);
      });

      test('returns full GDPR-compliant data export', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'tasks': [
                {'id': '1', 'title': 'Task 1', 'status': 'active'},
                {'id': '2', 'title': 'Task 2', 'status': 'completed'},
              ],
              'projects': [
                {'id': 'p1', 'name': 'Work'},
              ],
              'tags': [
                {'id': 't1', 'name': 'urgent'},
              ],
              'profile': {
                'id': 'user-1',
                'email': 'user@example.com',
              },
            }))
            ..close();
        });

        final response = await service.exportJson();

        expect(response.success, isTrue);
        final data = response.data as Map<String, dynamic>;
        expect(data['tasks'], hasLength(2));
        expect(data['projects'], hasLength(1));
        expect(data['tags'], hasLength(1));
        expect(data['profile'], isNotNull);
      });

      test('handles 500 server error', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 500
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Export generation failed',
            }))
            ..close();
        });

        try {
          await service.exportJson();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isServerError, isTrue);
        }
      });
    });

    // -----------------------------------------------------------------------
    // exportIcs
    // -----------------------------------------------------------------------
    group('exportIcs', () {
      test('sends GET to /export/ics', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(
              data: 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
            ))
            ..close();
        });

        final response = await service.exportIcs();

        expect(capturedMethod, 'GET');
        expect(capturedPath, '/api/v1/export/ics');
        expect(response.success, isTrue);
      });

      test('sends project query parameter when provided', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'BEGIN:VCALENDAR\nEND:VCALENDAR'))
            ..close();
        });

        await service.exportIcs(project: 'personal-proj');

        expect(capturedUri, contains('project=personal-proj'));
      });

      test('sends dateFrom and dateTo query parameters', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'BEGIN:VCALENDAR\nEND:VCALENDAR'))
            ..close();
        });

        await service.exportIcs(
          dateFrom: '2026-01-01',
          dateTo: '2026-12-31',
        );

        expect(capturedUri, contains('dateFrom=2026-01-01'));
        expect(capturedUri, contains('dateTo=2026-12-31'));
      });

      test('sends all query parameters together', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'BEGIN:VCALENDAR\nEND:VCALENDAR'))
            ..close();
        });

        await service.exportIcs(
          project: 'proj-99',
          dateFrom: '2026-06-01',
          dateTo: '2026-06-30',
        );

        expect(capturedUri, contains('project=proj-99'));
        expect(capturedUri, contains('dateFrom=2026-06-01'));
        expect(capturedUri, contains('dateTo=2026-06-30'));
      });

      test('does not send query parameters when none provided', () async {
        String? capturedUri;
        final service = await createService((req) async {
          capturedUri = req.uri.toString();
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'BEGIN:VCALENDAR\nEND:VCALENDAR'))
            ..close();
        });

        await service.exportIcs();

        expect(capturedUri, isNot(contains('project=')));
        expect(capturedUri, isNot(contains('dateFrom=')));
        expect(capturedUri, isNot(contains('dateTo=')));
      });

      test('handles 429 rate limit', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 429
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Export rate limit exceeded',
            }))
            ..close();
        });

        try {
          await service.exportIcs();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isRateLimited, isTrue);
          expect(apiError.message, 'Export rate limit exceeded');
        }
      });
    });

    // -----------------------------------------------------------------------
    // requestDataExport
    // -----------------------------------------------------------------------
    group('requestDataExport', () {
      test('sends POST to /data/request', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'requestId': 'export-req-001',
              'status': 'pending',
              'estimatedCompletion': '2026-03-14T00:00:00Z',
            }))
            ..close();
        });

        final response = await service.requestDataExport();

        expect(capturedMethod, 'POST');
        expect(capturedPath, '/api/v1/data/request');
        expect(response.success, isTrue);
        expect(response.data!['requestId'], 'export-req-001');
        expect(response.data!['status'], 'pending');
      });

      test('returns estimated completion time within 72h', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'requestId': 'gdpr-export-42',
              'status': 'queued',
              'estimatedCompletion': '2026-03-14T12:00:00Z',
              'message':
                  'Your data export has been queued. You will receive an email when ready.',
            }))
            ..close();
        });

        final response = await service.requestDataExport();

        expect(response.success, isTrue);
        expect(response.data!['status'], 'queued');
        expect(response.data!['estimatedCompletion'], isNotNull);
        expect(response.data!['message'], contains('queued'));
      });

      test('handles 401 unauthorized', () async {
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
          await service.requestDataExport();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isUnauthorized, isTrue);
        }
      });

      test('handles 429 rate limit for repeated requests', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 429
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Data export already in progress',
            }))
            ..close();
        });

        try {
          await service.requestDataExport();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isRateLimited, isTrue);
          expect(apiError.message, 'Data export already in progress');
        }
      });
    });

    // -----------------------------------------------------------------------
    // deleteAccount
    // -----------------------------------------------------------------------
    group('deleteAccount', () {
      test('sends DELETE to /data/account', () async {
        String? capturedPath;
        String? capturedMethod;
        final service = await createService((req) async {
          capturedPath = req.uri.path;
          capturedMethod = req.method;
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'status': 'scheduled',
              'deletionDate': '2026-04-10T00:00:00Z',
              'gracePeriodDays': 30,
            }))
            ..close();
        });

        final response = await service.deleteAccount();

        expect(capturedMethod, 'DELETE');
        expect(capturedPath, '/api/v1/data/account');
        expect(response.success, isTrue);
        expect(response.data!['status'], 'scheduled');
      });

      test('returns 30-day grace period info', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {
              'status': 'scheduled',
              'deletionDate': '2026-04-10T00:00:00Z',
              'gracePeriodDays': 30,
              'message':
                  'Account scheduled for deletion. You can cancel within 30 days.',
            }))
            ..close();
        });

        final response = await service.deleteAccount();

        expect(response.success, isTrue);
        expect(response.data!['gracePeriodDays'], 30);
        expect(response.data!['deletionDate'], '2026-04-10T00:00:00Z');
        expect(response.data!['message'], contains('30 days'));
      });

      test('handles 401 unauthorized', () async {
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
          await service.deleteAccount();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isUnauthorized, isTrue);
        }
      });

      test('handles 403 forbidden for restricted accounts', () async {
        final service = await createService((req) async {
          req.response
            ..statusCode = 403
            ..headers.contentType = ContentType.json
            ..write(jsonEncode({
              'success': false,
              'error': 'Team owner cannot delete account without transferring',
            }))
            ..close();
        });

        try {
          await service.deleteAccount();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isForbidden, isTrue);
          expect(apiError.message, contains('Team owner'));
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
          await service.deleteAccount();
          fail('Expected DioException');
        } on DioException catch (e) {
          final apiError = e.error as ApiException;
          expect(apiError.isServerError, isTrue);
        }
      });
    });

    // -----------------------------------------------------------------------
    // Auth header verification
    // -----------------------------------------------------------------------
    group('auth header', () {
      test('includes Bearer token in GET requests', () async {
        String? capturedAuth;
        final service = await createService((req) async {
          capturedAuth = req.headers.value('authorization');
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: 'csv-content'))
            ..close();
        });

        await service.exportCsv();

        expect(capturedAuth, 'Bearer test-token');
      });

      test('includes Bearer token in POST requests', () async {
        String? capturedAuth;
        final service = await createService((req) async {
          capturedAuth = req.headers.value('authorization');
          final body = await utf8.decoder.bind(req).join();
          jsonDecode(body);
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {'rows': 0, 'columns': [], 'preview': []}))
            ..close();
        });

        await service.previewImport({'format': 'csv', 'content': ''});

        expect(capturedAuth, 'Bearer test-token');
      });

      test('includes Bearer token in DELETE requests', () async {
        String? capturedAuth;
        final service = await createService((req) async {
          capturedAuth = req.headers.value('authorization');
          req.response
            ..statusCode = 200
            ..headers.contentType = ContentType.json
            ..write(envelope(data: {'status': 'scheduled'}))
            ..close();
        });

        await service.deleteAccount();

        expect(capturedAuth, 'Bearer test-token');
      });
    });
  });
}
