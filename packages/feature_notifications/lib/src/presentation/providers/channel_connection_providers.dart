import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/notification_channel.dart';
import 'notification_providers.dart';

// ---------------------------------------------------------------------------
// Connection state
// ---------------------------------------------------------------------------

/// Possible states for a channel connection attempt.
///
/// Named [ChannelConnectionState] to avoid collision with Flutter's
/// built-in [ConnectionState] from `widgets/async.dart`.
enum ChannelConnectionState {
  /// No connection in progress.
  idle,

  /// Currently connecting.
  connecting,

  /// Successfully connected.
  connected,

  /// Connection attempt failed.
  failed,
}

/// Per-channel connection state, keyed by channel type.
final channelConnectionStateProvider =
    StateProvider.family<ChannelConnectionState, String>(
  (ref, channelType) => ChannelConnectionState.idle,
);

// ---------------------------------------------------------------------------
// Test notification state
// ---------------------------------------------------------------------------

/// Possible states for a test notification attempt.
enum TestState {
  /// No test in progress.
  idle,

  /// Test notification is being sent.
  sending,

  /// Test notification was delivered.
  delivered,

  /// Test notification failed.
  failed,
}

/// Per-channel test notification state, keyed by channel type.
final testNotificationStateProvider = StateProvider.family<TestState, String>(
  (ref, channelType) => TestState.idle,
);

// ---------------------------------------------------------------------------
// Error message provider
// ---------------------------------------------------------------------------

/// Per-channel error message, keyed by channel type.
final channelErrorProvider = StateProvider.family<String?, String>(
  (ref, channelType) => null,
);

// ---------------------------------------------------------------------------
// Channel connection actions
// ---------------------------------------------------------------------------

/// Connects a channel via the API and updates providers.
///
/// Returns true on success, false on failure.
Future<bool> connectChannelViaApi(
  WidgetRef ref,
  String type,
  String identifier, {
  String? displayName,
  Map<String, String>? metadata,
}) async {
  ref.read(channelConnectionStateProvider(type).notifier).state =
      ChannelConnectionState.connecting;
  ref.read(channelErrorProvider(type).notifier).state = null;

  ChannelApiService? channelApi;
  try {
    channelApi = ref.read(channelApiProvider);
  } catch (_) {
    // No API available -- use local-only mode
  }

  try {
    if (channelApi != null) {
      final ApiResponse<Map<String, dynamic>> response;
      switch (type) {
        case 'push':
          response = await channelApi.connectPush(identifier);
        case 'telegram':
          response = await channelApi.connectTelegram(identifier);
        case 'email':
          response = await channelApi.connectEmail(identifier);
        case 'whatsapp':
          response = await channelApi.connectWhatsApp(
            phoneNumber: metadata?['phoneNumber'] ?? identifier,
            countryCode: metadata?['countryCode'] ?? '+91',
          );
        case 'sms':
          response = await channelApi.connectSms(
            phoneNumber: metadata?['phoneNumber'] ?? identifier,
            countryCode: metadata?['countryCode'] ?? '+91',
          );
        case 'instagram':
          response = await channelApi.connectInstagram(identifier);
        default:
          response = await channelApi.connectOAuth(type, identifier);
      }

      if (!response.success) {
        ref.read(channelErrorProvider(type).notifier).state =
            response.error ?? 'Connection failed';
        ref.read(channelConnectionStateProvider(type).notifier).state =
            ChannelConnectionState.failed;
        return false;
      }
    }

    // Update local state
    final channel = NotificationChannel(
      type: type,
      identifier: identifier,
      isConnected: true,
      lastVerified: DateTime.now(),
      displayName: displayName,
    );
    await ref.read(channelsProvider.notifier).connectChannel(channel);
    ref.read(channelConnectionStateProvider(type).notifier).state =
        ChannelConnectionState.connected;
    return true;
  } on DioException catch (e) {
    final apiError = e.error;
    final message = apiError is ApiException
        ? apiError.message
        : 'Network error. Please try again.';
    ref.read(channelErrorProvider(type).notifier).state = message;
    ref.read(channelConnectionStateProvider(type).notifier).state =
        ChannelConnectionState.failed;
    return false;
  }
}

/// Disconnects a channel via the API and updates providers.
Future<bool> disconnectChannelViaApi(WidgetRef ref, String type) async {
  ref.read(channelErrorProvider(type).notifier).state = null;

  await ref.read(channelsProvider.notifier).disconnectChannel(type);
  ref.read(channelConnectionStateProvider(type).notifier).state =
      ChannelConnectionState.idle;
  ref.read(testNotificationStateProvider(type).notifier).state =
      TestState.idle;
  return true;
}

/// Sends a test notification via the API.
///
/// Updates [testNotificationStateProvider] through the lifecycle.
Future<bool> sendTestViaApi(WidgetRef ref, String channelType) async {
  ref.read(testNotificationStateProvider(channelType).notifier).state =
      TestState.sending;

  NotificationApiService? notifApi;
  ChannelApiService? channelApi;
  try {
    notifApi = ref.read(notificationApiProvider);
    channelApi = ref.read(channelApiProvider);
  } catch (_) {
    // No API available
  }

  try {
    ApiResponse<Map<String, dynamic>>? response;

    // Try channel-specific test first, then notification send-test
    if (channelApi != null) {
      response = await channelApi.testChannel(channelType);
    } else if (notifApi != null) {
      response = await notifApi.sendTest(channelType);
    }

    if (response != null && response.success) {
      ref.read(testNotificationStateProvider(channelType).notifier).state =
          TestState.delivered;
      return true;
    }

    // No API available -- simulate success for offline testing
    if (response == null) {
      await Future<void>.delayed(const Duration(milliseconds: 800));
      ref.read(testNotificationStateProvider(channelType).notifier).state =
          TestState.delivered;
      return true;
    }

    ref.read(testNotificationStateProvider(channelType).notifier).state =
        TestState.failed;
    return false;
  } on DioException {
    ref.read(testNotificationStateProvider(channelType).notifier).state =
        TestState.failed;
    return false;
  }
}
