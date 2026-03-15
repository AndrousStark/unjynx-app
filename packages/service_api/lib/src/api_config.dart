/// Configuration for the API client connection.
class ApiConfig {
  /// Base URL for the backend server.
  final String baseUrl;

  /// Timeout for establishing a connection.
  final Duration connectTimeout;

  /// Timeout for receiving a response.
  final Duration receiveTimeout;

  const ApiConfig({
    this.baseUrl = 'http://10.0.2.2:3000',
    this.connectTimeout = const Duration(seconds: 10),
    this.receiveTimeout = const Duration(seconds: 30),
  });

  /// Android emulator uses 10.0.2.2 to reach host machine.
  /// iOS simulator uses localhost directly.
  /// Override for production.
  static const development = ApiConfig();
}
