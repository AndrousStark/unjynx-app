<p align="center">
  <img src="https://via.placeholder.com/200x200/6B21A8/FFD700?text=UNJYNX" alt="UNJYNX Logo" width="200" height="200" />
</p>

<h1 align="center">UNJYNX Backend</h1>

<p align="center">
  <em>Break the satisfactory. Unjynx your productivity.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/tests-1%2C102_passing-brightgreen?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Hono-4.7-E36002?style=flat-square&logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.39-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/BullMQ-5.x-E74C3C?style=flat-square" alt="BullMQ" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-Private-lightgrey?style=flat-square" alt="License" />
</p>

---

Production-grade REST API for **UNJYNX** -- a next-generation task management and productivity platform with multi-channel notification delivery, AI-powered scheduling, gamification, and team collaboration.

Built by **METAminds**.

---

## Architecture

```
                              UNJYNX Backend Architecture
 ═══════════════════════════════════════════════════════════════════════

  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ Flutter App  │    │  Admin SPA  │    │ Landing Page│
  │  (Mobile)    │    │  (React)    │    │   (Astro)   │
  └──────┬───────┘    └──────┬───────┘    └──────┬──────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                        HTTPS / WSS
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (Hono 4.7)    │
                    │                 │
                    │  ┌───────────┐  │
                    │  │Middleware │  │
                    │  │  Stack    │  │
                    │  │           │  │
                    │  │ ◆ CORS    │  │
                    │  │ ◆ Security│  │
                    │  │ ◆ Rate    │  │
                    │  │   Limit   │  │
                    │  │ ◆ Idempot.│  │
                    │  │ ◆ Auth JWT│  │
                    │  │ ◆ Logger  │  │
                    │  └───────────┘  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
     │   Modules     │ │ WebSocket│ │  Scheduler   │
     │  (22 domain)  │ │  (JWT)   │ │  (Cron Jobs) │
     └────────┬──────┘ └──────────┘ └──────┬───────┘
              │                            │
    ┌─────────▼─────────┐        ┌─────────▼──────────┐
    │     Services      │        │   Queue System      │
    │  (Business Logic) │        │   (BullMQ)          │
    └─────────┬─────────┘        │                     │
              │                  │  10 Queues:          │
    ┌─────────▼─────────┐       │  ◆ push, telegram    │
    │   Repositories    │       │  ◆ email, whatsapp   │
    │  (Data Access)    │       │  ◆ sms, instagram    │
    └────┬─────────┬────┘       │  ◆ slack, discord    │
         │         │            │  ◆ digest, escalation│
    ┌────▼───┐ ┌───▼──────┐    └─────────┬────────────┘
    │Postgres│ │  Valkey   │              │
    │  (16)  │ │(Redis 8)  │    ┌─────────▼────────────┐
    │        │ │           │    │  Channel Adapters (8) │
    │ 35+    │ │ ◆ Cache   │    │  ◆ FCM  ◆ Telegram   │
    │ tables │ │ ◆ Queues  │    │  ◆ Email ◆ WhatsApp  │
    │ ◆ GIN  │ │ ◆ Sessions│    │  ◆ SMS  ◆ Instagram  │
    │   FTS  │ │ ◆ Idempt. │    │  ◆ Slack ◆ Discord   │
    └────────┘ └───────────┘    └──────────────────────┘
```

---

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and enter the repo
git clone https://github.com/AndrousStark/unjynx-backend.git
cd unjynx-backend

# Copy environment file
cp .env.example .env

# Start all services (PostgreSQL, Valkey, Logto, MinIO, Mailpit, etc.)
docker compose up -d

# Wait for PostgreSQL to be healthy, then seed the database
pnpm db:seed

# Start the dev server
pnpm dev
```

The API will be available at `http://localhost:3000`.

### Option 2: Manual Setup

**Prerequisites:**
- Node.js 24+
- pnpm 10+
- PostgreSQL 16+
- Valkey/Redis 8+

```bash
# Install dependencies
pnpm install

# Set up your environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed

# Start development server (hot reload)
pnpm dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with hot reload (tsx watch) |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run production build |
| `pnpm test` | Run all 1,102 tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with sample data |
| `pnpm db:studio` | Open Drizzle Studio (visual DB browser) |

---

## API Modules

All REST endpoints are versioned under `/api/v1/*`. The API uses a consistent JSON envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Module Overview (152 Endpoints)

| Module | Prefix | Endpoints | Description |
|--------|--------|:---------:|-------------|
| **Tasks** | `/api/v1/tasks` | 14 | Full CRUD, filters, search (FTS), bulk ops, priority, energy |
| **Projects** | `/api/v1/projects` | 5 | Workspaces with color, icon, archive, member count |
| **Auth** | `/api/v1/auth` | 6 | Logto OIDC callback, refresh, logout, me, password reset |
| **Content** | `/api/v1/content` | 7 | Daily quotes (60+ categories), ritual tracking, preferences |
| **Progress** | `/api/v1/progress` | 6 | Streaks, heatmaps, rings, personal bests, insights |
| **Sync** | `/api/v1/sync` | 3 | Offline-first sync with LWW conflict resolution |
| **Channels** | `/api/v1/channels` | 8 | Multi-channel config, test send, OTP verification |
| **Notifications** | `/api/v1/notifications` | 5 | Preferences, history, quotas, test send |
| **Subtasks** | `/api/v1/tasks/:id/subtasks` | 6 | Nested subtasks with ordering and completion |
| **Comments** | `/api/v1/tasks/:id/comments` | 4 | Threaded comments with mentions |
| **Sections** | `/api/v1/projects/:id/sections` | 5 | Kanban-style sections with drag-drop ordering |
| **Tags** | `/api/v1/tags` | 5 | Color-coded tags with task associations |
| **Recurring** | `/api/v1/tasks/:id/recurrence` | 4 | RFC 5545 RRULE support, occurrence generation |
| **Health** | `/health`, `/ready` | 2 | Liveness and readiness probes |
| **Billing** | `/api/v1/billing` | 5 | RevenueCat webhooks, plan management, quotas |
| **Gamification** | `/api/v1/gamification` | 7 | XP, levels, badges, leaderboards, achievements |
| **Accountability** | `/api/v1/accountability` | 7 | Partners, check-ins, nudges, streaks |
| **Teams** | `/api/v1/teams` | 10 | Team CRUD, members, RBAC roles, invitations |
| **Import/Export** | `/api/v1/import`, `/export` | 7 | CSV, JSON, Todoist, Google Tasks, Apple Reminders |
| **Admin** | `/api/v1/admin` | 17 | User management, feature flags, system stats, audit log |
| **Dev Portal** | `/api/v1/dev` | 19 | API keys, webhooks, rate limit tiers, usage analytics |
| | | **152** | |

### Webhooks (Inbound)

| Endpoint | Provider | Purpose |
|----------|----------|---------|
| `POST /api/v1/webhooks/telegram` | Telegram | Bot callback queries (DONE, SNOOZE) |
| `POST /api/v1/webhooks/whatsapp` | Gupshup | Delivery receipts + user replies |
| `POST /api/v1/webhooks/sms` | MSG91 | Delivery receipts + user replies |

Text commands supported: `DONE`, `SNOOZE`, `STOP`, `HELP`

---

## Middleware Stack

Middleware executes in strict order on every request:

```
Request
  │
  ├─ 1. Security Headers ─── CSP, HSTS, X-Frame-Options, X-Content-Type
  ├─ 2. CORS ─────────────── Configurable origins, credentials support
  ├─ 3. Rate Limiting ────── Per-IP sliding window (Valkey-backed)
  ├─ 4. Idempotency ──────── Stripe-style Idempotency-Key (24h TTL, 10K max)
  ├─ 5. Logger ───────────── Pino structured JSON logging
  ├─ 6. Auth (per-route) ─── JWT verification via Logto JWKS, profileId resolution
  ├─ 7. Plan Guard ───────── Feature gating by subscription tier
  ├─ 8. Team RBAC ─────────── Role-based access (owner, admin, member, viewer)
  ├─ 9. Admin Guard ──────── Admin-only route protection
  │
  ▼
Response
```

---

## Database

### Engine

**PostgreSQL 16** with **Drizzle ORM** (type-safe, zero-abstraction SQL).

- **35+ tables** across profiles, tasks, projects, notifications, billing, gamification, teams, and more
- **GIN indexes** for full-text search (`to_tsvector` / `plainto_tsquery` with `ilike` fallback)
- **Cursor-based pagination** for stable, performant list queries
- **Field-level LWW** (Last-Writer-Wins) conflict resolution for offline sync

### Schema Files (34 tables)

```
src/db/schema/
├── profiles.ts                  # User profiles & preferences
├── tasks.ts                     # Core task model (priority, energy, status)
├── subtasks.ts                  # Nested subtasks with ordering
├── projects.ts                  # Project workspaces
├── sections.ts                  # Kanban sections within projects
├── tags.ts                      # Color-coded tags + task-tag pivot
├── comments.ts                  # Threaded task comments
├── recurring-rules.ts           # RFC 5545 RRULE definitions
├── reminders.ts                 # Multi-channel reminder config
├── notifications.ts             # Notification records
├── notification-channels.ts     # User channel registrations
├── notification-preferences.ts  # Per-channel quiet hours & prefs
├── delivery-attempts.ts         # Delivery tracking per attempt
├── notification-log.ts          # Audit log for all notifications
├── team-notification-settings.ts# Team-level notification config
├── daily-content.ts             # Quote/wisdom content library
├── content-delivery-log.ts      # Content delivery tracking
├── user-content-prefs.ts        # User content preferences
├── rituals.ts                   # Morning/evening ritual tracking
├── progress-snapshots.ts        # Daily progress snapshots
├── streaks.ts                   # Streak tracking (current, best)
├── pomodoro-sessions.ts         # Focus session records
├── sync-metadata.ts             # Offline sync cursors & vectors
├── task-templates.ts            # Reusable task templates
├── user-settings.ts             # App settings (theme, locale)
├── billing.ts                   # Subscriptions & invoices
├── gamification.ts              # XP, levels, badges, achievements
├── accountability-partners.ts   # Partner relationships
├── teams.ts                     # Teams, members, roles
├── attachments.ts               # File attachments (MinIO)
├── audit-log.ts                 # Admin audit trail
├── feature-flags.ts             # Feature flag definitions
├── enums.ts                     # Shared PostgreSQL enums
└── index.ts                     # Barrel export
```

---

## Queue System

**BullMQ** on **Valkey** (Redis-compatible) handles all asynchronous notification delivery.

### 10 Queues

| Queue | Purpose | Retry Policy |
|-------|---------|-------------|
| `push` | Firebase Cloud Messaging | 3 retries, exponential backoff |
| `telegram` | Telegram Bot API | 3 retries, exponential backoff |
| `email` | SendGrid (prod) / Mailpit (dev) | 3 retries, exponential backoff |
| `whatsapp` | Gupshup BSP | 3 retries, exponential backoff |
| `sms` | MSG91 / Kaleyra | 3 retries, exponential backoff |
| `instagram` | Messenger API (Friend First) | 3 retries, exponential backoff |
| `slack` | Slack Web API | 3 retries, exponential backoff |
| `discord` | Discord Bot API | 3 retries, exponential backoff |
| `digest` | Batched notification summaries | 2 retries |
| `escalation` | Missed reminder escalation chain | 2 retries |

### Notification Flow

```
Reminder Due
    │
    ▼
Reminder Planner ──► Cascade Builder (channel priority order)
    │
    ▼
Notification Dispatcher ──► Queue Factory ──► BullMQ Job
    │
    ▼
Channel Worker ──► Quiet Hours Check ──► Template Render ──► Adapter Call
    │
    ▼
Delivery Attempt ──► Success/Failure ──► Escalation (if failed)
```

---

## Channel Adapters

Each adapter implements a common `ChannelAdapter` interface for send, status check, and delivery verification.

| Adapter | Provider | Status |
|---------|----------|--------|
| **Push** | Firebase Cloud Messaging (FCM) | Production-ready |
| **Telegram** | Bot API (free, unlimited) | Production-ready |
| **Email** | SendGrid (prod) / Mailpit (dev) | Production-ready |
| **WhatsApp** | Gupshup BSP (India-optimized) | Production-ready |
| **SMS** | MSG91 (India) / Kaleyra | Production-ready |
| **Instagram** | Messenger API + Friend First | Production-ready |
| **Slack** | Slack Web API (OAuth) | Production-ready |
| **Discord** | Discord Bot API | Production-ready |

All adapters support **mock mode** for local development (no external API calls).

---

## Scheduler

Four cron jobs run at configurable intervals:

| Job | Schedule | Description |
|-----|----------|-------------|
| **Reminder Planner** | Every 1 min | Scans upcoming reminders, builds delivery cascades |
| **Overdue Detector** | Every 5 min | Detects overdue tasks, triggers alert levels |
| **Digest Builder** | Every 6 hours | Batches notifications into daily/weekly digests |
| **Content Scheduler** | Every day 6 AM | Delivers daily wisdom content (circular buffer) |

---

## WebSocket

Real-time sync via WebSocket with JWT authentication:

```
ws://localhost:3000/ws?token=<jwt>
```

- **Connection management** with heartbeat
- **Per-user channels** for live updates
- **Sync events** for offline-first data reconciliation

---

## Security

### OWASP Compliance

| Control | Implementation |
|---------|---------------|
| **Authentication** | Logto OIDC with PKCE, JWT verification via JWKS |
| **Authorization** | Role-based (admin, owner, member, viewer) per team |
| **Rate Limiting** | Per-IP sliding window, configurable per endpoint |
| **Input Validation** | Zod schemas on every endpoint |
| **SQL Injection** | Drizzle ORM parameterized queries (zero raw SQL) |
| **XSS Prevention** | JSON-only API, no HTML rendering |
| **CSRF Protection** | SameSite cookies, CORS origin validation |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **Idempotency** | Stripe-style keys prevent duplicate mutations |
| **Secret Management** | Zod-validated env vars, no hardcoded secrets |
| **Audit Logging** | Admin actions tracked in `audit_log` table |

---

## Testing

```
Total: 1,102 tests across 65 files
```

### Backend Test Breakdown

| Module | Tests | Files |
|--------|:-----:|:-----:|
| Tasks | 74 | 3 |
| Content | 52 | 2 |
| Recurring | 41 | 2 |
| Sync | 34 | 2 |
| Auth | 27 | 2 |
| Projects | 30 | 2 |
| Subtasks | 20 | 2 |
| Comments | 14 | 2 |
| Progress | 14 | 2 |
| Tags | 17 | 2 |
| Sections | 15 | 2 |
| RRULE Parser | 21 | 1 |
| Notifications | 28 | 2 |
| Channels | 32 | 3 |
| Scheduler | 24 | 3 |
| Queue | 18 | 2 |
| Billing | 22 | 2 |
| Gamification | 26 | 2 |
| Accountability | 24 | 2 |
| Teams | 36 | 3 |
| Import/Export | 28 | 2 |
| Admin | 42 | 3 |
| Dev Portal | 38 | 3 |
| Idempotency | 12 | 1 |
| Rate Limit | 4 | 1 |
| Error Handler | 4 | 1 |
| API Types | 6 | 1 |
| WebSocket | 8 | 1 |
| Health | 3 | 1 |
| Middleware | 15 | 3 |
| **Total** | **784** | **47** |

Additional **318 integration tests** run against live PostgreSQL and Valkey via GitHub Actions CI.

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (re-runs on file change)
pnpm test:watch

# Coverage report
pnpm test -- --coverage
```

Coverage thresholds are enforced at **80%** for lines, functions, branches, and statements.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Valkey/Redis connection |
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | Environment (development/production/test) |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `LOGTO_ENDPOINT` | No | `http://localhost:3001` | Logto auth server URL |
| `LOGTO_APP_ID` | No | - | Logto application ID |
| `LOGTO_APP_SECRET` | No | - | Logto application secret |
| `S3_ENDPOINT` | No | `http://localhost:9000` | MinIO/S3 endpoint |
| `S3_ACCESS_KEY` | No | `minioadmin` | S3 access key |
| `S3_SECRET_KEY` | No | `minioadmin` | S3 secret key |
| `S3_BUCKET` | No | `todo-uploads` | S3 bucket name |
| `REVENUECAT_WEBHOOK_SECRET` | No | - | RevenueCat webhook verification |
| `TELEGRAM_BOT_TOKEN` | No | - | Telegram Bot API token |
| `WHATSAPP_API_TOKEN` | No | - | Gupshup API token |
| `FCM_PROJECT_ID` | No | - | Firebase project ID |
| `SMTP_HOST` | No | `localhost` | SMTP server host |
| `SMTP_PORT` | No | `1025` | SMTP server port |

See `.env.example` for the complete reference.

---

## Project Structure

```
src/
├── app.ts                    # Hono app factory (middleware + modules)
├── index.ts                  # Server bootstrap + graceful shutdown
├── env.ts                    # Zod-validated environment config
│
├── middleware/               # Global middleware stack
│   ├── auth.ts               # JWT verification (Logto JWKS)
│   ├── cors.ts               # CORS configuration
│   ├── rate-limit.ts         # Sliding window rate limiter
│   ├── idempotency.ts        # Stripe-style idempotency keys
│   ├── security-headers.ts   # CSP, HSTS, X-Frame-Options
│   ├── error-handler.ts      # Global error boundary
│   ├── logger.ts             # Pino structured logging
│   ├── plan-guard.ts         # Subscription tier gating
│   ├── team-rbac.ts          # Team role-based access control
│   └── admin-guard.ts        # Admin-only route protection
│
├── modules/                  # Domain modules (route → service → repository)
│   ├── tasks/                # Task CRUD + search + bulk operations
│   ├── projects/             # Project workspaces
│   ├── auth/                 # Authentication (Logto OIDC + PKCE)
│   ├── content/              # Daily content delivery (60+ categories)
│   ├── progress/             # Streaks, heatmaps, personal bests
│   ├── sync/                 # Offline-first sync (LWW conflict resolution)
│   ├── channels/             # Channel config, verification, webhooks
│   ├── notifications/        # Notification preferences + history
│   ├── subtasks/             # Nested subtask management
│   ├── comments/             # Threaded comments
│   ├── sections/             # Kanban sections
│   ├── tags/                 # Tag management
│   ├── recurring/            # RFC 5545 RRULE recurrence
│   ├── health/               # Liveness + readiness probes
│   ├── billing/              # RevenueCat webhooks + plans
│   ├── gamification/         # XP, levels, badges, leaderboards
│   ├── accountability/       # Partner check-ins + nudges
│   ├── teams/                # Team CRUD + RBAC + invitations
│   ├── import-export/        # CSV, JSON, Todoist, Google Tasks
│   ├── admin/                # User mgmt, feature flags, audit log
│   ├── dev-portal/           # API keys, webhooks, usage analytics
│   └── scheduler/            # Cron jobs (reminders, overdue, digest)
│
├── db/                       # Database layer
│   ├── schema/               # 34 Drizzle table definitions
│   ├── index.ts              # Database client singleton
│   ├── migrate.ts            # Migration runner
│   └── seed.ts               # Sample data seeder
│
├── queue/                    # BullMQ queue system
│   ├── queue-factory.ts      # Queue creation with consistent config
│   ├── workers.ts            # Channel-specific job processors
│   ├── notification-dispatcher.ts  # Dispatch → cascade → escalation
│   ├── connection.ts         # IORedis connection factory
│   ├── retry-policy.ts       # Exponential backoff configuration
│   └── types.ts              # Queue job type definitions
│
├── services/                 # Shared services
│   ├── channels/             # 8 channel adapters + registry
│   │   ├── push.adapter.ts
│   │   ├── telegram.adapter.ts
│   │   ├── email.adapter.ts
│   │   ├── whatsapp.adapter.ts
│   │   ├── sms.adapter.ts
│   │   ├── instagram.adapter.ts
│   │   ├── slack.adapter.ts
│   │   ├── discord.adapter.ts
│   │   ├── adapter-registry.ts
│   │   └── channel-adapter.interface.ts
│   └── templates/            # Notification message templates
│
├── ws/                       # WebSocket layer
│   ├── index.ts              # WS route + server injection
│   ├── connections.ts        # Connection pool management
│   └── types.ts              # WS message type definitions
│
└── types/                    # Shared type definitions
    └── api.ts                # API response envelope types
```

---

## Deployment

### Production: Hetzner VPS with Docker Compose

```bash
# On the VPS
git clone https://github.com/AndrousStark/unjynx-backend.git
cd unjynx-backend

# Configure production environment
cp .env.example .env
vim .env  # Set production DATABASE_URL, secrets, API keys

# Build and start
docker compose -f docker-compose.yml up -d --build

# Run migrations
docker compose exec backend pnpm db:migrate

# Verify
curl https://your-domain.com/health
```

### Docker Build

```bash
# Build the production image
docker build -t unjynx-backend:latest .

# Run standalone
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  unjynx-backend:latest
```

The Dockerfile uses a **multi-stage build** (Node 22 Alpine):
1. **deps** -- Install production dependencies only
2. **build** -- Full install + TypeScript compilation
3. **runtime** -- Minimal image with compiled JS + prod deps

### CI/CD

GitHub Actions runs on every push and PR to `main`:

| Job | Description |
|-----|-------------|
| **Test** | Runs all 1,102 tests against PostgreSQL 16 + Valkey 8 |
| **Lint & Type Check** | ESLint + `tsc --noEmit` |
| **Build** | Verifies TypeScript compilation |
| **Docker** | Builds Docker image (main branch only) |

---

## API Versioning

All endpoints are versioned under `/api/v1/*`. When breaking changes are needed, a new version prefix (`/api/v2/*`) will be introduced while maintaining backward compatibility on `v1`.

Health endpoints (`/health`, `/ready`) are intentionally unversioned for infrastructure compatibility.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js 24 | Latest LTS with native ES modules |
| **Framework** | Hono 4.7 | Ultra-fast, Web Standards API, zero deps |
| **Language** | TypeScript 5.7 (strict) | Type safety across the entire codebase |
| **ORM** | Drizzle 0.39 | Type-safe SQL, zero runtime overhead |
| **Database** | PostgreSQL 16 | Battle-tested, GIN FTS, JSONB |
| **Cache/Queue** | Valkey 8 (Redis-compatible) | Truly open-source Redis fork |
| **Job Queue** | BullMQ 5.x | Reliable job processing with retries |
| **Auth** | Logto (self-hosted) | OIDC-compliant, 30+ social providers |
| **Validation** | Zod 3.24 | Runtime type validation + schema inference |
| **Logging** | Pino 9.6 | Fastest JSON logger for Node.js |
| **JWT** | jose 6.0 | JWKS verification, no native deps |
| **Storage** | MinIO (S3-compatible) | Self-hosted object storage |
| **Testing** | Vitest 3.0 | Fast, ESM-native test runner |
| **Linting** | ESLint 9 + typescript-eslint | Strict no-any, no-unused-vars |

---

## Local Development Services

When running `docker compose up -d`, the following services are available:

| Service | URL | Credentials |
|---------|-----|-------------|
| **API Server** | http://localhost:3000 | - |
| **PostgreSQL** | localhost:5432 | todoapp / todoapp_dev_password |
| **Valkey (Redis)** | localhost:6379 | - |
| **Logto Auth** | http://localhost:3001 | - |
| **Logto Admin** | http://localhost:3002 | - |
| **MinIO Console** | http://localhost:9001 | minioadmin / minioadmin |
| **Mailpit** | http://localhost:8025 | - |
| **pgAdmin** | http://localhost:5050 | admin@todo.local / admin |
| **Grafana** | http://localhost:3003 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Ollama** | http://localhost:11434 | - |

---

## Contributing

This is a private repository. Internal contribution guidelines:

1. Create a feature branch from `main`
2. Follow conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
3. Ensure all tests pass (`pnpm test`)
4. Maintain 80%+ code coverage
5. Run type check (`pnpm exec tsc --noEmit`) and lint (`pnpm lint`)
6. Open a PR against `main`

---

<p align="center">
  <strong>UNJYNX</strong> by <strong>METAminds</strong>
  <br />
  <em>Break the satisfactory.</em>
</p>
