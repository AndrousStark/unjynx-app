import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Builds the Instagram "Friend First" setup UI with an explanation card
/// and username input field.
List<Widget> buildInstagramSetupUI({
  required TextEditingController controller,
  required ColorScheme colorScheme,
  required TextTheme textTheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  return [
    // Friend First explanation
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isLight
            ? ux.instagram.withValues(alpha: 0.06)
            : ux.instagram.withValues(alpha: 0.12),
        border: Border.all(
          color: ux.instagram.withValues(alpha: 0.2),
          width: 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.camera_alt_rounded, size: 24, color: ux.instagram),
              const SizedBox(width: 8),
              Text(
                'Friend First Approach',
                style: textTheme.titleMedium?.copyWith(
                  color: ux.instagram,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'We will send a follow request from @unjynx_official. '
            'Once you accept, we can send you reminders via DM.',
            style: textTheme.bodySmall?.copyWith(
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.7 : 0.6),
              height: 1.5,
            ),
          ),
        ],
      ),
    ),
    const SizedBox(height: 12),
    TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: 'Instagram Username',
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
        hintText: '@username',
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),
        prefixIcon: SizedBox(
          width: 44,
          height: 44,
          child: Icon(
            Icons.camera_alt_rounded,
            color: isLight ? ux.deepPurple : colorScheme.primary,
          ),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: isLight
                ? colorScheme.outlineVariant.withValues(alpha: 0.5)
                : ux.glassBorder,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: ux.gold, width: 1.5),
        ),
        filled: true,
        fillColor: isLight
            ? Colors.white.withValues(alpha: 0.7)
            : colorScheme.surfaceContainerHigh.withValues(alpha: 0.3),
      ),
    ),
  ];
}
