import 'package:flutter/widgets.dart';

import '../events/event_bus.dart';

/// Abstract base class for all UNJYNX plugins.
///
/// Each feature is a plugin that registers itself with the app:
/// - Routes it provides
/// - Event listeners it needs
/// - Services it depends on
abstract class UnjynxPlugin {
  /// Unique identifier for this plugin (e.g., 'todos', 'calendar').
  String get id;

  /// Human-readable name.
  String get name;

  /// Plugin version.
  String get version;

  /// Initialize the plugin. Called once during app bootstrap.
  Future<void> initialize(EventBus eventBus);

  /// Return the routes this plugin provides.
  List<PluginRoute> get routes;

  /// Dispose resources when the plugin is unloaded.
  Future<void> dispose();
}

/// A route provided by a plugin.
class PluginRoute {
  /// URL path (e.g., '/todos').
  final String path;

  /// Widget builder for this route.
  final Widget Function() builder;

  /// Navigation label.
  final String label;

  /// Icon for navigation.
  final IconData icon;

  /// Sort order in the navigation.
  final int sortOrder;

  const PluginRoute({
    required this.path,
    required this.builder,
    required this.label,
    required this.icon,
    this.sortOrder = 0,
  });
}
