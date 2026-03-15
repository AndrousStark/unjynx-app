import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/personalization_state.dart';
import '../providers/personalization_providers.dart';

/// 2-column grid of identity cards for the personalization flow.
///
/// Single-select: tapping the already-selected card deselects it.
class IdentitySelector extends ConsumerWidget {
  const IdentitySelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedId = ref.watch(
      personalizationStateProvider.select((s) => s.identity),
    );

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.4,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: identityOptions.map((option) {
        final isSelected = selectedId == option.id;
        return _IdentityCard(
          option: option,
          isSelected: isSelected,
          onTap: () => ref
              .read(personalizationStateProvider.notifier)
              .selectIdentity(option.id),
        );
      }).toList(),
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({
    required this.option,
    required this.isSelected,
    required this.onTap,
  });

  final IdentityOption option;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedScale(
        scale: isSelected ? 1.05 : 1.0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutBack,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            color: isLight
                ? Colors.white
                : colorScheme.surfaceContainer,
            border: Border.all(
              color: isSelected
                  ? ux.gold
                  : isLight
                      ? colorScheme.outlineVariant
                      : ux.glassBorder,
              width: isSelected ? 2.0 : 1.0,
            ),
            boxShadow: [
              if (isLight)
                BoxShadow(
                  color: isSelected
                      ? ux.gold.withValues(alpha: 0.15)
                      : const Color(0xFF1A0533).withValues(alpha: 0.06),
                  blurRadius: isSelected ? 16 : 8,
                  offset: const Offset(0, 4),
                )
              else if (isSelected)
                BoxShadow(
                  color: ux.gold.withValues(alpha: 0.2),
                  blurRadius: 16,
                  spreadRadius: 1,
                ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                option.icon,
                size: 32,
                color: isSelected
                    ? ux.gold
                    : colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.7 : 0.6),
              ),
              const SizedBox(height: 8),
              Text(
                option.label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight:
                      isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected
                      ? colorScheme.onSurface
                      : colorScheme.onSurfaceVariant
                          .withValues(alpha: isLight ? 0.8 : 0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
