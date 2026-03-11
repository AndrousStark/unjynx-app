import 'package:unjynx_core/contracts/auth_port.dart';

/// Mock implementation of [AuthPort] for offline development.
///
/// Always returns a fixed local user. Swap for [LogtoAuthPort]
/// once the backend (Docker + Logto) is available.
class MockAuthPort implements AuthPort {
  static const _mockUser = AuthUser(
    id: 'local-dev-user',
    email: 'dev@unjynx.local',
    name: 'Local Developer',
  );

  @override
  Future<bool> isAuthenticated() async => true;

  @override
  Future<String> signIn() async => 'mock-access-token';

  @override
  Future<void> signOut() async {}

  @override
  Future<String?> getAccessToken() async => 'mock-access-token';

  @override
  Future<String?> getUserId() async => _mockUser.id;

  @override
  Future<AuthUser?> getUserProfile() async => _mockUser;
}
