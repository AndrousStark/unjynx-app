import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'settings_section.dart';

/// About section: version, changelog, rate, feedback, support, social.
class AboutSection extends StatelessWidget {
  const AboutSection({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SettingsSection(
      title: 'About',
      children: [
        ListTile(
          leading: Icon(Icons.info_outline, color: colorScheme.onSurfaceVariant),
          title: const Text('Version'),
          subtitle: const Text('0.5.0 (Phase 5)'),
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.new_releases_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Changelog'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showChangelogDialog(context);
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.star_outline_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Rate Us'),
          trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _showRateUsDialog(context);
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.feedback_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Send Feedback'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _openMailto(context, 'feedback@unjynx.me', 'UNJYNX Feedback');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.support_agent_rounded, color: colorScheme.onSurfaceVariant),
          title: const Text('Support'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            _openMailto(context, 'support@unjynx.me', 'UNJYNX Support');
          },
        ),
        const Divider(height: 1),
        ListTile(
          leading: Icon(Icons.description_outlined, color: colorScheme.onSurfaceVariant),
          title: const Text('Licenses'),
          trailing: Icon(Icons.chevron_right, color: colorScheme.onSurfaceVariant),
          onTap: () {
            HapticFeedback.lightImpact();
            showLicensePage(
            context: context,
            applicationName: 'UNJYNX',
            applicationVersion: '0.5.0',
            );
          },
        ),
        const Divider(height: 1),
        _LinkTile(
          icon: Icons.language,
          title: 'Website',
          url: 'https://unjynx.me',
          colorScheme: colorScheme,
        ),
        const Divider(height: 1),
        _LinkTile(
          icon: Icons.admin_panel_settings_outlined,
          title: 'Admin Panel',
          url: 'https://unjynx.me/admin/',
          colorScheme: colorScheme,
        ),
        const Divider(height: 1),
        _LinkTile(
          icon: Icons.developer_mode,
          title: 'Dev Portal',
          url: 'https://unjynx.me/dev/',
          colorScheme: colorScheme,
        ),
      ],
    );
  }

  void _showChangelogDialog(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Changelog'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ChangelogEntry(
                version: '0.5.0',
                date: 'Phase 5 - Launch Polish',
                changes: const [
                  'Security audit (OWASP M1-M10)',
                  'Load testing with k6',
                  'Codemagic CI/CD pipelines',
                  'Shorebird OTA updates',
                  'Store listing assets',
                ],
              ),
              const Divider(),
              _ChangelogEntry(
                version: '0.4.0',
                date: 'Phase 4 - Premium & Teams',
                changes: const [
                  'Billing & subscriptions',
                  'Gamification system',
                  'Accountability partners',
                  'Team collaboration',
                  'Import/export functionality',
                  'Admin & dev portals',
                ],
              ),
              const Divider(),
              _ChangelogEntry(
                version: '0.3.0',
                date: 'Phase 3 - Channels',
                changes: const [
                  'Multi-channel notifications',
                  'WhatsApp, Telegram, SMS, Email',
                  'BullMQ job queues',
                  'Cron scheduling',
                  'OTP verification',
                ],
              ),
              const Divider(),
              _ChangelogEntry(
                version: '0.2.0',
                date: 'Phase 2 - Core App',
                changes: const [
                  '17 screens implemented',
                  '45+ API endpoints',
                  '35 database tables',
                  'Task management system',
                  'Project organization',
                ],
              ),
              const Divider(),
              _ChangelogEntry(
                version: '0.1.0',
                date: 'Phase 1 - Foundation',
                changes: const [
                  'Infrastructure setup',
                  'Authentication with Logto',
                  'Plugin-Play architecture',
                  'Local database with Drift',
                  'Design system',
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showRateUsDialog(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        icon: Icon(
          Icons.star_rounded,
          size: 48,
          color: colorScheme.primary,
        ),
        title: const Text('Rate UNJYNX'),
        content: const Text(
          "We'd love your rating! Coming to Play Store and App Store soon.",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _openMailto(BuildContext context, String email, String subject) {
    final mailto = 'mailto:$email?subject=${Uri.encodeComponent(subject)}';
    Clipboard.setData(ClipboardData(text: mailto));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied $email to clipboard. Open your email app to send.'),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

class _ChangelogEntry extends StatelessWidget {
  const _ChangelogEntry({
    required this.version,
    required this.date,
    required this.changes,
  });

  final String version;
  final String date;
  final List<String> changes;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'v$version',
              style: textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                date,
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        for (final change in changes)
          Padding(
            padding: const EdgeInsets.only(left: 8, top: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('- ', style: textTheme.bodySmall),
                Expanded(child: Text(change, style: textTheme.bodySmall)),
              ],
            ),
          ),
      ],
    );
  }
}

/// Reusable list tile that displays a URL and copies it to the clipboard on tap.
class _LinkTile extends StatelessWidget {
  const _LinkTile({
    required this.icon,
    required this.title,
    required this.url,
    required this.colorScheme,
  });

  final IconData icon;
  final String title;
  final String url;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: colorScheme.onSurfaceVariant),
      title: Text(title),
      subtitle: Text(url, style: TextStyle(color: colorScheme.primary, fontSize: 12)),
      trailing: Icon(Icons.open_in_new, size: 18, color: colorScheme.onSurfaceVariant),
      onTap: () {
        HapticFeedback.lightImpact();
        Clipboard.setData(ClipboardData(text: url));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Copied $url to clipboard'),
            duration: const Duration(seconds: 2),
          ),
        );
      },
    );
  }
}
