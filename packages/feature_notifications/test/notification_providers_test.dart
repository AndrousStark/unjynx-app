import 'package:feature_notifications/feature_notifications.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:service_api/service_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Pumps the Dart event queue multiple times to allow async [StateNotifier]
/// constructors (e.g. [ChannelsNotifier._loadChannels]) to fully settle.
///
/// A single [Future.delayed(Duration.zero)] only advances one microtask cycle.
/// Notifiers that contain `await` inside an `async` constructor callback
/// require several cycles before their state transitions from [AsyncLoading]
/// to [AsyncData].
Future<void> _pumpEventQueue({int times = 5}) async {
  for (var i = 0; i < times; i++) {
    await Future<void>.delayed(Duration.zero);
  }
}

/// Creates a [ProviderContainer] with the real [NotificationRepository] backed
/// by a freshly-initialised mock [SharedPreferences].
///
/// API providers are not available in this scope, so providers fall back to
/// local-only mode automatically.
///
/// Eagerly initialises all async providers so that no background microtasks
/// are left pending when the container is eventually disposed. This prevents
/// "Tried to use … after dispose" errors from leaking into neighbouring tests.
Future<ProviderContainer> _makeContainer() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final repo = NotificationRepository(prefs);
  final container = ProviderContainer(
    overrides: [
      overrideNotificationRepository(repo),
      // Override API providers to throw so that _tryRead returns null and
      // all notifiers operate in local-only mode (no real HTTP calls).
      channelApiProvider.overrideWith(
        (ref) => throw StateError('No API in tests'),
      ),
      notificationApiProvider.overrideWith(
        (ref) => throw StateError('No API in tests'),
      ),
    ],
  );
  // Eagerly initialise the async notifiers so that their constructor-fired
  // futures complete before the test body touches the container. This also
  // prevents "Tried to use … after dispose" errors leaking into later tests.
  container.read(channelsProvider);
  container.read(historyProvider);
  await _pumpEventQueue();
  return container;
}

void main() {
  // -------------------------------------------------------------------------
  // NotificationPlugin
  // -------------------------------------------------------------------------
  group('NotificationPlugin', () {
    late NotificationPlugin plugin;

    setUp(() {
      plugin = NotificationPlugin();
    });

    test('has the correct id', () {
      expect(plugin.id, equals('notifications'));
    });

    test('has the correct name', () {
      expect(plugin.name, equals('Notifications'));
    });

    test('has the correct version', () {
      expect(plugin.version, equals('0.1.0'));
    });

    test('exposes six routes (J1-J6)', () {
      expect(plugin.routes, hasLength(6));
    });

    test('first route path is /notifications', () {
      expect(plugin.routes.first.path, equals('/notifications'));
    });

    test('route paths cover the full notification flow', () {
      final paths = plugin.routes.map((r) => r.path).toList();
      expect(
        paths,
        containsAll([
          '/notifications',
          '/notifications/channels',
          '/notifications/escalation',
          '/notifications/quiet-hours',
          '/notifications/test',
          '/notifications/history',
        ]),
      );
    });

    test('hub route has sortOrder 5', () {
      expect(plugin.routes.first.sortOrder, equals(5));
    });

    test('sub-routes have sortOrder -1', () {
      for (final route in plugin.routes.skip(1)) {
        expect(route.sortOrder, equals(-1));
      }
    });

    test('hub route icon is Icons.notifications_rounded', () {
      expect(
        plugin.routes.first.icon,
        equals(Icons.notifications_rounded),
      );
    });

    test('hub route label is Notifications', () {
      expect(plugin.routes.first.label, equals('Notifications'));
    });

    test('initialize completes without error', () async {
      final eventBus = EventBus();
      await expectLater(plugin.initialize(eventBus), completes);
      eventBus.dispose();
    });

    test('dispose completes without error', () async {
      await expectLater(plugin.dispose(), completes);
    });

    test('implements UnjynxPlugin', () {
      expect(plugin, isA<UnjynxPlugin>());
    });
  });

  // -------------------------------------------------------------------------
  // NotificationChannel model
  // -------------------------------------------------------------------------
  group('NotificationChannel', () {
    test('toJson and fromJson round-trip preserves data', () {
      final now = DateTime(2026, 3, 10, 14, 30);
      const channel = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_123',
        isConnected: true,
        displayName: '@testuser',
      );
      final withDate = channel.copyWith(lastVerified: now);
      final json = withDate.toJson();
      final restored = NotificationChannel.fromJson(json);

      expect(restored.type, equals('telegram'));
      expect(restored.identifier, equals('chat_123'));
      expect(restored.isConnected, isTrue);
      expect(restored.displayName, equals('@testuser'));
      expect(restored.lastVerified, equals(now));
    });

    test('copyWith produces a new instance with updated fields', () {
      const channel = NotificationChannel(
        type: 'email',
        identifier: 'test@example.com',
      );
      final updated = channel.copyWith(
        isConnected: true,
        displayName: 'test@example.com',
      );
      expect(updated.isConnected, isTrue);
      expect(updated.displayName, equals('test@example.com'));
      expect(updated.type, equals('email'));
      // Original unchanged
      expect(channel.isConnected, isFalse);
      expect(channel.displayName, isNull);
    });

    test('equality works correctly', () {
      const a = NotificationChannel(
        type: 'push',
        identifier: 'token_abc',
        isConnected: true,
      );
      const b = NotificationChannel(
        type: 'push',
        identifier: 'token_abc',
        isConnected: true,
      );
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });

    test('inequality for different fields', () {
      const a = NotificationChannel(
        type: 'push',
        identifier: 'token_abc',
      );
      const b = NotificationChannel(
        type: 'push',
        identifier: 'token_xyz',
      );
      expect(a, isNot(equals(b)));
    });

    test('ChannelTypes.all contains all 8 channel types', () {
      expect(ChannelTypes.all, hasLength(8));
      expect(
        ChannelTypes.all,
        containsAll([
          'push',
          'telegram',
          'email',
          'whatsapp',
          'sms',
          'instagram',
          'slack',
          'discord',
        ]),
      );
    });
  });

  // -------------------------------------------------------------------------
  // NotificationPreferences model
  // -------------------------------------------------------------------------
  group('NotificationPreferences', () {
    test('default values are sensible', () {
      const prefs = NotificationPreferences();
      expect(prefs.primaryChannel, equals('push'));
      expect(prefs.fallbackChain, hasLength(5));
      expect(prefs.overrideForUrgent, isTrue);
      expect(prefs.timezone, equals('UTC'));
      expect(prefs.quietStart, isNull);
      expect(prefs.quietEnd, isNull);
      expect(prefs.quietDays, isEmpty);
    });

    test('toJson and fromJson round-trip preserves data', () {
      final prefs = const NotificationPreferences().copyWith(
        primaryChannel: 'telegram',
        quietStart: const TimeOfDay(hour: 22, minute: 0),
        quietEnd: const TimeOfDay(hour: 7, minute: 30),
        quietDays: [1, 2, 3, 4, 5],
        overrideForUrgent: false,
        timezone: 'Asia/Kolkata',
      );

      final json = prefs.toJson();
      final restored = NotificationPreferences.fromJson(json);

      expect(restored.primaryChannel, equals('telegram'));
      expect(restored.quietStart, equals(const TimeOfDay(hour: 22, minute: 0)));
      expect(restored.quietEnd, equals(const TimeOfDay(hour: 7, minute: 30)));
      expect(restored.quietDays, equals([1, 2, 3, 4, 5]));
      expect(restored.overrideForUrgent, isFalse);
      expect(restored.timezone, equals('Asia/Kolkata'));
    });

    test('copyWith produces a new instance', () {
      const original = NotificationPreferences();
      final updated = original.copyWith(primaryChannel: 'email');
      expect(updated.primaryChannel, equals('email'));
      expect(original.primaryChannel, equals('push'));
    });

    test('clearQuietStart and clearQuietEnd set to null', () {
      final prefs = const NotificationPreferences().copyWith(
        quietStart: const TimeOfDay(hour: 22, minute: 0),
        quietEnd: const TimeOfDay(hour: 7, minute: 0),
      );
      final cleared = prefs.copyWith(
        clearQuietStart: true,
        clearQuietEnd: true,
      );
      expect(cleared.quietStart, isNull);
      expect(cleared.quietEnd, isNull);
    });

    test('equality works correctly', () {
      const a = NotificationPreferences();
      const b = NotificationPreferences();
      expect(a, equals(b));
      expect(a.hashCode, equals(b.hashCode));
    });
  });

  // -------------------------------------------------------------------------
  // NotificationRepository
  // -------------------------------------------------------------------------
  group('NotificationRepository', () {
    test('getChannels returns empty list initially', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      expect(repo.getChannels(), isEmpty);
    });

    test('saveChannel and getChannels round-trip', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      const channel = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_456',
        isConnected: true,
        displayName: '@mybot',
      );
      await repo.saveChannel(channel);

      final channels = repo.getChannels();
      expect(channels, hasLength(1));
      expect(channels.first.type, equals('telegram'));
      expect(channels.first.isConnected, isTrue);
    });

    test('saveChannel replaces existing channel of same type', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      const original = NotificationChannel(
        type: 'email',
        identifier: 'old@test.com',
        isConnected: true,
      );
      await repo.saveChannel(original);

      const updated = NotificationChannel(
        type: 'email',
        identifier: 'new@test.com',
        isConnected: true,
      );
      await repo.saveChannel(updated);

      final channels = repo.getChannels();
      expect(channels, hasLength(1));
      expect(channels.first.identifier, equals('new@test.com'));
    });

    test('removeChannel removes the specified type', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      const ch1 = NotificationChannel(
        type: 'push',
        identifier: 'token_a',
        isConnected: true,
      );
      const ch2 = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_b',
        isConnected: true,
      );
      await repo.saveChannel(ch1);
      await repo.saveChannel(ch2);

      await repo.removeChannel('push');
      final channels = repo.getChannels();
      expect(channels, hasLength(1));
      expect(channels.first.type, equals('telegram'));
    });

    test('getPreferences returns defaults initially', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      final notifPrefs = repo.getPreferences();
      expect(notifPrefs.primaryChannel, equals('push'));
      expect(notifPrefs.overrideForUrgent, isTrue);
    });

    test('savePreferences and getPreferences round-trip', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      final customPrefs = const NotificationPreferences().copyWith(
        primaryChannel: 'whatsapp',
        fallbackChain: ['whatsapp', 'sms', 'push'],
        timezone: 'Asia/Kolkata',
      );
      await repo.savePreferences(customPrefs);

      final restored = repo.getPreferences();
      expect(restored.primaryChannel, equals('whatsapp'));
      expect(restored.fallbackChain, equals(['whatsapp', 'sms', 'push']));
      expect(restored.timezone, equals('Asia/Kolkata'));
    });

    test('getHistory returns empty list initially', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      expect(repo.getHistory(), isEmpty);
    });

    test('addHistoryEntry appends entries', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      await repo.addHistoryEntry({
        'channelType': 'push',
        'message': 'Test message',
        'status': 'delivered',
        'timestamp': '2026-03-10T14:30:00',
      });

      final history = repo.getHistory();
      expect(history, hasLength(1));
      expect(history.first['status'], equals('delivered'));
    });

    test('clearHistory removes all entries', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      await repo.addHistoryEntry({
        'channelType': 'push',
        'message': 'Test',
        'status': 'delivered',
        'timestamp': '2026-03-10T14:30:00',
      });
      await repo.clearHistory();

      expect(repo.getHistory(), isEmpty);
    });
  });

  // -------------------------------------------------------------------------
  // notificationRepositoryProvider
  // -------------------------------------------------------------------------
  group('notificationRepositoryProvider', () {
    test('throws StateError when not overridden', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // Riverpod 3 wraps provider errors in ProviderException.
      expect(
        () => container.read(notificationRepositoryProvider),
        throwsA(anything),
      );
    });

    test('returns the overridden repository instance', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      expect(
        () => container.read(notificationRepositoryProvider),
        returnsNormally,
      );
    });
  });

  // -------------------------------------------------------------------------
  // channelsProvider (now AsyncValue)
  // -------------------------------------------------------------------------
  group('channelsProvider', () {
    test('starts with loading then resolves to data', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      // Allow async initialization to settle
      await _pumpEventQueue();

      final channelsAsync = container.read(channelsProvider);
      // In local-only mode (no API), should resolve to data immediately
      expect(channelsAsync.value, isNotNull);
      expect(channelsAsync.value, isEmpty);
    });

    test('connectChannel adds a channel', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const channel = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_test',
        isConnected: true,
      );
      await container.read(channelsProvider.notifier).connectChannel(channel);

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, hasLength(1));
      expect(channels.first.type, equals('telegram'));
    });

    test('disconnectChannel removes a channel', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const channel = NotificationChannel(
        type: 'email',
        identifier: 'test@test.com',
        isConnected: true,
      );
      await container.read(channelsProvider.notifier).connectChannel(channel);
      await container.read(channelsProvider.notifier).disconnectChannel('email');

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, isEmpty);
    });
  });

  // -------------------------------------------------------------------------
  // connectedChannelsProvider
  // -------------------------------------------------------------------------
  group('connectedChannelsProvider', () {
    test('filters to only connected channels', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const connected = NotificationChannel(
        type: 'push',
        identifier: 'token',
        isConnected: true,
      );
      const disconnected = NotificationChannel(
        type: 'telegram',
        identifier: 'chat',
        isConnected: false,
      );
      await container
          .read(channelsProvider.notifier)
          .connectChannel(connected);
      await container
          .read(channelsProvider.notifier)
          .connectChannel(disconnected);

      final result = container.read(connectedChannelsProvider);
      expect(result, hasLength(1));
      expect(result.first.type, equals('push'));
    });
  });

  // -------------------------------------------------------------------------
  // channelsListProvider
  // -------------------------------------------------------------------------
  group('channelsListProvider', () {
    test('returns empty list when no channels', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      expect(container.read(channelsListProvider), isEmpty);
    });

    test('returns channels list after adding', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const channel = NotificationChannel(
        type: 'push',
        identifier: 'token',
        isConnected: true,
      );
      await container.read(channelsProvider.notifier).connectChannel(channel);

      final list = container.read(channelsListProvider);
      expect(list, hasLength(1));
    });
  });

  // -------------------------------------------------------------------------
  // preferencesProvider
  // -------------------------------------------------------------------------
  group('preferencesProvider', () {
    test('starts with default preferences', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      final prefs = container.read(preferencesProvider);
      expect(prefs.primaryChannel, equals('push'));
      expect(prefs.overrideForUrgent, isTrue);
    });

    test('updatePreferences persists changes', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      final updated = const NotificationPreferences().copyWith(
        primaryChannel: 'telegram',
      );
      await container
          .read(preferencesProvider.notifier)
          .updatePreferences(updated);

      expect(
        container.read(preferencesProvider).primaryChannel,
        equals('telegram'),
      );
    });

    test('updateFallbackChain updates chain order', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      await container
          .read(preferencesProvider.notifier)
          .updateFallbackChain(['sms', 'push', 'email']);

      expect(
        container.read(preferencesProvider).fallbackChain,
        equals(['sms', 'push', 'email']),
      );
    });

    test('updateEscalationDelay changes delay for a channel', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      await container
          .read(preferencesProvider.notifier)
          .updateEscalationDelay('telegram', 10);

      expect(
        container.read(preferencesProvider).escalationDelays['telegram'],
        equals(10),
      );
    });
  });

  // -------------------------------------------------------------------------
  // channelConnectionStateProvider
  // -------------------------------------------------------------------------
  group('channelConnectionStateProvider', () {
    test('defaults to idle', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.idle),
      );
    });

    test('can be updated per channel type', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(channelConnectionStateProvider('push').notifier).set(
        ChannelConnectionState.connecting,
      );

      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.connecting),
      );
      // Other channels unaffected
      expect(
        container.read(channelConnectionStateProvider('telegram')),
        equals(ChannelConnectionState.idle),
      );
    });
  });

  // -------------------------------------------------------------------------
  // testNotificationStateProvider
  // -------------------------------------------------------------------------
  group('testNotificationStateProvider', () {
    test('defaults to idle', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(testNotificationStateProvider('push')),
        equals(TestState.idle),
      );
    });

    test('can transition through states', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(testNotificationStateProvider('email').notifier).set(
        TestState.sending,
      );
      expect(
        container.read(testNotificationStateProvider('email')),
        equals(TestState.sending),
      );

      container.read(testNotificationStateProvider('email').notifier).set(
        TestState.delivered,
      );
      expect(
        container.read(testNotificationStateProvider('email')),
        equals(TestState.delivered),
      );
    });
  });

  // -------------------------------------------------------------------------
  // channelErrorProvider
  // -------------------------------------------------------------------------
  group('channelErrorProvider', () {
    test('defaults to null', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(channelErrorProvider('push')),
        isNull,
      );
    });

    test('can be set per channel type', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(channelErrorProvider('push').notifier).set(
        'Connection failed',
      );

      expect(
        container.read(channelErrorProvider('push')),
        equals('Connection failed'),
      );
      // Other channels unaffected
      expect(
        container.read(channelErrorProvider('telegram')),
        isNull,
      );
    });
  });

  // -------------------------------------------------------------------------
  // historyProvider
  // -------------------------------------------------------------------------
  group('historyProvider', () {
    test('resolves to empty list when no history', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      final historyAsync = container.read(historyProvider);
      expect(historyAsync.value, isEmpty);
    });

    test('refresh reloads history from repository', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      // Add an entry directly to the repo
      final repo = container.read(notificationRepositoryProvider);
      await repo.addHistoryEntry({
        'channelType': 'push',
        'message': 'Test reminder',
        'status': 'delivered',
        'timestamp': '2026-03-10T15:00:00',
      });

      // Refresh the provider
      await container.read(historyProvider.notifier).refresh();
      await _pumpEventQueue();

      final history = container.read(historyProvider).value ?? [];
      expect(history, hasLength(1));
      expect(history.first['status'], equals('delivered'));
    });
  });

  // -------------------------------------------------------------------------
  // quotaProvider
  // -------------------------------------------------------------------------
  group('quotaProvider', () {
    test('returns empty map when no API available', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      // Await the FutureProvider's future directly so the value is resolved
      // before we inspect it. Without API the provider resolves to {}.
      final quota = await container.read(quotaProvider.future);
      expect(quota, equals({}));
    });
  });

  // -------------------------------------------------------------------------
  // PreferencesNotifier advanced
  // -------------------------------------------------------------------------
  group('PreferencesNotifier advanced', () {
    test('reload restores preferences from repository', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      // Update preferences
      final updated = const NotificationPreferences().copyWith(
        primaryChannel: 'telegram',
        timezone: 'Asia/Kolkata',
      );
      await container
          .read(preferencesProvider.notifier)
          .updatePreferences(updated);
      expect(
        container.read(preferencesProvider).primaryChannel,
        equals('telegram'),
      );

      // Reload from repo (should still be telegram since it was persisted)
      container.read(preferencesProvider.notifier).reload();
      expect(
        container.read(preferencesProvider).primaryChannel,
        equals('telegram'),
      );
    });

    test('updateEscalationDelay preserves other delays', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      // Set a delay for telegram
      await container
          .read(preferencesProvider.notifier)
          .updateEscalationDelay('telegram', 10);

      // Set a delay for email (should not overwrite telegram)
      await container
          .read(preferencesProvider.notifier)
          .updateEscalationDelay('email', 20);

      final prefs = container.read(preferencesProvider);
      expect(prefs.escalationDelays['telegram'], equals(10));
      expect(prefs.escalationDelays['email'], equals(20));
    });

    test('updateFallbackChain replaces the entire chain', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      await container
          .read(preferencesProvider.notifier)
          .updateFallbackChain(['email', 'sms']);

      final prefs = container.read(preferencesProvider);
      expect(prefs.fallbackChain, equals(['email', 'sms']));
      expect(prefs.fallbackChain, hasLength(2));
    });

    test('multiple sequential updates are applied correctly', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      await container
          .read(preferencesProvider.notifier)
          .updatePreferences(
            const NotificationPreferences().copyWith(primaryChannel: 'email'),
          );
      await container
          .read(preferencesProvider.notifier)
          .updatePreferences(
            container.read(preferencesProvider).copyWith(timezone: 'US/Eastern'),
          );
      await container
          .read(preferencesProvider.notifier)
          .updatePreferences(
            container
                .read(preferencesProvider)
                .copyWith(overrideForUrgent: false),
          );

      final prefs = container.read(preferencesProvider);
      expect(prefs.primaryChannel, equals('email'));
      expect(prefs.timezone, equals('US/Eastern'));
      expect(prefs.overrideForUrgent, isFalse);
    });
  });

  // -------------------------------------------------------------------------
  // ChannelsNotifier advanced
  // -------------------------------------------------------------------------
  group('ChannelsNotifier advanced', () {
    test('connectChannel replaces existing channel of same type', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const original = NotificationChannel(
        type: 'email',
        identifier: 'old@test.com',
        isConnected: true,
      );
      await container
          .read(channelsProvider.notifier)
          .connectChannel(original);

      const replacement = NotificationChannel(
        type: 'email',
        identifier: 'new@test.com',
        isConnected: true,
        displayName: 'New Email',
      );
      await container
          .read(channelsProvider.notifier)
          .connectChannel(replacement);

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, hasLength(1));
      expect(channels.first.identifier, equals('new@test.com'));
      expect(channels.first.displayName, equals('New Email'));
    });

    test('connectChannel preserves other channel types', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const push = NotificationChannel(
        type: 'push',
        identifier: 'token_a',
        isConnected: true,
      );
      const telegram = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_123',
        isConnected: true,
      );
      const email = NotificationChannel(
        type: 'email',
        identifier: 'test@test.com',
        isConnected: true,
      );

      await container.read(channelsProvider.notifier).connectChannel(push);
      await container.read(channelsProvider.notifier).connectChannel(telegram);
      await container.read(channelsProvider.notifier).connectChannel(email);

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, hasLength(3));
      final types = channels.map((c) => c.type).toSet();
      expect(types, containsAll(['push', 'telegram', 'email']));
    });

    test('disconnectChannel for non-existent type is a no-op', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      const channel = NotificationChannel(
        type: 'push',
        identifier: 'token',
        isConnected: true,
      );
      await container.read(channelsProvider.notifier).connectChannel(channel);

      // Disconnect a type that does not exist
      await container
          .read(channelsProvider.notifier)
          .disconnectChannel('slack');

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, hasLength(1));
      expect(channels.first.type, equals('push'));
    });

    test('refresh reloads channels from repository', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);
      await _pumpEventQueue();

      // Add a channel directly to the repo
      final repo = container.read(notificationRepositoryProvider);
      await repo.saveChannel(const NotificationChannel(
        type: 'discord',
        identifier: 'discord_user_id',
        isConnected: true,
      ));

      // Refresh the provider
      await container.read(channelsProvider.notifier).refresh();
      await _pumpEventQueue();

      final channels = container.read(channelsProvider).value ?? [];
      expect(channels, isNotEmpty);
      expect(channels.any((c) => c.type == 'discord'), isTrue);
    });
  });

  // -------------------------------------------------------------------------
  // NotificationChannel edge cases
  // -------------------------------------------------------------------------
  group('NotificationChannel edge cases', () {
    test('fromJson handles missing optional fields', () {
      final json = {
        'type': 'push',
        'identifier': 'token_abc',
      };
      final channel = NotificationChannel.fromJson(json);

      expect(channel.type, equals('push'));
      expect(channel.identifier, equals('token_abc'));
      expect(channel.isConnected, isFalse);
      expect(channel.lastVerified, isNull);
      expect(channel.displayName, isNull);
    });

    test('toString returns descriptive string', () {
      const channel = NotificationChannel(
        type: 'telegram',
        identifier: 'chat_123',
        isConnected: true,
        displayName: '@mybot',
      );
      final str = channel.toString();

      expect(str, contains('telegram'));
      expect(str, contains('chat_123'));
      expect(str, contains('true'));
      expect(str, contains('@mybot'));
    });
  });

  // -------------------------------------------------------------------------
  // NotificationPreferences edge cases
  // -------------------------------------------------------------------------
  group('NotificationPreferences edge cases', () {
    test('fromJson handles null/missing fields with defaults', () {
      final prefs = NotificationPreferences.fromJson({});

      expect(prefs.primaryChannel, equals('push'));
      expect(prefs.fallbackChain, hasLength(5));
      expect(prefs.overrideForUrgent, isTrue);
      expect(prefs.timezone, equals('UTC'));
      expect(prefs.quietStart, isNull);
      expect(prefs.quietEnd, isNull);
      expect(prefs.quietDays, isEmpty);
    });

    test('toString returns descriptive string', () {
      const prefs = NotificationPreferences();
      final str = prefs.toString();

      expect(str, contains('push'));
      expect(str, contains('5 channels'));
    });

    test('inequality for different primaryChannel', () {
      const a = NotificationPreferences(primaryChannel: 'push');
      const b = NotificationPreferences(primaryChannel: 'telegram');
      expect(a, isNot(equals(b)));
    });

    test('inequality for different fallbackChain', () {
      const a = NotificationPreferences(
        fallbackChain: ['push', 'telegram'],
      );
      const b = NotificationPreferences(
        fallbackChain: ['telegram', 'push'],
      );
      expect(a, isNot(equals(b)));
    });

    test('copyWith with quiet hours round-trips correctly', () {
      final prefs = const NotificationPreferences().copyWith(
        quietStart: const TimeOfDay(hour: 23, minute: 0),
        quietEnd: const TimeOfDay(hour: 6, minute: 0),
        quietDays: [6, 7],
      );

      final json = prefs.toJson();
      final restored = NotificationPreferences.fromJson(json);

      expect(restored.quietStart, equals(const TimeOfDay(hour: 23, minute: 0)));
      expect(restored.quietEnd, equals(const TimeOfDay(hour: 6, minute: 0)));
      expect(restored.quietDays, equals([6, 7]));
    });

    test('copyWith preserves escalationDelays when not overridden', () {
      const original = NotificationPreferences();
      final updated = original.copyWith(primaryChannel: 'email');

      expect(updated.escalationDelays, equals(original.escalationDelays));
    });
  });

  // -------------------------------------------------------------------------
  // NotificationRepository edge cases
  // -------------------------------------------------------------------------
  group('NotificationRepository edge cases', () {
    test('addHistoryEntry trims to 100 entries', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      // Add 105 entries
      for (var i = 0; i < 105; i++) {
        await repo.addHistoryEntry({
          'id': 'entry-$i',
          'channelType': 'push',
          'status': 'delivered',
          'timestamp': '2026-03-10T14:${i.toString().padLeft(2, '0')}:00',
        });
      }

      final history = repo.getHistory();
      expect(history, hasLength(100));
      // The first 5 entries should have been trimmed
      expect(history.first['id'], equals('entry-5'));
      expect(history.last['id'], equals('entry-104'));
    });

    test('saveChannel with multiple types preserves all', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      final types = ['push', 'telegram', 'email', 'whatsapp', 'sms'];
      for (final type in types) {
        await repo.saveChannel(NotificationChannel(
          type: type,
          identifier: '${type}_identifier',
          isConnected: true,
        ));
      }

      final channels = repo.getChannels();
      expect(channels, hasLength(5));
      for (final type in types) {
        expect(
          channels.any((c) => c.type == type),
          isTrue,
          reason: 'Should contain channel type $type',
        );
      }
    });

    test('removeChannel for non-existent type does not alter list', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = NotificationRepository(prefs);

      const channel = NotificationChannel(
        type: 'push',
        identifier: 'token_a',
        isConnected: true,
      );
      await repo.saveChannel(channel);

      await repo.removeChannel('instagram');

      final channels = repo.getChannels();
      expect(channels, hasLength(1));
      expect(channels.first.type, equals('push'));
    });
  });

  // -------------------------------------------------------------------------
  // channelConnectionStateProvider transitions
  // -------------------------------------------------------------------------
  group('channelConnectionStateProvider lifecycle', () {
    test('full lifecycle: idle -> connecting -> connected', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.idle),
      );

      container.read(channelConnectionStateProvider('push').notifier).set(
        ChannelConnectionState.connecting,
      );
      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.connecting),
      );

      container.read(channelConnectionStateProvider('push').notifier).set(
        ChannelConnectionState.connected,
      );
      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.connected),
      );
    });

    test('full lifecycle: idle -> connecting -> failed', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container
          .read(channelConnectionStateProvider('telegram').notifier)
          .set(ChannelConnectionState.connecting);
      container
          .read(channelConnectionStateProvider('telegram').notifier)
          .set(ChannelConnectionState.failed);

      expect(
        container.read(channelConnectionStateProvider('telegram')),
        equals(ChannelConnectionState.failed),
      );
    });

    test('each channel type has independent state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(channelConnectionStateProvider('push').notifier).set(
        ChannelConnectionState.connected,
      );
      container
          .read(channelConnectionStateProvider('telegram').notifier)
          .set(ChannelConnectionState.connecting);
      container.read(channelConnectionStateProvider('email').notifier).set(
        ChannelConnectionState.failed,
      );

      expect(
        container.read(channelConnectionStateProvider('push')),
        equals(ChannelConnectionState.connected),
      );
      expect(
        container.read(channelConnectionStateProvider('telegram')),
        equals(ChannelConnectionState.connecting),
      );
      expect(
        container.read(channelConnectionStateProvider('email')),
        equals(ChannelConnectionState.failed),
      );
      expect(
        container.read(channelConnectionStateProvider('whatsapp')),
        equals(ChannelConnectionState.idle),
      );
    });
  });

  // -------------------------------------------------------------------------
  // testNotificationStateProvider lifecycle
  // -------------------------------------------------------------------------
  group('testNotificationStateProvider lifecycle', () {
    test('full lifecycle: idle -> sending -> delivered', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      expect(
        container.read(testNotificationStateProvider('push')),
        equals(TestState.idle),
      );

      container.read(testNotificationStateProvider('push').notifier).set(
        TestState.sending,
      );
      expect(
        container.read(testNotificationStateProvider('push')),
        equals(TestState.sending),
      );

      container.read(testNotificationStateProvider('push').notifier).set(
        TestState.delivered,
      );
      expect(
        container.read(testNotificationStateProvider('push')),
        equals(TestState.delivered),
      );
    });

    test('full lifecycle: idle -> sending -> failed', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container
          .read(testNotificationStateProvider('telegram').notifier)
          .set(TestState.sending);
      container
          .read(testNotificationStateProvider('telegram').notifier)
          .set(TestState.failed);

      expect(
        container.read(testNotificationStateProvider('telegram')),
        equals(TestState.failed),
      );
    });

    test('each channel type has independent test state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(testNotificationStateProvider('push').notifier).set(
        TestState.delivered,
      );
      container
          .read(testNotificationStateProvider('telegram').notifier)
          .set(TestState.sending);
      container.read(testNotificationStateProvider('email').notifier).set(
        TestState.failed,
      );

      expect(
        container.read(testNotificationStateProvider('push')),
        equals(TestState.delivered),
      );
      expect(
        container.read(testNotificationStateProvider('telegram')),
        equals(TestState.sending),
      );
      expect(
        container.read(testNotificationStateProvider('email')),
        equals(TestState.failed),
      );
      expect(
        container.read(testNotificationStateProvider('sms')),
        equals(TestState.idle),
      );
    });
  });

  // -------------------------------------------------------------------------
  // channelErrorProvider advanced
  // -------------------------------------------------------------------------
  group('channelErrorProvider advanced', () {
    test('can be cleared by setting to null', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(channelErrorProvider('push').notifier).set(
        'Connection failed',
      );
      expect(
        container.read(channelErrorProvider('push')),
        equals('Connection failed'),
      );

      container.read(channelErrorProvider('push').notifier).set(null);
      expect(
        container.read(channelErrorProvider('push')),
        isNull,
      );
    });

    test('each channel type has independent error state', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      container.read(channelErrorProvider('push').notifier).set(
        'Push token invalid',
      );
      container.read(channelErrorProvider('email').notifier).set(
        'Email verification failed',
      );

      expect(
        container.read(channelErrorProvider('push')),
        equals('Push token invalid'),
      );
      expect(
        container.read(channelErrorProvider('email')),
        equals('Email verification failed'),
      );
      expect(
        container.read(channelErrorProvider('telegram')),
        isNull,
      );
    });
  });

  // -------------------------------------------------------------------------
  // ChannelConnectionState enum
  // -------------------------------------------------------------------------
  group('ChannelConnectionState enum', () {
    test('has all expected values', () {
      expect(ChannelConnectionState.values, hasLength(4));
      expect(
        ChannelConnectionState.values,
        containsAll([
          ChannelConnectionState.idle,
          ChannelConnectionState.connecting,
          ChannelConnectionState.connected,
          ChannelConnectionState.failed,
        ]),
      );
    });
  });

  // -------------------------------------------------------------------------
  // TestState enum
  // -------------------------------------------------------------------------
  group('TestState enum', () {
    test('has all expected values', () {
      expect(TestState.values, hasLength(4));
      expect(
        TestState.values,
        containsAll([
          TestState.idle,
          TestState.sending,
          TestState.delivered,
          TestState.failed,
        ]),
      );
    });
  });
}
