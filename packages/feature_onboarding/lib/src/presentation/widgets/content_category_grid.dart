import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/personalization_state.dart';
import '../providers/personalization_providers.dart';

/// 2-column grid of content category cards with a "Deliver at" time picker.
///
/// Free tier: max 1 category. Attempting to select more shows a snackbar.
/// Below the grid, a time picker row lets the user set delivery time.
class ContentCategoryGrid extends ConsumerWidget {
  const ContentCategoryGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(personalizationStateProvider);
    final selectedCategories = state.contentCategories;
    final deliverAt = state.contentDeliverAt;

    return Column(
      children: [
        // Category grid.
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.15,
          padding: const EdgeInsets.symmetric(horizontal: 24),
          children: contentCategoryOptions.map((option) {
            final isSelected = selectedCategories.contains(option.id);
            return _CategoryCard(
              option: option,
              isSelected: isSelected,
              onTap: () => _handleCategoryTap(context, ref, option.id),
            );
          }).toList(),
        ),

        const SizedBox(height: 24),

        // "Deliver at" time picker.
        _DeliverAtRow(
          deliverAt: deliverAt,
          onChanged: (time) => ref
              .read(personalizationStateProvider.notifier)
              .setDeliverAt(time),
        ),
      ],
    );
  }

  void _handleCategoryTap(
    BuildContext context,
    WidgetRef ref,
    String categoryId,
  ) {
    HapticFeedback.selectionClick();
    final accepted = ref
        .read(personalizationStateProvider.notifier)
        .toggleContentCategory(categoryId);

    if (!accepted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: const Text(
              'Free plan allows 1 category. Upgrade to Pro for unlimited.',
            ),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            duration: const Duration(seconds: 3),
          ),
        );
    }
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final ContentCategoryOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: isSelected
              ? ux.goldWash
              : isLight
                  ? Colors.white
                  : colorScheme.surfaceContainer,
          border: Border.all(
            color: isSelected
                ? ux.gold
                : isLight
                    ? colorScheme.outlineVariant
                    : ux.glassBorder,
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: [
            if (isLight)
              BoxShadow(
                color: isSelected
                    ? ux.gold.withValues(alpha: 0.12)
                    : const Color(0xFF1A0533).withValues(alpha: 0.05),
                blurRadius: isSelected ? 12 : 6,
                offset: const Offset(0, 3),
              )
            else if (isSelected)
              BoxShadow(
                color: ux.gold.withValues(alpha: 0.15),
                blurRadius: 12,
                spreadRadius: 1,
              ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              option.icon,
              size: 28,
              color: isSelected
                  ? ux.gold
                  : colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.65 : 0.55),
            ),
            const SizedBox(height: 8),
            Text(
              option.label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 13,
                fontWeight:
                    isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected
                    ? (isLight ? const Color(0xFF1A0533) : colorScheme.onSurface)
                    : colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.8 : 0.7),
              ),
            ),
            const SizedBox(height: 3),
            Text(
              option.tagline,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11,
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.55 : 0.45),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeliverAtRow extends StatelessWidget {
  const _DeliverAtRow({
    required this.deliverAt,
    required this.onChanged,
  });

  final String deliverAt;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    // Parse the stored time string.
    final parts = deliverAt.split(':');
    final hour = int.tryParse(parts.firstOrNull ?? '7') ?? 7;
    final minute = int.tryParse(parts.elementAtOrNull(1) ?? '0') ?? 0;
    final time = TimeOfDay(hour: hour, minute: minute);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () async {
          HapticFeedback.lightImpact();
          final picked = await showTimePicker(
            context: context,
            initialTime: time,
            builder: (ctx, child) {
              return Theme(
                data: Theme.of(ctx).copyWith(
                  timePickerTheme: TimePickerThemeData(
                    backgroundColor: isLight
                        ? Colors.white
                        : colorScheme.surfaceContainer,
                  ),
                ),
                child: child!,
              );
            },
          );
          if (picked != null) {
            final formatted =
                '${picked.hour.toString().padLeft(2, '0')}:'
                '${picked.minute.toString().padLeft(2, '0')}';
            onChanged(formatted);
          }
        },
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: isLight
                ? Colors.white.withValues(alpha: 0.7)
                : colorScheme.surfaceContainer.withValues(alpha: 0.5),
            border: Border.all(
              color: isLight
                  ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                  : ux.glassBorder,
              width: 0.5,
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.schedule_rounded,
                size: 22,
                color: ux.gold,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Deliver daily at',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  color: isLight
                      ? ux.goldWash
                      : ux.gold.withValues(alpha: 0.12),
                ),
                child: Text(
                  time.format(context),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isLight ? ux.darkGold : ux.gold,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.5 : 0.4),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
