import 'package:flutter/material.dart';

/// Step 4: Reflection -- free-form journaling to close the day.
class ReflectionStep extends StatelessWidget {
  const ReflectionStep({super.key, required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Calm moon/stars icon
          Icon(
            Icons.bedtime_rounded,
            size: 44,
            color: colorScheme.primary.withValues(alpha: 0.8),
          ),
          const SizedBox(height: 24),

          Text(
            'Anything on your mind?',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          Text(
            'Let your thoughts rest on paper',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // Reflection text field
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: colorScheme.primary.withValues(alpha: 0.2),
              ),
            ),
            child: TextField(
              controller: controller,
              maxLines: 6,
              minLines: 5,
              style: TextStyle(
                fontSize: 16,
                color: colorScheme.onSurface,
                height: 1.6,
              ),
              decoration: InputDecoration(
                hintText: 'Write freely... no judgment, no structure.',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
                  fontSize: 16,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
