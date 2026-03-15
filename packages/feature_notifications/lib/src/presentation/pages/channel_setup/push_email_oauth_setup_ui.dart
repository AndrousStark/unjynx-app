import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Builds the push notification permission UI with a centered icon.
List<Widget> buildPushSetupUI({
  required ColorScheme colorScheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  return [
    Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isLight
            ? ux.deepPurple.withValues(alpha: 0.05)
            : ux.deepPurple.withValues(alpha: 0.2),
      ),
      child: Center(
        child: Icon(
          Icons.notifications_active_rounded,
          size: 56,
          color: isLight ? ux.deepPurple : colorScheme.primary,
        ),
      ),
    ),
  ];
}

/// Builds the email address input UI.
List<Widget> buildEmailSetupUI({
  required TextEditingController controller,
  required ColorScheme colorScheme,
  required TextTheme textTheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  return [
    TextField(
      controller: controller,
      keyboardType: TextInputType.emailAddress,
      decoration: InputDecoration(
        labelText: 'Email Address',
        labelStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant,
        ),
        hintText: 'you@example.com',
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: colorScheme.onSurfaceVariant.withValues(alpha: 0.4),
        ),
        prefixIcon: SizedBox(
          width: 44,
          height: 44,
          child: Icon(
            Icons.email_rounded,
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

/// Builds the OAuth redirect UI used by both Slack and Discord channels.
List<Widget> buildOAuthSetupUI({
  required String channelType,
  required BuildContext context,
  required ColorScheme colorScheme,
  required UnjynxCustomColors ux,
  required bool isLight,
}) {
  final color = channelType == 'slack' ? ux.slack : ux.discord;
  final name = channelType == 'slack' ? 'Slack' : 'Discord';

  return [
    Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isLight
            ? color.withValues(alpha: 0.06)
            : color.withValues(alpha: 0.12),
        border: Border.all(
          color: color.withValues(alpha: 0.2),
          width: 0.5,
        ),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(
              channelType == 'slack'
                  ? Icons.tag_rounded
                  : Icons.headset_mic_rounded,
              size: 48,
              color: color,
            ),
            const SizedBox(height: 12),
            Text(
              'You will be redirected to $name to authorize UNJYNX',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.7 : 0.6),
              ),
            ),
          ],
        ),
      ),
    ),
  ];
}
