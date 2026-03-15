import 'package:flutter_test/flutter_test.dart';
import 'package:service_auth/service_auth.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

void main() {
  group('MockAuthPort', () {
    late MockAuthPort auth;

    setUp(() {
      auth = MockAuthPort();
    });

    test('isAuthenticated returns true', () async {
      expect(await auth.isAuthenticated(), true);
    });

    test('signIn returns mock token', () async {
      final token = await auth.signIn();
      expect(token, 'mock-access-token');
    });

    test('signOut completes without error', () async {
      await expectLater(auth.signOut(), completes);
    });

    test('getAccessToken returns mock token', () async {
      expect(await auth.getAccessToken(), 'mock-access-token');
    });

    test('getUserId returns local-dev-user', () async {
      expect(await auth.getUserId(), 'local-dev-user');
    });

    test('getUserProfile returns complete profile', () async {
      final user = await auth.getUserProfile();
      expect(user, isNotNull);
      expect(user!.id, 'local-dev-user');
      expect(user.email, 'dev@unjynx.local');
      expect(user.name, 'Local Developer');
    });

    test('implements AuthPort', () {
      expect(auth, isA<AuthPort>());
    });
  });

  group('AuthUser', () {
    test('holds required fields', () {
      const user = AuthUser(id: 'u1');
      expect(user.id, 'u1');
      expect(user.email, isNull);
      expect(user.name, isNull);
      expect(user.avatarUrl, isNull);
    });

    test('holds all fields', () {
      const user = AuthUser(
        id: 'u2',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
      );
      expect(user.email, 'test@example.com');
      expect(user.name, 'Test User');
      expect(user.avatarUrl, isNotNull);
    });
  });

  group('LogtoConfig', () {
    test('holds configuration', () {
      const config = LogtoConfig(
        endpoint: 'https://logto.example.com',
        appId: 'test-app-id',
        redirectUri: 'unjynx://callback',
      );
      expect(config.endpoint, 'https://logto.example.com');
      expect(config.appId, 'test-app-id');
      expect(config.redirectUri, 'unjynx://callback');
    });
  });
}
