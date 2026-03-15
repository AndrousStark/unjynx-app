import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

/// SharedPreferences-backed implementation of [UserPreferencesPort].
///
/// Uses SharedPreferences instead of Drift to avoid build_runner dependency.
/// Keys prefixed with 'unjynx_prefs_' to avoid collisions.
class SharedPrefsUserPreferencesAdapter implements UserPreferencesPort {
  SharedPrefsUserPreferencesAdapter(this._prefs);

  final SharedPreferences _prefs;

  static const _prefix = 'unjynx_prefs_';
  static const _identityKey = '${_prefix}identity';
  static const _goalsKey = '${_prefix}goals';
  static const _channelPrefsKey = '${_prefix}channel_prefs';
  static const _contentCategoriesKey = '${_prefix}content_categories';
  static const _deliverAtKey = '${_prefix}deliver_at';
  static const _notifPermissionKey = '${_prefix}notification_permission';

  @override
  Future<UserPreferences> getPreferences() async {
    return UserPreferences(
      identity: _prefs.getString(_identityKey),
      goals: _getStringList(_goalsKey),
      channelPrefs: _getMap(_channelPrefsKey),
      contentCategories: _getStringList(_contentCategoriesKey),
      contentDeliverAt: _prefs.getString(_deliverAtKey) ?? '07:00',
      notificationPermission:
          _prefs.getString(_notifPermissionKey) ?? 'not_asked',
    );
  }

  @override
  Future<void> saveIdentity(String identity) async {
    await _prefs.setString(_identityKey, identity);
  }

  @override
  Future<void> saveGoals(List<String> goals) async {
    await _prefs.setStringList(_goalsKey, goals);
  }

  @override
  Future<void> saveChannelPrefs(Map<String, bool> prefs) async {
    await _prefs.setString(_channelPrefsKey, jsonEncode(prefs));
  }

  @override
  Future<void> saveContentCategories(
    List<String> categories,
    String deliverAt,
  ) async {
    await _prefs.setStringList(_contentCategoriesKey, categories);
    await _prefs.setString(_deliverAtKey, deliverAt);
  }

  @override
  Future<void> saveNotificationPermission(String status) async {
    await _prefs.setString(_notifPermissionKey, status);
  }

  List<String> _getStringList(String key) {
    return _prefs.getStringList(key) ?? [];
  }

  Map<String, bool> _getMap(String key) {
    final json = _prefs.getString(key);
    if (json == null || json.isEmpty) return {};
    final decoded = jsonDecode(json);
    if (decoded is Map) {
      return decoded
          .map((key, value) => MapEntry(key as String, value as bool));
    }
    return {};
  }
}
