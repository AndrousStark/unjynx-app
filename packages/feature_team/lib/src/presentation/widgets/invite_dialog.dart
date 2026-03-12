import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';
import '../providers/team_providers.dart';

/// Shows the invite bottom sheet.
///
/// Call this function instead of `showDialog` to display the invite UI.
Future<void> showInviteSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    barrierColor: const Color(0xFF1A0533).withValues(alpha: 0.20),
    isScrollControlled: true,
    builder: (context) => const InviteSheet(),
  );
}

/// Bottom sheet for inviting team members via email, link, or QR.
class InviteSheet extends ConsumerStatefulWidget {
  const InviteSheet({super.key});

  @override
  ConsumerState<InviteSheet> createState() => _InviteSheetState();
}

class _InviteSheetState extends ConsumerState<InviteSheet> {
  final _emailController = TextEditingController();
  TeamRole _selectedRole = TeamRole.member;
  _InviteTab _tab = _InviteTab.email;
  bool _isSending = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: isLight
            ? Colors.white.withValues(alpha: 0.85)
            : colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 12,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text(
              'Invite Team Member',
              style: textTheme.headlineMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 16),

            // Tab selector
            Row(
              children: [
                for (final tab in _InviteTab.values) ...[
                  if (tab != _InviteTab.values.first) const SizedBox(width: 8),
                  Expanded(
                    child: _TabChip(
                      label: tab.label,
                      icon: tab.icon,
                      isSelected: _tab == tab,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _tab = tab);
                      },
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),

            // Tab content
            if (_tab == _InviteTab.email) ...[
              TextField(
                controller: _emailController,
                autofocus: true,
                style: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurface,
                ),
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'email@example.com',
                  hintStyle: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant.withValues(
                      alpha: isLight ? 0.6 : 0.5,
                    ),
                  ),
                  prefixIcon: const Icon(Icons.email_outlined, size: 20),
                ),
              ),
            ] else if (_tab == _InviteTab.link) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: colorScheme.surfaceContainerHigh,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Invite links will be generated when teams are active',
                        style: textTheme.bodySmall?.copyWith(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(
                        Icons.copy_rounded,
                        size: 18,
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.3),
                      ),
                      onPressed: null,
                    ),
                  ],
                ),
              ),
            ] else ...[
              // QR tab placeholder
              Container(
                height: 160,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: colorScheme.surfaceContainerHigh,
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.qr_code_2_rounded,
                        size: 64,
                        color: colorScheme.onSurfaceVariant.withValues(
                          alpha: isLight ? 0.4 : 0.3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'QR code (Pro feature)',
                        style: textTheme.bodySmall?.copyWith(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Role selector
            Text(
              'Role',
              style: textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            SegmentedButton<TeamRole>(
              segments: const [
                ButtonSegment(
                  value: TeamRole.admin,
                  label: Text('Admin'),
                  icon: Icon(Icons.shield_outlined, size: 16),
                ),
                ButtonSegment(
                  value: TeamRole.member,
                  label: Text('Member'),
                  icon: Icon(Icons.person_outline, size: 16),
                ),
                ButtonSegment(
                  value: TeamRole.viewer,
                  label: Text('Viewer'),
                  icon: Icon(Icons.visibility_outlined, size: 16),
                ),
              ],
              selected: {_selectedRole},
              onSelectionChanged: (roles) {
                HapticFeedback.selectionClick();
                setState(() => _selectedRole = roles.first);
              },
            ),
            const SizedBox(height: 20),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isSending ? null : _sendInvite,
                  child: _isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(
                          _tab == _InviteTab.email ? 'Send Invite' : 'Done',
                        ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _sendInvite() async {
    if (_tab == _InviteTab.email) {
      final email = _emailController.text.trim();
      if (email.isEmpty || !email.contains('@')) return;

      setState(() => _isSending = true);
      HapticFeedback.mediumImpact();

      try {
        final team = ref.read(currentTeamProvider);
        if (team != null) {
          await ref.read(invitesProvider.notifier).sendInvite(
                email: email,
                role: _selectedRole,
                teamId: team.id,
              );
        }
      } finally {
        if (mounted) {
          setState(() => _isSending = false);
        }
      }
    }

    if (mounted) {
      Navigator.of(context).pop();
    }
  }
}

enum _InviteTab {
  email,
  link,
  qr;

  String get label {
    switch (this) {
      case _InviteTab.email:
        return 'Email';
      case _InviteTab.link:
        return 'Link';
      case _InviteTab.qr:
        return 'QR';
    }
  }

  IconData get icon {
    switch (this) {
      case _InviteTab.email:
        return Icons.email_outlined;
      case _InviteTab.link:
        return Icons.link_rounded;
      case _InviteTab.qr:
        return Icons.qr_code_2_rounded;
    }
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: isSelected
              ? colorScheme.primary.withValues(alpha: isLight ? 0.12 : 0.15)
              : Colors.transparent,
          border: isSelected
              ? Border.all(color: colorScheme.primary.withValues(alpha: 0.3))
              : Border.all(color: Colors.transparent),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? colorScheme.primary
                  : colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: textTheme.labelMedium?.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected
                    ? colorScheme.primary
                    : colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
