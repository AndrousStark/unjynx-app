<p align="center">
  <img src="https://img.shields.io/badge/Flutter-3.27+-02569B?style=for-the-badge&logo=flutter&logoColor=white" alt="Flutter" />
  <img src="https://img.shields.io/badge/Dart-3.11+-0175C2?style=for-the-badge&logo=dart&logoColor=white" alt="Dart" />
  <img src="https://img.shields.io/badge/Riverpod-3.x-00B4D8?style=for-the-badge" alt="Riverpod" />
  <img src="https://img.shields.io/badge/Drift-2.32+-1DB954?style=for-the-badge" alt="Drift" />
  <img src="https://img.shields.io/badge/Tests-810+-4CAF50?style=for-the-badge" alt="Tests" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

<h1 align="center">UNJYNX</h1>
<h3 align="center">Break the satisfactory. Unjynx your productivity.</h3>

<p align="center">
  A cross-platform productivity app with social media reminders, gamification, team collaboration, and AI-powered task intelligence — built with Flutter in a modular monorepo architecture.
</p>

---

## What is UNJYNX?

UNJYNX is a next-generation productivity app that goes beyond traditional to-do lists. It sends reminders through the channels you actually use — WhatsApp, Telegram, Instagram, Discord, Slack, SMS, and Email — not just push notifications you ignore.

### Core USPs

- **Social Media Reminders** — Reach users via WhatsApp, Telegram, Instagram DMs, Discord, Slack, SMS, and Email
- **"Friend First" Approach** — For Instagram: the official page sends a follow request, user accepts, then DM reminders work seamlessly
- **Daily Content Delivery** — Curated wisdom from 60+ categories (philosophy, growth mindset, personality development)
- **Industry-Specific Modes** — Tailored experiences for legal, healthcare, dev teams, education, construction, finance, and more
- **AI-Powered Intelligence** — Smart scheduling, context-aware reminders, Energy Flow Engine
- **Gamification System** — XP, levels, achievements, leaderboards, and challenges to keep you motivated
- **Team Collaboration** — Shared workspaces, standups, accountability partners, and team reports

---

## Architecture

UNJYNX uses a **Plugin-Play Architecture** — a combination of Feature-First, Hexagonal, and Event-Driven patterns organized as a Dart pub workspace monorepo.

```
unjynx-app/
├── apps/
│   └── mobile/              # Main Flutter application shell
├── packages/
│   ├── core/                # Shared models, utils, theme, extensions
│   ├── feature_todos/       # Task management (CRUD, Kanban, filters)
│   ├── feature_projects/    # Project organization & sections
│   ├── feature_home/        # Dashboard, streaks, progress rings, calendar
│   ├── feature_onboarding/  # Welcome flow, personalization, permissions
│   ├── feature_profile/     # User profile & avatar management
│   ├── feature_settings/    # App settings & preferences
│   ├── feature_notifications/ # Notification channels & preferences
│   ├── feature_gamification/  # XP, achievements, leaderboards, challenges
│   ├── feature_billing/     # Subscription plans & payment
│   ├── feature_team/        # Team workspaces, members, standups, reports
│   ├── feature_import_export/ # Data import/export (CSV, JSON, Todoist, etc.)
│   ├── feature_widgets/     # Shared UI components library
│   ├── service_api/         # API client (Dio) & provider definitions
│   ├── service_auth/        # Authentication (Logto OIDC)
│   ├── service_database/    # Local database (Drift/SQLite)
│   ├── service_notification/ # Push notification service
│   └── service_sync/        # Offline-first sync engine
├── infra/                   # Prometheus, Grafana, PostgreSQL configs
├── scripts/                 # Dev setup & build scripts
├── .github/workflows/       # CI/CD (Flutter CI, Backend CI, Deploy)
├── codemagic.yaml           # Codemagic CI/CD (5 workflows)
├── docker-compose.yml       # Local dev stack (11 services)
└── pubspec.yaml             # Workspace root
```

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Offline-First** | Drift (SQLite) as source of truth, background sync to API |
| **Immutability** | All state objects are immutable; new copies on every update |
| **Feature Isolation** | Each feature package has its own domain, data, and presentation layers |
| **API Fallbacks** | Every provider gracefully degrades when the backend is unavailable |
| **Optimistic Updates** | UI updates instantly, rolls back on API failure |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Flutter 3.27+ / Dart 3.11+ |
| **State Management** | Riverpod 3.x (compile-safe, code-gen ready) |
| **Local Database** | Drift 2.32+ (SQLite with type-safe queries) |
| **Navigation** | go_router 16.x (declarative, deep-linking) |
| **Networking** | Dio (interceptors, retry, logging) |
| **Authentication** | Logto (self-hosted OIDC, 30+ social providers, MFA) |
| **Code Generation** | freezed, json_serializable, drift, build_runner |
| **Dependency Injection** | get_it + injectable |
| **Notifications** | awesome_notifications + FCM |
| **Theming** | Material 3 + dynamic_color (midnight purple + gold) |
| **Monorepo** | Dart pub workspaces + Melos 7.x |
| **CI/CD** | GitHub Actions + Codemagic + Shorebird OTA |

---

## Feature Packages (18)

| Package | Description | Tests |
|---------|-------------|-------|
| `core` | Theme, models, extensions, shared utilities | ✅ |
| `feature_todos` | Task CRUD, Kanban board, filters, priorities | ✅ |
| `feature_projects` | Project management, sections, task grouping | ✅ |
| `feature_home` | Dashboard, streaks, progress rings, daily content, calendar | ✅ |
| `feature_onboarding` | Welcome screens, personalization quiz, permissions | ✅ |
| `feature_profile` | User profile, avatar, account management | ✅ |
| `feature_settings` | App settings, theme, language, data management | ✅ |
| `feature_notifications` | Channel management (8 channels), preferences, OTP | ✅ |
| `feature_gamification` | XP system, achievements, leaderboards, challenges | ✅ |
| `feature_billing` | Subscription plans, payment, plan comparison | ✅ |
| `feature_team` | Team workspaces, members, invites, standups, reports | ✅ |
| `feature_import_export` | Import/export (CSV, JSON, Todoist, Trello, Notion) | ✅ |
| `feature_widgets` | Shared UI component library | ✅ |
| `service_api` | API client, endpoint definitions, interceptors | ✅ |
| `service_auth` | Logto OIDC auth, token management, session | ✅ |
| `service_database` | Drift tables, DAOs, migrations | ✅ |
| `service_notification` | Push notification service, FCM integration | ✅ |
| `service_sync` | Offline-first sync engine, conflict resolution | ✅ |

---

## Getting Started

### Prerequisites

- Flutter 3.27+ ([install](https://docs.flutter.dev/get-started/install))
- Dart 3.11+
- Android Studio / Xcode (for device builds)
- Docker (optional, for local backend)

### Setup

```bash
# Clone the repository
git clone https://github.com/AndrousStark/unjynx-app.git
cd unjynx-app

# Install dependencies (workspace-aware)
flutter pub get

# Generate code (freezed, drift, json_serializable)
dart run build_runner build --delete-conflicting-outputs

# Run the app
cd apps/mobile
flutter run
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration:
# - API_BASE_URL (backend endpoint)
# - LOGTO_ENDPOINT (auth server)
# - SENTRY_DSN (crash reporting)
```

### Local Development Stack

```bash
# Start all services (PostgreSQL, Valkey, Logto, MinIO, etc.)
docker compose up -d

# Verify services are running
docker compose ps
```

---

## Testing

810+ tests across 12 packages, all passing.

```bash
# Run all tests
flutter test packages/core
flutter test packages/service_database
flutter test packages/service_auth
flutter test packages/feature_todos
flutter test packages/feature_projects
flutter test packages/feature_home
flutter test packages/feature_onboarding
flutter test packages/feature_settings
flutter test packages/feature_profile
flutter test packages/feature_notifications
flutter test packages/feature_gamification
flutter test packages/feature_team

# Or use Melos to run all at once
melos run test
```

---

## CI/CD

| Platform | Purpose | Trigger |
|----------|---------|---------|
| **GitHub Actions** | Lint, analyze, test, build APK/IPA | Push to `main`, PRs |
| **Codemagic** | Production builds, signing, store deployment | 5 workflows |
| **Shorebird** | OTA updates (bypass store review) | Post-release patches |

---

## Security

- OWASP Mobile Top 10 (M1–M10) — all pass
- OWASP API Security Top 10 (API1–API10) — all pass
- ProGuard/R8 code obfuscation
- Root/jailbreak detection
- Certificate pinning
- Network security config (cleartext blocked)
- No hardcoded secrets (all via `.env`)

---

## Related Repositories

| Repository | Description |
|-----------|-------------|
| [unjynx-backend](https://github.com/AndrousStark/unjynx-backend) | Hono + Drizzle + PostgreSQL API server (private) |
| [unjynx-web](https://github.com/AndrousStark/unjynx-web) | Landing page, Admin panel, Dev portal |

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Foundation | ✅ Complete | Infrastructure, monorepo, CI/CD |
| Phase 2 — Core App | ✅ Complete | 17 screens, 45+ endpoints, 35 DB tables |
| Phase 3 — Channels | ✅ Complete | 8 notification adapters, BullMQ, cron scheduler |
| Phase 4 — Premium + Team | ✅ Complete | Billing, gamification, teams, admin portal |
| Phase 5 — Polish + Launch | ✅ Complete | Security audit, load tests, store listings |
| Phase 6 — AI | 🔜 Next | Claude API, AI chat, auto-schedule |
| Phase 7 — Industry Modes | 📋 Planned | Legal, healthcare, dev team modes |
| Phase 8 — Intelligence | 📋 Planned | On-device ML, energy prediction |
| Phase 9 — Enterprise | 📋 Planned | SSO, watch app, web app |
| Phase 10 — Innovation | 📋 Planned | AR, voice, wearables |

---

<p align="center">
  Built by <strong>METAminds</strong> — an AI agency firm
</p>
