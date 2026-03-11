import 'dart:typed_data';

/// Port for file storage operations.
///
/// Implementations: MinIO (local), Cloudflare R2 (production).
abstract class StoragePort {
  /// Upload a file and return its URL.
  Future<String> upload({
    required String bucket,
    required String path,
    required Uint8List data,
    String? contentType,
  });

  /// Download a file.
  Future<Uint8List> download({
    required String bucket,
    required String path,
  });

  /// Delete a file.
  Future<void> delete({
    required String bucket,
    required String path,
  });

  /// Get a signed URL for temporary access.
  Future<String> getSignedUrl({
    required String bucket,
    required String path,
    Duration expiry = const Duration(hours: 1),
  });
}
