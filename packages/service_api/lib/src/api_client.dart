import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

import 'api_config.dart';
import 'api_exception.dart';
import 'api_response.dart';

/// Centralized HTTP client for all backend API calls.
///
/// Features:
/// - Automatic Bearer token injection from [AuthPort]
/// - Idempotency-Key header on POST/PATCH/PUT
/// - Response envelope unwrapping via [ApiResponse]
/// - Structured error handling via [ApiException]
/// Callback to get the currently selected organization ID.
/// Returns null if no org is selected (personal workspace).
typedef OrgIdProvider = String? Function();

class ApiClient {
  final Dio _dio;
  final AuthPort _auth;
  OrgIdProvider? _orgIdProvider;

  ApiClient({
    required AuthPort auth,
    ApiConfig config = ApiConfig.development,
    Dio? dio,
    OrgIdProvider? orgIdProvider,
  })  : _auth = auth,
        _orgIdProvider = orgIdProvider,
        _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = '${config.baseUrl}/api/v1'
      ..connectTimeout = config.connectTimeout
      ..receiveTimeout = config.receiveTimeout
      ..headers = {'Content-Type': 'application/json'};

    _dio.interceptors.add(AuthInterceptor(_auth));
    _dio.interceptors.add(OrgInterceptor(this));
    _dio.interceptors.add(ErrorInterceptor());
  }

  /// Set the org ID provider (call after auth is initialized).
  void setOrgIdProvider(OrgIdProvider provider) {
    _orgIdProvider = provider;
  }

  /// Get the current org ID.
  String? get currentOrgId => _orgIdProvider?.call();

  /// Visible for testing — access the underlying Dio instance.
  Dio get dio => _dio;

  /// GET request with typed response.
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    T Function(dynamic)? fromData,
  }) async {
    final response = await _dio.get<Map<String, dynamic>>(
      path,
      queryParameters: queryParameters,
    );
    return ApiResponse.fromJson(response.data!, fromData);
  }

  /// POST request with typed response.
  Future<ApiResponse<T>> post<T>(
    String path, {
    Object? data,
    T Function(dynamic)? fromData,
    String? idempotencyKey,
  }) async {
    final options = Options();
    if (idempotencyKey != null) {
      options.headers = {'Idempotency-Key': idempotencyKey};
    }
    final response = await _dio.post<Map<String, dynamic>>(
      path,
      data: data,
      options: options,
    );
    return ApiResponse.fromJson(response.data!, fromData);
  }

  /// PUT request with typed response.
  Future<ApiResponse<T>> put<T>(
    String path, {
    Object? data,
    T Function(dynamic)? fromData,
    String? idempotencyKey,
  }) async {
    final options = Options();
    if (idempotencyKey != null) {
      options.headers = {'Idempotency-Key': idempotencyKey};
    }
    final response = await _dio.put<Map<String, dynamic>>(
      path,
      data: data,
      options: options,
    );
    return ApiResponse.fromJson(response.data!, fromData);
  }

  /// PATCH request with typed response.
  Future<ApiResponse<T>> patch<T>(
    String path, {
    Object? data,
    T Function(dynamic)? fromData,
    String? idempotencyKey,
  }) async {
    final options = Options();
    if (idempotencyKey != null) {
      options.headers = {'Idempotency-Key': idempotencyKey};
    }
    final response = await _dio.patch<Map<String, dynamic>>(
      path,
      data: data,
      options: options,
    );
    return ApiResponse.fromJson(response.data!, fromData);
  }

  /// DELETE request with typed response.
  Future<ApiResponse<T>> delete<T>(
    String path, {
    Object? data,
    T Function(dynamic)? fromData,
  }) async {
    final response = await _dio.delete<Map<String, dynamic>>(
      path,
      data: data,
    );
    return ApiResponse.fromJson(response.data!, fromData);
  }

  /// GET request that returns raw bytes (for PDF/binary downloads).
  ///
  /// Bypasses the JSON envelope — returns the raw response body as bytes.
  Future<Uint8List> getBytes(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _dio.get<ResponseBody>(
      path,
      queryParameters: queryParameters,
      options: Options(responseType: ResponseType.stream),
    );
    final chunks = <int>[];
    await for (final chunk in response.data!.stream) {
      chunks.addAll(chunk);
    }
    return Uint8List.fromList(chunks);
  }

  /// POST request that returns a byte stream (for SSE / streaming).
  ///
  /// Bypasses the JSON envelope — returns the raw response stream.
  Future<ResponseBody> postStream(
    String path, {
    Object? data,
  }) async {
    final response = await _dio.post<ResponseBody>(
      path,
      data: data,
      options: Options(
        responseType: ResponseType.stream,
        headers: {'Accept': 'text/event-stream'},
      ),
    );
    return response.data!;
  }

  /// GET request that returns raw text (for CSV/plain-text downloads).
  ///
  /// Bypasses the JSON envelope — returns the raw response body as a string.
  Future<String> getText(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _dio.get<String>(
      path,
      queryParameters: queryParameters,
      options: Options(responseType: ResponseType.plain),
    );
    return response.data ?? '';
  }
}

/// Injects Bearer token from [AuthPort] on every request.
/// Injects X-Org-Id header for multi-tenant org context.
class OrgInterceptor extends Interceptor {
  final ApiClient _apiClient;

  OrgInterceptor(this._apiClient);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final orgId = _apiClient.currentOrgId;
    if (orgId != null) {
      options.headers['X-Org-Id'] = orgId;
    }
    handler.next(options);
  }
}

class AuthInterceptor extends Interceptor {
  final AuthPort _auth;

  AuthInterceptor(this._auth);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _auth.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

/// Transforms [DioException] into structured [ApiException].
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Provide a descriptive message for connection-level failures that
    // would otherwise surface as "DioException [unknown]: null".
    if (err.response == null && err.type != DioExceptionType.cancel) {
      final uri = err.requestOptions.uri;
      final detail = err.error?.toString() ?? err.message ?? 'no details';
      handler.reject(
        DioException(
          requestOptions: err.requestOptions,
          type: err.type,
          error: ApiException(
            statusCode: 0,
            message: 'Cannot reach $uri — $detail',
            type: 'network_error',
          ),
        ),
      );
      return;
    }

    final response = err.response;
    if (response != null) {
      final data = response.data;
      final message = data is Map<String, dynamic>
          ? ((data['error'] ?? data['detail'] ?? err.message ?? 'Unknown error')
              as String)
          : (err.message ?? 'Unknown error');
      final type =
          data is Map<String, dynamic> ? data['type'] as String? : null;
      final errors = data is Map<String, dynamic>
          ? data['errors'] as Map<String, dynamic>?
          : null;

      // 401 Unauthorized — signal callers to clear auth and redirect.
      if (response.statusCode == 401) {
        handler.reject(
          DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            error: AuthExpiredException(
              message: message,
              type: type,
              errors: errors,
            ),
          ),
        );
        return;
      }

      if (data is Map<String, dynamic>) {
        handler.reject(
          DioException(
            requestOptions: err.requestOptions,
            response: err.response,
            error: ApiException(
              statusCode: response.statusCode ?? 500,
              message: message,
              type: type,
              errors: errors,
            ),
          ),
        );
        return;
      }
    }
    handler.next(err);
  }
}
