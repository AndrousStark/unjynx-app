import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

/// Time range picker for quiet hours (start and end).
///
/// Shows two tappable time displays that open [showTimePicker].
class QuietHoursPicker extends StatelessWidget {
  const QuietHoursPicker({
    super.key,
    required this.startTime,
    required this.endTime,
    required this.onStartChanged,
    required this.onEndChanged,
  });

  final TimeOfDay? startTime;
  final TimeOfDay? endTime;
  final ValueChanged<TimeOfDay> onStartChanged;
  final ValueChanged<TimeOfDay> onEndChanged;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Row(
      children: [
        Expanded(
          child: _TimeTile(
            label: 'Start',
            time: startTime,
            icon: Icons.bedtime_rounded,
            onTap: () => _pickTime(context, startTime, onStartChanged),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(
              Icons.arrow_forward_rounded,
              size: 20,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.4 : 0.3),
            ),
          ),
        ),
        Expanded(
          child: _TimeTile(
            label: 'End',
            time: endTime,
            icon: Icons.wb_sunny_rounded,
            onTap: () => _pickTime(context, endTime, onEndChanged),
          ),
        ),
      ],
    );
  }

  Future<void> _pickTime(
    BuildContext context,
    TimeOfDay? initialTime,
    ValueChanged<TimeOfDay> onChanged,
  ) async {
    HapticFeedback.selectionClick();
    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime ?? const TimeOfDay(hour: 22, minute: 0),
    );
    if (picked != null) {
      onChanged(picked);
    }
  }
}

class _TimeTile extends StatelessWidget {
  const _TimeTile({
    required this.label,
    required this.time,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final TimeOfDay? time;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isLight
                ? Colors.white.withValues(alpha: 0.7)
                : colorScheme.surfaceContainer.withValues(alpha: 0.5),
            border: Border.all(
              color: isLight
                  ? colorScheme.outlineVariant.withValues(alpha: 0.4)
                  : ux.glassBorder,
              width: 0.5,
            ),
            boxShadow: isLight
                ? [
                    BoxShadow(
                      color: const Color(0xFF1A0533)
                          .withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                    BoxShadow(
                      color: const Color(0xFF1A0533)
                          .withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Column(
            children: [
              SizedBox(
                width: 44,
                height: 44,
                child: Icon(
                  icon,
                  size: 24,
                  color: isLight ? ux.deepPurple : colorScheme.primary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.6 : 0.5),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                time != null ? _formatTime(time!) : 'Not set',
                style: textTheme.headlineMedium?.copyWith(
                  color: time != null
                      ? colorScheme.onSurface
                      : colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.4 : 0.3),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }
}
