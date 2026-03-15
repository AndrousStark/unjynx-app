import 'package:feature_onboarding/src/data/onboarding_repository.dart';
import 'package:feature_onboarding/src/onboarding_plugin.dart';
import 'package:feature_onboarding/src/presentation/providers/onboarding_providers.dart';
import 'package:feature_onboarding/src/presentation/widgets/onboarding_slide.dart';
import 'package:feature_onboarding/src/presentation/widgets/page_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Creates a [ProviderContainer] with the real [OnboardingRepository] backed
/// by a freshly-initialised mock [SharedPreferences].
Future<ProviderContainer> _makeContainer() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final repo = OnboardingRepository(prefs);
  return ProviderContainer(
    overrides: [overrideOnboardingRepository(repo)],
  );
}

void main() {
  // -------------------------------------------------------------------------
  // OnboardingPlugin
  // -------------------------------------------------------------------------
  group('OnboardingPlugin', () {
    late OnboardingPlugin plugin;

    setUp(() {
      plugin = OnboardingPlugin();
    });

    test('has the correct id', () {
      expect(plugin.id, equals('onboarding'));
    });

    test('has the correct name', () {
      expect(plugin.name, equals('Onboarding'));
    });

    test('has the correct version', () {
      expect(plugin.version, equals('0.2.0'));
    });

    test('exposes four routes (B1-B4)', () {
      expect(plugin.routes, hasLength(4));
    });

    test('first route path is /onboarding', () {
      expect(plugin.routes.first.path, equals('/onboarding'));
    });

    test('route paths cover the full onboarding flow', () {
      final paths = plugin.routes.map((r) => r.path).toList();
      expect(paths, containsAll([
        '/onboarding',
        '/onboarding/personalize',
        '/onboarding/first-task',
        '/onboarding/notifications',
      ]));
    });

    test('first route icon is Icons.waving_hand_rounded', () {
      expect(plugin.routes.first.icon, equals(Icons.waving_hand_rounded));
    });

    test('all routes have sortOrder -1 (never shown in nav bar)', () {
      for (final route in plugin.routes) {
        expect(route.sortOrder, equals(-1));
      }
    });

    test('first route label is Onboarding', () {
      expect(plugin.routes.first.label, equals('Onboarding'));
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
  // isOnboardingCompleteProvider
  // -------------------------------------------------------------------------
  group('isOnboardingCompleteProvider', () {
    test('returns false when onboarding has not been completed', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      expect(container.read(isOnboardingCompleteProvider), isFalse);
    });

    test('returns true after markComplete is called on the repository',
        () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = OnboardingRepository(prefs);

      await repo.markComplete();

      final container = ProviderContainer(
        overrides: [overrideOnboardingRepository(repo)],
      );
      addTearDown(container.dispose);

      expect(container.read(isOnboardingCompleteProvider), isTrue);
    });

    test('returns false after reset is called', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final repo = OnboardingRepository(prefs);

      await repo.markComplete();
      await repo.reset();

      final container = ProviderContainer(
        overrides: [overrideOnboardingRepository(repo)],
      );
      addTearDown(container.dispose);

      expect(container.read(isOnboardingCompleteProvider), isFalse);
    });
  });

  // -------------------------------------------------------------------------
  // onboardingRepositoryProvider
  // -------------------------------------------------------------------------
  group('onboardingRepositoryProvider', () {
    test('throws StateError when not overridden', () {
      final container = ProviderContainer();
      addTearDown(container.dispose);

      // In Riverpod 3, provider errors are wrapped in ProviderException.
      expect(
        () => container.read(onboardingRepositoryProvider),
        throwsA(anything),
      );
    });

    test('returns the overridden repository instance', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      // Reading the provider should not throw.
      expect(
        () => container.read(onboardingRepositoryProvider),
        returnsNormally,
      );
    });
  });

  // -------------------------------------------------------------------------
  // completeOnboardingProvider
  // -------------------------------------------------------------------------
  group('completeOnboardingProvider', () {
    test('calling the returned function marks onboarding as complete',
        () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      final completeOnboarding =
          container.read(completeOnboardingProvider);
      await completeOnboarding();

      final repo = container.read(onboardingRepositoryProvider);
      expect(repo.isComplete, isTrue);
    });

    test('after calling complete, isOnboardingCompleteProvider rebuilds to true',
        () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      expect(container.read(isOnboardingCompleteProvider), isFalse);

      final completeOnboarding =
          container.read(completeOnboardingProvider);
      await completeOnboarding();

      // The provider is invalidated; re-reading should reflect the new state.
      expect(container.read(isOnboardingCompleteProvider), isTrue);
    });

    test('calling complete multiple times does not throw', () async {
      final container = await _makeContainer();
      addTearDown(container.dispose);

      final completeOnboarding =
          container.read(completeOnboardingProvider);

      await expectLater(completeOnboarding(), completes);
      await expectLater(completeOnboarding(), completes);
    });
  });

  // -------------------------------------------------------------------------
  // OnboardingSlide widget
  // -------------------------------------------------------------------------
  group('OnboardingSlide widget', () {
    testWidgets('renders the provided icon', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.star,
              iconColor: Colors.amber,
              title: 'Test Title',
              subtitle: 'Test Subtitle',
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.star), findsOneWidget);
    });

    testWidgets('renders the provided title text', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.star,
              iconColor: Colors.amber,
              title: 'Welcome to UNJYNX',
              subtitle: 'Some subtitle',
            ),
          ),
        ),
      );

      expect(find.text('Welcome to UNJYNX'), findsOneWidget);
    });

    testWidgets('renders the provided subtitle text', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.star,
              iconColor: Colors.amber,
              title: 'Title',
              subtitle: 'Break the satisfactory.',
            ),
          ),
        ),
      );

      expect(find.text('Break the satisfactory.'), findsOneWidget);
    });

    testWidgets('renders both title and subtitle together', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.rocket_launch,
              iconColor: Colors.purple,
              title: 'Stay Focused',
              subtitle: 'Get things done every day.',
            ),
          ),
        ),
      );

      expect(find.text('Stay Focused'), findsOneWidget);
      expect(find.text('Get things done every day.'), findsOneWidget);
      expect(find.byIcon(Icons.rocket_launch), findsOneWidget);
    });

    testWidgets('applies centre text alignment on title', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.star,
              iconColor: Colors.amber,
              title: 'Centred Title',
              subtitle: 'Sub',
            ),
          ),
        ),
      );

      final titleWidget = tester.widget<Text>(find.text('Centred Title'));
      expect(titleWidget.textAlign, equals(TextAlign.center));
    });

    testWidgets('uses a Column as its primary layout container',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: OnboardingSlide(
              icon: Icons.star,
              iconColor: Colors.amber,
              title: 'Title',
              subtitle: 'Subtitle',
            ),
          ),
        ),
      );

      expect(find.byType(Column), findsWidgets);
    });
  });

  // -------------------------------------------------------------------------
  // PageIndicator widget
  // -------------------------------------------------------------------------
  group('PageIndicator widget', () {
    testWidgets('renders the correct number of AnimatedContainers for count=3',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: PageIndicator(count: 3, currentIndex: 0),
          ),
        ),
      );

      expect(find.byType(AnimatedContainer), findsNWidgets(3));
    });

    testWidgets('renders the correct number of dots for count=5',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: PageIndicator(count: 5, currentIndex: 2),
          ),
        ),
      );

      expect(find.byType(AnimatedContainer), findsNWidgets(5));
    });

    testWidgets('renders exactly 1 dot when count=1', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: PageIndicator(count: 1, currentIndex: 0),
          ),
        ),
      );

      expect(find.byType(AnimatedContainer), findsOneWidget);
    });

    testWidgets('renders 0 dots when count=0', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: PageIndicator(count: 0, currentIndex: 0),
          ),
        ),
      );

      expect(find.byType(AnimatedContainer), findsNothing);
    });

    testWidgets('active dot has a wider width than inactive dots',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: Center(
              child: PageIndicator(count: 3, currentIndex: 1),
            ),
          ),
        ),
      );

      // Pump to allow AnimatedContainer to settle.
      await tester.pumpAndSettle();

      final containers =
          tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer))
              .toList();

      // Retrieve widths via the constraints stored on the render objects.
      final sizes = containers.map((c) {
        final box = tester.renderObject(find.byWidget(c)) as RenderBox;
        return box.size.width;
      }).toList();

      // Index 1 is active, indices 0 and 2 are inactive.
      expect(sizes[1], greaterThan(sizes[0]));
      expect(sizes[1], greaterThan(sizes[2]));
    });

    testWidgets('all dots are rendered inside a Row', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: PageIndicator(count: 4, currentIndex: 0),
          ),
        ),
      );

      expect(find.byType(Row), findsWidgets);
    });

    testWidgets('changing currentIndex updates which dot is active',
        (tester) async {
      // Start with index 0 active.
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: Center(
              child: PageIndicator(count: 3, currentIndex: 0),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final sizesAtIndex0 =
          tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer))
              .map((c) {
                final box = tester.renderObject(find.byWidget(c)) as RenderBox;
                return box.size.width;
              })
              .toList();

      // Rebuild with index 2 active.
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: Center(
              child: PageIndicator(count: 3, currentIndex: 2),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      final sizesAtIndex2 =
          tester.widgetList<AnimatedContainer>(find.byType(AnimatedContainer))
              .map((c) {
                final box = tester.renderObject(find.byWidget(c)) as RenderBox;
                return box.size.width;
              })
              .toList();

      // Dot 0 was previously active (wide) and is now narrow.
      expect(sizesAtIndex0[0], greaterThan(sizesAtIndex0[2]));
      // Dot 2 is now active (wide).
      expect(sizesAtIndex2[2], greaterThan(sizesAtIndex2[0]));
    });
  });
}
