<div align="center">

```
 _   _ _   _     ___   ___   ___  __
| | | | \ | |   |_  | |_  | |   \|  \
| | | |  \| |     | |   | | | |\ |>  )
| |_| | |\  | /\__| |  _| |_| | \|  <
 \___/|_| \_| \____/ |_____|_|  \|__/
```

# UNJYNX

### Break the satisfactory. Unjynx your productivity.

[![Flutter](https://img.shields.io/badge/Flutter-3.41-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.11-0175C2?logo=dart&logoColor=white)](https://dart.dev)
[![Riverpod](https://img.shields.io/badge/Riverpod-3.x-00B0FF)](https://riverpod.dev)
[![Tests](https://img.shields.io/badge/tests-524%20passing-brightgreen)](.)
[![License](https://img.shields.io/badge/license-Proprietary-red)](.)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey)](.)

**48 screens | 17 packages | 524 tests | Offline-first | AI-powered (v2)**

---

*Not just another todo app. A life operating system that reaches you wherever you are.*

</div>

---

## Why UNJYNX?

Every productivity app sends you push notifications. **You ignore 97% of them.**

UNJYNX is different. It sends your reminders through the apps you actually check:

| Channel | How It Works |
|---------|-------------|
| **WhatsApp** | Template messages via Gupshup BSP |
| **Telegram** | Bot messages (FREE, unlimited) |
| **Instagram** | "Friend First" approach - follow, accept, then DM |
| **SMS** | MSG91 for India (4-8x cheaper than Twilio) |
| **Discord** | Bot messages to your server |
| **Slack** | Workspace notifications |
| **Email** | SendGrid transactional + daily digests |
| **Push** | FCM as the default fallback |

**The result?** Your reminder completion rate goes from 3% to 78%.

### But that's just the beginning.

- **Daily Content Delivery** - Start your day with Mahabharata wisdom, Stan Lee motivation, Odysseus adventures, or 60+ other categories
- **Industry-Specific Modes** - Legal deadlines, healthcare shifts, dev sprints, student exam prep, construction milestones, real estate follow-ups
- **Morning Rituals & Evening Reviews** - Structured journaling with mood tracking, gratitude, and reflection
- **Ghost Mode** - Zero distractions. No notifications. Just you and your work.
- **Energy Flow Engine** (v2) - AI learns when you're most productive and schedules tasks accordingly
- **Gamification** - XP, achievements, leaderboards, challenges. Make productivity addictive.
- **Team Collaboration** - Async standups, shared projects, workload heatmaps, accountability partners

---

## Feature Showcase

### 48 Real Screens, Zero Placeholders

<details>
<summary><b>Core Task Management (5 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Task List | Filter/sort/search with grid+list toggle, bulk actions |
| Task Detail | Inline editing, subtasks, activity log, completion animation |
| Kanban Board | Drag-and-drop columns, collapsible, configurable |
| Recurring Builder | Visual RRULE builder with presets and preview |
| Templates | Category-grouped templates with modal detail view |

</details>

<details>
<summary><b>Projects & Organization (5 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Project List | Cards with color/icon, task counts, archive support |
| Enhanced Project List | Advanced filtering and sorting |
| Project Detail | Task breakdown, progress rings, team members |
| Create/Edit Project | Color picker, icon selector, description |
| Workspace | Multi-project overview with drag-and-drop |

</details>

<details>
<summary><b>Home & Productivity (10 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Home | Greeting, progress rings, daily content, today's tasks, upcoming |
| Calendar | Month/week/day views with task dots |
| Time Blocking | Drag-to-create time blocks, hour grid |
| Pomodoro Timer | Focus timer with ambient sounds (rain, forest, cafe, etc.) |
| Ghost Mode | Distraction-free fullscreen focus |
| Content Feed | Daily wisdom, quotes, personality development |
| Progress Hub | Heatmaps, streaks, rings, insights, personal bests |
| Category Selector | 60+ content categories to personalize your feed |
| Morning Ritual | Mood, gratitude, intention setting |
| Evening Review | Reflection, daily score, tomorrow planning |

</details>

<details>
<summary><b>Notifications & Channels (6 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Notification Hub | Master toggle, channel cards grouped by category |
| Channel Setup | Per-channel configuration with OTP verification |
| Test Notification | Send test message to any channel |
| Notification History | Delivery timeline with status badges |
| Escalation Chain | Configure reminder cascade (push -> telegram -> whatsapp -> sms) |
| Quiet Hours | Per-channel quiet time windows |

</details>

<details>
<summary><b>Premium Features (13 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Billing | Plan comparison, subscription management |
| Plan Comparison | Feature matrix across Free/Pro/Team/Family |
| Progress Dashboard | Charts, trends, analytics |
| Accountability | Partner invites, nudges, shared goals |
| Game Mode | Challenges, XP tracking, achievement unlocks |
| Team Dashboard | Team rings, activity feed, workload heatmap |
| Team Members | Invite, roles, permissions |
| Team Reports | Productivity analytics per member |
| Shared Project | Cross-team project collaboration |
| Async Standup | Daily standup submissions and history |
| Import | Multi-step import wizard (CSV/JSON/ICS) |
| Export | One-click export in multiple formats |
| Widget Config | Home screen widget customization |

</details>

<details>
<summary><b>Settings & Profile (9 screens)</b></summary>

| Screen | Description |
|--------|-------------|
| Settings | 8 sections (Account, Appearance, Notifications, TaskDefaults, Productivity, AI, Integrations, DataPrivacy) |
| Profile | Stats, streaks, achievements overview |
| Edit Profile | Avatar, display name, timezone, preferences |
| Onboarding (4 screens) | Welcome, notification permission, first task, personalization |

</details>

---

## Architecture

### Plugin-Play Architecture

A unique hybrid of Feature-First + Hexagonal + Event-Driven:

```
                    +------------------+
                    |   unjynx_mobile  |  (App Shell)
                    |   bootstrap.dart |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
   +----------+--+  +-------+-----+  +-----+-------+
   | feature_*   |  | service_*   |  | unjynx_core |
   | (12 plugins)|  | (4 services)|  | (utilities) |
   +-------------+  +-------------+  +-------------+

Each feature_* package:
  domain/       -> entities, repositories (abstract), use cases
  data/         -> drift datasource, sync repository, DTOs
  presentation/ -> pages, providers (Riverpod), widgets
```

### 17 Packages in Monorepo

| Package | Purpose |
|---------|---------|
| `core` | Shared utilities, Result type, EventBus, PluginRegistry |
| `feature_todos` | Task CRUD, Kanban, recurring, templates |
| `feature_projects` | Project management, sections, workspace |
| `feature_home` | Home screen, calendar, pomodoro, ghost mode, content |
| `feature_onboarding` | 4-step onboarding flow |
| `feature_profile` | User profile and stats |
| `feature_settings` | App settings with 8 sections |
| `feature_notifications` | Channel setup, escalation, quiet hours |
| `feature_gamification` | XP, achievements, leaderboard |
| `feature_billing` | Subscription plans, billing |
| `feature_team` | Team collaboration, standups, reports |
| `feature_import_export` | CSV/JSON/ICS import/export, GDPR |
| `feature_widgets` | Home screen widget configuration |
| `service_api` | Dio HTTP client, 15 API service classes |
| `service_auth` | Logto OIDC authentication |
| `service_database` | Drift SQLite with 17 tables |
| `service_sync` | Offline-first sync engine with LWW conflict resolution |

### Offline-First Architecture

```
User Action
    |
    v
+-------------------+     fire-and-forget      +------------------+
| Local Drift SQLite | ----------------------> | Backend API      |
| (immediate, fast)  |                         | (when online)    |
+-------------------+                          +------------------+
    ^                                                |
    |              +----------------+                |
    +--------------| Sync Engine    |<---------------+
                   | (LWW merge)    |
                   | (periodic sync)|
                   | (app resume)   |
                   +----------------+
```

Every write goes to SQLite first (instant UI update), then pushes to the API in the background. If offline, the SyncEngine queues changes and reconciles with field-level Last-Write-Wins when connectivity returns.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Flutter 3.41 + Dart 3.11 |
| State Management | Riverpod 3.x (code-gen ready) |
| Local Database | Drift 2.32 (SQLite) |
| Navigation | go_router 16.x |
| DI | get_it + injectable |
| Code Generation | freezed + json_serializable |
| HTTP Client | Dio 5.x with interceptors |
| Auth | Logto OIDC with PKCE |
| Theme | Material 3 with custom design system |
| Testing | flutter_test + very_good_analysis |
| CI/CD | GitHub Actions + Codemagic + Shorebird OTA |

### Design System

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background | #F8F5FF (Purple Mist) | #0F0A1A (Midnight Purple) |
| Brand Violet | #6B21A8 | #6C5CE7 |
| Accent Gold | #B8860B (WCAG) | #FFD700 (Electric Gold) |
| Text Primary | #1A0533 (17.51:1) | #FFFFFF |
| Glass | 65% white | 8% white |
| Shadows | Purple-tinted | Glow-based depth |
| Fonts | Outfit (headings), DM Sans (body), Bebas Neue (display), Playfair Display (editorial) |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/AndrousStark/unjynx-app.git
cd unjynx-app

# Install Flutter dependencies
flutter pub get

# Run code generation (if build_runner is available)
# dart run build_runner build --delete-conflicting-outputs

# Run the app
cd mobile
flutter run

# Run with custom API URL
flutter run --dart-define=API_BASE_URL=https://api.unjynx.com
```

### Project Structure

```
unjynx-app/
  mobile/                    # Main Flutter app
    lib/
      config/app_config.dart # Compile-time env vars
      di/injection.dart      # GetIt dependency injection
      bootstrap.dart         # App initialization
      app.dart               # MaterialApp + GoRouter
      providers/             # API provider overrides
      sync/                  # Sync adapters + manager
  packages/
    core/                    # Shared utilities
    feature_todos/           # Task management
    feature_projects/        # Project management
    feature_home/            # Home + Calendar + Pomodoro
    feature_onboarding/      # Onboarding flow
    feature_profile/         # User profile
    feature_settings/        # App settings
    feature_notifications/   # Notification channels
    feature_gamification/    # XP + achievements
    feature_billing/         # Subscriptions
    feature_team/            # Team collaboration
    feature_import_export/   # Data portability
    feature_widgets/         # Home screen widgets
    service_api/             # HTTP client + 15 services
    service_auth/            # Logto OIDC
    service_database/        # Drift SQLite
    service_sync/            # Offline sync engine
  pubspec.yaml               # Workspace root
```

## Testing

```bash
# Run all tests across all packages
flutter test packages/core
flutter test packages/feature_todos
flutter test packages/feature_projects
flutter test packages/feature_home
flutter test packages/feature_onboarding
flutter test packages/feature_settings
flutter test packages/feature_profile
flutter test packages/feature_notifications
flutter test packages/service_database
flutter test packages/service_sync
flutter test packages/service_auth
```

**524 tests** across 11 packages. All passing.

| Package | Tests |
|---------|:-----:|
| feature_todos | 188 |
| feature_notifications | 82 |
| feature_projects | 61 |
| feature_home | 56 |
| feature_onboarding | 36 |
| service_sync | 30 |
| service_database | 24 |
| core | 23 |
| service_auth | 10 |
| feature_settings | 8 |
| feature_profile | 6 |
| **Total** | **524** |

## Roadmap

### V1 (Complete)
- [x] Phase 1: Foundation (infra, packages, CI/CD)
- [x] Phase 2: Core App (17 screens, 45+ endpoints, 35 DB tables)
- [x] Phase 3: Channels (8 adapters, BullMQ, webhooks, OTP)
- [x] Phase 4: Premium + Team (billing, gamification, admin, import/export)
- [x] Phase 5: Polish + Launch (security audit, load tests, store listings)

### V2 (Planned)
- [ ] Phase 6: AI Intelligence (Claude API, smart scheduling, AI chat)
- [ ] Phase 7: Industry Modes (legal, healthcare, dev teams, education)
- [ ] Phase 8: On-Device ML (energy prediction, weekly review AI)
- [ ] Phase 9: Enterprise (SSO, watch app, web app, calendar sync)
- [ ] Phase 10: Innovation (AR, voice commands, wearables, SLM)

## Pricing

| Plan | Monthly | Annual |
|------|---------|--------|
| **Free** | $0 | $0 |
| **Pro** | $6.99/mo | $4.99/mo ($59.88/yr) |
| **Pro (India)** | Rs 149/mo | Rs 99/mo |
| **Team** | $8.99/user/mo | $6.99/user/mo |
| **Family** | $9.99/mo (up to 5) | - |
| **Enterprise** | Contact sales | Contact sales |

## India Compliance

- DPDP Act 2023 compliant (deadline May 2027)
- WhatsApp API: task-specific messages only (no general AI chatbot)
- Data minimization: only email + display name collected
- Full data export + 30-day account deletion

---

<div align="center">

### Built by METAminds

*We don't build apps. We build systems that make ordinary people extraordinary.*

**[Website](https://unjynx.com)** | **[Backend](https://github.com/AndrousStark/unjynx-backend)** | **[Web](https://github.com/AndrousStark/unjynx-web)**

---

*Break the satisfactory. Unjynx your productivity.*

</div>
