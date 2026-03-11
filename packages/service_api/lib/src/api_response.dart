/// Typed wrapper for the backend response envelope.
///
/// Backend returns: `{ "success": bool, "data": T?, "error": string?, "meta": {...} }`
class ApiResponse<T> {
  /// Whether the request succeeded.
  final bool success;

  /// Response payload (null on error).
  final T? data;

  /// Error message (null on success).
  final String? error;

  /// Pagination metadata (present on list endpoints).
  final PaginationMeta? meta;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.meta,
  });

  /// Parse from the backend JSON envelope.
  ///
  /// [fromData] converts the raw `data` field into the typed [T].
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromData,
  ) {
    return ApiResponse(
      success: json['success'] as bool,
      data: json['data'] != null && fromData != null
          ? fromData(json['data'])
          : json['data'] as T?,
      error: json['error'] as String?,
      meta: json['meta'] != null
          ? PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>)
          : null,
    );
  }
}

/// Pagination metadata from list endpoints.
class PaginationMeta {
  /// Total number of records.
  final int total;

  /// Current page number.
  final int page;

  /// Records per page.
  final int limit;

  /// Total number of pages.
  final int totalPages;

  const PaginationMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  /// Parse from JSON.
  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}
