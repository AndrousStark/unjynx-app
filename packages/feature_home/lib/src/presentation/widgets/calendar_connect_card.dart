import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// A compact card that shows the calendar integration status for
/// all three providers (Google, Apple, Outlook) and lets users
/// connect or disconnect each one.
///
/// Uses the [calendarConnectedProvider] for Google and
/// [calendarProvidersProvider] for the full provider list.
class CalendarConnectCard extends ConsumerStatefulWidget {
  const CalendarConnectCard({super.key});

  @override
  ConsumerState<CalendarConnectCard> createState() =>
      _CalendarConnectCardState();
}

class _CalendarConnectCardState extends ConsumerState<CalendarConnectCard> {
  bool _isLoading = false;

  Future<void> _handleGoogleConnect() async {
    if (_isLoading) return;
    HapticFeedback.mediumImpact();

    setState(() => _isLoading = true);

    try {
      final connect = ref.read(connectCalendarCallbackProvider);
      final success = await connect();

      if (mounted) {
        if (success) {
          ref.invalidate(calendarConnectedProvider);
          ref.invalidate(calendarProvidersProvider);
          HapticFeedback.lightImpact();
        }
        setState(() => _isLoading = false);
      }
    } on Exception {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleDisconnect() async {
    if (_isLoading) return;
    HapticFeedback.mediumImpact();

    setState(() => _isLoading = true);

    try {
      final disconnect = ref.read(disconnectCalendarCallbackProvider);
      await disconnect();

      if (mounted) {
        ref.invalidate(calendarConnectedProvider);
        ref.invalidate(calendarProvidersProvider);
        setState(() => _isLoading = false);
      }
    } on Exception {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final providersAsync = ref.watch(calendarProvidersProvider);
    final googleConnectedAsync = ref.watch(calendarConnectedProvider);

    // Determine connected providers from the providers list
    final providers = providersAsync.value ?? const [];
    final googleConnected = googleConnectedAsync.value ?? false;
    final appleConnected =
        providers.any((p) => p['provider'] == 'apple');
    final outlookConnected =
        providers.any((p) => p['provider'] == 'outlook');

    final hasAnyConnection =
        googleConnected || appleConnected || outlookConnected;

    if (hasAnyConnection) {
      return _buildConnectedState(
        context,
        googleConnected: googleConnected,
        appleConnected: appleConnected,
        outlookConnected: outlookConnected,
      );
    }

    return _buildDisconnectedState(context);
  }

  Widget _buildDisconnectedState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isLight
            ? ux.info.withValues(alpha: 0.06)
            : ux.info.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: ux.info.withValues(alpha: isLight ? 0.15 : 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isLight
                      ? colorScheme.surfaceContainerLowest
                      : colorScheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.calendar_month_rounded,
                  size: 20,
                  color: ux.info,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Connect a Calendar',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'See your events alongside tasks',
                      style: TextStyle(
                        fontSize: 12,
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Provider buttons
          Row(
            children: [
              Expanded(
                child: _ProviderChip(
                  label: 'Google',
                  icon: Icons.calendar_today_rounded,
                  isLoading: _isLoading,
                  onTap: _handleGoogleConnect,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ProviderChip(
                  label: 'Apple',
                  icon: Icons.event_rounded,
                  isLoading: false,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push('/calendar/connect/apple');
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _ProviderChip(
                  label: 'Outlook',
                  icon: Icons.sync_alt_rounded,
                  isLoading: false,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push('/calendar/connect/outlook');
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConnectedState(
    BuildContext context, {
    required bool googleConnected,
    required bool appleConnected,
    required bool outlookConnected,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final connectedNames = [
      if (googleConnected) 'Google',
      if (appleConnected) 'Apple',
      if (outlookConnected) 'Outlook',
    ];

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isLight
            ? ux.success.withValues(alpha: 0.06)
            : ux.success.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: ux.success.withValues(alpha: isLight ? 0.15 : 0.2),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isLight
                      ? colorScheme.surfaceContainerLowest
                      : colorScheme.surfaceContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.check_circle_rounded,
                  size: 20,
                  color: ux.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Calendar${connectedNames.length > 1 ? 's' : ''}',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${connectedNames.join(', ')} connected',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: ux.success,
                      ),
                    ),
                  ],
                ),
              ),

              // Manage button
              GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showProviderSheet(
                    context,
                    googleConnected: googleConnected,
                    appleConnected: appleConnected,
                    outlookConnected: outlookConnected,
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: colorScheme.outline.withValues(alpha: 0.3),
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    'Manage',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showProviderSheet(
    BuildContext context, {
    required bool googleConnected,
    required bool appleConnected,
    required bool outlookConnected,
  }) {
    final colorScheme = Theme.of(context).colorScheme;

    showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.outline.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Calendar Providers',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 16),

            _ProviderListTile(
              name: 'Google Calendar',
              icon: Icons.calendar_today_rounded,
              connected: googleConnected,
              onConnect: () {
                Navigator.pop(sheetContext);
                _handleGoogleConnect();
              },
              onDisconnect: () {
                Navigator.pop(sheetContext);
                _handleGoogleDisconnect();
              },
            ),
            const Divider(height: 1),
            _ProviderListTile(
              name: 'Apple Calendar',
              icon: Icons.event_rounded,
              connected: appleConnected,
              onConnect: () {
                Navigator.pop(sheetContext);
                context.push('/calendar/connect/apple');
              },
              onDisconnect: () {
                Navigator.pop(sheetContext);
                // Disconnect via API
                final disconnect = ref.read(disconnectCalendarCallbackProvider);
                disconnect().then((_) {
                  if (mounted) {
                    ref.invalidate(calendarProvidersProvider);
                  }
                });
              },
            ),
            const Divider(height: 1),
            _ProviderListTile(
              name: 'Outlook Calendar',
              icon: Icons.sync_alt_rounded,
              connected: outlookConnected,
              onConnect: () {
                Navigator.pop(sheetContext);
                context.push('/calendar/connect/outlook');
              },
              onDisconnect: () {
                Navigator.pop(sheetContext);
                final disconnect = ref.read(disconnectCalendarCallbackProvider);
                disconnect().then((_) {
                  if (mounted) {
                    ref.invalidate(calendarProvidersProvider);
                  }
                });
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ── Provider Chip (disconnected state) ──────────────────────────────

class _ProviderChip extends StatelessWidget {
  const _ProviderChip({
    required this.label,
    required this.icon,
    required this.isLoading,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isLoading;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            if (isLoading)
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: colorScheme.primary,
                ),
              )
            else
              Icon(icon, size: 18, color: colorScheme.primary),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Provider List Tile (manage sheet) ────────────────────────────────

class _ProviderListTile extends StatelessWidget {
  const _ProviderListTile({
    required this.name,
    required this.icon,
    required this.connected,
    required this.onConnect,
    required this.onDisconnect,
  });

  final String name;
  final IconData icon;
  final bool connected;
  final VoidCallback onConnect;
  final VoidCallback onDisconnect;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: colorScheme.onSurfaceVariant),
      title: Text(name),
      subtitle: Text(
        connected ? 'Connected' : 'Not connected',
        style: TextStyle(
          color: connected ? ux.success : colorScheme.onSurfaceVariant,
          fontWeight: connected ? FontWeight.w500 : FontWeight.normal,
          fontSize: 12,
        ),
      ),
      trailing: connected
          ? TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                onDisconnect();
              },
              child: Text(
                'Disconnect',
                style: TextStyle(
                  color: colorScheme.error,
                  fontSize: 12,
                ),
              ),
            )
          : TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                onConnect();
              },
              child: const Text(
                'Connect',
                style: TextStyle(fontSize: 12),
              ),
            ),
    );
  }
}
