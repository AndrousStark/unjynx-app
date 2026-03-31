// ── Enums ─────────────────────────────────────────────────────────────
export {
  taskPriorityEnum,
  taskStatusEnum,
  channelTypeEnum,
  notificationStatusEnum,
  notificationCategoryEnum,
  contentCategoryEnum,
  ritualTypeEnum,
  xpSourceEnum,
  userPlanEnum,
  teamRoleEnum,
  syncOperationEnum,
  featureFlagStatusEnum,
  subscriptionStatusEnum,
  invoiceStatusEnum,
  partnerStatusEnum,
  goalMetricEnum,
  challengeTypeEnum,
  challengeStatusEnum,
  teamInviteStatusEnum,
  teamMemberStatusEnum,
  adminRoleEnum,
} from "./enums.js";

// ── Core Tables ───────────────────────────────────────────────────────
export { profiles, type Profile, type NewProfile } from "./profiles.js";
export { projects, type Project, type NewProject } from "./projects.js";
export { tasks, type Task, type NewTask } from "./tasks.js";
export { subtasks, type Subtask, type NewSubtask } from "./subtasks.js";
export { sections, type Section, type NewSection } from "./sections.js";

// ── Tags ──────────────────────────────────────────────────────────────
export { tags, taskTags, type Tag, type NewTag, type TaskTag } from "./tags.js";

// ── Comments & Attachments ────────────────────────────────────────────
export { comments, type Comment, type NewComment } from "./comments.js";
export {
  attachments,
  type Attachment,
  type NewAttachment,
} from "./attachments.js";

// ── Recurring & Reminders ─────────────────────────────────────────────
export {
  recurringRules,
  type RecurringRule,
  type NewRecurringRule,
} from "./recurring-rules.js";
export { reminders, type Reminder, type NewReminder } from "./reminders.js";

// ── Notification Channels & Logs ──────────────────────────────────────
export {
  notificationChannels,
  type NotificationChannel,
  type NewNotificationChannel,
} from "./notification-channels.js";
export {
  notificationLog,
  type NotificationLogEntry,
  type NewNotificationLogEntry,
} from "./notification-log.js";

// ── Daily Content ─────────────────────────────────────────────────────
export {
  dailyContent,
  type DailyContentItem,
  type NewDailyContentItem,
} from "./daily-content.js";
export {
  userContentPrefs,
  type UserContentPref,
  type NewUserContentPref,
} from "./user-content-prefs.js";
export {
  contentDeliveryLog,
  type ContentDeliveryLogEntry,
  type NewContentDeliveryLogEntry,
} from "./content-delivery-log.js";

// ── Rituals & Streaks ─────────────────────────────────────────────────
export { rituals, type Ritual, type NewRitual } from "./rituals.js";
export { streaks, type Streak, type NewStreak } from "./streaks.js";

// ── Progress & Pomodoro ───────────────────────────────────────────────
export {
  progressSnapshots,
  type ProgressSnapshot,
  type NewProgressSnapshot,
} from "./progress-snapshots.js";
export {
  pomodoroSessions,
  type PomodoroSession,
  type NewPomodoroSession,
} from "./pomodoro-sessions.js";

// ── Organizations (Multi-Tenant) ─────────────────────────────────────
export {
  organizations,
  orgMemberships,
  orgInvites,
  orgTeams,
  orgTeamMembers,
  type Organization,
  type NewOrganization,
  type OrgMembership,
  type NewOrgMembership,
  type OrgInvite,
  type NewOrgInvite,
  type OrgTeam,
  type NewOrgTeam,
  type OrgTeamMember,
  type NewOrgTeamMember,
} from "./organizations.js";

// ── Workflows ────────────────────────────────────────────────────────
export {
  workflows,
  workflowStatuses,
  workflowTransitions,
  type Workflow,
  type NewWorkflow,
  type WorkflowStatus,
  type NewWorkflowStatus,
  type WorkflowTransition,
  type NewWorkflowTransition,
} from "./workflows.js";

// ── Task Relations ───────────────────────────────────────────────────
export {
  taskWatchers,
  taskLinks,
  timeEntries,
  taskActivity,
  type TaskWatcher,
  type TaskLink,
  type NewTaskLink,
  type TimeEntry,
  type NewTimeEntry,
  type TaskActivityEntry,
  type NewTaskActivityEntry,
} from "./task-relations.js";

// ── AI Operations ────────────────────────────────────────────────────
export {
  aiOperations,
  aiSuggestions,
  type AiOperation,
  type NewAiOperation,
  type AiSuggestion,
  type NewAiSuggestion,
} from "./ai-operations.js";

// ── Custom Fields ────────────────────────────────────────────────────
export {
  customFieldDefinitions,
  customFieldValues,
  type CustomFieldDefinition,
  type NewCustomFieldDefinition,
  type CustomFieldValue,
  type NewCustomFieldValue,
} from "./custom-fields.js";

// ── SLA Policies ─────────────────────────────────────────────────────
export {
  slaPolicies,
  type SlaPolicy,
  type NewSlaPolicy,
} from "./sla-policies.js";

// ── Messaging (Slack-like Channels) ──────────────────────────────────
export {
  msgChannels,
  msgChannelMembers,
  messages,
  messageReactions,
  pinnedMessages,
  type MsgChannel,
  type NewMsgChannel,
  type MsgChannelMember,
  type NewMsgChannelMember,
  type Message,
  type NewMessage,
  type MessageReaction,
  type PinnedMessage,
} from "./messaging.js";

// ── Sprints ──────────────────────────────────────────────────────────
export {
  sprints,
  sprintTasks,
  sprintBurndown,
  type Sprint,
  type NewSprint,
  type SprintTask,
  type NewSprintTask,
  type SprintBurndownEntry,
  type NewSprintBurndownEntry,
} from "./sprints.js";

// ── Teams (legacy — kept for backwards compatibility) ────────────────
export {
  teams,
  teamMembers,
  teamInvites,
  standups,
  type Team,
  type NewTeam,
  type TeamMember,
  type NewTeamMember,
  type TeamInvite,
  type NewTeamInvite,
  type Standup,
  type NewStandup,
} from "./teams.js";

// ── Gamification ──────────────────────────────────────────────────────
export {
  gamificationXp,
  userXp,
  xpTransactions,
  achievements,
  userAchievements,
  challenges,
  type GamificationXp,
  type NewGamificationXp,
  type UserXp,
  type NewUserXp,
  type XpTransaction,
  type NewXpTransaction,
  type Achievement,
  type NewAchievement,
  type UserAchievement,
  type NewUserAchievement,
  type Challenge,
  type NewChallenge,
} from "./gamification.js";

// ── Templates ─────────────────────────────────────────────────────────
export {
  taskTemplates,
  type TaskTemplate,
  type NewTaskTemplate,
} from "./task-templates.js";

// ── Sync ──────────────────────────────────────────────────────────────
export {
  syncMetadata,
  type SyncMetadataEntry,
  type NewSyncMetadataEntry,
} from "./sync-metadata.js";

// ── User Settings ─────────────────────────────────────────────────────
export {
  userSettings,
  type UserSettingsRow,
  type NewUserSettingsRow,
} from "./user-settings.js";

// ── Feature Flags ─────────────────────────────────────────────────────
export {
  featureFlags,
  type FeatureFlag,
  type NewFeatureFlag,
} from "./feature-flags.js";

// ── Audit & Compliance ───────────────────────────────────────────────
export {
  auditLog,
  type AuditLogEntry,
  type NewAuditLogEntry,
} from "./audit-log.js";

// ── Login Events (Login Audit Trail) ─────────────────────────────────
export {
  loginEvents,
  type LoginEvent,
  type NewLoginEvent,
} from "./login-events.js";

// ── Accountability ────────────────────────────────────────────────────
export {
  accountabilityPartners,
  nudges,
  sharedGoals,
  sharedGoalProgress,
  type AccountabilityPartner,
  type NewAccountabilityPartner,
  type Nudge,
  type NewNudge,
  type SharedGoal,
  type NewSharedGoal,
  type SharedGoalProgress,
  type NewSharedGoalProgress,
} from "./accountability-partners.js";

// ── Billing ──────────────────────────────────────────────────────────
export {
  subscriptions,
  invoices,
  coupons,
  couponRedemptions,
  type Subscription,
  type NewSubscription,
  type Invoice,
  type NewInvoice,
  type Coupon,
  type NewCoupon,
  type CouponRedemption,
  type NewCouponRedemption,
} from "./billing.js";

// ── API Keys ─────────────────────────────────────────────────────────
export {
  apiKeys,
  type ApiKey,
  type NewApiKey,
} from "./api-keys.js";

// ── AI Model Configs ─────────────────────────────────────────────────
export {
  aiModelConfigs,
  type AiModelConfig as AiModelConfigRow,
  type NewAiModelConfig,
} from "./ai-model-configs.js";

// ── Pipeline Runs ────────────────────────────────────────────────────
export {
  pipelineRuns,
  type PipelineRun,
  type NewPipelineRun,
} from "./pipeline-runs.js";

// ── Notifications (Phase 3) ──────────────────────────────────────────
export {
  notifications,
  type Notification,
  type NewNotification,
} from "./notifications.js";
export {
  deliveryAttempts,
  type DeliveryAttempt,
  type NewDeliveryAttempt,
} from "./delivery-attempts.js";
export {
  notificationPreferences,
  type NotificationPreference,
  type NewNotificationPreference,
} from "./notification-preferences.js";
export {
  teamNotificationSettings,
  type TeamNotificationSetting,
  type NewTeamNotificationSetting,
} from "./team-notification-settings.js";

// ── Calendar Integration ─────────────────────────────────────────────
export {
  calendarTokens,
  type CalendarToken,
  type NewCalendarToken,
} from "./calendar-tokens.js";
export {
  calendarEventMapping,
  type CalendarEventMapping,
  type NewCalendarEventMapping,
} from "./calendar-event-mapping.js";

// ── User Sessions ──────────────────────────────────────────────────
export {
  userSessions,
  type UserSession,
  type NewUserSession,
} from "./user-sessions.js";

// ── Impersonation Sessions ──────────────────────────────────────────
export {
  impersonationSessions,
  type ImpersonationSession,
  type NewImpersonationSession,
} from "./impersonation-sessions.js";

// ── Industry Modes ──────────────────────────────────────────────────
export {
  industryModes,
  modeVocabulary,
  modeTemplates,
  modeDashboardWidgets,
  userModePreference,
  type IndustryMode,
  type NewIndustryMode,
  type ModeVocabularyEntry,
  type NewModeVocabularyEntry,
  type ModeTemplate,
  type NewModeTemplate,
  type ModeDashboardWidget,
  type NewModeDashboardWidget,
  type UserModePreferenceRow,
  type NewUserModePreferenceRow,
} from "./industry-modes.js";
