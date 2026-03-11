import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/notification_providers.dart';
import '../widgets/escalation_chain_editor.dart';

/// J5 — Escalation Chain page.
///
/// Visual drag-and-drop reorder of fallback delivery channels.
/// Only connected channels appear. Each item shows the delay before next.
class EscalationChainPage extends ConsumerStatefulWidget {
  const EscalationChainPage({super.key});

  @override
  ConsumerState<EscalationChainPage> createState() =>
      _EscalationChainPageState();
}

class _EscalationChainPageState extends ConsumerState<EscalationChainPage> {
  late List<String> _chain;
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    _chain = List<String>.from(
      ref.read(preferencesProvider).fallbackChain,
    );
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final prefs = ref.watch(preferencesProvider);

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
                        'Escalation Chain',
                        style: textTheme.headlineMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                    if (_hasChanges)
                      TextButton(
                        onPressed: _saveChain,
                        child: Text(
                          'Save',
                          style: textTheme.titleMedium?.copyWith(
                            color: ux.gold,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  'Drag to reorder your fallback delivery chain. '
                  'Tap the delay to change how long to wait before escalating.',
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant
                        .withValues(alpha: isLight ? 0.7 : 0.55),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Reorderable chain
              Expanded(
                child: EscalationChainEditor(
                  chain: _chain,
                  delays: prefs.escalationDelays,
                  onReorder: _onReorder,
                  onDelayChanged: _onDelayChanged,
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
                      onPressed: _saveChain,
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
                        'Save Changes',
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

  void _onReorder(int oldIndex, int newIndex) {
    HapticFeedback.mediumImpact();
    setState(() {
      final adjustedNew = newIndex > oldIndex ? newIndex - 1 : newIndex;
      final item = _chain.removeAt(oldIndex);
      _chain.insert(adjustedNew, item);
      _hasChanges = true;
    });
    HapticFeedback.lightImpact();
  }

  void _onDelayChanged(String channelType, int minutes) {
    HapticFeedback.selectionClick();
    ref.read(preferencesProvider.notifier).updateEscalationDelay(
          channelType,
          minutes,
        );
    setState(() => _hasChanges = true);
  }

  Future<void> _saveChain() async {
    await ref.read(preferencesProvider.notifier).updateFallbackChain(_chain);
    if (mounted) {
      setState(() => _hasChanges = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Escalation chain saved'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }
}
