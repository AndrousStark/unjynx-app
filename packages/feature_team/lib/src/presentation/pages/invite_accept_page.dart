import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:service_api/service_api.dart';
import 'package:service_auth/service_auth.dart';

import '../providers/team_providers.dart';

/// Invite acceptance page.
///
/// Shows org info and lets the user accept or decline.
/// Accessible via deep link: unjynx://invite/{code}
/// Or via route: /invite/:code
class InviteAcceptPage extends ConsumerStatefulWidget {
  const InviteAcceptPage({required this.inviteCode, super.key});

  final String inviteCode;

  @override
  ConsumerState<InviteAcceptPage> createState() => _InviteAcceptPageState();
}

class _InviteAcceptPageState extends ConsumerState<InviteAcceptPage>
    with SingleTickerProviderStateMixin {
  bool _isAccepting = false;
  bool _accepted = false;
  String? _error;
  Map<String, dynamic>? _orgInfo;

  late final AnimationController _fadeController;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOut,
    );
    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  Future<void> _acceptInvite() async {
    if (_isAccepting) return;

    setState(() {
      _isAccepting = true;
      _error = null;
    });
    HapticFeedback.mediumImpact();

    try {
      final orgApi = ref.read(organizationApiProvider);
      final response = await orgApi.acceptInvite(widget.inviteCode);

      if (!mounted) return;

      if (response.success) {
        HapticFeedback.heavyImpact();
        setState(() {
          _accepted = true;
          _orgInfo = response.data;
        });
        ref.invalidate(organizationsProvider);

        await Future<void>.delayed(const Duration(seconds: 2));
        if (mounted) context.go('/');
      } else {
        setState(() => _error = response.error ?? 'Failed to accept invite');
      }
    } on DioException catch (e) {
      if (mounted) {
        final msg = e.response?.data is Map
            ? (e.response!.data as Map)['error'] as String? ??
                  'Failed to accept invite'
            : 'Network error. Check your connection.';
        setState(() => _error = msg);
      }
    } finally {
      if (mounted) setState(() => _isAccepting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isAuthenticated = ref.watch(isAuthenticatedProvider).value ?? false;

    return Scaffold(
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              children: [
                const Spacer(flex: 2),

                // Icon
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: _accepted
                        ? const LinearGradient(
                            colors: [Color(0xFF22C55E), Color(0xFF16A34A)],
                          )
                        : LinearGradient(
                            colors: [
                              colorScheme.primary,
                              const Color(0xFF3B82F6),
                            ],
                          ),
                  ),
                  child: Icon(
                    _accepted ? Icons.check_rounded : Icons.group_add_rounded,
                    size: 40,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  _accepted ? 'Welcome Aboard!' : "You're Invited!",
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),

                if (_accepted) ...[
                  Text(
                    'Redirecting to your workspace...',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ] else ...[
                  Text(
                    'You have been invited to join an organization',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 32),

                // Org info card (if available from accept response)
                if (_orgInfo != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest.withValues(
                        alpha: 0.3,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: colorScheme.outlineVariant.withValues(
                          alpha: 0.3,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            gradient: LinearGradient(
                              colors: [
                                colorScheme.primary,
                                colorScheme.tertiary,
                              ],
                            ),
                          ),
                          child: Center(
                            child: Text(
                              (_orgInfo!['orgName'] as String? ?? 'O')[0]
                                  .toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _orgInfo!['orgName'] as String? ??
                                    'Organization',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                'Role: ${_orgInfo!['role'] ?? 'member'}',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: colorScheme.primary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                ],

                // Invite code display
                if (!_accepted) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.surfaceContainerHighest.withValues(
                        alpha: 0.3,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: colorScheme.outlineVariant.withValues(
                          alpha: 0.3,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.vpn_key_rounded,
                          size: 18,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            widget.inviteCode,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w500,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy_rounded, size: 18),
                          onPressed: () {
                            Clipboard.setData(
                              ClipboardData(text: widget.inviteCode),
                            );
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Code copied')),
                            );
                          },
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Error
                  if (_error != null) ...[
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
                            size: 18,
                            color: colorScheme.onErrorContainer,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _error!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colorScheme.onErrorContainer,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Accept button
                  if (isAuthenticated) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton.icon(
                        onPressed: _isAccepting ? null : _acceptInvite,
                        icon: _isAccepting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.check_rounded),
                        label: const Text('Accept & Join'),
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.go('/'),
                      child: Text(
                        'Decline',
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ] else ...[
                    // Not logged in — prompt to sign in first
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: colorScheme.primaryContainer.withValues(
                          alpha: 0.2,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Sign in or create an account to accept this invitation.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        onPressed: () => context.go(
                          '/login?redirect=/invite/${widget.inviteCode}',
                        ),
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text('Sign In to Accept'),
                      ),
                    ),
                  ],
                ],

                const Spacer(flex: 3),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
