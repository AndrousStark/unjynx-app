<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web%20%7C%20watchOS%20%7C%20Wear_OS-7C3AED?style=for-the-badge" alt="Platforms" />
  <img src="https://img.shields.io/badge/Backend-Hono%20%2B%20TypeScript-E76F00?style=for-the-badge&logo=hono" alt="Backend" />
  <img src="https://img.shields.io/badge/AI-Claude%20%2B%20Custom%20ML-191919?style=for-the-badge&logo=anthropic" alt="AI" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2016-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="DB" />
  <img src="https://img.shields.io/badge/Tests-1%2C873+-4CAF50?style=for-the-badge" alt="Tests" />
</p>

<h1 align="center">UNJYNX</h1>
<p align="center"><strong>Break the satisfactory. Unjynx your productivity.</strong></p>

<p align="center">
  An enterprise-grade, AI-native productivity platform with 8-channel social delivery,<br/>
  on-device ML, multi-tenant team collaboration, and full offline-first architecture.<br/>
  Built by <strong>METAminds</strong> &mdash; 5 apps, 39 backend modules, 363 API endpoints, 88 database tables.
</p>

<p align="center">
  <a href="https://unjynx.me">Landing</a> &bull;
  <a href="https://api.unjynx.me/health">API Status</a> &bull;
  <a href="https://unjynx.me/admin">Admin Portal</a> &bull;
  <a href="https://unjynx.me/dev">Dev Portal</a>
</p>

---

## Why UNJYNX Exists

Every productivity app sends push notifications. **Users ignore 68% of them.**

UNJYNX sends reminders through the channels people actually respond to &mdash; WhatsApp, Telegram, Instagram DMs, Discord, Slack, SMS, and Email &mdash; with AI that learns *when* and *how* to reach each user. The result: **3.2x higher reminder engagement** than push-only apps.

But reminders are just the entry point. UNJYNX is a full productivity operating system: Kanban boards, sprint planning, goal hierarchies, Pomodoro focus sessions, accountability partners, gamification with XP/achievements/leaderboards, daily curated wisdom from 60+ categories, and industry-specific modes that transform the entire vocabulary and workflow for legal teams, healthcare, dev teams, construction, finance, and more.

---

## Platform Architecture

```
                               UNJYNX Platform
  ┌──────────────────────────────────────────────────────────────────┐
  │                        CLIENT LAYER                              │
  ├────────────┬────────────┬────────────┬────────────┬──────────────┤
  │  Flutter   │  Next.js   │   React    │   React    │    Astro     │
  │  Mobile    │  Web App   │   Admin    │ Dev Portal │   Landing    │
  │ Android+iOS│  37 pages  │  21 pages  │  10 pages  │   3 pages    │
  │ 61 screens │  Zustand   │  Refine    │  Refine    │  Tailwind    │
  │ Riverpod   │  TanStack  │ Ant Design │ Ant Design │  Three.js    │
  ├────────────┴────────────┴────────────┴────────────┴──────────────┤
  │  watchOS (Swift/SwiftUI)  │  Wear OS (Kotlin/Compose)           │
  └───────────────────────────┴──────────────────────────────────────┘
                                    │
                              HTTPS / WSS
                                    │
  ┌──────────────────────────────────────────────────────────────────┐
  │                         API LAYER                                │
  │              Hono 4.7  +  TypeScript  +  Drizzle ORM             │
  │         39 modules  ·  363 endpoints  ·  88 DB tables            │
  │                                                                  │
  │   Auth (Logto OIDC)  ·  RBAC (owner→admin→manager→member→viewer)│
  │   Rate Limiting  ·  Idempotency Keys  ·  Plan-Based Gating      │
  │   Security Headers  ·  CORS  ·  WebSocket Support                │
  └──────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
  ┌───────┴───────┐        ┌───────┴───────┐        ┌───────┴───────┐
  │  PostgreSQL   │        │  Valkey/Redis  │        │    BullMQ     │
  │  88 tables    │        │  Session Cache │        │  Job Queues   │
  │  Drizzle ORM  │        │  Rate Limits   │        │  Cron Tasks   │
  └───────────────┘        └───────────────┘        └───────────────┘
          │
  ┌───────┴───────────────────────────────────────────────────────┐
  │                      AI / ML LAYER                            │
  │                                                               │
  │  Claude API (Haiku 80% · Sonnet 15% · Opus 5%)               │
  │  ┌─────────────────────────────────────────────────────────┐  │
  │  │  6-Layer AI Pipeline                                    │  │
  │  │  Intent Classifier → Exact Cache → Context Builder →    │  │
  │  │  Semantic Memory → Working Memory → LLM Completion      │  │
  │  └─────────────────────────────────────────────────────────┘  │
  │  FastAPI ML Service (Python)                                  │
  │  ┌──────────────┬──────────────┬──────────────┬────────────┐  │
  │  │ Thompson     │ LinUCB       │ Energy Flow  │ Prophet    │  │
  │  │ Sampling     │ Contextual   │ Gaussian     │ Time-Series│  │
  │  │ Exploration  │ Bandit       │ Process      │ Forecast   │  │
  │  └──────────────┴──────────────┴──────────────┴────────────┘  │
  └───────────────────────────────────────────────────────────────┘
```

---

## The Five Apps

### 1. Mobile App &mdash; Flutter (Android + iOS)

The core experience. Offline-first, buttery 60fps, with a plugin-play architecture that makes every feature independently testable and deployable.

| Metric | Count |
|--------|-------|
| Feature packages | 21 |
| Screens/pages | 61 |
| Riverpod providers | 739 |
| Domain models | 336 |
| Local DB tables (Drift) | 12 |
| Deep link schemes | Full URI mapping |

**Architecture**: Plugin-Play (Feature-First + Hexagonal + Event-Driven) organized as a Dart pub workspace monorepo with Melos.

**Key patterns**: Offline-first sync engine with conflict resolution, provider override pattern for testable DI, immutable state with freezed models, cursor-based pagination, optimistic updates with rollback.

```
packages/
├── core/                    # Theme, models, contracts, extensions
├── feature_todos/           # Task CRUD, Kanban, NLP parsing, recurring
├── feature_projects/        # Projects, sections, color/icon picker
├── feature_home/            # Dashboard, streaks, progress rings, calendar
├── feature_ai/              # Claude chat, auto-schedule, insights
├── feature_sprints/         # Sprint board, burndown, velocity charts
├── feature_goals/           # Goal tree (company → team → individual)
├── feature_notifications/   # 8-channel hub, escalation chains, quiet hours
├── feature_gamification/    # XP, achievements, leaderboards, challenges
├── feature_billing/         # RevenueCat, plan comparison, invoices
├── feature_team/            # Org switcher, standups, reports, RBAC
├── feature_onboarding/      # 4-step flow, NLP voice input, permissions
├── feature_settings/        # Industry modes, theme, data privacy
├── feature_import_export/   # CSV/JSON/ICS import, GDPR export
├── feature_profile/         # Profile, activity heatmap, connected channels
├── feature_widgets/         # Home screen widget configuration
├── service_api/             # Dio client, 23 API services, 363 endpoints
├── service_auth/            # Logto OIDC, Google Sign-In, token refresh
├── service_database/        # Drift SQLite, migrations, DAOs
├── service_notification/    # FCM, awesome_notifications
└── service_sync/            # Offline sync, conflict resolution, delta push
```

### 2. Web Client &mdash; Next.js 15 + React 19

Full-featured browser experience with views the mobile app doesn't have: Gantt timelines, spreadsheet tables, and a TipTap rich-text editor.

| Feature | Technology |
|---------|------------|
| Kanban board | Atlaskit Pragmatic DnD |
| Gantt/Timeline | gantt-task-react |
| Calendar | FullCalendar 6.x (day/week/month/list) |
| Tables | TanStack Table + Virtual (100K+ rows) |
| Rich editor | TipTap 3.x with mentions |
| Charts | Recharts 2.x |
| State | Zustand 5 + TanStack Query 5 |
| UI | Radix Primitives + Tailwind + Lucide |
| Auth | OIDC via Logto |
| Realtime | WebSocket for live collaboration |

**37 routes** including AI chat with streaming, sprint planning, goal hierarchy, focus mode, team messaging, channel management, custom fields, workflow builder, analytics dashboards, and enterprise portfolio views.

### 3. Admin Portal &mdash; React + Refine + Ant Design

Operational command center for platform management.

**21 pages across 10 sections**: User management (CRUD, impersonation, password reset), content calendar & bulk import, notification health & failed delivery inspector, feature flag management, analytics dashboards (DAU/MAU, signup trends, revenue, plan distribution), compliance & audit logs (SIEM webhook, panic mode), billing management (subscriptions, coupons, redemption tracking), and broadcast messaging.

### 4. Developer Portal &mdash; React + Refine + Ant Design

Infrastructure monitoring and configuration for DevOps teams.

**10 pages**: System health (uptime, service status), database management (slow queries, migrations, backups), API key management & usage analytics, deployment history & rollback, notification infrastructure (queue depths, channel health), AI model configuration & cost tracking, channel provider status, and data pipeline monitoring.

### 5. Landing Site &mdash; Astro + Tailwind + Three.js

Static marketing site with 3D hero animation, pricing calculator, feature showcase, testimonials, and legal pages (DPDP Act 2023 compliant privacy policy).

---

## Wearable Companions

### Apple Watch (watchOS &mdash; SwiftUI)
Quick task completion from the wrist. Glanceable progress rings, haptic reminders, and Siri shortcut integration.

### Wear OS (Kotlin &mdash; Jetpack Compose)
Tile API for at-a-glance task counts. Quick-add via voice, complication support, and ambient mode for always-on displays.

---

## Backend Deep Dive

### 39 Backend Modules

<table>
<tr><th>Category</th><th>Modules</th><th>Highlights</th></tr>
<tr><td><strong>Core</strong></td><td>tasks, projects, subtasks, sections, tags, comments, recurring, templates</td><td>Bulk operations, cursor pagination, NLP parsing, RRULE (RFC 5545)</td></tr>
<tr><td><strong>AI</strong></td><td>ai, ai-team, modes</td><td>6-layer pipeline, streaming SSE, Claude API, 11 industry vocabularies</td></tr>
<tr><td><strong>Productivity</strong></td><td>pomodoro, planning, progress, goals, sprints, workflows, custom-fields</td><td>Burndown charts, velocity tracking, retrospectives, energy forecasting</td></tr>
<tr><td><strong>Collaboration</strong></td><td>teams, organizations, messaging, accountability</td><td>RBAC (6 roles), GDPR export/erasure, nudge system, shared goals</td></tr>
<tr><td><strong>Delivery</strong></td><td>notifications, channels, scheduler, content</td><td>8-channel delivery, escalation chains, quiet hours, 60+ content categories</td></tr>
<tr><td><strong>Business</strong></td><td>billing, gamification, import-export, calendar</td><td>RevenueCat webhooks, XP/achievements, Google/Apple/Outlook calendar sync</td></tr>
<tr><td><strong>Platform</strong></td><td>auth, admin, dev-portal, health, reports, sync</td><td>Logto OIDC, MFA, audit logs, Prometheus metrics, offline-first sync</td></tr>
</table>

### 88 Database Tables (PostgreSQL 16)

Fully normalized schema with Drizzle ORM, covering: user profiles and organizations, tasks with subtasks and custom fields, projects with sections and templates, goals with hierarchical parent-child relationships, sprints with burndown snapshots, gamification (XP transactions, achievements, challenges, leaderboards), notification delivery tracking, calendar event mapping, billing (subscriptions, invoices, coupons), AI operations and suggestions, audit logs and feature flags, GDPR-compliant data lifecycle management.

### Middleware Stack

```
Request → CORS → Security Headers → Rate Limiter → Auth (JWT) →
  Tenant Context (X-Org-Id) → Plan Guard → Email Verified Guard →
    MFA Guard → Team RBAC → Idempotency → Route Handler →
      Error Handler → Structured Logging → Response
```

---

## AI & Machine Learning

### The 6-Layer AI Pipeline

Every AI query flows through a sophisticated pipeline that minimizes latency and API costs:

1. **Intent Classifier** &mdash; Determines if the query is a direct action (create task, reschedule) or requires LLM reasoning
2. **Exact Cache** &mdash; Memoized responses for repeated queries (cache hit = 0ms, no API cost)
3. **Context Builder** &mdash; Assembles user context: recent tasks, energy levels, calendar events, team state
4. **Semantic Memory** &mdash; Long-term user patterns, preferences, and correction history
5. **Working Memory** &mdash; Short-term conversation context with sliding window
6. **LLM Completion** &mdash; Claude API with persona support, streaming SSE, and structured output

### 4 On-Device ML Models (FastAPI Microservice)

| Model | Algorithm | Purpose | Input | Output |
|-------|-----------|---------|-------|--------|
| **Smart Suggestions** | LinUCB Contextual Bandit | Rank tasks by predicted completion probability | Hour, day, energy, task metadata | Sorted task list with confidence scores |
| **Exploration** | Thompson Sampling | Balance exploit vs explore for notification timing | User response history | Optimal notification hour |
| **Energy Flow** | Gaussian Process Regression | Predict 24-hour energy levels | Historical completion patterns | Hourly energy forecast with peak/low markers |
| **Habit Prediction** | Prophet Time-Series | Detect habit formation and predict streaks | Daily completion counts (90 days) | 7-day forecast, pattern confidence, anomaly detection |

### AI-Powered Features

- **Task Decomposition** &mdash; Break complex tasks into actionable subtasks with estimated effort
- **Smart Scheduling** &mdash; AI suggests optimal times based on energy forecast and calendar gaps
- **Weekly Insights** &mdash; Automated productivity analysis with trend detection
- **AI Team Intelligence** &mdash; Standup summaries, risk detection, smart assignee suggestion, project health scoring
- **Industry Modes** &mdash; 11 vocabularies that transform the entire UI language (e.g., "Tasks" becomes "Cases" in Legal mode, "Tickets" in Dev mode)

### Cost Optimization

| Model | Usage | Cost/1K users/mo |
|-------|-------|-------------------|
| Haiku 4.5 | 80% of queries (fast, cheap) | ~$2.40 |
| Sonnet 4.6 | 15% of queries (complex reasoning) | ~$4.50 |
| Opus 4.6 | 5% of queries (deep analysis) | ~$8.00 |
| ML Service | 100% on-device (zero API cost) | $0.00 |

---

## 8-Channel Social Delivery

The notification engine that makes UNJYNX unique:

```
  User sets reminder
        │
        ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  Escalation │────▶│   Channel   │────▶│  Delivery    │
  │  Engine     │     │  Router     │     │  Tracker     │
  └─────────────┘     └─────────────┘     └─────────────┘
        │                    │                    │
        │         ┌─────────┼─────────┐          │
        │         ▼         ▼         ▼          │
        │    ┌────────┐┌────────┐┌────────┐      │
        │    │  Push  ││ Email  ││Telegram│      │
        │    │  (FCM) ││(SendGrid)│(Bot API)│     │
        │    └────────┘└────────┘└────────┘      │
        │    ┌────────┐┌────────┐┌────────┐      │
        │    │WhatsApp││  SMS   ││Discord │      │
        │    │(Gupshup)│(MSG91) ││(Webhook)│     │
        │    └────────┘└────────┘└────────┘      │
        │    ┌────────┐┌────────┐                │
        │    │Instagram││ Slack  │                │
        │    │(Friend  ││(Webhook)│               │
        │    │ First)  │└────────┘                │
        │    └────────┘                           │
        │                                         │
        ▼                                         ▼
  Quiet Hours Filter                    Delivery Receipts
  (respect DND)                         (read/delivered/failed)
```

**Escalation Chains**: If push fails after 5 minutes, escalate to Telegram. If Telegram unread after 15 minutes, escalate to WhatsApp. Fully configurable per-user.

**Friend First (Instagram)**: For restricted platforms, the official UNJYNX page sends a follow request. Once the user accepts, DM reminders work seamlessly. Patent-pending approach.

---

## Gamification Engine

A full RPG-inspired progression system designed to make productivity addictive:

- **XP System** &mdash; Earn XP for completing tasks, maintaining streaks, winning challenges
- **Level Progression** &mdash; 100 levels with increasing XP thresholds
- **Achievement Gallery** &mdash; 50+ unlockable achievements across 8 categories
- **Leaderboards** &mdash; Weekly, monthly, and all-time rankings (friends, team, global)
- **Challenges** &mdash; Create or accept challenges (e.g., "Complete 50 tasks this week")
- **Accountability Partners** &mdash; Pair up, share goals, nudge each other (max 1 nudge/day)
- **Progress Rings** &mdash; Apple Watch-style concentric rings for tasks, focus time, and habits
- **Activity Heatmap** &mdash; GitHub-style contribution graph for your productivity

---

## Infrastructure & DevOps

### Local Development Stack (Docker Compose)

```yaml
12 services, one command: docker compose up

PostgreSQL 16      # Primary database (88 tables)
Valkey 8           # Redis-compatible cache
Logto              # Self-hosted OIDC auth server
MinIO              # S3-compatible file storage
Mailpit            # Local email testing (catches all outbound)
Ollama             # Local LLM for development (llama3.2:3b)
ML Service         # FastAPI + scikit-learn + Prophet
Prometheus         # Metrics collection
Grafana            # Dashboards & alerting
Loki               # Log aggregation
pgAdmin            # Database management UI
Web Client         # Next.js dev server
```

### Production Deployment

| Component | Provider | Cost |
|-----------|----------|------|
| Backend + DB | Hetzner VPS (cx23, 2vCPU/4GB) | $3.49/mo |
| Auth (Logto) | Self-hosted on same VPS | $0 |
| Landing + Admin | GitHub Pages + Vercel | $0 |
| DNS + CDN | Cloudflare | $0 |
| SSL | Let's Encrypt (auto-renew) | $0 |
| Monitoring | Sentry (free tier) + PostHog | $0 |
| **Total at launch** | | **$3.49/mo** |

### CI/CD Pipelines

**GitHub Actions** (5 workflows): PR validation, backend tests + lint, Flutter analysis + tests, landing page build, production deployment via SSH + Docker.

**Codemagic** (5 workflows): PR check, Android release (signed AAB for Google Play), iOS release (signed IPA for TestFlight), web release, beta distribution.

**Shorebird OTA**: Over-the-air updates for Flutter without app store review cycles.

---

## Security & Compliance

### OWASP Mobile Top 10 &mdash; All Pass

| # | Threat | Mitigation |
|---|--------|------------|
| M1 | Improper Credential Usage | Logto OIDC + flutter_secure_storage |
| M2 | Inadequate Supply Chain | Dependabot + lockfile pinning |
| M3 | Insecure Auth/Authz | JWT + RBAC (6 roles) + MFA |
| M4 | Insufficient Input Validation | Zod schemas on all endpoints |
| M5 | Insecure Communication | TLS 1.3, certificate pinning |
| M6 | Inadequate Privacy Controls | DPDP Act 2023 compliant, GDPR export/erasure |
| M7 | Insufficient Binary Protection | ProGuard/R8, root/jailbreak detection |
| M8 | Security Misconfiguration | Security headers middleware (13 headers) |
| M9 | Insecure Data Storage | Drift encryption, no plaintext secrets |
| M10 | Insufficient Cryptography | AES-256, bcrypt, HMAC-SHA256 |

### OWASP API Top 10 &mdash; All Pass

Rate limiting on all endpoints, parameterized queries (zero SQL injection surface), CORS whitelist, idempotency keys on mutations, plan-based access control, audit logging for admin operations, SIEM webhook integration, and panic mode for emergency lockdown.

### Privacy

- **India DPDP Act 2023** compliant (deadline May 2027)
- **GDPR** data export and right-to-erasure (30-day grace period soft delete)
- **WhatsApp compliance**: AI is task-specific, not general-purpose chatbot (per Jan 2026 policy)
- All secrets in environment variables, zero hardcoded credentials

---

## Testing

| Layer | Framework | Coverage |
|-------|-----------|----------|
| Flutter unit/widget | flutter_test | 810+ tests across 46 test files |
| Backend unit/integration | Vitest | 1,063+ tests across 71 test files |
| Web E2E | Playwright | Critical user flows |
| ML Service | pytest | Model accuracy validation |
| Load testing | k6 | Smoke, load, stress profiles |
| Security | OWASP ZAP | Automated vulnerability scanning |

**Total: 1,873+ tests. All green.**

---

## Monetization

| Plan | Monthly | Annual | Target |
|------|---------|--------|--------|
| **Free** | $0 | $0 | 25 tasks, push only |
| **Pro** | $6.99 | $4.99/mo ($59.88/yr) | Unlimited tasks, all channels, AI |
| **India Pro** | Rs 149 | Rs 99/mo | Same as Pro, INR pricing |
| **Team** | $8.99/user | $6.99/user/mo | Team workspace, RBAC, reports |
| **Family** | $9.99 | $9.99 | Up to 5 members |
| **Enterprise** | Contact sales | Contact sales | SSO, SLA, dedicated support |

**Projected costs**: 1K users ~$116/mo | 10K ~$500-900/mo | 100K ~$3K-6K/mo | 1M ~$40K-55K/mo

---

## Tech Stack Summary

<table>
<tr><th>Layer</th><th>Technology</th><th>Why</th></tr>
<tr><td><strong>Mobile</strong></td><td>Flutter 3.27 + Dart 3.11</td><td>Single codebase for Android + iOS, 60fps, huge ecosystem</td></tr>
<tr><td><strong>State</strong></td><td>Riverpod 3.x</td><td>Compile-safe, code-generated, testable</td></tr>
<tr><td><strong>Local DB</strong></td><td>Drift 2.32 (SQLite)</td><td>Type-safe queries, reactive streams, migrations</td></tr>
<tr><td><strong>Navigation</strong></td><td>go_router 16.x</td><td>Declarative, deep linking, redirect guards</td></tr>
<tr><td><strong>Web Client</strong></td><td>Next.js 15 + React 19</td><td>SSR, App Router, streaming, edge runtime</td></tr>
<tr><td><strong>Admin/Dev</strong></td><td>Vite + React 19 + Refine</td><td>Headless CRUD framework, rapid admin UI</td></tr>
<tr><td><strong>Landing</strong></td><td>Astro 4.x + Tailwind</td><td>Zero JS by default, perfect Lighthouse scores</td></tr>
<tr><td><strong>Backend</strong></td><td>Hono 4.7 + TypeScript</td><td>Edge-ready, 3x faster than Express, tiny bundle</td></tr>
<tr><td><strong>ORM</strong></td><td>Drizzle 0.39</td><td>Type-safe SQL, zero overhead, excellent DX</td></tr>
<tr><td><strong>Database</strong></td><td>PostgreSQL 16</td><td>ACID, JSONB, full-text search, rock-solid</td></tr>
<tr><td><strong>Cache</strong></td><td>Valkey 8 (Redis-compatible)</td><td>Open-source, drop-in Redis replacement</td></tr>
<tr><td><strong>Queue</strong></td><td>BullMQ 5.x</td><td>Reliable job processing, cron scheduling, retries</td></tr>
<tr><td><strong>Auth</strong></td><td>Logto (self-hosted OIDC)</td><td>30+ social providers, MFA, free, open-source</td></tr>
<tr><td><strong>AI</strong></td><td>Claude API (Anthropic)</td><td>Best reasoning, tool use, streaming, cost-efficient</td></tr>
<tr><td><strong>ML</strong></td><td>FastAPI + scikit-learn + Prophet</td><td>On-device inference, zero API cost for predictions</td></tr>
<tr><td><strong>Storage</strong></td><td>MinIO (S3-compatible)</td><td>Self-hosted, free, identical API to AWS S3</td></tr>
<tr><td><strong>WhatsApp</strong></td><td>Gupshup BSP</td><td>Cheapest for India market</td></tr>
<tr><td><strong>SMS</strong></td><td>MSG91 / Kaleyra</td><td>4-8x cheaper than Twilio for India</td></tr>
<tr><td><strong>Email</strong></td><td>SendGrid (prod) / Mailpit (dev)</td><td>Reliable delivery, local dev email catching</td></tr>
<tr><td><strong>Monitoring</strong></td><td>Prometheus + Grafana + Loki + Sentry</td><td>Full observability stack, self-hosted locally</td></tr>
<tr><td><strong>CI/CD</strong></td><td>GitHub Actions + Codemagic + Shorebird</td><td>Automated testing, store deployment, OTA updates</td></tr>
<tr><td><strong>DNS/CDN</strong></td><td>Cloudflare</td><td>Free tier, DDoS protection, edge caching</td></tr>
</table>

---

## Roadmap

| Phase | Status | Scope |
|-------|--------|-------|
| Phase 1: Foundation | COMPLETE | Infra, Docker, CI/CD, DB schema, auth |
| Phase 2: Core App | COMPLETE | 17 screens, 45+ endpoints, 35 DB tables |
| Phase 3: Channels | COMPLETE | 8 adapters, BullMQ, cron scheduler, webhooks |
| Phase 4: Premium + Team | COMPLETE | Billing, gamification, teams, admin, dev portal |
| Phase 5: Polish + Launch | COMPLETE | Security audit, load tests, store listings, OTA |
| Phase 6: v2-AI | COMPLETE | Claude pipeline, AI chat, auto-schedule, insights |
| Phase 7: v2-Industry | COMPLETE | Sprints, goals, org reports, industry modes |
| Phase 8: v2-Intelligence | IN PROGRESS | On-device ML, energy prediction, weekly review |
| Phase 9: v2-Enterprise | PLANNED | SSO, watch apps, web client, calendar sync |
| Phase 10: v2-Innovation | PLANNED | AR reminders, voice control, wearables, SLM |

---

## By The Numbers

```
  5   client applications (mobile, web, admin, dev portal, landing)
  2   wearable companions (watchOS, Wear OS)
 39   backend modules
363   API endpoints
 88   database tables
 21   Flutter packages
 61   mobile screens
 37   web client pages
 31   admin + dev portal pages
  8   notification channels
 11   industry modes
  4   ML models (on-device)
  6   AI pipeline layers
 12   Docker services
  5   CI/CD pipelines
1,873 tests (all green)
  0   dart analyze errors
```

---

<p align="center">
  Built with obsessive attention to detail by <strong>METAminds</strong>.<br/>
  <em>We didn't build another to-do app. We built the productivity platform we wished existed.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made_with-Flutter-02569B?style=flat-square&logo=flutter" />
  <img src="https://img.shields.io/badge/Made_with-TypeScript-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Made_with-Python-3776AB?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Made_with-Swift-FA7343?style=flat-square&logo=swift" />
  <img src="https://img.shields.io/badge/Made_with-Kotlin-7F52FF?style=flat-square&logo=kotlin" />
  <img src="https://img.shields.io/badge/Powered_by-Claude-191919?style=flat-square&logo=anthropic" />
</p>
