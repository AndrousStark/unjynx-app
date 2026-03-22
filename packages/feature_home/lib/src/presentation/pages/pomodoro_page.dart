import 'dart:async';

import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:feature_home/src/presentation/widgets/timer_ring.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

/// Pomodoro focus timer -- full-screen, immersive dark UI.
///
/// Features:
/// - Large circular timer ring (gold for work, vivid purple for break)
/// - MM:SS countdown in the centre
/// - Session label ("Pomodoro 1 of 4" or "Short Break" / "Long Break")
/// - Play / Pause + Reset controls
/// - Optional task label
/// - Session progress dots
/// - Vibration on session completion
/// - Completion dialog after all sessions
class PomodoroPage extends ConsumerStatefulWidget {
  const PomodoroPage({this.taskName, super.key});

  /// Optional task name to display beneath the timer.
  final String? taskName;

  @override
  ConsumerState<PomodoroPage> createState() => _PomodoroPageState();
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/// Timer phases.
enum _PomodoroPhase { idle, running, paused }

class _PomodoroPageState extends ConsumerState<PomodoroPage>
    with TickerProviderStateMixin {
  // --- Timer settings (from provider, copied once) -------------------------
  late int _workDuration;
  late int _shortBreak;
  late int _longBreak;
  late int _totalSessions;

  // --- Mutable session state ------------------------------------------------
  int _currentSession = 1;
  bool _isBreak = false;
  _PomodoroPhase _phase = _PomodoroPhase.idle;
  late int _remainingSeconds;
  Timer? _ticker;

  // --- Ring glow animation --------------------------------------------------
  late AnimationController _glowController;
  late Animation<double> _glowAnimation;

  // --- Completion pulse animation -------------------------------------------
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // --- Stats for the end-of-session dialog ----------------------------------
  int _completedSessions = 0;
  int _totalFocusSeconds = 0;

  @override
  void initState() {
    super.initState();

    final settings = ref.read(pomodoroSettingsProvider);
    _workDuration = settings.workMinutes * 60;
    _shortBreak = settings.shortBreakMinutes * 60;
    _longBreak = settings.longBreakMinutes * 60;
    _totalSessions = settings.sessionsBeforeLongBreak;
    _remainingSeconds = _workDuration;

    // Subtle pulsing glow around the ring while running.
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // Pulse on session complete.
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _pulseAnimation = Tween<double>(begin: 1, end: 1.12).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeOutBack),
    );
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _glowController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  // -----------------------------------------------------------------------
  // Timer logic
  // -----------------------------------------------------------------------

  int get _currentDuration {
    if (_isBreak) {
      return _currentSession > _totalSessions ? _longBreak : _shortBreak;
    }
    return _workDuration;
  }

  double get _progress {
    final total = _currentDuration;
    if (total == 0) return 0;
    return _remainingSeconds / total;
  }

  void _start() {
    if (_phase == _PomodoroPhase.running) return;

    setState(() => _phase = _PomodoroPhase.running);
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(seconds: 1), _onTick);
  }

  void _pause() {
    _ticker?.cancel();
    setState(() => _phase = _PomodoroPhase.paused);
  }

  void _reset() {
    _ticker?.cancel();
    setState(() {
      _phase = _PomodoroPhase.idle;
      _isBreak = false;
      _currentSession = 1;
      _completedSessions = 0;
      _totalFocusSeconds = 0;
      _remainingSeconds = _workDuration;
    });
  }

  void _onTick(Timer timer) {
    if (_remainingSeconds <= 1) {
      timer.cancel();
      _onSessionComplete();
      return;
    }

    setState(() {
      _remainingSeconds--;
      if (!_isBreak) {
        _totalFocusSeconds++;
      }
    });
  }

  Future<void> _onSessionComplete() async {
    // Count the last second of focus.
    if (!_isBreak) {
      _totalFocusSeconds++;
    }

    // Haptic feedback.
    await HapticFeedback.heavyImpact();

    // Pulse animation.
    await _pulseController.forward();
    _pulseController.reset();

    if (_isBreak) {
      // Break just ended -- start the next work session (or finish).
      if (_currentSession > _totalSessions) {
        _showCompletionDialog();
        return;
      }
      setState(() {
        _isBreak = false;
        _remainingSeconds = _workDuration;
        _phase = _PomodoroPhase.idle;
      });
    } else {
      // Work session just ended.
      _completedSessions++;

      if (_completedSessions >= _totalSessions) {
        // All work sessions done.
        _showCompletionDialog();
        return;
      }

      // Switch to break.
      final isLongBreak = _completedSessions % _totalSessions == 0;
      setState(() {
        _isBreak = true;
        _currentSession++;
        _remainingSeconds = isLongBreak ? _longBreak : _shortBreak;
        _phase = _PomodoroPhase.idle;
      });
    }
  }

  void _showCompletionDialog() {
    _ticker?.cancel();
    setState(() => _phase = _PomodoroPhase.idle);

    final focusMinutes = _totalFocusSeconds ~/ 60;

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => _CompletionDialog(
        sessionsCompleted: _completedSessions,
        focusMinutes: focusMinutes,
        onDone: () {
          Navigator.of(ctx).pop();
          _reset();
        },
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  String get _sessionLabel {
    if (_isBreak) {
      final isLong = _completedSessions % _totalSessions == 0 &&
          _completedSessions > 0;
      return isLong ? 'Long Break' : 'Short Break';
    }
    final pomodoroLabel = unjynxLabelWidget(ref, 'Pomodoro');
    return '$pomodoroLabel $_currentSession of $_totalSessions';
  }

  Color _ringColor(BuildContext context) {
    final ux = context.unjynx;
    // Break: emerald (success) on light, purple (primary) on dark.
    // Work: gold ring always.
    if (_isBreak) {
      return context.isLightMode ? ux.success : Theme.of(context).colorScheme.primary;
    }
    return ux.gold;
  }

  static String _formatTime(int totalSeconds) {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  // -----------------------------------------------------------------------
  // Build
  // -----------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isRunning = _phase == _PomodoroPhase.running;
    final ringColor = _ringColor(context);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isLight
                ? [const Color(0xFFF0EAFC), colorScheme.surface]
                : [ux.deepPurple, colorScheme.surfaceContainerLowest],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ---- Top bar (back + title) --------------------------------
              _buildTopBar(),

              const Spacer(),

              // ---- Timer ring + text -------------------------------------
              AnimatedBuilder(
                animation: _pulseAnimation,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _pulseAnimation.value,
                    child: child,
                  );
                },
                child: _buildTimerRing(isRunning, ringColor),
              ),

              const SizedBox(height: 24),

              // ---- Session label -----------------------------------------
              Text(
                _sessionLabel,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: colorScheme.onSurfaceVariant,
                  letterSpacing: 0.5,
                ),
              ),

              const SizedBox(height: 32),

              // ---- Controls row ------------------------------------------
              _buildControls(isRunning),

              const SizedBox(height: 24),

              // ---- Optional task label -----------------------------------
              if (widget.taskName != null && widget.taskName!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    'Working on: ${widget.taskName}',
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),

              const Spacer(),

              // ---- Session dots ------------------------------------------
              _buildSessionDots(),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // -----------------------------------------------------------------------
  // Sub-builders
  // -----------------------------------------------------------------------

  Widget _buildTopBar() {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () {
              _ticker?.cancel();
              if (context.mounted) context.pop();
            },
            icon: Icon(
              Icons.arrow_back_rounded,
              color: colorScheme.onSurfaceVariant,
            ),
            tooltip: 'Go back',
          ),
          Expanded(
            child: Text(
              unjynxLabelWidget(ref, 'Focus Timer'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
                letterSpacing: 0.3,
              ),
            ),
          ),
          // Spacer to balance the back button.
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildTimerRing(bool isRunning, Color ringColor) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLightMode = context.isLightMode;

    return AnimatedBuilder(
      animation: _glowAnimation,
      builder: (context, child) {
        final glowOpacity = isRunning
            ? _glowAnimation.value * (isLightMode ? 0.12 : 0.25)
            : 0.0;
        return Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              if (glowOpacity > 0)
                BoxShadow(
                  color: ringColor.withValues(alpha: glowOpacity),
                  blurRadius: 60,
                  spreadRadius: 20,
                ),
            ],
          ),
          child: child,
        );
      },
      child: TimerRing(
        progress: _progress,
        color: ringColor,
        size: 260,
        child: Text(
          _formatTime(_remainingSeconds),
          style: TextStyle(
            fontSize: 40,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }

  Widget _buildControls(bool isRunning) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Reset button (muted, small).
        _ControlButton(
          onTap: _reset,
          icon: Icons.refresh_rounded,
          size: 44,
          iconColor: colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
          backgroundColor: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        ),

        const SizedBox(width: 32),

        // Play / Pause button (gold, large).
        _ControlButton(
          onTap: isRunning ? _pause : _start,
          icon: isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded,
          size: 72,
          iconColor: colorScheme.surfaceContainerLowest,
          backgroundColor: ux.gold,
        ),

        const SizedBox(width: 32),

        // Skip button (muted, small) -- skips current session.
        _ControlButton(
          onTap: _phase != _PomodoroPhase.idle ? _skipSession : null,
          icon: Icons.skip_next_rounded,
          size: 44,
          iconColor: _phase != _PomodoroPhase.idle
              ? colorScheme.onSurfaceVariant.withValues(alpha: 0.6)
              : colorScheme.onSurfaceVariant.withValues(alpha: 0.2),
          backgroundColor: colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
        ),
      ],
    );
  }

  void _skipSession() {
    _ticker?.cancel();
    _onSessionComplete();
  }

  Widget _buildSessionDots() {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(_totalSessions, (i) {
        final isCompleted = i < _completedSessions;
        final isCurrent = i == _completedSessions && !_isBreak;
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: isCurrent ? 12 : 10,
            height: isCurrent ? 12 : 10,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isCompleted
                  ? ux.gold
                  : isCurrent
                      ? ux.gold.withValues(alpha: 0.4)
                      : colorScheme.surfaceContainerHigh,
              border: isCurrent
                  ? Border.all(
                      color: ux.gold.withValues(alpha: 0.7),
                      width: 1.5,
                    )
                  : null,
            ),
          ),
        );
      }),
    );
  }
}

// ---------------------------------------------------------------------------
// Control Button
// ---------------------------------------------------------------------------

class _ControlButton extends StatelessWidget {
  const _ControlButton({
    required this.icon,
    required this.size,
    required this.iconColor,
    required this.backgroundColor,
    this.onTap,
  });

  final VoidCallback? onTap;
  final IconData icon;
  final double size;
  final Color iconColor;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: backgroundColor,
          boxShadow: [
            if (size > 60)
              BoxShadow(
                color: backgroundColor.withValues(alpha: 0.3),
                blurRadius: 16,
                spreadRadius: 2,
              ),
          ],
        ),
        child: Icon(
          icon,
          size: size * 0.45,
          color: iconColor,
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Completion Dialog
// ---------------------------------------------------------------------------

class _CompletionDialog extends StatelessWidget {
  const _CompletionDialog({
    required this.sessionsCompleted,
    required this.focusMinutes,
    required this.onDone,
  });

  final int sessionsCompleted;
  final int focusMinutes;
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Dialog(
      backgroundColor: colorScheme.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Trophy icon.
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: ux.gold.withValues(alpha: 0.15),
              ),
              child: Icon(
                Icons.emoji_events_rounded,
                size: 40,
                color: ux.gold,
              ),
            ),

            const SizedBox(height: 24),

            Text(
              'Great focus session!',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: colorScheme.onSurface,
                letterSpacing: -0.3,
              ),
            ),

            const SizedBox(height: 16),

            // Stats row.
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _StatChip(
                  label: 'Sessions',
                  value: '$sessionsCompleted',
                ),
                _StatChip(
                  label: 'Focus',
                  value: '${focusMinutes}m',
                ),
              ],
            ),

            const SizedBox(height: 28),

            // Done button.
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onDone,
                style: ElevatedButton.styleFrom(
                  backgroundColor: ux.gold,
                  foregroundColor: colorScheme.surfaceContainerLowest,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'Done',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Stat Chip (used inside the completion dialog)
// ---------------------------------------------------------------------------

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: ux.gold,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}
