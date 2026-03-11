import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Preview card for a home screen widget type.
///
/// Shows a visual preview placeholder, widget name, size info,
/// description, and a Pro toggle if applicable.
class WidgetPreviewCard extends StatelessWidget {
  const WidgetPreviewCard({
    required this.widgetType,
    this.isEnabled = true,
    this.isProOnly = false,
    this.onToggle,
    super.key,
  });

  final HomeWidgetType widgetType;
  final bool isEnabled;
  final bool isProOnly;
  final ValueChanged<bool>? onToggle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isEnabled
            ? BorderSide(color: colorScheme.primary.withValues(alpha: 0.2))
            : isLight
                ? BorderSide(
                    color: colorScheme.primary.withValues(alpha: 0.08),
                  )
                : BorderSide.none,
      ),
      child: Container(
        decoration: isLight
            ? BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6B21A8).withValues(alpha: isEnabled ? 0.10 : 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              )
            : null,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Preview area
          Container(
            height: 120,
            decoration: BoxDecoration(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              color: isEnabled
                  ? colorScheme.primary.withValues(
                      alpha: isLight ? 0.06 : 0.08,
                    )
                  : colorScheme.surfaceContainerHigh.withValues(
                      alpha: isLight ? 0.4 : 0.3,
                    ),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    widgetType.icon,
                    size: 40,
                    color: isEnabled
                        ? colorScheme.primary.withValues(
                            alpha: isLight ? 0.5 : 0.4,
                          )
                        : ux.textDisabled,
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      color: colorScheme.surfaceContainerHigh.withValues(
                        alpha: isLight ? 0.6 : 0.4,
                      ),
                    ),
                    child: Text(
                      widgetType.sizeLabel,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: colorScheme.onSurfaceVariant,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Info section
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widgetType.displayName,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    if (isProOnly)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(4),
                          color: ux.gold.withValues(
                            alpha: isLight ? 0.15 : 0.2,
                          ),
                          border: isLight
                              ? Border.all(
                                  color: ux.gold.withValues(alpha: 0.3),
                                )
                              : null,
                        ),
                        child: Text(
                          'PRO',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: ux.gold,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  widgetType.description,
                  style: TextStyle(
                    fontSize: 13,
                    color: colorScheme.onSurfaceVariant.withValues(
                      alpha: isLight ? 0.7 : 0.6,
                    ),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 10),

                // Toggle
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isEnabled ? 'Enabled' : 'Disabled',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isEnabled
                            ? colorScheme.primary
                            : ux.textDisabled,
                      ),
                    ),
                    Switch(
                      value: isEnabled,
                      onChanged: isProOnly ? null : onToggle,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }
}

/// Home screen widget type definitions (W1-W5).
enum HomeWidgetType {
  todayTasks(
    'Today\'s Tasks',
    'Shows your tasks due today with quick-complete actions.',
    '4x2',
    Icons.checklist_rounded,
  ),
  dailyProgress(
    'Daily Progress',
    'Completion ring with percentage and streak counter.',
    '2x2',
    Icons.donut_large_rounded,
  ),
  quickAdd(
    'Quick Add',
    'One-tap task creation with voice input support.',
    '4x1',
    Icons.add_circle_outline_rounded,
  ),
  streakCounter(
    'Streak Counter',
    'Displays your current productivity streak and best record.',
    '2x2',
    Icons.local_fire_department_rounded,
  ),
  upcomingDeadlines(
    'Upcoming Deadlines',
    'Shows tasks with approaching due dates across all projects.',
    '4x2',
    Icons.event_rounded,
  );

  const HomeWidgetType(
    this.displayName,
    this.description,
    this.sizeLabel,
    this.icon,
  );

  final String displayName;
  final String description;
  final String sizeLabel;
  final IconData icon;
}
