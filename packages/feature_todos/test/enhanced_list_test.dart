import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:feature_todos/src/presentation/providers/todo_providers.dart';
import 'package:feature_todos/src/presentation/widgets/bulk_action_bar.dart';
import 'package:feature_todos/src/presentation/widgets/filter_chip_bar.dart';
import 'package:feature_todos/src/presentation/widgets/todo_card.dart';
import 'package:feature_todos/src/presentation/widgets/todo_grid_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/core.dart';

void main() {
  group('TodoFilter with DateRange', () {
    test('default filter has no dateRange', () {
      const filter = TodoFilter();
      expect(filter.dateRange, isNull);
    });

    test('copyWith sets dateRange', () {
      const filter = TodoFilter();
      final updated = filter.copyWith(dateRange: DateRange.today);
      expect(updated.dateRange, DateRange.today);
    });

    test('copyWith clears dateRange to null', () {
      final filter = const TodoFilter().copyWith(dateRange: DateRange.today);
      final cleared = filter.copyWith(dateRange: null);
      expect(cleared.dateRange, isNull);
    });

    test('all DateRange values exist', () {
      expect(DateRange.values.length, 4);
      expect(DateRange.values, contains(DateRange.today));
      expect(DateRange.values, contains(DateRange.upcoming));
      expect(DateRange.values, contains(DateRange.overdue));
      expect(DateRange.values, contains(DateRange.noDate));
    });

    test('filter equality includes dateRange', () {
      final a = const TodoFilter().copyWith(dateRange: DateRange.today);
      final b = const TodoFilter().copyWith(dateRange: DateRange.today);
      final c = const TodoFilter().copyWith(dateRange: DateRange.overdue);

      expect(a, equals(b));
      expect(a, isNot(equals(c)));
    });
  });

  group('TaskViewMode', () {
    test('has list and grid values', () {
      expect(TaskViewMode.values.length, 2);
      expect(TaskViewMode.values, contains(TaskViewMode.list));
      expect(TaskViewMode.values, contains(TaskViewMode.grid));
    });
  });

  group('FilterChipBar widget', () {
    testWidgets('renders All chip selected by default', (tester) async {
      TodoFilter? lastFilter;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: FilterChipBar(
              filter: const TodoFilter(),
              onFilterChanged: (f) => lastFilter = f,
            ),
          ),
        ),
      );

      // 'All' chip should be visible
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Today'), findsOneWidget);
      expect(find.text('Upcoming'), findsOneWidget);
      expect(find.text('Overdue'), findsOneWidget);
      expect(find.text('No Date'), findsOneWidget);
      expect(find.text('Done'), findsOneWidget);
    });

    testWidgets('tapping Today chip triggers filter change', (tester) async {
      TodoFilter? lastFilter;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: FilterChipBar(
              filter: const TodoFilter(),
              onFilterChanged: (f) => lastFilter = f,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Today'));
      await tester.pump();

      expect(lastFilter, isNotNull);
      expect(lastFilter!.dateRange, DateRange.today);
      expect(lastFilter!.status, isNull);
    });

    testWidgets('tapping Done chip sets completed status', (tester) async {
      TodoFilter? lastFilter;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: FilterChipBar(
              filter: const TodoFilter(),
              onFilterChanged: (f) => lastFilter = f,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Done'));
      await tester.pump();

      expect(lastFilter!.status, TodoStatus.completed);
      expect(lastFilter!.dateRange, isNull);
    });

    testWidgets('tapping All chip clears status and dateRange',
        (tester) async {
      TodoFilter? lastFilter;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: FilterChipBar(
              filter: const TodoFilter()
                  .copyWith(dateRange: DateRange.today),
              onFilterChanged: (f) => lastFilter = f,
            ),
          ),
        ),
      );

      await tester.tap(find.text('All'));
      await tester.pump();

      expect(lastFilter!.status, isNull);
      expect(lastFilter!.dateRange, isNull);
    });
  });

  group('TodoGridCard widget', () {
    final baseTodo = Todo(
      id: 'test-1',
      title: 'Test Task',
      description: 'Description',
      status: TodoStatus.pending,
      priority: TodoPriority.high,
      createdAt: DateTime(2026, 3, 1),
      updatedAt: DateTime(2026, 3, 1),
    );

    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(todo: baseTodo),
            ),
          ),
        ),
      );

      expect(find.text('Test Task'), findsOneWidget);
    });

    testWidgets('shows check icon when selected', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(todo: baseTodo, isSelected: true),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('fires onTap callback', (tester) async {
      var tapped = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(
                todo: baseTodo,
                onTap: () => tapped = true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Test Task'));
      expect(tapped, isTrue);
    });

    testWidgets('fires onLongPress callback', (tester) async {
      var longPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(
                todo: baseTodo,
                onLongPress: () => longPressed = true,
              ),
            ),
          ),
        ),
      );

      await tester.longPress(find.text('Test Task'));
      expect(longPressed, isTrue);
    });

    testWidgets('shows due date chip when dueDate is set', (tester) async {
      final todoWithDate = baseTodo.copyWith(
        dueDate: DateTime.now().add(const Duration(days: 30)),
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(todo: todoWithDate),
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.schedule), findsOneWidget);
    });

    testWidgets('shows strikethrough when completed', (tester) async {
      final completed = baseTodo.copyWith(status: TodoStatus.completed);

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: SizedBox(
              width: 200,
              height: 200,
              child: TodoGridCard(todo: completed),
            ),
          ),
        ),
      );

      final textWidget = tester.widget<Text>(find.text('Test Task'));
      expect(textWidget.style?.decoration, TextDecoration.lineThrough);
    });
  });

  group('BulkActionBar widget', () {
    testWidgets('renders count and action buttons', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: BulkActionBar(
              selectedCount: 3,
              onCompleteAll: () {},
              onDeleteAll: () {},
              onChangePriority: (_) {},
              onClearSelection: () {},
            ),
          ),
        ),
      );

      expect(find.text('3'), findsOneWidget);
      expect(find.text('Done'), findsOneWidget);
      expect(find.text('Priority'), findsOneWidget);
      expect(find.text('Delete'), findsOneWidget);
    });

    testWidgets('fires onCompleteAll', (tester) async {
      var completed = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: BulkActionBar(
              selectedCount: 2,
              onCompleteAll: () => completed = true,
              onDeleteAll: () {},
              onChangePriority: (_) {},
              onClearSelection: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.text('Done'));
      expect(completed, isTrue);
    });

    testWidgets('fires onClearSelection when count badge tapped',
        (tester) async {
      var cleared = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: BulkActionBar(
              selectedCount: 5,
              onCompleteAll: () {},
              onDeleteAll: () {},
              onChangePriority: (_) {},
              onClearSelection: () => cleared = true,
            ),
          ),
        ),
      );

      // Tap on the count + close icon area
      await tester.tap(find.text('5'));
      expect(cleared, isTrue);
    });

    testWidgets('Delete shows confirmation dialog', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: BulkActionBar(
              selectedCount: 2,
              onCompleteAll: () {},
              onDeleteAll: () {},
              onChangePriority: (_) {},
              onClearSelection: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.text('Delete'));
      await tester.pumpAndSettle();

      expect(find.text('Delete tasks?'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
    });

    testWidgets('Priority opens bottom sheet', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: BulkActionBar(
              selectedCount: 1,
              onCompleteAll: () {},
              onDeleteAll: () {},
              onChangePriority: (_) {},
              onClearSelection: () {},
            ),
          ),
        ),
      );

      await tester.tap(find.text('Priority'));
      await tester.pumpAndSettle();

      expect(find.text('Set priority for 1 tasks'), findsOneWidget);
      expect(find.text('Urgent'), findsOneWidget);
      expect(find.text('High'), findsOneWidget);
      expect(find.text('Medium'), findsOneWidget);
      expect(find.text('Low'), findsOneWidget);
    });
  });

  group('TodoCard enhanced', () {
    final baseTodo = Todo(
      id: 'test-1',
      title: 'My Task',
      createdAt: DateTime(2026, 3, 1),
      updatedAt: DateTime(2026, 3, 1),
    );

    testWidgets('fires onLongPress callback', (tester) async {
      var longPressed = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(
            body: TodoCard(
              todo: baseTodo,
              onLongPress: () => longPressed = true,
            ),
          ),
        ),
      );

      await tester.longPress(find.text('My Task'));
      expect(longPressed, isTrue);
    });

    testWidgets('shows overdue label for past dates', (tester) async {
      final overdue = baseTodo.copyWith(
        dueDate: DateTime.now().subtract(const Duration(days: 3)),
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(body: TodoCard(todo: overdue)),
        ),
      );

      expect(find.textContaining('overdue'), findsOneWidget);
    });

    testWidgets('shows Tomorrow label for tomorrow date', (tester) async {
      final tomorrow = baseTodo.copyWith(
        dueDate: DateTime.now().add(const Duration(days: 1)),
      );

      await tester.pumpWidget(
        MaterialApp(
          theme: UnjynxTheme.dark,
          home: Scaffold(body: TodoCard(todo: tomorrow)),
        ),
      );

      expect(find.text('Tomorrow'), findsOneWidget);
    });
  });
}
