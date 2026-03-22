import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// Retention Hook #9: Social Proof.
///
/// Shows a subtle "X people being productive right now" counter at the
/// bottom of the home page. During alpha, uses an animated simulated count
/// (fluctuates between a base and base+variance). In production, this will
/// be replaced with a real-time counter from the backend.
///
/// Deliberately understated: small text, muted color, no flashy animations.
/// The goal is ambient social presence, not pressure.
class SocialProofCounter extends StatefulWidget {
  const SocialProofCounter({super.key});

  @override
  State<SocialProofCounter> createState() => _SocialProofCounterState();
}

class _SocialProofCounterState extends State<SocialProofCounter> {
  late int _activeCount;
  final _random = math.Random();

  // Simulated base count. In production, fetched from backend.
  static const _baseCount = 1847;
  static const _variance = 500;

  @override
  void initState() {
    super.initState();
    _activeCount = _baseCount + _random.nextInt(_variance);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Pulsing green dot.
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: ux.success.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(width: 6),

          Text(
            '${_formatCount(_activeCount)} people being productive right now',
            style: TextStyle(
              fontSize: 11,
              color: colorScheme.onSurfaceVariant.withValues(
                alpha: isLight ? 0.5 : 0.4,
              ),
              letterSpacing: 0.1,
            ),
          ),
        ],
      ),
    );
  }

  /// Formats a number with comma separators.
  static String _formatCount(int count) {
    if (count < 1000) return '$count';
    final thousands = count ~/ 1000;
    final remainder = count % 1000;
    return '$thousands,${remainder.toString().padLeft(3, '0')}';
  }
}
