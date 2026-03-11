import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Step 5: Intention Setting
///
/// A single-line text field for the user to declare their primary intention
/// for the day. Paired with a warm sunrise glow icon and gold border accent.
class IntentionStep extends StatelessWidget {
  const IntentionStep({super.key, required this.controller});

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Warm sunrise glow icon
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: context.isLightMode
                    ? [ux.goldWash, ux.goldWash.withValues(alpha: 0)]
                    : [
                        ux.gold.withValues(alpha: 0.3),
                        ux.gold.withValues(alpha: 0.05),
                      ],
              ),
            ),
            child: Center(
              child: Icon(
                Icons.bolt_rounded,
                size: 36,
                color: ux.gold,
              ),
            ),
          ),
          const SizedBox(height: 24),

          Text(
            'Set your intention\nfor today',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: colorScheme.onSurface,
              letterSpacing: -0.5,
              height: 1.3,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 8),

          Text(
            'One clear focus to guide your day',
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 32),

          // Intention text field
          Container(
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: ux.gold.withValues(alpha: 0.3),
              ),
            ),
            child: TextField(
              controller: controller,
              style: TextStyle(
                fontSize: 17,
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'Today I will...',
                hintStyle: TextStyle(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.5),
                  fontSize: 17,
                  fontWeight: FontWeight.w400,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
