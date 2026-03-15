import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';
import '../providers/team_providers.dart';
import '../widgets/invite_dialog.dart';
import '../widgets/team_member_card.dart';

/// N2 -- Team Member Management page.
///
/// Searchable member list with role management, invite flow,
/// and member removal confirmation.
class TeamMembersPage extends ConsumerWidget {
  const TeamMembersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;
    final filteredMembers = ref.watch(filteredMembersProvider);
    final searchQuery = ref.watch(memberSearchQueryProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Members'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_rounded),
            onPressed: () {
              HapticFeedback.lightImpact();
              showInviteSheet(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              onChanged: (value) {
                ref.read(memberSearchQueryProvider.notifier).set(value);
              },
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
              decoration: InputDecoration(
                hintText: 'Search members...',
                hintStyle: textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant.withValues(
                    alpha: isLight ? 0.6 : 0.5,
                  ),
                ),
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                filled: true,
                fillColor: isLight
                    ? colorScheme.surfaceContainerHigh.withValues(alpha: 0.5)
                    : colorScheme.surfaceContainer,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),

          // Member list
          Expanded(
            child: filteredMembers.isEmpty
                ? _EmptyState(hasSearch: searchQuery.isNotEmpty)
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredMembers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final member = filteredMembers[index];
                      return TeamMemberCard(
                        member: member,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          _showMemberActions(context, ref, member);
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showMemberActions(
    BuildContext context,
    WidgetRef ref,
    TeamMember member,
  ) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0xFF1A0533).withValues(alpha: 0.20),
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: isLight
                ? Colors.white.withValues(alpha: 0.85)
                : colorScheme.surface,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Drag handle
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colorScheme.onSurfaceVariant
                            .withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Member info header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: colorScheme.primary.withValues(
                          alpha: 0.12,
                        ),
                        child: Text(
                          member.name.isNotEmpty
                              ? member.name[0].toUpperCase()
                              : '?',
                          style: textTheme.titleMedium?.copyWith(
                            fontSize: 18,
                            color: colorScheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              member.name,
                              style: textTheme.headlineSmall?.copyWith(
                                fontSize: 18,
                                color: colorScheme.onSurface,
                              ),
                            ),
                            Text(
                              member.role.name[0].toUpperCase() +
                                  member.role.name.substring(1),
                              style: textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Change role
                  if (member.role != TeamRole.owner)
                    ListTile(
                      leading: const Icon(Icons.manage_accounts_rounded),
                      title: const Text('Change Role'),
                      onTap: () {
                        HapticFeedback.selectionClick();
                        Navigator.of(context).pop();
                        _showRoleDialog(context, ref, member);
                      },
                    ),

                  // Remove member
                  if (member.role != TeamRole.owner)
                    ListTile(
                      leading: Icon(
                        Icons.person_remove_rounded,
                        color: ux.warning,
                      ),
                      title: Text(
                        'Remove from Team',
                        style: TextStyle(color: ux.warning),
                      ),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        Navigator.of(context).pop();
                        _confirmRemove(context, ref, member);
                      },
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showRoleDialog(
    BuildContext context,
    WidgetRef ref,
    TeamMember member,
  ) {
    final colorScheme = Theme.of(context).colorScheme;

    showDialog<TeamRole>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Change Role'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final role
                in [TeamRole.admin, TeamRole.member, TeamRole.viewer])
              RadioListTile<TeamRole>(
                value: role,
                groupValue: member.role,
                title: Text(
                  role.name[0].toUpperCase() + role.name.substring(1),
                ),
                onChanged: (value) {
                  HapticFeedback.selectionClick();
                  Navigator.of(context).pop(value);
                },
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
        ],
      ),
    ).then((newRole) {
      if (newRole != null && newRole != member.role) {
        final teamId = ref.read(currentTeamProvider)?.id;
        ref.read(membersProvider.notifier).updateRole(
              member.id,
              newRole,
              teamId: teamId,
            );
      }
    });
  }

  void _confirmRemove(
    BuildContext context,
    WidgetRef ref,
    TeamMember member,
  ) {
    final colorScheme = Theme.of(context).colorScheme;

    showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colorScheme.surface,
        title: const Text('Remove Member?'),
        content: Text(
          'Are you sure you want to remove ${member.name} from the team? '
          'Their assigned tasks will be unassigned.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: colorScheme.error,
            ),
            child: const Text('Remove'),
          ),
        ],
      ),
    ).then((confirmed) {
      if (confirmed == true) {
        final teamId = ref.read(currentTeamProvider)?.id;
        ref.read(membersProvider.notifier).removeMember(
              member.id,
              teamId: teamId,
            );
      }
    });
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.hasSearch});

  final bool hasSearch;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colorScheme.primary.withValues(
                alpha: isLight ? 0.1 : 0.12,
              ),
            ),
            child: Icon(
              hasSearch ? Icons.search_off_rounded : Icons.people_outline,
              size: 40,
              color: colorScheme.primary.withValues(
                alpha: isLight ? 0.6 : 0.5,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            hasSearch ? 'No members found' : 'No team members yet',
            style: textTheme.titleMedium?.copyWith(
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            hasSearch
                ? 'Try a different search'
                : 'Invite people to get started',
            style: textTheme.bodyMedium?.copyWith(
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
