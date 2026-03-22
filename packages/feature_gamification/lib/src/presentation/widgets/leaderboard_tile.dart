import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/leaderboard_entry.dart';

/// A single row in the leaderboard list.
class LeaderboardTile extends StatelessWidget {
  const LeaderboardTile({
    required this.entry,
    super.key,
  });

  final LeaderboardEntry entry;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isMe = entry.isCurrentUser;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isMe
            ? (isLight
                ? const Color(0xFFFFF8E1)
                : ux.gold.withValues(alpha: 0.08))
            : (isLight
                ? colorScheme.surface
                : colorScheme.surfaceContainerHigh),
        borderRadius: BorderRadius.circular(16),
        border: isMe
            ? Border.all(
                color: ux.gold.withValues(alpha: isLight ? 0.3 : 0.2),
              )
            : null,
        boxShadow: isLight
            ? UnjynxShadows.lightMd
            : null,
      ),
      child: Row(
        children: [
          // Rank
          SizedBox(
            width: 32,
            child: Text(
              _rankDisplay(entry.rank),
              style: entry.rank <= 3
                  ? textTheme.displaySmall?.copyWith(
                      fontSize: 18,
                      color: ux.gold,
                    )
                  : textTheme.displaySmall?.copyWith(
                      fontSize: 15,
                      color: colorScheme.onSurfaceVariant,
                    ),
            ),
          ),
          const SizedBox(width: 12),

          // Avatar
          CircleAvatar(
            radius: 18,
            backgroundColor: colorScheme.primary
                .withValues(alpha: isLight ? 0.12 : 0.2),
            backgroundImage: entry.avatarUrl != null
                ? NetworkImage(entry.avatarUrl!)
                : null,
            child: entry.avatarUrl == null
                ? Text(
                    entry.name.isNotEmpty ? entry.name[0].toUpperCase() : '?',
                    style: textTheme.titleMedium?.copyWith(
                      fontSize: 14,
                      color: colorScheme.primary,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 12),

          // Name
          Expanded(
            child: Text(
              entry.name,
              style: textTheme.titleMedium?.copyWith(
                fontSize: 15,
                fontWeight: isMe ? FontWeight.w700 : FontWeight.w500,
                color: colorScheme.onSurface,
              ),
            ),
          ),

          // XP
          Text(
            '${_formatXp(entry.xp)} XP',
            style: textTheme.displaySmall?.copyWith(
              fontSize: 14,
              color: ux.gold,
            ),
          ),
        ],
      ),
    );
  }

  String _rankDisplay(int rank) {
    switch (rank) {
      case 1:
        return '\u{1F947}'; // Gold medal emoji
      case 2:
        return '\u{1F948}'; // Silver medal emoji
      case 3:
        return '\u{1F949}'; // Bronze medal emoji
      default:
        return '#$rank';
    }
  }

  String _formatXp(int xp) {
    if (xp >= 1000) {
      return '${(xp / 1000).toStringAsFixed(1)}K';
    }
    return '$xp';
  }
}
