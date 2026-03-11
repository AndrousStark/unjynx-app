import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Builds the phone number + OTP verification UI used by both WhatsApp and SMS
/// channel setup flows.
List<Widget> buildPhoneSetupUI({
  required TextEditingController controller,
  required bool otpSent,
  required ColorScheme colorScheme,
  required TextTheme textTheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  return [
    TextField(
      controller: controller,
      keyboardType: TextInputType.phone,
      decoration: InputDecoration(
        labelText: 'Phone Number',
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
        hintText: '+91 98000 00000',
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),
        prefixIcon: SizedBox(
          width: 44,
          height: 44,
          child: Icon(
            Icons.phone_rounded,
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
    if (otpSent) ...[
      const SizedBox(height: 12),
      TextField(
        keyboardType: TextInputType.number,
        maxLength: 6,
        decoration: InputDecoration(
          labelText: '6-digit OTP',
          labelStyle: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
          hintText: '000000',
          hintStyle: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
          ),
          prefixIcon: SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              Icons.lock_rounded,
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
          counterText: '',
        ),
      ),
    ],
  ];
}
