import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

// =============================================================================
// Time Block model
// =============================================================================

/// A scheduled block of time on the timeline.
@immutable
class TimeBlock {
  const TimeBlock({
    required this.id,
    required this.taskId,
    required this.title,
    required this.startHour,
    required this.startMinute,
    required this.durationMinutes,
    this.color,
    this.priority = HomeTaskPriority.none,
  });

  final String id;
  final String taskId;
  final String title;
  final int startHour;
  final int startMinute;
  final int durationMinutes;
  final Color? color;
  final HomeTaskPriority priority;

  /// Top offset in timeline (15-min snap = 20px per 15 min).
  double get topOffset => (startHour * 60 + startMinute) * (80.0 / 60.0);

  /// Height in timeline.
  double get height => durationMinutes * (80.0 / 60.0);

  /// Creates a copy with updated start time.
  TimeBlock copyWithTime({int? startHour, int? startMinute}) {
    return TimeBlock(
      id: id,
      taskId: taskId,
      title: title,
      startHour: startHour ?? this.startHour,
      startMinute: startMinute ?? this.startMinute,
      durationMinutes: durationMinutes,
      color: color,
      priority: priority,
    );
  }
}

// =============================================================================
// Providers
// =============================================================================

/// Current date for time blocking view.
class _TimeBlockDateNotifier extends Notifier<DateTime> {
  @override
  DateTime build() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day);
  }
  void set(DateTime value) => state = value;
}

final timeBlockDateProvider =
    NotifierProvider<_TimeBlockDateNotifier, DateTime>(
  _TimeBlockDateNotifier.new,
);

/// Scheduled time blocks for the selected date.
class _TimeBlocksNotifier extends Notifier<List<TimeBlock>> {
  @override
  List<TimeBlock> build() => [];
  void set(List<TimeBlock> value) => state = value;
}

final timeBlocksProvider =
    NotifierProvider<_TimeBlocksNotifier, List<TimeBlock>>(
  _TimeBlocksNotifier.new,
);

/// Unscheduled tasks — reads today's real tasks from [homeTodayTasksProvider],
/// filters out completed tasks (already-scheduled ones are filtered in the
/// widget via [timeBlocksProvider]).
final unscheduledTasksProvider = Provider<List<HomeTask>>((ref) {
  final tasksAsync = ref.watch(homeTodayTasksProvider);
  return tasksAsync.when(
    data: (tasks) =>
        tasks.where((t) => !t.isCompleted).toList(growable: false),
    loading: () => const <HomeTask>[],
    error: (_, __) => const <HomeTask>[],
  );
});

// =============================================================================
// Time Blocking Page (F2 — Pro Feature)
// =============================================================================

/// Time Blocking screen: split view with unscheduled tasks on left
/// and a scrollable 24h timeline on right. Drag tasks onto the timeline
/// to create time blocks with 15-minute snap increments.
class TimeBlockingPage extends ConsumerStatefulWidget {
  const TimeBlockingPage({super.key});

  @override
  ConsumerState<TimeBlockingPage> createState() => _TimeBlockingPageState();
}

class _TimeBlockingPageState extends ConsumerState<TimeBlockingPage> {
  final ScrollController _timelineController = ScrollController();

  // 80px per hour
  static const double _hourHeight = 80.0;
  static const double _totalHeight = _hourHeight * 24;
  static const int _snapMinutes = 15;

  @override
  void initState() {
    super.initState();
    // Scroll to 8 AM on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_timelineController.hasClients) {
        _timelineController.jumpTo(8 * _hourHeight);
      }
    });
  }

  @override
  void dispose() {
    _timelineController.dispose();
    super.dispose();
  }

  /// Snap a pixel offset to the nearest 15-min increment.
  ({int hour, int minute}) _snapToGrid(double dy) {
    final totalMinutes = (dy / _hourHeight * 60).round();
    final snapped =
        (totalMinutes / _snapMinutes).round() * _snapMinutes;
    final clamped = snapped.clamp(0, 24 * 60 - _snapMinutes);
    return (hour: clamped ~/ 60, minute: clamped % 60);
  }

  void _onTaskDropped(HomeTask task, double localDy) {
    HapticFeedback.mediumImpact();
    final time = _snapToGrid(localDy);
    final blocks = ref.read(timeBlocksProvider);

    final newBlock = TimeBlock(
      id: 'tb-${DateTime.now().millisecondsSinceEpoch}',
      taskId: task.id,
      title: task.title,
      startHour: time.hour,
      startMinute: time.minute,
      durationMinutes: 30, // Default 30 min
      color: unjynxPriorityColor(context, task.priority.name),
      priority: task.priority,
    );

    ref.read(timeBlocksProvider.notifier).set([...blocks, newBlock]);
  }

  void _onBlockDragUpdate(TimeBlock block, double newDy) {
    HapticFeedback.mediumImpact();
    final time = _snapToGrid(newDy);
    final blocks = ref.read(timeBlocksProvider);
    final updated = blocks.map((b) {
      if (b.id == block.id) {
        return b.copyWithTime(startHour: time.hour, startMinute: time.minute);
      }
      return b;
    }).toList();
    ref.read(timeBlocksProvider.notifier).set(updated);
  }

  void _removeBlock(String blockId) {
    final blocks = ref.read(timeBlocksProvider);
    ref.read(timeBlocksProvider.notifier).set(
      blocks.where((b) => b.id != blockId).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final date = ref.watch(timeBlockDateProvider);
    final blocks = ref.watch(timeBlocksProvider);
    final unscheduled = ref.watch(unscheduledTasksProvider);

    // Filter unscheduled: remove tasks that already have a block
    final scheduledIds = blocks.map((b) => b.taskId).toSet();
    final availableTasks =
        unscheduled.where((t) => !scheduledIds.contains(t.id)).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Time Blocking'),
        backgroundColor: colorScheme.surface,
        actions: [
          // Date display
          TextButton.icon(
            icon: const Icon(Icons.calendar_today, size: 16),
            label: Text(
              _formatDate(date),
              style: TextStyle(color: colorScheme.onSurfaceVariant),
            ),
            onPressed: () {
              HapticFeedback.lightImpact();
              _pickDate(context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Row(
        children: [
          // Left panel: unscheduled tasks
          _UnscheduledPanel(
            tasks: availableTasks,
          ),

          // Divider
          VerticalDivider(
            width: 1,
            color: colorScheme.surfaceContainerHigh,
          ),

          // Right panel: timeline
          Expanded(
            flex: 3,
            child: _TimelinePanel(
              controller: _timelineController,
              blocks: blocks,
              hourHeight: _hourHeight,
              totalHeight: _totalHeight,
              onTaskDropped: _onTaskDropped,
              onBlockDragUpdate: _onBlockDragUpdate,
              onBlockRemove: _removeBlock,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context) async {
    final current = ref.read(timeBlockDateProvider);
    final picked = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      ref.read(timeBlockDateProvider.notifier).set(picked);
    }
  }

  String _formatDate(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}';
  }
}

// =============================================================================
// Left Panel: Unscheduled Tasks
// =============================================================================

class _UnscheduledPanel extends StatelessWidget {
  const _UnscheduledPanel({
    required this.tasks,
  });

  final List<HomeTask> tasks;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SizedBox(
      width: 140,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
            child: Text(
              'UNSCHEDULED',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              '${tasks.length} tasks',
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Task list
          Expanded(
            child: tasks.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        'All tasks\nscheduled!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    itemCount: tasks.length,
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      return _DraggableTaskChip(
                        task: task,
                        color: unjynxPriorityColor(context, task.priority.name),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

/// Draggable chip for an unscheduled task.
class _DraggableTaskChip extends StatelessWidget {
  const _DraggableTaskChip({
    required this.task,
    required this.color,
  });

  final HomeTask task;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: LongPressDraggable<HomeTask>(
        data: task,
        delay: const Duration(milliseconds: 150),
        feedback: Material(
          elevation: 6,
          borderRadius: BorderRadius.circular(8),
          color: colorScheme.surfaceContainerHigh,
          child: Container(
            width: 160,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 4,
                  height: 24,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    task.title,
                    style: TextStyle(
                      fontSize: 13,
                      color: colorScheme.onSurface,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        childWhenDragging: Opacity(
          opacity: 0.3,
          child: _TaskChipBody(task: task, color: color),
        ),
        child: _TaskChipBody(task: task, color: color),
      ),
    );
  }
}

class _TaskChipBody extends StatelessWidget {
  const _TaskChipBody({required this.task, required this.color});

  final HomeTask task;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(color: color, width: 3),
        ),
      ),
      child: Text(
        task.title,
        style: TextStyle(
          fontSize: 12,
          color: colorScheme.onSurface,
        ),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

// =============================================================================
// Right Panel: 24h Timeline
// =============================================================================

class _TimelinePanel extends StatelessWidget {
  const _TimelinePanel({
    required this.controller,
    required this.blocks,
    required this.hourHeight,
    required this.totalHeight,
    required this.onTaskDropped,
    required this.onBlockDragUpdate,
    required this.onBlockRemove,
  });

  final ScrollController controller;
  final List<TimeBlock> blocks;
  final double hourHeight;
  final double totalHeight;
  final void Function(HomeTask task, double localDy) onTaskDropped;
  final void Function(TimeBlock block, double newDy) onBlockDragUpdate;
  final void Function(String blockId) onBlockRemove;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DragTarget<HomeTask>(
      onAcceptWithDetails: (details) {
        // Calculate local position within the scrollable timeline
        final renderBox = context.findRenderObject()! as RenderBox;
        final localPos = renderBox.globalToLocal(details.offset);
        final scrollOffset = controller.offset;
        onTaskDropped(details.data, localPos.dy + scrollOffset);
      },
      builder: (context, candidateData, rejectedData) {
        final isHovering = candidateData.isNotEmpty;
        return Container(
          color: isHovering
              ? colorScheme.primary.withValues(alpha: 0.05)
              : Colors.transparent,
          child: SingleChildScrollView(
            controller: controller,
            child: SizedBox(
              height: totalHeight,
              child: Stack(
                children: [
                  // Hour lines
                  for (int h = 0; h < 24; h++)
                    Positioned(
                      top: h * hourHeight,
                      left: 0,
                      right: 0,
                      child: _HourLine(hour: h),
                    ),

                  // Current time indicator
                  _CurrentTimeIndicator(hourHeight: hourHeight),

                  // Time blocks
                  for (final block in blocks)
                    Positioned(
                      top: block.topOffset,
                      left: 52,
                      right: 12,
                      height: block.height,
                      child: _TimeBlockWidget(
                        block: block,
                        onDragUpdate: onBlockDragUpdate,
                        onRemove: () => onBlockRemove(block.id),
                      ),
                    ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

// =============================================================================
// Hour Line
// =============================================================================

class _HourLine extends StatelessWidget {
  const _HourLine({required this.hour});

  final int hour;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final label = hour == 0
        ? '12 AM'
        : hour < 12
            ? '${hour} AM'
            : hour == 12
                ? '12 PM'
                : '${hour - 12} PM';

    return Row(
      children: [
        SizedBox(
          width: 48,
          child: Text(
            label,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 10,
              color: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Container(
            height: 0.5,
            color: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// Current Time Indicator
// =============================================================================

class _CurrentTimeIndicator extends StatelessWidget {
  const _CurrentTimeIndicator({required this.hourHeight});

  final double hourHeight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final now = DateTime.now();
    final top = (now.hour * 60 + now.minute) * (hourHeight / 60);

    return Positioned(
      top: top,
      left: 48,
      right: 0,
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: colorScheme.error,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(
            child: Container(
              height: 1.5,
              color: colorScheme.error.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Time Block Widget (on timeline)
// =============================================================================

class _TimeBlockWidget extends StatelessWidget {
  const _TimeBlockWidget({
    required this.block,
    required this.onDragUpdate,
    required this.onRemove,
  });

  final TimeBlock block;
  final void Function(TimeBlock block, double newDy) onDragUpdate;
  final VoidCallback onRemove;

  String _formatTime(int h, int m) {
    final period = h < 12 ? 'AM' : 'PM';
    final displayH = h == 0 ? 12 : (h > 12 ? h - 12 : h);
    final displayM = m.toString().padLeft(2, '0');
    return '$displayH:$displayM $period';
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final color = block.color ?? colorScheme.primary;
    final endMinute = block.startHour * 60 +
        block.startMinute +
        block.durationMinutes;
    final endH = (endMinute ~/ 60).clamp(0, 23);
    final endM = endMinute % 60;

    return GestureDetector(
      onLongPress: () {
        HapticFeedback.lightImpact();
        showModalBottomSheet<void>(
          context: context,
          backgroundColor: colorScheme.surface,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          builder: (ctx) => Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  block.title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${_formatTime(block.startHour, block.startMinute)} — '
                  '${_formatTime(endH, endM)}',
                  style: TextStyle(
                    fontSize: 14,
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      onRemove();
                      Navigator.of(ctx).pop();
                    },
                    icon: const Icon(Icons.delete_outline),
                    label: const Text('Remove Block'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: colorScheme.error,
                      foregroundColor: colorScheme.onError,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: color.withValues(alpha: 0.5),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              block.title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (block.durationMinutes >= 30)
              Text(
                '${_formatTime(block.startHour, block.startMinute)} — '
                '${_formatTime(endH, endM)}',
                style: TextStyle(
                  fontSize: 10,
                  color: color.withValues(alpha: 0.7),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
