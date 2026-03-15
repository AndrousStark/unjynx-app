const fs = require('fs');
const outPath = 'C:/Users/SaveLIFE Foundation/Downloads/personal/Project- TODO Reminder app/scripts/expansion/EXPANSION-P34A.doc';

const content = `
################################################################################
  EXPANSION-P34A: DETAILED SCREEN SPECIFICATIONS
  Screens: J5, J6 (Phase 3) | I2, I3, I4, L1, L2, M1, M2 (Phase 4)
  Systems: Game Mode XP System, Accessibility Features
  Generated: 2026-03-09
################################################################################

  This document provides granular screen-level specs for 9 screens across
  Phases 3-4, plus the Game Mode XP system design and Accessibility feature
  suite. Each screen spec includes frontend widgets, backend endpoints, data
  flow, interactions, algorithms, and test counts.

  TABLE OF CONTENTS:
  ------------------
  PART 1: PHASE 3 SCREENS (J5, J6)
  PART 2: PHASE 4 SCREENS (I2, I3, I4, L1, L2, M1, M2)
  PART 3: GAME MODE XP SYSTEM (Full Design)
  PART 4: ACCESSIBILITY FEATURES (Full Design)


################################################################################
  PART 1: PHASE 3 SCREENS
################################################################################

================================================================================
SCREEN J5: NOTIFICATION PREFERENCES (All Tiers)
Phase: 3
================================================================================

  PURPOSE:
  Central hub for controlling how, when, and how often UNJYNX sends reminders.
  Users configure their primary/fallback channels, quiet hours, digest mode,
  advance reminder offsets, and per-task overrides. Team plan users also manage
  team notification categories here.

  FRONTEND (Flutter):
  -------------------
    Package: feature_notifications
    Route: /notifications/preferences
    Key Widgets:
      - NotificationPreferencesScreen (Scaffold with sectioned ListView)
      - ChannelSelectorDropdown (primary + fallback channel pickers)
      - QuietHoursRangePicker (two TimePicker fields, timezone-aware)
      - MaxRemindersSlider (Slider 1-50, default 20, labeled ticks)
      - DigestModeSelector (SegmentedButton: Off | Hourly | Daily AM | Daily PM)
      - AdvanceReminderChips (ChoiceChips: 5min | 15min | 30min | 1hr | 1day)
      - TeamNotificationToggles (SwitchListTile per team notification type)
      - PerTaskOverrideInfo (InfoCard explaining per-task overrides)
    State Management:
      - notificationPreferencesProvider (AsyncNotifier, loads from API + local cache)
      - quietHoursProvider (StateNotifier, persisted via Drift)
      - digestModeProvider (StateNotifier, synced to backend)
      - teamNotificationTogglesProvider (FutureProvider, Team plan only)
    Packages:
      - flutter_riverpod 2.x (state)
      - drift 2.32+ (local cache of preferences)
    Drift Tables:
      - notification_preferences (user_id PK, primary_channel TEXT,
        fallback_channel TEXT, quiet_start TEXT, quiet_end TEXT,
        timezone TEXT, max_reminders_per_day INTEGER DEFAULT 20,
        digest_mode TEXT DEFAULT 'off', advance_reminder TEXT DEFAULT '15min',
        updated_at INTEGER)
      - team_notification_settings (user_id TEXT, team_id TEXT,
        task_assigned BOOLEAN DEFAULT true, task_completed BOOLEAN DEFAULT true,
        comment_on_task BOOLEAN DEFAULT true, project_update BOOLEAN DEFAULT true,
        daily_standup BOOLEAN DEFAULT true, updated_at INTEGER,
        PRIMARY KEY (user_id, team_id))

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/notifications/preferences
             Response: { success: true, data: NotificationPreferences }
      PUT    /api/v1/notifications/preferences
             Request:  { primaryChannel, fallbackChannel, quietStart,
                         quietEnd, timezone, maxRemindersPerDay,
                         digestMode, advanceReminder }
             Response: { success: true, data: NotificationPreferences }
      GET    /api/v1/notifications/preferences/team/:teamId
             Response: { success: true, data: TeamNotificationSettings }
      PUT    /api/v1/notifications/preferences/team/:teamId
             Request:  { taskAssigned, taskCompleted, commentOnTask,
                         projectUpdate, dailyStandup }
             Response: { success: true, data: TeamNotificationSettings }
    Business Logic:
      - Quiet hours enforced server-side: scheduler skips delivery windows
        that fall within quiet hours (converted to UTC using user timezone)
      - Max reminders/day enforced via Valkey sliding window counter;
        once limit reached, remaining are batched into next digest
      - Digest cron job: runs per-user at their configured time
        (BullMQ repeatable job with cron expression derived from timezone)
      - Fallback chain stored as ordered array, evaluated by escalation worker
      - Team notification preferences scoped per team (user can be in
        multiple teams with different settings)
    Drizzle Schema:
      notificationPreferences table:
        - userId (text, PK, references users.id)
        - primaryChannel (text, enum: push|telegram|email|whatsapp|sms|
          instagram|slack|discord)
        - fallbackChannel (text, nullable, same enum)
        - quietStart (text, HH:mm format)
        - quietEnd (text, HH:mm format)
        - timezone (text, IANA timezone identifier)
        - maxRemindersPerDay (integer, default 20, check 1-50)
        - digestMode (text, enum: off|hourly|daily_am|daily_pm)
        - advanceReminder (text, enum: 5min|15min|30min|1hr|1day)
        - updatedAt (timestamp, default now())
      teamNotificationSettings table:
        - userId (text, references users.id)
        - teamId (text, references teams.id)
        - taskAssigned (boolean, default true)
        - taskCompleted (boolean, default true)
        - commentOnTask (boolean, default true)
        - projectUpdate (boolean, default true)
        - dailyStandup (boolean, default true)
        - updatedAt (timestamp, default now())
        - Primary key: (userId, teamId)

  DATA FLOW:
  ----------
    1. Screen opens -> notificationPreferencesProvider fetches GET /preferences
    2. Drift cache checked first; if fresh (<5min), show cached; else API call
    3. User changes any setting -> immediate local state update (optimistic)
    4. Debounced PUT /preferences call (500ms debounce to batch rapid changes)
    5. Backend validates: channel must be connected (check channel_connections),
       quiet hours must not overlap 24h, max reminders in range 1-50
    6. Backend updates Drizzle row, invalidates Valkey cache for user prefs
    7. BullMQ scheduler recalculates all pending jobs for this user
       (quiet hours may shift delivery times, digest mode may batch them)
    8. Response confirms -> Drift cache updated -> UI shows saved indicator
    9. Team settings: separate PUT call per team, same optimistic pattern

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Channel selector dropdown: slide-down with 200ms ease-out
    - Quiet hours picker: Material 3 TimePicker dialog with clock face
    - Max reminders slider: haptic tick at each 5-unit increment
    - Digest mode segmented button: morphing selection indicator (300ms)
    - Save confirmation: subtle checkmark fade-in on section header (400ms)
    - Team section: expandable tile with rotate arrow animation (200ms)
    - Scroll behavior: SliverAppBar with pinned title, sections as SliverList

  DSA / ALGORITHMS:
  -----------------
    - Debounce (timer-based): batch rapid preference changes into single API call
    - Time zone conversion: UTC offset calculation for quiet hours enforcement
    - Sliding window counter: Valkey-based daily quota tracking per channel
    - Cron expression generation: convert user time + timezone to UTC cron

  TESTS:
  ------
    Unit: 6 (preference model serialization, quiet hours validation,
              digest mode logic, timezone conversion, debounce behavior,
              team settings toggle)
    Widget: 5 (channel selector renders, slider range enforced,
               quiet hours picker launches, digest mode buttons,
               team section visibility by plan)
    Integration: 3 (save round-trip, team settings save, offline cache fallback)
    Total: 14 tests

================================================================================
SCREEN J6: SMS CONNECTION FLOW (Pro)
Phase: 3
================================================================================

  PURPOSE:
  SMS is the ultimate fallback channel -- works without internet, without apps,
  on every phone. This screen walks Pro users through connecting their phone
  number, verifying via OTP, granting consent, and testing the connection.
  SMS is Pro-only due to per-message cost (~Rs 0.15-0.20 via MSG91 India).

  FRONTEND (Flutter):
  -------------------
    Package: feature_notifications
    Route: /channels/sms/connect
    Key Widgets:
      - SmsConnectionScreen (Scaffold with stepper/wizard layout)
      - PhoneNumberInput (TextFormField with country code auto-detection
        via country_code_picker, E.164 format validation)
      - OtpVerificationWidget (6-digit PinCodeField, 60s countdown timer,
        3 retry limit, auto-submit on 6th digit)
      - SmsConsentCard (Card with consent text, checkbox, legal link)
      - SmsTestButton (ElevatedButton -> sends test reminder -> shows result)
      - SmsRateLimitInfo (InfoCard showing max 10 SMS/day, cost transparency)
      - SmsCommandsReference (ExpansionTile listing DONE/SNOOZE/STOP/HELP)
      - SmsFallbackConfig (dropdown to set SMS position in fallback chain)
    State Management:
      - smsConnectionProvider (AsyncNotifier, manages wizard state machine)
      - otpTimerProvider (StateNotifier, 60s countdown with auto-reset)
      - smsConnectionStatusProvider (FutureProvider, checks if connected)
      - smsDailyUsageProvider (FutureProvider, shows usage/quota)
    Packages:
      - flutter_riverpod 2.x
      - country_code_picker 3.x (country code selection)
      - pin_code_fields 8.x (OTP input)
      - drift 2.32+ (cache connection status)
    Drift Tables:
      - sms_connection (user_id PK, phone_number TEXT ENCRYPTED,
        country_code TEXT, verified BOOLEAN DEFAULT false,
        consent_given BOOLEAN DEFAULT false, consent_timestamp INTEGER,
        connected_at INTEGER, daily_limit INTEGER DEFAULT 10,
        estimated_monthly_cost REAL DEFAULT 0.0)

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      POST   /api/v1/channels/sms/send-otp
             Request:  { phoneNumber: "+91XXXXXXXXXX" }
             Response: { success: true, data: { expiresIn: 60, retryAfter: 60 } }
             Validation: E.164 format, not already connected to another user,
                         rate limit: max 5 OTP requests per phone per hour
      POST   /api/v1/channels/sms/verify-otp
             Request:  { phoneNumber: "+91XXXXXXXXXX", otp: "123456" }
             Response: { success: true, data: { verified: true } }
             Validation: OTP matches, not expired (60s TTL in Valkey),
                         max 3 attempts per OTP (brute force prevention)
      POST   /api/v1/channels/sms/consent
             Request:  { phoneNumber: "+91XXXXXXXXXX", consentGiven: true }
             Response: { success: true, data: { connected: true } }
             Side effect: sends confirmation SMS, creates channel_connection row
      POST   /api/v1/channels/sms/test
             Request:  {} (uses connected phone number)
             Response: { success: true, data: { messageId: "...", status: "sent" } }
      DELETE /api/v1/channels/sms/disconnect
             Response: { success: true }
             Side effect: sends farewell SMS, removes channel_connection
      GET    /api/v1/channels/sms/status
             Response: { success: true, data: { connected: bool, phone: "masked",
                         dailyUsed: 3, dailyLimit: 10, estimatedMonthlyCost: 45.0 } }
    Business Logic:
      - OTP generation: cryptographically random 6-digit code stored in
        Valkey with 60s TTL, key: sms:otp:{phone}
      - OTP attempts tracked in Valkey: sms:otp:attempts:{phone} (max 3)
      - Provider routing: India (+91) -> MSG91, international -> Twilio/Plivo
      - DLT compliance (India): all templates pre-registered on DLT platform,
        template IDs stored in config, MSG91 requires DLT entity ID + template ID
      - TCPA/TRAI compliance: STOP keyword must always unsubscribe immediately
      - Inbound SMS webhook: parse DONE/SNOOZE/STOP/HELP keywords
        and route to appropriate handler (task complete, snooze, unsubscribe, help)
      - Rate limits: max 10 SMS/day/user (configurable in J5),
        overdue alerts batched (max 3/day), digest counts as 1 SMS
      - Cost tracking: log per-SMS cost to sms_cost_log table,
        calculate estimated monthly cost based on 30-day rolling average
    Drizzle Schema:
      smsConnections table:
        - userId (text, PK, references users.id)
        - phoneNumber (text, encrypted at rest via pgcrypto)
        - countryCode (text, e.g. "+91")
        - verified (boolean, default false)
        - consentGiven (boolean, default false)
        - consentTimestamp (timestamp, nullable)
        - connectedAt (timestamp, nullable)
        - dailyLimit (integer, default 10, check 1-20)
        - dltEntityId (text, nullable, India-only)
        - provider (text, enum: msg91|twilio|plivo)
        - createdAt (timestamp, default now())
        - updatedAt (timestamp, default now())
      smsCostLog table:
        - id (uuid, PK)
        - userId (text, references users.id)
        - messageType (text, enum: reminder|overdue|digest|streak|verification)
        - provider (text)
        - costAmount (numeric(8,4))
        - currency (text, default 'INR')
        - sentAt (timestamp, default now())
      smsInboundLog table:
        - id (uuid, PK)
        - phoneNumber (text)
        - keyword (text, enum: DONE|SNOOZE|STOP|HELP)
        - rawBody (text)
        - processedAction (text)
        - receivedAt (timestamp, default now())

  DATA FLOW:
  ----------
    1. User taps "Connect SMS" on channel hub (J1)
    2. Router pushes /channels/sms/connect
    3. Step 1 - Phone Input: user enters number with country code
       -> POST /sms/send-otp -> OTP sent via MSG91/Twilio
       -> OTP stored in Valkey (60s TTL)
    4. Step 2 - OTP Verify: user enters 6-digit code
       -> POST /sms/verify-otp -> backend checks Valkey
       -> On match: advance to Step 3; on fail: decrement attempts
    5. Step 3 - Consent: user reads consent text, checks box
       -> POST /sms/consent -> backend creates channel_connection row
       -> Confirmation SMS sent: "You're connected! Reply HELP for options."
    6. Step 4 - Test: user taps "Send test"
       -> POST /sms/test -> sample reminder SMS sent
       -> UI shows delivery status (sent -> delivered via webhook)
    7. Connection complete -> pop back to J1, SMS icon now active
    8. Inbound messages: MSG91/Twilio webhook -> POST /sms/inbound
       -> parse keyword -> route action -> update task/subscription

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Stepper wizard: horizontal stepper with 4 steps, animated progress line
    - Phone input: country flag + code auto-fills based on SIM locale
    - OTP input: each digit box scales up on focus (1.0 -> 1.1, 150ms)
    - OTP countdown: circular progress indicator, pulses red at <10s
    - OTP auto-submit: triggers verify on 6th digit entered
    - Consent checkbox: scale bounce on check (0.8 -> 1.0 -> 1.0, spring curve)
    - Test SMS: loading spinner -> checkmark morph (Lottie animation, 800ms)
    - Error states: shake animation on invalid OTP (horizontal 3-cycle, 300ms)
    - Success confetti: subtle particle burst on connection complete

  DSA / ALGORITHMS:
  -----------------
    - State machine: wizard step transitions (input -> verify -> consent -> test)
    - E.164 phone validation: regex + libphonenumber-style parsing
    - Cryptographic random: 6-digit OTP generation (crypto.randomInt)
    - Token bucket: rate limiting OTP requests (5/hour per phone)
    - Keyword parser: inbound SMS text classification (exact match + fuzzy)
    - Rolling average: 30-day cost estimation from sms_cost_log

  TESTS:
  ------
    Unit: 7 (phone validation E.164, OTP generation, OTP expiry logic,
              consent model, cost calculation, keyword parsing, rate limiting)
    Widget: 5 (phone input with country picker, OTP field auto-submit,
               consent checkbox validation, test button states,
               stepper navigation)
    Integration: 4 (full connection flow, OTP verify round-trip,
                     inbound keyword handling, disconnect flow)
    Total: 16 tests


################################################################################
  PART 2: PHASE 4 SCREENS
################################################################################

================================================================================
SCREEN I2: PROGRESS DASHBOARD PRO (Pro)
Phase: 4
================================================================================

  PURPOSE:
  Deep analytics dashboard for data-driven users. Feels like a personal
  Strava for productivity with 8 chart types showing completion trends,
  productivity patterns, time estimate accuracy, focus time, procrastination
  patterns, and category breakdowns. Export-friendly for sharing.

  FRONTEND (Flutter):
  -------------------
    Package: feature_progress
    Route: /progress/dashboard
    Key Widgets:
      - ProgressDashboardScreen (Scaffold with scrollable chart gallery)
      - CompletionTrendChart (fl_chart LineChart, 30/90/365 day toggle)
      - ProductivityByDayChart (fl_chart BarChart, 7 bars for Mon-Sun)
      - ProductivityByHourHeatmap (custom Widget, 24x7 grid with color intensity,
        fl_chart ScatterChart or custom painter for heatmap cells)
      - EstimatedVsActualScatter (fl_chart ScatterChart with diagonal reference)
      - CompletionRateCard (fl_chart LineChart, weekly % trend + percentage badge)
      - FocusTimeChart (fl_chart BarChart, Pomodoro + Ghost Mode stacked)
      - ProcrastinationPatternCard (custom: avg defer count with insight text)
      - CategoryBreakdownDonut (fl_chart PieChart, work/personal/health/learning)
      - DashboardExportButton (PopupMenu: PDF | PNG, uses share_plus)
      - ChartDateRangePicker (SegmentedButton: 30d | 90d | 365d | Custom)
      - InsightBanner (Card with AI-generated insight text, e.g.,
        "Your peak hours are 9-11 AM and 8-10 PM")
    State Management:
      - dashboardDataProvider (FutureProvider.family, parameterized by date range)
      - chartDateRangeProvider (StateProvider<DateRange>, default 30 days)
      - completionTrendProvider (derived from dashboardDataProvider)
      - productivityByDayProvider (derived, aggregates by weekday)
      - productivityByHourProvider (derived, aggregates by hour-of-day)
      - estimateAccuracyProvider (derived, pairs estimated vs actual durations)
      - completionRateProvider (derived, completed/created ratio per week)
      - focusTimeProvider (derived, sums pomodoro + ghost mode minutes)
      - procrastinationProvider (derived, avg snooze/defer count per task)
      - categoryBreakdownProvider (derived, groups by project category)
      - exportFormatProvider (StateProvider<ExportFormat>)
    Packages:
      - fl_chart 0.68+ (all chart types)
      - share_plus 10.x (export sharing)
      - pdf 3.x (PDF generation)
      - screenshot 3.x (PNG capture of chart area)
      - flutter_riverpod 2.x
    Drift Tables:
      - dashboard_cache (user_id TEXT, date_range TEXT, data_json TEXT,
        fetched_at INTEGER, PRIMARY KEY (user_id, date_range))
      NOTE: Heavy computation done server-side; Drift caches API responses
      for offline viewing and faster reload.

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/analytics/dashboard?range=30d|90d|365d|custom&from=&to=
             Response: {
               success: true,
               data: {
                 completionTrend: [{ date, completed, created }],
                 productivityByDay: [{ dayOfWeek, count, avgCompletionTime }],
                 productivityByHour: [{ hour, dayOfWeek, count }],
                 estimatedVsActual: [{ taskId, estimated, actual, category }],
                 completionRate: [{ weekStart, rate }],
                 focusTime: [{ date, pomodoroMinutes, ghostModeMinutes }],
                 procrastination: [{ category, avgDefers, avgDaysDeferred }],
                 categoryBreakdown: [{ category, count, percentage }],
                 insights: [{ type, message, confidence }]
               }
             }
      GET    /api/v1/analytics/export?format=pdf|csv&range=30d
             Response: Binary file download (PDF or CSV)
    Business Logic:
      - All analytics computed from tasks table aggregations (no separate
        analytics table; queries use PostgreSQL window functions and CTEs)
      - Completion trend: GROUP BY date, COUNT where status = 'completed'
      - Productivity by day: EXTRACT(dow FROM completed_at) + COUNT
      - Productivity by hour: EXTRACT(hour FROM completed_at) + day cross-tab
      - Estimated vs actual: compare estimated_duration with
        (completed_at - started_at) for tasks with both values
      - Procrastination: COUNT snooze_log entries per task, AVG by category
      - Insights generation (v1): rule-based pattern detection:
        * Peak hours: top 3 hours with highest completion count
        * Underestimation: if avg(actual/estimated) > 1.3, flag
        * Best day: weekday with highest completion rate
        * Focus champion: week with most ghost mode minutes
      - Plan guard: Pro-only middleware (403 for Free users)
      - Heavy queries cached in Valkey for 15 minutes (key: analytics:{userId}:{range})

  DATA FLOW:
  ----------
    1. User navigates to /progress/dashboard (from Profile or Progress Hub)
    2. Plan guard checks: if Free -> show upgrade prompt with preview charts
    3. chartDateRangeProvider defaults to 30d
    4. dashboardDataProvider fires GET /analytics/dashboard?range=30d
    5. Drift cache checked: if cached data <15min old, use it; else API call
    6. Backend runs aggregation queries (CTE-based, single round-trip)
    7. Valkey cache checked first; cache miss -> run queries -> cache result
    8. Response parsed into typed models (freezed immutable classes)
    9. Each chart widget subscribes to its derived provider (selective rebuild)
    10. User changes date range -> new API call (or cache hit) -> charts animate
    11. Export: PDF uses pdf package to render charts server-side,
        PNG uses screenshot package to capture widget tree client-side

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Charts: staggered entrance animation (each chart fades up with 100ms delay)
    - Line chart: data points animate from 0 to value (600ms, easeOutCubic)
    - Bar chart: bars grow from bottom (400ms per bar, staggered 50ms)
    - Heatmap: cells fade in with random 0-200ms delay (constellation effect)
    - Donut chart: segments animate from 0 degrees, sequential (500ms total)
    - Scatter plot: dots drop in with spring physics (bounce at position)
    - Date range toggle: charts morph from old data to new (AnimatedSwitcher 300ms)
    - Insight banner: typewriter text effect for AI insight message (50ms per char)
    - Pull to refresh: custom refresh indicator with UNJYNX pulse animation
    - Export button: ripple -> share sheet (standard platform share)

  DSA / ALGORITHMS:
  -----------------
    - SQL Common Table Expressions (CTEs): multi-step aggregation in single query
    - Window functions: running averages, week-over-week comparison
    - Cross-tabulation: hour x day productivity matrix
    - Linear regression (simple): estimate accuracy trend line on scatter plot
    - Percentile calculation: P50/P90 completion times
    - Cache invalidation: TTL-based (15min) + event-based (on task completion)

  TESTS:
  ------
    Unit: 8 (each chart data transformer, date range calculation,
              insight generation rules, export format selection,
              cache freshness check, percentage calculation,
              trend direction detection, empty state handling)
    Widget: 8 (each chart widget renders with mock data, date range picker,
               export button menu, insight banner, loading skeleton,
               empty state for no data, plan gate overlay,
               pull to refresh trigger)
    Integration: 4 (full dashboard load, date range switch, export flow,
                     offline cache display)
    Total: 20 tests

================================================================================
SCREEN I3: ACCOUNTABILITY PARTNERS PRO (Pro)
Phase: 4
================================================================================

  PURPOSE:
  Lightweight, respectful accountability system where users invite up to 3
  partners for mutual support. Features partner cards with streaks, gentle
  nudges (1/day/partner), optional shared goals with side-by-side progress,
  and weekly summaries. Deliberately not competitive -- partnership over ranking.

  FRONTEND (Flutter):
  -------------------
    Package: feature_progress
    Route: /progress/accountability
    Key Widgets:
      - AccountabilityScreen (Scaffold with partner list + actions)
      - PartnerCard (Card: avatar, name, streak if shared, nudge button,
        last active indicator -- green dot if today, yellow if yesterday, gray)
      - InvitePartnerSheet (BottomSheet: share invite link or show QR code)
      - NudgeButton (IconButton with daily cooldown timer overlay,
        warm copy: "Just a friendly poke" / "Your partner believes in you")
      - SharedGoalCard (Card: goal title, two progress bars side-by-side,
        partner A vs partner B, completion percentage)
      - CreateSharedGoalSheet (BottomSheet: goal title, target count,
        deadline picker, partner selector)
      - WeeklySummaryCard (Card: last Sunday summary, both partners' stats)
      - EmptyStatePartners (illustration + "Invite your first partner" CTA)
      - PartnerLimitBadge (shows "2 of 3 slots used")
    State Management:
      - partnersProvider (AsyncNotifier, manages partner list + CRUD)
      - partnerInviteProvider (FutureProvider, generates invite link/QR)
      - nudgeCooldownProvider (StateNotifier.family per partnerId,
        tracks last nudge time, enforces 24h cooldown locally + server)
      - sharedGoalsProvider (AsyncNotifier, manages shared goals list)
      - weeklySummaryProvider (FutureProvider, fetches last weekly summary)
    Packages:
      - flutter_riverpod 2.x
      - qr_flutter 4.x (QR code generation for invite)
      - share_plus 10.x (share invite link)
      - drift 2.32+
    Drift Tables:
      - accountability_partners (id TEXT PK, user_id TEXT, partner_user_id TEXT,
        partner_name TEXT, partner_avatar_url TEXT, partner_streak INTEGER,
        streak_shared BOOLEAN DEFAULT false, last_nudge_at INTEGER,
        status TEXT DEFAULT 'pending', created_at INTEGER)
      - shared_goals (id TEXT PK, creator_user_id TEXT, partner_user_id TEXT,
        title TEXT, target_count INTEGER, creator_progress INTEGER DEFAULT 0,
        partner_progress INTEGER DEFAULT 0, deadline INTEGER,
        status TEXT DEFAULT 'active', created_at INTEGER)
      - weekly_summaries (id TEXT PK, user_id TEXT, partner_user_id TEXT,
        week_start INTEGER, user_completed INTEGER, partner_completed INTEGER,
        user_streak INTEGER, partner_streak INTEGER, generated_at INTEGER)

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/accountability/partners
             Response: { success: true, data: Partner[] }
      POST   /api/v1/accountability/invite
             Request:  {} (generates unique invite token)
             Response: { success: true, data: { inviteLink, inviteToken, qrData } }
      POST   /api/v1/accountability/accept/:inviteToken
             Response: { success: true, data: Partner }
             Validation: token valid, not expired (7 days), inviter has <3 partners,
                         accepter has <3 partners, not already partners
      DELETE /api/v1/accountability/partners/:partnerId
             Response: { success: true }
      POST   /api/v1/accountability/nudge/:partnerId
             Response: { success: true, data: { nudgedAt, nextAvailableAt } }
             Validation: 1 nudge per partner per 24h, partner has push enabled
             Side effect: push notification to partner with warm copy
      GET    /api/v1/accountability/shared-goals
             Response: { success: true, data: SharedGoal[] }
      POST   /api/v1/accountability/shared-goals
             Request:  { title, targetCount, deadline, partnerId }
             Response: { success: true, data: SharedGoal }
      PATCH  /api/v1/accountability/shared-goals/:goalId/progress
             Request:  { increment: 1 }
             Response: { success: true, data: { newProgress, partnerProgress } }
      GET    /api/v1/accountability/weekly-summary
             Response: { success: true, data: WeeklySummary[] }
    Business Logic:
      - Invite tokens: UUID v4, stored in Valkey with 7-day TTL
      - Partner limit: max 3 per user (hard enforced server-side)
      - Nudge cooldown: 24h per partner pair, tracked in nudge_log table
      - Nudge copy rotation: 10 warm messages, randomly selected:
        "Just a friendly poke", "Your partner believes in you",
        "Checking in -- you've got this!", "Sending good vibes your way",
        "Small steps count too", etc.
      - Shared goals: progress updated via task completion hooks
        (BullMQ event: if task matches goal criteria, increment progress)
      - Weekly summary: BullMQ cron job every Sunday 8 AM user timezone
        Aggregates: tasks completed, streak, focus time for both partners
        Sends via user's primary notification channel
      - Streak sharing: opt-in per partner (partner must consent to share)
      - Plan guard: Pro-only

  DATA FLOW:
  ----------
    1. User opens /progress/accountability
    2. partnersProvider fetches GET /partners -> shows partner cards or empty state
    3. Invite flow: POST /invite -> receive invite link + QR data
       -> share via share_plus or display QR code
    4. Partner accepts: POST /accept/:token -> both users see each other
       -> WebSocket event notifies inviter in real-time
    5. Nudge: tap nudge button -> POST /nudge/:partnerId
       -> push notification sent to partner
       -> button enters 24h cooldown (local timer + server validation)
    6. Shared goal: create via sheet -> POST /shared-goals
       -> both partners see goal card with dual progress bars
    7. Task completion triggers BullMQ: check if task matches any shared goal
       -> if yes, PATCH /shared-goals/:id/progress automatically
    8. Weekly summary: BullMQ cron -> aggregates stats -> sends notification
       -> stored in weekly_summaries for in-app viewing

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Partner card entrance: slide in from right, staggered (100ms per card)
    - Nudge button: heart-pulse animation on tap (scale 1.0 -> 1.3 -> 1.0, 400ms)
    - Nudge cooldown: circular progress overlay counting down hours remaining
    - Invite QR: fade-in with scale (0.8 -> 1.0, 300ms, easeOutBack)
    - Shared goal progress: animated progress bar fill (500ms, easeOutCubic)
    - Goal completion: confetti burst + both bars hit 100% simultaneously
    - Weekly summary card: slide up from bottom on first view
    - Remove partner: swipe-to-delete with red background, confirmation dialog
    - Empty state: subtle floating illustration with parallax on scroll

  DSA / ALGORITHMS:
  -----------------
    - UUID v4 token generation: invite link uniqueness
    - Cooldown timer: 24h window check (last_nudge_at + 86400s > now)
    - Goal matching: task-to-goal criteria comparison on completion events
    - Cron scheduling: per-user timezone-aware weekly job (BullMQ repeatable)
    - Random selection with seed: nudge copy rotation (avoid repeats within 5)

  TESTS:
  ------
    Unit: 6 (partner model, invite token generation, nudge cooldown logic,
              shared goal progress calculation, weekly summary aggregation,
              partner limit enforcement)
    Widget: 5 (partner card renders, nudge button cooldown state,
               invite sheet QR + link, shared goal dual progress bars,
               empty state with CTA)
    Integration: 4 (invite -> accept flow, nudge round-trip,
                     shared goal progress sync, weekly summary fetch)
    Total: 15 tests

================================================================================
SCREEN I4: GAME MODE PRO (Pro, Opt-in)
Phase: 4
================================================================================

  PURPOSE:
  Full gamification overlay for users who want XP, levels, achievements,
  leaderboards, and challenges. Turned off by default, enabled in Settings.
  When enabled, XP/levels/achievements layer on top of the default Progress
  experience. Can be turned off anytime without losing data (XP tracked
  silently, just hidden from UI).

  FRONTEND (Flutter):
  -------------------
    Package: feature_progress
    Route: /progress/game-mode
    Key Widgets:
      - GameModeScreen (Scaffold with tabbed sections: XP | Achievements |
        Leaderboard | Challenges)
      - XpProgressBar (LinearProgressIndicator with level label,
        current XP / next level XP, animated fill on XP gain)
      - XpHistoryList (ListView of recent XP events with timestamps)
      - AchievementGrid (GridView.builder, 3 columns, earned badges shown,
        unearned hidden until close to unlocking -- progressive reveal)
      - AchievementCard (Card: icon, title, one-line description,
        earned date or progress bar if close to unlocking)
      - LeaderboardList (ListView: rank, avatar, name, weekly XP,
        soft language: "5th of 12 friends")
      - LeaderboardFilterChips (ChoiceChips: This Week | This Month,
        Friends | Team)
      - ChallengeCard (Card: challenger vs challengee, goal description,
        progress bars, days remaining, status)
      - CreateChallengeSheet (BottomSheet: select friend, goal type,
        target count, auto-resolve in 7 days)
      - GameModeToggle (Switch in Settings, with explanation text)
    State Management:
      - gameModeEnabledProvider (StateNotifier, persisted in user settings)
      - xpDataProvider (AsyncNotifier, fetches XP + level + history)
      - achievementsProvider (AsyncNotifier, fetches unlocked + near-unlock)
      - leaderboardProvider (FutureProvider.family, parameterized by filter)
      - activeChallengeProvider (AsyncNotifier, manages single active challenge)
      - xpAnimationProvider (StreamProvider, listens for real-time XP events
        via WebSocket for instant gratification feedback)
    Packages:
      - flutter_riverpod 2.x
      - fl_chart 0.68+ (XP progress visualization)
      - drift 2.32+
      - confetti_widget 0.7.x (achievement unlock celebration)
    Drift Tables:
      - game_mode_state (user_id PK, enabled BOOLEAN DEFAULT false,
        total_xp INTEGER DEFAULT 0, level INTEGER DEFAULT 1,
        xp_in_current_level INTEGER DEFAULT 0, updated_at INTEGER)
      - xp_events_cache (id TEXT PK, user_id TEXT, xp_amount INTEGER,
        source TEXT, source_id TEXT, earned_at INTEGER)
      - achievements_cache (id TEXT PK, user_id TEXT, achievement_id TEXT,
        title TEXT, description TEXT, category TEXT, icon_name TEXT,
        earned_at INTEGER NULLABLE, progress REAL DEFAULT 0.0)
      - leaderboard_cache (user_id TEXT, friend_id TEXT, display_name TEXT,
        avatar_url TEXT, weekly_xp INTEGER, rank INTEGER,
        period TEXT, fetched_at INTEGER)

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/gamification/xp
             Response: { success: true, data: { totalXp, level,
               xpInCurrentLevel, xpToNextLevel: 500, recentEvents: XpEvent[] } }
      GET    /api/v1/gamification/achievements
             Response: { success: true, data: { unlocked: Achievement[],
               nearUnlock: Achievement[], totalUnlocked: number, totalPossible: 30 } }
      GET    /api/v1/gamification/leaderboard?scope=friends|team&period=week|month
             Response: { success: true, data: { entries: LeaderboardEntry[],
               userRank: number, totalParticipants: number } }
      POST   /api/v1/gamification/challenge
             Request:  { friendId, goalType: 'tasks_completed'|'xp_earned'|
               'focus_minutes', targetValue: number }
             Response: { success: true, data: Challenge }
             Validation: max 1 active challenge, friend must have game mode on,
                         friend must accept within 24h or auto-cancel
      GET    /api/v1/gamification/challenge/active
             Response: { success: true, data: Challenge | null }
      POST   /api/v1/gamification/challenge/:id/accept
             Response: { success: true, data: Challenge }
      POST   /api/v1/gamification/challenge/:id/decline
             Response: { success: true }
    Business Logic:
      - XP granting: server-side only (never trust client XP claims)
        Triggered by BullMQ events: task.completed, ritual.completed,
        ghost_mode.ended, pomodoro.completed, streak.milestone
      - Level calculation: level = floor(totalXp / 500) + 1
        xpInCurrentLevel = totalXp % 500
      - Achievement checking: BullMQ worker runs after each XP grant,
        checks all 30 achievement conditions against user stats
      - Achievement progressive reveal: only show achievements where
        user has >50% progress (prevents wall of locked badges)
      - Leaderboard: PostgreSQL materialized view, refreshed every 5 min
        via pg_cron, scoped to user's friend list or team
      - Challenge auto-resolve: BullMQ delayed job, fires 7 days after
        creation, compares progress, awards bonus XP to winner
      - Anti-cheat: rate limit on XP-granting actions:
        max 100 task completions/day, max 20 pomodoros/day,
        max 10 ghost mode sessions/day (server-side validation)
      - Soft language: all leaderboard text uses "5th of 12 friends"
        format, never "#5 RANK" or aggressive competitive framing
      - Plan guard: Pro-only, game mode toggle stored in user settings

  DATA FLOW:
  ----------
    1. User enables Game Mode in Settings -> PUT /users/settings { gameMode: true }
    2. Navigate to /progress/game-mode
    3. XP tab: xpDataProvider fetches GET /gamification/xp
       -> shows level, XP bar, recent XP events
    4. Real-time XP: WebSocket channel "xp:{userId}" pushes new XP events
       -> xpAnimationProvider triggers XP gain animation immediately
    5. Achievements tab: achievementsProvider fetches GET /gamification/achievements
       -> shows earned badges + near-unlock (>50% progress) badges
    6. Achievement unlock: BullMQ worker detects condition met
       -> inserts achievement_unlock row -> pushes WebSocket event
       -> confetti animation + toast notification
    7. Leaderboard tab: leaderboardProvider fetches with scope + period
       -> materialized view returns ranked list
    8. Challenge: user creates via sheet -> POST /challenge
       -> friend receives push notification -> accept/decline
       -> 7-day timer starts -> progress tracked via XP events
       -> auto-resolve at end -> winner gets bonus badge variant

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - XP gain: floating "+5 XP" text rises and fades (translateY -40, 800ms)
    - XP bar: animated fill with glow effect (600ms, easeOutCubic)
    - Level up: full-screen golden flash + level number scales up (1s)
    - Achievement unlock: card flips from gray to colored (3D perspective, 600ms)
      + confetti burst + haptic feedback (medium impact)
    - Achievement grid: staggered fade-in (50ms per badge)
    - Leaderboard: list items slide in from right, staggered (80ms)
    - Challenge card: progress bars animate together (race effect, 500ms)
    - Challenge accepted: handshake animation (Lottie, 1s)
    - Tab switching: shared axis transition (Material Motion, 300ms)
    - Pull to refresh: XP orb loading animation (custom)

  DSA / ALGORITHMS:
  -----------------
    - XP ledger (append-only log): event sourcing for all XP grants
    - Level calculation: floor division (totalXp / 500) + 1
    - Achievement condition checking: predicate evaluation per achievement
      (30 predicates checked per XP event, optimized with early exit)
    - Materialized view refresh: incremental update strategy for leaderboard
    - Rate limiting: token bucket per action type per user
    - Progressive reveal filter: threshold-based visibility (progress > 0.5)
    - Ranking: dense_rank() window function in PostgreSQL

  TESTS:
  ------
    Unit: 8 (XP calculation, level-up logic, achievement condition checker,
              leaderboard ranking, challenge auto-resolve, rate limit check,
              progressive reveal filter, soft language formatter)
    Widget: 7 (XP bar animation, achievement grid layout, achievement card
               states (locked/near/unlocked), leaderboard list rendering,
               challenge card progress, create challenge sheet validation,
               game mode toggle)
    Integration: 5 (XP grant -> level update, achievement unlock flow,
                     leaderboard refresh, challenge create -> accept -> resolve,
                     game mode enable/disable round-trip)
    Total: 20 tests

================================================================================
SCREEN L1: PROFILE (All Tiers)
Phase: 4
================================================================================

  PURPOSE:
  Tab 5 in the main navigation. The user's identity hub showing their avatar,
  display name, plan badge, key stats (tasks completed, streak, completion
  rate), quick links to progress features, activity heatmap, connected
  channels, and access to settings and sign out.

  FRONTEND (Flutter):
  -------------------
    Package: feature_profile
    Route: /profile (Tab 5 in ShellRoute)
    Key Widgets:
      - ProfileScreen (Scaffold with CustomScrollView + SliverAppBar)
      - ProfileHeader (Row: avatar CircleAvatar 72dp tappable -> L2,
        display name Text, plan badge Chip (Free/Pro/Team),
        level indicator if Game Mode enabled: "Lv.8" subtle Text)
      - StatsRow (Row of 3 StatCards: tasks completed count,
        current streak days, completion rate %)
      - QuickLinksGrid (GridView: Progress Hub, Dashboard Pro,
        Accountability Pro, Game Mode Pro -- locked items show lock icon)
      - ActivityHeatmap (custom Widget: GitHub-style 52-week x 7-day grid,
        color intensity = daily completion count, scrollable horizontally,
        tappable cells show tooltip with date + count)
      - ConnectedChannelsRow (Row of channel icons: push, telegram, email,
        whatsapp, sms, instagram, slack, discord -- active = colored,
        inactive = gray, tappable -> J1)
      - PlanBadge (Chip with plan name + "Upgrade" action if Free)
      - SettingsButton (IconButton gear -> M1)
      - SignOutButton (TextButton at bottom, muted styling, confirmation dialog)
    State Management:
      - profileProvider (AsyncNotifier, combines user data + stats + channels)
      - userStatsProvider (FutureProvider, fetches from API or Drift cache)
      - activityHeatmapProvider (FutureProvider, 365-day completion data)
      - connectedChannelsProvider (FutureProvider, channel connection statuses)
      - gameModeEnabledProvider (from feature_progress, cross-package)
    Packages:
      - flutter_riverpod 2.x
      - cached_network_image 3.x (avatar loading)
      - drift 2.32+
    Drift Tables:
      - user_profile_cache (user_id PK, display_name TEXT, email TEXT,
        avatar_url TEXT, plan TEXT, timezone TEXT, industry_mode TEXT,
        bio TEXT, game_mode_enabled BOOLEAN, level INTEGER,
        total_xp INTEGER, updated_at INTEGER)
      - user_stats_cache (user_id PK, tasks_completed INTEGER,
        current_streak INTEGER, completion_rate REAL,
        longest_streak INTEGER, total_focus_minutes INTEGER,
        updated_at INTEGER)
      - activity_heatmap_cache (user_id TEXT, date TEXT,
        completion_count INTEGER, PRIMARY KEY (user_id, date))

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/users/profile
             Response: { success: true, data: { id, displayName, email,
               avatarUrl, plan, timezone, industryMode, bio,
               gameModeEnabled, level, totalXp } }
      GET    /api/v1/users/stats
             Response: { success: true, data: { tasksCompleted, currentStreak,
               completionRate, longestStreak, totalFocusMinutes } }
      GET    /api/v1/users/activity-heatmap?year=2026
             Response: { success: true, data: [{ date: "2026-01-01", count: 5 }] }
      GET    /api/v1/channels/status
             Response: { success: true, data: [{ channel: "telegram",
               connected: true, identifier: "@user" }] }
    Business Logic:
      - Profile endpoint aggregates from users table + user_settings
      - Stats calculated in real-time or from Valkey cache (5-min TTL):
        tasksCompleted = COUNT tasks WHERE status='completed' AND user_id=?
        currentStreak = calculated from daily_completions streak logic
        completionRate = completed / (completed + overdue) * 100
      - Activity heatmap: single query with GROUP BY date, COUNT completions
        over 365 days, returned as sparse array (only dates with activity)
      - Channel status: JOIN channel_connections table, return connected
        channels with masked identifiers
      - Stats are cached in Valkey (invalidated on task completion)

  DATA FLOW:
  ----------
    1. Tab 5 tapped -> ProfileScreen mounts
    2. profileProvider orchestrates parallel fetches:
       a. GET /users/profile (or Drift cache if <5min)
       b. GET /users/stats (or Drift cache if <5min)
       c. GET /users/activity-heatmap (or Drift cache if <1hr)
       d. GET /channels/status (or Drift cache if <10min)
    3. All data arrives -> immutable ProfileState assembled
    4. UI renders: header, stats row, quick links, heatmap, channels
    5. Tap avatar -> navigate to /profile/edit (L2)
    6. Tap quick link -> navigate to respective route (plan-gated)
    7. Tap settings gear -> navigate to /settings (M1)
    8. Tap sign out -> confirmation dialog -> clear local data -> auth logout
    9. Real-time: WebSocket events update stats (task completed -> streak change)

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - SliverAppBar: avatar scales from 72dp to 40dp on scroll (parallax)
    - Stats row: number counter animation on first load (0 -> value, 800ms)
    - Activity heatmap: cells fade in left-to-right (1ms per cell, wave effect)
    - Heatmap cell tap: tooltip pops up with scale animation (0 -> 1, 200ms)
    - Quick links: grid items have subtle press scale (0.95, 100ms)
    - Channel icons: connected channels have subtle pulse animation on mount
    - Plan badge: shimmer effect on "Upgrade" text (Pro upsell)
    - Sign out: dialog slides up from bottom (300ms, decelerationCurve)
    - Pull to refresh: all data refetched, stats counter re-animates

  DSA / ALGORITHMS:
  -----------------
    - Streak calculation: consecutive day counting from task completion dates
    - Sparse array rendering: heatmap maps 365 date slots, fills from sparse API data
    - Parallel data fetching: Future.wait on 4 independent API calls
    - Cache freshness: per-data-type TTL comparison

  TESTS:
  ------
    Unit: 5 (profile model, stats calculation, streak logic,
              heatmap data mapping, cache freshness check)
    Widget: 6 (header renders with/without game mode, stats row counts,
               heatmap renders 365 cells, quick links plan gating,
               channel icons states, sign out dialog)
    Integration: 3 (full profile load, navigation to sub-screens,
                     real-time stats update via WebSocket)
    Total: 14 tests

================================================================================
SCREEN L2: EDIT PROFILE (All Tiers)
Phase: 4
================================================================================

  PURPOSE:
  Allows users to update their display name, avatar, timezone, industry mode,
  and bio. Also houses the "danger zone" for data export and account deletion.
  Email is read-only (linked to authentication provider).

  FRONTEND (Flutter):
  -------------------
    Package: feature_profile
    Route: /profile/edit
    Key Widgets:
      - EditProfileScreen (Scaffold with Form and scrollable body)
      - AvatarPicker (Stack: CircleAvatar 96dp + camera icon overlay,
        tappable -> BottomSheet with Camera | Gallery | Remove options)
      - DisplayNameField (TextFormField, max 50 chars, required,
        no leading/trailing whitespace, profanity filter client-side)
      - EmailField (TextFormField, read-only with lock icon, gray background)
      - TimezonePicker (searchable dropdown of IANA timezones,
        auto-detected default, grouped by region)
      - IndustryModeSelector (SegmentedButton: General | Hustle | Closer | Grind,
        with description text per mode)
      - BioField (TextFormField, multiline, max 200 chars, optional,
        character counter)
      - DangerZoneSection (ExpansionTile, red accent,
        contains ExportDataButton + DeleteAccountButton)
      - ExportDataButton (OutlinedButton -> triggers GDPR export,
        shows progress, download link when ready)
      - DeleteAccountButton (ElevatedButton.destructive, red,
        -> confirmation dialog with "type DELETE to confirm" TextField)
      - SaveButton (FloatingActionButton or AppBar action, enabled only
        when form has changes, debounced save)
    State Management:
      - editProfileProvider (AsyncNotifier, loads current profile, tracks dirty state)
      - avatarPickerProvider (StateNotifier, manages picked image file/URL)
      - timezoneSearchProvider (StateProvider<String>, filters timezone list)
      - formDirtyProvider (derived, compares current values vs original)
      - deleteAccountProvider (AsyncNotifier, manages deletion flow)
      - exportDataProvider (AsyncNotifier, manages export request + polling)
    Packages:
      - flutter_riverpod 2.x
      - image_picker 1.x (camera/gallery)
      - image_cropper 7.x (square crop for avatar)
      - drift 2.32+
    Drift Tables:
      - (reuses user_profile_cache from L1, updated on save)

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      PUT    /api/v1/users/profile
             Request:  { displayName, timezone, industryMode, bio }
             Response: { success: true, data: UserProfile }
             Validation: displayName required 1-50 chars, trimmed, profanity checked;
               timezone must be valid IANA; industryMode in enum;
               bio max 200 chars
      POST   /api/v1/users/avatar
             Request:  multipart/form-data (image file, max 5MB, jpg/png/webp)
             Response: { success: true, data: { avatarUrl: "https://..." } }
             Processing: resize to 256x256, convert to WebP, upload to MinIO,
               generate thumbnail (64x64) for lists
      DELETE /api/v1/users/avatar
             Response: { success: true }
             Side effect: remove from MinIO, set avatarUrl to null
      POST   /api/v1/data/export
             Response: { success: true, data: { requestId, estimatedReadyAt } }
             Processing: BullMQ job aggregates all user data (tasks, projects,
               settings, channels, XP, achievements) into JSON + CSV ZIP,
               uploads to MinIO with 72h expiry link
      GET    /api/v1/data/export/:requestId/status
             Response: { success: true, data: { status: 'processing'|'ready'|'failed',
               downloadUrl: "..." } }
      DELETE /api/v1/users/account
             Request:  { confirmation: "DELETE" }
             Response: { success: true, data: { scheduledDeletionAt } }
             Processing: soft-delete immediately (user cannot log in),
               hard-delete after 30 days (BullMQ delayed job),
               sends confirmation email, revokes all tokens
    Business Logic:
      - Avatar processing pipeline: validate MIME -> resize (sharp) ->
        convert WebP -> upload MinIO -> update user.avatarUrl
      - Profanity filter: server-side word list check on displayName + bio
      - GDPR export: BullMQ job collects from all tables, generates ZIP
        Must complete within 72 hours (GDPR/DPDP requirement)
      - Account deletion: 30-day grace period, user can cancel via support
        After 30 days: cascade delete all data, anonymize analytics
      - Timezone change: triggers recalculation of all scheduled reminders
        (BullMQ job reschedules pending notification jobs)

  DATA FLOW:
  ----------
    1. User taps avatar on L1 -> navigates to /profile/edit
    2. editProfileProvider loads current profile from Drift cache
    3. User modifies fields -> formDirtyProvider detects changes -> Save enabled
    4. Avatar change: image_picker -> image_cropper -> local preview
       -> POST /users/avatar (multipart) -> new URL returned
    5. Save: PUT /users/profile with changed fields only
       -> Backend validates -> updates database -> invalidates Valkey cache
       -> Response with updated profile -> Drift cache updated
    6. Export: POST /data/export -> requestId returned
       -> Poll GET /data/export/:id/status every 10s
       -> When ready: show download link (MinIO presigned URL, 72h expiry)
    7. Delete: type "DELETE" in confirmation field
       -> DELETE /users/account -> soft-delete -> logout -> splash screen
    8. Back navigation: if unsaved changes, show "Discard changes?" dialog

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Avatar picker: bottom sheet slides up (300ms), camera icon rotates on hover
    - Avatar preview: crossfade from old to new (300ms)
    - Image crop: circular overlay guide for square crop
    - Save button: opacity animation (disabled 0.5 -> enabled 1.0, 200ms)
    - Save success: brief checkmark overlay on save button (500ms)
    - Danger zone: expansion tile with warning icon, red tint on expand
    - Delete confirmation: TextField border turns red, DELETE typed -> button enables
    - Export progress: linear progress indicator with percentage
    - Unsaved changes dialog: scale animation (0.9 -> 1.0, 200ms)

  DSA / ALGORITHMS:
  -----------------
    - Dirty check: deep equality comparison of original vs current form values
    - Image resize: aspect-ratio-preserving resize to max dimension
    - Presigned URL: MinIO generates time-limited download link (HMAC-based)
    - Cascade delete: topological sort of dependent tables for safe deletion
    - Profanity filter: trie-based word matching for O(n) text scanning

  TESTS:
  ------
    Unit: 6 (form validation rules, dirty check logic, timezone validation,
              profanity filter, avatar MIME validation, deletion confirmation)
    Widget: 5 (avatar picker sheet, form fields render and validate,
               danger zone expansion, delete confirmation dialog,
               save button enabled/disabled states)
    Integration: 4 (profile update round-trip, avatar upload + display,
                     export request + status polling, account deletion flow)
    Total: 15 tests

================================================================================
SCREEN M1: SETTINGS (All Tiers)
Phase: 4
================================================================================

  PURPOSE:
  Central settings screen organized into 8 sections (Account, Appearance,
  Notifications, Task Defaults, Productivity, AI, Integrations, Data & Privacy,
  About). Each section navigates to sub-screens or contains inline toggles.
  Respects plan tier -- Pro/Team features show lock icons for Free users.

  FRONTEND (Flutter):
  -------------------
    Package: feature_settings
    Route: /settings
    Key Widgets:
      - SettingsScreen (Scaffold with grouped ListView.builder)
      - SettingsSectionHeader (Text with divider, section title)
      - SettingsNavigationTile (ListTile with trailing arrow, tappable -> sub-screen)
      - SettingsToggleTile (SwitchListTile for inline boolean settings)
      - SettingsDropdownTile (ListTile with dropdown value, tappable -> picker)
      - SettingsSliderTile (ListTile with Slider for numeric values)
      - PlanLockedOverlay (semi-transparent lock icon on Pro-only tiles for Free users)

      Account Section Widgets:
      - ProfileNavTile (-> L2, shows current avatar + name)
      - PlanBillingNavTile (-> M2, shows current plan name)
      - ConnectedAccountsTile (shows Google/Apple/Logto with connect/disconnect)
      - ExportDataTile (triggers GDPR export flow)
      - DeleteAccountTile (red text, -> confirmation flow)

      Appearance Section Widgets:
      - ThemeSelector (SegmentedButton: Dark | Light | System)
      - ColorSchemeSelector (horizontal scrollable chips: Midnight Purple,
        Ocean, Forest, Sunset, Custom Pro)
      - FontSizeSelector (SegmentedButton: Small | Medium | Large)
      - TaskDensitySelector (SegmentedButton: Comfortable | Compact)
      - AnimationsSelector (SegmentedButton: Full | Reduced | Off)
      - HapticFeedbackToggle (SwitchListTile)

      Notifications Section Widgets:
      - NotificationChannelsNavTile (-> J1)
      - NotificationPreferencesNavTile (-> J5)
      - QuietHoursNavTile (-> sub-screen with time pickers)
      - CompletionSoundPicker (-> sub-screen with 20+ sounds, preview on tap)
      - BadgeCountToggle (SwitchListTile)

      Task Defaults Section Widgets:
      - DefaultProjectPicker (dropdown of user's projects)
      - DefaultPriorityPicker (SegmentedButton: None | Low | Med | High | Urgent)
      - DefaultReminderOffsetPicker (dropdown: 5min | 15min | 30min | 1hr | 1day)
      - DefaultTaskViewPicker (SegmentedButton: List | Kanban)
      - StartOfWeekPicker (SegmentedButton: Sun | Mon | Sat)
      - DateFormatPicker (SegmentedButton: MM/DD | DD/MM | YYYY-MM-DD)
      - TimeFormatPicker (SegmentedButton: 12h | 24h)

      Productivity Section Widgets:
      - GhostModeSettings (sub-screen: double-tap activation toggle,
        auto-exit timer duration, default focus duration)
      - PomodoroSettings (sub-screen: work duration, break duration,
        long break duration, sessions before long break, auto-start toggle)
      - MorningRitualTimePicker (TimePicker dialog)
      - EveningReviewTimePicker (TimePicker dialog)
      - ContentDeliverySettings (time picker + channel selector)

      AI Section Widgets:
      - SmartSuggestionsToggle (SwitchListTile, v1 rule-based)
      - ProactiveInsightsToggle (SwitchListTile, v1 rule-based)
      - AiPersonaSelector (v2 placeholder, disabled)
      - AiLanguageSelector (v2 placeholder, disabled)

      Integrations Section Widgets (Pro):
      - GoogleCalendarSyncTile (connect/disconnect + sync toggle)
      - AppleCalendarSyncTile (connect/disconnect + sync toggle)
      - OutlookSyncTile (connect/disconnect + sync toggle)
      - SiriShortcutsTile (iOS only, navigation to system shortcuts)
      - WidgetsConfigTile (-> widget configuration sub-screen)

      Data & Privacy Section Widgets:
      - OfflineModeToggle (SwitchListTile)
      - SyncSettingsSelector (SegmentedButton: Wi-Fi Only | Any Network)
      - CacheManagementTile (shows cache size, clear button)
      - PrivacyPolicyTile (-> WebView)
      - TermsOfServiceTile (-> WebView)
      - OpenSourceLicensesTile (-> LicensePage)

      About Section Widgets:
      - AppVersionTile (shows version + build number)
      - WhatsNewTile (-> changelog screen)
      - RateUsTile (launches App Store / Play Store review)
      - SendFeedbackTile (-> feedback form or email)
      - ContactSupportTile (-> support email / in-app chat)
      - SocialLinksTile (row of social media icons)

    State Management:
      - settingsProvider (AsyncNotifier, loads all settings from Drift + API)
      - themeProvider (StateNotifier, persisted, used by MaterialApp)
      - colorSchemeProvider (StateNotifier, persisted, feeds ThemeData)
      - fontSizeProvider (StateNotifier, persisted, used by TextTheme)
      - taskDensityProvider (StateNotifier, persisted, used by list layouts)
      - animationProvider (StateNotifier, persisted, wraps Duration.zero on off)
      - hapticProvider (StateNotifier, persisted, used by HapticFeedback calls)
      - taskDefaultsProvider (AsyncNotifier, persisted, used by task creation)
      - pomodoroSettingsProvider (StateNotifier, persisted)
      - ghostModeSettingsProvider (StateNotifier, persisted)
      - aiSettingsProvider (StateNotifier, persisted)
      - syncSettingsProvider (StateNotifier, persisted)
    Packages:
      - flutter_riverpod 2.x
      - shared_preferences 2.x (lightweight key-value persistence)
      - dynamic_color 1.x (Material You dynamic theming)
      - url_launcher 6.x (external links)
      - in_app_review 2.x (App Store / Play Store review prompt)
      - drift 2.32+
    Drift Tables:
      - app_settings (key TEXT PK, value TEXT, updated_at INTEGER)
        Stores all settings as key-value pairs locally.
        Keys: theme, colorScheme, fontSize, taskDensity, animations,
              hapticFeedback, defaultProject, defaultPriority,
              defaultReminderOffset, defaultTaskView, startOfWeek,
              dateFormat, timeFormat, ghostModeDoubleTap,
              ghostModeAutoExit, ghostModeDuration,
              pomodoroWork, pomodoroBreak, pomodoroLongBreak,
              pomodoroSessionsBeforeLong, pomodoroAutoStart,
              morningRitualTime, eveningReviewTime,
              contentDeliveryTime, contentDeliveryChannel,
              smartSuggestions, proactiveInsights,
              offlineMode, syncMode, badgeCount

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/users/settings
             Response: { success: true, data: { [key: string]: any } }
      PUT    /api/v1/users/settings
             Request:  { [key: string]: any } (partial update, only changed keys)
             Response: { success: true, data: { [key: string]: any } }
      POST   /api/v1/integrations/google-calendar/connect
             Response: { success: true, data: { authUrl } }
      DELETE /api/v1/integrations/google-calendar/disconnect
             Response: { success: true }
      POST   /api/v1/integrations/apple-calendar/connect
             Response: { success: true }
      DELETE /api/v1/integrations/apple-calendar/disconnect
             Response: { success: true }
      GET    /api/v1/app/changelog
             Response: { success: true, data: ChangelogEntry[] }
      POST   /api/v1/feedback
             Request:  { message, category, deviceInfo }
             Response: { success: true }
    Business Logic:
      - Settings stored as JSONB column in user_settings table (Drizzle)
      - Partial update: merge incoming keys with existing JSONB
        (PostgreSQL jsonb_set for individual key updates)
      - Theme/appearance settings: client-only (stored in Drift + shared_preferences,
        NOT synced to server -- device-specific)
      - Task defaults + notification settings: synced to server
        (shared across devices)
      - Calendar integration: OAuth 2.0 flow with PKCE,
        tokens stored encrypted in database, refresh automatically
      - Cache management: return Drift DB size + image cache size,
        clear endpoint removes cached data
      - Timezone change in settings triggers reminder rescheduling
        (same BullMQ job as L2 timezone change)

  DATA FLOW:
  ----------
    1. User taps gear icon on L1 -> navigates to /settings
    2. settingsProvider loads from Drift (instant) + API (background sync)
    3. User changes a setting -> immediate local persistence (Drift/SharedPrefs)
    4. Debounced PUT /users/settings for server-synced settings (1s debounce)
    5. Appearance changes: applied immediately to MaterialApp via providers
       (themeProvider, colorSchemeProvider, etc. -- no server call needed)
    6. Task defaults: persisted locally + synced to server for cross-device
    7. Integration connect: OAuth redirect -> token exchange -> stored
    8. Cache clear: Drift tables cleared + image cache cleared + confirmation
    9. Navigation: sub-screens push onto stack, back returns to main settings

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Section headers: sticky on scroll (SliverPersistentHeader)
    - Toggle switches: Material 3 switch with thumb animation (200ms)
    - Segmented buttons: morphing indicator with color transition (300ms)
    - Color scheme preview: circular chips with selected ring animation (200ms)
    - Sound picker: plays sample on tap, checkmark on selected (200ms)
    - Theme change: entire screen transitions (cross-fade, 400ms)
    - Sub-screen navigation: shared axis transition (300ms)
    - Cache clear: progress indicator -> checkmark with size display
    - Danger zone tiles: subtle red background tint on press

  DSA / ALGORITHMS:
  -----------------
    - Key-value store pattern: O(1) lookup for any setting
    - JSONB partial merge: PostgreSQL jsonb || operator for atomic updates
    - Debounce (1s): batch rapid setting changes into single API call
    - OAuth 2.0 PKCE: code verifier/challenge for calendar integration
    - Device-specific vs synced: classification of settings for sync strategy

  TESTS:
  ------
    Unit: 8 (settings model, theme application, color scheme generation,
              font size scaling, task defaults validation, debounce timing,
              cache size calculation, setting classification synced vs local)
    Widget: 10 (each section renders correctly, toggle switches update state,
                segmented buttons select correctly, navigation tiles push routes,
                plan-locked overlay for Free users, sound picker preview,
                color scheme chips, theme preview, cache clear confirmation,
                about section displays version)
    Integration: 4 (settings save round-trip, theme change persistence,
                     calendar connect OAuth flow, cache clear + reload)
    Total: 22 tests

================================================================================
SCREEN M2: PLAN & BILLING (All Tiers)
Phase: 4
================================================================================

  PURPOSE:
  Subscription management powered by RevenueCat. Free users see an upgrade
  comparison, Pro users manage their subscription, Team users handle per-seat
  billing. Regional pricing auto-detected by App Store / Play Store locale.
  7-day free trial available without credit card.

  FRONTEND (Flutter):
  -------------------
    Package: feature_settings
    Route: /settings/billing
    Key Widgets:
      - BillingScreen (Scaffold with conditional layout by plan tier)
      - CurrentPlanCard (Card: plan name, renewal date, features list,
        status badge: Active | Trial | Expiring | Expired)
      - PlanComparisonTable (two-column: Free vs Pro, feature checkmarks,
        highlighted "you're missing" rows with gold accent)
      - PricingToggle (SegmentedButton: Monthly $4.99 | Annual $39.99/yr
        with "Save 33%" badge | Lifetime $99.99)
      - RegionalPriceDisplay (Text showing localized price from store,
        e.g., Rs 99/mo for India, EUR 4.49/mo for EU)
      - FreeTrialToggle (SwitchListTile: "Start 7-day free trial",
        with "No credit card required" subtitle)
      - UpgradeButton (ElevatedButton.primary, triggers RevenueCat purchase flow)
      - ManageSubscriptionCard (for Pro: next billing date, auto-renew status,
        change plan button, cancel button)
      - TeamBillingCard (for Team: seats used/total, per-seat cost,
        add seat button, remove seat button, next invoice date)
      - InvoiceHistoryList (ListView: date, amount, status, download PDF link)
      - CouponCodeField (TextFormField + validate button, applies discount)
      - RestorePurchasesButton (TextButton, calls RevenueCat restore)
      - EnterpriseCTA (v2 placeholder: "Need custom pricing? Contact sales")
    State Management:
      - billingProvider (AsyncNotifier, loads current plan + RevenueCat offerings)
      - currentPlanProvider (FutureProvider, from backend GET /billing/subscription)
      - offeringsProvider (FutureProvider, from RevenueCat SDK getOfferings)
      - selectedPricingProvider (StateProvider<PricingPeriod>, default monthly)
      - couponProvider (AsyncNotifier, validates coupon code)
      - invoicesProvider (FutureProvider, fetches invoice history)
      - purchaseInProgressProvider (StateNotifier<bool>, prevents double-tap)
      - teamSeatsProvider (AsyncNotifier, manages seat count for Team plan)
    Packages:
      - purchases_flutter 8.x (RevenueCat SDK -- wraps StoreKit + Google Play Billing)
      - flutter_riverpod 2.x
      - drift 2.32+
    Drift Tables:
      - billing_cache (user_id PK, plan TEXT, status TEXT, renewal_date INTEGER,
        trial_end_date INTEGER, seats INTEGER, monthly_cost REAL,
        currency TEXT, updated_at INTEGER)

  BACKEND (Hono/TypeScript):
  --------------------------
    Endpoints:
      GET    /api/v1/billing/plans
             Response: { success: true, data: [
               { id: 'free', name: 'Free', price: 0, features: [...] },
               { id: 'pro_monthly', name: 'Pro Monthly', price: 4.99, ... },
               { id: 'pro_annual', name: 'Pro Annual', price: 39.99, ... },
               { id: 'pro_lifetime', name: 'Lifetime', price: 99.99, ... },
               { id: 'team_monthly', name: 'Team', pricePerSeat: 6.99, ... }
             ] }
      GET    /api/v1/billing/subscription
             Response: { success: true, data: { plan, status, renewalDate,
               trialEndDate, seats, invoiceHistory: [...] } }
      POST   /api/v1/billing/webhook
             RevenueCat webhook handler:
             Events handled: INITIAL_PURCHASE, RENEWAL, CANCELLATION,
               BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE, SUBSCRIBER_ALIAS
             Processing: update user.plan in database, log event,
               trigger appropriate BullMQ job (e.g., downgrade features on expiry)
      GET    /api/v1/billing/invoices
             Response: { success: true, data: Invoice[] }
      POST   /api/v1/billing/coupon/validate
             Request:  { code: "LAUNCH50" }
             Response: { success: true, data: { valid, discount, expiresAt } }
      POST   /api/v1/billing/team/seats
             Request:  { action: 'add'|'remove', count: 1 }
             Response: { success: true, data: { totalSeats, monthlyCost } }
    Business Logic:
      - RevenueCat is the source of truth for subscription state
        Backend mirrors via webhook events (eventual consistency)
      - Plan features gating: user.plan checked by planGuard middleware
        on all Pro/Team endpoints
      - Trial: 7 days, RevenueCat handles trial management,
        backend receives INITIAL_PURCHASE with trial flag
      - Regional pricing: handled entirely by App Store / Play Store
        (RevenueCat returns localized prices via offerings)
      - Coupon validation: codes stored in coupons Drizzle table
        with discount percentage, max uses, expiry date
      - Team seat management: add/remove triggers RevenueCat subscription
        quantity update, prorated billing
      - Downgrade flow (on cancellation/expiry):
        * Pro features locked (403 on Pro endpoints)
        * Data preserved (user can re-upgrade to restore access)
        * Active WhatsApp/SMS channels paused (cost-bearing)
        * Game Mode XP still tracked silently (re-enable on upgrade)
      - Invoice generation: RevenueCat provides receipts,
        backend supplements with team-specific invoices
    Drizzle Schema:
      subscriptions table:
        - userId (text, PK, references users.id)
        - plan (text, enum: free|pro_monthly|pro_annual|pro_lifetime|team)
        - status (text, enum: active|trial|grace_period|expired|cancelled)
        - revenuecatSubscriberId (text, unique)
        - currentPeriodStart (timestamp)
        - currentPeriodEnd (timestamp)
        - trialEndDate (timestamp, nullable)
        - cancelledAt (timestamp, nullable)
        - seats (integer, default 1)
        - createdAt (timestamp, default now())
        - updatedAt (timestamp, default now())
      coupons table:
        - id (uuid, PK)
        - code (text, unique, uppercase)
        - discountPercent (integer, check 1-100)
        - maxUses (integer, default 1000)
        - currentUses (integer, default 0)
        - expiresAt (timestamp)
        - createdAt (timestamp, default now())
      invoices table:
        - id (uuid, PK)
        - userId (text, references users.id)
        - amount (numeric(10,2))
        - currency (text, default 'USD')
        - description (text)
        - pdfUrl (text, nullable)
        - createdAt (timestamp, default now())

  DATA FLOW:
  ----------
    1. User navigates to /settings/billing (from M1 or Profile)
    2. billingProvider fetches in parallel:
       a. GET /billing/subscription (current plan from backend)
       b. RevenueCat SDK getOfferings() (available plans with localized prices)
       c. GET /billing/invoices (if Pro/Team)
    3. Free user path:
       a. PlanComparisonTable renders Free vs Pro features
       b. User selects pricing period (monthly/annual/lifetime)
       c. Optionally enters coupon code -> POST /billing/coupon/validate
       d. Taps Upgrade -> purchases_flutter triggers native purchase flow
       e. RevenueCat handles payment -> webhook fires -> backend updates plan
       f. App polls /billing/subscription until plan updated -> celebration UI
    4. Pro user path:
       a. ManageSubscriptionCard shows current plan details
       b. Change plan: switch between monthly/annual
       c. Cancel: confirmation dialog -> RevenueCat cancellation
       d. Restore purchases: RevenueCat SDK restorePurchases()
    5. Team user path:
       a. TeamBillingCard shows seats used/total
       b. Add/remove seats: POST /billing/team/seats -> prorated update
       c. Invoice download: presigned URL from MinIO

  INTERACTIONS & ANIMATIONS:
  --------------------------
    - Plan comparison: rows highlight on scroll into view (fade in, 100ms stagger)
    - Feature checkmarks: green check scale-in animation (200ms, bounceOut)
    - Missing features: gold shimmer highlight for "unlock with Pro" rows
    - Pricing toggle: sliding selection indicator with price morph (300ms)
    - Annual savings badge: pulsing gold badge ("Save 33%")
    - Upgrade button: gradient shimmer effect (infinite, subtle)
    - Purchase flow: native store UI (handled by platform)
    - Post-purchase: confetti + "Welcome to Pro!" celebration overlay (2s)
    - Invoice list: slide in from bottom, staggered (80ms per row)
    - Coupon valid: green check animation with discount applied in real-time
    - Coupon invalid: shake animation + red error text

  DSA / ALGORITHMS:
  -----------------
    - Feature matrix comparison: ordered set intersection for plan features
    - Regional pricing: locale-based lookup from RevenueCat offerings
    - Proration calculation: remaining days * per-day cost (server-side)
    - Coupon validation: code lookup + expiry check + usage count check
    - Webhook event deduplication: idempotency key on RevenueCat event ID
    - Eventual consistency: poll-until-updated pattern for plan changes

  TESTS:
  ------
    Unit: 7 (plan comparison logic, pricing calculation, coupon validation,
              seat management math, downgrade feature gating, invoice model,
              webhook event parsing)
    Widget: 7 (comparison table renders, pricing toggle switches correctly,
               upgrade button states, manage subscription card, team billing card,
               invoice list, coupon field validation + error states)
    Integration: 4 (purchase flow mock, webhook -> plan update, coupon apply
                     round-trip, seat add/remove)
    Total: 18 tests


################################################################################
  PART 3: GAME MODE XP SYSTEM (Full Design)
################################################################################

================================================================================
  XP TABLE AND LEVEL SYSTEM
================================================================================

  XP AWARD TABLE:
  ---------------
  | Action                        | XP   | Frequency Cap          |
  |-------------------------------|------|------------------------|
  | Task completed                | +5   | Max 100/day            |
  | Last task of the day (all done)| +20 | 1/day                  |
  | Morning ritual complete       | +25  | 1/day                  |
  | Ghost Mode session complete   | +15  | Max 10/day             |
  | Pomodoro complete             | +10  | Max 20/day             |
  | 7-day streak milestone        | +50  | Once per milestone     |
  | 30-day streak milestone       | +100 | Once per milestone     |
  | 100-day streak milestone      | +500 | Once per milestone     |
  | 365-day streak milestone      | +1000| Once per milestone     |

  LEVEL SYSTEM:
  - Formula: level = floor(totalXp / 500) + 1
  - XP in current level: totalXp % 500
  - XP to next level: 500 - (totalXp % 500)
  - Levels are uncapped (no max level)
  - Level titles are understated: "Level 5" (NOT "Level 5: Task Slayer")
  - Level displayed next to name on Profile (only when Game Mode is on)

  DAILY XP THEORETICAL MAX:
  - 100 tasks * 5 = 500
  - 1 last task bonus = 20
  - 1 ritual = 25
  - 10 ghost sessions * 15 = 150
  - 20 pomodoros * 10 = 200
  - Total theoretical daily max: 895 XP (nearly 2 levels)
  - Realistic daily max (active user): ~100-200 XP

================================================================================
  ACHIEVEMENTS SYSTEM (30 Total)
================================================================================

  CATEGORY: CONSISTENCY (8 achievements)
  ----------------------------------------
  1.  First Step       - Complete your first task                    (1 task)
  2.  First Week       - 7-day completion streak                     (7-day streak)
  3.  Month Strong     - 30-day completion streak                    (30-day streak)
  4.  Century Streak   - 100-day completion streak                   (100-day streak)
  5.  Year of Focus    - 365-day completion streak                   (365-day streak)
  6.  Early Bird       - Complete 10 tasks before 9 AM               (10 early tasks)
  7.  Night Owl        - Complete 10 tasks after 10 PM               (10 late tasks)
  8.  Ritual Master    - Complete morning ritual 30 consecutive days (30 rituals)

  CATEGORY: VOLUME (8 achievements)
  ----------------------------------------
  9.  Getting Started  - Complete 10 tasks total                     (10 tasks)
  10. Productive       - Complete 50 tasks total                     (50 tasks)
  11. Century          - Complete 100 tasks total                    (100 tasks)
  12. Powerhouse       - Complete 500 tasks total                    (500 tasks)
  13. Thousand Club    - Complete 1000 tasks total                   (1000 tasks)
  14. Marathon Day     - Complete 20 tasks in a single day           (20 in 1 day)
  15. Project Done     - Complete all tasks in a project             (1 project)
  16. Five Projects    - Complete all tasks in 5 projects            (5 projects)

  CATEGORY: EXPLORATION (8 achievements)
  ----------------------------------------
  17. Deep Work        - Complete 10 Ghost Mode sessions             (10 sessions)
  18. Zen Master       - Complete 50 Ghost Mode sessions             (50 sessions)
  19. Pomodoro Pro     - Complete 25 Pomodoro sessions               (25 sessions)
  20. Focus Champion   - Accumulate 1000 minutes of focus time       (1000 min)
  21. Connected        - Link 3+ notification channels               (3 channels)
  22. Omnichannel      - Link 5+ notification channels               (5 channels)
  23. Organizer        - Create 10 projects                          (10 projects)
  24. Tagger           - Use 20 different labels/tags                (20 tags)

  CATEGORY: SPECIAL (6 achievements)
  ----------------------------------------
  25. Ghost Buster     - First Ghost Mode session                    (1 session)
  26. Social Starter   - Invite first accountability partner         (1 invite)
  27. Challenger       - Win first challenge                         (1 win)
  28. Speed Demon      - Complete a task within 1 minute of creation (1 fast task)
  29. Zero Inbox       - Have zero active tasks (all completed)      (0 pending)
  30. Easter Egg       - Find the hidden action in the app           (secret)

  ACHIEVEMENT RULES:
  - Progressive reveal: only show achievements where progress > 50%
    (prevents overwhelming "wall of locked badges" pattern)
  - Each unlock also unlocks a theme variant OR completion sound
    (tangible reward beyond the badge itself)
  - Descriptions are factual: "Completed 100 tasks" (not fantasy language)
  - No retroactive unlock spam: when Game Mode first enabled, unlock
    already-earned achievements one at a time with 500ms delay between

  ACHIEVEMENT UNLOCK REWARDS:
  | Achievement      | Reward                                |
  |-----------------|---------------------------------------|
  | First Week      | Unlock "Dawn" completion sound        |
  | Century         | Unlock "Emerald" color scheme         |
  | Deep Work       | Unlock "Midnight Calm" theme variant  |
  | Year of Focus   | Unlock "Golden" app icon              |
  | Thousand Club   | Unlock "Champion" profile badge       |
  (5 examples; all 30 achievements have associated rewards)

================================================================================
  LEADERBOARDS
================================================================================

  DESIGN PRINCIPLES:
  - All opt-in, never default (user must explicitly join)
  - No global leaderboard (prevents toxic comparison and fake accounts)
  - Soft language: "5th of 12 friends" NOT "#5 RANK"
  - Weekly reset with monthly view option

  FRIENDS LEADERBOARD:
  - Invite-only (share link or add from accountability partners)
  - Shows: rank, avatar, display name, weekly XP earned
  - Max 50 friends on leaderboard
  - Position format: "5th of 12 friends"
  - Filter: This Week | This Month

  TEAM LEADERBOARD (Team plan):
  - Automatically includes team members (with opt-in per member)
  - Shows: rank, avatar, display name, weekly XP earned
  - Position format: "3rd of 8 team members"
  - Filter: This Week | This Month

  BACKEND: PostgreSQL materialized view (refreshed every 5 min via pg_cron):
    CREATE MATERIALIZED VIEW leaderboard_weekly AS
    SELECT
      user_id,
      SUM(xp_amount) AS weekly_xp,
      dense_rank() OVER (ORDER BY SUM(xp_amount) DESC) AS rank
    FROM xp_ledger
    WHERE earned_at >= date_trunc('week', NOW())
    GROUP BY user_id;

    CREATE MATERIALIZED VIEW leaderboard_monthly AS
    SELECT
      user_id,
      SUM(xp_amount) AS monthly_xp,
      dense_rank() OVER (ORDER BY SUM(xp_amount) DESC) AS rank
    FROM xp_ledger
    WHERE earned_at >= date_trunc('month', NOW())
    GROUP BY user_id;

  LEADERBOARD QUERY (friends scope):
    SELECT lb.user_id, u.display_name, u.avatar_url, lb.weekly_xp, lb.rank
    FROM leaderboard_weekly lb
    JOIN users u ON lb.user_id = u.id
    WHERE lb.user_id IN (SELECT friend_id FROM friend_list WHERE user_id = ?)
       OR lb.user_id = ?
    ORDER BY lb.rank ASC
    LIMIT 50;

================================================================================
  CHALLENGES
================================================================================

  DESIGN:
  - 1 active challenge at a time per user (prevents challenge fatigue)
  - Duration: exactly 7 days from acceptance
  - Auto-resolves at end of week via BullMQ delayed job
  - Winner gets unique badge variant (e.g., "Challenge Champion: Week 12")
  - No money stakes (removed -- too aggressive for default UX)
  - Loser gets participation badge ("Good Sport")

  CHALLENGE TYPES:
  | Type             | Goal Example              | Measurement      |
  |-----------------|---------------------------|------------------|
  | Tasks Completed | "Complete 10 tasks"       | COUNT completions|
  | XP Earned       | "Earn 200 XP"             | SUM xp_amount    |
  | Focus Minutes   | "Focus for 120 minutes"   | SUM focus_minutes|

  CHALLENGE FLOW:
  1. User A creates challenge: selects friend, type, target value
  2. Friend receives push notification: "Alice challenged you!"
  3. Friend has 24h to accept or decline (auto-decline after 24h)
  4. On accept: 7-day timer starts via BullMQ delayed job
  5. Both users see progress on Challenge card in Game Mode screen
  6. At end: BullMQ job fires, compares progress, determines winner
  7. Winner notification: "You won the challenge! +bonus badge"
  8. Loser notification: "Great effort! You earned a participation badge"

================================================================================
  DRIZZLE SCHEMA (Gamification Tables)
================================================================================

  xpLedger table:
    - id (uuid, PK, default gen_random_uuid())
    - userId (text, NOT NULL, references users.id, indexed)
    - xpAmount (integer, NOT NULL, check > 0)
    - source (text, NOT NULL, enum: task_completed|last_task_bonus|
      ritual_completed|ghost_mode_completed|pomodoro_completed|
      streak_milestone|challenge_bonus|achievement_bonus)
    - sourceId (text, nullable, references the triggering entity)
    - earnedAt (timestamp, NOT NULL, default now(), indexed)
    - INDEX: (userId, earnedAt) for leaderboard aggregation
    - INDEX: (userId, source, earnedAt) for daily cap enforcement

  achievementUnlocks table:
    - id (uuid, PK, default gen_random_uuid())
    - userId (text, NOT NULL, references users.id, indexed)
    - achievementId (text, NOT NULL, e.g. 'first_week', 'century')
    - unlockedAt (timestamp, NOT NULL, default now())
    - rewardType (text, enum: theme|sound|icon|badge)
    - rewardId (text, references the unlocked reward asset)
    - UNIQUE: (userId, achievementId) -- prevent duplicate unlocks

  achievementDefinitions table:
    - id (text, PK, e.g. 'first_week')
    - title (text, NOT NULL)
    - description (text, NOT NULL)
    - category (text, NOT NULL, enum: consistency|volume|exploration|special)
    - conditionType (text, NOT NULL, enum: streak_days|total_tasks|
      total_sessions|total_minutes|channel_count|project_count|
      tag_count|single_event)
    - conditionValue (integer, NOT NULL, threshold to unlock)
    - rewardType (text, NOT NULL)
    - rewardId (text, NOT NULL)
    - sortOrder (integer, NOT NULL)

  challenges table:
    - id (uuid, PK, default gen_random_uuid())
    - challengerId (text, NOT NULL, references users.id)
    - challengeeId (text, NOT NULL, references users.id)
    - goalType (text, NOT NULL, enum: tasks_completed|xp_earned|focus_minutes)
    - targetValue (integer, NOT NULL)
    - challengerProgress (integer, NOT NULL, default 0)
    - challengeeProgress (integer, NOT NULL, default 0)
    - status (text, NOT NULL, default 'pending', enum:
      pending|active|completed|cancelled|declined)
    - winnerId (text, nullable, references users.id)
    - createdAt (timestamp, NOT NULL, default now())
    - acceptedAt (timestamp, nullable)
    - resolvedAt (timestamp, nullable)
    - expiresAt (timestamp, NOT NULL)
    - INDEX: (challengerId, status) for active challenge lookup
    - INDEX: (challengeeId, status) for pending challenge lookup

  friendList table:
    - userId (text, NOT NULL, references users.id)
    - friendId (text, NOT NULL, references users.id)
    - createdAt (timestamp, NOT NULL, default now())
    - PRIMARY KEY: (userId, friendId)
    - CHECK: userId != friendId

  userGameState table:
    - userId (text, PK, references users.id)
    - gameModeEnabled (boolean, NOT NULL, default false)
    - totalXp (integer, NOT NULL, default 0)
    - level (integer, NOT NULL, default 1)
    - updatedAt (timestamp, NOT NULL, default now())

================================================================================
  BULLMQ WORKERS (Gamification)
================================================================================

  ACHIEVEMENT-CHECKER WORKER:
  Queue: gamification:achievement-check
  Trigger: fires on every XP grant event
  Logic:
    1. Receive event: { userId, source, sourceId, xpAmount }
    2. Load user's current stats from database:
       - total tasks completed
       - current streak days
       - total ghost mode sessions
       - total pomodoro sessions
       - total focus minutes
       - connected channel count
       - project count, tag count
    3. Load user's already-unlocked achievement IDs
    4. For each achievement definition NOT yet unlocked:
       a. Evaluate condition: compare user stat vs conditionValue
       b. If condition met: INSERT into achievement_unlocks
       c. Push WebSocket event: { type: 'achievement_unlocked', achievementId }
       d. Grant bonus XP (if applicable): INSERT into xp_ledger
    5. Early exit optimization: skip categories where no relevant stat changed
       (e.g., if source is 'task_completed', skip Exploration category
       unless it involves task counts)

  CHALLENGE-RESOLVER WORKER:
  Queue: gamification:challenge-resolve
  Trigger: BullMQ delayed job, fires 7 days after challenge acceptance
  Logic:
    1. Load challenge by ID
    2. If status != 'active': skip (already resolved/cancelled)
    3. Compare challengerProgress vs challengeeProgress
    4. Set winnerId (higher progress wins; tie = both win)
    5. Set status = 'completed', resolvedAt = now()
    6. Award winner: unique badge variant + bonus XP
    7. Award loser: "Good Sport" participation badge
    8. Send push notifications to both participants
    9. Update leaderboard (XP change triggers materialized view refresh)

  CHALLENGE-EXPIRY WORKER:
  Queue: gamification:challenge-expire
  Trigger: BullMQ delayed job, fires 24h after challenge creation
  Logic:
    1. Load challenge by ID
    2. If status == 'pending' (not accepted): set status = 'cancelled'
    3. Notify challenger: "Your challenge was not accepted"

  LEADERBOARD-REFRESH WORKER:
  Queue: gamification:leaderboard-refresh
  Trigger: BullMQ repeatable job, cron: every 5 minutes
  Logic:
    1. REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_weekly
    2. REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_monthly
    3. Log refresh duration for monitoring

================================================================================
  ANTI-CHEAT MEASURES
================================================================================

  SERVER-SIDE VALIDATION:
  - All XP grants happen server-side only (client never sends XP amounts)
  - Rate limits per action type per day:
    * task_completed: max 100/day
    * pomodoro_completed: max 20/day
    * ghost_mode_completed: max 10/day
    * ritual_completed: max 1/day
    * last_task_bonus: max 1/day
  - Rate limit implementation: Valkey sliding window counter
    Key pattern: ratelimit:xp:{userId}:{source}:{date}
    TTL: 24 hours from midnight in user timezone

  ANOMALY DETECTION:
  - If user completes > 50 tasks in 1 hour: flag for review
  - If user creates + completes task in < 5 seconds: no XP awarded
    (prevents "spam create + complete" exploit)
  - If user earns > 500 XP in 1 hour: rate limit XP grants for rest of hour
  - All flagged events logged to anomaly_log table for admin review

  XP INTEGRITY:
  - xp_ledger is append-only (no UPDATE or DELETE in application code)
  - totalXp in userGameState is derived from SUM(xp_ledger) periodically
    (BullMQ job reconciles every hour, catches any drift)
  - Achievement unlocks are idempotent (UNIQUE constraint prevents duplicates)


################################################################################
  PART 4: ACCESSIBILITY FEATURES (Full Design)
################################################################################

================================================================================
  ACCESSIBILITY OVERVIEW
================================================================================

  UNJYNX targets WCAG 2.1 AA compliance as the baseline, with several
  innovations that go beyond standard accessibility requirements. These
  features serve users with visual, auditory, motor, cognitive, and
  learning disabilities, and also improve UX for all users in various
  contexts (bright sunlight, one-handed use, noisy environments).

  IMPLEMENTATION APPROACH:
  - Accessibility is not a separate mode -- it is integrated into the core app
  - Settings in M1 > Accessibility section control all features
  - Each feature can be toggled independently
  - System accessibility settings (TalkBack, VoiceOver, reduce motion,
    font scaling) are detected and respected automatically
  - All features gracefully degrade if hardware is not available
    (e.g., haptics on devices without haptic engine)

  FLUTTER PACKAGES:
  - flutter_tts 4.x (text-to-speech for Voice-First Mode)
  - audioplayers 6.x (spatial audio cues)
  - accessibility_tools 1.x (dev-time accessibility overlay)
  - semantics_debugger (built-in, dev-time semantics tree visualization)
  - flutter/services.dart (HapticFeedback for haptic semantics)

================================================================================
  FEATURE 1: HAPTIC SEMANTICS
================================================================================

  DESCRIPTION:
  Different vibration patterns convey task priority without looking at screen.
  When scrolling through tasks or receiving notifications, the device vibrates
  differently based on priority level. Useful for users with visual impairments,
  or anyone who wants eyes-free awareness.

  VIBRATION PATTERNS:
  | Priority | Pattern                  | Flutter API Call                       |
  |----------|--------------------------|----------------------------------------|
  | Low      | 1 light pulse (50ms)     | HapticFeedback.lightImpact()           |
  | Medium   | 2 light pulses (50ms x2) | lightImpact() + delay(80) + lightImpact() |
  | High     | 3 medium pulses (80ms x3)| mediumImpact() x3 with 100ms gaps      |
  | Urgent   | Long buzz (200ms)        | HapticFeedback.heavyImpact()           |

  TRIGGER POINTS:
  - Scrolling past a task in list view (fires once per task as it enters viewport)
  - Task notification received (fires with notification)
  - Task detail screen opens (fires once on open)
  - Swipe action feedback (done vs snooze have different patterns)

  IMPLEMENTATION:
  - HapticService class wrapping Flutter HapticFeedback API
  - Pattern execution: sequential vibration with timed delays using Future.delayed
  - Respects haptic feedback toggle in Settings (M1)
  - Graceful degradation: check HapticFeedback availability, no-op if unsupported
  - Battery consideration: haptics disabled when battery < 10% (system reports)

  STATE: hapticSemanticsEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 3 (pattern generation per priority, disabled state, battery low bypass)

================================================================================
  FEATURE 2: AUDIO SPATIAL CUES
================================================================================

  DESCRIPTION:
  In earphone mode, completed task sounds come from the left channel, new task
  sounds from the right channel. Creates spatial awareness of progress without
  visual dependency. Users build unconscious association: left = done, right = new.

  AUDIO MAPPING:
  | Event          | Channel | Sound                | Duration |
  |----------------|---------|----------------------|----------|
  | Task completed | Left    | Soft chime (ascending)| 400ms   |
  | New task added | Right   | Soft tone (neutral)  | 300ms    |
  | Task overdue   | Center  | Low pulse (attention) | 500ms   |
  | Streak achieved| Both    | Celebration jingle    | 800ms   |

  IMPLEMENTATION:
  - AudioSpatialService using audioplayers package
  - Stereo panning: AudioPlayer.setBalance(-1.0 for left, 1.0 for right, 0.0 center)
  - Pre-loaded audio assets (small WAV files, <50KB each)
  - Headphone detection: use audioplayers or platform channel to check
    if headphones connected; spatial cues only active with headphones
  - Falls back to mono (centered) when using device speakers
  - Volume respects system media volume
  - Can be combined with haptic semantics for multi-sensory feedback

  STATE: spatialAudioEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 3 (stereo balance per event type, headphone detection logic,
             speaker fallback to mono)

================================================================================
  FEATURE 3: VOICE-FIRST MODE
================================================================================

  DESCRIPTION:
  Full conversational task management with zero visual dependency. Users
  activate Voice-First Mode and interact entirely through speech:
  "What's next?" -> AI reads top task -> "Done" -> marks complete -> "Next?"
  Designed for visually impaired users, hands-busy contexts (cooking, driving),
  and users who prefer voice interaction.

  CONVERSATION FLOW:
  1. Activate: "Hey UNJYNX" or tap floating mic button
  2. System: "You have 5 tasks today. Your top task is: Buy groceries,
     due at 3 PM. Say DONE, SNOOZE, SKIP, or NEXT."
  3. User: "Done" -> System: "Buy groceries marked complete. 4 tasks remaining.
     Next task: Review PR for UNJYNX, due at 5 PM."
  4. User: "Snooze" -> System: "Snoozed for 1 hour. Next task:..."
  5. User: "Add task: Call dentist tomorrow at 10 AM"
     -> System: "Added: Call dentist, due tomorrow at 10 AM."
  6. User: "What's my streak?" -> System: "You're on a 12-day streak. Keep going!"

  COMMANDS:
  | Voice Command           | Action                           |
  |------------------------|----------------------------------|
  | "What's next?"         | Read top priority task           |
  | "Done" / "Complete"    | Mark current task complete       |
  | "Snooze"               | Snooze current task 1 hour       |
  | "Skip" / "Next"        | Move to next task                |
  | "Add task: [text]"     | Create new task with NLP parsing |
  | "What's my streak?"    | Read current streak count        |
  | "How many tasks today?"| Read today's task count          |
  | "Read my list"         | Read all today's tasks           |
  | "Stop" / "Exit"        | Exit Voice-First Mode            |

  IMPLEMENTATION:
  - flutter_tts for text-to-speech output (configurable voice, speed, pitch)
  - speech_to_text package for voice input (or platform speech recognition)
  - VoiceCommandParser: maps recognized text to action enum
  - NLP for "Add task": basic regex extraction of title + date/time
    (v1 rule-based, v2 AI-powered via Ollama/Claude)
  - Floating mic button: visible in all screens when Voice-First enabled
  - Background listening: optional always-on mode with wake word
  - Conversation state machine: tracks current task context for
    follow-up commands ("Done" knows which task to complete)

  STATE:
  - voiceFirstEnabledProvider (StateNotifier<bool>)
  - voiceConversationProvider (AsyncNotifier, manages conversation state machine)
  - currentVoiceTaskProvider (StateProvider<Task?>, task being discussed)
  - ttsSettingsProvider (StateNotifier: voice, speed, pitch)

  PACKAGES: flutter_tts 4.x, speech_to_text 7.x (or platform channels)

  TESTS: 5 (command parsing for each command type, conversation state transitions,
             NLP date extraction, TTS output generation, error handling for
             unrecognized commands)

================================================================================
  FEATURE 4: HIGH CONTRAST GHOST MODE
================================================================================

  DESCRIPTION:
  When Ghost Mode is active and High Contrast is enabled, the UI switches to
  maximum contrast: pure black background (#000000), pure white text (#FFFFFF),
  gold accents for completion elements. Readable in any lighting condition,
  including direct sunlight. Reduces eye strain during extended focus sessions.

  COLOR SCHEME:
  | Element            | Color          | Hex       |
  |-------------------|----------------|-----------|
  | Background        | Pure black     | #000000   |
  | Primary text      | Pure white     | #FFFFFF   |
  | Secondary text    | Light gray     | #CCCCCC   |
  | Task completion   | Gold           | #FFD700   |
  | Borders/dividers  | Dark gray      | #333333   |
  | Interactive elements | Bright white | #FFFFFF  |
  | Error/overdue     | Bright red     | #FF4444   |

  IMPLEMENTATION:
  - HighContrastGhostTheme: ThemeData with pure black/white values
  - Activated automatically when Ghost Mode starts AND high contrast is enabled
  - Falls back to standard Ghost Mode theme if high contrast is off
  - All widgets must use Theme.of(context) colors (no hardcoded colors)
  - Images/avatars get subtle white border for visibility
  - Minimum contrast ratio: 21:1 (exceeds WCAG AAA 7:1 requirement)

  STATE: highContrastGhostEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 2 (theme colors match spec, contrast ratio calculation passes)

================================================================================
  FEATURE 5: DYSLEXIA MODE
================================================================================

  DESCRIPTION:
  Optimized typography for users with dyslexia: switches body font to
  OpenDyslexic, increases letter spacing by 15%, tints background to warm
  cream (#FFF8E7 on light theme). These changes are evidence-based:
  increased spacing and weighted bottoms of letters reduce character rotation
  and improve readability for dyslexic readers.

  TYPOGRAPHY CHANGES:
  | Property        | Default           | Dyslexia Mode       |
  |----------------|-------------------|---------------------|
  | Body font      | System default    | OpenDyslexic        |
  | Letter spacing | 0.0               | +0.15 em (15%)      |
  | Word spacing   | 0.0               | +0.1 em (10%)       |
  | Line height    | 1.4               | 1.6                 |
  | Background     | Theme default     | #FFF8E7 (light) / #1A1814 (dark) |
  | Paragraph width| Unrestricted      | Max 70 chars per line|

  IMPLEMENTATION:
  - OpenDyslexic font bundled as asset (pubspec.yaml font family)
  - DyslexiaThemeExtension: ThemeExtension class with all overrides
  - Applied via Theme.of(context) -- all Text widgets automatically adapt
  - Background tint: Scaffold background color override
  - Max line width: ConstrainedBox wrapper in reading-heavy screens
  - Font size respects system font scaling (multiplicative, not override)

  STATE: dyslexiaModeEnabledProvider (StateNotifier<bool>, persisted in Drift)

  ASSET: fonts/OpenDyslexic-Regular.otf, OpenDyslexic-Bold.otf (bundled, ~200KB)

  TESTS: 3 (font family applied correctly, letter spacing calculation,
             background tint per theme mode)

================================================================================
  FEATURE 6: MOTOR ACCESSIBILITY
================================================================================

  DESCRIPTION:
  Large touch targets mode for users with motor impairments (tremors, limited
  dexterity, prosthetics). All interactive elements become minimum 64x64dp
  (vs standard 48x48dp), with extra spacing between elements to prevent
  accidental taps.

  CHANGES:
  | Element         | Standard Size | Motor Accessible Size | Spacing  |
  |----------------|---------------|----------------------|----------|
  | Buttons        | 48x48dp       | 64x64dp              | +16dp    |
  | List items     | 56dp height   | 72dp height          | +8dp gap |
  | Checkboxes     | 24x24dp       | 40x40dp              | +16dp    |
  | FAB            | 56x56dp       | 72x72dp              | n/a      |
  | Icon buttons   | 40x40dp       | 56x56dp              | +12dp    |
  | Text fields    | 48dp height   | 64dp height          | +12dp    |
  | Tab targets    | 48dp          | 64dp                 | +8dp     |
  | Swipe threshold| 20dp          | 40dp                 | n/a      |

  IMPLEMENTATION:
  - MotorAccessibilityTheme: ThemeExtension with size overrides
  - Custom wrappers: AccessibleButton, AccessibleListTile, AccessibleCheckbox
    that read theme extension and apply sizes
  - All gesture detectors increase hit-test area via padding
  - Swipe actions require longer drag distance (40dp vs 20dp) to prevent
    accidental triggers
  - Long-press duration increased to 800ms (vs 500ms standard)
  - Double-tap window increased to 500ms (vs 300ms standard)

  STATE: motorAccessibilityEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 3 (touch target sizes meet 64dp, spacing calculations, swipe threshold)

================================================================================
  FEATURE 7: COGNITIVE LOAD INDICATOR
================================================================================

  DESCRIPTION:
  Visual indicator that appears when too many tasks are displayed at once.
  Auto-suggests Ghost Mode or filtering to reduce cognitive overload.
  Based on research showing cognitive performance degrades beyond 7 +/- 2
  simultaneously visible items.

  TRIGGER RULES:
  | Condition                          | Action                             |
  |-----------------------------------|------------------------------------|
  | > 7 visible tasks in list         | Show subtle amber indicator        |
  | > 12 visible tasks in list        | Show prominent suggestion banner   |
  | > 5 overdue tasks simultaneously  | Suggest priority filter            |
  | > 3 high-priority tasks visible   | Suggest Ghost Mode (focus on one)  |

  UI COMPONENTS:
  - CognitiveLoadIndicator: positioned at top of task list
    * Amber bar: "A lot on your plate? Try focusing on your top 3."
    * Action buttons: [Enter Ghost Mode] [Filter by Priority] [Dismiss]
  - Auto-dismiss: goes away if user filters or enters Ghost Mode
  - Frequency cap: show max 2x per day (avoid nagging)
  - Learns user preference: if dismissed 5 times, stop showing permanently
    (until re-enabled in Settings)

  IMPLEMENTATION:
  - CognitiveLoadService: monitors visible task count via ScrollController
  - Uses IntersectionObserver pattern (VisibilityDetector package)
  - Thresholds configurable in Settings (default 7/12)
  - Suggestion banner: SlideTransition from top, dismissable

  STATE:
  - cognitiveLoadIndicatorProvider (StateNotifier, tracks visible task count)
  - cognitiveLoadDismissCountProvider (StateNotifier<int>, persisted, tracks dismissals)

  TESTS: 3 (threshold detection at 7 and 12 tasks, dismiss persistence,
             frequency cap enforcement)

================================================================================
  FEATURE 8: SCREEN READER TASK SUMMARIES
================================================================================

  DESCRIPTION:
  Instead of a screen reader reading each individual field of a task card
  (title, priority, due date, project, tags), it receives a natural language
  summary that is faster and more meaningful to listen to.

  STANDARD SCREEN READER OUTPUT (without this feature):
  "Checkbox. Not checked. Buy milk. Text. High. Text. Tomorrow 9 AM. Text.
   Groceries. Text."

  ENHANCED SCREEN READER OUTPUT (with this feature):
  "Buy milk, high priority, due tomorrow at 9 AM, in Groceries project.
   Double-tap to complete, long press for options."

  IMPLEMENTATION:
  - TaskSemantics class: generates natural language summary from Task model
  - Wraps each task card in Semantics widget with computed label
  - Format: "[title], [priority] priority, due [relative time], in [project].
    [action hints]."
  - Relative time: "due in 2 hours", "due tomorrow at 9 AM", "overdue by 3 hours"
  - Priority omitted if 'none' (no clutter for low-info fields)
  - Project omitted if only one project (Inbox)
  - Tags summarized: "tagged work, urgent" (max 3 tags, then "+2 more")

  SEMANTIC ACTIONS:
  | Action          | Semantics Label                  |
  |----------------|----------------------------------|
  | Tap checkbox   | "Complete task: [title]"         |
  | Tap card       | "Open task details: [title]"     |
  | Long press     | "Task options for: [title]"      |
  | Swipe right    | "Complete [title]"               |
  | Swipe left     | "Snooze [title]"                 |

  STATE: screenReaderSummariesEnabledProvider (always on when screen reader detected,
         uses MediaQuery.of(context).accessibleNavigation)

  TESTS: 4 (summary generation for full task, summary with minimal fields,
             relative time formatting, semantic action labels)

================================================================================
  FEATURE 9: COLOR-BLIND PATTERNS
================================================================================

  DESCRIPTION:
  Priority indicators use shape + color instead of color alone. Ensures
  priorities are distinguishable for users with protanopia, deuteranopia,
  tritanopia, and achromatopsia (complete color blindness).

  SHAPE + COLOR MAPPING:
  | Priority | Color    | Shape     | Icon                    |
  |----------|----------|-----------|-------------------------|
  | None     | Gray     | Dash      | Icons.remove            |
  | Low      | Blue     | Circle    | Icons.circle_outlined   |
  | Medium   | Amber    | Triangle  | Icons.change_history    |
  | High     | Orange   | Diamond   | Icons.diamond_outlined  |
  | Urgent   | Red      | Octagon   | Custom octagon path     |

  IMPLEMENTATION:
  - PriorityIndicator widget: renders shape + color based on priority level
  - When color-blind mode is ON: shapes are always visible alongside colors
  - When color-blind mode is OFF: shapes are still present but subtle (outlined)
    -> Shapes are always rendered for consistency; mode controls emphasis
  - Custom octagon: CustomPainter with 8-sided regular polygon path
  - All charts (I2) also use pattern fills (stripes, dots, crosshatch)
    in addition to colors for data differentiation

  CHART PATTERNS (for I2 Progress Dashboard):
  | Data Series | Color    | Pattern       |
  |-------------|----------|---------------|
  | Completed   | Green    | Solid fill    |
  | Overdue     | Red      | Diagonal stripes |
  | Pending     | Amber    | Dots          |
  | Focus time  | Purple   | Crosshatch    |

  STATE: colorBlindModeEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 3 (correct shape per priority, octagon path generation,
             chart pattern rendering)

================================================================================
  FEATURE 10: ONE-HANDED MODE
================================================================================

  DESCRIPTION:
  Shrinks the active UI area to the bottom half of the screen, making all
  actions reachable with one thumb. Essential for users with one hand, users
  holding something in the other hand, or anyone on a large phone.

  LAYOUT CHANGES:
  | Element            | Normal Position       | One-Handed Position    |
  |-------------------|-----------------------|------------------------|
  | App bar / title   | Top                   | Middle of screen       |
  | Task list         | Full height           | Bottom 50% of screen   |
  | FAB               | Bottom right          | Bottom right (same)    |
  | Tab bar           | Bottom                | Bottom (same)          |
  | Action menus      | Center / Top          | Bottom sheet always    |
  | Search bar        | Top                   | Bottom of visible area |
  | Dialogs           | Center                | Bottom-aligned         |

  IMPLEMENTATION:
  - OneHandedModeWrapper: widget that wraps Scaffold body with
    Align(alignment: Alignment.bottomCenter) + SizedBox(height: screenHeight * 0.55)
  - Top 45% of screen shows muted, non-interactive view of content above
    (blurred or dimmed) with "Tap to scroll up" hint
  - All dialogs and pickers use BottomSheet instead of Dialog when
    one-handed mode is active
  - Swipe down from middle of screen: expand to full height temporarily
  - Auto-detect: if user consistently interacts only with bottom half
    (tracked over 7 days), suggest one-handed mode

  STATE: oneHandedModeEnabledProvider (StateNotifier<bool>, persisted in Drift)

  TESTS: 3 (layout constraint to bottom 50%, dialog -> bottom sheet conversion,
             auto-detect suggestion logic)

================================================================================
  ACCESSIBILITY SETTINGS UI (in M1 Settings Screen)
================================================================================

  SECTION: Accessibility (added to M1 Settings Screen)
  Route: /settings/accessibility

  WIDGETS:
  - AccessibilitySettingsScreen (Scaffold with toggle list)
  - HapticSemanticsToggle (SwitchListTile + description)
  - SpatialAudioToggle (SwitchListTile + "requires headphones" subtitle)
  - VoiceFirstModeToggle (SwitchListTile + voice speed/pitch sub-settings)
  - HighContrastGhostToggle (SwitchListTile + preview swatch)
  - DyslexiaModeToggle (SwitchListTile + font preview)
  - MotorAccessibilityToggle (SwitchListTile + "larger touch targets" subtitle)
  - CognitiveLoadToggle (SwitchListTile + threshold adjuster)
  - ColorBlindModeToggle (SwitchListTile + shape preview row)
  - OneHandedModeToggle (SwitchListTile + "reachable with one thumb" subtitle)
  - AccessibilityQuickAction (floating button in all screens when any
    accessibility feature is active, opens quick-toggle bottom sheet)

  STATE: accessibilitySettingsProvider (AsyncNotifier, manages all toggles,
         persisted in Drift, NOT synced to server -- device-specific)

  DRIFT TABLE:
  - accessibility_settings (key TEXT PK, enabled BOOLEAN DEFAULT false)
    Keys: haptic_semantics, spatial_audio, voice_first,
          high_contrast_ghost, dyslexia_mode, motor_accessibility,
          cognitive_load, color_blind_patterns, one_handed_mode

  TOTAL ACCESSIBILITY TESTS:
  - Haptic Semantics: 3
  - Spatial Audio: 3
  - Voice-First Mode: 5
  - High Contrast Ghost: 2
  - Dyslexia Mode: 3
  - Motor Accessibility: 3
  - Cognitive Load: 3
  - Screen Reader Summaries: 4
  - Color-Blind Patterns: 3
  - One-Handed Mode: 3
  - Settings UI: 4
  Total: 36 accessibility tests

================================================================================
  SUMMARY
================================================================================

  SCREENS SPECIFIED: 9
    Phase 3: J5 (Notification Preferences), J6 (SMS Connection)
    Phase 4: I2 (Progress Dashboard Pro), I3 (Accountability Partners Pro),
             I4 (Game Mode Pro), L1 (Profile), L2 (Edit Profile),
             M1 (Settings), M2 (Plan & Billing)

  SYSTEMS SPECIFIED: 2
    Game Mode XP System (full design with Drizzle schema, BullMQ workers,
                         anti-cheat, 30 achievements, leaderboards, challenges)
    Accessibility Features (10 features with implementation details, 36 tests)

  TEST COUNTS PER SCREEN:
  | Screen | Unit | Widget | Integration | Total |
  |--------|------|--------|-------------|-------|
  | J5     | 6    | 5      | 3           | 14    |
  | J6     | 7    | 5      | 4           | 16    |
  | I2     | 8    | 8      | 4           | 20    |
  | I3     | 6    | 5      | 4           | 15    |
  | I4     | 8    | 7      | 5           | 20    |
  | L1     | 5    | 6      | 3           | 14    |
  | L2     | 6    | 5      | 4           | 15    |
  | M1     | 8    | 10     | 4           | 22    |
  | M2     | 7    | 7      | 4           | 18    |
  | Accessibility |  |     |             | 36    |
  | TOTAL  |      |        |             | 190   |

  DRIZZLE TABLES DEFINED: 12
    notificationPreferences, teamNotificationSettings, smsConnections,
    smsCostLog, smsInboundLog, xpLedger, achievementUnlocks,
    achievementDefinitions, challenges, friendList, userGameState,
    subscriptions, coupons, invoices (+ billing tables from M2)

  BULLMQ WORKERS DEFINED: 4
    achievement-checker, challenge-resolver, challenge-expiry,
    leaderboard-refresh

  API ENDPOINTS DEFINED: 34
    J5: 4, J6: 6, I2: 2, I3: 9, I4: 7, L1: 4, L2: 6,
    M1: 8, M2: 6

  END OF EXPANSION-P34A
`;

fs.writeFileSync(outPath, content, 'utf8');
const actualLines = fs.readFileSync(outPath, 'utf8').split('\n').length;
console.log('EXPANSION-P34A.doc written successfully.');
console.log('Line count:', actualLines);
