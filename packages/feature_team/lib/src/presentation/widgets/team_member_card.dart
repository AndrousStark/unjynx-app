import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';
import 'role_badge.dart';

/// Card displaying a team member with avatar, name, role, and stats.
class TeamMemberCard extends StatelessWidget {
  const TeamMemberCard({
    required this.member,
    this.onTap,
    this.onRoleChange,
    this.onRemove,
    super.key,
  });

  final TeamMember member;
  final VoidCallback? onTap;
  final ValueChanged<TeamRole>? onRoleChange;
  final VoidCallback? onRemove;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return PressableScale(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: isLight
              ? Border.all(
                  color: colorScheme.primary.withValues(alpha: 0.1),
                )
              : null,
          boxShadow: isLight
              ? [
                  BoxShadow(
                    color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                  BoxShadow(
                    color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Avatar with status dot
              _Avatar(member: member),
              const SizedBox(width: 12),

              // Name + role + stats
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            member.name,
                            style: textTheme.titleMedium?.copyWith(
                              fontSize: 15,
                              color: colorScheme.onSurface,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        RoleBadge(role: member.role),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.task_alt_rounded,
                          size: 14,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${member.tasksAssigned} tasks',
                          style: textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          Icons.trending_up_rounded,
                          size: 14,
                          color: ux.success,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${(member.completionRate * 100).round()}%',
                          style: textTheme.displaySmall?.copyWith(
                            fontSize: 12,
                            color: ux.success,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Chevron
              Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: colorScheme.onSurfaceVariant.withValues(
                  alpha: isLight ? 0.5 : 0.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.member});

  final TeamMember member;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final statusColor = switch (member.status) {
      MemberStatus.active => ux.success,
      MemberStatus.idle => ux.warning,
      MemberStatus.offline => ux.textDisabled,
    };

    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: colorScheme.primary.withValues(
              alpha: isLight ? 0.12 : 0.15,
            ),
            backgroundImage:
                member.avatar != null ? NetworkImage(member.avatar!) : null,
            child: member.avatar == null
                ? Text(
                    _initials(member.name),
                    style: textTheme.labelMedium?.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.primary,
                    ),
                  )
                : null,
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: statusColor,
                shape: BoxShape.circle,
                border: Border.all(
                  color: colorScheme.surface,
                  width: 2,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }
}
