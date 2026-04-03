import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

T? _tryRead<T>(Ref ref, Provider<T> provider) {
  try {
    return ref.watch(provider);
  } catch (_) {
    return null;
  }
}

/// Currently selected channel ID.
class _SelectedChannelNotifier extends Notifier<String?> {
  @override
  String? build() => null;
  void set(String? value) => state = value;
}

final selectedChannelProvider =
    NotifierProvider<_SelectedChannelNotifier, String?>(
      _SelectedChannelNotifier.new,
    );

/// All channels the user belongs to.
final channelsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = _tryRead(ref, messagingApiProvider);
  if (api == null) return const [];

  try {
    final r = await api.getChannels();
    if (r.success && r.data != null) {
      return r.data!.cast<Map<String, dynamic>>();
    }
  } on DioException {
    // Network error.
  } on ApiException {
    // API error.
  }

  return const [];
});

/// Messages for the selected channel.
final messagesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      channelId,
    ) async {
      final api = _tryRead(ref, messagingApiProvider);
      if (api == null) return const [];

      try {
        final r = await api.getMessages(channelId);
        if (r.success && r.data != null) {
          return r.data!.cast<Map<String, dynamic>>();
        }
      } on DioException {
        // Network error.
      } on ApiException {
        // API error.
      }

      return const [];
    });

/// Unread counts per channel.
final unreadCountsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = _tryRead(ref, messagingApiProvider);
  if (api == null) return const {};

  try {
    final r = await api.getUnreadCounts();
    if (r.success && r.data != null) return r.data!;
  } on DioException {
    // Network error.
  }

  return const {};
});
