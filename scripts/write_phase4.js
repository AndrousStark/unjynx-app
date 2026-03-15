const fs = require('fs');
const path = 'C:/Users/SaveLIFE Foundation/Downloads/personal/Project- TODO Reminder app/COMPREHENSIVE-PHASE-PLAN.doc';

const content = `

################################################################################
  PHASE 4: PREMIUM, TEAM AND ADMIN
  Timeline: Weeks 15-19 (5 weeks) | Status: PLANNED
  Screens: I2-I4, L1-L2, M1-M2, E1-E4, N1-N5, P1-P2, W1-W5,
           Watch App, Q1-Q10 (web), R1-R8 (web)
  Backend: Billing, team mgmt, admin APIs, gamification, widgets
################################################################################

  OVERVIEW:
  ---------
  Phase 4 adds monetization (Pro/Team), team collaboration, complete
  settings, profile, gamification, widgets, watch app basics, and
  the admin/developer web portals.

  PREREQUISITES:
  - Phase 3 complete (8 channels, 436+ tests)
  - At least one external channel working end-to-end

  SUCCESS CRITERIA:
  - In-app purchases working (RevenueCat)
  - Team features functional for 3+ members
  - Admin portal operational with user/content management
  - Widgets rendering on both iOS and Android
  - 591+ total tests

================================================================================
  TASK 4.1: BACKEND - Billing and Subscription Management
  Duration: 3 days | Week 15
================================================================================

  WHAT:
  In-app purchases via RevenueCat (wraps App Store + Play Store).

  SUB-TASKS:
  4.1.1  RevenueCat project setup:
         - Create project in RevenueCat dashboard
         - Link App Store Connect + Google Play Console
         - Configure entitlements: pro, team
         - Configure offerings: monthly, annual, lifetime
  4.1.2  Plans and pricing:
         - Free: basic features, 10 projects, Push+Telegram+Email
         - Pro: $4.99/mo ($3.99 India Rs 99/mo), all features
         - Annual: $39.99/yr ($29.99 India Rs 999/yr) - 33% savings
         - Lifetime: $99.99 one-time
         - Team: $6.99/user/mo, min 3 seats
  4.1.3  Feature gating middleware (src/middleware/plan-guard.ts):
         - Check user.plan before accessing Pro/Team features
         - Return 403 with upgrade prompt for locked features
         - Endpoints: specific routes decorated with planGuard('pro')
  4.1.4  RevenueCat webhook handler:
         - Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION,
           BILLING_ISSUE, EXPIRATION, PRODUCT_CHANGE
         - Update user.plan in database on each event
  4.1.5  Write tests (10+ tests)

  API ENDPOINTS:
  GET    /api/v1/billing/plans           - Available plans with pricing
  GET    /api/v1/billing/subscription    - Current user subscription
  POST   /api/v1/billing/webhook         - RevenueCat webhook
  GET    /api/v1/billing/invoices        - Invoice history
  POST   /api/v1/billing/coupon/validate - Validate discount code

  FLUTTER PACKAGES: purchases_flutter 8.x (RevenueCat SDK)

================================================================================
  TASK 4.2: FLUTTER - Progress Dashboard, Accountability, Game Mode (I2-I4)
  Duration: 4 days | Week 15
================================================================================

  SCREENS: I2 (Dashboard Pro), I3 (Accountability Pro), I4 (Game Mode Pro)

  SUB-TASKS:
  4.2.1  I2 - Progress Dashboard (Pro):
         Deep analytics. Feels like personal Strava for productivity.
         - Completion Trend: line chart (30/90/365 days)
         - Productivity by Day: bar chart (which weekdays best)
         - Productivity by Hour: heatmap (which hours most productive)
         - Estimated vs Actual: scatter plot (time estimate accuracy)
         - Completion Rate: % completed vs created (weekly trend)
         - Focus Time: Pomodoro + Ghost Mode minutes (weekly bars)
         - Procrastination Pattern: avg defer count before completion
         - Category Breakdown: donut chart (work/personal/health/etc)
         - Export as PDF/PNG
         - All charts: UNJYNX colors (purple/gold/emerald)
         Files:
         - lib/presentation/screens/progress_dashboard_screen.dart
         - lib/presentation/widgets/chart_*.dart (8 chart widgets)

  4.2.2  I3 - Accountability Partners (Pro):
         - Invite up to 3 partners via link/QR
         - Partner cards: avatar + name + streak (if shared)
         - Nudge: 1/day/partner, warm copy
           "Just a friendly poke" / "Your partner believes in you"
         - Shared Goals (optional): both set same goal, side-by-side
         - Weekly Summary: auto-sent Sunday
         Files:
         - lib/presentation/screens/accountability_screen.dart
         - lib/presentation/widgets/partner_card.dart

  4.2.3  I4 - Game Mode (Opt-in Pro):
         Turned off by default. Enabled in Settings.
         - XP System: task +5, last task +20, ritual +25,
           ghost mode +15, pomodoro +10, streak milestones +50-1000
         - 500 XP per level, uncapped, understated titles
         - 30 Achievements (progressive reveal, not wall of locked)
           Categories: Consistency, Volume, Exploration, Special
         - Leaderboards: Friends-only, Team (NO global)
           Soft language: "5th of 12 friends" not "#5 RANK"
         - Challenges: 1 active at a time, week-long, friend vs friend
         Files:
         - lib/presentation/screens/game_mode_screen.dart
         - lib/presentation/widgets/xp_bar.dart
         - lib/presentation/widgets/achievement_grid.dart
         - lib/presentation/widgets/leaderboard_list.dart

  4.2.4  Backend API:
         GET    /api/v1/gamification/xp          - User XP + level
         GET    /api/v1/gamification/achievements - Unlocked list
         GET    /api/v1/gamification/leaderboard  - Friends/team board
         POST   /api/v1/gamification/challenge    - Create challenge
         GET    /api/v1/accountability/partners   - List partners
         POST   /api/v1/accountability/invite     - Invite partner
         POST   /api/v1/accountability/nudge      - Send nudge

  4.2.5  Write tests (20+ tests)

  FLUTTER PACKAGES: fl_chart 0.68+, share_plus 10.x, qr_flutter 4.x

================================================================================
  TASK 4.3: FLUTTER - Profile and Settings (L1-L2, M1-M2)
  Duration: 3 days | Week 16
================================================================================

  SCREENS: L1 (Profile), L2 (Edit Profile), M1 (Settings), M2 (Billing)

  SUB-TASKS:
  4.3.1  L1 - Profile Screen (Tab 5):
         - Header: avatar + name + plan badge + level (if Game Mode)
         - Stats Row: tasks completed | streak | completion rate
         - Quick Links: Progress Hub, Dashboard, Accountability, Game Mode
         - Activity Heatmap (same as I1, compact)
         - Connected Channels: channel icons with status
         - Settings gear icon, Sign Out
         Files:
         - lib/presentation/screens/profile_screen.dart

  4.3.2  L2 - Edit Profile:
         - Display name, avatar (camera/gallery/remove), timezone,
           industry mode selector, bio
         - Danger zone: Export data, Delete account (type DELETE)
         Files:
         - lib/presentation/screens/edit_profile_screen.dart

  4.3.3  M1 - Settings Screen (all sections):
         Account: profile, billing, connected accounts, export, delete
         Appearance: theme (dark/light/system), color scheme (5 options
           + custom Pro), font size, density, animations, haptics
         Notifications: channels (J1), preferences (J5), quiet hours,
           completion sounds (20+), badge count
         Task Defaults: project, priority, reminder offset, view, week
           start, date/time format
         Productivity: Ghost Mode, Pomodoro durations, ritual times,
           content delivery time
         AI: smart suggestions on/off, proactive insights on/off
         Integrations: calendar sync (Google/Apple/Outlook)
         Data & Privacy: offline mode, sync settings, cache, privacy,
           terms, licenses
         About: version, changelog, rate us, feedback, support, social
         Files:
         - lib/presentation/screens/settings_screen.dart
         - lib/presentation/screens/appearance_settings_screen.dart
         - lib/presentation/screens/task_defaults_screen.dart

  4.3.4  M2 - Plan & Billing:
         - Current plan card with features
         - Upgrade CTA: side-by-side Free vs Pro comparison
         - Annual savings highlight
         - Regional pricing auto-detected
         - 7-day free trial toggle
         - Manage subscription / cancel
         Files:
         - lib/presentation/screens/billing_screen.dart

  4.3.5  Write tests (12+ tests)

  FLUTTER PACKAGES: image_picker 1.x, dynamic_color 1.x,
                    shared_preferences 2.x

================================================================================
  TASK 4.4: FLUTTER - Projects and Workspaces (E1-E4)
  Duration: 3 days | Week 16
================================================================================

  SCREENS: E1 (Project List), E2 (Project Detail), E3 (Create/Edit),
           E4 (Workspace - Team)

  SUB-TASKS:
  4.4.1  E1 - Project List (Tab 2):
         - Sections: Favorites, Active, Shared, Archived (collapsible)
         - Project card: color dot, icon, name, task count, progress bar,
           member avatars (max 3 + overflow count)
         - Tap -> E2, Long press -> quick actions
         - Free: 10 projects | Pro: unlimited | Team: shared workspace

  4.4.2  E2 - Project Detail:
         - Header: name, description, members, progress ring
         - Task list (scoped), view toggle (List/Kanban/Timeline)
         - Sections within project
         - Team: activity feed, member management

  4.4.3  E3 - Create/Edit Project:
         - Name, description, color picker (18 + custom hex),
           icon picker (200+ Material), default view, template,
           visibility, due date, team members

  4.4.4  E4 - Workspace (Team):
         - Org container, members with online status,
           projects grid, activity feed, quick stats

  4.4.5  Write tests (15+ tests)

================================================================================
  TASK 4.5: FLUTTER - Task Import/Export
  Duration: 2 days | Week 17
================================================================================

  SUB-TASKS:
  4.5.1  Import from 5 sources:
         - Todoist CSV, TickTick CSV (file upload + parse)
         - Apple Reminders (CalDAV), Google Tasks (OAuth API)
         - Generic CSV with column mapping UI
  4.5.2  Import flow:
         Select source -> upload/OAuth -> preview 10 tasks ->
         column mapping -> import with progress bar -> summary
  4.5.3  Duplicate detection: title + due_date match
  4.5.4  Export: CSV, JSON, ICS (RFC 5545)
  4.5.5  GDPR data request: full JSON export in 72 hours
  4.5.6  Account deletion: type DELETE, removed in 30 days

  API ENDPOINTS:
  POST   /api/v1/import/upload      - Upload CSV
  POST   /api/v1/import/preview     - Preview parsed tasks
  POST   /api/v1/import/execute     - Execute import
  GET    /api/v1/export/csv         - CSV export
  GET    /api/v1/export/json        - JSON export
  GET    /api/v1/export/ics         - ICS export
  POST   /api/v1/data/request       - GDPR request
  DELETE /api/v1/data/account       - Delete account

  4.5.7  Write tests (10+ tests)

  FLUTTER PACKAGES: file_picker 8.x, csv 6.x

================================================================================
  TASK 4.6: FLUTTER - Team and Collaboration (N1-N5)
  Duration: 4 days | Week 17
================================================================================

  SCREENS: N1 (Dashboard), N2 (Members), N3 (Shared Project),
           N4 (Reports), N5 (Async Standup)

  SUB-TASKS:
  4.6.1  N1 - Team Dashboard:
         - Team name + member count
         - Active projects with completion status
         - Team completion rings (aggregate)
         - Activity feed, upcoming deadlines
         - Workload heatmap: who is overloaded?

  4.6.2  N2 - Team Member Management:
         - Member table: avatar, name, role, status, stats
         - Invite: email/link/QR, role selection
         - Roles: Owner | Admin | Member | Viewer (Guest free)
         - Project access control

  4.6.3  N3 - Shared Project View:
         - E2 + assignee column, assignee filter
         - Workload balance, comment thread, @mentions
         - Activity feed sidebar

  4.6.4  N4 - Team Reports:
         - Productivity over time, individual contributions
         - Project completion rates, overdue by assignee
         - Time tracking, channel usage
         - Export PDF/CSV/API

  4.6.5  N5 - Async Standup:
         - Auto-generated from task activity:
           Done yesterday | Planned today | Blockers
         - Delivered to team channel at configured time
         - Standup history

  4.6.6  Backend API:
         POST   /api/v1/teams                    - Create team
         GET    /api/v1/teams/:id                - Get team
         GET    /api/v1/teams/:id/members        - Members
         POST   /api/v1/teams/:id/invite         - Invite
         PATCH  /api/v1/teams/:id/members/:uid   - Update role
         DELETE /api/v1/teams/:id/members/:uid   - Remove
         GET    /api/v1/teams/:id/reports        - Reports
         GET    /api/v1/teams/:id/standup        - Get standup
         POST   /api/v1/teams/:id/standup        - Submit
         POST   /api/v1/tasks/:id/comments       - Add comment
         GET    /api/v1/tasks/:id/comments       - List comments

  4.6.7  Write tests (18+ tests)

================================================================================
  TASK 4.7: FLUTTER - Widgets (W1-W5)
  Duration: 3 days | Week 18
================================================================================

  WHAT:
  Native widgets via home_widget + SwiftUI (iOS) + Jetpack Compose (Android).

  SUB-TASKS:
  4.7.1  W1 - Today's Tasks Widget:
         - Small (2x2): task count "3 left" + progress ring
         - Medium (4x2): next 3 tasks + ring, checkbox to complete
         - Large (4x4): rings + 5 tasks + quote
         - Tap: opens UNJYNX, tap task: opens detail

  4.7.2  W2 - Quick Add Widget:
         - Small (2x1): UNJYNX logo + "Add task"
         - Tap: deep link to Quick Create

  4.7.3  W3 - Progress Rings Widget:
         - Small (2x2): 3 concentric rings + center %
         - Tap: opens Progress Hub

  4.7.4  W4 - Daily Content Widget (Pro):
         - Medium (4x2): quote (2 lines) + author + badge
         - Tap: opens Content Feed

  4.7.5  W5 - Streak Widget:
         - Small (1x1, Android only): flame + number
         - Tap: opens Progress Hub

  4.7.6  iOS Lock Screen Widgets (iOS 16+):
         - Tasks remaining (circular), Streak (circular),
           Next task (rectangular), Progress rings (circular)
         - Read-only (iOS limitation)
         - WidgetKit timeline: every 15 min + on foreground

  4.7.7  Widget theming:
         - System theme (not app theme)
         - Dark: midnight purple bg, white text, gold accents
         - Light: purple mist bg, midnight text, rich gold
         - Border radius: 16dp

  4.7.8  Update frequency: 15 min + on task change callback
  4.7.9  Write tests (8+ tests)

  FLUTTER PACKAGES: home_widget 6.x
  NATIVE: ios/WidgetExtension/ (SwiftUI), android/.../widget/ (Compose)

================================================================================
  TASK 4.8: Watch App Basic (v1)
  Duration: 2 days | Week 18
================================================================================

  WHAT:
  Basic watch app for Pro users. View + complete tasks only.

  SUB-TASKS:
  4.8.1  Apple Watch (watchOS 10+, SwiftUI):
         - Task List: today's tasks (max 10, Digital Crown scroll)
         - Task Detail: title, due, priority, large Done button
         - Progress Rings: 3 concentric (display only)
         - Streak Counter: number + flame
         - Complications: tasks left, streak, next task, rings
         - Sync: Watch Connectivity framework

  4.8.2  Wear OS (Wear OS 4+, Jetpack Compose):
         - Same 4 screens as watchOS
         - Tiles: tasks tile, progress rings tile
         - Sync: Wearable Data Layer API

  4.8.3  v1 limitations: view + complete only, no task creation
  4.8.4  Pro only (watch app is Pro incentive)
  4.8.5  Write tests (5+ per platform)

================================================================================
  TASK 4.9: BACKEND - Admin APIs
  Duration: 3 days | Week 18-19
================================================================================

  SUB-TASKS:
  4.9.1  Admin middleware: check user.role for Super Admin / Dev Admin
  4.9.2  User management endpoints:
         GET/PATCH /api/v1/admin/users, /api/v1/admin/users/:id
  4.9.3  Content management endpoints:
         CRUD /api/v1/admin/content, bulk import
  4.9.4  Analytics endpoints:
         GET /api/v1/admin/analytics/overview, /users, /revenue
  4.9.5  Feature flags endpoints:
         CRUD /api/v1/admin/feature-flags
  4.9.6  Audit log endpoint:
         GET /api/v1/admin/audit-log
  4.9.7  Broadcast endpoint:
         POST /api/v1/admin/broadcast
  4.9.8  Write tests (15+ tests)

================================================================================
  TASK 4.10: WEB - Enterprise Admin Portal (Q1-Q10)
  Duration: 5 days | Week 19
================================================================================

  WHAT:
  React + Refine admin portal, hosted on Vercel. 10 screens.

  SUB-TASKS:
  4.10.1  Project setup: React 19 + Refine 4.x + Ant Design 5.x
  4.10.2  Q1 Admin Login: SSO/Email + MFA
  4.10.3  Q2 Dashboard: users, DAU/MAU, MRR, feature usage, errors
  4.10.4  Q3 User Management: searchable table, detail, actions
  4.10.5  Q4 Content Management: CRUD, scheduling, analytics, import
  4.10.6  Q5 Notification Management: broadcast, templates, logs
  4.10.7  Q6 Feature Flags: targeting, gradual rollout, kill switch
  4.10.8  Q7 Analytics: cohort, funnel, revenue, geographic
  4.10.9  Q8 Support: tickets, reports, knowledge base
  4.10.10 Q9 Billing: subscriptions, coupons, refunds, invoices
  4.10.11 Q10 Compliance: audit log, GDPR requests, consent
  4.10.12 Write tests (20+ React Testing Library + Playwright)

  WEB PACKAGES: react 19, @refinedev/core 4.x, @refinedev/antd,
                antd 5.x, recharts 2.x

================================================================================
  TASK 4.11: WEB - Developer Portal (R1-R8)
  Duration: 4 days | Week 19
================================================================================

  WHAT:
  Engineering team portal. 8 screens. Same stack as Q1-Q10.

  SUB-TASKS:
  4.11.1  R1 System Health: Grafana embed (CPU, memory, latency,
          errors, DB pool, cache hits, queue depths, WS connections)
  4.11.2  R2 Database: schema viewer, migration history, slow query
          log, backup management, data browser (PII masked)
  4.11.3  R3 API Management: OpenAPI docs, key CRUD, rate limits,
          webhooks, usage analytics
  4.11.4  R4 Deployment: service status, deploy history, feature
          flag overrides, env management, canary deployments
  4.11.5  R5 Notification Infra: channel health per provider,
          template approval status, delivery rates, cost tracking
  4.11.6  R6 AI Model Management: model config, prompt versioning,
          cost tracking, quality monitoring, A/B testing
  4.11.7  R7 Channel Providers: Telegram bot status, WhatsApp BSP
          health, Instagram windows, SMS DLT, email reputation
  4.11.8  R8 Data Pipeline: ETL jobs, content pipeline, backup
          verification, data anonymization

================================================================================
  PHASE 4 SUMMARY
================================================================================

  TESTING:
  Backend: 45+ new (billing, admin, team, gamification)
  Flutter: 70+ new (screens, widgets, watch)
  Web: 40+ new (admin portal, dev portal)
  TOTAL PHASE 4: ~155 new tests
  CUMULATIVE: ~591 total (436 Phase 3 + 155 Phase 4)

  DSA:
  - Subscription state machine: Plan transitions (free->pro->team)
  - RBAC tree: Role-based permission hierarchy
  - Widget data bridge: SharedPreferences sync between app and widget
  - Workload distribution: Task count / estimated hours per member

  TOOLS:
  Backend: RevenueCat webhook handler
  Flutter: purchases_flutter, home_widget, image_picker,
           dynamic_color, csv, fl_chart
  Web: React 19, Refine 4.x, Ant Design 5.x, Recharts 2.x, Playwright
`;

fs.appendFileSync(path, content);
const lines = fs.readFileSync(path, 'utf8').split('\n').length;
console.log('Phase 4 written. Total lines:', lines);
