import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';

/// Provider for the Outlook OAuth callback.
///
/// Override in app bootstrap with a real implementation that launches the
/// Microsoft OAuth flow (MSAL or custom WebView) and returns the auth code.
/// Returns null if the user cancels the flow.
final outlookOAuthCallbackProvider =
    Provider<Future<String?> Function()>(
  (ref) => () async => null,
);

/// Outlook Calendar connection page.
///
/// Initiates the Microsoft OAuth flow, then sends the auth code to the
/// backend which exchanges it for tokens.
class OutlookConnectPage extends ConsumerStatefulWidget {
  const OutlookConnectPage({super.key});

  @override
  ConsumerState<OutlookConnectPage> createState() =>
      _OutlookConnectPageState();
}

class _OutlookConnectPageState extends ConsumerState<OutlookConnectPage> {
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
      // Step 1: Launch Microsoft OAuth flow
      final getAuthCode = ref.read(outlookOAuthCallbackProvider);
      final authCode = await getAuthCode();

      if (!mounted) return;

      if (authCode == null || authCode.isEmpty) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Microsoft sign-in was cancelled.';
        });
        return;
      }

      // Step 2: Send auth code to backend
      final calendarApi = ref.read(calendarApiProvider);
      final response = await calendarApi.connectOutlook(authCode);

      if (!mounted) return;

      if (response.success) {
        HapticFeedback.lightImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Outlook Calendar connected successfully'),
          ),
        );
        context.pop(true);
      } else {
        setState(() {
          _errorMessage = response.error ?? 'Failed to connect';
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Outlook Calendar'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Spacer(flex: 1),

              // Icon + description
              Icon(
                Icons.sync_alt_rounded,
                size: 56,
                color: colorScheme.primary,
              ),
              const SizedBox(height: 16),
              Text(
                'Connect your Outlook Calendar',
                style: textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in with your Microsoft account to see Outlook events '
                'alongside your UNJYNX tasks.',
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),

              // Permissions info
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'UNJYNX will request:',
                      style: textTheme.labelLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _PermissionRow(
                      icon: Icons.calendar_view_month_rounded,
                      text: 'Read your calendar events',
                      colorScheme: colorScheme,
                    ),
                    const SizedBox(height: 6),
                    _PermissionRow(
                      icon: Icons.edit_calendar_rounded,
                      text: 'Create and update events for tasks',
                      colorScheme: colorScheme,
                    ),
                    const SizedBox(height: 6),
                    _PermissionRow(
                      icon: Icons.lock_outline_rounded,
                      text: 'Offline access for background sync',
                      colorScheme: colorScheme,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

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

              // Sign in button
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
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
                  label: const Text('Sign in with Microsoft'),
                ),
              ),

              const Spacer(flex: 2),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  const _PermissionRow({
    required this.icon,
    required this.text,
    required this.colorScheme,
  });

  final IconData icon;
  final String text;
  final ColorScheme colorScheme;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: colorScheme.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
          ),
        ),
      ],
    );
  }
}
