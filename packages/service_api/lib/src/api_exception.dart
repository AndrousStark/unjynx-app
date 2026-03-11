/// Exception thrown when an API call fails.
///
/// Maps to RFC 9457 problem details from the backend.
class ApiException implements Exception {
  /// HTTP status code.
  final int statusCode;

  /// Human-readable error message.
  final String message;

  /// RFC 9457 problem type URI.
  final String? type;

  /// Field-level validation errors.
  final Map<String, dynamic>? errors;

  const ApiException({
    required this.statusCode,
    required this.message,
    this.type,
    this.errors,
  });

  /// Whether this is an authentication error (401).
  bool get isUnauthorized => statusCode == 401;

  /// Whether this is an authorization error (403).
  bool get isForbidden => statusCode == 403;

  /// Whether the resource was not found (404).
  bool get isNotFound => statusCode == 404;

  /// Whether the request was rate limited (429).
  bool get isRateLimited => statusCode == 429;

  /// Whether this is a server-side error (5xx).
  bool get isServerError => statusCode >= 500;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
