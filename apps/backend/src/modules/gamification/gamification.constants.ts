export const XP_REWARDS = {
  TASK_COMPLETE: 5,
  LAST_TASK_OF_DAY: 20,
  MORNING_RITUAL: 25,
  GHOST_MODE_SESSION: 15,
  POMODORO_COMPLETE: 10,
  STREAK_7: 50,
  STREAK_30: 100,
  STREAK_100: 500,
  STREAK_365: 1000,
} as const;

export const XP_PER_LEVEL = 500;

export type XpRewardKey = keyof typeof XP_REWARDS;

/**
 * Predefined achievements. The `check` function receives accumulated stats
 * and returns true if the achievement should be unlocked.
 */
export interface AchievementDef {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: "consistency" | "volume" | "exploration" | "special";
  readonly xpReward: number;
  readonly requiredValue: number;
}

export const ACHIEVEMENT_DEFS: readonly AchievementDef[] = [
  // Consistency
  { key: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", category: "consistency", xpReward: 50, requiredValue: 7 },
  { key: "streak_30", name: "Monthly Master", description: "Maintain a 30-day streak", category: "consistency", xpReward: 100, requiredValue: 30 },
  { key: "streak_100", name: "Century Club", description: "Maintain a 100-day streak", category: "consistency", xpReward: 500, requiredValue: 100 },
  { key: "streak_365", name: "Year of Fire", description: "Maintain a 365-day streak", category: "consistency", xpReward: 1000, requiredValue: 365 },
  { key: "early_bird_10", name: "Early Bird", description: "Complete 10 tasks before 9 AM", category: "consistency", xpReward: 30, requiredValue: 10 },
  { key: "night_owl_10", name: "Night Owl", description: "Complete 10 tasks after 10 PM", category: "consistency", xpReward: 30, requiredValue: 10 },
  { key: "ritual_master_30", name: "Ritual Master", description: "Complete morning ritual 30 times", category: "consistency", xpReward: 75, requiredValue: 30 },

  // Volume
  { key: "tasks_10", name: "Getting Started", description: "Complete 10 tasks", category: "volume", xpReward: 10, requiredValue: 10 },
  { key: "tasks_50", name: "Productive", description: "Complete 50 tasks", category: "volume", xpReward: 25, requiredValue: 50 },
  { key: "tasks_100", name: "Centurion", description: "Complete 100 tasks", category: "volume", xpReward: 50, requiredValue: 100 },
  { key: "tasks_500", name: "Task Machine", description: "Complete 500 tasks", category: "volume", xpReward: 150, requiredValue: 500 },
  { key: "tasks_1000", name: "Legendary", description: "Complete 1000 tasks", category: "volume", xpReward: 300, requiredValue: 1000 },
  { key: "pomodoro_25", name: "Focus Apprentice", description: "Complete 25 Pomodoro sessions", category: "volume", xpReward: 40, requiredValue: 25 },
  { key: "pomodoro_100", name: "Focus Master", description: "Complete 100 Pomodoro sessions", category: "volume", xpReward: 100, requiredValue: 100 },
  { key: "pomodoro_500", name: "Focus Legend", description: "Complete 500 Pomodoro sessions", category: "volume", xpReward: 250, requiredValue: 500 },

  // Exploration
  { key: "first_project", name: "Project Pioneer", description: "Create your first project", category: "exploration", xpReward: 10, requiredValue: 1 },
  { key: "first_tag", name: "Tag Explorer", description: "Create your first tag", category: "exploration", xpReward: 5, requiredValue: 1 },
  { key: "first_channel", name: "Channel Surfer", description: "Connect your first notification channel", category: "exploration", xpReward: 15, requiredValue: 1 },
  { key: "all_channels", name: "Omnichannel", description: "Connect all notification channels", category: "exploration", xpReward: 100, requiredValue: 8 },
  { key: "first_ghost_mode", name: "Ghost Initiate", description: "Complete your first Ghost Mode session", category: "exploration", xpReward: 15, requiredValue: 1 },
  { key: "first_partner", name: "Accountability Buddy", description: "Add your first accountability partner", category: "exploration", xpReward: 20, requiredValue: 1 },

  // Special
  { key: "challenge_winner_1", name: "Challenger", description: "Win your first challenge", category: "special", xpReward: 50, requiredValue: 1 },
  { key: "challenge_winner_5", name: "Champion", description: "Win 5 challenges", category: "special", xpReward: 100, requiredValue: 5 },
  { key: "challenge_winner_25", name: "Undefeated", description: "Win 25 challenges", category: "special", xpReward: 250, requiredValue: 25 },
  { key: "level_5", name: "Rising Star", description: "Reach level 5", category: "special", xpReward: 25, requiredValue: 5 },
  { key: "level_10", name: "Double Digits", description: "Reach level 10", category: "special", xpReward: 50, requiredValue: 10 },
  { key: "level_25", name: "Quarter Century", description: "Reach level 25", category: "special", xpReward: 100, requiredValue: 25 },
  { key: "level_50", name: "Half Century", description: "Reach level 50", category: "special", xpReward: 250, requiredValue: 50 },
  { key: "level_100", name: "Maximum Unjynx", description: "Reach level 100", category: "special", xpReward: 1000, requiredValue: 100 },
  { key: "zero_inbox", name: "Zero Inbox", description: "Clear all pending tasks in a day", category: "special", xpReward: 30, requiredValue: 1 },
  { key: "weekend_warrior", name: "Weekend Warrior", description: "Complete tasks on 10 weekends", category: "special", xpReward: 40, requiredValue: 10 },
] as const;
