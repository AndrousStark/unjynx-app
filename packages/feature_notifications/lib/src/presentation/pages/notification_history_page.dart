import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:unjynx_core/core.dart';

import '../providers/notification_providers.dart';
import '../widgets/delivery_log_tile.dart';

/// J4 — Notification History page.
///
/// ListView of recent delivery attempts with filter chips for status
/// (All, Delivered, Failed, Pending) and pull-to-refresh.
class NotificationHistoryPage extends ConsumerStatefulWidget {
  const NotificationHistoryPage({super.key});

  @override
  ConsumerState<NotificationHistoryPage> createState() =>
      _NotificationHistoryPageState();
}

class _NotificationHistoryPageState
    extends ConsumerState<NotificationHistoryPage> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final historyAsync = ref.watch(historyProvider);
    final allHistory = historyAsync.value ?? [];
    final filteredHistory = _applyFilter(allHistory);

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
                padding: const EdgeInsets.fromLTRB(8, 8, 24, 0),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () =>
                          GoRouter.of(context).go('/notifications'),
                      icon: Icon(
                        Icons.arrow_back_rounded,
                        color: colorScheme.onSurface,
                      ),
                      tooltip: 'Go back',
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        'Delivery History',
                        style: textTheme.headlineMedium?.copyWith(
                          color: colorScheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Filter chips
              SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  children: [
                    _FilterChip(
                      label: 'All',
                      isSelected: _filter == 'all',
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _filter = 'all');
                      },
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Delivered',
                      isSelected: _filter == 'delivered',
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _filter = 'delivered');
                      },
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Failed',
                      isSelected: _filter == 'failed',
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _filter = 'failed');
                      },
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Pending',
                      isSelected: _filter == 'pending',
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _filter = 'pending');
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // History list
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () async {
                    await ref.read(historyProvider.notifier).refresh();
                  },
                  color: ux.gold,
                  child: filteredHistory.isEmpty
                      ? SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: _EmptyHistoryState(isLight: isLight),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          itemCount: filteredHistory.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 6),
                          itemBuilder: (context, index) {
                            // Show newest first
                            final entry = filteredHistory[
                                filteredHistory.length - 1 - index];
                            return DeliveryLogTile(entry: entry);
                          },
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _applyFilter(
    List<Map<String, dynamic>> history,
  ) {
    if (_filter == 'all') return history;
    return history.where((e) => e['status'] == _filter).toList();
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ux = context.unjynx;
    final isLight = context.isLightMode;
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 44,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(22),
          color: isSelected
              ? ux.gold.withValues(alpha: isLight ? 0.15 : 0.2)
              : isLight
                  ? Colors.white.withValues(alpha: 0.6)
                  : colorScheme.surfaceContainer.withValues(alpha: 0.3),
          border: Border.all(
            color: isSelected
                ? ux.gold.withValues(alpha: isLight ? 0.5 : 0.4)
                : colorScheme.outlineVariant.withValues(alpha: 0.3),
            width: isSelected ? 1.5 : 0.5,
          ),
        ),
        child: Text(
          label,
          style: textTheme.labelMedium?.copyWith(
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected
                ? isLight
                    ? ux.darkGold
                    : ux.gold
                : colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.7 : 0.6),
          ),
        ),
      ),
    );
  }
}

class _EmptyHistoryState extends StatelessWidget {
  const _EmptyHistoryState({required this.isLight});

  final bool isLight;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.inbox_rounded,
              size: 64,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.3 : 0.2),
            ),
            const SizedBox(height: 16),
            Text(
              'No delivery history yet',
              style: textTheme.headlineSmall?.copyWith(
                color: colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Send a test notification to see delivery logs here',
              textAlign: TextAlign.center,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant
                    .withValues(alpha: isLight ? 0.6 : 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
