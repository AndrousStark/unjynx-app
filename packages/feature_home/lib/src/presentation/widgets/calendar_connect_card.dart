import 'package:feature_home/src/presentation/providers/home_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:unjynx_core/core.dart';

/// A compact card prompting the user to connect their Google Calendar,
/// or showing the connected state with a disconnect option.
///
/// Uses the [calendarConnectedProvider] to determine current state and
/// the [connectCalendarCallbackProvider] / [disconnectCalendarCallbackProvider]
/// to trigger actions.
class CalendarConnectCard extends ConsumerStatefulWidget {
  const CalendarConnectCard({super.key});

  @override
  ConsumerState<CalendarConnectCard> createState() =>
      _CalendarConnectCardState();
}

class _CalendarConnectCardState extends ConsumerState<CalendarConnectCard> {
  bool _isLoading = false;

  Future<void> _handleConnect() async {
    if (_isLoading) return;
    HapticFeedback.mediumImpact();

    setState(() => _isLoading = true);

    try {
      final connect = ref.read(connectCalendarCallbackProvider);
      final success = await connect();

      if (mounted) {
        if (success) {
          ref.invalidate(calendarConnectedProvider);
          // Invalidate ghost events for the visible month range.
          HapticFeedback.lightImpact();
        }
        setState(() => _isLoading = false);
      }
    } on Exception {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleDisconnect() async {
    if (_isLoading) return;
    HapticFeedback.mediumImpact();

    setState(() => _isLoading = true);

    try {
      final disconnect = ref.read(disconnectCalendarCallbackProvider);
      await disconnect();

      if (mounted) {
        ref.invalidate(calendarConnectedProvider);
        setState(() => _isLoading = false);
      }
    } on Exception {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectedAsync = ref.watch(calendarConnectedProvider);

    return connectedAsync.when(
      data: (connected) =>
          connected ? _buildConnectedState(context) : _buildDisconnectedState(context),
      loading: () => const SizedBox.shrink(),
      error: (_, __) => _buildDisconnectedState(context),
    );
  }

  Widget _buildDisconnectedState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return GestureDetector(
      onTap: _isLoading ? null : _handleConnect,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isLight
              ? ux.info.withValues(alpha: 0.06)
              : ux.info.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: ux.info.withValues(alpha: isLight ? 0.15 : 0.2),
          ),
        ),
        child: Row(
          children: [
            // Google Calendar icon
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isLight ? Colors.white : colorScheme.surfaceContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.calendar_month_rounded,
                size: 20,
                color: ux.info,
              ),
            ),
            const SizedBox(width: 12),

            // Text
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Connect Google Calendar',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'See your events alongside tasks',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),

            // Loading or arrow
            if (_isLoading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: ux.info,
                ),
              )
            else
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: colorScheme.onSurfaceVariant,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectedState(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isLight
            ? ux.success.withValues(alpha: 0.06)
            : ux.success.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: ux.success.withValues(alpha: isLight ? 0.15 : 0.2),
        ),
      ),
      child: Row(
        children: [
          // Connected icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isLight ? Colors.white : colorScheme.surfaceContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.check_circle_rounded,
              size: 20,
              color: ux.success,
            ),
          ),
          const SizedBox(width: 12),

          // Text
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Google Calendar',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Connected',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: ux.success,
                  ),
                ),
              ],
            ),
          ),

          // Disconnect button
          if (_isLoading)
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: colorScheme.error,
              ),
            )
          else
            GestureDetector(
              onTap: _handleDisconnect,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: colorScheme.error.withValues(alpha: 0.3),
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  'Disconnect',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.error,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
