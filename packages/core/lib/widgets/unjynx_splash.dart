import 'package:flutter/material.dart';

import '../theme/unjynx_colors.dart';

/// Branded splash screen shown while auth state resolves on cold start.
///
/// Displays the UNJYNX wordmark with a pulsing gold glow animation
/// on the brand midnight-purple background.
class UnjynxSplash extends StatefulWidget {
  const UnjynxSplash({super.key});

  @override
  State<UnjynxSplash> createState() => _UnjynxSplashState();
}

class _UnjynxSplashState extends State<UnjynxSplash>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _pulse;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _pulse = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final bgColor = isLight
        ? UnjynxLightColors.background
        : UnjynxDarkColors.background;
    final goldColor = isLight
        ? UnjynxLightColors.richGold
        : UnjynxDarkColors.electricGold;
    final violetColor = isLight
        ? UnjynxLightColors.brandViolet
        : UnjynxDarkColors.brandViolet;
    final textColor = isLight
        ? UnjynxLightColors.midnightPurple
        : Colors.white;

    return Scaffold(
      backgroundColor: bgColor,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Logo icon with pulsing gold glow
            AnimatedBuilder(
              animation: _pulse,
              builder: (context, child) => Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [violetColor, goldColor],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: goldColor.withValues(alpha: 0.3 * _pulse.value),
                      blurRadius: 24 * _pulse.value,
                      spreadRadius: 4 * _pulse.value,
                    ),
                  ],
                ),
                child: Icon(
                  Icons.bolt_rounded,
                  size: 40,
                  color: isLight ? Colors.white : UnjynxDarkColors.background,
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Brand name
            Text(
              'UNJYNX',
              style: TextStyle(
                fontFamily: 'BebasNeue',
                fontSize: 36,
                fontWeight: FontWeight.bold,
                letterSpacing: 8,
                color: textColor,
              ),
            ),
            const SizedBox(height: 8),
            // Tagline
            Text(
              'Break the satisfactory.',
              style: TextStyle(
                fontFamily: 'DMSans',
                fontSize: 14,
                color: textColor.withValues(alpha: 0.6),
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 48),
            // Loading indicator
            SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation<Color>(goldColor),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
