import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/services/nlp_parser.dart';
import 'package:feature_todos/src/presentation/providers/todo_providers.dart';

/// Enhanced bottom sheet with NLP-powered natural language parsing.
///
/// As the user types, the parser extracts date, time, priority,
/// and project hints in real time, showing a live preview of
/// the structured task data below the input field.
///
/// Manual override buttons let the user tweak any parsed field
/// via standard Material pickers.
class QuickCreateSheet extends ConsumerStatefulWidget {
  const QuickCreateSheet({super.key});

  @override
  ConsumerState<QuickCreateSheet> createState() => _QuickCreateSheetState();
}

class _QuickCreateSheetState extends ConsumerState<QuickCreateSheet>
    with SingleTickerProviderStateMixin {
  final _controller = TextEditingController();
  ParsedTask _parsed = const ParsedTask(title: '');
  bool _isSubmitting = false;

  // Manual overrides (take precedence over NLP-parsed values)
  DateTime? _manualDate;
  TimeOfDay? _manualTime;
  TodoPriority? _manualPriority;
  bool _dateOverridden = false;
  bool _timeOverridden = false;
  bool _priorityOverridden = false;

  // Voice input state
  final SpeechService _speechService = SpeechService();
  late final AnimationController _pulseController;
  bool _isListening = false;
  bool _speechInitialized = false;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_onTextChanged);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _speechService.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onTextChanged() {
    setState(() {
      _parsed = NlpParser.parse(_controller.text);
    });
  }

  // ---------------------------------------------------------------------------
  // Resolved values (manual override > NLP-parsed)
  // ---------------------------------------------------------------------------

  DateTime? get _resolvedDate =>
      _dateOverridden ? _manualDate : _parsed.dueDate;

  TimeOfDay? get _resolvedTime =>
      _timeOverridden ? _manualTime : _parsed.dueTime;

  TodoPriority get _resolvedPriority {
    if (_priorityOverridden && _manualPriority != null) {
      return _manualPriority!;
    }
    return _priorityFromString(_parsed.priority);
  }

  String? get _resolvedProject => _parsed.projectHint;

  // ---------------------------------------------------------------------------
  // Voice input
  // ---------------------------------------------------------------------------

  Future<void> _toggleVoice() async {
    HapticFeedback.mediumImpact();

    if (_isListening) {
      await _speechService.stopListening();
      _pulseController.stop();
      _pulseController.reset();
      setState(() => _isListening = false);
      return;
    }

    // Initialize on first use
    if (!_speechInitialized) {
      final available = await _speechService.initialize();
      _speechInitialized = true;
      if (!available) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Speech recognition is not available on this device',
              ),
              duration: Duration(seconds: 3),
            ),
          );
        }
        return;
      }
    }

    if (!_speechService.isAvailable) return;

    // Start listening
    setState(() => _isListening = true);
    _pulseController.repeat();

    await _speechService.startListening(
      onResult: (text) {
        _controller.text = text;
        _controller.selection = TextSelection.fromPosition(
          TextPosition(offset: text.length),
        );
        // Auto-stop UI when the engine finishes
        if (!_speechService.isListening && mounted) {
          _pulseController.stop();
          _pulseController.reset();
          setState(() => _isListening = false);
        }
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 16,
          bottom: bottomInset + 24,
        ),
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
                      .withValues(alpha: isLight ? 0.4 : 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Header
            Text(
              'Quick Add ${unjynxLabelWidget(ref, 'Task')}',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Type naturally: "Buy milk tomorrow 9am #p1 @personal"',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),

            // Text input
            TextField(
              controller: _controller,
              autofocus: true,
              style: TextStyle(
                color: colorScheme.onSurface,
                fontSize: 16,
              ),
              decoration: InputDecoration(
                hintText: 'What needs to be done?',
                hintStyle: TextStyle(color: colorScheme.onSurfaceVariant),
                filled: true,
                fillColor: colorScheme.surfaceContainerHigh,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: colorScheme.primary,
                    width: 2,
                  ),
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: 12),

            // Parsed preview chips
            if (_hasParsedData) _buildParsedPreview(),

            if (_hasParsedData) const SizedBox(height: 12),

            // Manual override action buttons
            _buildActionRow(),
            const SizedBox(height: 16),

            // Parsed title preview
            if (_parsed.title.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isLight
                      ? colorScheme.surfaceContainerLowest
                      : colorScheme.surfaceContainerLowest
                          .withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: colorScheme.primary
                        .withValues(alpha: isLight ? 0.15 : 0.2),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.auto_fix_high,
                      size: 16,
                      color: colorScheme.primary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _parsed.title,
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
            ],

            // Submit button
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _isSubmitting || _controller.text.trim().isEmpty
                    ? null
                    : () {
                        HapticFeedback.mediumImpact();
                        _submit();
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: ux.gold,
                  foregroundColor: isLight
                      ? Colors.white
                      : Colors.black,
                  disabledBackgroundColor:
                      ux.gold.withValues(alpha: isLight ? 0.25 : 0.3),
                  disabledForegroundColor: isLight
                      ? Colors.white.withValues(alpha: 0.5)
                      : Colors.black.withValues(alpha: 0.3),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: isLight ? Colors.white : Colors.black,
                        ),
                      )
                    : Text(
                        'Add ${unjynxLabelWidget(ref, 'Task')}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Parsed preview chips
  // ---------------------------------------------------------------------------

  bool get _hasParsedData =>
      _resolvedDate != null ||
      _resolvedTime != null ||
      _resolvedPriority != TodoPriority.none ||
      _resolvedProject != null;

  Widget _buildParsedPreview() {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (_resolvedDate != null)
          _PreviewChip(
            icon: Icons.calendar_today,
            label: _formatDate(_resolvedDate!),
            color: ux.gold,
            onClear: () {
              HapticFeedback.lightImpact();
              setState(() {
                _dateOverridden = true;
                _manualDate = null;
              });
            },
          ),
        if (_resolvedTime != null)
          _PreviewChip(
            icon: Icons.access_time,
            label: _formatTime(_resolvedTime!),
            color: colorScheme.primary,
            onClear: () {
              HapticFeedback.lightImpact();
              setState(() {
                _timeOverridden = true;
                _manualTime = null;
              });
            },
          ),
        if (_resolvedPriority != TodoPriority.none)
          _PreviewChip(
            icon: Icons.flag,
            label: _resolvedPriority.name[0].toUpperCase() +
                _resolvedPriority.name.substring(1),
            color: unjynxPriorityColor(context, _resolvedPriority.name),
            onClear: () {
              HapticFeedback.lightImpact();
              setState(() {
                _priorityOverridden = true;
                _manualPriority = TodoPriority.none;
              });
            },
          ),
        if (_resolvedProject != null)
          _PreviewChip(
            icon: Icons.folder_outlined,
            label: _resolvedProject!,
            color: ux.success,
          ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Action row (manual overrides)
  // ---------------------------------------------------------------------------

  Widget _buildActionRow() {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Row(
      children: [
        _ActionButton(
          icon: Icons.calendar_today_outlined,
          tooltip: 'Set date',
          isActive: _resolvedDate != null,
          activeColor: ux.gold,
          onTap: () {
            HapticFeedback.lightImpact();
            _showDatePicker();
          },
        ),
        const SizedBox(width: 12),
        _ActionButton(
          icon: Icons.access_time_outlined,
          tooltip: 'Set time',
          isActive: _resolvedTime != null,
          activeColor: colorScheme.primary,
          onTap: () {
            HapticFeedback.lightImpact();
            _showTimePicker();
          },
        ),
        const SizedBox(width: 12),
        _ActionButton(
          icon: Icons.flag_outlined,
          tooltip: 'Set priority',
          isActive: _resolvedPriority != TodoPriority.none,
          activeColor: unjynxPriorityColor(context, _resolvedPriority.name),
          onTap: () {
            HapticFeedback.lightImpact();
            _showPriorityPicker();
          },
        ),
        const SizedBox(width: 12),
        _VoiceActionButton(
          isListening: _isListening,
          pulseController: _pulseController,
          onTap: _toggleVoice,
        ),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // Pickers
  // ---------------------------------------------------------------------------

  Future<void> _showDatePicker() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _resolvedDate ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365 * 5)),
    );

    if (date != null && mounted) {
      setState(() {
        _dateOverridden = true;
        _manualDate = date;
      });
    }
  }

  Future<void> _showTimePicker() async {
    final time = await showTimePicker(
      context: context,
      initialTime:
          _resolvedTime ?? const TimeOfDay(hour: 9, minute: 0),
    );

    if (time != null && mounted) {
      setState(() {
        _timeOverridden = true;
        _manualTime = time;
      });
    }
  }

  void _showPriorityPicker() {
    showModalBottomSheet<TodoPriority>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        final cs = Theme.of(context).colorScheme;
        final uxInner = context.unjynx;
        return Container(
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Set Priority',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: cs.onSurface,
                      ),
                    ),
                  ),
                  for (final priority in TodoPriority.values)
                    _PriorityTile(
                      priority: priority,
                      isSelected: priority == _resolvedPriority,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        Navigator.of(context).pop(priority);
                      },
                    ),
                ],
              ),
            ),
          ),
        );
      },
    ).then((selected) {
      if (selected != null && mounted) {
        setState(() {
          _priorityOverridden = true;
          _manualPriority = selected;
        });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  Future<void> _submit() async {
    final title = _parsed.title.isNotEmpty
        ? _parsed.title
        : _controller.text.trim();

    if (title.isEmpty) return;

    setState(() => _isSubmitting = true);

    DateTime? scheduledAt;
    final date = _resolvedDate;
    if (date != null) {
      final time = _resolvedTime ?? const TimeOfDay(hour: 9, minute: 0);
      scheduledAt = DateTime(
        date.year,
        date.month,
        date.day,
        time.hour,
        time.minute,
      );
    }

    final createTodo = ref.read(createTodoProvider);
    final result = await createTodo(
      title: title,
      priority: _resolvedPriority,
      dueDate: scheduledAt,
    );

    // Schedule notifications after successful task creation.
    result.when(
      ok: (todo) {
        final notificationPort = ref.read(notificationPortProvider);

        // 1. Immediate confirmation notification for every task.
        unawaited(notificationPort.schedule(
          id: '${todo.id}-confirm',
          title: 'Task added',
          body: todo.title,
          scheduledAt: DateTime.now().add(const Duration(seconds: 1)),
          payload: {'todo_id': todo.id},
        ));

        // 2. Reminder notification at due date minus 15 min offset.
        if (scheduledAt != null) {
          const defaultReminderOffset = Duration(minutes: 15);
          final dueDate = scheduledAt;
          final reminderTime =
              dueDate.subtract(defaultReminderOffset);
          if (reminderTime.isAfter(DateTime.now())) {
            unawaited(notificationPort.schedule(
              id: todo.id,
              title: 'Upcoming task',
              body: todo.title,
              scheduledAt: reminderTime,
              payload: {'todo_id': todo.id},
            ));
          } else if (dueDate.isAfter(DateTime.now())) {
            // Offset already passed but due date is still future —
            // schedule at the due date itself.
            unawaited(notificationPort.schedule(
              id: todo.id,
              title: 'Task reminder',
              body: todo.title,
              scheduledAt: dueDate,
              payload: {'todo_id': todo.id},
            ));
          }
        }
      },
      err: (_, __) {},
    );

    ref.invalidate(todoListProvider);

    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) return 'Today';
    if (dateOnly == today.add(const Duration(days: 1))) return 'Tomorrow';

    final weekdays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ];
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    final diff = dateOnly.difference(today).inDays;
    if (diff > 0 && diff <= 7) {
      return weekdays[date.weekday - 1];
    }

    return '${months[date.month - 1]} ${date.day}';
  }

  String _formatTime(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }

  TodoPriority _priorityFromString(String? value) {
    return switch (value?.toLowerCase()) {
      'urgent' => TodoPriority.urgent,
      'high' => TodoPriority.high,
      'medium' => TodoPriority.medium,
      'low' => TodoPriority.low,
      _ => TodoPriority.none,
    };
  }
}

// =============================================================================
// Private widgets
// =============================================================================

/// A chip that shows an extracted field with an optional clear button.
class _PreviewChip extends StatelessWidget {
  const _PreviewChip({
    required this.icon,
    required this.label,
    required this.color,
    this.onClear,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final isLight = context.isLightMode;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isLight ? 0.08 : 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withValues(alpha: isLight ? 0.25 : 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
          if (onClear != null) ...[
            const SizedBox(width: 4),
            GestureDetector(
              onTap: onClear,
              child: SizedBox(
                width: 44,
                height: 44,
                child: Center(
                  child: Icon(
                    Icons.close,
                    size: 14,
                    color: color.withValues(alpha: isLight ? 0.6 : 0.7),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// A circular icon button for manual override actions.
class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.tooltip,
    required this.isActive,
    required this.activeColor,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;
    final color = isActive ? activeColor : colorScheme.onSurfaceVariant;

    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: isLight ? 0.08 : 0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: color.withValues(
                alpha: isActive
                    ? (isLight ? 0.4 : 0.5)
                    : (isLight ? 0.15 : 0.2),
              ),
            ),
          ),
          child: Icon(icon, size: 20, color: color),
        ),
      ),
    );
  }
}

/// Microphone button with a pulsing animation when actively listening.
///
/// Follows the same visual pattern as [_ActionButton] but adds a sine-based
/// scale pulse when [isListening] is true, matching the onboarding
/// [VoiceInputButton] pattern.
class _VoiceActionButton extends StatelessWidget {
  const _VoiceActionButton({
    required this.isListening,
    required this.pulseController,
    required this.onTap,
  });

  final bool isListening;
  final AnimationController pulseController;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    final activeColor = ux.gold;
    final idleColor = colorScheme.onSurfaceVariant;

    return Tooltip(
      message: isListening ? 'Stop listening' : 'Voice input',
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedBuilder(
          animation: pulseController,
          builder: (context, child) {
            final pulse = isListening
                ? 1.0 +
                    0.12 *
                        math.sin(pulseController.value * 2 * math.pi)
                : 1.0;

            final color = isListening ? activeColor : idleColor;

            return Transform.scale(
              scale: pulse,
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isListening
                      ? activeColor.withValues(
                          alpha: isLight ? 0.12 : 0.18,
                        )
                      : color.withValues(alpha: isLight ? 0.08 : 0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: color.withValues(
                      alpha: isListening
                          ? (isLight ? 0.4 : 0.5)
                          : (isLight ? 0.15 : 0.2),
                    ),
                  ),
                  boxShadow: isListening
                      ? [
                          BoxShadow(
                            color: activeColor.withValues(
                              alpha: isLight ? 0.20 : 0.35,
                            ),
                            blurRadius: isLight ? 10 : 16,
                            spreadRadius: isLight ? 1 : 2,
                          ),
                        ]
                      : [],
                ),
                child: Icon(
                  isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                  size: 20,
                  color: color,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// A list tile for the priority picker bottom sheet.
class _PriorityTile extends StatelessWidget {
  const _PriorityTile({
    required this.priority,
    required this.isSelected,
    required this.onTap,
  });

  final TodoPriority priority;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    final color = unjynxPriorityColor(context, priority.name);

    final label = priority == TodoPriority.none
        ? 'No priority'
        : priority.name[0].toUpperCase() + priority.name.substring(1);

    return ListTile(
      leading: Icon(Icons.flag, color: color),
      title: Text(
        label,
        style: TextStyle(color: colorScheme.onSurface),
      ),
      trailing: isSelected
          ? Icon(Icons.check, color: ux.gold)
          : null,
      selected: isSelected,
      onTap: onTap,
    );
  }
}
