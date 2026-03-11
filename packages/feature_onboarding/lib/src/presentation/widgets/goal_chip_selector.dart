import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/personalization_state.dart';
import '../providers/personalization_providers.dart';

/// Multi-select goal chips rendered in a Wrap layout.
///
/// Tap to toggle. Selected chips bounce with gold fill,
/// unselected chips show an outline.
class GoalChipSelector extends ConsumerWidget {
  const GoalChipSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedGoals = ref.watch(
      personalizationStateProvider.select((s) => s.goals),
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: goalOptions.map((option) {
          final isSelected = selectedGoals.contains(option.id);
          return _GoalChip(
            option: option,
            isSelected: isSelected,
            onTap: () => ref
                .read(personalizationStateProvider.notifier)
                .toggleGoal(option.id),
          );
        }).toList(),
      ),
    );
  }
}

class _GoalChip extends StatefulWidget {
  const _GoalChip({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final GoalOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  State<_GoalChip> createState() => _GoalChipState();
}

class _GoalChipState extends State<_GoalChip>
    with SingleTickerProviderStateMixin {
  late final AnimationController _bounceController;
  late final Animation<double> _bounceAnimation;

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _bounceAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 1.08)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.08, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 50,
      ),
    ]).animate(_bounceController);
  }

  @override
  void didUpdateWidget(_GoalChip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _bounceController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _bounceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final isSelected = widget.isSelected;

    return ScaleTransition(
      scale: _bounceAnimation,
      child: GestureDetector(
        onTap: () {
          HapticFeedback.selectionClick();
          widget.onTap();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            color: isSelected
                ? ux.gold
                : Colors.transparent,
            border: Border.all(
              color: isSelected
                  ? ux.gold
                  : colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.25 : 0.2),
              width: isSelected ? 1.5 : 1.0,
            ),
            boxShadow: [
              if (isSelected && isLight)
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              if (isSelected && !isLight)
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.15),
                  blurRadius: 10,
                  spreadRadius: 1,
                ),
            ],
          ),
          child: Text(
            widget.option.label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              color: isSelected
                  ? (isLight
                      ? const Color(0xFF1A0533)
                      : Colors.black)
                  : colorScheme.onSurfaceVariant
                      .withValues(alpha: isLight ? 0.8 : 0.7),
            ),
          ),
        ),
      ),
    );
  }
}
