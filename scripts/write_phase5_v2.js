const fs = require('fs');
const path = 'C:/Users/SaveLIFE Foundation/Downloads/personal/Project- TODO Reminder app/COMPREHENSIVE-PHASE-PLAN.doc';

const content = `

################################################################################
  PHASE 5: POLISH AND LAUNCH
  Timeline: Weeks 20-22 (3 weeks) | Status: PLANNED
  No new screens. Focus: landing page, app stores, audits, beta, launch.
################################################################################

  OVERVIEW:
  ---------
  No new features. All polish, testing, optimization, and launch preparation.
  By end of Phase 5, UNJYNX is live on App Store and Play Store.

================================================================================
  TASK 5.1: Landing Page (Astro on Vercel)
  Duration: 3 days | Week 20
================================================================================

  SUB-TASKS:
  5.1.1  Astro 4.x project setup with Tailwind CSS
  5.1.2  Landing page sections:
         - Hero: animated UNJYNX logo, tagline, CTA buttons
         - Features grid: 6 key features with icons
         - Channel showcase: WhatsApp/Telegram/Instagram/SMS icons with
           animation showing reminders arriving on each platform
         - Pricing table: Free | Pro | Team with feature comparison
         - Testimonials: beta user quotes
         - FAQ accordion: 10 common questions
         - Footer: links, social, legal
  5.1.3  SEO:
         - Meta tags, Open Graph, Twitter cards
         - Structured data (JSON-LD: SoftwareApplication)
         - Sitemap, robots.txt
  5.1.4  Performance: 100 Lighthouse target, WebP images, lazy loading
  5.1.5  CTA: App Store + Play Store badge links
  5.1.6  PostHog analytics integration
  5.1.7  Deploy to Vercel, configure unjynx.com domain
  5.1.8  Write E2E tests (3+ Playwright)

  PACKAGES: astro 4.x, @astrojs/tailwind, @astrojs/sitemap

================================================================================
  TASK 5.2: App Store and Play Store Preparation
  Duration: 2 days | Week 20
================================================================================

  SUB-TASKS:
  5.2.1  App Store Connect:
         - Screenshots: 6.7" iPhone 15 Pro Max, 5.5" iPhone 8 Plus,
           12.9" iPad Pro (6 screenshots each, showing key flows)
         - App description (4000 chars), subtitle, keywords
         - Categories: Productivity (primary), Lifestyle (secondary)
         - Privacy policy URL, support URL
         - Review notes for Apple reviewer
  5.2.2  Google Play Console:
         - Screenshots: phone, 7" tablet, 10" tablet
         - Feature graphic (1024x500)
         - Description (4000 chars), short description (80 chars)
         - Content rating questionnaire
         - Data safety form (what data collected, shared, encrypted)
  5.2.3  Build release artifacts:
         - Android: flutter build appbundle --release (use 8.3 short paths)
         - iOS: flutter build ipa --release (requires macOS + Xcode)
  5.2.4  App signing:
         - Google: Play App Signing (Google managed)
         - Apple: Distribution Certificate + Provisioning Profile
  5.2.5  Upload to stores as draft / internal testing

================================================================================
  TASK 5.3: Performance Audit
  Duration: 2 days | Week 21
================================================================================

  SUB-TASKS:
  5.3.1  Flutter DevTools profiling:
         - Frame times < 16ms (60fps) for all animations
         - Memory leak detection (dispose controllers)
         - Widget rebuild analysis (minimize unnecessary rebuilds)
  5.3.2  Dart Analysis: dart analyze --fatal-infos (zero issues)
  5.3.3  APK size: target < 20MB (--split-per-abi, --tree-shake-icons)
  5.3.4  Startup time: < 2s cold start (measure via flutter run --trace-startup)
  5.3.5  Network: request waterfall, payload sizes, caching headers
  5.3.6  Database: Drift query profiling, index usage verification
  5.3.7  Backend: k6 load testing:
         - 100 concurrent users, 5-minute ramp
         - Target: p95 < 200ms, p99 < 500ms, 0% error rate
         - Test scenarios: auth, task CRUD, sync push/pull, content
  5.3.8  Fix any performance issues found

  TOOLS: Flutter DevTools, k6 (load testing), Chrome DevTools

================================================================================
  TASK 5.4: Security Audit
  Duration: 2 days | Week 21
================================================================================

  SUB-TASKS:
  5.4.1  OWASP Mobile Top 10 checklist:
         - M1: Improper Platform Usage (API misuse)
         - M2: Insecure Data Storage (check flutter_secure_storage)
         - M3: Insecure Communication (SSL pinning check)
         - M4: Insecure Authentication (JWT validation)
         - M5: Insufficient Cryptography
         - M6: Insecure Authorization (plan gating)
         - M7: Client Code Quality (static analysis)
         - M8: Code Tampering (obfuscation, root detection)
         - M9: Reverse Engineering (ProGuard/R8)
         - M10: Extraneous Functionality (debug endpoints removed)
  5.4.2  SSL pinning enabled for production API
  5.4.3  Root/jailbreak detection (flutter_jailbreak_detection)
  5.4.4  Code obfuscation: --obfuscate --split-debug-info
  5.4.5  API security verification:
         - Rate limiting on all endpoints
         - JWT expiry validation
         - Input sanitization (Zod schemas)
         - SQL injection: parameterized queries (Drizzle handles this)
  5.4.6  Secret management:
         - No hardcoded keys in source
         - .env properly excluded from git
         - Secret rotation documented
  5.4.7  DPDP Act 2023 (India) compliance:
         - Consent collection, data minimization, right to erasure
  5.4.8  Dependency audit: npm audit, flutter pub outdated
  5.4.9  OWASP ZAP scan on backend API

================================================================================
  TASK 5.5: Accessibility Audit
  Duration: 1 day | Week 21
================================================================================

  SUB-TASKS:
  5.5.1  WCAG 2.1 AA compliance verification
  5.5.2  Screen reader testing: TalkBack (Android) + VoiceOver (iOS)
  5.5.3  Dynamic type: verify up to 200% font scaling works
  5.5.4  Color contrast: 4.5:1 minimum on all text (verify both themes)
  5.5.5  Touch targets: 48x48dp minimum on all interactive elements
  5.5.6  Reduce motion: system setting respected, no decorative animations
  5.5.7  Color blindness: no info conveyed by color alone
  5.5.8  Fix any accessibility issues found

================================================================================
  TASK 5.6: Beta Testing
  Duration: 4 days | Week 21-22
================================================================================

  SUB-TASKS:
  5.6.1  iOS TestFlight: 25 internal, 100 external testers
  5.6.2  Google Play Internal Testing: 25 testers
  5.6.3  Feedback channels: in-app feedback form, Telegram beta group
  5.6.4  Bug triage:
         - Critical: fix before launch (crashes, data loss)
         - High: fix in week 1 post-launch
         - Medium: fix in month 1
  5.6.5  Crash monitoring: Sentry integration verified, source maps uploaded
  5.6.6  Beta metrics: DAU, session length, feature usage, crash rate

================================================================================
  TASK 5.7: Launch Preparation
  Duration: 2 days | Week 22
================================================================================

  SUB-TASKS:
  5.7.1  Production deployment:
         - Backend on managed services or Docker
         - PostgreSQL production (Neon free tier or self-hosted)
         - Valkey production instance
  5.7.2  Production .env with real credentials
  5.7.3  Database migration on production PostgreSQL
  5.7.4  Logto production tenant:
         - Production redirect URIs
         - Google/Apple OAuth production credentials
  5.7.5  DNS: unjynx.com -> Cloudflare
         - api.unjynx.com -> backend server
         - admin.unjynx.com -> Vercel (admin portal)
         - dev.unjynx.com -> Vercel (dev portal)
  5.7.6  SSL: Cloudflare managed certificates
  5.7.7  Monitoring:
         - Grafana + Prometheus alerts configured
         - Sentry error tracking with Slack alerts
         - PostHog analytics and feature flags
  5.7.8  Backup: PostgreSQL automated daily backups
  5.7.9  Runbook: incident response procedures documented
  5.7.10 Submit to App Store + Play Store for review

================================================================================
  PHASE 5 SUMMARY
================================================================================

  TESTING:
  E2E: 10+ new (landing page + critical flows Playwright)
  Load: k6 scenarios for API
  No new unit tests (polish only)
  TOTAL PHASE 5: ~10 new tests
  CUMULATIVE AT LAUNCH: ~601 total tests

  ALL V1 LAUNCH METRICS:
  - 66 screens (mobile)
  - 10 web screens (admin) + 8 web screens (dev portal)
  - 150+ API endpoints
  - 8 notification channels
  - 30+ database tables
  - 601+ tests
  - < 20MB APK
  - < 2s cold start
  - 60fps animations


################################################################################
################################################################################
  PART II - v2 PHASES (Post-Launch Features)
################################################################################
################################################################################


################################################################################
  v2 PHASE 1: AI ASSISTANT
  Timeline: Weeks 23-26 (4 weeks) | Status: POST-LAUNCH
  Screens: K1 (AI Chat), K2 (Auto-Schedule), K3 (AI Insights)
################################################################################

  OVERVIEW:
  Full AI capabilities via Claude API. Model routing: Haiku 4.5 (80%),
  Sonnet 4.6 (15%), Opus 4.6 (5%). AI personas, task decomposition,
  smart scheduling, weekly AI insights.

================================================================================
  TASK v2.1.1: BACKEND - Claude API Integration
  Duration: 3 days
================================================================================

  SUB-TASKS:
  v2.1.1.1  Anthropic SDK setup (@anthropic-ai/sdk)
  v2.1.1.2  Model routing service:
            - Classify request complexity (simple/medium/complex)
            - Simple (80%): Haiku 4.5 (fast, cheap)
              task suggestions, quick completions, NLP parsing
            - Medium (15%): Sonnet 4.6 (best coding)
              task decomposition, schedule optimization, insights
            - Complex (5%): Opus 4.6 (deep reasoning)
              weekly reports, complex planning, multi-step analysis
  v2.1.1.3  Prompt management:
            - Version-controlled templates in src/prompts/
            - Prompt variants for each AI persona
            - System prompts enforce UNJYNX personality
  v2.1.1.4  Cost tracking:
            - Token usage per user per request
            - Daily/monthly budgets with alerts
            - Cost per feature breakdown
  v2.1.1.5  Rate limiting: Pro 100 AI calls/day, Team 200/day
  v2.1.1.6  Streaming responses (Server-Sent Events)
  v2.1.1.7  Response caching: cache similar queries
            (embedding similarity > 0.95 threshold)
  v2.1.1.8  Write tests (15+ tests)

  API ENDPOINTS:
  POST   /api/v1/ai/chat              - Chat (streaming SSE)
  POST   /api/v1/ai/decompose         - Break down task
  POST   /api/v1/ai/schedule          - Suggest optimal schedule
  GET    /api/v1/ai/insights          - Weekly AI insights
  POST   /api/v1/ai/suggest-next      - Next task suggestion
  GET    /api/v1/ai/usage             - AI usage stats

  BACKEND PACKAGES: @anthropic-ai/sdk 0.30+

  DSA:
  - Token bucket: AI rate limiting per user
  - Decision tree: request complexity classification
  - Cosine similarity: response cache lookup (embedding vectors)

================================================================================
  TASK v2.1.2: FLUTTER - AI Chat Interface (K1)
  Duration: 4 days
================================================================================

  SUB-TASKS:
  v2.1.2.1  Chat-style interface: conversation bubbles
  v2.1.2.2  Streaming text display (character-by-character animation)
  v2.1.2.3  Capabilities:
            - "What should I focus on right now?"
            - "Break down [task name]"
            - "Schedule my tasks for this week"
            - "What am I forgetting?"
            - "How productive was I this week?"
            - "Draft a pushback email for this deadline"
            - Natural language task creation
  v2.1.2.4  Quick action chips at bottom
  v2.1.2.5  AI Personas (Pro, unlockable):
            - Default (balanced, helpful)
            - Drill Sergeant (tough love, no excuses)
            - Therapist (empathetic, understanding)
            - CEO (strategic, big-picture)
            - Coach (encouraging, growth-focused)
  v2.1.2.6  Voice input for queries
  v2.1.2.7  Context: AI accesses tasks, projects, calendar, habits
  v2.1.2.8  Write tests (10+ tests)

  FLUTTER PACKAGES: flutter_markdown 0.7.x, speech_to_text 7.x

================================================================================
  TASK v2.1.3: FLUTTER - AI Auto-Schedule (K2)
  Duration: 3 days
================================================================================

  SUB-TASKS:
  v2.1.3.1  Show unscheduled tasks
  v2.1.3.2  AI suggests optimal calendar placement:
            Priority, deadline, conflicts, duration estimates,
            productivity patterns (historical data)
  v2.1.3.3  Preview: calendar with AI-placed tasks (draggable)
  v2.1.3.4  Accept all / adjust individual / undo
  v2.1.3.5  Write tests (5+ tests)

================================================================================
  TASK v2.1.4: FLUTTER - AI Insights (K3)
  Duration: 2 days
================================================================================

  SUB-TASKS:
  v2.1.4.1  Weekly auto-generated report (Claude Sonnet):
            Summary, Patterns, Suggestions, Comparisons,
            Predictions, Warnings
  v2.1.4.2  Charts alongside AI-generated text
  v2.1.4.3  Write tests (5+ tests)

================================================================================
  TASK v2.1.5: On-Device ML Setup
  Duration: 3 days
================================================================================

  SUB-TASKS:
  v2.1.5.1  flutter_litert (formerly TFLite) integration
  v2.1.5.2  Priority prediction model (LightGBM -> LiteRT):
            16 features: time_of_day, day_of_week, task_length,
            has_deadline, deadline_proximity, project_importance,
            historical_priority, defer_count, energy_level,
            completion_rate, similar_task_priority, tag_weights,
            description_length, subtask_count, recurrence_type, role
            Reference: Ke et al., "LightGBM," NIPS 2017
  v2.1.5.3  INT8 quantization: 4x smaller, 2x faster
  v2.1.5.4  Lazy model download on first use (~5MB per model)
  v2.1.5.5  Write tests (5+ tests)

  FLUTTER PACKAGES: flutter_litert 0.3+

  v2 PHASE 1 SUMMARY:
  Testing: 40+ new | Cumulative: ~641
  Cost estimate: Claude API ~$200-500/mo for 10K users (mostly Haiku)


################################################################################
  v2 PHASE 2: INDUSTRY MODES
  Timeline: Weeks 27-30 (4 weeks) | Status: POST-LAUNCH
  Screens: O1 (Selector), O2 (Hustle), O3 (Closer), O4 (Grind)
################################################################################

  OVERVIEW:
  3 industry modes that change vocabulary, templates, dashboard widgets,
  AI behavior, and daily content. Mode switching is instant and non-destructive.

================================================================================
  TASK v2.2.1: BACKEND - Mode Framework
  Duration: 2 days
================================================================================

  SUB-TASKS:
  v2.2.1.1  Mode config schema: vocabulary, templates, statuses,
            channel templates, content mix, dashboard widget
  v2.2.1.2  API endpoints:
            GET  /api/v1/modes                 - Available modes
            PUT  /api/v1/modes/active          - Set active mode
            GET  /api/v1/modes/:id/templates   - Mode templates
            GET  /api/v1/modes/:id/vocabulary  - Vocabulary map
  v2.2.1.3  Mode switching: instant, non-destructive (no data change)
  v2.2.1.4  Write tests (5+ tests)

================================================================================
  TASK v2.2.2: Hustle Mode - Freelancers/Solopreneurs
  Duration: 3 days
================================================================================

  VOCABULARY: Projects->Clients, Tasks->Deliverables, Tags->Skills,
              Priority P1->Urgent/Rush, Archive->Completed clients

  ADDED FIELDS: client_name, rate_type (hourly/fixed/retainer),
                amount (currency+value), payment_status
                (Unpaid->Invoiced->Paid), invoice_number

  TEMPLATES (5):
  1. Client Onboarding (8 subtasks)
  2. Invoice Follow-up Chain (Day 0->3->7->14->30 via WhatsApp)
  3. Portfolio Update (quarterly)
  4. Tax Season Prep (monthly)
  5. Proposal Template

  DASHBOARD WIDGET: Hustle Pulse
  (active clients, deliverables, pending invoices, next deadline)

  AI: invoice reminder suggestions, client priority morning ritual

================================================================================
  TASK v2.2.3: Closer Mode - Real Estate/Sales
  Duration: 3 days
================================================================================

  VOCABULARY: Projects->Deals, Tasks->Follow-ups, Priority P1->Hot Lead,
              Archive->Closed

  ADDED FIELDS: lead_name, phone, property_details, deal_stage
                (Lead->Contacted->Site Visit->Negotiation->Docs->Closed),
                commission

  TEMPLATES (5):
  1. New Lead Follow-up Chain (WhatsApp/SMS)
  2. Site Visit Prep (6 subtasks)
  3. Document Collection
  4. Monthly Market Update (Telegram broadcast)
  5. Closing Checklist

  DASHBOARD WIDGET: Closer Pipeline
  (hot leads, site visits, pending follow-ups, revenue)

  AI: follow-up timing, cold lead alerts, morning "leads going cold"

================================================================================
  TASK v2.2.4: Grind Mode - Small Business/Retail
  Duration: 3 days
================================================================================

  VOCABULARY: Projects->Categories, Tasks->To-dos, Tags->Department,
              Calendar->Schedule

  ADDED FIELDS: assigned_to (text), supplier_name, phone,
                cost_budget, recurring presets

  TEMPLATES (6):
  1. Daily Open Checklist (recurring)
  2. Daily Close Checklist (recurring)
  3. Restock Alert
  4. New Staff Onboarding (10 steps)
  5. Monthly Bills Tracker
  6. Customer Follow-up

  DASHBOARD WIDGET: Grind Pulse
  (checklist progress, pending orders, bills due, staff tasks)

  AI: bill reminders, restock prediction, morning "open checklist"

================================================================================
  TASK v2.2.5: FLUTTER - Mode UI
  Duration: 4 days
================================================================================

  SUB-TASKS:
  v2.2.5.1  O1 Mode Selector: grid of 4 (General + 3 industry)
  v2.2.5.2  Dynamic vocabulary swap (UI-layer rename, not data)
  v2.2.5.3  Mode-specific dashboard widget on Home
  v2.2.5.4  Content mix adjustment per mode
  v2.2.5.5  Write tests (15+ tests)

  v2 PHASE 2 SUMMARY:
  Testing: 30+ new | Cumulative: ~671


################################################################################
  v2 PHASE 3: ADVANCED INTELLIGENCE
  Timeline: Weeks 31-34 (4 weeks) | Status: POST-LAUNCH
  Screens: H5 (Weekly Review)
################################################################################

  OVERVIEW:
  ML-powered features: smart scheduling, energy flow engine,
  habit pattern detection, weekly review with AI insights.

================================================================================
  TASK v2.3.1: Smart Scheduling ML
  Duration: 5 days
================================================================================

  ALGORITHMS:

  1. Thompson Sampling for optimal reminder timing:
     - Model each (user, time_slot) as Beta distribution
     - User acts = success: update Beta(a+1, b)
     - User ignores = failure: update Beta(a, b+1)
     - Sample from Beta to pick next delivery slot
     - O(1) per sample, converges to optimal in ~100 observations
     Reference: Chapelle & Li, "An Empirical Evaluation of Thompson
     Sampling," NIPS 2011.

  2. LinUCB contextual bandit for task suggestion:
     - Context features: time_of_day, day_of_week, energy_level,
       tasks_completed_today, current_streak, last_activity_type
     - Arm = each unscheduled task
     - UCB exploration bonus prevents getting stuck
     - O(d^2) per arm where d = context dimension
     Reference: Li et al., "A Contextual-Bandit Approach to
     Personalized News Article Recommendation," WWW 2010.

  3. DQN for multi-step schedule optimization (advanced):
     - State: current schedule + user context
     - Action: place/move task in time slot
     - Reward: completion rate + user satisfaction
     - Double DQN to prevent overestimation
     Reference: Mnih et al., "Human-level control through deep
     reinforcement learning," Nature 2015.

================================================================================
  TASK v2.3.2: Energy Flow Engine
  Duration: 3 days
================================================================================

  ALGORITHMS:

  1. Bayesian Optimization for notification timing:
     - Gaussian Process surrogate model
     - Acquisition function: Expected Improvement
     - Optimize delivery time per user per channel
     - Adapts to user schedule changes automatically
     Reference: Snoek et al., "Practical Bayesian Optimization of
     Machine Learning Algorithms," NIPS 2012.

  2. Energy-task matching:
     - Correlate user energy self-reports with completion rates
     - Suggest high-cognitive tasks during peak hours
     - Suggest routine tasks during low-energy periods
     - Simple linear regression initially, GP later

================================================================================
  TASK v2.3.3: Habit Pattern Detection
  Duration: 3 days
================================================================================

  ALGORITHMS:

  1. Prophet for time series analysis:
     - Daily/weekly/seasonal patterns in task completion
     - Forecast future productivity
     - Holiday and event detection
     Reference: Taylor & Letham, "Forecasting at Scale,"
     PeerJ Preprints, 2017.

  2. LASSO regression for feature importance:
     - Which factors predict task completion?
     - Automatic feature selection via L1 regularization
     Reference: Tibshirani, "Regression Shrinkage and Selection
     via the Lasso," JRSS Series B, 1996.

  3. LSTM for task sequence prediction:
     - Predict next likely task from historical sequences
     - 2-layer LSTM, 64 hidden units, trained on user history
     Reference: Hochreiter & Schmidhuber, "Long Short-Term
     Memory," Neural Computation, 1997.

  4. Isolation Forest for anomaly detection:
     - Detect sudden productivity drops
     - Flag abnormal defer patterns
     - 100 trees, max 256 samples per tree
     Reference: Liu et al., "Isolation Forest," ICDM 2008.

================================================================================
  TASK v2.3.4: FLUTTER - Weekly Review (H5)
  Duration: 3 days
================================================================================

  SCREEN: H5 - Weekly Review (Pro, v2)

  SUB-TASKS:
  v2.3.4.1  Available Sunday evening or manually
  v2.3.4.2  Week stats: tasks completed, rate trend, streak status
  v2.3.4.3  Wins of the week (top 3 accomplishments)
  v2.3.4.4  AI-detected patterns: "60% more productive in mornings"
  v2.3.4.5  Time Debt report: deferred task hours
  v2.3.4.6  Next week planning: AI priority suggestions
  v2.3.4.7  Goal progress check
  v2.3.4.8  Generated by Claude Sonnet with charts
  v2.3.4.9  Write tests (10+ tests)

  v2 PHASE 3 SUMMARY:
  Testing: 25+ new | Cumulative: ~696
  ML models: Thompson Sampling, LinUCB, DQN, Bayesian/GP,
             Prophet, LASSO, LSTM, Isolation Forest
  On-device: LiteRT models (~5MB each, INT8 quantized)


################################################################################
  v2 PHASE 4: ENTERPRISE AND PLATFORM EXPANSION
  Timeline: Weeks 35-38 (4 weeks) | Status: POST-LAUNCH
################################################################################

================================================================================
  TASK v2.4.1: Enterprise SSO and SCIM
  Duration: 5 days
================================================================================

  SUB-TASKS:
  v2.4.1.1  SAML 2.0 SSO via Logto Enterprise connectors
  v2.4.1.2  OIDC SSO for modern IdPs (Okta, Azure AD, Google Workspace)
  v2.4.1.3  SCIM 2.0 provisioning:
            - Auto-create users from IdP
            - Auto-deactivate on IdP removal
            - Group -> Team mapping
  v2.4.1.4  Custom RBAC beyond default roles
  v2.4.1.5  Unlimited audit logs (vs 90 days for Team)
  v2.4.1.6  API access: 10K req/hr (read/write)
  v2.4.1.7  SOC 2 Type II documentation preparation
  v2.4.1.8  Write tests (10+ tests)

================================================================================
  TASK v2.4.2: Full Watch App
  Duration: 3 days
================================================================================

  Adds to v1 basic watch:
  v2.4.2.1  Task creation via voice input (Siri/Assistant)
  v2.4.2.2  Pomodoro timer on watch
  v2.4.2.3  Daily content quote display
  v2.4.2.4  Siri Shortcuts (iOS)
  v2.4.2.5  Google Assistant actions (Wear OS)

================================================================================
  TASK v2.4.3: Desktop/Web PWA
  Duration: 5 days
================================================================================

  SUB-TASKS:
  v2.4.3.1  Progressive Web App with offline service worker
  v2.4.3.2  Responsive layout: sidebar nav, multi-panel
  v2.4.3.3  Keyboard shortcuts for power users
  v2.4.3.4  Drag and drop for calendar and Kanban
  v2.4.3.5  Web push notifications
  v2.4.3.6  Write tests (10+ tests)

================================================================================
  TASK v2.4.4: Advanced Calendar Sync
  Duration: 2 days
================================================================================

  v2.4.4.1  Two-way sync: UNJYNX <-> Google Calendar
  v2.4.4.2  CalDAV for Apple Calendar and Outlook
  v2.4.4.3  Conflict resolution: events vs tasks

  v2 PHASE 4 SUMMARY:
  Testing: 30+ new | Cumulative: ~726


################################################################################
  v2 PHASE 5: INNOVATION
  Timeline: Weeks 39+ | Status: FUTURE
################################################################################

  All features below are experimental and built only if user demand warrants.

================================================================================
  TASK v2.5.1: Voice-First Interface
================================================================================
  - "Hey UNJYNX" wake word (Picovoice Porcupine, on-device)
  - Full voice task management: create, complete, reschedule
  - Multi-turn conversation mode with AI
  - Packages: picovoice_flutter, speech_to_text

================================================================================
  TASK v2.5.2: Location-Based Reminders
================================================================================
  - Geofencing: remind on arrive/leave
  - "Buy milk when near grocery store"
  - Packages: geolocator, flutter_background_geolocation

================================================================================
  TASK v2.5.3: AR Task Visualization (experimental)
================================================================================
  - AR overlay: tasks pinned to physical locations
  - Meeting room context awareness
  - Packages: ar_flutter_plugin (ARCore + ARKit)

================================================================================
  TASK v2.5.4: Wearable Health Integration
================================================================================
  - Apple Health / Google Health Connect
  - Correlate sleep, exercise with productivity
  - Suggest rest when health metrics low
  - Packages: health 10.x

================================================================================
  TASK v2.5.5: RCS (Rich Communication Services)
================================================================================
  - Google RCS Business Messaging
  - Rich cards, carousels, suggested actions
  - Verified sender badge
  - Natural upgrade from SMS

  v2 PHASE 5 SUMMARY:
  Testing: 20+ new | Cumulative: ~746


################################################################################
################################################################################
  PART III - CROSS-CUTTING REFERENCES
################################################################################
################################################################################


================================================================================
  A. COMPLETE REST API ENDPOINT REFERENCE
================================================================================

  See API-DESIGN-GUIDE.doc (2991 lines, 150+ endpoints).

  NAMING CONVENTIONS:
  - URI versioning: /api/v1/
  - Plural nouns: /tasks, /projects, /tags (not /task)
  - Kebab-case for multi-word: /feature-flags, /audit-log
  - Sub-resources: /tasks/:id/subtasks, /projects/:id/sections
  - Actions as verbs: /tasks/:id/complete, /tasks/:id/snooze
  - Cursor pagination: ?cursor=xxx&limit=50
  - Sorting: ?sort=due_at (prefix - for desc: ?sort=-priority)
  - Filtering: ?status=pending&priority=p1,p2
  - Search: ?search=keyword (full-text via tsvector)
  - Response envelope: { data, meta: { cursor, has_more, total } }
  - Errors: RFC 9457 Problem Details
  - Idempotency: Idempotency-Key header for POST/PATCH
  - Conditional: ETag + If-None-Match for GET
  - Rate limits: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

================================================================================
  B. DSA REFERENCE (ALL PHASES)
================================================================================

  DATA STRUCTURE          | WHERE USED                    | COMPLEXITY
  ------------------------+-------------------------------+------------------
  B-tree index            | All DB queries (PK, FK)       | O(log n) lookup
  GIN index               | Full-text search (tsvector)   | O(k) k=terms
  Composite B-tree        | Multi-column WHERE clauses    | O(log n)
  Hash index              | Enum exact-match (status)     | O(1) average
  Trie (pg_trgm)          | Fuzzy search, autocomplete    | O(k) k=query len
  LWW-Register CRDT       | Offline sync field merge      | O(f) f=fields
  Priority Queue (heap)   | Task sorting, job scheduling  | O(log n) insert
  RRULE FSM               | Recurring task generation     | O(1) per occur.
  DAG                     | Subtask dependencies (v2)     | O(V+E) topo sort
  Sliding Window Counter  | Rate limiting (Valkey)        | O(log n)
  Interval Tree           | Calendar conflict detection   | O(log n + k)
  Bloom Filter            | Duplicate content detection   | O(k) k=hash func
  Vose Alias Method       | Weighted random (content)     | O(1) sample
  Cursor Pagination       | API list endpoints            | O(log n) seek
  Token Bucket            | AI rate limiting              | O(1)
  Beta Distribution       | Thompson Sampling scheduling  | O(1) sample
  Feature Vector (16-dim) | LightGBM priority prediction  | O(d) d=features
  Linked List             | Escalation fallback chain     | O(1) next
  2D Array (7x52)         | Activity heatmap              | O(1) per cell

================================================================================
  C. ML/DL ALGORITHM REFERENCE (ALL PHASES)
================================================================================

  See ML-ALGORITHMS-RESEARCH.doc (1267 lines, 12+ references).

  ALGORITHM               | USE CASE                | PHASE | REFERENCE
  ------------------------+-------------------------+-------+------------------
  Weighted Random          | Content rotation (v1)    | P2    | -
  ALS Matrix Factorize     | Content recommendation   | v2P1  | Koren 2009
  LightGBM                | Priority prediction      | v2P1  | Ke NIPS 2017
  Thompson Sampling        | Reminder timing          | v2P3  | Chapelle 2011
  LinUCB                   | Task suggestion          | v2P3  | Li WWW 2010
  DQN                      | Schedule optimization    | v2P3  | Mnih Nature 2015
  Bayesian/GP Optim.       | Notification timing      | v2P3  | Snoek 2012
  Prophet                  | Habit detection          | v2P3  | Taylor 2017
  LASSO Regression         | Feature importance       | v2P3  | Tibshirani 1996
  LSTM                     | Task seq. prediction     | v2P3  | Hochreiter 1997
  Isolation Forest         | Anomaly detection        | v2P3  | Liu ICDM 2008
  DistilBERT/MobileBERT    | NLP task parsing         | v2P3  | Sanh 2019
  Logistic Regression      | AI request routing       | v2P1  | -
  Chrono.js + Claude       | Date/time NLP            | P2    | -

================================================================================
  D. DATABASE SCHEMA REFERENCE
================================================================================

  See BACKEND-ARCHITECTURE-RESEARCH.doc (2959 lines, 30+ tables).
  PostgreSQL 16+ with Drizzle ORM. Full schema with indexes,
  constraints, triggers, migration scripts.

================================================================================
  E. TESTING STRATEGY
================================================================================

  LAYER            | TOOL              | TARGET    | COVERAGE
  -----------------+-------------------+-----------+----------
  Backend Unit     | Vitest            | Services  | 80%+
  Backend Integ.   | Vitest+testcontrs | Routes    | 80%+
  Flutter Unit     | flutter_test      | Widgets   | 80%+
  Flutter Integ.   | integration_test  | Flows     | Critical
  E2E              | Playwright        | Web admin | Critical
  Load             | k6                | API       | 100 conc.
  Security         | OWASP ZAP         | API       | Top 10
  Accessibility    | axe-core          | Web       | WCAG 2.1

  TEST COUNT BY PHASE:
  Phase 1: 206 (COMPLETE)    Phase 2: +135 = 341
  Phase 3: +95 = 436         Phase 4: +155 = 591
  Phase 5: +10 = 601         v2P1: +40 = 641
  v2P2: +30 = 671            v2P3: +25 = 696
  v2P4: +30 = 726            v2P5: +20 = 746

  TDD WORKFLOW (MANDATORY):
  1. Write test first (RED)
  2. Run test - should FAIL
  3. Implement minimal code (GREEN)
  4. Run test - should PASS
  5. Refactor (IMPROVE)
  6. Verify 80%+ coverage

================================================================================
  F. DEVOPS AND CI/CD
================================================================================

  LOCAL DEV:
  Docker Compose (11 services), pnpm workspaces (backend),
  Melos workspaces (Flutter), Hot reload for both

  CI/CD PIPELINE (GitHub Actions):
  On PR: lint + type-check + unit tests + build
  On merge main: full test suite + build artifacts
  On tag: deploy staging -> E2E -> promote production

  FLUTTER CI (Codemagic):
  Build Android APK/AAB, Build iOS IPA (macOS runner),
  Run flutter test, Upload to stores

  OTA UPDATES (Shorebird):
  Patch Dart code without store review, rollback,
  channel-based deployment (stable, beta)

  MONITORING:
  Grafana + Prometheus (metrics), Loki (logs),
  Sentry (errors, crashes), PostHog (analytics, flags)

================================================================================
  G. TOOL AND PACKAGE MATRIX
================================================================================

  BACKEND:
  Hono 4.x, Drizzle ORM 0.36+, drizzle-kit 0.30+,
  Zod + drizzle-zod, jose 5.x (JWT), BullMQ 5.x,
  ioredis 5.x, grammy 1.x, @sendgrid/mail 8.x,
  mjml 4.x, @slack/web-api 7.x, discord.js 14.x,
  @paralleldrive/cuid2, rrule 2.8+, @hono/zod-validator,
  @hono/node-ws, Vitest 2.x, pino 9.x,
  @anthropic-ai/sdk 0.30+ (v2)

  FLUTTER:
  riverpod 3.x, go_router 16.x, drift 2.32+,
  freezed 3.x, json_serializable, get_it + injectable,
  logto_dart_sdk 3.x, flutter_secure_storage 9.x,
  flutter_animate 4.x, rive 0.13+, lottie 3.x,
  flutter_slidable 3.x, shimmer 3.x, speech_to_text 7.x,
  flutter_quill 10.x, table_calendar 3.x, just_audio 0.9.x,
  fl_chart 0.68+, share_plus 10.x, screenshot 3.x,
  file_picker 8.x, rrule 0.2+, cached_network_image 3.x,
  path_provider 2.x, flutter_local_notifications 17.x,
  awesome_notifications 0.9.x, awesome_notifications_fcm 0.9.x,
  qr_flutter 4.x, url_launcher 6.x, purchases_flutter 8.x,
  home_widget 6.x, image_picker 1.x, dynamic_color 1.x,
  csv 6.x, very_good_analysis 7.x, flutter_litert 0.3+ (v2)

  WEB (Admin + Dev Portal):
  React 19, Refine 4.x, Ant Design 5.x, Recharts 2.x, Playwright

  LANDING PAGE:
  Astro 4.x, Tailwind CSS 3.x

  INFRASTRUCTURE:
  PostgreSQL 16+, Valkey 8.x, MinIO, Logto 1.x,
  Mailpit, Ollama, Grafana + Prometheus + Loki,
  Sentry, PostHog, Shorebird, GitHub Actions, Codemagic


################################################################################
  END OF COMPREHENSIVE PHASE PLAN v3.0
  ==========================================
  Total: 10 phases (5 v1 + 5 v2)
  v1 Screens: 66 mobile + 18 web = 84 screens
  v2 Screens: +8 mobile = 92 total screens
  API Endpoints: 150+
  Notification Channels: 8
  Database Tables: 30+
  Tests at v1 Launch: 601+
  Tests at v2 Complete: 746+
  Timeline: v1 Launch Week 22, v2 Complete Week 39+
  ==========================================
  Generated: March 8, 2026
  Source of Truth: app-structure/README.md (2905 lines)
  Companion Docs: API-DESIGN-GUIDE.doc, ML-ALGORITHMS-RESEARCH.doc,
                  BACKEND-ARCHITECTURE-RESEARCH.doc
################################################################################
`;

fs.appendFileSync(path, content);
const lines = fs.readFileSync(path, 'utf8').split('\n').length;
console.log('Phase 5 + v2 + Part III written. Total lines:', lines);
