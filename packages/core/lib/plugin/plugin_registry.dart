import '../events/event_bus.dart';
import 'unjynx_plugin.dart';

/// Registry that manages all loaded UNJYNX plugins.
///
/// Plugins register during app bootstrap and provide routes,
/// event listeners, and services to the app shell.
class PluginRegistry {
  final EventBus _eventBus;
  final Map<String, UnjynxPlugin> _plugins = {};

  PluginRegistry({required EventBus eventBus}) : _eventBus = eventBus;

  /// Register and initialize a plugin.
  Future<void> register(UnjynxPlugin plugin) async {
    if (_plugins.containsKey(plugin.id)) {
      throw StateError(
        'Plugin "${plugin.id}" is already registered',
      );
    }

    await plugin.initialize(_eventBus);
    _plugins[plugin.id] = plugin;
  }

  /// Get a plugin by ID.
  T? getPlugin<T extends UnjynxPlugin>(String id) {
    final plugin = _plugins[id];
    return plugin is T ? plugin : null;
  }

  /// Get all registered plugins.
  List<UnjynxPlugin> get plugins => List.unmodifiable(_plugins.values);

  /// Collect all routes from all plugins, sorted by sortOrder.
  List<PluginRoute> get allRoutes {
    final routes = _plugins.values.expand((p) => p.routes).toList();
    routes.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    return routes;
  }

  /// Dispose all plugins.
  Future<void> disposeAll() async {
    for (final plugin in _plugins.values) {
      await plugin.dispose();
    }
    _plugins.clear();
  }
}
