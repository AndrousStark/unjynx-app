import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import 'settings_section.dart';

/// Account settings section: profile, billing, connected, export, delete.
class AccountSection extends StatelessWidget {
  const AccountSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'Account',
      children: [
        ListTile(
          leading: Icon(Icons.person_outline, color: colorScheme.onSurfaceVariant),
          title: const Text('Profile'),
          subtitle: const Text('Edit name, avatar, bio'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            GoRouter.of(context).push('/profile/edit');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.credit_card_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Plan & Billing'),
          subtitle: const Text('Manage subscription'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.mediumImpact();
            GoRouter.of(context).push('/billing');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.link_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Connected Accounts'),
          subtitle: const Text('Google, Apple, social'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.mediumImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Coming soon')),
            );
          },
        ),
      ],
    );
  }
}
