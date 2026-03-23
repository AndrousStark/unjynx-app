import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:service_auth/service_auth.dart';
import 'package:unjynx_core/contracts/auth_port.dart';

void main() {
  group('MockAuthPort', () {
    late MockAuthPort auth;

    setUp(() {
      auth = MockAuthPort();
    });

    test('isAuthenticated returns false before sign-in', () async {
      expect(await auth.isAuthenticated(), false);
    });

    test('isAuthenticated returns true after sign-in', () async {
      await auth.signIn();
      expect(await auth.isAuthenticated(), true);
    });

    test('signIn returns mock token', () async {
      final token = await auth.signIn();
      expect(token, 'mock-access-token');
    });

    test('signOut completes without error', () async {
      await expectLater(auth.signOut(), completes);
    });

    test('getAccessToken returns null before sign-in', () async {
      expect(await auth.getAccessToken(), isNull);
    });

    test('getAccessToken returns mock token after sign-in', () async {
      await auth.signIn();
      expect(await auth.getAccessToken(), 'mock-access-token');
    });

    test('getUserId returns local-dev-user', () async {
      expect(await auth.getUserId(), 'local-dev-user');
    });

    test('getUserProfile returns default profile before sign-in', () async {
      final user = await auth.getUserProfile();
      expect(user, isNotNull);
      expect(user!.id, 'local-dev-user');
      expect(user.email, 'dev@unjynx.local');
      expect(user.name, 'Local Developer');
    });

    test('getUserProfile returns default profile after sign-in', () async {
      await auth.signIn();
      final user = await auth.getUserProfile();
      expect(user, isNotNull);
      expect(user!.id, 'local-dev-user');
      expect(user.email, 'dev@unjynx.local');
      expect(user.name, 'Local Developer');
    });

    test('setCredentials updates profile after sign-in', () async {
      auth.setCredentials(email: 'archit@example.com');
      await auth.signIn();
      final user = await auth.getUserProfile();
      expect(user, isNotNull);
      expect(user!.email, 'archit@example.com');
      expect(user.name, 'Archit');
    });

    test('signInWithSocial decodes JWT and updates profile', () async {
      // Build a minimal JWT with email/name/picture claims.
      final header = base64Url.encode(utf8.encode('{"alg":"RS256","typ":"JWT"}'));
      final payload = base64Url.encode(utf8.encode(
        '{"email":"alice@gmail.com","name":"Alice Wonderland",'
        '"picture":"https://lh3.googleusercontent.com/a/photo"}',
      ));
      final fakeJwt = '$header.$payload.fake-signature';

      await auth.signInWithSocial(provider: 'google', idToken: fakeJwt);

      expect(await auth.isAuthenticated(), true);

      final user = await auth.getUserProfile();
      expect(user, isNotNull);
      expect(user!.email, 'alice@gmail.com');
      expect(user.name, 'Alice Wonderland');
      expect(user.avatarUrl, 'https://lh3.googleusercontent.com/a/photo');
    });

    test('signOut clears social credentials', () async {
      final header = base64Url.encode(utf8.encode('{"alg":"RS256"}'));
      final payload = base64Url.encode(utf8.encode(
        '{"email":"alice@gmail.com","name":"Alice"}',
      ));
      await auth.signInWithSocial(
        provider: 'google',
        idToken: '$header.$payload.sig',
      );

      await auth.signOut();

      expect(await auth.isAuthenticated(), false);
      // After sign-out, profile should return defaults (not authenticated).
      final user = await auth.getUserProfile();
      expect(user!.email, 'dev@unjynx.local');
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
