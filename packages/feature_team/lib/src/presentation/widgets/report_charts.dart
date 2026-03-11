import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/team_report.dart';

/// Reusable card wrapper for report charts with purple-tinted shadows.
class ChartCard extends StatelessWidget {
  const ChartCard({required this.title, required this.child, super.key});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: isLight
            ? Border.all(
                color: colorScheme.primary.withValues(alpha: 0.1),
              )
            : null,
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: const Color(0xFF1A0533).withValues(alpha: 0.04),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ]
            : null,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: textTheme.labelMedium?.copyWith(
                letterSpacing: 1,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

/// Empty state placeholder for charts.
class EmptyChart extends StatelessWidget {
  const EmptyChart({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return SizedBox(
      height: 80,
      child: Center(
        child: Text(
          message,
          style: textTheme.bodyMedium?.copyWith(
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

/// Placeholder sine-wave productivity chart.
class ProductivityChart extends StatelessWidget {
  const ProductivityChart({required this.completionRate, super.key});

  final double completionRate;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return SizedBox(
      height: 120,
      child: CustomPaint(
        size: const Size(double.infinity, 120),
        painter: _SimpleLinePainter(
          value: completionRate,
          lineColor: colorScheme.primary,
          fillColor: colorScheme.primary.withValues(
            alpha: isLight ? 0.08 : 0.1,
          ),
        ),
      ),
    );
  }
}

class _SimpleLinePainter extends CustomPainter {
  _SimpleLinePainter({
    required this.value,
    required this.lineColor,
    required this.fillColor,
  });

  final double value;
  final Color lineColor;
  final Color fillColor;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    for (var x = 0.0; x <= size.width; x += 2) {
      final progress = x / size.width;
      final y = size.height * 0.5 -
          (math.sin(progress * math.pi * 2 + value * math.pi) *
              size.height *
              0.3);
      if (x == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, paint);

    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(fillPath, Paint()..color = fillColor);
  }

  @override
  bool shouldRepaint(_SimpleLinePainter old) => value != old.value;
}

/// Horizontal bar chart for member contributions.
class ContributionBars extends StatelessWidget {
  const ContributionBars({required this.members, super.key});

  final List<MemberStat> members;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;
    final maxCompleted = members.fold<int>(
      1,
      (max, m) => m.tasksCompleted > max ? m.tasksCompleted : max,
    );

    return Column(
      children: members.map((m) {
        final fraction = m.tasksCompleted / maxCompleted;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              SizedBox(
                width: 80,
                child: Text(
                  m.name,
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
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: fraction,
                    backgroundColor: colorScheme.surfaceContainerHigh
                        .withValues(alpha: isLight ? 0.5 : 0.3),
                    valueColor: AlwaysStoppedAnimation(colorScheme.primary),
                    minHeight: 16,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${m.tasksCompleted}',
                style: textTheme.displaySmall?.copyWith(
                  fontSize: 13,
                  color: colorScheme.onSurface,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

/// Completion rates for projects.
class ProjectCompletionList extends StatelessWidget {
  const ProjectCompletionList({required this.projects, super.key});

  final List<ProjectStat> projects;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Column(
      children: projects.map((p) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  p.name,
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 100,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(3),
                  child: LinearProgressIndicator(
                    value: p.completionRate,
                    backgroundColor: colorScheme.surfaceContainerHigh
                        .withValues(alpha: isLight ? 0.5 : 0.3),
                    valueColor: AlwaysStoppedAnimation(ux.success),
                    minHeight: 8,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${p.completedTasks}/${p.totalTasks}',
                style: textTheme.displaySmall?.copyWith(
                  fontSize: 13,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

/// Overdue tasks by assignee.
class OverdueList extends StatelessWidget {
  const OverdueList({required this.members, super.key});

  final List<MemberStat> members;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final overdueMembers = members.where((m) => m.tasksOverdue > 0).toList();

    if (overdueMembers.isEmpty) {
      return const EmptyChart(message: 'No overdue tasks');
    }

    return Column(
      children: overdueMembers.map((m) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  m.name,
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(100),
                  color: ux.warning.withValues(alpha: 0.15),
                ),
                child: Text(
                  '${m.tasksOverdue} overdue',
                  style: textTheme.labelMedium?.copyWith(
                    color: ux.warning,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
