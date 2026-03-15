const fs = require('fs');
const path = require('path');

// Part 1: API + Backend Schema + ML (largest sections)
const content = `
################################################################################
################################################################################
  PART V — INLINED COMPANION DOCUMENT REFERENCES
################################################################################
################################################################################

  These sections replace the "See X.doc" references with full inlined content.
  After this addition, the following companion docs are no longer needed:
    - API-DESIGN-GUIDE.doc (2991 lines → condensed to ~400 lines)
    - BACKEND-ARCHITECTURE-RESEARCH.doc (2959 lines → condensed to ~500 lines)
    - ML-ALGORITHMS-RESEARCH.doc (1267 lines → condensed to ~300 lines)
    - FLUTTER-BEST-PRACTICES-2026.doc (2904 lines → condensed to ~350 lines)
    - PRICING-RESEARCH.doc (1212 lines → condensed to ~200 lines)
    - LIGHT-MODE-DESIGN-RESEARCH.doc (1021 lines → condensed to ~200 lines)

  Other docs already fully captured or no longer needed:
    - ARCHITECTURE-PLAN.doc → Plugin-Play arch already in Phase Plan intro
    - INFRASTRUCTURE-ARCHITECTURE.doc → DevOps section already in Part III-F
    - RESEARCH-COMPLETE.doc → Market analysis captured in phase plan intro
    - RESEARCH-DETAILED-APPENDIX.doc → API pricing in Pricing section below
    - FEATURE-COMPARISON.doc → Differentiation captured in phase plan intro
    - INDUSTRY-MODES-RESEARCH.doc → Deferred to v2 Phase 2
    - APP-NAME-IDEAS.doc → Brand decision (UNJYNX) finalized
    - TOOLS-AND-REFERENCES.doc → Tool matrix already in Part III-G
    - PHASE1-EXECUTION-PLAN.doc → Superseded (Phase 1 COMPLETE)


================================================================================
  H. COMPLETE REST API ENDPOINT REFERENCE (INLINED)
================================================================================

  Replaces: API-DESIGN-GUIDE.doc (2991 lines)
  Base URL: /api/v1 | URI versioning | 6-month deprecation window

  RESPONSE ENVELOPE:
    Success: { success: true, data: {...}, error: null,
               meta: { pagination: {...}, filters: {...}, sort: "..." },
               links: { self, next, prev, first, last } }
    Error (RFC 9457 Problem Details):
      { success: false, data: null,
        error: { type: "https://api.unjynx.com/errors/...",
                 title, status, detail, instance, traceId, timestamp,
                 errors: [{ field, code, message, constraint }] } }
    Content-Type for errors: application/problem+json
    Error types: validation-failed(400), authentication-required(401),
      insufficient-permissions(403), resource-not-found(404),
      conflict(409), rate-limited(429), internal(500)

  PAGINATION (Cursor + Offset Hybrid):
    Cursor (default): ?limit=20&after=base64cursor
      Response: { total, limit, hasMore, nextCursor, prevCursor }
    Offset (admin): ?page=3&limit=20
      Response: { total, page, limit, totalPages, hasMore }
    Cursor encoding: base64(JSON.stringify({ id, createdAt }))
    Expire cursors after 24h | Limits: min=1, max=100, default=20

  FILTERING/SORTING:
    Flat query: ?status=pending&priority=high
    Multi-value OR: ?status=pending,in_progress
    Range: ?due_date_gte=2026-03-01&due_date_lte=2026-03-31
    Sort: ?sort=priority:desc,due_date:asc
    Default sort: sort_order:asc,created_at:desc
    Field selection: ?fields=id,title,status
    Expand relations: ?expand=project,subtasks,tags (max 2 levels)

  RATE LIMITS:
    Anonymous: 30/min | Auth: 100/min | Premium: 300/min
    Sync: 600/min | Admin: 1000/min
    Per-endpoint overrides:
      POST /auth/login: 10/min/IP (brute force protection)
      POST /tasks/bulk-*: 10/min (heavy processing)
      GET /search: 30/min | POST /import: 5/min
    Headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
    On 429: Retry-After header

  ETAG & CONDITIONAL REQUESTS:
    Generation: sha256(resourceId + updatedAt.toISOString()).slice(0, 12)
    Conditional GET: If-None-Match -> 304 Not Modified
    Conditional UPDATE: If-Match -> 412 Precondition Failed (returns current)
    Also: Last-Modified / If-Modified-Since

  IDEMPOTENCY KEYS (IETF draft):
    Header: Idempotency-Key: <uuid-v4> | Required on POST, PATCH
    Store: Valkey idempotency:{userId}:{key} -> { statusCode, headers, body }
    TTL: 24h | Duplicate: cached response + Idempotent-Replayed: true
    In-progress duplicate: 409 Conflict

  ─── 27 ENDPOINT MODULES ─────────────────────────────────────────────────
  Legend: [PUB]=Public [AUTH]=Auth'd [ADM]=Admin [TEAM]=Team
          IK=Idempotency-Key ET=ETag

  9.1 HEALTH & OPS:
    GET  /health [PUB] -> { status, timestamp, version }
    GET  /health/live [PUB] -> liveness probe
    GET  /health/ready [PUB] -> readiness: checks db, cache, queue
    GET  /metrics [PUB|ADM] -> Prometheus format

  9.2 AUTH (via Logto OIDC):
    POST /auth/register [PUB]IK
      Req: { email, password, name, timezone }
      Res: { userId, accessToken, refreshToken, expiresIn }
    POST /auth/login [PUB]IK -> tokens + user (rate: 10/min/IP)
    POST /auth/login/:provider [PUB] -> OAuth redirect (google|apple|github)
    GET  /auth/callback/:provider [PUB] -> OAuth callback -> tokens
    POST /auth/token/refresh [PUB]IK -> rotated tokens
    POST /auth/logout [AUTH] -> revoke tokens
    POST /auth/forgot-password [PUB]IK -> always 200 (no enumeration)
    POST /auth/reset-password [PUB]IK -> { token, password }
    POST /auth/verify-email [PUB] -> { token }

  9.3 USER PROFILE:
    GET    /users/me [AUTH]ET -> profile + stats (tasksCompleted, streak, xp)
    PATCH  /users/me [AUTH]IK ET -> { name, avatarUrl, timezone, locale }
    DELETE /users/me [AUTH]IK -> GDPR erasure, { confirmation: "DELETE MY ACCOUNT" }
    GET    /users/me/settings [AUTH]ET -> notification, appearance, task, privacy
    PATCH  /users/me/settings [AUTH]IK ET -> deep merge partial update
    GET    /users/me/sessions [AUTH] | DELETE /users/me/sessions/:id [AUTH]

  9.4 TASKS (Core CRUD):
    GET    /tasks [AUTH] -> paginated, filtered, sorted
      Filters: status, priority, project_id, tag_ids, is_recurring,
               has_due_date, due_date_gte/lte, created_after, search, assignee_id
      Sort: due_date, priority, created_at, updated_at, sort_order, title
      Expand: project, subtasks, tags, reminders, comments
    GET    /tasks/:id [AUTH]ET -> ?expand=subtasks,tags,reminders,comments
    POST   /tasks [AUTH]IK -> create task
      Req: { title(1-500), description(max 5000), projectId, priority(none|
             low|medium|high|urgent), dueDate, rrule(RFC5545), tags[uuid],
             reminders[{triggerAt,channel}], assigneeId }
      Res: { task, syncId }
    PATCH  /tasks/:id [AUTH]IK ET -> partial update (If-Match for optimistic)
    DELETE /tasks/:id [AUTH] -> soft delete
    POST   /tasks/:id/complete [AUTH]IK
      Res: { task, rewards: { xpEarned, streakContinued, achievementsUnlocked } }
    POST   /tasks/:id/reopen|move|duplicate|snooze [AUTH]IK
    POST   /tasks/bulk-create|bulk-delete|bulk-complete [AUTH]IK (max 100)
    PATCH  /tasks/bulk-update [AUTH]IK -> { taskIds[], updates }
    POST   /tasks/reorder [AUTH]IK -> { orderings: [{ taskId, sortOrder }] }

  9.5 SUBTASKS:
    GET/POST/PATCH/DELETE /tasks/:taskId/subtasks(/:id) [AUTH](IK)
    POST /tasks/:taskId/subtasks/reorder [AUTH]IK
    POST /tasks/:taskId/subtasks/:id/promote [AUTH]IK -> promote to full task

  9.6 PROJECTS:
    GET/POST/PATCH/DELETE /projects(/:id) [AUTH](IK)(ET)
      Req: { name(1-200), description, color, icon, sortOrder, templateId }
    POST /projects/:id/unarchive|duplicate [AUTH]IK
    POST /projects/reorder [AUTH]IK
    DELETE ?permanent=true (default false=archive)

  9.7 SECTIONS:
    CRUD /projects/:id/sections(/:sectionId) [AUTH](IK)
    POST /projects/:id/sections/reorder [AUTH]IK

  9.8 TAGS:
    CRUD /tags(/:id) [AUTH](IK) -> { name, color, taskCount }
    POST /tasks/:id/tags [AUTH]IK -> { tagIds[] }
    DELETE /tasks/:id/tags/:tagId [AUTH]

  9.9 COMMENTS:
    CRUD /tasks/:id/comments(/:commentId) [AUTH](IK)
    CRUD /projects/:id/comments(/:commentId) [AUTH](IK)

  9.10 RECURRING TASKS:
    GET    /tasks/:id/occurrences [AUTH] -> preview ?from&to&limit(max 365)
    POST   /tasks/:id/occurrences/:date/skip|complete [AUTH]IK
    PATCH  /tasks/:id/recurrence [AUTH]IK
      Req: { rrule, applyTo: "this_only"|"this_and_future"|"all" }
    DELETE /tasks/:id/recurrence [AUTH]IK -> convert to single task

  9.11 REMINDERS & NOTIFICATIONS:
    CRUD /tasks/:id/reminders(/:id) [AUTH](IK)
      Req: { triggerAt|beforeMinutes, channel, message,
             escalationChain[{channel,delayMinutes}] }
    GET  /notifications/channels [AUTH] -> all channels with status
    POST /notifications/channels/:channel/connect [AUTH]IK
      Per-channel: WhatsApp{phoneNumber}, Telegram{linkToken},
        Instagram{username}, Slack{workspace,channel}, SMS{phoneNumber}
    POST /notifications/channels/:channel/verify [AUTH]IK -> { code }
    DELETE /notifications/channels/:channel/disconnect [AUTH]
    GET  /notifications [AUTH] -> history with channel, status filters
    POST /notifications/bulk-read [AUTH]IK
    POST /notifications/devices [AUTH]IK -> { token, platform, deviceName }

  9.12 DAILY CONTENT:
    GET  /daily-content/today [AUTH]ET -> items[{category,title,body,author}]
    GET  /daily-content/history|categories|saved [AUTH]
    POST|DELETE /daily-content/:id/like|save [AUTH](IK)

  9.13 SYNC:
    POST /sync/push [AUTH]IK
      Req: { clientId, changes[{ collection, operation(create|update|delete),
             recordId, data, fields[], timestamp, version }] }
      Res: { accepted[{recordId,serverVersion}],
             conflicts[{recordId,conflictType:"field_level",
               conflictingFields:{field:{clientValue,serverValue,
               serverTimestamp,resolution}}, resolvedRecord}],
             rejected[], serverTimestamp }
    GET  /sync/pull [AUTH] -> ?since(ISO8601)&collections&limit(max 1000)
      Res: { changes[], deletions[], hasMore, syncTimestamp }
    GET  /sync/status [AUTH] -> serverTimestamp + per-collection lastModified
    POST /sync/full [AUTH]IK -> async full re-download, returns jobId

  9.14 TEAMS:
    CRUD /teams(/:id) [AUTH](IK)(ET) -> { name, description, avatarUrl }
    CRUD /teams/:id/members(/:id) [AUTH TEAM](IK)
      Roles: owner|admin|member|viewer
    POST /teams/:id/invitations/:token/accept [PUB]IK
    GET|POST /teams/:id/projects [AUTH TEAM](IK)
    POST /projects/:id/share [AUTH]IK -> { teamId, permission: edit|view }
    POST /tasks/:id/assign [AUTH TEAM]IK -> { assigneeId }

  9.15 GAMIFICATION:
    GET /gamification/profile [AUTH]ET -> xp, level, streaks, rank
    GET /gamification/achievements [AUTH] -> ?status&category, tier(bronze-diamond)
    GET /gamification/leaderboard [AUTH] -> ?scope&period&metric&around_me
    GET /gamification/xp-history [AUTH]
    POST /gamification/streaks/freeze [AUTH]IK

  9.16 GHOST MODE:
    POST /ghost-mode/enable [AUTH]IK -> { duration, hideFrom[] }
    POST /ghost-mode/disable [AUTH]IK
    GET  /ghost-mode/status [AUTH]

  9.17 CALENDAR:
    GET  /calendar/events [AUTH] -> ?from&to(max 90d)&types
    CRUD /calendar/time-blocks(/:id) [AUTH](IK)
      Req: { title, startAt, endAt, category, color, rrule, taskId }
    POST /calendar/external/connect [AUTH]IK -> { provider }
    GET  /calendar/export.ics [AUTH]

  9.18 IMPORT/EXPORT:
    POST /import [AUTH]IK -> multipart, format(csv|json|ics|todoist|ticktick),
      max 10MB, dryRun option -> 202 async job
    POST /export [AUTH]IK -> { format, collections, filters } -> 202 async job

  9.19 WIDGETS: CRUD /widgets [AUTH]
    Types: task_list|today_focus|streak|calendar|daily_content

  9.20 WATCH APP: GET /watch/tasks (minimal) | POST /watch/tasks/:id/complete
    POST /watch/tasks (quick add) | GET /watch/summary

  9.21 USAGE/QUOTAS: GET /usage [AUTH]
    Per-channel quotas{ used, limit, remaining }, tasks, projects, storage

  9.22 ATTACHMENTS:
    POST /attachments/upload-url [AUTH]IK -> presigned MinIO URL (max 25MB)
    POST /attachments/:id/confirm | GET|DELETE /attachments/:id

  9.23 SEARCH: GET /search [AUTH]
    ?q(min 2)&types&highlight -> results[{ type, id, title, snippet, score }]
    GET /search/suggest [AUTH]

  9.24 ANALYTICS: GET /analytics/overview|habits|energy|projects/:id|tags [AUTH]

  9.25 ADMIN:
    GET|PATCH|DELETE /admin/users(/:id) [ADM]
    GET /admin/stats -> DAU/WAU/MAU, MRR
    Notification queue management | Content CRUD | Audit log

  9.26 FEATURE FLAGS: GET /feature-flags [AUTH]
    Admin CRUD with targeting rules (plan, percentage rollout)

  9.27 WEBHOOKS:
    CRUD /webhooks(/:id) [AUTH](IK) -> { url, events[], secret }
    POST /webhooks/:id/test | GET /webhooks/:id/deliveries
    Events: task.created|updated|completed|deleted, project.*,
      subtask.*, reminder.*, streak.*, achievement.unlocked, team.member_*
    Signature: X-Unjynx-Signature: sha256=HMAC(secret, timestamp.body)
    Retry: 7 attempts exponential (0,1m,5m,30m,2h,6h,24h) -> dead letter
    Disable after 30 consecutive failures
    Inbound: POST /webhooks/inbound/{whatsapp|telegram|stripe|logto} [PUB]
    All inbound: verify signature first, 200 immediately, async via queue

  BULK OPERATIONS: Max 100 items, IK required, validate all before processing
    207 Multi-Status for partial success

  SECURITY CHECKLIST (per endpoint):
    Zod validation, JWT auth, authorization (ownership/role), rate limit,
    request ID logging, consistent error format, no internal leaks,
    parameterized queries, UUID format validation, resource ownership check,
    search input sanitization, payload size limits, security headers


================================================================================
  I. COMPLETE DATABASE SCHEMA REFERENCE (INLINED)
================================================================================

  Replaces: BACKEND-ARCHITECTURE-RESEARCH.doc Section 2 (30+ tables)
  PostgreSQL 16+ with Drizzle ORM. All tables defined below.

  SCHEMA HELPERS (shared columns):
    timestamps: { createdAt, updatedAt } — timestamptz precision 3
    softDelete: { deletedAt: timestamptz nullable }
    pk:         { id: uuid().primaryKey().defaultRandom() }
    syncColumns: { syncId, clientUpdatedAt, serverUpdatedAt, isDeleted }

  ENUMS:
    userRole: free|pro|team_member|team_admin|enterprise_admin|system_admin
    taskStatus: pending|in_progress|completed|cancelled
    taskPriority: none|low|medium|high|urgent
    reminderChannel: push|telegram|whatsapp|sms|email|discord|slack
    notificationStatus: pending|queued|sent|delivered|read|failed|expired
    channelType: telegram|whatsapp|sms|email|discord|slack|instagram
    channelStatus: pending|active|suspended|disconnected
    teamRole: owner|admin|member|viewer
    importJobStatus: pending|processing|completed|failed

  ─── TABLE DEFINITIONS ─────────────────────────────────────────────────

  users:
    pk, logtoId(unique), email, name, avatarUrl, timezone('Asia/Kolkata'),
    locale('en'), role(userRoleEnum), onboardingCompleted(bool),
    lastActiveAt, timestamps, softDelete
    Indexes: logto_id, email, partial unique email WHERE deletedAt IS NULL

  user_settings:
    pk, userId(FK users cascade, unique),
    theme(system|light|dark), brandColor, quietHoursStart/End,
    weekStartsOn(0-6), defaultPriority, defaultReminderMinutes,
    enableDailyContent(bool), enableStreakNotifications(bool),
    enableSoundEffects(bool), timestamps

  sessions:
    pk, userId(FK cascade), deviceId, deviceName,
    platform(android|ios|web), pushToken, lastSeenAt, expiresAt, timestamps
    Indexes: user_id, expires_at

  tasks:
    pk, userId(FK cascade), projectId(FK projects set null),
    parentTaskId(self-ref for subtasks), title, description,
    status(taskStatusEnum), priority(taskPriorityEnum),
    dueDate, completedAt, rrule(RFC5545 string),
    estimatedMinutes, actualMinutes, sortOrder,
    energyLevel(low|medium|high), context(@home,@work,@errands),
    searchVector(tsvector GENERATED STORED: A=title B=description),
    field_timestamps(JSONB DEFAULT '{}' — per-field LWW timestamps),
    syncColumns, timestamps, softDelete
    Indexes:
      user_id, project_id, parent_task_id,
      composite(user_id, status), composite(user_id, dueDate),
      partial(user_id, status, priority WHERE deletedAt IS NULL AND
              status != 'cancelled'),
      GIN(search_vector)

  projects:
    pk, userId(FK cascade), name, description,
    color('#6C5CE7'), icon('folder'), isArchived(bool),
    sortOrder, syncColumns, timestamps, softDelete
    Indexes: user_id, partial(user_id, sortOrder WHERE deletedAt IS NULL
             AND isArchived = false)

  sections:
    pk, projectId(FK projects cascade), name, sortOrder, timestamps

  tags:
    pk, userId(FK cascade), name, color('#A0A0A0'), timestamps
    Unique: (userId, name)

  task_tags:
    taskId(FK tasks cascade), tagId(FK tags cascade)
    PK: (taskId, tagId)

  reminders:
    pk, taskId(FK cascade), userId(FK cascade),
    channel(reminderChannelEnum), scheduledAt, sentAt, failedAt,
    failureReason, escalationDelayMinutes,
    nextEscalationChannel, timestamps
    Indexes: composite(userId, scheduledAt), taskId,
      partial(scheduledAt WHERE sentAt IS NULL AND failedAt IS NULL)

  notifications:
    pk, userId(FK cascade), title, body,
    type(reminder|streak|achievement|system),
    status(notificationStatusEnum), channel,
    referenceType, referenceId, metadata(jsonb),
    scheduledAt, sentAt, deliveredAt, readAt, timestamps
    Indexes: composite(userId, status), scheduledAt

  notification_logs:
    pk, notificationId(FK), channel, status,
    providerResponse(jsonb), errorMessage, attemptNumber, createdAt
    PARTITIONED BY RANGE (created_at) — monthly partitions via pg_partman

  content_categories:
    pk, name(unique), slug(unique), description, icon,
    isActive(bool), timestamps

  daily_content:
    pk, categoryId(FK content_categories), title, body, author,
    sourceUrl, scheduledDate, metadata(jsonb), timestamps

  user_content_preferences:
    pk, userId(FK cascade), categoryId(FK content_categories),
    isEnabled(bool), deliveryTime("HH:MM"), deliveryChannel, timestamps
    Unique: (userId, categoryId)

  recurring_rules:
    pk, taskId(FK cascade), rrule(RFC5545), lastGeneratedAt,
    nextOccurrenceAt, occurrenceCount, maxOccurrences, timestamps
    Indexes: nextOccurrenceAt, taskId

  sync_records:
    pk, userId(FK cascade), deviceId, entityType(task|project|tag),
    lastSyncedAt, syncVersion, timestamps
    Unique: (userId, deviceId, entityType)

  teams:
    pk, name, slug(unique), ownerId(FK users),
    apiKey, apiKeyHash, maxMembers(5), timestamps, softDelete

  team_members:
    pk, teamId(FK cascade), userId(FK cascade),
    role(teamRoleEnum), invitedBy(FK users), joinedAt, timestamps
    Unique: (teamId, userId)

  team_projects:
    teamId(FK teams), projectId(FK projects)
    PK: (teamId, projectId)

  achievements:
    pk, slug(unique), name, description, icon, xpReward,
    requiredCount, category(tasks|streaks|social|exploration),
    isSecret(bool), timestamps

  user_achievements:
    pk, userId(FK cascade), achievementId(FK achievements),
    unlockedAt, progress, timestamps
    Unique: (userId, achievementId)

  xp_transactions:
    pk, userId(FK cascade), amount, reason(task_completed|streak_bonus|
    achievement), referenceType, referenceId, timestamps

  streaks:
    pk, userId(FK cascade, unique), currentStreak, longestStreak,
    lastActivityDate, streakFreezeCount, totalTasksCompleted,
    totalXp, level(1), timestamps

  channel_connections:
    pk, userId(FK cascade), channelType(channelTypeEnum),
    status(channelStatusEnum), externalId, metadata(jsonb),
    connectedAt, lastUsedAt, timestamps
    Unique: (userId, channelType)

  message_quotas:
    pk, userId(FK cascade), channelType, monthlyLimit,
    currentMonth("2026-03"), usedCount, timestamps
    Unique: (userId, channelType, currentMonth)

  message_usage:
    pk, userId(FK cascade), channelType, notificationId(FK),
    sentAt, costCredits(1), timestamps

  file_attachments:
    pk, userId(FK cascade), taskId(FK nullable),
    fileName, fileSize, mimeType, storageKey(MinIO key), timestamps

  import_jobs:
    pk, userId(FK cascade), sourceFormat(todoist|ticktick|csv|ical),
    status(importJobStatusEnum), fileKey, totalItems, processedItems,
    errorLog(jsonb[]), completedAt, timestamps

  export_jobs:
    pk, userId(FK cascade), format(json|csv|ical), status,
    fileKey, completedAt, expiresAt, timestamps

  feature_flags:
    pk, key(unique), description, isEnabled(bool),
    enabledForRoles(jsonb string[]), enabledForUsers(jsonb string[]),
    percentage(gradual rollout %), timestamps

  audit_logs:
    pk, userId(FK nullable), action, entityType, entityId,
    oldValues(jsonb), newValues(jsonb), ipAddress, userAgent, createdAt

  message_templates:
    pk, channel, slug, name, bodyTemplate({{1}},{{2}} placeholders),
    whatsappTemplateId, whatsappNamespace,
    dltTemplateId, dltEntityId, dltContentType(transactional|promotional),
    isApproved(bool), timestamps
    Unique: (channel, slug)

  focus_sessions:
    pk, userId(FK cascade), taskId(FK tasks nullable),
    duration(int), rating(1-5), sessionsCompleted(int),
    type(pomodoro|freeform), completedAt, timestamps

  ─── INDEX STRATEGY ─────────────────────────────────────────────────

  B-tree: equality, range, sorting (default)
  GIN: full-text search (tsvector), JSONB operators, arrays
  Partial: WHERE deleted_at IS NULL (skip soft-deleted rows)
  Composite: highest-cardinality column first

  RULES:
    - Always index foreign keys (Drizzle doesn't auto-index)
    - Use partial indexes for soft-delete tables
    - Monitor via pg_stat_user_indexes (unused indexes waste writes)
    - Composite indexes serve queries on leading columns

  RLS (Row Level Security):
    Enable on tasks, projects, reminders
    Policy: user_id = current_setting('app.current_user_id')::uuid
    v1: application-level WHERE user_id=? (simpler)
    v2: PostgreSQL RLS for multi-tenant (team/enterprise)

  MIGRATIONS:
    Dev: drizzle-kit push (fast, destructive)
    Prod: drizzle-kit generate + migrate (versioned, safe)
    Custom: drizzle-kit generate --custom (for partitioning, RLS, triggers)

  ─── BACKEND ARCHITECTURE PATTERNS ─────────────────────────────────────

  DIRECTORY:
    src/ -> index.ts, env.ts(Zod-validated), app.ts(middleware), container.ts(DI)
      shared/ -> db/, cache/, queue/, errors/, types/, utils/
      middleware/ -> auth, cors, rate-limit, error-handler, logger, etc.
      modules/ -> {module}/(routes, controller, service, repository, schema)
      workers/ -> notification, recurring-task, content-delivery, streak, etc.
      ws/ -> index, connections, types, pg-listener

  MODULE PATTERN: routes -> controller -> service -> repository -> database
    Routes: HTTP endpoints + middleware. NO business logic.
    Controller: Extract input, call service, format ApiResponse. HTTP concerns.
    Service: ALL business logic. Orchestrate repos, emit events, transactions.
    Repository: Pure Drizzle queries. Returns domain objects. NO business logic.

  DI CONTAINER:
    class Container { instances Map, resolve<T>(token, factory),
      override<T>(token, instance), reset() }
    Typed accessors: getTaskRepo(), getTaskService(), getTaskController()
    Lazy singleton pattern. Test overrides via container.override().

  MIDDLEWARE CHAIN ORDER:
    1. RequestID (first — correlation)
    2. SecureHeaders (xFrameOptions:DENY, xContentTypeOptions:nosniff)
    3. CORS (before auth for preflight)
    4. Logger (pino, after request-id)
    5. Metrics (Prometheus collection)
    6. RateLimit (before auth to protect auth endpoint)
    7. CSRF (admin routes only)
    Auth is per-route, NOT global (/health, /metrics must be public)

  PG LISTEN/NOTIFY (Real-time WebSocket):
    Dedicated connection: postgres(url, { max:1, idle_timeout:0 })
    Channel: 'entity_changes' -> { action, userId, entityType, entityId }
    PG trigger: notify_entity_change() on INSERT/UPDATE/DELETE
    LIMITATIONS: Notifications LOST if listener down (not queued),
      max 8000 bytes. Use for real-time UI only. BullMQ for guaranteed.

  BULLMQ QUEUE-PER-CHANNEL:
    notification:push (50 conc, 1000/min)
    notification:telegram (10 conc, 30/sec)
    notification:whatsapp (5 conc, 80/sec)
    notification:sms (3 conc, 10/sec)
    notification:email (10 conc, 100/min)
    notification:discord (5, 50/sec)
    notification:slack (5, 1/sec/channel)
    escalation (5) | scheduled-reminders (10) | content-delivery (5)
    Shared Valkey: maxRetriesPerRequest:null
    removeOnComplete: 24h | removeOnFail: 7d

  CHANNEL FACTORY:
    ChannelFactory.create(channel) -> lazy-cached ChannelSender
    Interface: { send(request): Promise<{ success, providerResponse?, error? }> }

  BACKGROUND JOBS:
    Recurring tasks: every 15min, look-ahead 24h, RRule.between()
    Daily content: midnight UTC -> per-user delayed jobs at local time
    Streak calc: every hour at :05, timezone-aware midnight processing
    Analytics: hourly + daily rollup
    Cleanup: expired sessions (6h), old notification logs (monthly drop),
      orphan attachments (weekly)
    Import/export: batch insert chunks of 50 with progress updates

  SECURITY:
    JWT: jose + createRemoteJWKSet from Logto JWKS
    Scope checking: requireScope(...scopes) middleware
    API keys: SHA-256 hash stored, timing-safe comparison
    Rate limiting: sliding window in Valkey sorted sets
      free:60/min, pro:300/min, team:600/min, enterprise:1200/min
    HTML sanitization: strip tags in Zod transform
    SQL injection: Drizzle parameterizes all queries. NEVER use sql string interpolation.

  MONITORING:
    Pino structured logging with request context, redact auth/password
    Prometheus: http_request_duration_seconds histogram,
      http_requests_total counter, ws_active_connections gauge,
      bullmq_queue_depth gauge
    OpenTelemetry: NodeSDK with auto-instrumentation -> OTLP exporter
    Health: /healthz (liveness), /ready (readiness: db+redis), /metrics


================================================================================
  J. ML/DL ALGORITHM REFERENCE (INLINED)
================================================================================

  Replaces: ML-ALGORITHMS-RESEARCH.doc (1267 lines, 12+ papers)

  ─── 1. SMART TASK SCHEDULING ──────────────────────────────────

  Phase 1 (v1): XGBoost (tabular)
    Features: hour, day_of_week, rolling_completion_rate, category, energy
    Works with small datasets, O(K*depth) inference, ~100KB model
  Phase 2 (v2P1): LSTM (2-layer, 64-128 units, 14-30 day sequences, ~500KB)
  Phase 3 (v2P3): Transformer (2-4 layers, 30-90 day sequences, ~1-2MB)
  Cold start: TimesFM/Chronos for zero-shot

  Reinforcement Learning:
    Phase 1: Contextual MAB (Thompson Sampling)
      Arms = time slots, context = time/energy/task_type
      Reward = completed on time, O(k)/decision, on-device
    Phase 2+: DQN (state=user+tasks+time, actions=schedule/defer/split)
      Needs >10K interactions

  Energy-aware: Gaussian Process on self-reported energy -> circadian curve
    Match heavy tasks to peak energy (10am-12pm, 3pm-5pm), light to troughs

  ─── 2. NLP TASK PARSING ──────────────────────────────────

  Primary: Chrono.js (TypeScript, <1ms, English)
  Fallback: Claude Haiku ($0.001/parse, 200-500ms, Hindi support)
  Intent classification: Rule-based + Haiku hybrid
    Intents: CREATE_TASK, SET_REMINDER, SET_RECURRING, UPDATE_TASK,
             COMPLETE_TASK, QUERY_TASKS, SET_PRIORITY
  Hindi: Claude Haiku with Hindi prompt template
    Vocabulary: kal, parso, subah, dopahar, shaam, raat + day/month names

  ─── 3. PRIORITY PREDICTION ──────────────────────────────────

  XGBoost (87-90% accuracy, 2-5ms inference, ~100KB ONNX model)
  17 input features (top 5 by importance):
    hours_until_deadline, is_overdue, completion_rate, times_deferred,
    user_historical_priority
  Cold start (<50 tasks): rule-based (24h->P1, 72h->P2, 7d->P3, else P4)
  Warm (50-500): per-user XGBoost with population prior
  Hot (500+): fully personalized, retrain weekly

  ─── 4. SMART SUGGESTIONS ("What next?") ──────────────────────────

  Phase 1 (v1): Weighted scoring
    score = 0.25*urgency + 0.20*importance + 0.15*energy_match +
            0.10*momentum + 0.10*context_match + 0.10*streak_bonus +
            0.05*dependency_ready - 0.05*fatigue_penalty
    Data structure: Max-heap sorted by score, O(n) per cycle

  Phase 2 (v2P3): LinUCB (contextual bandit)
    Context: time, energy, tasks_completed, time_since_break, location
    Arms = top-K candidate tasks
    Reward: completed=+1, deferred=+0.2, dismissed=-0.3, ignored=0

  ─── 5. NOTIFICATION TIMING ──────────────────────────────────

  Personalized hourly engagement model: 24 bins, 60-day window
  Bayesian blend with population prior:
    Cold: 100% population -> 7d: 70/30 -> 30d: 30/70 -> 60d: 10/90
  Update weekly. 52% higher match rate vs generalized.

  Channel selection: Thompson Sampling per user
    Arms = [push, whatsapp, telegram, email, sms, in_app]
    Reward by response time: 5min=+1, 30min=+0.7, 2h=+0.4, never=-0.2
    Cost-aware: adjusted_score = sample * (1 - cost_weight * channel_cost)
    Costs (India): Telegram/Push=FREE, Email~$0.0001, WhatsApp~$0.005-0.02,
      SMS~$0.003-0.005

  ─── 6. CONTENT RECOMMENDATION ──────────────────────────────────

  TF-IDF + Cosine Similarity with boost factors (new, diverse, timely)
  Cold start: Onboarding survey -> demographic cluster -> popularity
  Then: 70/30 personalized/exploration (explore-then-exploit)

  ─── 7. ANOMALY DETECTION ──────────────────────────────────

  Burnout: Isolation Forest (unsupervised)
    Features: tasks_created/day z-score, declining completion, increasing delay
    Thresholds: WATCH(0.4-0.6), WARNING(0.6-0.8), CRITICAL(0.8+)

  Procrastination: DBSCAN + rules (>3 deferrals, approaching deadline no progress)
    Interventions: 2-minute rule, decomposition, accountability partner

  ─── 8. HABIT FORMATION ──────────────────────────────────

  LASSO regression (PCS approach, PNAS 2023)
    Track AUC trajectory -> plateau = habit formed
    Key finding: takes MONTHS (not 21 days), individual variation enormous
  Streak prediction: Survival analysis (Cox Proportional Hazards)
  Nudge timing:
    Exploration=2x/day, Engagement=milestones, Forming=1x/day AM,
    Embedded=weekly summary, Declining=2x/week re-engagement

  ─── 9. ON-DEVICE ML ──────────────────────────────────

  flutter_litert (TFLite): LSTM, neural networks (~500KB)
  onnxruntime: XGBoost, LightGBM, Isolation Forest (~200KB)
  Native Dart: LASSO, logistic regression, scoring, Bloom filters (<10KB)
  Total footprint: ~1MB
  Cloud: Claude Haiku (80%), Sonnet (15%), Ollama (dev)
  Model updates: train weekly -> quantize INT8 -> Shorebird OTA

  ─── 10. IMPLEMENTATION PHASES ──────────────────────────────────

  Phase 1: Chrono.js, rule-based priority, weighted scoring,
    Z-score anomaly, pg_trgm, BullMQ scheduling, Bloom filter
  Phase 2: XGBoost priority, Claude Haiku Hindi, Thompson Sampling,
    send-time model, LASSO habits, TF-IDF content
  Phase 3: LSTM on-device, LinUCB suggestions, Isolation Forest burnout,
    survival analysis streaks, Merkle tree sync
  Phase 4: DQN scheduling, collaborative filtering, federated learning
  Phase 5: Transformer, full CRDT, time-series foundation models
`;

const outFile = path.join(__dirname, 'EXPANSION-REFS-P1.doc');
fs.writeFileSync(outFile, content, 'utf-8');
console.log('EXPANSION-REFS-P1.doc written. Lines:', content.split('\n').length);
