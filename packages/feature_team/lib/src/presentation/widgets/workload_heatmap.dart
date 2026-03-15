import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_member.dart';

/// Horizontal bar chart showing task load per team member.
///
/// Members with high load are highlighted via a 5-level discrete brand scale.
class WorkloadHeatmap extends StatelessWidget {
  const WorkloadHeatmap({required this.members, super.key});

  final List<TeamMember> members;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    if (members.isEmpty) {
      return Center(
        child: Text(
          'No team members yet',
          style: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }

    final maxTasks = members.fold<int>(
      1,
      (max, m) => m.tasksAssigned > max ? m.tasksAssigned : max,
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WORKLOAD',
          style: textTheme.labelMedium?.copyWith(
            letterSpacing: 1,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 12),
        ...members.map((member) {
          final fraction = member.tasksAssigned / maxTasks;
          final barColor = _barColor(fraction, ux, colorScheme, isLight);

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                SizedBox(
                  width: 80,
                  child: Text(
                    _firstName(member.name),
                    style: textTheme.bodySmall?.copyWith(
                      fontSize: 13,
                      color: colorScheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final barWidth = constraints.maxWidth * fraction;
                      return Stack(
                        children: [
                          Container(
                            height: 20,
                            decoration: BoxDecoration(
                              color: colorScheme.surfaceContainerHigh
                                  .withValues(alpha: isLight ? 0.5 : 0.3),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeOutCubic,
                            width: barWidth.clamp(0, constraints.maxWidth),
                            height: 20,
                            decoration: BoxDecoration(
                              color: barColor,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 28,
                  child: Text(
                    '${member.tasksAssigned}',
                    style: textTheme.displaySmall?.copyWith(
                      fontSize: 13,
                      color: colorScheme.onSurface,
                    ),
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  /// 5-level discrete brand scale for workload bars.
  static Color _barColor(
    double fraction,
    UnjynxCustomColors ux,
    ColorScheme cs,
    bool isLight,
  ) {
    if (fraction <= 0) {
      return isLight
          ? const Color(0xFFF0EAF5)
          : cs.surfaceContainerHigh.withValues(alpha: 0.3);
    }
    if (fraction <= 0.25) return const Color(0xFFD1C4E9);
    if (fraction <= 0.50) {
      return const Color(0xFF9333EA).withValues(alpha: 0.4);
    }
    if (fraction <= 0.75) return cs.primary;
    return ux.gold;
  }

  static String _firstName(String name) {
    final space = name.indexOf(' ');
    return space > 0 ? name.substring(0, space) : name;
  }
}
