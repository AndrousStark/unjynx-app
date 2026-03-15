import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:service_api/service_api.dart';

import '../../data/notification_repository.dart';
import '../../domain/notification_channel.dart';
import '../../domain/notification_preferences.dart';

// ---------------------------------------------------------------------------
// Device push token (overridden at bootstrap with real FCM token)
// ---------------------------------------------------------------------------

/// The device's FCM/APNs push token for server-side push notifications.
///
/// Override at app bootstrap with the real token from [FcmTokenManager].
/// Returns null when Firebase is not configured.
class _DevicePushTokenNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final devicePushTokenProvider =
    NotifierProvider<_DevicePushTokenNotifier, String?>(
  _DevicePushTokenNotifier.new,
);

// ---------------------------------------------------------------------------
// Repository provider (offline cache via SharedPreferences)
// ---------------------------------------------------------------------------

/// Repository provider -- must be overridden in ProviderScope.
final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => throw StateError(
    'notificationRepositoryProvider must be overridden. '
    'Call overrideNotificationRepository() in app bootstrap.',
  ),
);

/// Override helper called from the app shell after DI is ready.
Override overrideNotificationRepository(NotificationRepository repository) {
  return notificationRepositoryProvider.overrideWithValue(repository);
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

/// Async state wrapper for channel operations.
typedef ChannelsState = AsyncValue<List<NotificationChannel>>;

/// Manages the list of notification channels.
///
/// Fetches from API first, falls back to local cache if offline.
/// Writes go to API first, then update local cache on success.
class ChannelsNotifier extends Notifier<ChannelsState> {
  @override
  ChannelsState build() {
    final repo = ref.watch(notificationRepositoryProvider);
    final channelApi = _tryRead(ref, channelApiProvider);
    // Schedule after build() returns so Riverpod 3's handleCreate doesn't
    // overwrite the state set by _loadChannels.
    Future.microtask(() => _loadChannels(repo, channelApi));
    return const AsyncLoading();
  }

  NotificationRepository get _repo => ref.read(notificationRepositoryProvider);
  ChannelApiService? get _channelApi => _tryRead(ref, channelApiProvider);

  /// Loads channels from API, falls back to local cache.
  Future<void> _loadChannels(
    NotificationRepository repo,
    ChannelApiService? channelApi,
  ) async {
    if (channelApi == null) {
      state = AsyncData(repo.getChannels());
      return;
    }

    try {
      final response = await channelApi.getChannels();
      if (response.success && response.data != null) {
        final channels = (response.data! as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .map(NotificationChannel.fromJson)
            .toList();
        // Write-through to local cache
        for (final channel in channels) {
          await repo.saveChannel(channel);
        }
        state = AsyncData(List<NotificationChannel>.unmodifiable(channels));
        return;
      }
    } on DioException {
      // Network error -- fall back to cache
    }
    state = AsyncData(repo.getChannels());
  }

  /// Refreshes channels from API.
  Future<void> refresh() async {
    state = const AsyncLoading();
    await _loadChannels(_repo, _channelApi);
  }

  /// Connects (saves) a channel via API with local cache fallback.
  Future<void> connectChannel(NotificationChannel channel) async {
    // Optimistic update
    final previous = state.value ?? [];
    final optimistic = [
      ...previous.where((c) => c.type != channel.type),
      channel,
    ];
    state = AsyncData(List<NotificationChannel>.unmodifiable(optimistic));

    // Persist to local cache
    await _repo.saveChannel(channel);
  }

  /// Disconnects (removes) a channel by type.
  ///
  /// Calls API first, then updates local cache. On API failure, rolls back.
  Future<void> disconnectChannel(String type) async {
    final previous = state.value ?? [];

    // Optimistic update
    final optimistic = previous.where((c) => c.type != type).toList();
    state = AsyncData(List<NotificationChannel>.unmodifiable(optimistic));

    final channelApi = _channelApi;
    if (channelApi != null) {
      try {
        final response = await channelApi.disconnectChannel(type);
        if (!response.success) {
          // Rollback on failure
          state = AsyncData(List<NotificationChannel>.unmodifiable(previous));
          return;
        }
      } on DioException {
        // Rollback on network error
        state = AsyncData(List<NotificationChannel>.unmodifiable(previous));
        return;
      }
    }

    // Persist to local cache
    await _repo.removeChannel(type);
  }
}

/// Provider for the list of notification channels (async).
final channelsProvider = NotifierProvider<ChannelsNotifier, ChannelsState>(
  ChannelsNotifier.new,
);

/// Derived provider: only connected channels.
final connectedChannelsProvider = Provider<List<NotificationChannel>>((ref) {
  final channelsAsync = ref.watch(channelsProvider);
  final channels = channelsAsync.value ?? [];
  return List<NotificationChannel>.unmodifiable(
    channels.where((c) => c.isConnected),
  );
});

/// Derived provider: channels list value (non-async, for backward compat).
final channelsListProvider = Provider<List<NotificationChannel>>((ref) {
  final channelsAsync = ref.watch(channelsProvider);
  return channelsAsync.value ?? [];
});

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/// Manages notification delivery preferences.
///
/// Saves to API first, then updates local cache.
class PreferencesNotifier extends Notifier<NotificationPreferences> {
  @override
  NotificationPreferences build() {
    final repo = ref.watch(notificationRepositoryProvider);
    _loadFromApi(repo);
    return repo.getPreferences();
  }

  NotificationRepository get _repo => ref.read(notificationRepositoryProvider);
  NotificationApiService? get _notifApi => _tryRead(ref, notificationApiProvider);

  /// Load preferences from API on startup, fall back to local.
  Future<void> _loadFromApi(NotificationRepository repo) async {
    final notifApi = _tryRead(ref, notificationApiProvider);
    if (notifApi == null) return;

    try {
      final response = await notifApi.getPreferences();
      if (response.success && response.data != null) {
        final prefs = NotificationPreferences.fromJson(
          response.data! as Map<String, dynamic>,
        );
        await repo.savePreferences(prefs);
        state = prefs;
      }
    } on DioException {
      // Keep local cache value
    }
  }

  /// Updates and persists preferences -- API first, then local cache.
  Future<void> updatePreferences(NotificationPreferences prefs) async {
    final previous = state;

    // Optimistic update
    state = prefs;

    final notifApi = _notifApi;
    if (notifApi != null) {
      try {
        final response = await notifApi.updatePreferences(prefs.toJson());
        if (!response.success) {
          state = previous; // Rollback
          return;
        }
      } on DioException {
        state = previous; // Rollback
        return;
      }
    }

    await _repo.savePreferences(prefs);
  }

  /// Updates the fallback chain order.
  Future<void> updateFallbackChain(List<String> chain) async {
    final updated = state.copyWith(fallbackChain: chain);
    await updatePreferences(updated);
  }

  /// Updates the escalation delay for a specific channel.
  Future<void> updateEscalationDelay(String channelType, int minutes) async {
    final newDelays = Map<String, int>.from(state.escalationDelays);
    newDelays[channelType] = minutes;
    final updated = state.copyWith(escalationDelays: newDelays);
    await updatePreferences(updated);
  }

  /// Reloads preferences from local storage.
  void reload() {
    state = _repo.getPreferences();
  }
}

/// Provider for notification preferences.
final preferencesProvider =
    NotifierProvider<PreferencesNotifier, NotificationPreferences>(
  PreferencesNotifier.new,
);

// ---------------------------------------------------------------------------
// Quota
// ---------------------------------------------------------------------------

/// Provider for notification quota usage (fetched from API).
final quotaProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final notifApi = _tryRead(ref, notificationApiProvider);
  if (notifApi == null) return {};

  final response = await notifApi.getQuota();
  if (response.success && response.data != null) {
    return response.data!;
  }
  return {};
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

/// Manages delivery history with API-first, local cache fallback.
class HistoryNotifier extends AsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() async {
    final repo = ref.watch(notificationRepositoryProvider);
    final notifApi = _tryRead(ref, notificationApiProvider);
    return _load(repo, notifApi);
  }

  Future<List<Map<String, dynamic>>> _load(
    NotificationRepository repo,
    NotificationApiService? notifApi,
  ) async {
    if (notifApi == null) {
      return repo.getHistory();
    }

    try {
      final response = await notifApi.getDeliveryHistory(limit: 100);
      if (response.success && response.data != null) {
        final entries = (response.data! as List<dynamic>)
            .cast<Map<String, dynamic>>();
        return List<Map<String, dynamic>>.unmodifiable(entries);
      }
    } on DioException {
      // Fall back to local
    }
    return repo.getHistory();
  }

  /// Refresh history from API.
  Future<void> refresh() async {
    state = const AsyncLoading();
    final repo = ref.read(notificationRepositoryProvider);
    final notifApi = _tryRead(ref, notificationApiProvider);
    state = await AsyncValue.guard(() => _load(repo, notifApi));
  }
}

/// Provider for delivery history log entries (API-first with local fallback).
final historyProvider =
    AsyncNotifierProvider<HistoryNotifier, List<Map<String, dynamic>>>(
  HistoryNotifier.new,
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Safely tries to read a provider that may not exist in the scope.
///
/// When feature_notifications is used without service_api providers
/// being overridden (e.g. in tests), this returns null instead of throwing.
T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}
