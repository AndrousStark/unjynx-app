import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/plugin/plugin_registry.dart';
import 'package:unjynx_core/plugin/unjynx_plugin.dart';

class FakePlugin extends UnjynxPlugin {
  FakePlugin({required this.id, this.sortOrder = 0});

  @override
  final String id;

  @override
  String get name => 'Fake $id';

  @override
  String get version => '0.0.1';

  final int sortOrder;
  bool initialized = false;
  bool disposed = false;

  @override
  Future<void> initialize(EventBus eventBus) async {
    initialized = true;
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/$id',
          builder: () => const SizedBox.shrink(),
          label: name,
          icon: const IconData(0),
          sortOrder: sortOrder,
        ),
      ];

  @override
  Future<void> dispose() async {
    disposed = true;
  }
}

void main() {
  late PluginRegistry registry;
  late EventBus eventBus;

  setUp(() {
    eventBus = EventBus();
    registry = PluginRegistry(eventBus: eventBus);
  });

  tearDown(() {
    eventBus.dispose();
  });

  group('PluginRegistry', () {
    test('starts with no plugins', () {
      expect(registry.plugins, isEmpty);
    });

    test('registers a plugin', () async {
      final plugin = FakePlugin(id: 'test');
      await registry.register(plugin);

      expect(registry.plugins, hasLength(1));
      expect(plugin.initialized, isTrue);
    });

    test('throws on duplicate registration', () async {
      final plugin = FakePlugin(id: 'dupe');
      await registry.register(plugin);

      expect(
        () => registry.register(FakePlugin(id: 'dupe')),
        throwsStateError,
      );
    });

    test('getPlugin returns correct type', () async {
      final plugin = FakePlugin(id: 'typed');
      await registry.register(plugin);

      final found = registry.getPlugin<FakePlugin>('typed');
      expect(found, isNotNull);
      expect(found!.id, 'typed');
    });

    test('getPlugin returns null for unknown id', () {
      expect(registry.getPlugin<FakePlugin>('unknown'), isNull);
    });

    test('allRoutes collects and sorts by sortOrder', () async {
      await registry.register(FakePlugin(id: 'b', sortOrder: 2));
      await registry.register(FakePlugin(id: 'a', sortOrder: 1));
      await registry.register(FakePlugin(id: 'c', sortOrder: 3));

      final routes = registry.allRoutes;
      expect(routes, hasLength(3));
      expect(routes[0].path, '/a');
      expect(routes[1].path, '/b');
      expect(routes[2].path, '/c');
    });

    test('disposeAll disposes all plugins', () async {
      final p1 = FakePlugin(id: 'x');
      final p2 = FakePlugin(id: 'y');
      await registry.register(p1);
      await registry.register(p2);

      await registry.disposeAll();

      expect(p1.disposed, isTrue);
      expect(p2.disposed, isTrue);
      expect(registry.plugins, isEmpty);
    });
  });
}
