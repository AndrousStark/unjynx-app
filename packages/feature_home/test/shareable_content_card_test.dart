import 'package:feature_home/src/presentation/widgets/shareable_content_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ShareableContentCard', () {
    Widget buildCard({
      String quote = 'Test quote',
      String author = 'Test Author',
      String category = 'stoic_wisdom',
      String? source,
      bool isDark = true,
    }) {
      return MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: ShareableContentCard(
              quote: quote,
              author: author,
              category: category,
              source: source,
              isDark: isDark,
            ),
          ),
        ),
      );
    }

    testWidgets('renders with required fields', (tester) async {
      await tester.pumpWidget(buildCard());

      expect(find.text('UNJYNX'), findsOneWidget);
      expect(find.text('Test quote'), findsOneWidget);
      expect(find.text('\u2014 Test Author'), findsOneWidget);
      expect(find.text('unjynx.me'), findsOneWidget);
      expect(find.text('Break the satisfactory.'), findsOneWidget);
    });

    testWidgets('displays category badge', (tester) async {
      await tester.pumpWidget(buildCard(category: 'growth_mindset'));

      expect(find.text('GROWTH MINDSET'), findsOneWidget);
    });

    testWidgets('shows source when provided', (tester) async {
      await tester.pumpWidget(buildCard(source: 'Meditations'));

      expect(find.text('Meditations'), findsOneWidget);
    });

    testWidgets('hides source when null', (tester) async {
      await tester.pumpWidget(buildCard());

      expect(find.text('Meditations'), findsNothing);
    });

    testWidgets('has correct dimensions (1080x1920)', (tester) async {
      await tester.pumpWidget(buildCard());

      final sizedBox = tester.widget<SizedBox>(
        find.byType(SizedBox).first,
      );
      expect(sizedBox.width, 1080);
      expect(sizedBox.height, 1920);
    });

    testWidgets('renders in light mode', (tester) async {
      await tester.pumpWidget(buildCard(isDark: false));

      expect(find.text('UNJYNX'), findsOneWidget);
      expect(find.text('Test quote'), findsOneWidget);
    });

    testWidgets('renders in dark mode', (tester) async {
      await tester.pumpWidget(buildCard(isDark: true));

      expect(find.text('UNJYNX'), findsOneWidget);
      expect(find.text('Test quote'), findsOneWidget);
    });

    testWidgets('handles long quotes gracefully', (tester) async {
      final longQuote = 'A' * 500;
      await tester.pumpWidget(buildCard(quote: longQuote));

      // Should not overflow or throw.
      expect(find.text(longQuote), findsOneWidget);
    });

    testWidgets('handles short quotes gracefully', (tester) async {
      await tester.pumpWidget(buildCard(quote: 'Be.'));

      expect(find.text('Be.'), findsOneWidget);
    });

    testWidgets('renders ornamental quotation marks', (tester) async {
      await tester.pumpWidget(buildCard());

      // Opening and closing quotation marks.
      expect(find.text('\u201C'), findsOneWidget);
      expect(find.text('\u201D'), findsOneWidget);
    });

    testWidgets('renders sparkle icon in watermark', (tester) async {
      await tester.pumpWidget(buildCard());

      expect(find.byIcon(Icons.auto_awesome), findsOneWidget);
    });

    testWidgets('category badge underscores replaced with spaces',
        (tester) async {
      await tester.pumpWidget(buildCard(category: 'anime_pop_culture'));

      expect(find.text('ANIME POP CULTURE'), findsOneWidget);
    });
  });
}
