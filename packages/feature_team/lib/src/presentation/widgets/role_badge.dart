import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';

/// Displays a compact role badge with color coding.
///
/// Owner: gold, Admin: violet, Member: surface, Viewer: muted.
class RoleBadge extends StatelessWidget {
  const RoleBadge({required this.role, super.key});

  final TeamRole role;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final (Color bg, Color fg) = switch (role) {
      TeamRole.owner => (
          ux.gold.withValues(alpha: isLight ? 0.15 : 0.2),
          ux.gold,
        ),
      TeamRole.admin => (
          colorScheme.primary.withValues(alpha: isLight ? 0.12 : 0.15),
          colorScheme.primary,
        ),
      TeamRole.member => (
          colorScheme.surfaceContainerHigh,
          colorScheme.onSurfaceVariant,
        ),
      TeamRole.viewer => (
          colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
          ux.textDisabled,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(100),
        border: role == TeamRole.owner && isLight
            ? Border.all(color: ux.gold.withValues(alpha: 0.3))
            : null,
      ),
      child: Text(
        role.name[0].toUpperCase() + role.name.substring(1),
        style: textTheme.labelMedium?.copyWith(
          fontSize: 11,
          color: fg,
          letterSpacing: 0.3,
        ),
      ),
    );
  }
}
