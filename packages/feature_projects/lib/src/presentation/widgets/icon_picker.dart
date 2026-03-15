import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Available project icons with their string identifiers.
const projectIcons = <String, IconData>{
  'folder': Icons.folder_outlined,
  'work': Icons.work_outline,
  'home': Icons.home_outlined,
  'star': Icons.star_outline,
  'heart': Icons.favorite_outline,
  'school': Icons.school_outlined,
  'fitness': Icons.fitness_center_outlined,
  'code': Icons.code_outlined,
  'shopping': Icons.shopping_cart_outlined,
  'travel': Icons.flight_outlined,
  'music': Icons.music_note_outlined,
  'camera': Icons.camera_alt_outlined,
  'book': Icons.menu_book_outlined,
  'food': Icons.restaurant_outlined,
  'health': Icons.local_hospital_outlined,
  'money': Icons.attach_money_outlined,
  'people': Icons.people_outline,
  'pet': Icons.pets_outlined,
  'car': Icons.directions_car_outlined,
  'game': Icons.sports_esports_outlined,
  'paint': Icons.palette_outlined,
  'rocket': Icons.rocket_launch_outlined,
  'bolt': Icons.bolt_outlined,
  'target': Icons.gps_fixed_outlined,
};

/// Resolves icon string ID to IconData.
IconData resolveProjectIcon(String iconId) {
  return projectIcons[iconId] ?? Icons.folder_outlined;
}

/// Grid of icons for selecting a project icon.
class IconPicker extends StatelessWidget {
  const IconPicker({
    required this.selectedIcon,
    required this.onIconSelected,
    super.key,
  });

  final String selectedIcon;
  final ValueChanged<String> onIconSelected;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final entry in projectIcons.entries)
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              onIconSelected(entry.key);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: selectedIcon == entry.key
                    ? colorScheme.primary.withValues(
                        alpha: isLight ? 0.15 : 0.2,
                      )
                    : isLight
                        ? colorScheme.surfaceContainerHigh
                            .withValues(alpha: 0.7)
                        : colorScheme.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(10),
                border: selectedIcon == entry.key
                    ? Border.all(
                        color: colorScheme.primary,
                        width: 2,
                      )
                    : isLight
                        ? Border.all(
                            color: colorScheme.outlineVariant
                                .withValues(alpha: 0.3),
                          )
                        : null,
                boxShadow: selectedIcon == entry.key && isLight
                    ? [
                        BoxShadow(
                          color: const Color(0xFF1A0533).withValues(alpha: 0.12),
                          blurRadius: 6,
                          spreadRadius: 0,
                        ),
                      ]
                    : null,
              ),
              child: Icon(
                entry.value,
                size: 22,
                color: selectedIcon == entry.key
                    ? colorScheme.primary
                    : colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}
