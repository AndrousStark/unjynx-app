import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/notification_providers.dart';
import '../widgets/quiet_hours_picker.dart';

/// J6 — Quiet Hours page.
///
/// Time range picker for "do not disturb" windows with day-of-week toggles,
/// urgency override, and timezone display.
class QuietHoursPage extends ConsumerStatefulWidget {
  const QuietHoursPage({super.key});

  @override
  ConsumerState<QuietHoursPage> createState() => _QuietHoursPageState();
}

class _QuietHoursPageState extends ConsumerState<QuietHoursPage> {
  late TimeOfDay? _startTime;
  late TimeOfDay? _endTime;
  late List<int> _selectedDays;
  late bool _overrideForUrgent;
  bool _hasChanges = false;

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  void initState() {
    super.initState();
    final prefs = ref.read(preferencesProvider);
    _startTime = prefs.quietStart;
    _endTime = prefs.quietEnd;
    _selectedDays = List<int>.from(prefs.quietDays);
    _overrideForUrgent = prefs.overrideForUrgent;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? [Colors.white, const Color(0xFFF0EAFC)]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // App bar
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () =>
                          GoRouter.of(context).go('/notifications'),
                      icon: Icon(
                        Icons.arrow_back_rounded,
                        color: colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Quiet Hours',
                        style: textTheme.headlineMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),

                      // Purple gradient header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            colors: isLight
                                ? [
                                    ux.deepPurple.withValues(alpha: 0.08),
                                    ux.deepPurple.withValues(alpha: 0.03),
                                  ]
                                : [
                                    ux.deepPurple.withValues(alpha: 0.5),
                                    ux.deepPurple.withValues(alpha: 0.2),
                                  ],
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
                            Icon(
                              Icons.do_not_disturb_on_rounded,
                              size: 40,
                              color: isLight
                                  ? ux.deepPurple
                                  : colorScheme.primary,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Do Not Disturb',
                              style: textTheme.headlineMedium?.copyWith(
                                color: colorScheme.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Silence non-urgent notifications during '
                              'these hours',
                              textAlign: TextAlign.center,
                              style: textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurfaceVariant
                                    .withValues(
                                        alpha: isLight ? 0.7 : 0.55),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Time pickers
                      QuietHoursPicker(
                        startTime: _startTime,
                        endTime: _endTime,
                        onStartChanged: (time) {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _startTime = time;
                            _hasChanges = true;
                          });
                        },
                        onEndChanged: (time) {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _endTime = time;
                            _hasChanges = true;
                          });
                        },
                      ),
                      const SizedBox(height: 24),

                      // Day-of-week toggles
                      Text(
                        'Active Days',
                        style: textTheme.titleMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: List.generate(7, (index) {
                          final day = index + 1; // 1=Mon, 7=Sun
                          final isSelected = _selectedDays.contains(day);
                          return _DayChip(
                            label: _dayLabels[index],
                            isSelected: isSelected,
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() {
                                if (isSelected) {
                                  _selectedDays = List<int>.from(_selectedDays)
                                    ..remove(day);
                                } else {
                                  _selectedDays = List<int>.from(_selectedDays)
                                    ..add(day);
                                }
                                _hasChanges = true;
                              });
                            },
                          );
                        }),
                      ),
                      const SizedBox(height: 24),

                      // Override for urgent toggle
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          color: isLight
                              ? Colors.white.withValues(alpha: 0.7)
                              : colorScheme.surfaceContainer
                                  .withValues(alpha: 0.5),
                          border: Border.all(
                            color: isLight
                                ? colorScheme.outlineVariant
                                    .withValues(alpha: 0.4)
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
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Override for Urgent',
                                    style: textTheme.titleMedium?.copyWith(
                                      color: colorScheme.onSurface,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Urgent reminders will still be delivered',
                                    style: textTheme.bodySmall?.copyWith(
                                      color: colorScheme.onSurfaceVariant
                                          .withValues(
                                              alpha: isLight ? 0.6 : 0.5),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            SizedBox(
                              width: 44,
                              height: 44,
                              child: FittedBox(
                                child: Switch.adaptive(
                                  value: _overrideForUrgent,
                                  onChanged: (value) {
                                    HapticFeedback.selectionClick();
                                    setState(() {
                                      _overrideForUrgent = value;
                                      _hasChanges = true;
                                    });
                                  },
                                  activeColor: ux.gold,
                                  activeTrackColor: ux.goldWash,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Timezone display
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: isLight
                              ? ux.infoWash
                              : ux.info.withValues(alpha: 0.08),
                        ),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 44,
                              height: 44,
                              child: Icon(
                                Icons.public_rounded,
                                size: 18,
                                color: ux.info,
                              ),
                            ),
                            Text(
                              'Timezone: ${DateTime.now().timeZoneName}',
                              style: textTheme.labelMedium?.copyWith(
                                color: isLight
                                    ? ux.info
                                    : ux.info.withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),

              // Save button
              if (_hasChanges)
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: ux.gold,
                        foregroundColor:
                            isLight ? const Color(0xFF1A0533) : Colors.black,
                        elevation: isLight ? 2 : 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        'Save Quiet Hours',
                        style: textTheme.titleMedium?.copyWith(
                          color: isLight
                              ? const Color(0xFF1A0533)
                              : Colors.black,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    final current = ref.read(preferencesProvider);
    final updated = current.copyWith(
      quietStart: _startTime,
      quietEnd: _endTime,
      quietDays: _selectedDays,
      overrideForUrgent: _overrideForUrgent,
      clearQuietStart: _startTime == null,
      clearQuietEnd: _endTime == null,
    );
    await ref.read(preferencesProvider.notifier).updatePreferences(updated);

    if (mounted) {
      setState(() => _hasChanges = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Quiet hours saved'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected
              ? ux.gold.withValues(alpha: isLight ? 0.15 : 0.2)
              : isLight
                  ? Colors.white.withValues(alpha: 0.5)
                  : colorScheme.surfaceContainer.withValues(alpha: 0.3),
          border: Border.all(
            color: isSelected
                ? ux.gold.withValues(alpha: isLight ? 0.6 : 0.5)
                : colorScheme.outlineVariant.withValues(alpha: 0.3),
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: textTheme.bodySmall?.copyWith(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected
                  ? isLight
                      ? ux.darkGold
                      : ux.gold
                  : colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.6 : 0.5),
            ),
          ),
        ),
      ),
    );
  }
}
