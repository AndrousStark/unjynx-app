// ---------------------------------------------------------------------------
// UNJYNX Shared Types
// ---------------------------------------------------------------------------

export interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly plan: 'free' | 'pro' | 'team' | 'enterprise';
  readonly xp: number;
  readonly streak: number;
  readonly createdAt: string;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly icon: string | null;
  readonly ownerId: string;
  readonly teamId: string | null;
  readonly taskCount: number;
  readonly completedCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Comment {
  readonly id: string;
  readonly taskId: string;
  readonly authorId: string;
  readonly authorName: string;
  readonly authorAvatar: string | null;
  readonly content: string;
  readonly createdAt: string;
}

export interface Subtask {
  readonly id: string;
  readonly taskId: string;
  readonly title: string;
  readonly isCompleted: boolean;
  readonly sortOrder: number;
}

export interface Channel {
  readonly id: string;
  readonly type: 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram' | 'slack' | 'discord' | 'push';
  readonly name: string;
  readonly status: 'connected' | 'disconnected' | 'pending';
  readonly messageCountToday: number;
  readonly lastUsed: string | null;
  readonly config: Record<string, unknown>;
}

export interface TeamMember {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly role: 'owner' | 'admin' | 'member' | 'viewer';
  readonly joinedAt: string;
}

export interface DailyContent {
  readonly id: string;
  readonly category: string;
  readonly quote: string;
  readonly author: string;
  readonly date: string;
}

export interface AiSuggestion {
  readonly id: string;
  readonly type: 'focus' | 'schedule' | 'break' | 'insight';
  readonly title: string;
  readonly description: string;
  readonly taskId: string | null;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
}

export interface StatsOverview {
  readonly tasksToday: number;
  readonly tasksTodayDelta: number;
  readonly streak: number;
  readonly streakDelta: number;
  readonly focusHours: number;
  readonly focusHoursDelta: number;
  readonly xp: number;
  readonly xpDelta: number;
}

export interface CompletionDataPoint {
  readonly date: string;
  readonly completed: number;
  readonly created: number;
}

export interface TeamStats {
  readonly totalMembers: number;
  readonly activeTasks: number;
  readonly completedThisWeek: number;
  readonly averageCompletionTime: number;
  readonly topContributors: readonly {
    readonly name: string;
    readonly avatarUrl: string | null;
    readonly tasksCompleted: number;
  }[];
}
