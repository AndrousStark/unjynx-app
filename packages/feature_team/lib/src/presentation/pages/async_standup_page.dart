import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

import '../../domain/models/standup_entry.dart';
import '../providers/team_providers.dart';
import '../widgets/standup_card.dart';

/// N5 -- Async Standup page.
///
/// Auto-filled from task activity (done yesterday, planned today).
/// Manual blockers entry, delivery channel selector, and standup history.
///
/// Shows an empty state when no team exists.
class AsyncStandupPage extends ConsumerStatefulWidget {
  const AsyncStandupPage({super.key});

  @override
  ConsumerState<AsyncStandupPage> createState() => _AsyncStandupPageState();
}

class _AsyncStandupPageState extends ConsumerState<AsyncStandupPage> {
  final _doneController = TextEditingController();
  final _plannedController = TextEditingController();
  final _blockerController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _doneController.dispose();
    _plannedController.dispose();
    _blockerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final team = ref.watch(currentTeamValueProvider);
    final standupChannel = ref.watch(standupChannelProvider);
    final standups = ref.watch(standupProvider).value ?? [];

    // No team state
    if (team == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Async Standup')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: colorScheme.primary.withValues(
                      alpha: isLight ? 0.1 : 0.12,
                    ),
                  ),
                  child: Icon(
                    Icons.forum_outlined,
                    size: 40,
                    color: colorScheme.primary.withValues(
                      alpha: isLight ? 0.6 : 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'No team found',
                  style: textTheme.titleMedium?.copyWith(
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Create a team to use async standups and keep your team in sync.',
                  textAlign: TextAlign.center,
                  style: textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Async Standup')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(standupProvider);
        },
        color: colorScheme.primary,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Auto-fill notice
            Container(
              decoration: BoxDecoration(
                color: ux.infoWash,
                borderRadius: BorderRadius.circular(16),
                border: isLight
                    ? Border.all(color: ux.info.withValues(alpha: 0.2))
                    : null,
              ),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Icon(Icons.auto_awesome_rounded, size: 18, color: ux.info),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Tasks completed yesterday and planned today '
                        'are auto-filled from your activity.',
                        style: textTheme.bodySmall?.copyWith(
                          fontSize: 13,
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Done yesterday
            _SectionHeader(
              label: 'Done Yesterday',
              icon: Icons.check_circle_outline_rounded,
              color: ux.success,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _doneController,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
              maxLines: 3,
              minLines: 2,
              decoration: _inputDecoration(
                context,
                'What did you complete? (one per line)',
              ),
            ),
            const SizedBox(height: 16),

            // Planned today
            _SectionHeader(
              label: 'Planned Today',
              icon: Icons.schedule_rounded,
              color: colorScheme.primary,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _plannedController,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
              maxLines: 3,
              minLines: 2,
              decoration: _inputDecoration(
                context,
                'What do you plan to work on? (one per line)',
              ),
            ),
            const SizedBox(height: 16),

            // Blockers
            _SectionHeader(
              label: 'Blockers',
              icon: Icons.warning_amber_rounded,
              color: ux.warning,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _blockerController,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface,
              ),
              maxLines: 3,
              minLines: 2,
              decoration: _inputDecoration(
                context,
                'Any blockers? (one per line, optional)',
              ),
            ),
            const SizedBox(height: 20),

            // Delivery channel selector
            Text(
              'Deliver via',
              style: textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final channel in _deliveryChannels)
                  ChoiceChip(
                    label: Text(channel.label),
                    avatar: Icon(channel.icon, size: 16),
                    selected: standupChannel == channel.id,
                    onSelected: (_) {
                      HapticFeedback.selectionClick();
                      ref.read(standupChannelProvider.notifier).set(channel.id);
                    },
                  ),
              ],
            ),
            const SizedBox(height: 20),

            // Submit button
            ElevatedButton.icon(
              onPressed: _isSubmitting ? null : _submit,
              icon: _isSubmitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded),
              label: const Text('Submit Standup'),
            ),
            const SizedBox(height: 28),

            // History
            if (standups.isNotEmpty) ...[
              Text(
                'PREVIOUS STANDUPS',
                style: textTheme.labelMedium?.copyWith(
                  letterSpacing: 1,
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 12),
              ...standups.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: StandupCard(entry: entry),
                ),
              ),
            ],

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(BuildContext context, String hint) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final isLight = context.isLightMode;

    return InputDecoration(
      hintText: hint,
      hintStyle: textTheme.bodySmall?.copyWith(
        color: colorScheme.onSurfaceVariant.withValues(
          alpha: isLight ? 0.6 : 0.5,
        ),
      ),
      filled: true,
      fillColor: isLight
          ? colorScheme.surfaceContainerHigh.withValues(alpha: 0.4)
          : colorScheme.surfaceContainer,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
      contentPadding: const EdgeInsets.all(14),
    );
  }

  Future<void> _submit() async {
    final done = _parseLines(_doneController.text);
    final planned = _parseLines(_plannedController.text);
    final blockers = _parseLines(_blockerController.text);

    if (done.isEmpty && planned.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill in at least one section'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.mediumImpact();

    try {
      final entry = StandupEntry(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: 'current-user',
        name: 'You',
        doneYesterday: done,
        plannedToday: planned,
        blockers: blockers,
        submittedAt: DateTime.now(),
      );

      await ref.read(standupProvider.notifier).submitStandup(entry);

      _doneController.clear();
      _plannedController.clear();
      _blockerController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Standup submitted!'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit standup: $e'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  static List<String> _parseLines(String text) {
    return text
        .split('\n')
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.label,
    required this.icon,
    required this.color,
  });

  final String label;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Text(
          label,
          style: textTheme.titleMedium?.copyWith(
            fontSize: 15,
            color: color,
          ),
        ),
      ],
    );
  }
}

class _DeliveryChannel {
  const _DeliveryChannel(this.id, this.label, this.icon);
  final String id;
  final String label;
  final IconData icon;
}

const _deliveryChannels = [
  _DeliveryChannel('slack', 'Slack', Icons.tag),
  _DeliveryChannel('discord', 'Discord', Icons.discord),
  _DeliveryChannel('telegram', 'Telegram', Icons.send_rounded),
  _DeliveryChannel('email', 'Email', Icons.email_outlined),
];
