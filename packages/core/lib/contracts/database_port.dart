/// Port for database operations.
///
/// Implementations: Drift (local), Remote API (cloud sync).
abstract class DatabasePort {
  /// Initialize the database connection.
  Future<void> initialize();

  /// Close the database connection.
  Future<void> close();

  /// Run a query and return results.
  Future<List<Map<String, dynamic>>> query(
    String table, {
    Map<String, dynamic>? where,
    String? orderBy,
    int? limit,
    int? offset,
  });

  /// Insert a record and return its ID.
  Future<String> insert(String table, Map<String, dynamic> data);

  /// Update records matching [where] and return count of updated rows.
  Future<int> update(
    String table,
    Map<String, dynamic> data, {
    required Map<String, dynamic> where,
  });

  /// Delete records matching [where] and return count of deleted rows.
  Future<int> delete(String table, {required Map<String, dynamic> where});
}
