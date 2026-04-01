import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/home_providers.dart';

/// Google Calendar connection page.
///
/// Uses the [connectCalendarCallbackProvider] which handles the full OAuth
/// flow: GoogleSignIn → server auth code → backend token exchange.
/// Once connected, calendar events appear alongside UNJYNX tasks.
class GoogleCalendarConnectPage extends ConsumerStatefulWidget {
  const GoogleCalendarConnectPage({super.key});

  @override
  ConsumerState<GoogleCalendarConnectPage> createState() =>
      _GoogleCalendarConnectPageState();
}

class _GoogleCalendarConnectPageState
    extends ConsumerState<GoogleCalendarConnectPage> {
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleConnect() async {
    if (_isLoading) return;

    HapticFeedback.mediumImpact();
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final connectCalendar = ref.read(connectCalendarCallbackProvider);
      final success = await connectCalendar();

      if (!mounted) return;

      if (success) {
        HapticFeedback.lightImpact();
        ref.invalidate(calendarConnectedProvider);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Google Calendar connected successfully'),
          ),
        );
        context.pop(true);
      } else {
        setState(() {
          _errorMessage =
              'Could not connect Google Calendar. '
              'Please ensure you granted calendar permissions.';
        });
      }
    } on Exception catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isConnected = ref.watch(calendarConnectedProvider).value ?? false;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Google Calendar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Google Calendar icon
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: const Color(0xFF4285F4).withValues(alpha: 0.1),
                ),
                child: const Icon(
                  Icons.event_rounded,
                  size: 40,
                  color: Color(0xFF4285F4),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Connect your Google Calendar',
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Your Google Calendar events will appear alongside your '
                'UNJYNX tasks, so you can plan around your schedule.',
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Permissions info box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.3,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: colorScheme.outlineVariant.withValues(alpha: 0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'UNJYNX will request access to:',
                      style: textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _PermissionRow(
                      icon: Icons.visibility_rounded,
                      text: 'Read your calendar events',
                      color: colorScheme.primary,
                    ),
                    const SizedBox(height: 8),
                    _PermissionRow(
                      icon: Icons.edit_calendar_rounded,
                      text: 'Create and update events for tasks',
                      color: colorScheme.primary,
                    ),
                    const SizedBox(height: 8),
                    _PermissionRow(
                      icon: Icons.sync_rounded,
                      text: 'Offline access for background sync',
                      color: colorScheme.primary,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Already connected indicator
              if (isConnected) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_rounded,
                        size: 20,
                        color: colorScheme.onPrimaryContainer,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Google Calendar is already connected',
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Error message
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.error_outline_rounded,
                        size: 20,
                        color: colorScheme.onErrorContainer,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onErrorContainer,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Connect button
              FilledButton.icon(
                onPressed: _isLoading ? null : _handleConnect,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: _isLoading
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: colorScheme.onPrimary,
                        ),
                      )
                    : const Icon(Icons.login_rounded),
                label: Text(
                  isConnected
                      ? 'Reconnect Google Calendar'
                      : 'Sign in with Google',
                ),
              ),
              const SizedBox(height: 16),

              // Privacy note
              Text(
                'UNJYNX only reads event titles and times. '
                'We never read event descriptions, attendees, or other details.',
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _PermissionRow({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text, style: Theme.of(context).textTheme.bodySmall),
        ),
      ],
    );
  }
}
