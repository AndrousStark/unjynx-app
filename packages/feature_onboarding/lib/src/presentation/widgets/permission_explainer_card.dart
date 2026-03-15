import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

/// A card explaining why notification permissions matter.
///
/// Enters with a fade-up + scale animation (0.9 -> 1.0, 400ms easeOut)
/// and features a gently swinging bell icon (2s sine loop).
class PermissionExplainerCard extends StatefulWidget {
  const PermissionExplainerCard({super.key});

  @override
  State<PermissionExplainerCard> createState() =>
      _PermissionExplainerCardState();
}

class _PermissionExplainerCardState extends State<PermissionExplainerCard>
    with TickerProviderStateMixin {
  late final AnimationController _entryController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _scaleAnimation;

  late final AnimationController _bellController;

  @override
  void initState() {
    super.initState();

    // Entry: fade + slide-up + scale
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _entryController,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.08),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _entryController,
      curve: Curves.easeOut,
    ));
    _scaleAnimation = Tween<double>(begin: 0.9, end: 1.0).animate(
      CurvedAnimation(parent: _entryController, curve: Curves.easeOut),
    );
    _entryController.forward();

    // Bell swing: gentle rotation loop
    _bellController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _entryController.dispose();
    _bellController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: ScaleTransition(
          scale: _scaleAnimation,
          child: UnjynxGlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Swinging bell icon
                AnimatedBuilder(
                  animation: _bellController,
                  builder: (context, child) {
                    final angle = math.sin(
                          _bellController.value * 2 * math.pi,
                        ) *
                        0.15; // ~8.6 degrees max swing
                    return Transform.rotate(angle: angle, child: child);
                  },
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: ux.gold.withValues(
                        alpha: isLight ? 0.10 : 0.15,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isLight
                              ? const Color(0xFF1A0533)
                                  .withValues(alpha: 0.08)
                              : ux.gold.withValues(alpha: 0.20),
                          blurRadius: isLight ? 16 : 28,
                          spreadRadius: isLight ? 1 : 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.notifications_active_rounded,
                      size: 36,
                      color: ux.gold,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Title
                Text(
                  'Stay on track, never miss a thing',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: isLight ? FontWeight.w800 : FontWeight.bold,
                    color: colorScheme.onSurface,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 20),

                // Benefits list
                _BenefitRow(
                  icon: Icons.check_circle_rounded,
                  iconColor: ux.gold,
                  text: 'Never miss a deadline again',
                ),
                const SizedBox(height: 12),
                _BenefitRow(
                  icon: Icons.notifications_rounded,
                  iconColor: colorScheme.primary,
                  text: 'Get reminded on your favorite channels',
                ),
                const SizedBox(height: 12),
                _BenefitRow(
                  icon: Icons.settings_rounded,
                  iconColor: isLight
                      ? colorScheme.onSurfaceVariant
                      : colorScheme.onSurfaceVariant.withValues(alpha: 0.8),
                  text: 'You control everything in Settings',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Benefit row
// ---------------------------------------------------------------------------

class _BenefitRow extends StatelessWidget {
  const _BenefitRow({
    required this.icon,
    required this.iconColor,
    required this.text,
  });

  final IconData icon;
  final Color iconColor;
  final String text;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isLight = context.isLightMode;

    return Row(
      children: [
        Icon(icon, size: 22, color: iconColor),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 15,
              color: colorScheme.onSurfaceVariant
                  .withValues(alpha: isLight ? 0.85 : 0.70),
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }
}
