import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/content_category_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Category selector screen -- "Pick Your Inspiration".
///
/// Displays a 2-column grid of [ContentCategoryCard] widgets for the 10
/// content categories. Each card toggles selection state. At the bottom,
/// a delivery time picker and a save button commit the user's preferences.
class CategorySelectorPage extends ConsumerStatefulWidget {
  const CategorySelectorPage({super.key});

  @override
  ConsumerState<CategorySelectorPage> createState() =>
      _CategorySelectorPageState();
}

class _CategorySelectorPageState extends ConsumerState<CategorySelectorPage> {
  late Set<String> _selectedCategories;
  late TimeOfDay _deliveryTime;

  @override
  void initState() {
    super.initState();
    // Copy current state so we can edit locally before saving.
    _selectedCategories = Set<String>.from(
      ref.read(selectedCategoriesProvider),
    );
    _deliveryTime = _parseTimeString(ref.read(contentDeliveryTimeProvider));
  }

  /// Parses "HH:mm" into [TimeOfDay].
  TimeOfDay _parseTimeString(String time) {
    final parts = time.split(':');
    if (parts.length != 2) return const TimeOfDay(hour: 7, minute: 0);
    final hour = int.tryParse(parts[0]) ?? 7;
    final minute = int.tryParse(parts[1]) ?? 0;
    return TimeOfDay(hour: hour, minute: minute);
  }

  /// Formats [TimeOfDay] as "HH:mm".
  String _formatTimeString(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  /// Formats [TimeOfDay] for display (e.g., "7:00 AM").
  String _formatTimeDisplay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  void _toggleCategory(String categoryId) {
    setState(() {
      final updated = Set<String>.from(_selectedCategories);
      if (updated.contains(categoryId)) {
        updated.remove(categoryId);
      } else {
        updated.add(categoryId);
      }
      _selectedCategories = updated;
    });
  }

  Future<void> _pickDeliveryTime() async {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final picked = await showTimePicker(
      context: context,
      initialTime: _deliveryTime,
      builder: (context, child) {
        final baseScheme = isLight
            ? ColorScheme.light(
                primary: ux.gold,
                surface: colorScheme.surface,
                onSurface: colorScheme.onSurface,
              )
            : ColorScheme.dark(
                primary: ux.gold,
                surface: colorScheme.surface,
                onSurface: colorScheme.onSurface,
              );
        return Theme(
          data: Theme.of(context).copyWith(colorScheme: baseScheme),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _deliveryTime = picked;
      });
    }
  }

  void _save() {
    // Update global providers.
    ref.read(selectedCategoriesProvider.notifier).set(_selectedCategories);
    ref.read(contentDeliveryTimeProvider.notifier).set(
      _formatTimeString(_deliveryTime),
    );

    // Pop back.
    if (context.mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Pick Your Inspiration',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
          ),
        ),
        backgroundColor: colorScheme.surfaceContainerLowest,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Category grid (scrollable).
          Expanded(
            child: CustomScrollView(
              slivers: [
                // Subtitle.
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                  sliver: SliverToBoxAdapter(
                    child: Text(
                      'Choose the categories that fuel you. '
                      "We'll deliver one piece of wisdom each day.",
                      style: TextStyle(
                        fontSize: 14,
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.8),
                        height: 1.5,
                      ),
                    ),
                  ),
                ),

                // Selection count.
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                  sliver: SliverToBoxAdapter(
                    child: Text(
                      '${_selectedCategories.length} selected',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: _selectedCategories.isNotEmpty
                            ? ux.gold
                            : colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),

                // Category grid.
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
                  sliver: SliverGrid.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                    children: [
                      for (final category in contentCategories)
                        ContentCategoryCard(
                          name: category.name,
                          tagline: category.tagline,
                          icon: category.icon,
                          isSelected:
                              _selectedCategories.contains(category.id),
                          onTap: () {
                            HapticFeedback.selectionClick();
                            _toggleCategory(category.id);
                          },
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom bar: delivery time + save button.
          _BottomBar(
            deliveryTime: _deliveryTime,
            selectedCount: _selectedCategories.length,
            formattedTime: _formatTimeDisplay(_deliveryTime),
            onPickTime: _pickDeliveryTime,
            onSave: _save,
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bottom bar -- delivery time picker + save button
// ---------------------------------------------------------------------------

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.deliveryTime,
    required this.selectedCount,
    required this.formattedTime,
    required this.onPickTime,
    required this.onSave,
  });

  final TimeOfDay deliveryTime;
  final int selectedCount;
  final String formattedTime;
  final VoidCallback onPickTime;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        border: Border(
          top: BorderSide(
            color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Delivery time row.
            InkWell(
              onTap: onPickTime,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.schedule_rounded,
                      size: 20,
                      color: colorScheme.primary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Delivery time',
                        style: TextStyle(
                          fontSize: 14,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    Text(
                      formattedTime,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: ux.gold,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 20,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Save button.
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: selectedCount > 0
                    ? () {
                        HapticFeedback.mediumImpact();
                        onSave();
                      }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: ux.gold,
                  foregroundColor:
                      context.isLightMode ? Colors.white : Colors.black,
                  disabledBackgroundColor:
                      colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                  disabledForegroundColor:
                      colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(
                  selectedCount > 0
                      ? 'Save Preferences'
                      : 'Select at least one category',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
