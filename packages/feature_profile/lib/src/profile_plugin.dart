import 'package:flutter/material.dart';
import 'package:unjynx_core/core.dart';

import 'presentation/pages/edit_profile_page.dart';
import 'presentation/pages/profile_page.dart';

/// Profile plugin for UNJYNX Plugin-Play architecture.
///
/// Provides the profile flow:
///   /profile      -> L1: Profile overview
///   /profile/edit -> L2: Edit profile
class ProfilePlugin implements UnjynxPlugin {
  @override
  String get id => 'profile';

  @override
  String get name => 'Profile';

  @override
  String get version => '0.2.0';

  @override
  Future<void> initialize(EventBus eventBus) async {
    // No event subscriptions needed for profile.
  }

  @override
  List<PluginRoute> get routes => [
        PluginRoute(
          path: '/profile',
          builder: () => const ProfilePage(),
          label: 'Profile',
          icon: Icons.person_outline,
          sortOrder: 9,
        ),
        PluginRoute(
          path: '/profile/edit',
          builder: () => const EditProfilePage(),
          label: 'Edit Profile',
          icon: Icons.edit_outlined,
          sortOrder: -1,
        ),
      ];

  @override
  Future<void> dispose() async {
    // Nothing to dispose.
  }
}
