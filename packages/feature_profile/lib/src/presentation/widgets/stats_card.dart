import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Displays user productivity stats (completed tasks, streak, etc.).
class StatsCard extends StatelessWidget {
  const StatsCard({
    this.tasksCompleted = 0,
    this.currentStreak = 0,
    this.totalXp = 0,
    super.key,
  });

  final int tasksCompleted;
  final int currentStreak;
  final int totalXp;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      shadowColor: isLight ? const Color(0xFF1A0533).withValues(alpha: 0.15) : null,
      elevation: isLight ? 3 : 0,
      child: Container(
        decoration: isLight
            ? BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF1A0533).withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              )
            : null,
        child: Padding(
        padding: const EdgeInsets.all(20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _StatItem(
                icon: Icons.check_circle_outline,
                value: '$tasksCompleted',
                label: 'Completed',
                color: ux.success,
                isLight: isLight,
              ),
              _StatItem(
                icon: Icons.local_fire_department_outlined,
                value: '$currentStreak',
                label: 'Day streak',
                // Light: full opacity rich gold (#B8860B reads well on white card)
                // Dark: 80% opacity electric gold (#FFD700 is too bright at 100%)
                color: isLight ? ux.gold : ux.gold.withValues(alpha: 0.8),
                isLight: isLight,
              ),
              _StatItem(
                icon: Icons.bolt_outlined,
                value: '$totalXp',
                label: 'XP',
                color: colorScheme.primary,
                isLight: isLight,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.isLight,
  });

  final IconData icon;
  final String value;
  final String label;
  final Color color;
  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Icon with subtle background circle for better visual weight
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            // Light: higher opacity wash (needs to pop against white card)
            // Dark: lower opacity wash (subtle glow on dark card)
            color: color.withValues(alpha: isLight ? 0.12 : 0.15),
          ),
          child: Icon(icon, color: color, size: 26),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: textTheme.displaySmall?.copyWith(
            color: color,
            fontWeight: isLight ? FontWeight.w700 : FontWeight.bold,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            // Light: higher opacity for readability against white card
            // Dark: standard onSurfaceVariant works well
            color: isLight
                ? colorScheme.onSurfaceVariant
                : colorScheme.onSurfaceVariant.withValues(alpha: 0.85),
          ),
        ),
      ],
    );
  }
}
