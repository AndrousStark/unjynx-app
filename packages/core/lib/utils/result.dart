/// A type representing either a success value or a failure.
///
/// Use instead of throwing exceptions for expected error cases.
/// Inspired by Rust's Result<T, E> type.
sealed class Result<T> {
  const Result();

  /// Create a success result.
  factory Result.ok(T value) = Ok<T>;

  /// Create a failure result.
  factory Result.err(String message, [Object? cause]) = Err<T>;

  /// Whether this is a success.
  bool get isOk => this is Ok<T>;

  /// Whether this is a failure.
  bool get isErr => this is Err<T>;

  /// Get the value or throw if error.
  T unwrap() {
    return switch (this) {
      Ok(value: final v) => v,
      Err(message: final m) => throw StateError('Unwrap on Err: $m'),
    };
  }

  /// Get the value or return a default.
  T unwrapOr(T defaultValue) {
    return switch (this) {
      Ok(value: final v) => v,
      Err() => defaultValue,
    };
  }

  /// Transform the success value.
  Result<U> map<U>(U Function(T) transform) {
    return switch (this) {
      Ok(value: final v) => Result.ok(transform(v)),
      Err(message: final m, cause: final c) => Result.err(m, c),
    };
  }

  /// Pattern match on success or failure.
  R when<R>({
    required R Function(T value) ok,
    required R Function(String message, Object? cause) err,
  }) {
    return switch (this) {
      Ok(value: final v) => ok(v),
      Err(message: final m, cause: final c) => err(m, c),
    };
  }
}

/// Success case of [Result].
final class Ok<T> extends Result<T> {
  final T value;

  const Ok(this.value);

  @override
  String toString() => 'Ok($value)';
}

/// Failure case of [Result].
final class Err<T> extends Result<T> {
  final String message;
  final Object? cause;

  const Err(this.message, [this.cause]);

  @override
  String toString() => 'Err($message${cause != null ? ', $cause' : ''})';
}
