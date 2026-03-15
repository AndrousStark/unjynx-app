import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:service_api/src/api_client.dart';
import 'package:service_api/src/api_config.dart';
import 'package:service_api/src/api_exception.dart';
import 'package:service_api/src/services/billing_api_service.dart';
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

  Future<BillingApiService> createService(
    Future<void> Function(HttpRequest) handler,
  ) async {
    server = await startMockServer(handler);
    final config = ApiConfig(
      baseUrl: 'http://localhost:${server.port}',
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    );
    final client = ApiClient(auth: auth, config: config);
    return BillingApiService(client);
  }

  group('BillingApiService', () {
    // -----------------------------------------------------------------------
    // getSubscription
    // -----------------------------------------------------------------------
    test('getSubscription sends GET to /billing/subscription', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-001',
            'planId': 'pro-monthly',
            'status': 'active',
            'currentPeriodEnd': '2026-04-10T00:00:00Z',
          }))
          ..close();
      });

      final response = await service.getSubscription();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/billing/subscription');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'sub-001');
    });

    test('getSubscription returns full subscription details', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-002',
            'planId': 'pro-annual',
            'status': 'active',
            'billingPeriod': 'annual',
            'currentPeriodStart': '2026-03-10T00:00:00Z',
            'currentPeriodEnd': '2027-03-10T00:00:00Z',
            'cancelAtPeriodEnd': false,
            'trialEnd': null,
          }))
          ..close();
      });

      final response = await service.getSubscription();

      expect(response.success, isTrue);
      expect(response.data!['planId'], 'pro-annual');
      expect(response.data!['billingPeriod'], 'annual');
      expect(response.data!['cancelAtPeriodEnd'], false);
      expect(response.data!['trialEnd'], isNull);
    });

    test('getSubscription returns null data for free tier users', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': null,
            'planId': 'free',
            'status': 'none',
          }))
          ..close();
      });

      final response = await service.getSubscription();

      expect(response.success, isTrue);
      expect(response.data!['status'], 'none');
    });

    test('getSubscription handles 401 unauthorized', () async {
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
        await service.getSubscription();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // getPlans
    // -----------------------------------------------------------------------
    test('getPlans sends GET to /billing/plans', () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {'id': 'free', 'name': 'Free', 'price': 0},
            {'id': 'pro-monthly', 'name': 'Pro Monthly', 'price': 699},
            {'id': 'pro-annual', 'name': 'Pro Annual', 'price': 5988},
          ]))
          ..close();
      });

      final response = await service.getPlans();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/billing/plans');
      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
    });

    test('getPlans returns full plan details', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'free',
              'name': 'Free',
              'price': 0,
              'currency': 'USD',
              'features': ['5 tasks', 'push only'],
            },
            {
              'id': 'pro-monthly',
              'name': 'Pro',
              'price': 699,
              'currency': 'USD',
              'billingPeriod': 'monthly',
              'features': [
                'unlimited tasks',
                'all channels',
                'AI insights',
              ],
            },
            {
              'id': 'team-monthly',
              'name': 'Team',
              'price': 899,
              'currency': 'USD',
              'billingPeriod': 'monthly',
              'features': [
                'everything in Pro',
                'team collaboration',
                'admin panel',
              ],
            },
            {
              'id': 'family-monthly',
              'name': 'Family',
              'price': 999,
              'currency': 'USD',
              'billingPeriod': 'monthly',
              'maxMembers': 5,
            },
          ]))
          ..close();
      });

      final response = await service.getPlans();

      expect(response.success, isTrue);
      expect(response.data, hasLength(4));
      final freePlan = response.data![0] as Map<String, dynamic>;
      expect(freePlan['price'], 0);
      final proPlan = response.data![1] as Map<String, dynamic>;
      expect(proPlan['features'], hasLength(3));
    });

    test('getPlans returns empty list when no plans available', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getPlans();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    test('getPlans handles 500 server error', () async {
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
        await service.getPlans();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // subscribe
    // -----------------------------------------------------------------------
    test('subscribe sends POST to /billing/subscribe', () async {
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
            'id': 'sub-new-001',
            'planId': 'pro-monthly',
            'status': 'active',
          }))
          ..close();
      });

      final response = await service.subscribe({
        'planId': 'pro-monthly',
        'billingPeriod': 'monthly',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/billing/subscribe');
      expect(capturedBody!['planId'], 'pro-monthly');
      expect(capturedBody!['billingPeriod'], 'monthly');
      expect(response.success, isTrue);
      expect(response.data!['id'], 'sub-new-001');
    });

    test('subscribe sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-idem-001',
            'planId': 'pro-annual',
            'status': 'active',
          }))
          ..close();
      });

      await service.subscribe(
        {'planId': 'pro-annual', 'billingPeriod': 'annual'},
        idempotencyKey: 'idem-subscribe-001',
      );

      expect(capturedIdempotency, 'idem-subscribe-001');
    });

    test('subscribe without idempotency key omits header', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-no-idem',
            'planId': 'pro-monthly',
            'status': 'active',
          }))
          ..close();
      });

      await service.subscribe({
        'planId': 'pro-monthly',
        'billingPeriod': 'monthly',
      });

      expect(capturedIdempotency, isNull);
    });

    test('subscribe with coupon code in data', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-coupon-001',
            'planId': 'pro-annual',
            'status': 'active',
            'discount': 20,
          }))
          ..close();
      });

      final response = await service.subscribe({
        'planId': 'pro-annual',
        'billingPeriod': 'annual',
        'couponCode': 'SAVE20',
      });

      expect(capturedBody!['couponCode'], 'SAVE20');
      expect(response.data!['discount'], 20);
    });

    test('subscribe handles 422 validation error', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'planId': 'invalid plan'},
          }))
          ..close();
      });

      try {
        await service.subscribe({'planId': 'nonexistent'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors, isNotNull);
        expect(apiError.errors!['planId'], 'invalid plan');
      }
    });

    test('subscribe handles 402 payment required', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 402
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Payment method required',
          }))
          ..close();
      });

      try {
        await service.subscribe({
          'planId': 'pro-monthly',
          'billingPeriod': 'monthly',
        });
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 402);
        expect(apiError.message, 'Payment method required');
      }
    });

    // -----------------------------------------------------------------------
    // cancelSubscription
    // -----------------------------------------------------------------------
    test('cancelSubscription sends POST to /billing/subscription/cancel',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-001',
            'status': 'canceled',
            'cancelAtPeriodEnd': true,
          }))
          ..close();
      });

      final response = await service.cancelSubscription();

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/billing/subscription/cancel');
      expect(response.success, isTrue);
      expect(response.data!['status'], 'canceled');
      expect(response.data!['cancelAtPeriodEnd'], true);
    });

    test('cancelSubscription handles 404 when no active subscription',
        () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'No active subscription found',
          }))
          ..close();
      });

      try {
        await service.cancelSubscription();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
        expect(apiError.message, 'No active subscription found');
      }
    });

    test('cancelSubscription handles 409 already canceled', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Subscription already canceled',
          }))
          ..close();
      });

      try {
        await service.cancelSubscription();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
        expect(apiError.message, 'Subscription already canceled');
      }
    });

    // -----------------------------------------------------------------------
    // resumeSubscription
    // -----------------------------------------------------------------------
    test('resumeSubscription sends POST to /billing/subscription/resume',
        () async {
      String? capturedPath;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-001',
            'status': 'active',
            'cancelAtPeriodEnd': false,
          }))
          ..close();
      });

      final response = await service.resumeSubscription();

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/billing/subscription/resume');
      expect(response.success, isTrue);
      expect(response.data!['status'], 'active');
      expect(response.data!['cancelAtPeriodEnd'], false);
    });

    test('resumeSubscription handles 404 when no subscription exists',
        () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 404
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'No canceled subscription to resume',
          }))
          ..close();
      });

      try {
        await service.resumeSubscription();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isNotFound, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // changePeriod
    // -----------------------------------------------------------------------
    test('changePeriod sends PATCH to /billing/subscription/period', () async {
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
            'id': 'sub-001',
            'billingPeriod': 'annual',
            'status': 'active',
          }))
          ..close();
      });

      final response = await service.changePeriod({
        'billingPeriod': 'annual',
      });

      expect(capturedMethod, 'PATCH');
      expect(capturedPath, '/api/v1/billing/subscription/period');
      expect(capturedBody!['billingPeriod'], 'annual');
      expect(response.success, isTrue);
      expect(response.data!['billingPeriod'], 'annual');
    });

    test('changePeriod from annual to monthly', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-001',
            'billingPeriod': 'monthly',
            'effectiveDate': '2027-03-10T00:00:00Z',
          }))
          ..close();
      });

      final response = await service.changePeriod({
        'billingPeriod': 'monthly',
      });

      expect(capturedBody!['billingPeriod'], 'monthly');
      expect(response.success, isTrue);
      expect(response.data!['effectiveDate'], isNotNull);
    });

    test('changePeriod handles 422 invalid period', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 422
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Validation failed',
            'errors': {'billingPeriod': 'must be monthly or annual'},
          }))
          ..close();
      });

      try {
        await service.changePeriod({'billingPeriod': 'weekly'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 422);
        expect(apiError.errors!['billingPeriod'], 'must be monthly or annual');
      }
    });

    // -----------------------------------------------------------------------
    // validateCoupon
    // -----------------------------------------------------------------------
    test('validateCoupon sends POST to /billing/coupon/validate', () async {
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
            'valid': true,
            'code': 'SAVE20',
            'discountPercent': 20,
            'expiresAt': '2026-12-31T23:59:59Z',
          }))
          ..close();
      });

      final response = await service.validateCoupon('SAVE20');

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/billing/coupon/validate');
      expect(capturedBody!['code'], 'SAVE20');
      expect(response.success, isTrue);
      expect(response.data!['valid'], true);
      expect(response.data!['discountPercent'], 20);
    });

    test('validateCoupon returns invalid for expired coupon', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'valid': false,
            'code': 'EXPIRED50',
            'reason': 'Coupon has expired',
          }))
          ..close();
      });

      final response = await service.validateCoupon('EXPIRED50');

      expect(response.success, isTrue);
      expect(response.data!['valid'], false);
      expect(response.data!['reason'], 'Coupon has expired');
    });

    test('validateCoupon returns invalid for unknown coupon', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'valid': false,
            'code': 'DOESNOTEXIST',
            'reason': 'Coupon not found',
          }))
          ..close();
      });

      final response = await service.validateCoupon('DOESNOTEXIST');

      expect(response.success, isTrue);
      expect(response.data!['valid'], false);
      expect(response.data!['reason'], 'Coupon not found');
    });

    test('validateCoupon sends code exactly as provided', () async {
      Map<String, dynamic>? capturedBody;
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        capturedBody = jsonDecode(body) as Map<String, dynamic>;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'valid': true, 'code': 'launch2026'}))
          ..close();
      });

      await service.validateCoupon('launch2026');

      expect(capturedBody!['code'], 'launch2026');
    });

    test('validateCoupon handles 429 rate limit', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 429
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Too many coupon validation attempts',
          }))
          ..close();
      });

      try {
        await service.validateCoupon('SPAM');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isRateLimited, isTrue);
        expect(apiError.message, contains('coupon validation'));
      }
    });

    // -----------------------------------------------------------------------
    // getInvoices
    // -----------------------------------------------------------------------
    test('getInvoices sends GET to /billing/invoices with default params',
        () async {
      String? capturedPath;
      String? capturedUri;
      String? capturedMethod;
      final service = await createService((req) async {
        capturedPath = req.uri.path;
        capturedUri = req.uri.toString();
        capturedMethod = req.method;
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'inv-001',
              'amount': 699,
              'status': 'paid',
              'date': '2026-03-01T00:00:00Z',
            },
          ]))
          ..close();
      });

      final response = await service.getInvoices();

      expect(capturedMethod, 'GET');
      expect(capturedPath, '/api/v1/billing/invoices');
      expect(capturedUri, contains('page=1'));
      expect(capturedUri, contains('limit=20'));
      expect(response.success, isTrue);
      expect(response.data, hasLength(1));
    });

    test('getInvoices sends custom page and limit', () async {
      String? capturedUri;
      final service = await createService((req) async {
        capturedUri = req.uri.toString();
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      await service.getInvoices(page: 3, limit: 10);

      expect(capturedUri, contains('page=3'));
      expect(capturedUri, contains('limit=10'));
    });

    test('getInvoices returns multiple invoices with full details', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: [
            {
              'id': 'inv-001',
              'amount': 699,
              'currency': 'USD',
              'status': 'paid',
              'date': '2026-03-01T00:00:00Z',
              'planName': 'Pro Monthly',
              'pdfUrl': 'https://api.unjynx.com/invoices/inv-001.pdf',
            },
            {
              'id': 'inv-002',
              'amount': 699,
              'currency': 'USD',
              'status': 'paid',
              'date': '2026-02-01T00:00:00Z',
              'planName': 'Pro Monthly',
              'pdfUrl': 'https://api.unjynx.com/invoices/inv-002.pdf',
            },
            {
              'id': 'inv-003',
              'amount': 0,
              'currency': 'USD',
              'status': 'void',
              'date': '2026-01-01T00:00:00Z',
              'planName': 'Pro Monthly',
              'reason': 'Trial period',
            },
          ]))
          ..close();
      });

      final response = await service.getInvoices();

      expect(response.success, isTrue);
      expect(response.data, hasLength(3));
      final first = response.data![0] as Map<String, dynamic>;
      expect(first['status'], 'paid');
      expect(first['amount'], 699);
      final third = response.data![2] as Map<String, dynamic>;
      expect(third['status'], 'void');
    });

    test('getInvoices returns empty list for new users', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: []))
          ..close();
      });

      final response = await service.getInvoices();

      expect(response.success, isTrue);
      expect(response.data, isEmpty);
    });

    test('getInvoices handles pagination metadata', () async {
      final service = await createService((req) async {
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(
            data: [
              {'id': 'inv-041', 'amount': 699, 'status': 'paid'},
              {'id': 'inv-042', 'amount': 699, 'status': 'paid'},
            ],
            meta: {
              'total': 42,
              'page': 3,
              'limit': 20,
              'totalPages': 3,
            },
          ))
          ..close();
      });

      final response = await service.getInvoices(page: 3, limit: 20);

      expect(response.success, isTrue);
      expect(response.meta, isNotNull);
      expect(response.meta!.total, 42);
      expect(response.meta!.page, 3);
      expect(response.meta!.totalPages, 3);
    });

    test('getInvoices handles 401 unauthorized', () async {
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
        await service.getInvoices();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isUnauthorized, isTrue);
      }
    });

    // -----------------------------------------------------------------------
    // startTrial
    // -----------------------------------------------------------------------
    test('startTrial sends POST to /billing/trial', () async {
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
            'id': 'sub-trial-001',
            'planId': 'pro-monthly',
            'status': 'trialing',
            'trialEnd': '2026-03-25T00:00:00Z',
          }))
          ..close();
      });

      final response = await service.startTrial({
        'planId': 'pro-monthly',
      });

      expect(capturedMethod, 'POST');
      expect(capturedPath, '/api/v1/billing/trial');
      expect(capturedBody!['planId'], 'pro-monthly');
      expect(response.success, isTrue);
      expect(response.data!['status'], 'trialing');
    });

    test('startTrial sends idempotency key when provided', () async {
      String? capturedIdempotency;
      final service = await createService((req) async {
        capturedIdempotency = req.headers.value('idempotency-key');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 201
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {
            'id': 'sub-trial-002',
            'status': 'trialing',
          }))
          ..close();
      });

      await service.startTrial(
        {'planId': 'pro-annual'},
        idempotencyKey: 'idem-trial-001',
      );

      expect(capturedIdempotency, 'idem-trial-001');
    });

    test('startTrial handles 409 when trial already used', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 409
          ..headers.contentType = ContentType.json
          ..write(jsonEncode({
            'success': false,
            'error': 'Free trial already used',
          }))
          ..close();
      });

      try {
        await service.startTrial({'planId': 'pro-monthly'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.statusCode, 409);
        expect(apiError.message, 'Free trial already used');
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

      await service.getSubscription();

      expect(capturedAuth, 'Bearer test-token');
    });

    test('includes Bearer token on POST requests', () async {
      String? capturedAuth;
      final service = await createService((req) async {
        capturedAuth = req.headers.value('authorization');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'valid': true}))
          ..close();
      });

      await service.validateCoupon('TEST');

      expect(capturedAuth, 'Bearer test-token');
    });

    test('includes Bearer token on PATCH requests', () async {
      String? capturedAuth;
      final service = await createService((req) async {
        capturedAuth = req.headers.value('authorization');
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
        req.response
          ..statusCode = 200
          ..headers.contentType = ContentType.json
          ..write(envelope(data: {'billingPeriod': 'annual'}))
          ..close();
      });

      await service.changePeriod({'billingPeriod': 'annual'});

      expect(capturedAuth, 'Bearer test-token');
    });

    // -----------------------------------------------------------------------
    // 500 server error across methods
    // -----------------------------------------------------------------------
    test('cancelSubscription handles 500 server error', () async {
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
        await service.cancelSubscription();
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    test('changePeriod handles 500 server error', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
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
        await service.changePeriod({'billingPeriod': 'annual'});
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });

    test('validateCoupon handles 500 server error', () async {
      final service = await createService((req) async {
        final body = await utf8.decoder.bind(req).join();
        jsonDecode(body);
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
        await service.validateCoupon('BROKEN');
        fail('Expected DioException');
      } on DioException catch (e) {
        final apiError = e.error as ApiException;
        expect(apiError.isServerError, isTrue);
      }
    });
  });
}
