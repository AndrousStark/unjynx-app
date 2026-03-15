const fs = require('fs');
const path = require('path');

const outFile = path.join(__dirname, 'EXPANSION-P34-ALL.doc');

const content = `
================================================================================
  PHASE 3+4 EXPANSION: MISSING SCREEN SPECIFICATIONS
================================================================================
  Phase 3: J5, J6
  Phase 4: I2, I3, I4, L1, L2, M1, M2, N1, N2, N3, N4, N5, P1, P2
  Systems: Game Mode XP, Accessibility, Widgets, Watch, Task Import,
           Empty States, Easter Eggs, Seasonal UI, Upgrade Prompts
================================================================================


SCREEN J5: NOTIFICATION PREFERENCES (Free — global settings)
Phase: 3
─────────────────────────────────────────

  PURPOSE:
    Central notification configuration. Global settings: primary channel,
    fallback channel, quiet hours, max reminders/day, digest mode, advance
    reminder offsets. Per-task overrides available. Team notifications section
    for Team plan users.

  FRONTEND (Flutter):
    Package: feature_settings (or feature_channels)
    Route: /settings/notifications/preferences
    Key Widgets:
      - PrimaryChannelDropdown — select primary notification channel
      - FallbackChannelDropdown — select fallback if primary fails
      - QuietHoursToggle — start/end time pickers per timezone
      - MaxRemindersSlider — 1-50 slider (default 20)
      - DigestModeSelector — Off / Hourly / Daily (morning/evening)
      - AdvanceReminderChips — 5min/15min/30min/1hr/1day selectable chips
      - PerTaskOverrideInfo — Explanation that tasks can override global settings
      - TeamNotificationsSection — (Team plan) toggle for: assigned, completed,
        comment, project update, standup summary
    State Management:
      - notificationPrefsProvider (AsyncNotifier) — global notification settings
      - quietHoursProvider — quiet hours state
      - teamNotifPrefsProvider — team-specific toggles (Team plan)
    Packages (pub.dev):
      - (uses standard Flutter widgets, no special packages)
    Drift Tables (local):
      - user_preferences — notification settings stored locally

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/users/me/notification-preferences
        Response: { primaryChannel, fallbackChannel, quietHours: { start, end },
                    maxPerDay, digestMode, advanceReminder, teamNotifs: object }

      PUT /api/v1/users/me/notification-preferences
        Request: { primaryChannel?, fallbackChannel?, quietHours?, maxPerDay?,
                   digestMode?, advanceReminder? }
        Response: { preferences: NotificationPrefs }
        Notes: Updates BullMQ job schedules for digest mode changes

    Business Logic:
      - Quiet hours: no notifications sent during quiet period (server-side enforcement)
      - Max per day: BullMQ rate limiter per user per day
      - Digest mode: BullMQ aggregation job batches notifications
      - Fallback chain: configurable per user (e.g. WhatsApp → Telegram → Email → SMS)
      - Per-task override: tasks can specify different channel + timing

  DATA FLOW:
    Settings → Notification Preferences → notificationPrefsProvider loads
    → user adjusts settings → PUT /notification-preferences → BullMQ jobs
    rescheduled → Drift updated locally

  INTERACTIONS & ANIMATIONS:
    - Slider: haptic tick at each value change
    - Toggle: smooth switch (200ms easeInOut)
    - Chip selection: gold fill with slight bounce (150ms)
    - Save confirmation: subtle checkmark flash in top bar

  TESTS (target count):
    - Unit: 6 (quiet hours validation, max limit, digest mode, fallback chain)
    - Widget: 6 (all controls render, team section visibility, save flow)
    - Integration: 2 (preferences sync, BullMQ job rescheduling)


SCREEN J6: SMS CONNECTION FLOW (Pro)
Phase: 3
─────────────────────────────────────────

  PURPOSE:
    Connect SMS reminders. Phone input with country code auto-detection,
    OTP verification, consent screen (TCPA/TRAI compliance), confirmation SMS.
    SMS commands: DONE, SNOOZE, STOP, HELP. Rate limits (10 SMS/day max).
    India: DLT registration required (handled server-side).

  FRONTEND (Flutter):
    Package: feature_channels
    Route: /channels/sms/connect
    Key Widgets:
      - PhoneInput — phone field with country code auto-detection
      - OtpVerification — 6-digit code input with 60s countdown + 3 retries
      - ConsentScreen — legal consent text + checkbox + agree button
      - SmsConfirmation — success state with test message button
      - SmsCommandsList — shows DONE, SNOOZE, STOP, HELP commands
    State Management:
      - smsConnectionProvider (AsyncNotifier) — connection state machine
        States: idle → phoneInput → otpSent → verifying → consent → connected
      - otpTimerProvider — 60s countdown for OTP resend
    Packages (pub.dev):
      - intl_phone_number_input ^0.7.4 — country code picker
    Drift Tables (local):
      - notification_channels — SMS connection status

  BACKEND (Hono/TypeScript):
    Endpoints:
      POST /api/v1/channels/sms/send-otp
        Request: { phoneNumber: string, countryCode: string }
        Response: { otpSent: true, expiresIn: 60 }
        Notes: India: MSG91 API. International: Twilio. DLT compliant.

      POST /api/v1/channels/sms/verify-otp
        Request: { phoneNumber: string, code: string }
        Response: { verified: true }

      POST /api/v1/channels/sms/consent
        Request: { phoneNumber: string, consented: true, consentTimestamp: string }
        Response: { channelId: string, connected: true }
        Notes: Stores consent record for TCPA/TRAI compliance

      POST /api/v1/channels/sms/test
        Response: { sent: true, messageId: string }

    Business Logic:
      - OTP: 6 digits, 60s expiry, max 3 attempts per session
      - India DLT: server registers SMS templates on DLT platform (TRAI)
      - SMS format: "UNJYNX: 'Task title' due in 30min. Reply DONE or SNOOZE." (<=160 chars)
      - Rate limit: max 10 SMS/day per user (configurable in J5)
      - STOP command: mandatory unsubscribe (TCPA/TRAI), deletes channel connection

  TESTS (target count):
    - Unit: 6 (OTP validation, consent storage, rate limiting, STOP handling)
    - Widget: 6 (phone input, OTP flow, consent, connected state, commands)
    - Integration: 2 (full connection flow, test message sent)


SCREEN I2: PROGRESS DASHBOARD (Pro — deep analytics)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Deep analytics for data lovers. 8 chart types: completion trend, productivity
    by day, productivity by hour, estimated vs actual, completion rate, focus time,
    procrastination pattern, category breakdown. Export as PDF/PNG.

  FRONTEND (Flutter):
    Package: feature_progress
    Route: /progress/dashboard
    Key Widgets:
      - CompletionTrendChart — fl_chart LineChart: daily/weekly/monthly over 30/90/365d
      - ProductivityByDayChart — fl_chart BarChart: tasks per day of week
      - ProductivityByHourHeatmap — CustomPainter: 24h x 7day heatmap grid
      - EstimatedVsActualScatter — fl_chart ScatterChart: time estimates accuracy
      - CompletionRateChart — fl_chart LineChart: weekly completion percentage
      - FocusTimeChart — fl_chart BarChart: Pomodoro + Ghost Mode minutes/week
      - ProcrastinationChart — custom: defer count histogram per task
      - CategoryBreakdown — fl_chart PieChart (donut): work/personal/health/learning
      - ExportButton — generates PDF/PNG of dashboard
    State Management:
      - dashboardProvider (AsyncNotifier) — loads all chart data from API
      - dateRangeProvider — 30/90/365 day selector
      - chartDataProviders — individual providers per chart type
    Packages (pub.dev):
      - fl_chart ^0.70.0 — all chart types
      - pdf ^3.10.0 — PDF export
      - screenshot ^3.0.0 — PNG export
    Drift Tables (local):
      - progress_snapshots — daily aggregated data for all charts

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/progress/dashboard?range=90
        Response: { completionTrend: DataPoint[], byDay: DayData[7],
                    byHour: HourData[24][7], estimateAccuracy: ScatterPoint[],
                    completionRate: DataPoint[], focusTime: WeekData[],
                    procrastination: HistogramBin[], categoryBreakdown: PieSlice[] }
        Auth: JWT + Pro plan required

      GET /api/v1/progress/export?format=pdf&range=90
        Response: { downloadUrl: string }
        Notes: Server-generates PDF with all charts. Cached for 1 hour.

    Business Logic:
      - Data aggregated from tasks, pomodoro_sessions, rituals tables
      - Procrastination: count deferrals per task, histogram bins [0,1,2,3,4,5+]
      - Category: derived from project tags or manual task categories
      - Hour heatmap: 168 cells (24h x 7 days), completion count per cell

  DATA FLOW:
    Profile → Progress Dashboard → dashboardProvider fetches chart data
    → fl_chart renders 8 charts with brand colors → user can switch date range
    → export button generates PDF/PNG via server or local screenshot

  INTERACTIONS & ANIMATIONS:
    - Chart load: stagger fade-in (100ms between charts)
    - Touch chart point: tooltip with exact value (300ms fade-in)
    - Date range switch: chart data crossfades (250ms)
    - Export: loading spinner → download complete toast

  DSA / ALGORITHMS:
    - Time series aggregation: GROUP BY date with window functions (PostgreSQL)
    - Procrastination detection: count field updates where dueDate was changed
    - Estimate accuracy: linear regression (estimated vs actual minutes)
    - Category auto-assignment: keyword matching on task titles

  TESTS (target count):
    - Unit: 8 (data aggregation, procrastination calc, estimate accuracy)
    - Widget: 8 (each chart renders, date range toggle, export button)
    - Integration: 2 (full dashboard load, PDF export)


SCREEN I3: ACCOUNTABILITY PARTNERS (Pro)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Lightweight accountability. Invite up to 3 partners via link/QR. Partner
    cards show avatar + name + streak (if shared). Nudge button (1/day/partner).
    Shared goals (optional). Weekly summary auto-sent Sunday.

  FRONTEND (Flutter):
    Package: feature_progress
    Route: /progress/accountability
    Key Widgets:
      - PartnerList — up to 3 partner cards
      - PartnerCard — avatar, name, streak (if opted in), nudge button
      - InviteSheet — share link or QR code
      - SharedGoalCard — side-by-side progress for shared goals
      - NudgeButton — "Send a friendly poke" (1/day limit)
    State Management:
      - accountabilityProvider (AsyncNotifier) — partner list + shared goals
      - nudgeCountProvider — tracks nudges sent today per partner
    Packages (pub.dev):
      - qr_flutter ^4.1.0 — QR code for invite link
      - share_plus ^9.0.0 — share invite link
    Drift Tables (local):
      - accountability_partners — partner records

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/accountability/partners
        Response: { partners: Partner[] }

      POST /api/v1/accountability/invite
        Response: { inviteLink: string, qrCodeUrl: string }

      POST /api/v1/accountability/accept/:inviteCode
        Response: { partnership: Partnership }

      POST /api/v1/accountability/nudge/:partnerId
        Response: { sent: true }
        Notes: Max 1 nudge/day/partner. Sends push notification.

      GET /api/v1/accountability/weekly-summary
        Response: { myTasks: number, partnerTasks: number }
        Notes: Auto-sent Sunday via BullMQ

    Business Logic:
      - Max 3 partners per user
      - Nudge: warm copy ("Just a friendly poke", not aggressive)
      - Shared goals: both partners set same goal, progress tracked
      - Weekly summary: auto-generated, framed as mutual support
      - No public leaderboard, no competition framing

  TESTS (target count):
    - Unit: 4 (invite generation, nudge limit, weekly summary)
    - Widget: 4 (partner cards, invite sheet, nudge button)
    - Integration: 2 (invite + accept flow, nudge delivery)


SCREEN I4: GAME MODE (Pro — opt-in, off by default)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Optional gamification layer. When enabled, XP/levels/achievements appear
    on top of default Progress experience. XP system, 30 achievements in 4
    categories, friends/team leaderboards (opt-in), weekly challenges.

  FRONTEND (Flutter):
    Package: feature_progress
    Route: /progress/game-mode
    Key Widgets:
      - GameModeToggle — Settings → Progress → "Enable Game Mode"
      - XpBar — progress bar showing XP toward next level (Profile + Home)
      - LevelBadge — "Lv.8" next to name (subtle)
      - AchievementGrid — Minimal grid of earned badges (30 total)
      - AchievementCard — badge icon + one-line description + unlock condition
      - LeaderboardView — friends board + team board (opt-in)
      - ChallengeCard — active challenge with progress tracker
    State Management:
      - gameModeProvider (StateNotifier) — enabled/disabled state
      - xpProvider (AsyncNotifier) — current XP, level, progress to next
      - achievementsProvider — earned + available achievements
      - leaderboardProvider — friends/team weekly XP rankings
      - challengeProvider — active challenge state
    Packages (pub.dev):
      - confetti_widget ^0.4.0 — level up celebration (optional)
    Drift Tables (local):
      - gamification_xp — XP ledger (action, xp_amount, earned_at)
      - achievements — achievement definitions + unlock status
      - leaderboard_cache — cached rankings

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/game/status
        Response: { xp: number, level: number, xpToNext: number,
                    achievements: Achievement[], rank: RankInfo }

      POST /api/v1/game/xp
        Request: { action: string, taskId?: string }
        Response: { xpAwarded: number, newTotal: number, levelUp?: boolean,
                    achievementUnlocked?: Achievement }
        Notes: Server-side validation. Actions: task_complete(5), last_task(20),
               ritual(25), ghost(15), pomodoro(10), streak milestones(50-1000)

      GET /api/v1/game/leaderboard?type=friends&period=week
        Response: { entries: LeaderboardEntry[] }
        Notes: Friends-only or team-only. No global board.

      POST /api/v1/game/challenges
        Request: { friendId: string, goal: string, duration: "week" }
        Response: { challenge: Challenge }
        Notes: Max 1 active challenge at a time.

    Business Logic:
      - XP table: task_complete=5, last_task_of_day=20, morning_ritual=25,
        ghost_mode_session=15, pomodoro=10, streak_7d=50, streak_30d=100,
        streak_100d=500, streak_365d=1000
      - Level: every 500 XP = 1 level (uncapped)
      - 30 achievements in 4 categories:
        Consistency (streak-based): First Week, Month Master, Century Streak
        Volume (counts): Century (100 tasks), Thousand, Ten Thousand
        Exploration (features): Connected (3+ channels), Deep Work (10 ghost sessions)
        Special (easter eggs): Night Owl Supreme (complete at 3:33 AM)
      - Achievement unlock → unlocks a theme or completion sound
      - Anti-cheat: rate limiting (max 1 XP event per action per 5 seconds),
        server-side validation (cannot award XP for uncompleted tasks)
      - Leaderboard: materialized view, refreshed every 5 min
      - Challenge: auto-resolves end of week, winner gets badge variant

  TESTS (target count):
    - Unit: 10 (XP calculation, level up, achievement triggers, anti-cheat)
    - Widget: 8 (XP bar, achievement grid, leaderboard, challenge card)
    - Integration: 3 (full XP flow, achievement unlock, challenge lifecycle)


SCREEN L1: PROFILE SCREEN (Tab 5 — Free)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    User profile with avatar, name, plan badge, stats row (tasks completed,
    current streak, completion rate), quick links to progress screens,
    activity heatmap, connected channels, settings link, sign out.

  FRONTEND (Flutter):
    Package: feature_settings (or feature_profile)
    Route: /profile (bottom tab 5)
    Key Widgets:
      - ProfileHeader — avatar (tappable), name, plan badge, level if Game Mode
      - StatsRow — 3 stats: tasks completed, current streak, completion rate %
      - QuickLinks — Progress Hub, Dashboard (Pro), Partners (Pro), Game Mode (Pro)
      - ActivityHeatmap — compact 52-week grid (same as I1 but smaller)
      - ConnectedChannels — icons of connected notification channels
      - SettingsButton — gear icon → M1
      - SignOutButton — bottom, muted
    State Management:
      - profileProvider (AsyncNotifier) — user profile data
      - profileStatsProvider — computed stats from local data
    Drift Tables (local):
      - user_profile — avatar URL, name, plan, timezone

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/users/me
        Response: { user: UserProfile, stats: { completed, streak, rate },
                    channels: ChannelStatus[], plan: PlanInfo }

  TESTS (target count):
    - Unit: 4 (stats calculation, plan badge logic)
    - Widget: 6 (header, stats, heatmap, channels, Game Mode conditional)
    - Integration: 1 (profile loads with real data)


SCREEN L2: EDIT PROFILE (Free)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Edit profile fields: name, avatar (camera + gallery + remove), email
    (read-only), timezone, industry mode (v2), bio. Danger zone: export data
    (JSON/CSV), delete account (type DELETE to confirm).

  FRONTEND (Flutter):
    Package: feature_settings
    Route: /profile/edit
    Key Widgets:
      - AvatarPicker — camera, gallery, remove options (image_picker)
      - NameField — text input with validation
      - TimezoneSelector — searchable timezone dropdown
      - IndustryModeSelector — v2 only (hidden in v1)
      - ExportDataButton — JSON/CSV download
      - DeleteAccountButton — confirmation dialog with "type DELETE" input
    State Management:
      - editProfileProvider (StateNotifier) — form state
    Packages (pub.dev):
      - image_picker ^1.1.0 — avatar selection
      - image_cropper ^7.0.0 — crop avatar to square

  BACKEND (Hono/TypeScript):
    Endpoints:
      PATCH /api/v1/users/me
        Request: { displayName?, timezone?, bio? }
        Response: { user: UserProfile }

      POST /api/v1/users/me/avatar
        Request: multipart/form-data { image }
        Response: { avatarUrl: string }
        Notes: Resizes to 256x256, stores in MinIO

      POST /api/v1/users/me/export
        Request: { format: "json"|"csv" }
        Response: { downloadUrl: string }
        Notes: GDPR Article 20 data portability. Async job, email when ready.

      DELETE /api/v1/users/me
        Request: { confirmationText: "DELETE" }
        Response: { deleted: true, dataRemovalDate: string }
        Notes: GDPR Article 17. Soft delete, data removed within 30 days.

  TESTS (target count):
    - Unit: 4 (validation, timezone, export format)
    - Widget: 6 (avatar picker, fields, export, delete confirmation)
    - Integration: 2 (edit flow, delete flow)


SCREEN M1: SETTINGS MAIN (Free — 7 sections)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Central settings hub with 8 sections: Account, Appearance, Notifications,
    Task Defaults, Productivity, AI (v1: basic), Integrations (Pro), Data &
    Privacy, About. Each section links to sub-screens or inline toggles.

  FRONTEND (Flutter):
    Package: feature_settings
    Route: /settings
    Key Widgets:
      - SettingsSectionList — grouped list of setting sections
      - ThemeSelector — Dark/Light/System toggle
      - ColorSchemeSelector — Midnight Purple, Ocean, Forest, Sunset, Custom (Pro)
      - FontSizeSelector — Small/Medium/Large
      - TaskDensitySelector — Comfortable/Compact
      - AnimationSelector — Full/Reduced/Off (respects system preference)
      - HapticToggle — On/Off
      - SoundSelector — 20+ completion sounds library
      - ProductivitySection — Ghost Mode, Pomodoro, Ritual times, Content delivery
      - IntegrationsSection — (Pro) Google/Apple/Outlook calendar, Siri Shortcuts
    State Management:
      - settingsProvider (AsyncNotifier) — all user settings
      - themeProvider — current theme mode
      - appearanceProvider — color scheme, font size, density
    Drift Tables (local):
      - user_settings — all settings stored locally for offline access

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/users/me/settings
        Response: { settings: UserSettings }

      PUT /api/v1/users/me/settings
        Request: { theme?, colorScheme?, fontSize?, density?, animations?,
                   haptics?, sounds?, taskDefaults?, productivity?, ai? }
        Response: { settings: UserSettings }

    Business Logic:
      - Theme: Dark (default), Light, System (follows OS)
      - Color schemes: 5 built-in (Free: 2, Pro: all + custom)
      - Animations: "Off" disables all decorative animations (accessibility)
      - Reduced motion: respects MediaQuery.platformBrightness + reduced motion
      - Task defaults: project, priority, reminder offset, view, week start, formats

  TESTS (target count):
    - Unit: 6 (theme switching, setting validation, Pro gating)
    - Widget: 8 (each section renders, toggles work, Pro badges)
    - Integration: 2 (settings persist across app restart, sync to backend)


SCREEN M2: PLAN & BILLING (Free + Pro + Team)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Current plan display with upgrade CTA for Free users. Side-by-side
    comparison: Free vs Pro. Annual savings highlight. 7-day free trial.
    Regional pricing auto-detected. For Pro: manage subscription, invoices.
    For Team: per-seat billing.

  FRONTEND (Flutter):
    Package: feature_settings
    Route: /settings/billing
    Key Widgets:
      - CurrentPlanCard — plan name, features summary, renewal date
      - UpgradeComparison — side-by-side Free vs Pro feature table
      - PricingDisplay — regional pricing (US/India/EU auto-detected)
      - AnnualSavingsHighlight — "Save 40%!" badge on annual option
      - FreeTrialToggle — 7-day free trial (no credit card required)
      - ManageSubscriptionButton — links to App Store/Play Store subscription
      - InvoiceList — downloadable invoice history (Team)
      - SeatManagement — add/remove seats (Team admin)
    State Management:
      - billingProvider (AsyncNotifier) — current plan + subscription status
      - pricingProvider — regional prices from RevenueCat
    Packages (pub.dev):
      - purchases_flutter ^8.0.0 — RevenueCat SDK for IAP
    Drift Tables (local):
      - user_plan — cached plan status for offline display

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/billing/status
        Response: { plan: string, isActive, renewalDate, trialEnd?,
                    seats?: number, invoices: Invoice[] }

      POST /api/v1/billing/verify-receipt
        Request: { platform, receiptData }
        Response: { plan: string, expiresAt: string }
        Notes: RevenueCat webhook handles subscription events.
               Server verifies receipt with Apple/Google.

    Business Logic:
      - RevenueCat handles all IAP (App Store + Play Store)
      - Regional pricing: App Store/Play Store auto-adjusts by locale
      - Free trial: 7 days Pro access, no credit card
      - Upgrade prompt: shows what user's missing (contextual)
      - Downgrade: access reverts to Free limits at period end

  TESTS (target count):
    - Unit: 4 (plan status, trial logic, seat management)
    - Widget: 6 (plan card, comparison, pricing, trial, manage, invoices)
    - Integration: 2 (upgrade flow, receipt verification)


SCREEN N1: TEAM DASHBOARD (Team plan)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Team overview: name + member count, active projects with completion status,
    aggregate progress rings, activity feed, upcoming deadlines, workload
    heatmap (which members are overloaded). Entry for team management.

  FRONTEND (Flutter):
    Package: feature_teams
    Route: /team/dashboard
    Key Widgets:
      - TeamHeader — team name + member count + invite button
      - TeamProgressRings — aggregate completion rings for team
      - ActiveProjectCards — horizontal scroll of team projects with progress
      - TeamActivityFeed — real-time "who did what" feed (WebSocket)
      - UpcomingDeadlines — cross-project deadline list
      - WorkloadHeatmap — member names x days heatmap (overloaded = red)
    State Management:
      - teamDashboardProvider (AsyncNotifier) — team data + stats
      - teamActivityProvider — WebSocket-fed activity stream
      - workloadProvider — computed workload per member
    Drift Tables (local):
      - teams, team_members — cached team data

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/teams/:id/dashboard
        Response: { team: Team, members: Member[], projects: Project[],
                    stats: TeamStats, activity: Activity[], deadlines: Task[] }

      GET /api/v1/teams/:id/workload
        Response: { memberWorkload: [{ memberId, name, taskCount, overdue }] }

    Business Logic:
      - Workload: tasks assigned per member, flagged if > threshold
      - Activity feed: real-time via WebSocket subscription
      - Deadline aggregation: cross-project, sorted by due date

  TESTS (target count):
    - Unit: 4 (workload calculation, deadline aggregation)
    - Widget: 6 (header, rings, projects, activity, deadlines, heatmap)
    - Integration: 2 (dashboard loads, activity real-time)


SCREEN N2: TEAM MEMBER MANAGEMENT (Team Admin)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Member list with roles, invite flow (email/link/QR), role permissions
    matrix (Owner, Admin, Member, Viewer). Member detail: channel preferences,
    tasks assigned, completion rate.

  FRONTEND (Flutter):
    Package: feature_teams
    Route: /team/members
    Key Widgets:
      - MemberList — avatar + name + role badge + status (active/invited)
      - InviteSheet — email, link, or QR code invite with role selection
      - RoleSelector — Owner/Admin/Member/Viewer picker
      - MemberDetailSheet — channel prefs, tasks, completion rate
      - PermissionsTable — read-only permissions matrix display
    State Management:
      - teamMembersProvider (AsyncNotifier) — member list + roles
      - inviteProvider — invite generation state
    Packages (pub.dev):
      - qr_flutter ^4.1.0 — QR invite code

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/teams/:id/members
        Response: { members: Member[] }

      POST /api/v1/teams/:id/invite
        Request: { email?, role: string, projectAccess: string[] }
        Response: { inviteLink: string, qrUrl: string }

      PATCH /api/v1/teams/:id/members/:memberId/role
        Request: { role: string }
        Response: { member: Member }

      DELETE /api/v1/teams/:id/members/:memberId
        Response: { removed: true }

    Business Logic:
      - Role hierarchy: Owner > Admin > Member > Viewer (Guest)
      - Viewer = free guest, doesn't count toward seat billing
      - Only Owner can delete team, only Owner/Admin can manage members
      - Min 3 seats for Team plan

  TESTS (target count):
    - Unit: 6 (role permissions, invite generation, seat validation)
    - Widget: 6 (member list, invite flow, role change, permissions)
    - Integration: 2 (invite + accept flow, role change persists)


SCREEN N3: SHARED PROJECT VIEW (Team plan)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Same as E2 (Project Detail) but with team features: assignee column,
    filter by assignee, workload balance indicator, comment thread on tasks,
    @mention notifications, activity feed sidebar.

  FRONTEND (Flutter):
    Package: feature_projects + feature_teams
    Route: /projects/:id (enhanced for Team plan)
    Key Widgets:
      - (All E2 widgets) + AssigneeColumn, AssigneeFilter, WorkloadIndicator
      - CommentThread — per-task comment list with @mention support
      - ActivitySidebar — who did what on this project
      - MentionInput — @username autocomplete in comments
    State Management:
      - projectDetailProvider (enhanced for team data)
      - commentsProvider(taskId) — comment thread per task
      - mentionSuggestionsProvider — autocomplete user list

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/tasks/:id/comments
        Response: { comments: Comment[] }

      POST /api/v1/tasks/:id/comments
        Request: { text: string, mentions: string[] }
        Response: { comment: Comment }
        Notes: @mention triggers push notification to mentioned user

      PATCH /api/v1/tasks/:id/assign
        Request: { assigneeId: string }
        Response: { task: Task }

    Business Logic:
      - @mention: regex extracts @username, resolves to user IDs, sends notification
      - Workload balance: visual indicator when member has 2x average tasks
      - Activity feed: all task changes in project, real-time via WebSocket

  TESTS (target count):
    - Unit: 4 (mention parsing, workload calculation)
    - Widget: 6 (assignee column, comments, mentions, activity)
    - Integration: 2 (comment with mention notification, assign flow)


SCREEN N4: TEAM REPORTS (Team plan)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Team analytics: productivity over time, individual contribution, project
    completion rates, overdue by assignee, time tracking summary, channel
    usage. Export PDF/CSV/API.

  FRONTEND (Flutter):
    Package: feature_teams
    Route: /team/reports
    Key Widgets:
      - TeamProductivityChart — fl_chart line: team completion over time
      - ContributionBreakdown — fl_chart bar: tasks per member
      - ProjectRatesChart — fl_chart bar: completion rate per project
      - OverdueByAssignee — table: overdue count per member
      - ChannelUsageChart — fl_chart pie: which channels team uses most
      - ExportReportButton — PDF/CSV download
    State Management:
      - teamReportsProvider (AsyncNotifier) — all report data
    Packages (pub.dev):
      - fl_chart ^0.70.0, pdf ^3.10.0

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/teams/:id/reports?range=30
        Response: { productivity: DataPoint[], contributions: MemberData[],
                    projectRates: ProjectData[], overdue: OverdueData[],
                    channelUsage: ChannelData[] }

      GET /api/v1/teams/:id/reports/export?format=pdf
        Response: { downloadUrl: string }

  TESTS (target count):
    - Unit: 4 (data aggregation per report type)
    - Widget: 6 (each chart renders)
    - Integration: 2 (report loads, export works)


SCREEN N5: ASYNC STANDUP (Team plan)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Auto-generated daily standup from task activity. Each member's summary:
    Done yesterday (auto-filled), Planned today (auto-filled), Blockers
    (manual). Delivered at configured time to team channel. History viewable.

  FRONTEND (Flutter):
    Package: feature_teams
    Route: /team/standup
    Key Widgets:
      - StandupView — today's standup with all members
      - MemberStandupCard — Done/Planned/Blockers per member
      - BlockerInput — manual text input for blockers
      - StandupHistory — past standups list (scrollable)
      - DeliveryConfigButton — configure delivery time + channel
    State Management:
      - standupProvider (AsyncNotifier) — today's auto-generated standup
      - standupHistoryProvider — paginated past standups

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/teams/:id/standup/today
        Response: { standup: Standup, members: MemberStandup[] }
        Notes: Auto-filled from task activity. "Done" = completed yesterday,
               "Planned" = assigned today.

      POST /api/v1/teams/:id/standup/blockers
        Request: { text: string }
        Response: { updated: true }

      GET /api/v1/teams/:id/standup/history?page=1
        Response: { standups: Standup[] }

    Business Logic:
      - Auto-generation: BullMQ job at configured time (e.g. 9:30 AM)
      - Scans task completions from yesterday + tasks due today per member
      - Delivered via configured channel (Slack/Discord/Telegram/WhatsApp/Email)
      - Blockers: manually entered by each member before delivery time

  TESTS (target count):
    - Unit: 4 (auto-fill logic, blocker submission, delivery scheduling)
    - Widget: 4 (standup view, member cards, blocker input, history)
    - Integration: 2 (auto-generated standup, delivery to channel)


SCREEN P1: COMPANY ADMIN DASHBOARD (Team Admin)
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Mobile admin panel for Team plan Owners/Admins. Team overview, billing
    summary, member management link, quick actions (invite, export, reports),
    support contact.

  FRONTEND (Flutter):
    Package: feature_settings (or feature_admin)
    Route: /admin (visible only to Owner/Admin roles)
    Key Widgets:
      - AdminDashboard — overview cards: active users, tasks, completion rate
      - BillingSummaryCard — plan, next billing date, per-seat cost
      - MemberManagementLink — navigate to N2
      - QuickActions — invite member, export data, view reports
      - SupportContact — contact UNJYNX support link
    State Management:
      - adminDashboardProvider (AsyncNotifier) — admin stats
    Drift Tables (local):
      - (uses existing team + billing cache)

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/admin/dashboard
        Response: { stats: AdminStats, billing: BillingInfo }
        Auth: JWT + Owner or Admin role required

  TESTS (target count):
    - Unit: 2 (role gating)
    - Widget: 4 (dashboard renders, billing, quick actions, role visibility)
    - Integration: 1 (admin dashboard loads for admin, hidden for members)


SCREEN P2: CONTENT MANAGEMENT REDIRECT
Phase: 4
─────────────────────────────────────────

  PURPOSE:
    Not a real screen. Shows message "Content management is available in the
    web admin portal" with link/button to open Q4 web CMS. Super Admin only.

  FRONTEND (Flutter):
    Route: /admin/content
    Key Widgets:
      - RedirectCard — message + "Open Web Portal" button (url_launcher)
    State Management: none
    Packages: url_launcher ^6.3.0

  BACKEND: No dedicated endpoints (redirects to web portal)

  TESTS: 1 widget test (redirect card renders, link works)


================================================================================
  MISSING SYSTEM: GAME MODE XP SYSTEM (detailed)
================================================================================

  Already covered in I4 screen spec above. Key additions:

  DRIZZLE SCHEMA:
    gamification_xp:
      id UUID PK, user_id FK, action VARCHAR, xp_amount INT,
      task_id FK nullable, earned_at TIMESTAMP, metadata JSONB

    achievements:
      id UUID PK, name VARCHAR, description TEXT, category ENUM,
      icon_name VARCHAR, unlock_condition JSONB, reward_type VARCHAR,
      reward_value VARCHAR

    achievement_unlocks:
      id UUID PK, user_id FK, achievement_id FK, unlocked_at TIMESTAMP

    leaderboard_entries (materialized view):
      user_id, display_name, avatar_url, weekly_xp, monthly_xp,
      all_time_xp, current_level, rank_position

  BULLMQ JOBS:
    achievement-checker: triggered on XP award, checks if new achievements unlocked
    leaderboard-refresh: runs every 5 min, refreshes materialized view
    challenge-resolver: runs weekly (Sunday midnight), resolves active challenges


================================================================================
  MISSING SYSTEM: ACCESSIBILITY FEATURES
================================================================================

  10 ACCESSIBILITY INNOVATIONS (beyond WCAG AA):

  1. Haptic Semantics
     - Different vibration patterns convey task priority without looking
     - 1 pulse = low, 2 = medium, 3 = high, buzz = urgent
     - Flutter: HapticFeedback.lightImpact() repeated per priority level

  2. Audio Spatial Cues
     - In earphone mode: completed sounds from LEFT, new tasks from RIGHT
     - Spatial awareness of progress without visual
     - Package: audioplayers with stereo panning

  3. Voice-First Mode
     - Full conversational task management: "What's next?" → reads top task
       → "Done" → marks complete → "Next?"
     - Zero visual dependency
     - Packages: speech_to_text + flutter_tts

  4. High Contrast Ghost Mode
     - Pure black bg (#000000), pure white text (#FFFFFF), gold completion
     - Readable in any light condition, any visual impairment
     - Activated via Settings → Accessibility → High Contrast

  5. Dyslexia Mode
     - Switches body font to OpenDyslexic
     - +15% letter spacing, warm cream background (#FFF8E7 on light)
     - Package: google_fonts (OpenDyslexic) or bundled asset

  6. Motor Accessibility
     - Large touch targets mode: all targets → 64x64dp minimum
     - Extra spacing between interactive elements
     - Reduces accidental taps for motor impairments

  7. Cognitive Load Indicator
     - Auto-detects when task list is overwhelming (>15 visible tasks)
     - Suggests: "Feeling overwhelmed? Try Ghost Mode" banner
     - Threshold configurable in Settings

  8. Screen Reader Task Summaries
     - Instead of reading each field separately, screen reader gets:
       "Buy milk, high priority, due tomorrow at 9 AM, in Groceries project"
     - Natural language Semantics labels on all task cards

  9. Color-blind Patterns
     - Priority uses shape + color, NEVER color alone:
       Circle = low (P4), Triangle = medium (P3),
       Diamond = high (P2), Octagon = urgent (P1)
     - Works for all forms of color blindness

  10. One-Handed Mode
      - Shrinks active UI to bottom half of screen
      - All actions reachable with one thumb
      - Activated via Settings → Accessibility → One-Handed

  IMPLEMENTATION:
    Package: feature_settings (accessibility section in M1)
    State: accessibilityProvider — all a11y preferences
    Backend: stored in user_settings, no special endpoints

  TESTS:
    - Unit: 6 (haptic patterns, spatial audio, font switching, threshold)
    - Widget: 10 (each mode renders correctly, voice flow, high contrast)
    - Integration: 2 (a11y mode persists, screen reader labels work)


================================================================================
  MISSING SYSTEM: HOME SCREEN WIDGETS (W1-W5)
================================================================================

  ARCHITECTURE:
    Flutter ←→ home_widget package ←→ Native Widget Rendering
    Data: Flutter saves via HomeWidget.saveWidgetData() → SharedPreferences
    Native reads SharedPreferences and renders SwiftUI / Jetpack Compose widgets
    Callbacks: HomeWidget.registerInteractivityCallback() for tap actions

  W1: TODAY'S TASKS WIDGET
    Sizes: Small (2x2), Medium (4x2), Large (4x4)
    Small: task count "3 left" + compact progress ring
    Medium: next 3 tasks (title + time) + progress ring, checkable
    Large: 3 rings + 5 tasks with checkboxes + daily content quote (1 line)
    Update: every 15 min + on task change callback
    Free: Small + Medium | Pro: All sizes

  W2: QUICK ADD WIDGET
    Size: Small (2x1)
    Tap: deep links to Quick Create Sheet (/tasks/create)
    All tiers: Free

  W3: PROGRESS RINGS WIDGET
    Size: Small (2x2)
    3 concentric rings only (Gold/Violet/Emerald) + center percentage
    Tap: opens Progress Hub
    Free: Available

  W4: DAILY CONTENT WIDGET
    Size: Medium (4x2)
    Today's quote (2 lines max) + author + category badge
    Tap: opens Daily Content Feed
    Pro only

  W5: STREAK WIDGET
    Size: 1x1 (Android only — iOS doesn't support 1x1)
    Streak number + flame icon
    Tap: opens Progress Hub
    Free: Available

  iOS LOCK SCREEN WIDGETS (iOS 16+, WidgetKit):
    - Tasks remaining (Circular): number in ring "5"
    - Streak counter (Circular): flame + number
    - Next task (Rectangular): title + due time
    - Progress rings (Graphic Corner): mini rings
    Read-only (no interaction). Update: 15 min timeline + app foreground.
    Free: tasks + streak | Pro: all 4

  WIDGET THEMING:
    Respects SYSTEM theme (not app theme)
    Dark: #0F0A1A bg, #F8FAFC text, #FFD700 gold
    Light: #F8F5FF bg, #1A0533 text, #B8860B gold
    Border radius: 16dp (matches system widget style)

  NATIVE CODE:
    iOS: Swift + SwiftUI WidgetKit (in ios/UnjynxWidgets/)
    Android: Kotlin + Jetpack Compose (in android/app/src/main/java/.../widgets/)
    Data bridge: home_widget ^6.0.0

  TESTS:
    - Unit: 4 (data serialization, update frequency, tier gating)
    - Widget: 6 (each widget type renders, theme respects system)
    - Integration: 2 (task completion updates widget, deep link works)


================================================================================
  MISSING SYSTEM: WATCH APP
================================================================================

  APPLE WATCH (watchOS 10+):
    Language: SwiftUI (native, NOT Flutter — Flutter doesn't support watchOS)
    Sync: Watch Connectivity framework (near-instant with paired iPhone)

    4 Screens:
      1. Task List: today's tasks (title + due time + priority dot), max 10,
         Digital Crown scroll, swipe right = complete (haptic)
      2. Task Detail: title (full), due date/time, priority, project, "Done" button
         View + complete ONLY (no editing on watch)
      3. Progress Rings: 3 concentric rings, center percentage, display only
      4. Streak Counter: current streak + flame + "Keep going!" message

    4 Complications:
      - Tasks left (Circular Small): number "5"
      - Streak (Circular Small): flame + number
      - Next task (Modular Large): title + due time
      - Progress rings (Graphic Corner): mini rings

    Interactions: complete via swipe/button, haptic on completion
    No task creation (too complex for small screen)

  WEAR OS (Wear OS 4+):
    Language: Jetpack Compose for Wear (Kotlin)
    Sync: Wearable Data Layer API (with paired Android phone)

    Same 4 screens as watchOS + 2 Tiles:
      - Today's tasks tile: 3 tasks with completion buttons
      - Progress rings tile: 3 rings with percentages

  TIER: Pro only (watch app is Pro incentive)

  TESTS:
    - Unit: 4 (sync data serialization, completion via watch)
    - Integration: 2 (watch completion syncs to phone, complication updates)


================================================================================
  MISSING SYSTEM: TASK IMPORT & DATA MIGRATION
================================================================================

  IMPORT SOURCES (v1):
    1. Todoist (CSV): tasks, projects, priorities, dates, labels, completed
    2. TickTick (CSV): tasks, lists, priorities, dates, tags, subtasks
    3. Apple Reminders (CalDAV): reminders, lists, dates, priority, notes
    4. Google Tasks (OAuth): tasks, lists, dates, notes, completed
    5. Generic CSV: manual column mapping (title, date, project, priority, notes)

  IMPORT FLOW:
    Settings → Data → "Import tasks" → Select source
    CSV: upload file (max 10MB, max 5000 tasks) → preview first 10 → column mapping
      → "Import [N] tasks into [Project]" → progress bar → completion summary
    API: OAuth login → select lists → preview → confirm → import
    Duplicate detection: match by title + due date (Skip/Import anyway/Replace)
    Post-import: banner "Welcome from [App]! Your [N] tasks are ready."

  EXPORT FORMATS (GDPR Article 20):
    CSV: all tasks with all fields
    JSON: full structured data (tasks, projects, settings, activity)
    ICS: calendar events for tasks with due dates (RFC 5545)

  FRONTEND (Flutter):
    Package: feature_settings (import/export section)
    Route: /settings/data/import
    Widgets: SourceSelector, FileUploader, ColumnMapper, ImportPreview, ProgressBar
    Packages: file_picker ^8.0.0, csv ^6.0.0

  BACKEND (Hono/TypeScript):
    Endpoints:
      POST /api/v1/import/csv
        Request: multipart/form-data { file, source: "todoist"|"ticktick"|"generic",
                 columnMapping: object, projectId: string }
        Response: { imported: number, skipped: number, errors: string[] }

      POST /api/v1/import/google-tasks
        Request: { authCode: string, listIds: string[] }
        Response: { imported: number }

      POST /api/v1/import/apple-reminders
        Request: { caldavCredentials: object, listIds: string[] }
        Response: { imported: number }

      POST /api/v1/export
        Request: { format: "csv"|"json"|"ics" }
        Response: { downloadUrl: string }

    Packages: papaparse (CSV parsing), googleapis (Google Tasks), node-caldav

  DSA:
    - CSV parsing: streaming parser (papaparse) for memory efficiency
    - Duplicate detection: hash(title + dueDate) → Set for O(1) lookup
    - Column mapping: user defines mapping object, transformer applies per row
    - Batch insert: chunks of 100 tasks per DB transaction

  TESTS:
    - Unit: 8 (CSV parsing per source, duplicate detection, column mapping)
    - Widget: 6 (source selector, file upload, column mapper, preview, progress)
    - Integration: 3 (Todoist import, Google Tasks import, generic CSV)


================================================================================
  MISSING SYSTEM: EMPTY STATES, EASTER EGGS, SEASONAL UI, UPGRADE PROMPTS
================================================================================

  EMPTY STATES (10 illustrated states):
    Custom Lottie animations, flat style + grain texture, brand palette.
    Two color variants per illustration (dark + light mode).

    1. No tasks today: character lounging on cloud, "Nothing on the plate!"
    2. No tasks ever: mascot breaking chains, "Your first curse to break"
    3. No projects: blueprint unrolling, "Every empire started with a plan"
    4. Search no results: magnifying glass + empty chest, "Nothing here yet"
    5. No completed tasks: empty trophy case, "This shelf is hungry"
    6. Ghost Mode done: zen garden + lotus, "Peace. You've conquered the day"
    7. No streak: unlit torch + spark, "One task today lights the flame"
    8. No content selected: golden book closed, "Wisdom awaits"
    9. No team members: empty round table, "Knights needed"
    10. Offline: cloud with ZZZ, "We're offline. Tasks are still here"

  EASTER EGGS (10 hidden interactions):
    1. Type "excelsior" → Stan Lee "EXCELSIOR!" comic animation
    2. Complete exactly 42 tasks → "Answer to life" badge (Hitchhiker's Guide)
    3. Shake phone 10x → screen "glitches" like broken curse, self-repairs
    4. Project named "Wakanda" → vibranium-styled card (metallic purple shimmer)
    5. Task at 3:33 AM → "Night Owl Supreme" rare badge
    6. 365-day streak → "Immortal" badge + permanent gold avatar aura
    7. "I am Iron Man" → auto-set P1 + repulsor sound
    8. "Take over the world" → "One task at a time, Pinky"
    9. 1000th task → full-screen cinematic journey recap
    10. Set all 5 AI personas (v2) → "Personality Crisis" badge

  SEASONAL UI (10 triggers):
    1. New Year (Jan 1-7): gold confetti, "New Year, New Curses" banner
    2. Diwali (date varies): diya icons replace streak flames, orange tint
    3. Halloween (Oct 25-31): spookier Ghost Mode icon, purple fog
    4. Christmas (Dec 20-31): snowfall on home, sleigh bell completion sound
    5. User birthday: cake icon, warm confetti, "Happy birthday!"
    6. Monday morning: "Monday energy. Here's your battle plan."
    7. Friday evening: "It's Friday. Clear 3 and call it a win."
    8. Late night (11pm-5am): dimmer UI, lavender text, sleep reminder
    9. Rainy weather (with permission): rain animation, indoor tasks surfaced
    10. 7+ days idle: dying ember flame, emotional re-engagement

  UPGRADE PROMPTS (6 strategies — natural, not pushy):
    1. The Glimpse: show creation but "Pro" badge, soft limit message
    2. The Taste: free trial of Pro feature (1 test message)
    3. Social Proof: "73% of users... Pro users average 2.4x completions"
    4. Contextual Helper: "AI could do this in 3 seconds" demo
    5. Milestone Gift: 30-day streak → 3 free days of Pro (reciprocity)
    6. Missing Piece: blurred Pro content with "unlock with Pro" label

    NEVER show prompts during:
      Ghost Mode, rituals, active Pomodoro, after failed task, more than 1/session

  IMPLEMENTATION:
    Empty states: Lottie JSON files in assets/animations/empty_states/
    Easter eggs: EasterEggService in packages/core/lib/services/
    Seasonal: SeasonalThemeProvider checks date/location, applies overlays
    Upgrades: UpgradePromptService with frequency limiter (1/session max)

  TESTS:
    - Unit: 8 (easter egg triggers, seasonal date logic, prompt frequency)
    - Widget: 10 (each empty state renders, seasonal overlays, prompt UX)
    - Integration: 2 (easter egg end-to-end, upgrade prompt → billing flow)


`;

fs.writeFileSync(outFile, content, 'utf-8');
const lines = content.split('\n').length;
console.log('EXPANSION-P34-ALL.doc written. Lines:', lines);
