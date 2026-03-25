import '../api_client.dart';
import '../api_response.dart';

/// API service for channel connection management.
///
/// Maps to backend routes under /api/v1/channels.
class ChannelApiService {
  final ApiClient _client;

  const ChannelApiService(this._client);

  /// List all connected channels for the authenticated user.
  Future<ApiResponse<List<dynamic>>> getChannels() {
    return _client.get('/channels');
  }

  /// Connect a push notification channel.
  Future<ApiResponse<Map<String, dynamic>>> connectPush(String token) {
    return _client.post('/channels/push/connect', data: {'token': token});
  }

  /// Connect a Telegram channel via verification token.
  Future<ApiResponse<Map<String, dynamic>>> connectTelegram(String token) {
    return _client.post('/channels/telegram/connect', data: {'token': token});
  }

  /// Connect an email channel.
  Future<ApiResponse<Map<String, dynamic>>> connectEmail(String email) {
    return _client.post('/channels/email/connect', data: {'email': email});
  }

  /// Connect a WhatsApp channel.
  ///
  /// [phoneNumber] should be digits only, [countryCode] includes the + prefix.
  Future<ApiResponse<Map<String, dynamic>>> connectWhatsApp({
    required String phoneNumber,
    required String countryCode,
  }) {
    return _client.post('/channels/whatsapp/connect', data: {
      'phoneNumber': phoneNumber,
      'countryCode': countryCode,
    });
  }

  /// Connect an SMS channel (same schema as WhatsApp on backend).
  Future<ApiResponse<Map<String, dynamic>>> connectSms({
    required String phoneNumber,
    required String countryCode,
  }) {
    return _client.post('/channels/sms/connect', data: {
      'phoneNumber': phoneNumber,
      'countryCode': countryCode,
    });
  }

  /// Connect an Instagram channel.
  Future<ApiResponse<Map<String, dynamic>>> connectInstagram(String username) {
    return _client.post(
      '/channels/instagram/connect',
      data: {'username': username},
    );
  }

  /// Generic connect for OAuth-based channels (slack, discord).
  ///
  /// [type] is the channel type, [identifier] is the OAuth token/user id.
  Future<ApiResponse<Map<String, dynamic>>> connectOAuth(
    String type,
    String identifier,
  ) {
    return _client.post(
      '/channels/$type/connect',
      data: {'token': identifier},
    );
  }

  /// Send a test notification to a specific connected channel.
  Future<ApiResponse<Map<String, dynamic>>> testChannel(String type) {
    return _client.post('/channels/$type/test');
  }

  /// Disconnect a channel by type.
  Future<ApiResponse<Map<String, dynamic>>> disconnectChannel(String type) {
    return _client.delete('/channels/$type');
  }

  /// Get the Telegram bot deep link for a user.
  ///
  /// Constructs the start link with the user's ID so the bot can
  /// associate the Telegram chat with the user's UNJYNX account.
  String getTelegramBotLink(String userId) {
    return 'https://t.me/UnjynxBot?start=$userId';
  }
}
