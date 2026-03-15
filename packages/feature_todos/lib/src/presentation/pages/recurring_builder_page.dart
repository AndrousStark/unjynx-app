import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/services/rrule_service.dart';

/// D5 - Visual recurring task builder.
///
/// Lets users create RRULE-based recurrence without jargon.
/// Presets: Daily, Weekdays, Weekly, Biweekly, Monthly, Yearly.
/// Custom mode: "Every [N] [unit] on [days] at [time]".
/// Shows preview of next 5 occurrences.
class RecurringBuilderPage extends StatefulWidget {
  const RecurringBuilderPage({
    super.key,
    this.initialRrule,
    required this.onSave,
    this.onRemove,
  });

  /// Existing RRULE string to edit (null = new).
  final String? initialRrule;
  final ValueChanged<String> onSave;
  final VoidCallback? onRemove;

  @override
  State<RecurringBuilderPage> createState() => _RecurringBuilderPageState();
}

class _RecurringBuilderPageState extends State<RecurringBuilderPage> {
  static const _service = RRuleService();

  late RecurrenceRule _rule;
  bool _isCustom = false;
  _PresetOption? _selectedPreset;

  @override
  void initState() {
    super.initState();
    if (widget.initialRrule != null && widget.initialRrule!.isNotEmpty) {
      _rule = _service.parseRRuleString(widget.initialRrule!);
      _selectedPreset = _detectPreset(_rule);
      _isCustom = _selectedPreset == null;
    } else {
      _rule = RRulePresets.daily;
      _selectedPreset = _PresetOption.daily;
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        // Light: white sheet; Dark: surface
        color: isLight ? Colors.white : colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.25 : 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Header
              Row(
                children: [
                  Text(
                    'Repeat',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const Spacer(),
                  if (widget.onRemove != null)
                    TextButton(
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        widget.onRemove!();
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        'Remove',
                        style: TextStyle(color: colorScheme.error),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 20),

              // Preset chips
              _buildPresets(),
              const SizedBox(height: 20),

              // Custom builder (shown when custom is selected)
              if (_isCustom) ...[
                _buildCustomBuilder(),
                const SizedBox(height: 16),
              ],

              // End condition
              _buildEndCondition(),
              const SizedBox(height: 20),

              // Human-readable description
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  // Light: lavender tint; Dark: subtle glass
                  color: isLight
                      ? colorScheme.surfaceContainer
                      : colorScheme.surfaceContainerLowest
                          .withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: colorScheme.primary
                        .withValues(alpha: isLight ? 0.2 : 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.repeat,
                      size: 18,
                      color: colorScheme.primary,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _service.describe(_rule),
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Next occurrences preview
              _buildOccurrencePreview(),
              const SizedBox(height: 20),

              // Save button
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    final rruleStr = _service.toRRuleString(_rule);
                    widget.onSave(rruleStr);
                    Navigator.of(context).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: ux.gold,
                    // Light gold (#B8860B) needs white text;
                    // Dark gold (#FFD700) needs black text
                    foregroundColor: isLight ? Colors.white : Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Set Recurrence',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
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

  // ---------------------------------------------------------------------------
  // Presets
  // ---------------------------------------------------------------------------

  Widget _buildPresets() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final preset in _PresetOption.values)
          _PresetChip(
            label: preset.label,
            icon: preset.icon,
            isSelected: _selectedPreset == preset,
            onTap: () {
              HapticFeedback.selectionClick();
              _selectPreset(preset);
            },
          ),
        _PresetChip(
          label: 'Custom',
          icon: Icons.tune,
          isSelected: _isCustom,
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() {
              _isCustom = true;
              _selectedPreset = null;
            });
          },
        ),
      ],
    );
  }

  void _selectPreset(_PresetOption preset) {
    setState(() {
      _selectedPreset = preset;
      _isCustom = false;
      _rule = preset.rule.copyWith(end: _rule.end);
    });
  }

  // ---------------------------------------------------------------------------
  // Custom builder
  // ---------------------------------------------------------------------------

  Widget _buildCustomBuilder() {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Interval + frequency row
        Row(
          children: [
            Text(
              'Every',
              style: TextStyle(
                fontSize: 15,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(width: 10),
            SizedBox(
              width: 60,
              child: Container(
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<int>(
                    value: _rule.interval,
                    dropdownColor: colorScheme.surfaceContainerHigh,
                    style: TextStyle(
                      color: colorScheme.onSurface,
                      fontSize: 15,
                    ),
                    isExpanded: true,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    items: List.generate(30, (i) => i + 1)
                        .map((n) => DropdownMenuItem(
                              value: n,
                              child: Text('$n'),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        HapticFeedback.lightImpact();
                        setState(() => _rule = _rule.copyWith(interval: v));
                      }
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: colorScheme.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<RRuleFrequency>(
                    value: _rule.frequency,
                    dropdownColor: colorScheme.surfaceContainerHigh,
                    style: TextStyle(
                      color: colorScheme.onSurface,
                      fontSize: 15,
                    ),
                    isExpanded: true,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    items: RRuleFrequency.values
                        .map((f) => DropdownMenuItem(
                              value: f,
                              child: Text(_frequencyLabel(f)),
                            ))
                        .toList(),
                    onChanged: (v) {
                      if (v != null) {
                        HapticFeedback.lightImpact();
                        setState(
                          () => _rule = _rule.copyWith(
                            frequency: v,
                            byWeekDay: {},
                            byMonthDay: null,
                          ),
                        );
                      }
                    },
                  ),
                ),
              ),
            ),
          ],
        ),

        // Weekly: day selector
        if (_rule.frequency == RRuleFrequency.weekly) ...[
          const SizedBox(height: 16),
          Text(
            'On',
            style: TextStyle(
              fontSize: 13,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          _buildDaySelector(),
        ],

        // Monthly: day of month
        if (_rule.frequency == RRuleFrequency.monthly) ...[
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                'On day',
                style: TextStyle(
                  fontSize: 15,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 70,
                child: Container(
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: _rule.byMonthDay ?? 1,
                      dropdownColor: colorScheme.surfaceContainerHigh,
                      style: TextStyle(
                        color: colorScheme.onSurface,
                        fontSize: 15,
                      ),
                      isExpanded: true,
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12),
                      items: List.generate(31, (i) => i + 1)
                          .map((n) => DropdownMenuItem(
                                value: n,
                                child: Text('$n'),
                              ))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) {
                          HapticFeedback.lightImpact();
                          setState(
                            () => _rule =
                                _rule.copyWith(byMonthDay: v),
                          );
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildDaySelector() {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(7, (i) {
        final dayNum = i + 1; // 1=Mon, 7=Sun
        final isSelected = _rule.byWeekDay.contains(dayNum);
        return GestureDetector(
          onTap: () {
            HapticFeedback.selectionClick();
            final updated = Set<int>.from(_rule.byWeekDay);
            if (isSelected) {
              updated.remove(dayNum);
            } else {
              updated.add(dayNum);
            }
            setState(() => _rule = _rule.copyWith(byWeekDay: updated));
          },
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected
                  ? colorScheme.primary
                  : isLight
                      ? colorScheme.surfaceContainer
                      : colorScheme.surfaceContainerHigh,
            ),
            alignment: Alignment.center,
            child: Text(
              days[i],
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected
                    ? colorScheme.onPrimary
                    : colorScheme.onSurfaceVariant,
              ),
            ),
          ),
        );
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // End condition
  // ---------------------------------------------------------------------------

  Widget _buildEndCondition() {
    final colorScheme = Theme.of(context).colorScheme;

    final endType = switch (_rule.end) {
      RRuleNever() => 'never',
      RRuleAfterCount() => 'after',
      RRuleUntilDate() => 'until',
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ends',
          style: TextStyle(
            fontSize: 13,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _EndChip(
              label: 'Never',
              isSelected: endType == 'never',
              onTap: () {
                HapticFeedback.selectionClick();
                setState(
                  () => _rule = _rule.copyWith(end: const RRuleNever()),
                );
              },
            ),
            const SizedBox(width: 8),
            _EndChip(
              label: 'After',
              isSelected: endType == 'after',
              onTap: () {
                HapticFeedback.selectionClick();
                setState(
                  () => _rule = _rule.copyWith(
                    end: const RRuleAfterCount(10),
                  ),
                );
              },
            ),
            const SizedBox(width: 8),
            _EndChip(
              label: 'Until',
              isSelected: endType == 'until',
              onTap: () async {
                HapticFeedback.selectionClick();
                final date = await showDatePicker(
                  context: context,
                  initialDate:
                      DateTime.now().add(const Duration(days: 90)),
                  firstDate: DateTime.now(),
                  lastDate:
                      DateTime.now().add(const Duration(days: 365 * 5)),
                  builder: (context, child) => child!,
                );
                if (date != null) {
                  setState(
                    () => _rule = _rule.copyWith(
                      end: RRuleUntilDate(date),
                    ),
                  );
                }
              },
            ),
          ],
        ),

        // Count input for "After" mode
        if (endType == 'after') ...[
          const SizedBox(height: 12),
          Row(
            children: [
              Text(
                'After',
                style: TextStyle(
                  fontSize: 15,
                  color: colorScheme.onSurface,
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 70,
                child: Container(
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<int>(
                      value: switch (_rule.end) {
                        RRuleAfterCount(:final count) => count,
                        _ => 10,
                      },
                      dropdownColor: colorScheme.surfaceContainerHigh,
                      style: TextStyle(
                        color: colorScheme.onSurface,
                        fontSize: 15,
                      ),
                      isExpanded: true,
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12),
                      items: [
                        2, 3, 5, 10, 15, 20, 30, 50, 100,
                      ]
                          .map((n) => DropdownMenuItem(
                                value: n,
                                child: Text('$n'),
                              ))
                          .toList(),
                      onChanged: (v) {
                        if (v != null) {
                          HapticFeedback.lightImpact();
                          setState(
                            () => _rule = _rule.copyWith(
                              end: RRuleAfterCount(v),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'occurrences',
                style: TextStyle(
                  fontSize: 15,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Occurrence preview
  // ---------------------------------------------------------------------------

  Widget _buildOccurrencePreview() {
    final colorScheme = Theme.of(context).colorScheme;

    final occurrences =
        _service.getNextOccurrences(_rule, DateTime.now(), count: 5);

    if (occurrences.isEmpty) return const SizedBox.shrink();

    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Next occurrences',
          style: TextStyle(
            fontSize: 13,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 8),
        for (final date in occurrences)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                Icon(
                  Icons.circle,
                  size: 6,
                  color: colorScheme.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  '${weekdays[date.weekday - 1]}, '
                  '${months[date.month - 1]} ${date.day}, ${date.year}',
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  String _frequencyLabel(RRuleFrequency freq) {
    return switch (freq) {
      RRuleFrequency.daily => _rule.interval > 1 ? 'days' : 'day',
      RRuleFrequency.weekly => _rule.interval > 1 ? 'weeks' : 'week',
      RRuleFrequency.monthly => _rule.interval > 1 ? 'months' : 'month',
      RRuleFrequency.yearly => _rule.interval > 1 ? 'years' : 'year',
    };
  }

  _PresetOption? _detectPreset(RecurrenceRule rule) {
    for (final preset in _PresetOption.values) {
      final p = preset.rule;
      if (p.frequency == rule.frequency &&
          p.interval == rule.interval &&
          p.byWeekDay.length == rule.byWeekDay.length &&
          p.byWeekDay.containsAll(rule.byWeekDay)) {
        return preset;
      }
    }
    return null;
  }
}

// =============================================================================
// Supporting widgets
// =============================================================================

enum _PresetOption {
  daily('Daily', Icons.calendar_today, RRulePresets.daily),
  weekdays('Weekdays', Icons.work_outline, RRulePresets.weekdays),
  weekly('Weekly', Icons.view_week, RRulePresets.weekly),
  biweekly('Biweekly', Icons.date_range, RRulePresets.biweekly),
  monthly('Monthly', Icons.calendar_month, RRulePresets.monthly),
  yearly('Yearly', Icons.cake_outlined, RRulePresets.yearly);

  const _PresetOption(this.label, this.icon, this.rule);
  final String label;
  final IconData icon;
  final RecurrenceRule rule;
}

class _PresetChip extends StatelessWidget {
  const _PresetChip({
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
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? colorScheme.primary.withValues(alpha: isLight ? 0.10 : 0.15)
              : isLight
                  ? colorScheme.surfaceContainer
                  : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? colorScheme.primary.withValues(alpha: isLight ? 0.4 : 0.5)
                : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? colorScheme.primary
                  : colorScheme.onSurfaceVariant,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight:
                    isSelected ? FontWeight.w600 : FontWeight.normal,
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

class _EndChip extends StatelessWidget {
  const _EndChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? colorScheme.primary.withValues(alpha: isLight ? 0.10 : 0.15)
              : isLight
                  ? colorScheme.surfaceContainer
                  : colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? colorScheme.primary.withValues(alpha: isLight ? 0.4 : 0.5)
                : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            color: isSelected
                ? colorScheme.primary
                : colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}
