import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../domain/notification_channel.dart';
import '../domain/notification_preferences.dart';

/// Persists notification channels and preferences via [SharedPreferences].
///
/// All reads return fresh immutable objects. All writes replace existing data
/// (no in-place mutation).
class NotificationRepository {
  static const _channelsKey = 'unjynx_notification_channels';
  static const _prefsKey = 'unjynx_notification_preferences';
  static const _historyKey = 'unjynx_notification_history';

  final SharedPreferences _prefs;

  const NotificationRepository(this._prefs);

  // ---------------------------------------------------------------------------
  // Channel CRUD
  // ---------------------------------------------------------------------------

  /// Returns all saved channels as an immutable list.
  List<NotificationChannel> getChannels() {
    final raw = _prefs.getString(_channelsKey);
    if (raw == null || raw.isEmpty) return const [];

    final decoded = jsonDecode(raw) as List<dynamic>;
    return List<NotificationChannel>.unmodifiable(
      decoded
          .cast<Map<String, dynamic>>()
          .map(NotificationChannel.fromJson),
    );
  }

  /// Saves or updates a channel. If a channel with the same [type] exists,
  /// it is replaced. Returns a new list of all channels.
  Future<List<NotificationChannel>> saveChannel(
    NotificationChannel channel,
  ) async {
    final existing = getChannels();
    final updated = [
      ...existing.where((c) => c.type != channel.type),
      channel,
    ];
    await _prefs.setString(
      _channelsKey,
      jsonEncode(updated.map((c) => c.toJson()).toList()),
    );
    return List<NotificationChannel>.unmodifiable(updated);
  }

  /// Removes a channel by [type]. Returns the remaining channels.
  Future<List<NotificationChannel>> removeChannel(String type) async {
    final existing = getChannels();
    final updated = existing.where((c) => c.type != type).toList();
    await _prefs.setString(
      _channelsKey,
      jsonEncode(updated.map((c) => c.toJson()).toList()),
    );
    return List<NotificationChannel>.unmodifiable(updated);
  }

  // ---------------------------------------------------------------------------
  // Preferences
  // ---------------------------------------------------------------------------

  /// Returns the current notification preferences.
  NotificationPreferences getPreferences() {
    final raw = _prefs.getString(_prefsKey);
    if (raw == null || raw.isEmpty) return const NotificationPreferences();

    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return NotificationPreferences.fromJson(decoded);
  }

  /// Saves notification preferences.
  Future<void> savePreferences(NotificationPreferences prefs) async {
    await _prefs.setString(_prefsKey, jsonEncode(prefs.toJson()));
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  /// Returns the delivery history log entries.
  List<Map<String, dynamic>> getHistory() {
    final raw = _prefs.getString(_historyKey);
    if (raw == null || raw.isEmpty) return const [];

    final decoded = jsonDecode(raw) as List<dynamic>;
    return List<Map<String, dynamic>>.unmodifiable(
      decoded.cast<Map<String, dynamic>>(),
    );
  }

  /// Appends a delivery log entry to the history.
  Future<void> addHistoryEntry(Map<String, dynamic> entry) async {
    final existing = List<Map<String, dynamic>>.from(getHistory());
    final updated = [...existing, entry];
    // Keep only last 100 entries
    final trimmed =
        updated.length > 100 ? updated.sublist(updated.length - 100) : updated;
    await _prefs.setString(_historyKey, jsonEncode(trimmed));
  }

  /// Clears the entire history log.
  Future<void> clearHistory() async {
    await _prefs.remove(_historyKey);
  }
}
