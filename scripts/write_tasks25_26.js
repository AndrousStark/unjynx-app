const fs = require('fs');
const path = 'C:/Users/SaveLIFE Foundation/Downloads/personal/Project- TODO Reminder app/COMPREHENSIVE-PHASE-PLAN.doc';

const content = `
================================================================================
  TASK 2.5: FLUTTER - Home Screen (C1)
  Duration: 4 days | Week 7
================================================================================

  WHAT:
  Build the Home Hub - the command center with greeting, progress rings,
  daily content card, today's tasks, quick actions, and AI insight card.

  SCREEN: C1 - Home Screen (Tab 1 "Hub")

  LAYOUT (scrollable, top to bottom):
  1. Greeting Bar: "Good morning, [Name]!" + streak counter + notification bell
  2. Progress Rings: 3 concentric rings (Tasks/Focus/Habits) Apple Watch style
  3. Daily Content Card: Swipeable quote with save/share
  4. Today's Tasks: Overdue (red) | Today (sorted) | No Date sections
  5. Quick Actions Row: Ghost Mode, Pomodoro, Morning Ritual, AI Suggest
  6. Upcoming Preview: Next 3 tasks (tomorrow + this week)
  7. AI Insight Card: Rule-based insights (v1)

  SUB-TASKS:
  2.5.1  Create feature_home package (or add screens to mobile app):
         - lib/presentation/screens/home_screen.dart
         - lib/presentation/widgets/greeting_bar.dart
         - lib/presentation/widgets/progress_rings.dart
         - lib/presentation/widgets/daily_content_card.dart
         - lib/presentation/widgets/task_list_section.dart
         - lib/presentation/widgets/quick_actions_row.dart
         - lib/presentation/widgets/upcoming_preview.dart
         - lib/presentation/widgets/ai_insight_card.dart
  2.5.2  ProgressRings widget:
         - CustomPainter for 3 concentric arcs (gold/violet/emerald)
         - Spring animation on fill (flutter_animate, Curves.elasticOut)
         - Gold shimmer effect on ring completion (shader or overlay)
         - Tap any ring to expand to Progress Hub (I1)
         - Weekly comparison sparkline below each ring
  2.5.3  DailyContentCard widget:
         - Swipeable (PageView) for next/previous quote
         - Typography: Playfair Display italic for quote text
         - Source attribution: DM Sans regular
         - Category badge (colored chip)
         - Save (heart icon) + Share actions
         - Tap to expand to full content view (H1)
  2.5.4  TaskListSection widget:
         - Collapsible sections: Overdue, Today, No Date
         - Swipe right: Complete with checkbox spring animation
         - Swipe left: Actions menu (snooze, edit, delete)
         - Each task card shows:
           Checkbox (animated) | Title (1-line truncated) | Project color dot
           Priority flag (color-coded P1-P4) | Due time | Energy tag
           Subtask progress bar ("3/5") | Recurrence icon
         - Uses flutter_slidable for swipe gestures
  2.5.5  QuickActionsRow: horizontal scroll of action chips
         - Ghost Mode toggle, Start Pomodoro, Morning Ritual, AI Suggest
  2.5.6  GreetingBar: time-aware greeting
         - 5-11: "Good morning", 12-17: "Good afternoon", 18+: "Good evening"
         - Right side: streak counter (flame + count), notification bell
  2.5.7  UpcomingPreview: next 3 tasks as compact cards
  2.5.8  AiInsightCard with rule-based insights:
         - Defer count: "You deferred [task] N times. Break it down?"
         - Completion pattern: "Most productive at [time] on [day]"
         - Uses local Drift data only (no API in v1)
  2.5.9  Riverpod providers:
         - homeTasksProvider (today's tasks sorted by due_at, priority)
         - progressRingsProvider (calculated from daily completions)
         - dailyContentProvider (from local cache, fallback to API)
         - streakProvider (from streaks Drift table)
         - upcomingTasksProvider (next 3 tasks after today)
         - insightsProvider (rule-based from local data)
  2.5.10 Connect all widgets to go_router navigation
  2.5.11 Write widget tests (15+ tests)

  FLUTTER PACKAGES:
  - flutter_animate 4.x (micro-interactions, stagger animations)
  - shimmer 3.x (skeleton loading with purple gradient)
  - flutter_slidable 3.x (swipe actions on task cards)
  - cached_network_image 3.x (content card images)

  ANIMATIONS:
  - Progress rings: AnimatedBuilder + CustomPainter, spring physics
  - Task completion: Checkbox springs (overshoot-settle, 300ms)
  - Content card: PageView with parallax on swipe
  - Pull to refresh: CustomScrollView with UNJYNX logo animation
  - Skeleton loading: Shimmer with purple gradient (0.8s cycle)

================================================================================
  TASK 2.6: FLUTTER - Task Management Screens (D1-D6)
  Duration: 5 days | Week 7-8
================================================================================

  WHAT:
  Build all 6 task management screens.

  SCREENS: D1 (Quick Create), D2 (Task Detail), D3 (Task List),
           D4 (Kanban - Pro), D5 (Recurring Builder), D6 (Templates)

  SUB-TASKS:
  2.6.1  D1 - Quick Create Sheet (Bottom Sheet):
         - NLP text parsing (v1: regex-based date/time extraction):
           "Buy milk Monday 9am" -> title:"Buy milk", day:Monday, time:9:00
           Patterns: relative dates (tomorrow, next week), day names,
           time formats (9am, 14:00, noon), priority (#p1, !important),
           project refs (@work)
         - Voice input button (speech_to_text package)
         - Horizontal icon row: calendar, flag, folder, tag, repeat, clip
         - Date/time picker (Material showDatePicker + showTimePicker)
         - Priority selector (P1-P4 color chips)
         - Project selector (dropdown with color dots)
         - Tag input (chip input with autocomplete)
         - "Add to [Project Name]" gold CTA button
         - Spring animation: task card drops into list
         Files:
         - lib/presentation/sheets/quick_create_sheet.dart
         - lib/domain/services/nlp_parser.dart

  2.6.2  D2 - Task Detail Screen (Full-screen, scrollable):
         - Top bar: Back arrow | Editable title | 3-dot menu
         - Large completion button (animated)
         - Info Section (each tappable to edit):
           Project, Due date+time, Priority, Duration, Recurrence,
           Tags, Labels, Reminder settings
         - Description: rich text (flutter_quill, markdown)
         - Subtasks: add inline, ReorderableListView, progress bar
         - Activity Log (collapsible): timestamps, sync status
         - Attachments (Pro): file_picker -> MinIO -> thumbnails
         - AI Section: "Break this down" (v1: template-based)
         - Bottom Actions: Duplicate | Move | Add to ritual | Delete
         Files:
         - lib/presentation/screens/task_detail_screen.dart
         - lib/presentation/widgets/subtask_list.dart
         - lib/presentation/widgets/task_info_section.dart
         - lib/presentation/widgets/activity_log.dart

  2.6.3  D3 - Task List View:
         - Filter chips: All|Today|Upcoming|Overdue|No Date|Completed,
           Priority, Energy, Tag, Assignee (team)
         - Sort: Due date|Priority|Created|Alpha|Energy
         - View toggle: List | Kanban (Pro) | Compact
         - Bulk actions (long press multi-select):
           Complete | Move | Reschedule | Delete | Set priority
         - Full-text search with filter combination
         Files:
         - lib/presentation/screens/task_list_screen.dart
         - lib/presentation/widgets/filter_chip_bar.dart

  2.6.4  D4 - Kanban Board (Pro):
         - Columns: configurable (Status | Priority | Custom)
         - Drag and drop between columns
         - Card: title, priority, assignee, due date
         - Column header: count + collapse, WIP limits (Team)
         Files:
         - lib/presentation/screens/kanban_screen.dart

  2.6.5  D5 - Recurring Task Builder:
         - Visual RRULE builder (no jargon)
         - Presets: Daily|Weekdays|Weekly|Biweekly|Monthly|Yearly
         - Custom: "Every [N] [unit] on [days] at [time]"
         - Advanced: "After completion" mode
         - Calendar preview: next 5 occurrences
         - End: Never | After N | Until date
         Files:
         - lib/presentation/sheets/recurring_builder_sheet.dart
         - lib/domain/services/rrule_service.dart

  2.6.6  D6 - Task Templates:
         - Browse: Personal, Professional, system-provided
         - Save task as template, apply template to create
         - Free: 5 built-in | Pro: unlimited
         Files:
         - lib/presentation/screens/templates_screen.dart

  2.6.7  Riverpod providers: taskListProvider, taskDetailProvider,
         taskCreateProvider, taskUpdateProvider, templateListProvider,
         recurrenceProvider
  2.6.8  Drift DAO updates for filtered/sorted queries
  2.6.9  Write tests (25+ tests)

  FLUTTER PACKAGES:
  - speech_to_text 7.x, flutter_quill 10.x, file_picker 8.x,
    flutter_slidable 3.x, rrule 0.2+

  DSA: NLP regex O(p*n), Priority queue for sort, DAG subtask deps (v2)

================================================================================
  TASK 2.7: FLUTTER - Calendar and Scheduling (F1-F3)
  Duration: 3 days | Week 8
================================================================================

  SCREENS: F1 (Calendar View), F2 (Time Blocking - Pro), F3 (Pomodoro Timer)

  SUB-TASKS:
  2.7.1  F1 - Calendar View (Tab 4):
         - View modes: Day | 3-Day | Week | Month (segmented control)
         - Day view: 24h scrollable timeline, task blocks at times,
           color-coded by project, tap empty slot -> Quick Create
         - Week view: 7-column grid, compact task chips
         - Month view: calendar grid, task count dots (heatmap intensity)
         - Drag to reschedule (Day/Week views)
         - Calendar sync: Google/Apple/Outlook as ghost blocks
         - Free: 1 calendar | Pro: unlimited
         Files:
         - lib/presentation/screens/calendar_screen.dart
         - lib/presentation/widgets/day_view.dart
         - lib/presentation/widgets/week_view.dart
         - lib/presentation/widgets/month_view.dart

  2.7.2  F2 - Time Blocking Screen (Pro):
         - Split: unscheduled tasks (left) + day timeline (right)
         - Drag tasks onto timeline -> creates time blocks
         - 15-min snap increments
         - Color by project/energy
         - "Auto-schedule remaining" (v1: rule-based by energy+priority)
         Files:
         - lib/presentation/screens/time_blocking_screen.dart

  2.7.3  F3 - Pomodoro Timer:
         - Full-screen focus mode
         - Large circular timer (CustomPainter arc decrement)
         - Current task below timer
         - Session counter: "Pomodoro 3 of 4"
         - Start / Pause / Reset
         - Ambient sounds: rain, forest, cafe, lo-fi, silence (just_audio)
         - Floating bubble when navigating away
         - Post-session: focus rating (1-5), auto-log time, focus ring fill
         Files:
         - lib/presentation/screens/pomodoro_screen.dart
         - lib/presentation/widgets/timer_ring.dart
         - lib/domain/services/pomodoro_service.dart

  2.7.4  Riverpod providers: calendarTasksProvider, timeBlocksProvider,
         pomodoroTimerProvider, ambientSoundProvider
  2.7.5  Drift queries for date-range task retrieval
  2.7.6  Write tests (12+ tests)

  FLUTTER PACKAGES:
  - table_calendar 3.x, just_audio 0.9.x, audio_session 0.1.x,
    flutter_local_notifications 17.x

  ANIMATIONS:
  - Timer ring: smooth arc decrement (Curves.linear)
  - Session complete: ring fills gold + haptic + bell
  - Time block drag: ghost preview follows finger, snap on drop
  - Calendar transitions: hero animation between views

================================================================================
  TASK 2.8: FLUTTER - Ghost Mode (G1)
  Duration: 2 days | Week 9
================================================================================

  SCREEN: G1 - Ghost Mode Screen (anti-overwhelm, ultra-minimal)

  SUB-TASKS:
  2.8.1  Ghost Mode screen:
         - Activated: double-tap Home tab, Quick Actions, Settings toggle
         - Dark calming purple gradient (LinearGradient)
         - Single most important task: large, centered
         - Breathing text animation (scale 1.0->1.02->1.0, 3s cycle)
         - "This is all that matters right now."
         - Single large completion button
         - "Exit Ghost Mode" (top-right, muted opacity)
         Files:
         - lib/presentation/screens/ghost_mode_screen.dart
         - lib/presentation/widgets/breathing_text.dart

  2.8.2  BreathingText widget:
         - AnimationController with CurvedAnimation (Curves.easeInOut)
         - Scale 1.0 -> 1.02, Opacity 0.8 -> 1.0, 3s cycle, repeat

  2.8.3  Completion flow:
         - Complete: gentle shimmer (NO confetti), CustomPainter radial glow
         - Next task slides in (SlideTransition from bottom, spring)
         - All done: "All caught up" zen screen with breathing circle

  2.8.4  Task prioritization logic (GhostModeNotifier):
         1. Overdue tasks first
         2. Priority P1 -> P4
         3. Due date earliest first
         4. Creation date oldest first
         - Focus time tracked for Progress Rings

  2.8.5  Navigation blocking:
         - All navigation disabled in Ghost Mode
         - System back shows "Exit Ghost Mode?" dialog
         - Only exit via explicit tap

  2.8.6  Write tests (8+ tests): prioritization, state transitions, nav

  ANIMATIONS:
  - Entry: fade-in from black (500ms) + scale 0.95->1.0
  - Breathing: continuous scale+opacity oscillation
  - Completion: soft gold shimmer radiates from center
  - Next task: SlideTransition bottom-up, spring curve
  - Exit: fade-out to normal Home

================================================================================
  TASK 2.9: FLUTTER - Daily Content and Rituals (H1-H4)
  Duration: 4 days | Week 9
================================================================================

  SCREENS: H1 (Content Feed), H2 (Category Selector),
           H3 (Morning Ritual), H4 (Evening Review)

  SUB-TASKS:
  2.9.1  H1 - Daily Content Feed:
         - Today's content (large card):
           Quote text: Playfair Display italic
           Source + author, Category badge
           Actions: Save (heart) | Share
         - Content history (scrollable below)
         - "Explore categories" -> H2
         - Share as UNJYNX-branded image card:
           screenshot package -> RepaintBoundary capture
           Midnight purple bg + gold text + UNJYNX logo
           Sizes: 9:16 (IG Stories), 1:1 (WhatsApp)
         Files:
         - lib/presentation/screens/content_feed_screen.dart
         - lib/presentation/widgets/content_card.dart
         - lib/domain/services/content_share_service.dart

  2.9.2  H2 - Content Category Selector:
         - Grid of 10 categories:
           1. Stoic Wisdom - "Ancient philosophy. Modern edge."
           2. Ancient Indian Wisdom - "5,000 years of power."
           3. Growth Mindset - "Rewire how you think."
           4. Dark Humor & Anti-Motivation - "Laugh at the chaos."
           5. Anime & Pop Culture - "Level up. Main character energy."
           6. Gratitude & Mindfulness - "Anti-jinx your negativity."
           7. Warrior Discipline - "Empires were not built comfortably."
           8. Poetic Wisdom - "Words that haunt and heal."
           9. Productivity Hacks - "One technique. Every day."
           10. Comeback Stories - "They were worse off than you."
         - Each card: icon + name + tagline + sample quote
         - Tap to preview 3 quotes before selecting
         - Delivery time picker (default 7:00 AM)
         - Free: 1 category | Pro: all 10
         Files:
         - lib/presentation/screens/category_selector_screen.dart

  2.9.3  H3 - Morning Ritual (5-10 min sequential flow):
         Step 1: Mood Check-in (5-point emoji slider: drained->energized)
         Step 2: Gratitude Prompt (text + voice input)
         Step 3: Daily Content (today's quote with reflection)
         Step 4: Day Preview (top 3 tasks with time estimates)
         Step 5: Intention Setting (free text)
         Step 6: "Go Break the Curse!" (motivational animation)
         - Sunrise gradient wash on completion
         - Ritual streak increment
         Files:
         - lib/presentation/screens/morning_ritual_screen.dart
         - lib/presentation/widgets/mood_slider.dart

  2.9.4  H4 - Evening Review (3-5 min sequential flow):
         Step 1: Day Recap (completed vs planned ring)
         Step 2: Wins (highlight completed tasks)
         Step 3: Carry Forward (incomplete -> reschedule or drop)
         Step 4: Reflection (optional text)
         Step 5: Tomorrow Preview (priority-sorted)
         Step 6: Gratitude Close
         - Calming sunset gradient on completion
         Files:
         - lib/presentation/screens/evening_review_screen.dart

  2.9.5  Backend API:
         GET  /api/v1/content/today          - Today's content for user
         GET  /api/v1/content/categories      - List all 10 categories
         GET  /api/v1/content/categories/:id  - Preview 3 quotes
         POST /api/v1/content/save            - Save/favorite content
         GET  /api/v1/content/saved           - User's saved content
         PUT  /api/v1/content/preferences     - Update category + time
         POST /api/v1/rituals                 - Log ritual completion
         GET  /api/v1/rituals/history         - Ritual history

  2.9.6  Content rotation algorithm (backend):
         - Weighted random from selected category
         - Weight = 1 / (times_shown + 1) for variety
         - No repeat within 30-day window
         - Pool: 300-2000 entries per category
         DSA: Vose's alias method for O(1) weighted random,
         O(n) setup. Weighted reservoir sampling for initial pool.

  2.9.7  Drift tables: daily_content_cache, ritual_log, content_preferences
  2.9.8  Riverpod: dailyContentProvider, contentCategoriesProvider,
         morningRitualProvider, eveningReviewProvider, ritualStreakProvider
  2.9.9  Write tests (18+ tests)

  FLUTTER PACKAGES:
  - share_plus 10.x, screenshot 3.x, path_provider 2.x, speech_to_text 7.x

  ANIMATIONS:
  - Content card: parallax on swipe, fade-in on load
  - Morning ritual: sunrise gradient (orange->gold->purple sky)
  - Evening review: sunset gradient (purple->navy->stars)
  - Mood slider: emoji morphs (scale + color shift)
  - Step transitions: SlideTransition left-right with stagger

  ML/DL:
  - v1: Weighted random content selection
  - v2: Hybrid CF + content-based (ALS matrix factorization)
    Ref: Koren et al 2009, IEEE Computer

================================================================================
  TASK 2.10: FLUTTER - Progress Hub (I1)
  Duration: 3 days | Week 10
================================================================================

  SCREEN: I1 - Progress Hub (Apple Fitness/Strava style, NOT gamified)

  SUB-TASKS:
  2.10.1  Layout (scrollable):
          1. Progress Rings (hero, interactive, tap for detail)
          2. Streak Counter (number + flame + 14-day strip)
          3. Activity Heatmap (GitHub contribution graph, 52 weeks)
          4. Weekly Insights Card (rotates every Monday)
          5. Personal Bests (stat row)

  2.10.2  Progress Rings (enhanced):
          - 3 rings: Tasks (Gold), Focus (Violet), Habits (Emerald)
          - Tap any ring -> detail breakdown sheet
          - Weekly comparison sparkline below each ring

  2.10.3  Activity Heatmap:
          - 52-week grid (7x52), CustomPainter for 364 cells
          - Color: Empty -> Light purple -> Deep violet -> Gold
          - Tap day -> popup with tasks completed
          - Free: 30 days | Pro: full year
          DSA: 2D array with quantile color mapping, O(1) per cell

  2.10.4  Streak Counter:
          - Large number + flame icon
          - Personal best alongside (muted)
          - Streak freeze (Pro: 1/week)
          - 14-day strip: filled | empty | freeze used
          - Kind reset copy: "Streaks reset. Your progress doesn't."

  2.10.5  Weekly Insights Card:
          - New insight every Monday (creates anticipation)
          - "Most productive day was [Day] ([N] tasks)"
          - "Completed [X]% more than last week"
          - "[N] tasks deferred 2+ times"
          Files:
          - lib/domain/services/insights_engine.dart

  2.10.6  Personal Bests: most tasks/day, longest streak, fastest
          project, total completed. Clean stat row.

  2.10.7  Backend API:
          GET  /api/v1/progress/rings     - Today's ring data
          GET  /api/v1/progress/streak    - Streak + personal best
          GET  /api/v1/progress/heatmap   - Daily data (date range)
          GET  /api/v1/progress/insights  - Weekly insights
          GET  /api/v1/progress/bests     - Personal bests
          POST /api/v1/progress/snapshot  - Save daily snapshot (cron)

  2.10.8  Riverpod providers: progressRingsDetailProvider,
          streakDetailProvider, activityHeatmapProvider,
          weeklyInsightsProvider, personalBestsProvider
  2.10.9  Drift queries for progress aggregation
  2.10.10 Write tests (12+ tests)

  FLUTTER PACKAGES: fl_chart 0.68+, custom CustomPainter for heatmap

  ML/DL:
  - v1: SQL aggregation (GROUP BY day/hour) for patterns
  - v2: Prophet time series (Taylor & Letham 2017)
  - v2: Isolation Forest for deferred task detection (Liu et al ICDM 2008)

================================================================================
  TASK 2.11: FLUTTER - Drift Schema Expansion
  Duration: 2 days | Week 10
================================================================================

  WHAT:
  Expand Drift (SQLite) schema for all Phase 2 features.

  NEW TABLES:
  - daily_content_cache (last 30 entries)
  - content_preferences (categories + delivery time)
  - ritual_log (mood, gratitude, intention per day)
  - progress_snapshots (daily tasks/focus/habits aggregates)
  - pomodoro_sessions (focus session records)
  - ghost_mode_sessions (session tracking)
  - streaks (current + longest streak)
  - personal_bests (milestone records)
  - task_templates (cached templates)
  - recurring_rules (local RRULE storage)
  - reminders_local (local scheduled reminders)

  SUB-TASKS:
  2.11.1 Define new table classes in service_database
  2.11.2 Write DAOs for each table
  2.11.3 Write migration (schema version 2 -> 3)
  2.11.4 Update service_sync for new entity types
  2.11.5 Write migration tests (verify data preservation)
  2.11.6 Write DAO tests (10+ tests)

================================================================================
  TASK 2.12: INTEGRATION - End-to-End Wiring
  Duration: 3 days | Week 10
================================================================================

  WHAT:
  Wire all Phase 2 screens with backend API, offline sync, navigation.

  SUB-TASKS:
  2.12.1  Wire auth: Flutter -> Logto -> backend user creation
  2.12.2  Wire task CRUD: Flutter -> Drift -> sync -> backend -> PostgreSQL
  2.12.3  Wire daily content: backend seed -> API -> Flutter cache -> display
  2.12.4  Wire progress: completions -> snapshots -> rings + heatmap
  2.12.5  Wire Pomodoro: timer -> session log -> focus ring
  2.12.6  Wire Ghost Mode: enter -> focus tracking -> exit -> home
  2.12.7  Wire rituals: morning/evening -> ritual log -> streak
  2.12.8  Update go_router with all new routes:
          /home, /tasks, /tasks/create, /tasks/:id, /tasks/:id/recurring,
          /templates, /kanban, /calendar, /calendar/time-blocking,
          /pomodoro, /ghost-mode, /content, /content/categories,
          /rituals/morning, /rituals/evening, /progress
  2.12.9  Full navigation test: tap through all screens
  2.12.10 Offline test: airplane mode -> create -> online -> sync
  2.12.11 Write integration tests (15+ tests)

================================================================================
  PHASE 2 SUMMARY
================================================================================

  TESTING:
  Backend: 40+ new (schema, auth, CRUD, sync, content, progress)
  Flutter unit: 80+ new (widgets, providers, services)
  Flutter integration: 15+ new (navigation, offline sync)
  TOTAL PHASE 2: ~135+ new tests
  CUMULATIVE: ~341+ total (206 Phase 1 + 135 Phase 2)

  DSA USED IN PHASE 2:
  - B-tree / composite indexes: All database query optimization
  - GIN (tsvector): Full-text search on tasks
  - Cursor-based pagination: O(log n) vs O(n) offset
  - RRULE FSM: Recurring task generation (RFC 5545)
  - LWW-Register CRDT: Field-level sync conflict resolution
  - Weighted reservoir sampling: Content rotation without repeats
  - Vose's alias method: O(1) weighted random selection
  - Priority queue / comparison sort: Multi-criteria task ordering
  - Sliding window counter: Rate limiting with Valkey
  - HMAC-SHA256 / RS256: JWT authentication
  - NLP regex patterns: Date/time extraction from natural text

  ML/DL IN PHASE 2 (all v1 = rule-based):
  - Content recommendation: Weighted random -> v2: ALS matrix factorization
  - Productivity insights: SQL aggregation -> v2: Prophet time series
  - Task decomposition: Template matching -> v2: Claude Haiku NLP
  - Deferred task detection: Count threshold -> v2: Isolation Forest
  - NLP date parsing: Regex patterns -> v2: Chrono.js + Claude fallback

  BACKEND PACKAGES:
  drizzle-orm, drizzle-kit, drizzle-zod, jose, rrule,
  @paralleldrive/cuid2, @hono/zod-validator, vitest, pino

  FLUTTER PACKAGES:
  logto_dart_sdk, flutter_secure_storage, flutter_animate,
  flutter_slidable, shimmer, speech_to_text, flutter_quill,
  table_calendar, just_audio, fl_chart, share_plus, screenshot,
  file_picker, rrule, cached_network_image, path_provider,
  flutter_local_notifications
`;

fs.appendFileSync(path, content);
const lines = fs.readFileSync(path, 'utf8').split('\n').length;
console.log('Tasks 2.5-2.12 + Phase 2 Summary written. Total lines:', lines);
