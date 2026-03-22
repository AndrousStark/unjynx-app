import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/chat_message.dart';
import '../providers/ai_providers.dart';

/// Horizontal chip selector for AI personas.
///
/// Uses [PressableScale] + haptics for each chip. Selected persona
/// gets gold highlight, others use surface color.
class PersonaSelector extends ConsumerWidget {
  const PersonaSelector({super.key});

  static const _personaIcons = <AiPersona, IconData>{
    AiPersona.defaultPersona: Icons.bolt_rounded,
    AiPersona.drillSergeant: Icons.military_tech_rounded,
    AiPersona.therapist: Icons.favorite_rounded,
    AiPersona.ceo: Icons.business_center_rounded,
    AiPersona.coach: Icons.sports_rounded,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(selectedPersonaProvider);
    final theme = Theme.of(context);
    final isLight = theme.brightness == Brightness.light;
    final unjynx = theme.extension<UnjynxCustomColors>()!;

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: AiPersona.values.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final persona = AiPersona.values[index];
          final isSelected = persona == selected;
          final icon = _personaIcons[persona] ?? Icons.bolt_rounded;

          return PressableScale(
            onTap: () {
              UnjynxHaptics.selectionClick();
              ref.read(selectedPersonaProvider.notifier).select(persona);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected
                    ? (isLight ? unjynx.goldWash : const Color(0xFF2A2010))
                    : (isLight
                        ? const Color(0xFFF0EAFC)
                        : const Color(0xFF1D1530)),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isSelected
                      ? unjynx.gold.withValues(alpha: 0.5)
                      : Colors.transparent,
                  width: 1.5,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: 16,
                    color: isSelected
                        ? unjynx.gold
                        : (isLight
                            ? UnjynxLightColors.textSecondary
                            : UnjynxDarkColors.textSecondary),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    persona.displayName,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: isSelected
                          ? unjynx.gold
                          : (isLight
                              ? UnjynxLightColors.textSecondary
                              : UnjynxDarkColors.textSecondary),
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
