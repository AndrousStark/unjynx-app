import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import 'settings_section.dart';

/// Integrations section: calendar sync with Google, Apple, and Outlook.
///
/// Each provider row navigates to its respective connect page, or shows
/// a bottom sheet for managing the connection if already connected.
class IntegrationsSection extends StatelessWidget {
  const IntegrationsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Integrations',
      children: [
        ListTile(
          leading: Icon(
            Icons.calendar_today_outlined,
            color: colorScheme.onSurfaceVariant,
          ),
          title: const Text('Google Calendar'),
          subtitle: const Text('Sync via Google OAuth'),
          trailing: Icon(
            Icons.chevron_right,
            color: colorScheme.onSurfaceVariant,
          ),
          onTap: () {
            HapticFeedback.lightImpact();
            // Google Calendar connect is handled via the CalendarConnectCard
            // on the Calendar page. Navigate there.
            context.push('/calendar');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(
            Icons.event_rounded,
            color: colorScheme.onSurfaceVariant,
          ),
          title: const Text('Apple Calendar'),
          subtitle: const Text('Sync via CalDAV (iCloud)'),
          trailing: Icon(
            Icons.chevron_right,
            color: colorScheme.onSurfaceVariant,
          ),
          onTap: () {
            HapticFeedback.lightImpact();
            context.push('/calendar/connect/apple');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(
            Icons.sync_alt_rounded,
            color: colorScheme.onSurfaceVariant,
          ),
          title: const Text('Outlook Calendar'),
          subtitle: const Text('Sync via Microsoft Graph'),
          trailing: Icon(
            Icons.chevron_right,
            color: colorScheme.onSurfaceVariant,
          ),
          onTap: () {
            HapticFeedback.lightImpact();
            context.push('/calendar/connect/outlook');
          },
        ),
      ],
    );
  }
}
