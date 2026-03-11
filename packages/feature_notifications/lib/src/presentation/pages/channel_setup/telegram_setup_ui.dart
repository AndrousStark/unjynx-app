import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Builds the Telegram bot verification UI with step-by-step instructions
/// and a verification code input field.
List<Widget> buildTelegramSetupUI({
  required TextEditingController controller,
  required ColorScheme colorScheme,
  required TextTheme textTheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  return [
    // Instructions card
    Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isLight
            ? ux.telegram.withValues(alpha: 0.06)
            : ux.telegram.withValues(alpha: 0.12),
        border: Border.all(
          color: ux.telegram.withValues(alpha: 0.2),
          width: 0.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.telegram, size: 24, color: ux.telegram),
              const SizedBox(width: 8),
              Text(
                '@UnjynxBot',
                style: textTheme.titleMedium?.copyWith(
                  color: ux.telegram,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '1. Open Telegram and search for @UnjynxBot\n'
            '2. Send /start to the bot\n'
            '3. Copy the verification code and paste below',
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

    // Verification code input
    TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: 'Verification Code',
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
        hintText: 'Paste code from @UnjynxBot',
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),
        prefixIcon: SizedBox(
          width: 44,
          height: 44,
          child: Icon(
            Icons.vpn_key_rounded,
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
