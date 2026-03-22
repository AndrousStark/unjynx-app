import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:unjynx_core/contracts/auth_port.dart';
import 'package:unjynx_core/core.dart';

/// Header widget with avatar, name, and email.
class ProfileHeader extends StatelessWidget {
  const ProfileHeader({required this.user, super.key});

  final AuthUser? user;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final ux = context.unjynx;
    final isLight = context.isLightMode;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          // Light: white to lavender (editorial paper feel)
          // Dark: deep purple to midnight (immersive depth)
          colors: isLight
              ? [Colors.white, const Color(0xFFF0EAFC)]
              : [ux.deepPurple, colorScheme.surfaceContainerLowest],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
      child: Column(
        children: [
          // Avatar with brightness-adaptive ring
          Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              // Light: purple-tinted shadow for depth
              // Dark: no shadow (glow-based design)
              boxShadow: isLight
                  ? [
                      BoxShadow(
                        color: const Color(0xFF1A0533)
                            .withValues(alpha: 0.12),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: CircleAvatar(
              radius: 40,
              // Light: higher opacity ring (needs to stand out on light bg)
              // Dark: lower opacity ring (subtle glow on dark bg)
              backgroundColor: colorScheme.primary
                  .withValues(alpha: isLight ? 0.15 : 0.3),
              backgroundImage: _avatarImage,
              child: user?.avatarUrl == null
                  ? Text(
                      _initials,
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        // Light: full opacity rich gold (#B8860B looks rich)
                        // Dark: 80% opacity electric gold (tame the glow)
                        color: isLight
                            ? ux.gold
                            : ux.gold.withValues(alpha: 0.8),
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 16),

          // Name
          Text(
            user?.name ?? 'UNJYNX User',
            style: TextStyle(
              fontSize: 22,
              fontWeight: isLight ? FontWeight.w700 : FontWeight.bold,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),

          // Email
          if (user?.email != null)
            Text(
              user!.email!,
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }

  /// Cached network image for the avatar, or null for initials fallback.
  ImageProvider? get _avatarImage {
    final url = user?.avatarUrl;
    if (url == null || url.isEmpty) return null;
    return CachedNetworkImageProvider(url);
  }

  String get _initials {
    final name = user?.name ?? '';
    if (name.isEmpty) return 'U';

    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts[1][0]}'.toUpperCase();
    }
    return parts.first[0].toUpperCase();
  }
}
