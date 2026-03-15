const fs = require('fs');
const path = require('path');

const content = `################################################################################
################################################################################
##                                                                            ##
##   UNJYNX EXPANSION P2A - DETAILED SCREEN SPECIFICATIONS                    ##
##   =====================================================                    ##
##                                                                            ##
##   Company: METAminds                                                       ##
##   Product: UNJYNX - "Break the Satisfactory. Unjynx Your Productivity."    ##
##   Date: March 9, 2026                                                      ##
##   Phase: 2 (Core App Experience)                                           ##
##                                                                            ##
##   Covers: B2 (Personalization), B3 (First Task Prompt),                    ##
##           B4 (Notification Permission), D2 (Task Detail),                  ##
##           D4 (Kanban Board), D5 (Recurring Task Builder),                  ##
##           D6 (Task Templates), NLP Task Parser System                      ##
##                                                                            ##
##   Tech Stack:                                                              ##
##     Flutter 3.27+, Riverpod 3.x (AsyncNotifier, code gen)                  ##
##     Drift 2.32+ (local SQLite), go_router 16.x                             ##
##     freezed + json_serializable for immutable models                       ##
##     Backend: Hono (TypeScript), Drizzle ORM, PostgreSQL 16+               ##
##     Auth: Logto (OIDC, JWT via jose)                                       ##
##     REST API: /api/v1/ prefix, plural nouns, kebab-case                    ##
##     V1 = RULE-BASED only (no ML, no Claude API)                            ##
##                                                                            ##
##   Companion to: COMPREHENSIVE-PHASE-PLAN.doc v3.0                          ##
##                                                                            ##
################################################################################
################################################################################


================================================================================
  TABLE OF CONTENTS
================================================================================

  1. SCREEN B2: Personalization Flow ............. Line ~55
  2. SCREEN B3: First Task Prompt ................ Line ~230
  3. SCREEN B4: Notification Permission .......... Line ~420
  4. NLP TASK PARSER SYSTEM ...................... Line ~560
  5. SCREEN D2: Task Detail ...................... Line ~780
  6. SCREEN D4: Kanban Board ..................... Line ~1020
  7. SCREEN D5: Recurring Task Builder ........... Line ~1230
  8. SCREEN D6: Task Templates ................... Line ~1440


################################################################################
  1. SCREEN B2: PERSONALIZATION FLOW
################################################################################

SCREEN B2: PERSONALIZATION FLOW (Tier: Free)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    A 4-step onboarding wizard that collects user identity, goals, notification
    channel preferences, and daily content category selections. This data seeds
    default project templates, tailors feature visibility, and personalizes the
    daily content feed. Each step is a swipeable PageView with a linear progress
    bar at the top. The flow is skippable but strongly encouraged.

  FRONTEND (Flutter):
    Package: feature_onboarding
    Route: /onboarding/personalize (go_router)
    Sub-routes:
      /onboarding/personalize?step=0  (Identity)
      /onboarding/personalize?step=1  (Goals)
      /onboarding/personalize?step=2  (Channels)
      /onboarding/personalize?step=3  (Daily Content)

    Key Widgets:
      - PersonalizationShell — Scaffold with progress bar (LinearProgressIndicator),
        back arrow, "Skip" text button (top right), PageView body
      - IdentityStep — Grid of 8 visual cards (icon + label) for single-select:
        Student, Professional, Freelancer, Parent, Manager, Executive, Creator, Other.
        Selected card: gold border + checkmark overlay + midnight purple fill
      - GoalsStep — Wrap widget of 8 choice chips for multi-select:
        "Stop forgetting tasks", "Build better habits", "Manage my team",
        "Beat procrastination", "Stay focused", "Work-life balance",
        "Track deadlines", "Get daily motivation". Selected chips: gold fill
      - ChannelSetupStep — ListView of channel tiles, each with icon, name,
        toggle switch, and tier badge. Push (default ON), Telegram ("Connect"
        button with Telegram deep link), Email (pre-filled from signup email).
        WhatsApp/Instagram/SMS/Slack show "Pro" or "Team" badge with
        "Upgrade later" link
      - DailyContentStep — Scrollable grid (2 columns) of 10 category cards:
        Stoic Wisdom, Ancient Indian Wisdom, Growth Mindset, Dark Humor &
        Anti-Motivation, Anime & Pop Culture, Gratitude & Mindfulness,
        Warrior Discipline, Poetic Wisdom, Productivity Hacks, Comeback Stories.
        Each card: custom icon + name + tagline + sample quote preview.
        Tap triggers QuotePreviewSheet (3 sample quotes). Free: 1 category
        selectable. Pro: all 10. TimePicker for delivery time (default 7:00 AM).
        "Skip for now" option
      - QuotePreviewSheet — BottomSheet with PageView of 3 sample quotes,
        dot indicators, "Select" button

    State Management:
      - PersonalizationNotifier (AsyncNotifier) — manages current step index,
        selected identity, selected goals list, channel preferences map,
        selected content categories, delivery time. Persists partial progress
        to Drift on each step completion
      - PersonalizationStepProvider — derived provider that returns current
        step widget and validation status (can proceed to next?)
      - OnboardingProgressProvider — computed progress value (0.0 to 1.0)
        based on step index

    Packages (pub.dev):
      - smooth_page_indicator ^1.2.0 — dot indicators for PageView steps
      - url_launcher ^6.3.0 — Telegram deep link (t.me/UnjynxBot)

    Drift Tables (local):
      - user_preferences — (id, identity TEXT, goals TEXT (JSON array),
        content_categories TEXT (JSON array), content_deliver_at TEXT,
        completed_at INTEGER (epoch), created_at INTEGER, updated_at INTEGER)
      - notification_channel_prefs — (id, channel_type TEXT, is_enabled INTEGER,
        identifier TEXT, verified INTEGER, connected_at INTEGER)

  BACKEND (Hono/TypeScript):
    Endpoints:
      POST /api/v1/users/me/personalization
        Request: {
          identity: string,           // "student" | "professional" | etc.
          goals: string[],            // ["stop_forgetting", "build_habits", ...]
          content_categories: string[], // ["stoic_wisdom", "growth_mindset", ...]
          content_deliver_at: string,  // "07:00" (HH:mm, 24h format)
          channels: { type: string, enabled: boolean, identifier?: string }[]
        }
        Response: {
          success: true,
          data: {
            templates_seeded: number,   // count of templates added
            categories_active: number   // count of content categories enabled
          }
        }
        Auth: JWT required
        Notes: Idempotent. Seeds default project templates based on identity
               (e.g., "Student" gets "Coursework", "Exams", "Study Plan"
               projects). Upserts user_content_prefs rows. Triggers initial
               daily content selection job.

      GET /api/v1/content/categories
        Request: (none)
        Response: {
          success: true,
          data: [{
            slug: string,
            name: string,
            tagline: string,
            icon: string,        // Material icon name
            sample_quotes: [{ text: string, author: string, source: string }],
            is_free: boolean
          }]
        }
        Auth: JWT required
        Notes: Returns all 10 categories with 3 sample quotes each.
               is_free indicates if available on Free tier (always true for
               the first selection, false for additional).

    Business Logic:
      - Identity maps to template sets: Student (5), Professional (5),
        Freelancer (5), Parent (4), Manager (5), Executive (4), Creator (5),
        Other (3). Templates stored in task_templates table with
        is_system=true.
      - Goals influence feature_flags visibility: "Manage my team" shows
        Team upsell earlier. "Build better habits" enables Ritual prompts.
      - Channel setup validates Telegram connection by checking bot API
        for /getUpdates with user chat_id (deferred to Phase 3 channel
        integration). In Phase 2, only stores preference locally.
      - Content category selection: Free tier limited to 1 category.
        Backend enforces with 403 if >1 and plan=free.
      - India locale detection (Accept-Language: hi or timezone Asia/Kolkata):
        pre-select "Ancient Indian Wisdom" category.

  DATA FLOW:
    User selects identity card → IdentityStep widget → PersonalizationNotifier
    updates identity field → (locally cached, no API call yet) →
    User completes all 4 steps → PersonalizationNotifier.submit() →
    Drift upserts user_preferences row → POST /api/v1/users/me/personalization →
    Backend Hono handler validates with Zod → Drizzle upserts user record fields,
    user_content_prefs rows, seeds task_templates → Returns template count →
    PersonalizationNotifier marks complete → go_router navigates to /onboarding/first-task

  INTERACTIONS & ANIMATIONS:
    - Step transition: PageView swipe with Curves.easeInOutCubic (400ms)
    - Identity card select: Scale from 1.0 to 0.95 then 1.0 (spring, 300ms),
      gold border fades in (200ms), checkmark drops in from top (250ms,
      Curves.bounceOut)
    - Goal chip select: Chip expands slightly (1.0→1.05, 150ms) with gold
      fill fade (200ms)
    - Category card tap: Card lifts (elevation 2→8, 200ms), flips to reveal
      quote preview (350ms, Curves.easeInOut)
    - Progress bar: Animated width transition (300ms, Curves.easeOut) on
      each step advance
    - "Continue" button: Slides up from bottom (200ms) when step validation
      passes, pulse animation on idle (2s loop, subtle scale 1.0→1.02)
    - Skip button press: Gentle fade out of current content (200ms) before
      navigating

  DSA / ALGORITHMS:
    - Template seeding (HashMap): O(1) lookup by identity key to retrieve
      template set. Identity string maps to pre-defined List<TaskTemplate>.
    - Locale detection (String matching): O(1) check of Accept-Language
      header or timezone string for India auto-suggestion.
    - Content category filtering (Set): O(1) membership check for Free tier
      limit enforcement. selectedCategories.length <= maxForTier.

  TESTS (target count):
    - Unit: 14 (PersonalizationNotifier state transitions per step, identity
      mapping to templates, goals list serialization, category limit
      enforcement for Free tier, delivery time parsing, channel prefs
      serialization)
    - Widget: 10 (IdentityStep renders 8 cards and handles selection,
      GoalsStep multi-select and deselect, ChannelSetupStep toggles and
      tier badges, DailyContentStep category grid and quote preview sheet,
      progress bar advances correctly, Skip button navigates)
    - Integration: 4 (Full 4-step flow completion saves to Drift, API call
      sends correct payload, partial completion resumes at correct step,
      Free tier category limit enforced end-to-end)


################################################################################
  2. SCREEN B3: FIRST TASK PROMPT
################################################################################

SCREEN B3: FIRST TASK PROMPT (Tier: Free)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    The climactic moment of onboarding where the user creates their very first
    task. Presents a prominent NLP-powered text input that parses natural
    language like "Buy milk Monday 9am" into structured fields (title, date,
    time, priority). Optionally supports voice input via speech_to_text. On
    successful creation, plays a "curse broken" animation and transitions to
    the Home screen. This screen cements the user's first value moment.

  FRONTEND (Flutter):
    Package: feature_onboarding
    Route: /onboarding/first-task (go_router)

    Key Widgets:
      - FirstTaskScreen — Full-screen with midnight purple gradient background,
        large heading "Create your first task", subtitle "Go ahead, say it
        however you want", centered NLP text input, voice button, parsed
        result preview card, submit button
      - NlpTaskInput — Custom TextField with real-time parsing. As user types,
        parsed fields appear below in ParsedFieldChips. Placeholder text
        cycles through examples: "Buy milk Monday 9am", "Call dentist",
        "Finish report by Friday" (fade transition every 3 seconds)
      - ParsedFieldChips — Row of Chip widgets showing extracted fields:
        title (always), date (calendar icon), time (clock icon), priority
        (flag icon, color-coded). Each chip is tappable to manually edit
        the parsed value
      - VoiceInputButton — Circular FAB with microphone icon. Pulsates
        when recording. Uses speech_to_text to capture spoken input,
        feeds result into NlpTaskInput
      - CurseBrokenAnimation — Full-screen overlay: golden shatter effect
        (chain-breaking visual), progress ring nudges from 0% to first
        increment, "Your journey begins!" text fades in. Duration 2.5s.
        Uses Lottie animation file
      - TaskConfirmationCard — Card previewing the parsed task with all
        extracted fields, "Looks good?" prompt, "Edit" and "Create" buttons

    State Management:
      - FirstTaskNotifier (AsyncNotifier) — manages raw input text, parsed
        task fields (NlpParseResult), voice recording state (idle/recording/
        processing), submission state (idle/submitting/success/error)
      - NlpParserProvider — Stateless provider wrapping NlpTaskParser.parse()
        method. Accepts raw string, returns NlpParseResult (freezed model
        with title, dateTime, priority, projectName, confidence fields)
      - VoiceInputProvider — Manages speech_to_text lifecycle (init, start,
        stop, dispose), streams partial results

    Packages (pub.dev):
      - speech_to_text ^7.0.0 — Voice-to-text for task input
      - lottie ^3.1.0 — "Curse broken" celebration animation
      - intl ^0.19.0 — Date/time formatting and locale-aware parsing

    Drift Tables (local):
      - tasks — (id TEXT PK, title TEXT, description TEXT, status TEXT
        DEFAULT 'pending', priority TEXT DEFAULT 'p4', due_at INTEGER,
        energy TEXT, project_id TEXT FK, user_id TEXT, section_id TEXT,
        rrule TEXT, est_minutes INTEGER, actual_minutes INTEGER,
        is_deleted INTEGER DEFAULT 0, completed_at INTEGER, sort_order REAL,
        created_at INTEGER, updated_at INTEGER, sync_status TEXT)

  BACKEND (Hono/TypeScript):
    Endpoints:
      POST /api/v1/tasks
        Request: {
          title: string,
          description?: string,
          status?: "pending" | "in_progress" | "done",
          priority?: "p1" | "p2" | "p3" | "p4",
          due_at?: string,             // ISO 8601 datetime
          energy?: "low" | "medium" | "high" | "peak",
          project_id?: string,
          section_id?: string,
          rrule?: string,              // RFC 5545 RRULE string
          est_minutes?: number,
          tags?: string[],
          subtasks?: { title: string, sort_order: number }[]
        }
        Response: {
          success: true,
          data: {
            id: string,
            title: string,
            status: string,
            priority: string,
            due_at: string | null,
            project_id: string | null,
            created_at: string,
            sort_order: number
          }
        }
        Auth: JWT required
        Notes: This is the core task creation endpoint used across the app,
               not just first-task. Generates CUID2 for id. Sets sort_order
               to max+1 within the target section/project. If first task ever
               for this user, sets a "first_task_created" flag on the user
               record for onboarding tracking.

      POST /api/v1/tasks/parse-nlp
        Request: {
          raw_text: string,
          timezone: string,            // e.g., "Asia/Kolkata"
          locale?: string              // e.g., "en-IN"
        }
        Response: {
          success: true,
          data: {
            title: string,
            due_at: string | null,     // ISO 8601 if date/time found
            priority: string | null,   // "p1"-"p4" if priority keyword found
            project_name: string | null, // if project reference found
            confidence: number         // 0.0-1.0 overall parse confidence
          }
        }
        Auth: JWT required
        Notes: Backend fallback NLP parser using chrono-node for date/time
               extraction. See NLP TASK PARSER SYSTEM section for full details.
               V1 is rule-based only. Client-side Dart parser is preferred
               (lower latency); backend is fallback for complex expressions.

    Business Logic:
      - First task creation triggers onboarding completion: updates user
        record with onboarding_completed_at timestamp.
      - Task title is required, minimum 1 character, maximum 500 characters.
      - Priority defaults to "p4" (lowest) if not specified.
      - due_at must be a valid ISO 8601 datetime or null.
      - sort_order assigned via: SELECT COALESCE(MAX(sort_order), 0) + 1
        FROM tasks WHERE user_id = ? AND project_id = ? (or IS NULL).
      - If no project_id provided, task goes to the user's "Inbox" (default
        project, auto-created during signup).

  DATA FLOW:
    User types "Buy milk Monday 9am" → NlpTaskInput.onChanged → debounce(300ms)
    → NlpParserProvider.parse(rawText) → NlpTaskParser runs regex pipeline →
    returns NlpParseResult(title: "Buy milk", dateTime: nextMonday9am,
    priority: null, confidence: 0.85) → FirstTaskNotifier updates parsed fields
    → ParsedFieldChips rebuild with extracted date/time chips → User taps
    "Create" → FirstTaskNotifier.submit() → Drift inserts task locally
    (sync_status: 'pending') → POST /api/v1/tasks → Backend Drizzle insert →
    returns task with server id → Drift updates sync_status to 'synced' →
    CurseBrokenAnimation plays → go_router navigates to /onboarding/notification-permission

  INTERACTIONS & ANIMATIONS:
    - Text input focus: Text field border animates from grey to gold (200ms,
      Curves.easeIn), placeholder examples cycle with FadeTransition (3s interval)
    - NLP parse feedback: As fields are extracted, chips slide in from right
      (250ms, Curves.easeOutBack) with subtle bounce
    - Voice button press: Microphone icon scales up (1.0→1.2, 200ms), ring
      pulse animation starts (concentric circles expanding outward, 1s loop),
      background dims slightly (opacity 0.85, 300ms)
    - Voice recording active: Waveform visualization below input field
      (sine wave, amplitude tracks volume level, 60fps)
    - Task confirmation card: Slides up from bottom (300ms, Curves.easeOutCubic),
      fields stagger in left-to-right (50ms delay each)
    - "Create" button press: Button shrinks (scale 0.95, 100ms) then
      springs back (200ms), progress indicator appears inside button
    - Curse broken animation: Screen darkens (200ms), golden particle burst
      from center (Lottie, 1.5s), chain links shatter outward, progress
      ring appears and fills to first increment (spring, 800ms),
      "Your journey begins!" text fades up (400ms), auto-dismiss after 2.5s total
    - Haptic feedback: Light impact on chip appearance, medium impact on
      task creation, heavy impact on curse broken climax

  DSA / ALGORITHMS:
    - NLP Pipeline (Sequential regex + date parser): See NLP TASK PARSER
      SYSTEM section. Pipeline of regex matchers run in priority order.
      O(n) where n = input string length, run per matcher.
    - Debounce (Timer-based): 300ms debounce on text input before triggering
      NLP parse. Prevents excessive parsing during rapid typing.
    - Sort order calculation (SQL MAX aggregate): O(log n) with B-tree
      index on (user_id, project_id, sort_order). Single query to find
      next available position.

  TESTS (target count):
    - Unit: 18 (NlpTaskParser: 12 tests covering date extraction, time
      extraction, priority keywords, combined patterns, edge cases with
      no parseable content, timezone handling. FirstTaskNotifier: 6 tests
      for state transitions, validation, submission flow)
    - Widget: 8 (NlpTaskInput renders and parses in real-time, ParsedFieldChips
      show extracted fields, VoiceInputButton toggles recording state,
      TaskConfirmationCard displays parsed data, CurseBrokenAnimation plays
      on submit, placeholder cycling works)
    - Integration: 4 (Full flow: type text → see parsed fields → confirm →
      animation → navigate. Voice input flow. Backend fallback when client
      parse confidence < 0.5. Offline-first: task created in Drift when
      backend unreachable)


################################################################################
  3. SCREEN B4: NOTIFICATION PERMISSION
################################################################################

SCREEN B4: NOTIFICATION PERMISSION (Tier: Free)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    Requests OS-level notification permission immediately after first task
    creation, when the user has maximum motivation. Uses a custom pre-permission
    screen to explain why notifications matter before triggering the native OS
    dialog. If permission is denied, provides a non-intrusive banner on the Home
    screen with a shortcut to re-enable in Settings. This screen is critical for
    reminder delivery — without notification permission, the core value prop
    (never forget a task) is severely weakened.

  FRONTEND (Flutter):
    Package: feature_onboarding
    Route: /onboarding/notification-permission (go_router)

    Key Widgets:
      - NotificationPermissionScreen — Full-screen with illustration (broken
        chain icon releasing notification bells), heading "UNJYNX needs to
        notify you to break the curse", subtext "You control everything in
        Settings. We only send what you ask for.", two CTAs
      - PermissionIllustration — Custom animated illustration: a padlock
        (representing the "jinx") cracks open and notification bell icons
        float upward with gentle bob animation. Built with CustomPainter
        or pre-rendered Lottie
      - PermissionBenefitsList — Column of 3 benefit rows (icon + text):
        "Never miss a deadline", "Get reminded on YOUR channels",
        "Control exactly when and how". Each row fades in sequentially
        (200ms stagger)
      - AllowButton — Primary gold CTA: "Allow Notifications". Triggers
        OS permission dialog via permission_handler. Full width, prominent
      - SkipButton — Secondary text button: "Maybe Later". Navigates
        to Home without permission. Subtle, not hidden but not competing
      - DeniedBanner — (Used on Home screen, not this screen) A dismissible
        banner: "Notifications are off. You might miss reminders."
        + "Enable" button → opens app settings via permission_handler.
        Banner stored in local prefs, re-shown every 7 days if still denied

    State Management:
      - NotificationPermissionNotifier (AsyncNotifier) — manages permission
        state (unknown/granted/denied/permanentlyDenied), handles permission
        request flow, tracks if user explicitly skipped
      - NotificationStatusProvider — read-only provider that checks current
        OS permission status on app resume (via WidgetsBindingObserver).
        Used across the app to show/hide the DeniedBanner
      - OnboardingCompleteProvider — computed provider that marks onboarding
        as fully complete when this screen is passed (either granted or
        skipped). Updates user_preferences.completed_at in Drift

    Packages (pub.dev):
      - permission_handler ^11.3.0 — Request and check notification
        permission. Handles platform differences (Android 13+ requires
        POST_NOTIFICATIONS, iOS requires UNUserNotificationCenter)
      - app_settings ^5.1.0 — Open OS app settings page when permission
        was permanently denied (only way to re-enable)
      - lottie ^3.1.0 — Animated padlock/bell illustration

    Drift Tables (local):
      - user_preferences — (existing table, adds notification_permission TEXT
        column: 'granted' | 'denied' | 'skipped', permission_asked_at INTEGER)
      - notification_banner_state — (id INTEGER PK, last_dismissed_at INTEGER,
        dismiss_count INTEGER, is_permanently_dismissed INTEGER)

  BACKEND (Hono/TypeScript):
    Endpoints:
      PATCH /api/v1/users/me/onboarding-status
        Request: {
          notification_permission: "granted" | "denied" | "skipped",
          onboarding_completed_at: string   // ISO 8601 datetime
        }
        Response: {
          success: true,
          data: { onboarding_complete: boolean }
        }
        Auth: JWT required
        Notes: Updates the user record with onboarding completion and
               notification permission status. Non-blocking — if this call
               fails, onboarding still completes locally. Fires a "user.
               onboarding_completed" event to EventBus for analytics.

      POST /api/v1/users/me/device-tokens
        Request: {
          token: string,           // FCM token
          platform: "android" | "ios",
          device_id: string        // unique device identifier
        }
        Response: {
          success: true,
          data: { id: string, registered_at: string }
        }
        Auth: JWT required
        Notes: Registers FCM device token for push notifications. Called
               only after permission is granted. Upserts by device_id
               (same device re-registering gets updated token, not duplicated).
               Maximum 5 device tokens per user (oldest removed if exceeded).

    Business Logic:
      - Permission status is informational for backend — the actual permission
        is enforced by the OS. Backend tracks it for analytics and to adjust
        notification channel strategy (e.g., if push denied, prefer
        Telegram/email for reminders).
      - Onboarding is considered complete once the user passes this screen
        regardless of permission choice. Backend sets onboarding_completed_at.
      - FCM token registration happens asynchronously after permission grant.
        Token refresh is handled by FirebaseMessaging.onTokenRefresh listener
        in the mobile app, calling this endpoint again.
      - Device token limit: 5 per user. If exceeded, DELETE oldest token
        before INSERT. Query: DELETE FROM device_tokens WHERE user_id = ?
        AND id NOT IN (SELECT id FROM device_tokens WHERE user_id = ?
        ORDER BY registered_at DESC LIMIT 4).

  DATA FLOW:
    Screen loads → NotificationPermissionNotifier checks current status via
    permission_handler → If already granted (rare): auto-advance to Home →
    User taps "Allow" → permission_handler.request(Permission.notification)
    → OS dialog shown → User grants → NotificationPermissionNotifier updates
    state to 'granted' → FirebaseMessaging.getToken() retrieves FCM token →
    POST /api/v1/users/me/device-tokens registers token → PATCH /api/v1/
    users/me/onboarding-status with permission=granted, onboarding_completed_at
    → Drift updates user_preferences → go_router navigates to / (Home) →
    OnboardingGuard.redirect returns null (onboarding complete, no redirect)

    Denied flow: User taps "Maybe Later" OR denies OS dialog →
    NotificationPermissionNotifier sets state to 'denied'/'skipped' →
    Drift saves preference → PATCH onboarding-status (non-blocking) →
    Navigate to Home → NotificationStatusProvider triggers DeniedBanner
    display on Home screen

  INTERACTIONS & ANIMATIONS:
    - Screen entry: Illustration fades in (400ms), heading slides up from
      bottom (300ms, Curves.easeOutCubic, 100ms delay), benefits list
      items stagger in (200ms each, Curves.easeOut, 300ms initial delay)
    - Padlock animation: Cracks appear (Lottie keyframe at 0.5s), lock
      opens (0.5-1.0s), notification bells float upward with gentle
      bob (1.0-2.5s loop), golden particles emit from broken lock (0.5-1.5s)
    - "Allow" button: Gentle pulse animation on idle (scale 1.0→1.03,
      2s loop, Curves.easeInOut). On tap: scale down 0.95 (100ms), release
      triggers OS dialog
    - Permission granted: Green checkmark appears on illustration (300ms,
      Curves.bounceOut), confetti burst (subtle, 5-8 particles, 1s),
      auto-navigate after 1s delay
    - Permission denied: Illustration dims slightly (opacity 0.7, 300ms),
      "No worries" text appears (fade in, 200ms), auto-navigate after 0.8s
    - "Skip" button: No celebration, gentle fade transition to Home (300ms)

  DSA / ALGORITHMS:
    - Device token eviction (Top-K selection): When user exceeds 5 device
      tokens, find the oldest N-4 tokens to delete. SQL subquery with
      ORDER BY registered_at DESC LIMIT 4 uses B-tree index, O(log n).
    - Permission state machine (Finite State Machine): States: unknown →
      {granted, denied, skipped, permanently_denied}. Transitions are
      deterministic based on OS response. No cycles except unknown→check→
      same state on re-check.
    - Banner re-show logic (Interval timer): Check if
      now - last_dismissed_at > 7 days. O(1) comparison.

  TESTS (target count):
    - Unit: 10 (NotificationPermissionNotifier: state transitions for grant/
      deny/skip, onboarding completion flag, device token registration trigger,
      banner dismissal logic, re-show after 7 days, max 5 tokens enforcement)
    - Widget: 6 (PermissionIllustration renders, benefit list renders 3 items,
      Allow button triggers permission request, Skip button navigates,
      DeniedBanner shows/hides based on permission state, permanently
      denied state opens app settings)
    - Integration: 3 (Full grant flow: allow → FCM token → API → navigate home.
      Full deny flow: skip → navigate home → banner shown. Resume app after
      granting in settings → banner disappears)


################################################################################
  4. NLP TASK PARSER SYSTEM (V1 — Rule-Based)
################################################################################

SYSTEM: NLP TASK PARSER (Tier: Free — basic, Pro — advanced patterns)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    A rule-based natural language parser that extracts structured task fields
    from free-form text input. V1 uses ZERO machine learning — instead relying
    on regex patterns, keyword dictionaries, and the chrono-node library
    (backend) / custom Dart regex (frontend) for date/time extraction. The
    parser runs client-side first (Dart, zero latency) with a backend fallback
    for complex expressions the client cannot handle. This powers the quick
    create input (D1), first task prompt (B3), and voice-to-task flow.

  ARCHITECTURE:
    Dual-parser approach:
    1. CLIENT (Dart) — Primary parser, runs on-device, zero network latency
    2. SERVER (TypeScript) — Fallback parser, uses chrono-node for complex
       date expressions, called when client confidence < 0.5

    Both parsers return the same NlpParseResult structure. Client parser
    covers ~85% of inputs; server handles the remaining ~15% of ambiguous
    date/time expressions.

  ─────────────────────────────────────────────────────────────────────────────
  FRONTEND PARSER (Dart — Client-Side)
  ─────────────────────────────────────────────────────────────────────────────

    Package: unjynx_core (shared across all features)
    File: lib/src/nlp/nlp_task_parser.dart

    CLASS: NlpTaskParser
      Static method: NlpParseResult parse(String rawText, {DateTime? now, String? locale})

    FREEZED MODEL: NlpParseResult
      - title: String (cleaned task title with extracted tokens removed)
      - dateTime: DateTime? (extracted date and/or time, null if not found)
      - priority: Priority? (p1/p2/p3/p4 enum, null if not found)
      - projectName: String? (extracted project reference, null if not found)
      - recurrence: String? (detected recurrence pattern, null if not found)
      - confidence: double (0.0-1.0, overall parse confidence)

    PARSE PIPELINE (executed in order):
      1. PRIORITY EXTRACTION
         Patterns (case-insensitive):
           - "!!", "urgent", "asap", "critical" → P1
           - "!", "important", "high priority", "high pri" → P2
           - "medium priority", "med pri", "normal" → P3
           - "low priority", "low pri", "whenever", "someday" → P4
         Regex: r'\\b(urgent|asap|critical|important|high\\s*pri(?:ority)?|medium\\s*pri(?:ority)?|med\\s*pri|low\\s*pri(?:ority)?|normal|whenever|someday)\\b|(!{2,}|!(?![!=]))'
         Tokens are removed from raw text after extraction.

      2. PROJECT EXTRACTION
         Pattern: "#projectname" or "in [project]" or "for [project]"
         Regex: r'#(\\w[\\w-]*)' for hashtag style
         Regex: r'\\b(?:in|for)\\s+(?:project\\s+)?["\\'](.*?)["\\']' for quoted
         Regex: r'\\b(?:in|for)\\s+(?:project\\s+)(\\w+)\\b' for unquoted single word
         Tokens are removed from raw text after extraction.

      3. RECURRENCE EXTRACTION (basic patterns only)
         Patterns:
           - "every day", "daily" → "FREQ=DAILY"
           - "every week", "weekly" → "FREQ=WEEKLY"
           - "every month", "monthly" → "FREQ=MONTHLY"
           - "every year", "yearly", "annually" → "FREQ=YEARLY"
           - "every weekday", "weekdays" → "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
           - "every monday", "every tue" etc. → "FREQ=WEEKLY;BYDAY=MO" etc.
         Regex: r'\\b(?:every\\s+(?:day|week(?:day)?|month|year|(?:mon|tue|wed|thu|fri|sat|sun)\\w*)|daily|weekly|monthly|yearly|annually)\\b'
         Tokens removed after extraction.

      4. DATE/TIME EXTRACTION (Dart regex — handles ~85% of cases)
         Relative dates:
           - "today" → DateTime.now() (date only, time preserved if set)
           - "tomorrow", "tmrw", "tmr" → now + 1 day
           - "day after tomorrow" → now + 2 days
           - "next week" → now + 7 days (next Monday)
           - "next month" → first of next month
           - "this weekend" → next Saturday
         Named days:
           - "monday", "mon", "tuesday", "tue", etc. → next occurrence
           - "next monday" → monday of next week (even if today is before monday)
         Specific dates:
           - "jan 15", "january 15" → next Jan 15
           - "15 jan", "15 january" → next Jan 15 (DD-MMM format)
           - "1/15", "01/15" → MM/DD (US default) or DD/MM (India locale)
           - "2026-03-15" → ISO format direct parse
         Times:
           - "9am", "9 am", "09:00" → 09:00
           - "9pm", "9 pm", "21:00" → 21:00
           - "9:30am", "9:30 am" → 09:30
           - "noon" → 12:00, "midnight" → 00:00
           - "morning" → 09:00 (default), "afternoon" → 14:00,
             "evening" → 18:00, "night" → 21:00
         Combined:
           - "Monday 9am" → next Monday at 09:00
           - "tomorrow at 3pm" → tomorrow at 15:00
           - "jan 15 at 2:30pm" → next Jan 15 at 14:30
           - "by Friday" → Friday (same as "Friday", "by" stripped)
           - "before March 10" → March 10 (treated as deadline)
         Regex (dates): r'\\b(?:today|tomorrow|tmrw?|day after tomorrow|next\\s+(?:week|month|weekend)|this\\s+weekend|(?:next\\s+)?(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)|(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s+\\d{1,2}|\\d{1,2}\\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)|\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?|\\d{4}-\\d{2}-\\d{2})\\b'
         Regex (times): r'\\b(?:(?:1[0-2]|0?[1-9])(?::[0-5]\\d)?\\s*(?:am|pm)|(?:[01]?\\d|2[0-3]):[0-5]\\d|noon|midnight|morning|afternoon|evening|night)\\b'
         Regex (connectors): r'\\b(?:at|by|before|on|due)\\b' — stripped, not parsed

      5. TITLE CLEANING
         After all extractions, remaining text is the task title:
         - Trim leading/trailing whitespace
         - Collapse multiple spaces to single space
         - Capitalize first letter
         - Remove trailing prepositions ("Buy milk on" → "Buy milk")
         Regex cleanup: r'\\s+(?:at|by|before|on|due|in|for)\\s*$'

      6. CONFIDENCE SCORING
         Base confidence = 0.5
         + 0.2 if date/time extracted successfully
         + 0.1 if priority extracted
         + 0.1 if project extracted
         + 0.1 if title length > 3 characters
         - 0.2 if title is empty after extraction (something went wrong)
         - 0.1 if ambiguous date (e.g., "next" without target)
         Clamped to [0.0, 1.0]

    EXAMPLE PARSES:
      "Buy milk Monday 9am"
        → title: "Buy milk", dateTime: 2026-03-09T09:00, priority: null,
          confidence: 0.8

      "Call dentist tomorrow urgent"
        → title: "Call dentist", dateTime: 2026-03-10T00:00, priority: P1,
          confidence: 0.9

      "Finish report by Friday #work"
        → title: "Finish report", dateTime: 2026-03-13T00:00, priority: null,
          projectName: "work", confidence: 0.9

      "Team standup every weekday 10am !!"
        → title: "Team standup", dateTime: today 10:00, priority: P1,
          recurrence: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", confidence: 1.0

      "Something"
        → title: "Something", dateTime: null, priority: null,
          confidence: 0.6

  ─────────────────────────────────────────────────────────────────────────────
  BACKEND PARSER (TypeScript — Server-Side Fallback)
  ─────────────────────────────────────────────────────────────────────────────

    File: apps/backend/src/services/nlp-parser.ts

    Uses chrono-node for date/time parsing (handles complex expressions
    the Dart regex cannot):
      - "in 3 hours" → now + 3 hours
      - "next Tuesday at half past 2" → next Tuesday 14:30
      - "March 15th, 2026" → 2026-03-15
      - "in 2 weeks" → now + 14 days
      - "end of month" → last day of current month
      - "5 days from now" → now + 5 days

    BACKEND PACKAGES:
      - chrono-node ^2.7.0 — Best-in-class NLP date/time parser (JS)
      - compromise ^14.14.0 — Lightweight NLP for part-of-speech tagging
        (used to identify nouns as task title vs. date modifiers)

    FALLBACK LOGIC:
      1. Client sends { raw_text, timezone, locale } to POST /api/v1/tasks/parse-nlp
      2. Backend runs priority/project extraction (same regex as Dart)
      3. Backend runs chrono.parseDate(text, { timezone }) for date/time
      4. Backend uses compromise(text).nouns() to refine title extraction
      5. Returns NlpParseResult with typically higher confidence than client

    ENDPOINT:
      POST /api/v1/tasks/parse-nlp
        Request: {
          raw_text: string,
          timezone: string,
          locale?: string
        }
        Response: {
          success: true,
          data: {
            title: string,
            due_at: string | null,
            priority: string | null,
            project_name: string | null,
            recurrence: string | null,
            confidence: number
          }
        }
        Auth: JWT required
        Rate limit: 30 requests/minute per user (prevent abuse)
        Notes: V1 rule-based only. V2 will add Claude API for ambiguous
               inputs. Response cached by raw_text hash for 5 minutes
               (Valkey) to avoid re-parsing identical inputs.

  ─────────────────────────────────────────────────────────────────────────────
  CLIENT-SERVER COORDINATION
  ─────────────────────────────────────────────────────────────────────────────

    Flow:
    1. User types in NlpTaskInput → debounce 300ms
    2. NlpTaskParser.parse(text) runs client-side (Dart)
    3. If confidence >= 0.5 → use client result (display chips immediately)
    4. If confidence < 0.5 → call POST /api/v1/tasks/parse-nlp (server fallback)
    5. If server returns higher confidence → replace client result
    6. If server unreachable (offline) → use client result regardless
    7. User can always manually edit any parsed field via chip tap

    The confidence threshold of 0.5 is configurable via remote config
    (feature_flags table). In V2, this will be replaced by a model-based
    confidence score.

  DATA FLOW:
    Raw text → [Client] NlpTaskParser.parse() → NlpParseResult (local) →
    if confidence < 0.5: POST /api/v1/tasks/parse-nlp → [Server]
    chrono-node + compromise + regex → NlpParseResult (server) →
    compare confidence → use higher → display in ParsedFieldChips →
    User confirms → task creation flow

  DSA / ALGORITHMS:
    - Regex pipeline (Sequential matchers): Each pattern matcher runs in
      O(n) where n = input length. 5 matchers run sequentially = O(5n) = O(n).
      Each matcher removes its tokens from the string, so subsequent matchers
      operate on shorter strings.
    - Date resolution (Forward-looking calendar arithmetic): "next Monday"
      requires finding the next Monday from today. Uses modular arithmetic:
      daysUntil = (targetDow - currentDow + 7) % 7. If result is 0,
      add 7 (always next occurrence, not today). O(1).
    - Confidence scoring (Weighted sum): Linear combination of binary feature
      indicators. O(1) computation.
    - Response caching (Hash map with TTL): Server caches parse results
      by SHA-256(raw_text + timezone). Valkey SET with EX 300 (5 min TTL).
      O(1) lookup, prevents re-parsing identical inputs.
    - Part-of-speech tagging (compromise library): Trie-based lexicon
      lookup, O(n) where n = word count. Used to distinguish "March" (month)
      from "march" (verb: "March to the store").

  TESTS (target count):
    - Unit (Dart parser): 30
      - Date extraction: today, tomorrow, named days (7), "next X" (4),
        month+day (4), ISO format, date connectors ("by", "before", "on")
      - Time extraction: am/pm, 24h, named times (noon, midnight, morning,
        afternoon, evening, night), combined date+time
      - Priority extraction: each keyword, !! and ! symbols, case insensitivity
      - Project extraction: #hashtag, "in project", "for project", quoted names
      - Recurrence: daily, weekly, monthly, yearly, weekdays, specific days
      - Title cleaning: trailing preposition removal, whitespace collapse,
        capitalization
      - Confidence scoring: all factor combinations
      - Edge cases: empty string, only date, only priority, all fields present,
        unicode characters, very long input (500 chars)
    - Unit (Backend parser): 15
      - chrono-node: "in 3 hours", "next Tuesday at half past 2", "end of month",
        "5 days from now", relative expressions
      - compromise integration: noun extraction for title
      - Caching: same input returns cached result, TTL expiry
      - Rate limiting: 31st request in 1 minute returns 429
    - Integration: 5
      - Client parse → confidence < 0.5 → server fallback → higher confidence used
      - Offline mode: server unreachable → client result used
      - Full flow: type → parse → confirm → create task with parsed fields
      - Timezone handling: India timezone parses "tomorrow" correctly
      - Locale handling: DD/MM format for India locale


################################################################################
  5. SCREEN D2: TASK DETAIL
################################################################################

SCREEN D2: TASK DETAIL (Tier: Free — core fields, Pro — attachments & AI)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    The comprehensive view and editing interface for a single task. Displays all
    task fields (title, description, project, due date, priority, energy,
    recurrence, tags, labels, estimated duration, reminder settings), subtasks
    with drag-to-reorder, activity log, and attachments (Pro). Serves as the
    central hub for task management — every task interaction ultimately leads
    here. Inline editing (tap any field to change) ensures users never leave
    this screen to modify task properties.

  FRONTEND (Flutter):
    Package: feature_todos
    Route: /tasks/:taskId (go_router, pathParam 'taskId')

    Key Widgets:
      - TaskDetailScreen — Scaffold with SliverAppBar (title editable inline,
        back arrow, 3-dot menu with Duplicate/Move/Delete), scrollable body
      - CompletionButton — Large animated button at top. Tap to toggle
        completion. Incomplete: hollow circle with gold border. Complete:
        filled gold circle with animated checkmark (Lottie). Long press:
        "Mark as in-progress" option
      - TaskInfoSection — Column of tappable info rows:
        - ProjectRow: color dot + project name → taps opens ProjectPicker sheet
        - DueDateRow: calendar icon + formatted date/time → taps opens
          DateTimePicker overlay
        - PriorityRow: colored flag + "P1"/"P2"/"P3"/"P4" → taps cycles priority
        - DurationRow: clock icon + "30 min" → taps opens DurationPicker (5min increments)
        - RecurrenceRow: repeat icon + "Weekly on Mon" → taps opens RecurrenceBuilder (D5)
        - TagsRow: tag icons + chip list → taps opens TagSelector sheet
        - LabelsRow: key-value pairs → taps opens LabelEditor sheet
        - EnergyRow: lightning bolt icon (colored by level) + "High" →
          taps cycles Low/Medium/High/Peak
        - ReminderRow: bell icon + "30 min before, Push" → taps opens
          ReminderConfigSheet (channel + offset picker)
      - DescriptionEditor — Rich text editor with markdown support
        (flutter_quill). Expands on focus, collapses to preview when unfocused.
        Toolbar: bold, italic, bullet list, numbered list, heading, link
      - SubtaskSection — Column header "Subtasks (3/5)" with progress bar.
        ReorderableListView of SubtaskTile widgets. Each tile: checkbox +
        title (inline editable) + delete icon. Bottom: AddSubtaskField
        (TextField + "Add" button). Drag handle on left for reorder
      - ActivityLog — Collapsible ExpansionTile. Shows chronological list:
        "Created Mar 9, 2026 at 10:30 AM", "Priority changed from P4 to P2",
        "Moved to project 'Work'", etc. Each entry: icon + description +
        relative timestamp
      - AttachmentSection — (Pro only) Grid of attachment thumbnails.
        Add button opens camera/gallery/file picker. Each thumbnail:
        tap to preview full-screen, long press for delete. Shows file name +
        size. Voice memo shows waveform + play button
      - AiSection — (Pro only, collapsible) Three action cards:
        "Break this down" (v1: rule-based template decomposition, selects
        matching template's subtasks), "Similar tasks" (v1: queries Drift
        for tasks with similar title words, Levenshtein distance),
        "Schedule this" (v2 only — grayed out with "Coming in v2" badge)
      - BottomActionBar — Row of icon buttons: Duplicate, Move to project,
        Add to ritual, Delete (red). Delete shows confirmation dialog

    State Management:
      - TaskDetailNotifier (AsyncNotifier<TaskDetail>) — loads task by ID
        from Drift, manages all field mutations (each mutation: create new
        immutable TaskDetail via copyWith, save to Drift, queue sync).
        Handles optimistic updates with rollback on server error
      - SubtaskListNotifier (AsyncNotifier<List<Subtask>>) — manages subtask
        CRUD and reorder. Reorder updates sort_order values locally, syncs
        to backend
      - TaskActivityProvider (FutureProvider<List<ActivityEntry>>) — fetches
        activity log from Drift (local edits) merged with server activity
        (if online). Sorted by timestamp descending
      - SimilarTasksProvider (FutureProvider<List<Task>>) — queries Drift
        for tasks with similar titles (tokenize title → search each word).
        V1 only, replaced by Claude API in V2
      - AttachmentListProvider (FutureProvider<List<Attachment>>) — loads
        attachments for this task from Drift + MinIO presigned URLs

    Packages (pub.dev):
      - flutter_quill ^10.8.0 — Rich text editor with markdown support
      - file_picker ^8.1.0 — Select files/images for attachments (Pro)
      - image_picker ^1.1.0 — Camera capture for attachments (Pro)
      - audio_waveforms ^1.0.5 — Voice memo recording and playback waveform
      - intl ^0.19.0 — Date/time formatting, relative time ("2 hours ago")

    Drift Tables (local):
      - tasks — (existing, all fields as defined in B3)
      - subtasks — (id TEXT PK, task_id TEXT FK, title TEXT, is_done INTEGER
        DEFAULT 0, sort_order REAL, assignee_id TEXT, created_at INTEGER,
        updated_at INTEGER, sync_status TEXT)
      - task_tags — (task_id TEXT FK, tag_id TEXT FK, PRIMARY KEY (task_id, tag_id))
      - tags — (id TEXT PK, name TEXT, color TEXT, user_id TEXT,
        created_at INTEGER)
      - attachments — (id TEXT PK, task_id TEXT FK, url TEXT, filename TEXT,
        mime_type TEXT, size_bytes INTEGER, local_path TEXT, created_at INTEGER,
        sync_status TEXT)
      - activity_log — (id TEXT PK, task_id TEXT FK, action TEXT,
        field_name TEXT, old_value TEXT, new_value TEXT, user_id TEXT,
        created_at INTEGER)
      - task_labels — (task_id TEXT FK, key TEXT, value TEXT,
        PRIMARY KEY (task_id, key))
      - reminders — (id TEXT PK, task_id TEXT FK, channel TEXT,
        offset_minutes INTEGER, sent_at INTEGER, status TEXT,
        created_at INTEGER)

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/tasks/:taskId
        Request: (path param: taskId)
        Response: {
          success: true,
          data: {
            id, title, description, status, priority, due_at, energy,
            project_id, section_id, rrule, est_minutes, actual_minutes,
            completed_at, sort_order, created_at, updated_at,
            project: { id, name, color, icon } | null,
            subtasks: [{ id, title, is_done, sort_order, assignee_id }],
            tags: [{ id, name, color }],
            labels: [{ key, value }],
            attachments: [{ id, url, filename, mime_type, size_bytes }],
            reminders: [{ id, channel, offset_minutes, status }],
            activity: [{ action, field_name, old_value, new_value, created_at }]
          }
        }
        Auth: JWT required
        Notes: Eager-loads all relations. Only returns task if user_id matches
               JWT subject or user is team member with access. Activity log
               limited to last 50 entries (paginate with ?activity_page=N).

      PATCH /api/v1/tasks/:taskId
        Request: {
          title?: string,
          description?: string,
          status?: string,
          priority?: string,
          due_at?: string | null,
          energy?: string,
          project_id?: string | null,
          section_id?: string | null,
          rrule?: string | null,
          est_minutes?: number | null,
          tags?: string[],           // full replacement (send all tag IDs)
          labels?: { key: string, value: string }[]  // full replacement
        }
        Response: {
          success: true,
          data: { ...updated task fields, updated_at: string }
        }
        Auth: JWT required
        Notes: Partial update — only provided fields are changed. Each field
               change logged in activity_log table. If status changed to "done",
               sets completed_at. If status changed from "done", clears
               completed_at. Tags and labels are full-replacement (not additive)
               to simplify sync conflict resolution.

      POST /api/v1/tasks/:taskId/subtasks
        Request: { title: string, sort_order?: number }
        Response: { success: true, data: { id, title, is_done, sort_order } }
        Auth: JWT required

      PATCH /api/v1/tasks/:taskId/subtasks/:subtaskId
        Request: { title?: string, is_done?: boolean, sort_order?: number }
        Response: { success: true, data: { ...updated subtask } }
        Auth: JWT required

      DELETE /api/v1/tasks/:taskId/subtasks/:subtaskId
        Response: { success: true }
        Auth: JWT required

      PATCH /api/v1/tasks/:taskId/subtasks/reorder
        Request: { subtask_ids: string[] }   // ordered array of subtask IDs
        Response: { success: true }
        Auth: JWT required
        Notes: Bulk reorder. Backend assigns sort_order values 1.0, 2.0, 3.0...
               based on array position. Single transaction.

      POST /api/v1/tasks/:taskId/attachments
        Request: multipart/form-data { file: File }
        Response: {
          success: true,
          data: { id, url, filename, mime_type, size_bytes, created_at }
        }
        Auth: JWT required (Pro plan only)
        Notes: File uploaded to MinIO bucket "unjynx-uploads" with path
               /{userId}/{taskId}/{filename}. Max file size: 25MB.
               Allowed types: image/*, application/pdf, audio/*.
               Returns presigned URL with 7-day expiry.

      DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
        Response: { success: true }
        Auth: JWT required (Pro plan only)
        Notes: Deletes from MinIO and database. Soft-delete in DB
               (is_deleted flag), hard-delete from MinIO immediately.

      DELETE /api/v1/tasks/:taskId
        Response: { success: true }
        Auth: JWT required
        Notes: Soft delete (sets is_deleted=true, deleted_at=now).
               Also soft-deletes all subtasks, reminders, and attachments.
               Hard-deleted after 30 days by cleanup cron job.

    Business Logic:
      - Title required, 1-500 chars. Description max 10,000 chars (markdown).
      - Priority cycles: P1→P2→P3→P4→P1 on tap.
      - Energy cycles: Low→Medium→High→Peak→Low on tap.
      - Subtask reorder uses fractional sort_order (insert between two items:
        new_order = (prev_order + next_order) / 2). Rebalances when gap < 0.001.
      - Activity log created server-side via Drizzle afterUpdate hook.
        Compares old vs new values, creates entry per changed field.
      - Attachment upload requires Pro plan. Backend checks user.plan before
        accepting. Returns 403 with upgrade_required error for Free users.
      - Reminder settings stored locally and synced. Actual reminder
        scheduling is Phase 3 (Channels & Notifications).
      - "Break this down" (V1): Queries task_templates table for templates
        whose name or category matches task title keywords. Returns top 3
        matching templates' subtasks as suggestions. User confirms which
        to add.
      - "Similar tasks" (V1): Full-text search on tasks table using
        tsvector(title). Returns up to 5 tasks with similar titles,
        ordered by ts_rank. Client-side alternative: tokenize title,
        query Drift WHERE title LIKE '%word%' for each word, rank by
        match count.

  DATA FLOW:
    User taps task in list → go_router navigates to /tasks/:taskId →
    TaskDetailNotifier.build() loads from Drift (instant, offline-first) →
    Screen renders with local data → Background: GET /api/v1/tasks/:taskId
    fetches latest from server → if server version newer (updated_at >
    local updated_at): merge fields, update Drift → Screen rebuilds with
    fresh data → User taps priority flag → PriorityRow cycles to next value →
    TaskDetailNotifier.updatePriority(newPriority) → creates new TaskDetail
    via copyWith(priority: newPriority) → Drift UPDATE → optimistic UI update →
    PATCH /api/v1/tasks/:taskId { priority: "p2" } → if success: activity
    log entry created server-side → if fail: rollback Drift to previous value,
    show SnackBar error

  INTERACTIONS & ANIMATIONS:
    - Screen entry: Hero animation from task card in list (title + checkbox
      shared element, 350ms, Curves.easeInOutCubic)
    - Completion button tap: Hollow circle fills with gold (300ms radial fill
      from center), checkmark draws stroke-by-stroke (Lottie, 400ms),
      haptic medium impact. Title gets strikethrough animation (200ms).
      Confetti particles (subtle, 8 particles, 600ms)
    - Completion undo: Gold drains from circle (reverse fill, 200ms),
      checkmark erases, title strikethrough removed
    - Priority cycle: Flag icon rotates 360 degrees (300ms, Curves.easeInOut),
      color morphs to new priority color (200ms, ColorTween)
    - Energy cycle: Lightning bolt scales up briefly (1.0→1.3→1.0, 200ms),
      color morphs (200ms)
    - Info row tap: Row background briefly highlights (gold at 10% opacity,
      150ms fade in, 300ms fade out), picker/sheet slides up from bottom
      (300ms, Curves.easeOutCubic)
    - Description expand: AnimatedContainer height grows smoothly (300ms),
      toolbar slides in from bottom (200ms, staggered)
    - Subtask checkbox: Scale bounce (0.8→1.1→1.0, 250ms, spring),
      strikethrough on title (150ms)
    - Subtask drag reorder: Dragged item elevates (elevation 4→12, 100ms),
      other items shift with spring animation (200ms), drop: item settles
      with bounce (150ms, Curves.bounceOut)
    - Attachment thumbnail: Tap scales up to full-screen with Hero transition
      (300ms). Long press: delete confirmation slides up
    - Delete task: Slide-out left animation (300ms), confirmation dialog
      with "Undo" SnackBar (5 second window)
    - Activity log expand: ExpansionTile rotates chevron (200ms), content
      fades in (250ms, stagger 50ms per entry)

  DSA / ALGORITHMS:
    - Fractional indexing (Sort order): Subtask reorder uses fractional
      sort_order to avoid renumbering. Insert between items at positions
      A and B: new = (A + B) / 2. When gap < 0.001, rebalance all items
      to integer positions (1, 2, 3...). O(1) insert, O(n) rebalance (rare).
    - Levenshtein distance (Similar tasks V1): Edit distance between task
      titles to find similar tasks. O(m*n) where m,n are title lengths.
      Used client-side only; server uses PostgreSQL full-text search (faster).
    - Full-text search (PostgreSQL tsvector): GIN index on tasks(title ||
      description). ts_rank scores relevance. O(k) where k = matching terms.
    - Optimistic update with rollback (Event sourcing lite): Each mutation
      creates a local "pending change" entry. If server confirms: remove entry.
      If server rejects: apply inverse change from entry. O(1) per operation.
    - LRU eviction (Activity log): Client caches last 50 activity entries.
      New entries push out oldest. O(1) with doubly-linked list.

  TESTS (target count):
    - Unit: 20 (TaskDetailNotifier: load by ID, each field update creates
      new immutable copy, optimistic update, rollback on error, completion
      toggle, subtask CRUD, subtask reorder, activity log merge, tag
      replacement, label CRUD, reminder config, similar tasks query,
      attachment upload validation, delete soft-delete, priority/energy
      cycling logic)
    - Widget: 14 (TaskDetailScreen renders all sections, CompletionButton
      animates, each info row renders correctly and opens picker, DescriptionEditor
      expand/collapse, SubtaskSection renders list with progress bar, subtask
      drag reorder works, ActivityLog expands with entries, AttachmentSection
      shows thumbnails (Pro), AiSection shows "Break this down" (Pro),
      BottomActionBar actions work, 3-dot menu options, Hero animation
      from list)
    - Integration: 6 (Full load: Drift data shown immediately then server
      merge, edit field → Drift updated → API called → activity log created,
      subtask reorder → sort_order updated in Drift and API, attachment
      upload → MinIO → URL returned → thumbnail shown, delete → soft delete
      → removed from list, offline edit → sync when back online)


################################################################################
  6. SCREEN D4: KANBAN BOARD
################################################################################

SCREEN D4: KANBAN BOARD (Tier: Pro)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    A drag-and-drop Kanban board providing visual task management across
    configurable columns. Columns can represent task status (Pending →
    In Progress → Done), priority levels (Urgent → High → Medium → Low),
    or custom user-defined categories. Dragging a task card between columns
    automatically updates the corresponding task field. This is a Pro-tier
    feature that provides a visual workflow management experience superior
    to flat task lists. Team tier adds swimlanes by assignee and WIP
    (Work-In-Progress) limits per column.

  FRONTEND (Flutter):
    Package: feature_todos
    Route: /tasks/kanban (go_router)
    Query params: ?project_id=X (optional, scopes to project)
                  ?group_by=status|priority|custom (default: status)

    Key Widgets:
      - KanbanBoardScreen — Scaffold with AppBar (back, title "Kanban",
        group-by dropdown, filter icon, settings gear). Body is a horizontal
        ScrollView of KanbanColumn widgets. Bottom-right FAB for quick
        task create
      - KanbanColumn — Vertical container with header (column title + task
        count + collapse toggle), body is a scrollable DragTarget<TaskCard>
        list. Footer: "Add task" inline button. Column width: 300dp fixed.
        Background: subtle color tint matching column semantics (e.g.,
        green tint for "Done", red tint for "Urgent")
      - KanbanTaskCard — Draggable card within a column. Shows: title (1-2
        lines), priority flag (color dot), due date (if set), project color
        dot, assignee avatar (Team mode), subtask progress "3/5". Tap opens
        Task Detail (D2). Long press initiates drag
      - KanbanColumnHeader — Row with column title (bold), task count badge,
        collapse/expand chevron. Team mode: WIP limit indicator (e.g.,
        "4/6" with yellow warning at 80%, red at 100%)
      - GroupByDropdown — DropdownButton in AppBar: Status, Priority, Custom.
        Changing group-by rebuilds all columns with animation
      - KanbanFilterSheet — BottomSheet with same filters as D3 (priority,
        energy, tag, assignee). Applied filters show as chips below AppBar
      - KanbanSettingsSheet — BottomSheet for column configuration:
        add/remove/rename custom columns, set WIP limits (Team), set
        default group-by, toggle "show completed tasks" (hidden by default)
      - EmptyColumnPlaceholder — Dashed border container with "Drop tasks
        here" text and "+" button. Shown when column has 0 tasks

    State Management:
      - KanbanBoardNotifier (AsyncNotifier<KanbanBoardState>) — manages
        column definitions, task-to-column assignments, drag state,
        group-by mode. KanbanBoardState (freezed): columns List<KanbanColumn>,
        groupBy GroupByMode enum, projectId String?, filters TaskFilter
      - KanbanDragNotifier (StateNotifier<KanbanDragState>) — transient
        state during drag: sourceColumn, draggedTask, currentHoverColumn.
        Resets on drop or cancel
      - KanbanColumnsProvider (FutureProvider<List<ColumnDefinition>>) —
        loads column definitions from Drift. For status group-by: hardcoded
        [Pending, In Progress, Done]. For priority: hardcoded [P1, P2, P3, P4].
        For custom: loaded from kanban_columns Drift table
      - TasksByColumnProvider (Provider.family<List<Task>, String>) — derived
        provider that filters tasks for a specific column based on group-by
        field value. Automatically recomputes when tasks or group-by changes

    Packages (pub.dev):
      - drag_and_drop_lists ^0.4.1 — Cross-list drag and drop for Kanban
        column-to-column task movement. Handles auto-scroll during drag
      - scrollable_positioned_list ^0.3.8 — Programmatic scroll to specific
        column (e.g., after creating task in a distant column)

    Drift Tables (local):
      - tasks — (existing, status/priority field determines column placement)
      - kanban_columns — (id TEXT PK, user_id TEXT, project_id TEXT,
        name TEXT, sort_order REAL, color TEXT, wip_limit INTEGER,
        field_value TEXT, group_by TEXT, created_at INTEGER)
      - kanban_column_tasks — (column_id TEXT FK, task_id TEXT FK,
        sort_order REAL, PRIMARY KEY (column_id, task_id))

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/kanban/columns
        Request: ?project_id=X&group_by=status|priority|custom
        Response: {
          success: true,
          data: [{
            id: string,
            name: string,
            sort_order: number,
            color: string | null,
            wip_limit: number | null,
            field_value: string,
            task_count: number,
            tasks: [{
              id, title, priority, status, due_at, project_id,
              assignee_id, subtask_progress: { done: number, total: number }
            }]
          }]
        }
        Auth: JWT required (Pro plan)
        Notes: Returns columns with embedded tasks, sorted by column
               sort_order then task sort_order within column. For status/
               priority group-by, columns are virtual (derived from task
               field values). For custom group-by, columns loaded from
               kanban_columns table. Free users get 403 with upgrade_required.

      POST /api/v1/kanban/columns
        Request: { name: string, color?: string, wip_limit?: number, sort_order?: number }
        Response: { success: true, data: { id, name, sort_order, color, wip_limit } }
        Auth: JWT required (Pro plan, custom group-by only)
        Notes: Creates custom Kanban column. Max 12 custom columns per user.

      PATCH /api/v1/kanban/columns/:columnId
        Request: { name?: string, color?: string, wip_limit?: number, sort_order?: number }
        Response: { success: true, data: { ...updated column } }
        Auth: JWT required (Pro plan)

      DELETE /api/v1/kanban/columns/:columnId
        Response: { success: true }
        Auth: JWT required (Pro plan)
        Notes: Moves all tasks in column to "Uncategorized" column (auto-created
               if needed). Cannot delete the last column.

      PATCH /api/v1/kanban/tasks/move
        Request: {
          task_id: string,
          target_column_id: string,      // or field_value for status/priority
          target_sort_order: number,
          group_by: "status" | "priority" | "custom"
        }
        Response: {
          success: true,
          data: { task_id: string, new_status?: string, new_priority?: string }
        }
        Auth: JWT required (Pro plan)
        Notes: Moves task between columns. For status group-by, updates
               task.status. For priority group-by, updates task.priority.
               For custom, updates kanban_column_tasks join table.
               Checks WIP limit before accepting (Team plan). Returns 409
               if WIP limit exceeded.

    Business Logic:
      - Pro plan required for all Kanban endpoints. Free users see an
        upgrade prompt with Kanban preview screenshot.
      - Group-by status columns: Pending (default), In Progress, Done.
        Tasks automatically placed by their status field.
      - Group-by priority columns: P1 (Urgent), P2 (High), P3 (Medium),
        P4 (Low). Tasks placed by priority field.
      - Group-by custom columns: User-defined. Tasks placed via
        kanban_column_tasks join table. Unassigned tasks go to first column.
      - WIP limits (Team only): When column task count >= wip_limit,
        moving more tasks in returns 409 Conflict with message "WIP limit
        reached for column [name]". UI shows column header in red.
      - Max 12 custom columns per user (prevent UI overload).
      - Drag-and-drop is optimistic: UI moves card immediately, PATCH fires
        in background. On failure: card springs back to original position.
      - Completed tasks hidden by default in Kanban. Toggle in settings
        to show "Done" column.

  DATA FLOW:
    Screen loads → KanbanBoardNotifier.build() → reads group_by from query
    param or user preference (Drift) → KanbanColumnsProvider loads column
    definitions → For each column: TasksByColumnProvider filters tasks from
    Drift → Columns render with their tasks → User drags KanbanTaskCard from
    "Pending" to "In Progress" → KanbanDragNotifier tracks drag state →
    Card dropped on target column DragTarget → KanbanBoardNotifier.moveTask()
    → Optimistic: remove from source column list, add to target column list,
    update task.status in Drift → PATCH /api/v1/kanban/tasks/move →
    if success: activity log updated → if fail: reverse the move in both
    column lists and Drift, show SnackBar error

  INTERACTIONS & ANIMATIONS:
    - Board load: Columns slide in from right sequentially (150ms stagger,
      300ms each, Curves.easeOutCubic)
    - Drag start (long press 200ms): Card lifts with shadow increase
      (elevation 2→12, 150ms), slight rotation (2 degrees, adds organic feel),
      source position shows ghost placeholder (dashed border, 50% opacity)
    - Drag hover over column: Target column background pulses subtle
      highlight (100ms, gold at 5% opacity), column header badge updates
      with "+1" preview
    - Drag drop: Card springs into position (spring physics, 300ms,
      damping 0.7), ghost placeholder fades out (150ms), haptic light
      impact. If WIP limit exceeded: card bounces back with shake animation
      (3 oscillations, 400ms) and error SnackBar
    - Column collapse: AnimatedContainer height to 0 (300ms, Curves.easeInOut),
      chevron rotates 180 degrees (200ms)
    - Group-by change: All columns fade out (200ms), rebuild, fade in (300ms)
      with stagger
    - Add task inline: Text field expands in column footer (200ms), on submit
      card drops in from top with spring bounce (250ms)
    - Scroll auto-advance: When dragging near board edge (<50dp), board
      auto-scrolls horizontally at 200dp/s

  DSA / ALGORITHMS:
    - Fractional indexing (Sort order within columns): Same as D2 subtask
      reorder. Insert between positions A and B: (A+B)/2. Rebalance when
      gap < 0.001. O(1) insert, O(n) rebalance (rare).
    - Column assignment (HashMap): O(1) lookup of column by field value.
      columnMap[task.status] returns the column reference for placing the card.
    - WIP limit check (Counter): O(1) comparison: column.tasks.length >=
      column.wipLimit. Checked both client-side (immediate feedback) and
      server-side (authoritative).
    - Task filtering (Linear scan + index): Filter tasks by project_id,
      priority, energy, tags. Drift queries use composite indexes for
      O(log n) per filter condition. Combined filters use index intersection.
    - Drag target detection (Hit testing): Flutter's built-in DragTarget
      uses RenderBox.hitTest for O(log n) in the widget tree. Auto-scroll
      triggers when drag position is within 50dp of viewport edge.

  TESTS (target count):
    - Unit: 14 (KanbanBoardNotifier: load columns by group-by mode,
      moveTask updates correct field (status for status-groupBy, priority
      for priority-groupBy), custom column CRUD, sort order assignment,
      WIP limit enforcement, filter application, column collapse state,
      task count per column, optimistic update + rollback, max 12 columns
      enforcement)
    - Widget: 10 (KanbanBoardScreen renders horizontal columns, KanbanColumn
      renders task cards in order, KanbanTaskCard displays correct fields,
      drag and drop moves card between columns, column header shows count
      and WIP limit, GroupByDropdown changes columns, filter sheet applies
      filters, empty column shows placeholder, add task inline creates card,
      Pro gate shows upgrade prompt for Free users)
    - Integration: 5 (Full drag flow: drag → drop → Drift updated → API
      called → UI reflects change. WIP limit: drag to full column → bounce
      back. Group-by switch: status → priority → columns rebuild correctly.
      Offline: drag → Drift updated → sync when online. Filter + Kanban:
      apply filter → columns show filtered subset)


################################################################################
  7. SCREEN D5: RECURRING TASK BUILDER
################################################################################

SCREEN D5: RECURRING TASK BUILDER (Tier: Free — presets, Pro — custom/advanced)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    A visual RRULE (RFC 5545) builder that lets users create recurring task
    schedules without seeing any technical jargon. Provides common presets
    (daily, weekdays, weekly, biweekly, monthly, yearly), a custom builder
    ("Every [N] [day/week/month/year] on [days] at [time]"), and an advanced
    "After completion" mode (recur N days after last completion). Shows a
    calendar preview of the next 5 occurrences for confirmation. Generates
    a valid RRULE string stored on the task and used by the backend cron to
    generate future task instances.

  FRONTEND (Flutter):
    Package: feature_todos
    Route: N/A — presented as a BottomSheet from Task Detail (D2) or
           Quick Create (D1) when recurrence icon is tapped

    Key Widgets:
      - RecurrenceBuilderSheet — DraggableScrollableSheet with:
        header ("Repeat", close button), preset chips, custom builder
        section, advanced section, calendar preview, confirm button
      - PresetChips — Horizontal scroll of ChoiceChip widgets:
        Daily, Weekdays, Weekly, Biweekly, Monthly, Yearly.
        Selecting a preset auto-fills the custom builder fields and
        updates calendar preview. Gold fill on selected
      - CustomRecurrenceBuilder — Column of configuration rows:
        - FrequencyRow: "Every" + NumberPicker (1-99) + SegmentedButton
          (Day/Week/Month/Year). E.g., "Every 2 Weeks"
        - DaySelector: (visible when frequency=Week) Row of 7 circular
          day buttons (M T W T F S S). Multi-select. Selected: gold fill.
          E.g., Mon + Wed + Fri selected
        - MonthDaySelector: (visible when frequency=Month) Choice between
          "Day of month" (NumberPicker 1-31, e.g., "15th of each month")
          and "Day of week" (e.g., "2nd Tuesday of each month" — ordinal
          picker + day picker)
        - TimeSelector: TimePicker for recurrence time (optional, defaults
          to task's due time if set)
      - AdvancedSection — ExpansionTile (Pro only):
        - AfterCompletionToggle: Switch for "After completion" mode.
          When ON, shows "Recur [N] days after completing this task" with
          NumberPicker for days. This creates a relative recurrence
          (not calendar-based). Uses custom metadata field, not standard RRULE
        - EndConditionSelector: Radio buttons: "Never" (default),
          "After [N] occurrences" (NumberPicker), "Until [date]" (DatePicker)
      - OccurrencePreview — Compact calendar widget showing next 5 occurrence
        dates as a vertical list with day-of-week and formatted date.
        Each occurrence has a small calendar icon. Updates in real-time
        as user adjusts settings
      - ConfirmButton — Gold full-width button: "Set Recurrence". Returns
        the built RRULE string to the parent screen

    State Management:
      - RecurrenceBuilderNotifier (Notifier<RecurrenceState>) — manages
        all builder fields: frequency (daily/weekly/monthly/yearly),
        interval (1-99), selectedDays (Set<int> for weekdays), monthDay
        or monthWeekday selection, time, afterCompletion flag + days,
        endCondition (never/count/until). Computes RRULE string on each
        change. RecurrenceState is a freezed model
      - OccurrencePreviewProvider (Provider<List<DateTime>>) — derived
        provider that computes next 5 occurrence dates from the current
        RRULE string. Uses rrule Dart package to expand the rule
      - SelectedPresetProvider (Provider<RecurrencePreset?>) — derived
        provider that determines which preset chip (if any) matches the
        current custom builder configuration. Highlights matching preset

    Packages (pub.dev):
      - rrule ^0.2.16 — RFC 5545 RRULE parsing and occurrence expansion
        in Dart. Generates next N occurrences from a rule string
      - numberpicker ^2.1.2 — Scroll-wheel number picker for interval
        and occurrence count

    Drift Tables (local):
      - tasks — (existing, rrule TEXT column stores the RFC 5545 string)
      - recurring_metadata — (task_id TEXT PK, after_completion INTEGER
        DEFAULT 0, after_completion_days INTEGER, end_count INTEGER,
        end_date INTEGER, last_generated_at INTEGER)

  BACKEND (Hono/TypeScript):
    Endpoints:
      PATCH /api/v1/tasks/:taskId (existing endpoint)
        Request: {
          rrule: string | null,          // RFC 5545 RRULE string or null to remove
          recurring_metadata?: {
            after_completion: boolean,
            after_completion_days?: number,
            end_count?: number,
            end_date?: string            // ISO 8601
          }
        }
        Notes: rrule field on task stores the standard RRULE string.
               recurring_metadata stores UNJYNX-specific extensions
               (after-completion mode, end conditions). When rrule is set,
               backend upserts recurring_rules table with next_at computed
               from the rule.

      GET /api/v1/tasks/:taskId/occurrences
        Request: ?count=5 (default 5, max 20)
        Response: {
          success: true,
          data: {
            rrule: string,
            occurrences: string[]   // ISO 8601 date strings
          }
        }
        Auth: JWT required
        Notes: Server-side occurrence expansion using rrule npm package.
               Used as verification — client computes preview locally but
               server is authoritative for actual instance generation.

    Business Logic:
      - RRULE string format follows RFC 5545 strictly. Examples:
        "FREQ=DAILY" (every day)
        "FREQ=WEEKLY;BYDAY=MO,WE,FR" (weekdays Mon/Wed/Fri)
        "FREQ=MONTHLY;BYMONTHDAY=15" (15th of each month)
        "FREQ=MONTHLY;BYDAY=2TU" (2nd Tuesday of each month)
        "FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=9" (March 9 every year)
        "FREQ=WEEKLY;INTERVAL=2" (every 2 weeks)
      - "After completion" mode is NOT standard RRULE. Stored in
        recurring_metadata. Backend cron checks: when task marked complete,
        generate next instance at completed_at + N days. Does not use
        RRULE expansion — uses simple date arithmetic.
      - End conditions: COUNT and UNTIL are standard RRULE properties.
        "FREQ=DAILY;COUNT=10" (10 occurrences total).
        "FREQ=WEEKLY;UNTIL=20261231T235959Z" (until end of 2026).
      - Backend cron job (BullMQ repeatable, runs every 15 minutes):
        SELECT * FROM recurring_rules WHERE next_at <= NOW().
        For each: generate task instance (clone parent task with new due_at),
        compute and update next_at. Skip if end condition met.
      - Free tier: presets only (Daily, Weekdays, Weekly, Biweekly, Monthly,
        Yearly). Pro tier: custom interval, day selection, monthly advanced,
        after-completion mode, end conditions.
      - Max 50 active recurring rules per user (prevent cron overload).

  DATA FLOW:
    User taps recurrence icon on Task Detail (D2) → RecurrenceBuilderSheet
    opens as BottomSheet → RecurrenceBuilderNotifier initializes from existing
    task.rrule (if editing) or blank (if new) → User selects "Weekly" preset
    → RecurrenceBuilderNotifier sets frequency=WEEKLY, interval=1, selectedDays=
    {currentDayOfWeek} → OccurrencePreviewProvider computes next 5 Mondays
    (or whatever day) → User taps "Set Recurrence" → Sheet returns RRULE string
    "FREQ=WEEKLY;BYDAY=MO" → TaskDetailNotifier.updateRrule(rruleString) →
    Drift UPDATE tasks SET rrule = ? → PATCH /api/v1/tasks/:taskId { rrule: "..." }
    → Backend upserts recurring_rules with next_at = next Monday → Cron picks
    it up at next_at, generates task instance

  INTERACTIONS & ANIMATIONS:
    - Sheet open: DraggableScrollableSheet slides up from bottom (350ms,
      Curves.easeOutCubic), initial size 0.5, max size 0.9
    - Preset chip select: Selected chip scales (1.0→1.05, 150ms), gold fill
      morphs in (200ms, ColorTween). Previously selected chip animates out
      (reverse). Custom builder fields below auto-populate with matching
      values (AnimatedSwitcher, 200ms)
    - Number picker scroll: Haptic selection feedback on each number change.
      Smooth scroll physics with snap-to-integer
    - Day button select: Circle fill animation from center outward (radial,
      200ms), text color inverts (white on gold, 150ms)
    - Calendar preview update: Occurrence dates crossfade (AnimatedSwitcher,
      250ms) when builder values change. New dates slide in from right,
      old dates slide out left
    - After-completion toggle: Switch flips with standard Material animation,
      days picker slides in below (200ms, Curves.easeOut)
    - Confirm button: Scales down on press (0.95, 100ms), releases with
      spring (200ms), sheet dismisses downward (300ms)

  DSA / ALGORITHMS:
    - RRULE expansion (RFC 5545 recurrence iterator): The rrule Dart package
      implements a recurrence rule iterator. For FREQ=WEEKLY;BYDAY=MO,WE,FR:
      iterates forward from dtstart, yielding dates that match the rule.
      O(k) to generate k occurrences, but each step is O(1) amortized.
    - Next occurrence computation (Calendar arithmetic): For simple rules
      (FREQ=DAILY, INTERVAL=1): next = current + 1 day. O(1). For complex
      rules (BYDAY=2TU — 2nd Tuesday): iterate days of target month to
      find 2nd Tuesday. O(days_in_month) worst case ≈ O(31) = O(1).
    - After-completion scheduling (Simple addition): next = completed_at +
      N days. O(1). No RRULE expansion needed.
    - Preset matching (Equality check): Compare current builder state against
      preset definitions. Each preset is a fixed RecurrenceState. O(p) where
      p = number of presets (6). Total O(1) since p is constant.
    - End condition enforcement (Counter/Date comparison): COUNT: decrement
      remaining on each generation, stop at 0. UNTIL: compare next_at <=
      until_date. Both O(1).

  TESTS (target count):
    - Unit: 16 (RecurrenceBuilderNotifier: preset selection populates fields,
      custom interval changes update RRULE, day selection in weekly mode,
      monthday vs weekday in monthly mode, after-completion toggle and days,
      end condition never/count/until, RRULE string generation for each
      preset, RRULE string generation for complex custom rules, occurrence
      preview computation, preset matching detection, interval bounds 1-99,
      max 50 rules enforcement, Free tier preset-only restriction)
    - Widget: 8 (RecurrenceBuilderSheet renders all sections, PresetChips
      render and select, CustomRecurrenceBuilder shows frequency-appropriate
      day selectors, MonthDaySelector switches between day-of-month and
      day-of-week modes, OccurrencePreview shows 5 dates, AdvancedSection
      expands with after-completion and end conditions, ConfirmButton
      returns RRULE, Pro badge on advanced features for Free users)
    - Integration: 4 (Build RRULE → save to task → verify Drift stores
      correct string → verify backend receives correct string. Edit
      existing recurrence → sheet pre-populates → modify → save.
      After-completion mode: complete task → verify next instance generated
      with correct date. End condition COUNT: verify stops after N.)


################################################################################
  8. SCREEN D6: TASK TEMPLATES
################################################################################

SCREEN D6: TASK TEMPLATES (Tier: Free — 5 built-in, Pro — unlimited + create)
Phase: 2
${'─'.repeat(53)}
  PURPOSE:
    A template browser and creator that lets users quickly instantiate tasks
    from pre-defined templates with pre-filled fields and subtasks. Provides
    system templates organized by category (Personal, Professional, industry-
    specific stubs) and lets Pro users save any task as a reusable template.
    Reduces friction for repetitive task creation — instead of building the
    same "Weekly Report" task from scratch each week, users tap a template and
    get all fields pre-populated. V1 includes personal and professional
    templates; industry-specific templates (Hustle Mode, Closer Mode, etc.)
    ship in V2 with Industry Modes.

  FRONTEND (Flutter):
    Package: feature_todos
    Route: /tasks/templates (go_router)
    Additional route: /tasks/templates/:templateId (template detail/preview)

    Key Widgets:
      - TemplateListScreen — Scaffold with AppBar ("Templates", search icon,
        "Create" button for Pro users). Body: CategoryTabBar + template grid
      - CategoryTabBar — Horizontal scroll of FilterChip widgets:
        All, Personal, Professional, Custom (Pro). Each chip filters the
        grid below. "Custom" tab only visible for Pro users
      - TemplateCard — Card in 2-column grid. Shows: template name (bold),
        category badge (colored chip), description (2-line truncated),
        subtask count ("5 steps"), field previews (priority flag, estimated
        time if set). Tap opens TemplatePreviewSheet. Long press (on custom
        templates): edit/delete context menu
      - TemplatePreviewSheet — BottomSheet showing full template details:
        name, description, all pre-filled fields (priority, energy, project,
        estimated duration, tags), subtask list (checkboxes, read-only),
        "Use Template" gold CTA button, "Edit" button (custom templates only)
      - UseTemplateConfirmation — After tapping "Use Template": inline
        editing view where user can modify template fields before creating
        the task. Pre-populated fields are editable. Project selector
        prominent. "Create Task" button at bottom
      - SaveAsTemplateSheet — (Pro only) BottomSheet triggered from Task
        Detail (D2) "Save as template" action. Shows task's current fields
        as the template preview. User provides template name, selects
        category (Personal/Professional/Custom), toggles which fields to
        include. "Save Template" button
      - TemplateSearchBar — Search field at top (visible when search icon
        tapped). Filters templates by name and description. Debounced 300ms
      - EmptyTemplateState — Shown when no templates match search or when
        Custom tab is empty. Illustration + "Create your first template"
        CTA (Pro) or "Upgrade to create templates" (Free)
      - TemplateLimitBanner — (Free users only) Banner at top: "Using 3 of
        5 free templates. Upgrade for unlimited." Shows usage count

    State Management:
      - TemplateListNotifier (AsyncNotifier<List<TaskTemplate>>) — loads
        templates from Drift (local cache), syncs with backend. Manages
        category filter, search query. TaskTemplate is a freezed model
      - TemplateCategoryProvider (StateProvider<TemplateCategory>) — current
        selected category filter (all/personal/professional/custom)
      - TemplateSearchProvider (StateProvider<String>) — current search query,
        debounced
      - FilteredTemplatesProvider (Provider<List<TaskTemplate>>) — derived
        provider combining category filter + search query on template list.
        Filters case-insensitively on name + description
      - TemplateUsageProvider (FutureProvider<TemplateUsage>) — for Free
        users, tracks how many of the 5 built-in template slots are used.
        TemplateUsage: { used: int, limit: int }
      - SaveTemplateNotifier (AsyncNotifier) — manages the save-as-template
        flow: field selection, name input, category, submission

    Packages (pub.dev):
      - flutter_staggered_grid_view ^0.7.0 — 2-column masonry grid for
        template cards with varying heights

    Drift Tables (local):
      - task_templates — (id TEXT PK, name TEXT, description TEXT,
        fields_json TEXT (JSON object with pre-filled task fields),
        subtasks_json TEXT (JSON array of subtask titles + sort_order),
        category TEXT ('personal' | 'professional' | 'custom'),
        is_system INTEGER DEFAULT 0, user_id TEXT, industry_mode TEXT,
        use_count INTEGER DEFAULT 0, created_at INTEGER, updated_at INTEGER,
        sync_status TEXT)

  BACKEND (Hono/TypeScript):
    Endpoints:
      GET /api/v1/task-templates
        Request: ?category=personal|professional|custom&search=query&page=1&limit=20
        Response: {
          success: true,
          data: [{
            id: string,
            name: string,
            description: string,
            fields: {
              priority?: string,
              energy?: string,
              est_minutes?: number,
              tags?: string[],
              rrule?: string
            },
            subtasks: [{ title: string, sort_order: number }],
            category: string,
            is_system: boolean,
            use_count: number,
            created_at: string
          }],
          meta: { total: number, page: number, limit: number }
        }
        Auth: JWT required
        Notes: Returns system templates (is_system=true) for all users +
               custom templates (is_system=false) for the requesting user.
               Paginated. Search uses ILIKE on name and description.
               For Free users: only system templates returned (up to 5 usable).

      GET /api/v1/task-templates/:templateId
        Response: { success: true, data: { ...full template } }
        Auth: JWT required

      POST /api/v1/task-templates
        Request: {
          name: string,
          description?: string,
          fields: { priority?, energy?, est_minutes?, tags?, rrule? },
          subtasks?: [{ title: string, sort_order: number }],
          category: "personal" | "professional" | "custom"
        }
        Response: { success: true, data: { id, name, ...rest } }
        Auth: JWT required (Pro plan only)
        Notes: Creates user-owned template (is_system=false). Free users
               get 403 with upgrade_required. Max 100 custom templates
               per user.

      PATCH /api/v1/task-templates/:templateId
        Request: { name?, description?, fields?, subtasks?, category? }
        Response: { success: true, data: { ...updated } }
        Auth: JWT required (Pro plan, own templates only)
        Notes: Cannot edit system templates (is_system=true). Returns 403
               if attempting to edit system or another user's template.

      DELETE /api/v1/task-templates/:templateId
        Response: { success: true }
        Auth: JWT required (Pro plan, own templates only)
        Notes: Hard delete (templates are not soft-deleted). Cannot delete
               system templates.

      POST /api/v1/task-templates/:templateId/use
        Request: {
          overrides?: {             // optional field overrides
            title?: string,
            project_id?: string,
            due_at?: string,
            priority?: string
          }
        }
        Response: {
          success: true,
          data: { task_id: string, ...created task fields }
        }
        Auth: JWT required
        Notes: Creates a new task from the template with all pre-filled
               fields + any overrides. Increments template use_count.
               For Free users: tracks usage against 5-template limit
               (5 unique templates, unlimited uses of each).
               Subtasks from template are created as subtasks of the new task.

    Business Logic:
      - System templates (is_system=true) are seeded during database
        initialization. 5 Personal + 5 Professional = 10 system templates.
      - Personal templates: "Morning Routine" (5 subtasks), "Grocery Run"
        (4 subtasks), "Weekly Review" (6 subtasks), "Home Cleaning" (7 subtasks),
        "Travel Packing" (10 subtasks).
      - Professional templates: "Meeting Prep" (4 subtasks), "Project Kickoff"
        (6 subtasks), "Weekly Report" (5 subtasks), "Client Presentation"
        (5 subtasks), "Sprint Planning" (7 subtasks).
      - Free tier: Can USE any of the 5 built-in templates (per category,
        so effectively 10 usable). Cannot CREATE custom templates. "Use"
        is unrestricted — use the same template as many times as desired.
      - Pro tier: Can use all templates + create unlimited custom templates.
        Max 100 custom templates (soft limit, warn at 80).
      - "Save as template" from Task Detail: extracts task's current fields
        (priority, energy, est_minutes, tags, rrule) and subtasks into a
        template. User confirms name and category.
      - use_count incremented atomically: UPDATE task_templates SET use_count
        = use_count + 1 WHERE id = ?. Used for popularity sorting.
      - Industry-mode templates (V2): Hustle Mode, Closer Mode, Grind Mode
        templates with industry_mode field set. Not shipped in V1; field
        exists in schema for forward compatibility.

  DATA FLOW:
    User taps "Templates" from task list (D3) or quick actions →
    go_router navigates to /tasks/templates → TemplateListNotifier.build()
    loads from Drift (cached) → Background: GET /api/v1/task-templates
    syncs latest → CategoryTabBar shows "All" selected → TemplateCard grid
    renders → User taps "Weekly Report" template → TemplatePreviewSheet
    opens with full details → User taps "Use Template" →
    UseTemplateConfirmation shows pre-filled fields with inline editing →
    User selects project "Work", adjusts due date → taps "Create Task" →
    POST /api/v1/task-templates/:templateId/use with overrides →
    Backend creates task + subtasks → returns task_id → Drift inserts task
    locally → go_router navigates to /tasks/:taskId (Task Detail D2) →
    Task appears with all template fields pre-populated

  INTERACTIONS & ANIMATIONS:
    - Screen entry: Template cards fade in with stagger (50ms delay each,
      300ms duration, Curves.easeOut). Cards appear top-left to bottom-right
    - Category tab switch: Cards fade out (150ms), new cards fade in (200ms)
      with stagger. Tab indicator slides (200ms, Curves.easeInOut)
    - Template card tap: Card scales (1.0→0.97→1.0, 150ms, spring),
      TemplatePreviewSheet slides up from bottom (350ms, Curves.easeOutCubic)
    - Preview sheet "Use Template": Button scales down (100ms), sheet morphs
      into UseTemplateConfirmation (shared element transition on template
      name, 300ms)
    - Field editing in confirmation: Each field row slides in sequentially
      (100ms stagger, 200ms each). Edited fields pulse gold briefly (200ms)
    - "Create Task" success: Checkmark animation in button (Lottie, 500ms),
      navigates to Task Detail with hero transition (300ms)
    - Save as template (from D2): Fields extract with "pull out" animation
      (each field slides to center, 200ms stagger), coalesce into template
      card shape (300ms)
    - Search: Results filter with AnimatedList (remove: slide left 200ms,
      insert: slide right 200ms)
    - Delete template (long press menu): Card shrinks to zero (200ms,
      Curves.easeIn) and fades out, gap closes with spring (250ms)

  DSA / ALGORITHMS:
    - Template matching (Full-text search): Search query split into tokens,
      each token matched against name + description with ILIKE. Drift local:
      WHERE name LIKE '%token%' OR description LIKE '%token%'. Backend:
      PostgreSQL ILIKE with GIN index on tsvector. O(k) per token where
      k = index entries.
    - Popularity sort (Comparison sort): Templates sorted by use_count DESC
      for "Popular" view. Standard O(n log n) comparison sort. Small n
      (max ~110 templates) makes this negligible.
    - Template instantiation (Deep clone + merge): Template fields_json
      deep-cloned into new task object. Override fields merged on top
      (Map.from(template.fields)..addAll(overrides)). Subtasks cloned with
      new IDs. O(f + s) where f = fields and s = subtasks.
    - Usage tracking (Atomic increment): PostgreSQL atomic UPDATE SET
      use_count = use_count + 1. No read-modify-write race condition.
      O(1) with index on PK.
    - Category filtering (Enum equality): O(n) scan of template list,
      comparing category enum. Small n makes index unnecessary.

  TESTS (target count):
    - Unit: 14 (TemplateListNotifier: load all templates, filter by category,
      search by name, search by description, sync with backend, usage count
      tracking. SaveTemplateNotifier: extract fields from task, validate
      name required, category selection, save to Drift. Template instantiation:
      all fields cloned, subtasks cloned with new IDs, overrides applied,
      Free tier limit enforcement)
    - Widget: 10 (TemplateListScreen renders grid, CategoryTabBar filters,
      TemplateCard displays name/category/subtask count, TemplatePreviewSheet
      shows all fields, UseTemplateConfirmation pre-populates fields,
      SaveAsTemplateSheet extracts task fields, EmptyTemplateState shows
      for empty search, TemplateLimitBanner shows for Free users,
      search filters in real-time, long press shows edit/delete for custom)
    - Integration: 5 (Full use flow: browse → preview → use → task created
      with correct fields. Save flow: task detail → save as template →
      template appears in Custom tab. Search flow: type query → results
      filter → clear → all shown. Free tier: verify 5-template limit
      enforced. Sync: create template offline → sync when online → appears
      on backend)


################################################################################
  CROSS-CUTTING SUMMARY
################################################################################

  TOTAL TEST TARGETS:
  ───────────────────
    Screen B2 (Personalization):     Unit 14 + Widget 10 + Integration 4  = 28
    Screen B3 (First Task Prompt):   Unit 18 + Widget  8 + Integration 4  = 30
    Screen B4 (Notification Perm):   Unit 10 + Widget  6 + Integration 3  = 19
    NLP Task Parser System:          Unit 45 + Widget  0 + Integration 5  = 50
    Screen D2 (Task Detail):         Unit 20 + Widget 14 + Integration 6  = 40
    Screen D4 (Kanban Board):        Unit 14 + Widget 10 + Integration 5  = 29
    Screen D5 (Recurring Builder):   Unit 16 + Widget  8 + Integration 4  = 28
    Screen D6 (Task Templates):      Unit 14 + Widget 10 + Integration 5  = 29
    ──────────────────────────────────────────────────────────────────────────
    GRAND TOTAL:                     Unit 151 + Widget 66 + Integration 36 = 253

  NEW DRIFT TABLES (local SQLite):
  ─────────────────────────────────
    - user_preferences (B2)
    - notification_channel_prefs (B2)
    - notification_banner_state (B4)
    - kanban_columns (D4)
    - kanban_column_tasks (D4)
    - recurring_metadata (D5)
    - task_templates (D6)
    (tasks, subtasks, tags, task_tags, attachments, activity_log,
     task_labels, reminders already defined in D2 spec)

  NEW BACKEND ENDPOINTS:
  ──────────────────────
    POST   /api/v1/users/me/personalization
    GET    /api/v1/content/categories
    POST   /api/v1/tasks (also used by D1)
    POST   /api/v1/tasks/parse-nlp
    PATCH  /api/v1/users/me/onboarding-status
    POST   /api/v1/users/me/device-tokens
    GET    /api/v1/tasks/:taskId
    PATCH  /api/v1/tasks/:taskId
    DELETE /api/v1/tasks/:taskId
    POST   /api/v1/tasks/:taskId/subtasks
    PATCH  /api/v1/tasks/:taskId/subtasks/:subtaskId
    DELETE /api/v1/tasks/:taskId/subtasks/:subtaskId
    PATCH  /api/v1/tasks/:taskId/subtasks/reorder
    POST   /api/v1/tasks/:taskId/attachments
    DELETE /api/v1/tasks/:taskId/attachments/:attachmentId
    GET    /api/v1/kanban/columns
    POST   /api/v1/kanban/columns
    PATCH  /api/v1/kanban/columns/:columnId
    DELETE /api/v1/kanban/columns/:columnId
    PATCH  /api/v1/kanban/tasks/move
    GET    /api/v1/tasks/:taskId/occurrences
    GET    /api/v1/task-templates
    GET    /api/v1/task-templates/:templateId
    POST   /api/v1/task-templates
    PATCH  /api/v1/task-templates/:templateId
    DELETE /api/v1/task-templates/:templateId
    POST   /api/v1/task-templates/:templateId/use
    ──────────────────────────────────────────────
    TOTAL: 27 new endpoints

  PACKAGES ADDED:
  ───────────────
    Flutter (pub.dev):
      - smooth_page_indicator ^1.2.0
      - url_launcher ^6.3.0
      - speech_to_text ^7.0.0
      - lottie ^3.1.0
      - intl ^0.19.0
      - permission_handler ^11.3.0
      - app_settings ^5.1.0
      - flutter_quill ^10.8.0
      - file_picker ^8.1.0
      - image_picker ^1.1.0
      - audio_waveforms ^1.0.5
      - drag_and_drop_lists ^0.4.1
      - scrollable_positioned_list ^0.3.8
      - rrule ^0.2.16
      - numberpicker ^2.1.2
      - flutter_staggered_grid_view ^0.7.0

    Backend (npm):
      - chrono-node ^2.7.0
      - compromise ^14.14.0
      - rrule ^2.8.1

  NLP PARSER FILE LOCATIONS:
  ──────────────────────────
    Client:  packages/unjynx_core/lib/src/nlp/nlp_task_parser.dart
    Server:  apps/backend/src/services/nlp-parser.ts
    Tests:   packages/unjynx_core/test/nlp/nlp_task_parser_test.dart
             apps/backend/src/services/__tests__/nlp-parser.test.ts


################################################################################
  END OF EXPANSION P2A
################################################################################
`;

const outputPath = path.join(__dirname, 'EXPANSION-P2A.doc');
fs.writeFileSync(outputPath, content, 'utf8');
console.log(`Written to: ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
console.log(`Line count: ${content.split('\n').length}`);
