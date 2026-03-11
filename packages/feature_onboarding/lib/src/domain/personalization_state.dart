import 'package:flutter/material.dart';

/// Immutable state for the personalization flow (B2 onboarding).
@immutable
class PersonalizationState {
  const PersonalizationState({
    this.currentStep = 0,
    this.identity,
    this.goals = const {},
    this.channelPrefs = const {},
    this.contentCategories = const [],
    this.contentDeliverAt = '07:00',
  });

  /// Current step index (0-3).
  final int currentStep;

  /// Selected identity (e.g. 'student', 'professional').
  final String? identity;

  /// Selected goal IDs (multi-select).
  final Set<String> goals;

  /// Channel toggle states keyed by channel ID.
  final Map<String, bool> channelPrefs;

  /// Selected content category IDs.
  final List<String> contentCategories;

  /// Time string for daily content delivery (HH:mm).
  final String contentDeliverAt;

  PersonalizationState copyWith({
    int? currentStep,
    String? identity,
    Set<String>? goals,
    Map<String, bool>? channelPrefs,
    List<String>? contentCategories,
    String? contentDeliverAt,
  }) {
    return PersonalizationState(
      currentStep: currentStep ?? this.currentStep,
      identity: identity ?? this.identity,
      goals: goals ?? this.goals,
      channelPrefs: channelPrefs ?? this.channelPrefs,
      contentCategories: contentCategories ?? this.contentCategories,
      contentDeliverAt: contentDeliverAt ?? this.contentDeliverAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PersonalizationState &&
          currentStep == other.currentStep &&
          identity == other.identity &&
          goals.length == other.goals.length &&
          goals.containsAll(other.goals) &&
          channelPrefs.length == other.channelPrefs.length &&
          contentCategories.length == other.contentCategories.length &&
          contentDeliverAt == other.contentDeliverAt;

  @override
  int get hashCode => Object.hash(
        currentStep,
        identity,
        Object.hashAll(goals),
        Object.hashAll(channelPrefs.entries),
        Object.hashAll(contentCategories),
        contentDeliverAt,
      );

  @override
  String toString() =>
      'PersonalizationState(step: $currentStep, identity: $identity, '
      'goals: ${goals.length}, channels: ${channelPrefs.length}, '
      'categories: ${contentCategories.length}, deliverAt: $contentDeliverAt)';
}

// ── Identity options ──

/// A selectable identity card option.
@immutable
class IdentityOption {
  const IdentityOption({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

const identityOptions = <IdentityOption>[
  IdentityOption(
    id: 'student',
    label: 'Student',
    icon: Icons.school_rounded,
  ),
  IdentityOption(
    id: 'professional',
    label: 'Professional',
    icon: Icons.business_center_rounded,
  ),
  IdentityOption(
    id: 'freelancer',
    label: 'Freelancer',
    icon: Icons.laptop_mac_rounded,
  ),
  IdentityOption(
    id: 'parent',
    label: 'Parent',
    icon: Icons.family_restroom_rounded,
  ),
  IdentityOption(
    id: 'manager',
    label: 'Manager',
    icon: Icons.groups_rounded,
  ),
  IdentityOption(
    id: 'executive',
    label: 'Executive',
    icon: Icons.trending_up_rounded,
  ),
  IdentityOption(
    id: 'creator',
    label: 'Creator',
    icon: Icons.brush_rounded,
  ),
  IdentityOption(
    id: 'other',
    label: 'Other',
    icon: Icons.category_rounded,
  ),
];

// ── Goal options ──

/// A selectable goal chip option.
@immutable
class GoalOption {
  const GoalOption({
    required this.id,
    required this.label,
  });

  final String id;
  final String label;
}

const goalOptions = <GoalOption>[
  GoalOption(
    id: 'stop_forgetting',
    label: 'Stop forgetting tasks',
  ),
  GoalOption(
    id: 'build_habits',
    label: 'Build better habits',
  ),
  GoalOption(
    id: 'manage_team',
    label: 'Manage my team',
  ),
  GoalOption(
    id: 'beat_procrastination',
    label: 'Beat procrastination',
  ),
  GoalOption(
    id: 'stay_focused',
    label: 'Stay focused',
  ),
  GoalOption(
    id: 'work_life_balance',
    label: 'Work-life balance',
  ),
  GoalOption(
    id: 'track_deadlines',
    label: 'Track deadlines',
  ),
  GoalOption(
    id: 'daily_motivation',
    label: 'Get daily motivation',
  ),
];

// ── Content category options ──

/// A selectable content category card option.
@immutable
class ContentCategoryOption {
  const ContentCategoryOption({
    required this.id,
    required this.label,
    required this.tagline,
    required this.icon,
  });

  final String id;
  final String label;
  final String tagline;
  final IconData icon;
}

const contentCategoryOptions = <ContentCategoryOption>[
  ContentCategoryOption(
    id: 'stoic_wisdom',
    label: 'Stoic Wisdom',
    tagline: 'Marcus Aurelius meets Monday',
    icon: Icons.account_balance_rounded,
  ),
  ContentCategoryOption(
    id: 'ancient_indian',
    label: 'Ancient Indian Wisdom',
    tagline: 'Gita, Chanakya & timeless dharma',
    icon: Icons.auto_awesome_rounded,
  ),
  ContentCategoryOption(
    id: 'growth_mindset',
    label: 'Growth Mindset',
    tagline: 'Reframe failure as fuel',
    icon: Icons.psychology_rounded,
  ),
  ContentCategoryOption(
    id: 'dark_humor',
    label: 'Dark Humor & Anti-Motivation',
    tagline: 'Motivation by roasting you',
    icon: Icons.local_fire_department_rounded,
  ),
  ContentCategoryOption(
    id: 'anime_pop',
    label: 'Anime & Pop Culture',
    tagline: 'Naruto said believe it',
    icon: Icons.sports_martial_arts_rounded,
  ),
  ContentCategoryOption(
    id: 'gratitude',
    label: 'Gratitude & Mindfulness',
    tagline: 'Pause, breathe, appreciate',
    icon: Icons.self_improvement_rounded,
  ),
  ContentCategoryOption(
    id: 'warrior_discipline',
    label: 'Warrior Discipline',
    tagline: 'Spartans didn\'t snooze alarms',
    icon: Icons.shield_rounded,
  ),
  ContentCategoryOption(
    id: 'poetic_wisdom',
    label: 'Poetic Wisdom',
    tagline: 'Rumi, Hafiz & soulful lines',
    icon: Icons.menu_book_rounded,
  ),
  ContentCategoryOption(
    id: 'productivity_hacks',
    label: 'Productivity Hacks',
    tagline: 'Systems > willpower',
    icon: Icons.rocket_launch_rounded,
  ),
  ContentCategoryOption(
    id: 'comeback_stories',
    label: 'Comeback Stories',
    tagline: 'Real people who refused to quit',
    icon: Icons.emoji_events_rounded,
  ),
];

// ── Channel definitions ──

/// A notification channel with metadata.
@immutable
class ChannelDefinition {
  const ChannelDefinition({
    required this.id,
    required this.label,
    required this.icon,
    required this.iconColor,
    this.isPro = false,
    this.defaultEnabled = false,
    this.subtitle,
  });

  final String id;
  final String label;
  final IconData icon;

  /// Placeholder color — replaced at runtime by theme channel colors.
  final Color iconColor;
  final bool isPro;
  final bool defaultEnabled;
  final String? subtitle;
}

/// Channel definitions for the toggle list.
///
/// Note: [iconColor] here is a fallback. Widgets should use `context.unjynx`
/// channel colors (e.g. `ux.whatsapp`, `ux.telegram`) instead.
const channelDefinitions = <ChannelDefinition>[
  ChannelDefinition(
    id: 'push',
    label: 'Push Notifications',
    icon: Icons.notifications_active_rounded,
    iconColor: Color(0xFF6C5CE7),
    defaultEnabled: true,
  ),
  ChannelDefinition(
    id: 'telegram',
    label: 'Telegram',
    icon: Icons.telegram,
    iconColor: Color(0xFF06B6D4),
  ),
  ChannelDefinition(
    id: 'email',
    label: 'Email',
    icon: Icons.email_rounded,
    iconColor: Color(0xFF3B82F6),
  ),
  ChannelDefinition(
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: Icons.chat_rounded,
    iconColor: Color(0xFF25D366),
    isPro: true,
    subtitle: 'Upgrade later',
  ),
  ChannelDefinition(
    id: 'instagram',
    label: 'Instagram',
    icon: Icons.camera_alt_rounded,
    iconColor: Color(0xFFE4405F),
    isPro: true,
    subtitle: 'Upgrade later',
  ),
  ChannelDefinition(
    id: 'sms',
    label: 'SMS',
    icon: Icons.sms_rounded,
    iconColor: Color(0xFFFFA726),
    isPro: true,
    subtitle: 'Upgrade later',
  ),
  ChannelDefinition(
    id: 'discord',
    label: 'Discord',
    icon: Icons.headset_mic_rounded,
    iconColor: Color(0xFF5865F2),
    isPro: true,
    subtitle: 'Upgrade later',
  ),
  ChannelDefinition(
    id: 'slack',
    label: 'Slack',
    icon: Icons.tag_rounded,
    iconColor: Color(0xFF611F69),
    isPro: true,
    subtitle: 'Upgrade later',
  ),
];
