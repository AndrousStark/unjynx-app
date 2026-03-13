# UNJYNX - Complete Application Map

> **"Break the Satisfactory. Unjynx Your Productivity."**
> A Product by METAminds | Midnight Purple + Gold | Android + iOS
> **Launch market: India-first, global expansion Phase 2+**

---

## Table of Contents

1. [Brand & Design Philosophy](#1-brand--design-philosophy)
2. [User Tiers & Access Matrix](#2-user-tiers--access-matrix)
3. [Global Navigation Architecture](#3-global-navigation-architecture)
4. [Complete Screen Map](#4-complete-screen-map)
   - [A. Pre-Auth Flow](#a-pre-auth-flow)
   - [B. Onboarding Flow](#b-onboarding-flow)
   - [C. Core App (Tab Navigation)](#c-core-app-tab-navigation)
   - [D. Task Management](#d-task-management)
   - [E. Projects & Workspaces](#e-projects--workspaces)
   - [F. Calendar & Scheduling](#f-calendar--scheduling)
   - [G. Ghost Mode](#g-ghost-mode)
   - [H. Daily Content & Rituals](#h-daily-content--rituals)
   - [I. Progress & Insights (+ Game Mode)](#i-progress--insights--game-mode)
   - [J. Social Channels & Notifications](#j-social-channels--notifications)
   - [K. AI Assistant (v2)](#k-ai-assistant-v2--deferred)
   - [L. Profile & Stats](#l-profile--stats)
   - [M. Settings](#m-settings)
   - [N. Team & Collaboration](#n-team--collaboration)
   - [O. Industry Modes (v2)](#o-industry-modes-v2--deferred)
   - [P. Admin Panel (Mobile)](#p-admin-panel-mobile)
   - [Q. Enterprise Admin (Web)](#q-enterprise-admin-web)
   - [R. Super Admin / Developer Portal (Web)](#r-super-admin--developer-portal-web)
5. [Interaction Patterns & Hooks](#5-interaction-patterns--hooks)
6. [Accessibility & Responsiveness](#6-accessibility--responsiveness)
7. [Design System Specification](#7-design-system-specification)
8. [Animation & Motion System](#8-animation--motion-system)
9. [Empty States, Delight Moments & Easter Eggs](#9-empty-states-delight-moments--easter-eggs)
10. [Upgrade Prompts](#10-upgrade-prompts-natural-not-pushy)
11. [Accessibility Innovations](#11-accessibility-innovations)
12. [Component Library Specification](#12-component-library-specification)
- [Offline-First UX Specification](#offline-first-ux-specification)
- [Task Import & Data Migration](#task-import--data-migration)
- [Widget Specification](#widget-specification)
- [Watch App Specification](#watch-app-specification-pro--v1-basic-full-in-v2)

---

## 1. Brand & Design Philosophy

### Name Origin - UNJYNX
- **"Jinx"** = a curse, bad luck, the forgetting curse that plagues everyone
- **"Unjynx"** = to BREAK the curse, spelled with a Y for distinctiveness
- The brand promise: "You forget things. You miss deadlines. You feel overwhelmed. UNJYNX breaks that cycle."
- Tagline: **"Break the Satisfactory. Unjynx Your Productivity."**

### Color System (Dark + Light)

> **Critical insight**: Your midnight purple #1A0533 has ~18.5:1 contrast on off-white.
> In light mode, purple IS your text color and gold IS your highlight. The brand is omnipresent in both modes.
> Gold (#FFD700) on white has only 1.4:1 contrast — it washes out. Light mode uses #B8860B (Dark Goldenrod, 4.8:1) for gold elements.

**Dark Mode (Default)**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Midnight Purple | `#0F0A1A` | App background |
| Surface | Deep Purple | `#1A0533` | Nav bar, app bar, primary surfaces |
| Surface Container | Charcoal Violet | `#1D1B20` | Cards, sheets |
| Accent | Electric Gold | `#FFD700` | CTAs, highlights, progress rings |
| Primary | Soft Violet | `#D0BCFF` | Active states, selected tabs |
| Success | Emerald | `#10B981` | Task complete, streaks, habit ring |
| Warning | Amber | `#F59E0B` | Due soon |
| Error | Rose | `#F43F5E` | Overdue, delete actions |
| Text Primary | Snow White | `#F8FAFC` | Headlines, body text |
| Text Secondary | Lavender Mist | `#A78BFA` | Subtitles, hints |
| Text Tertiary | Muted Gray | `#64748B` | Timestamps, metadata |

**Light Mode (Equally Designed)**

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background | Purple Mist | `#F8F5FF` | App background (warm purple-tinted, NOT generic white) |
| Surface | Soft Lavender | `#F0EAFC` | Nav bar, app bar |
| Surface Container | Light Violet | `#EDE5F7` | Cards, sheets |
| Accent | Rich Gold | `#B8860B` | CTAs, highlights (4.8:1 contrast on light bg) |
| Accent Surface | Gold Wash | `#FFF8E1` | Gold-tinted backgrounds (selected states) |
| Primary | Deep Violet | `#6B21A8` | Active states, selected tabs, primary actions |
| Success | Deep Emerald | `#059669` | Task complete (deeper for contrast) |
| Warning | Deep Amber | `#D97706` | Due soon (deeper for contrast) |
| Error | Deep Rose | `#E11D48` | Overdue, delete |
| Text Primary | Midnight Purple | `#1A0533` | Headlines, body text (18.5:1 contrast!) |
| Text Secondary | Plum | `#6B21A8` | Subtitles, hints |
| Text Tertiary | Slate | `#475569` | Timestamps, metadata (4.8:1 minimum) |

**Why light mode uses `#F8F5FF` not `#FFFFFF`:**
- Pure white is clinical and generic. Every default app uses it.
- `#F8F5FF` has a subtle purple warmth that is distinctly UNJYNX — users won't know why it feels different, but they'll feel it.
- Todoist uses `#FEFDFC` (warm off-white). Notion uses slightly warm gray. Premium apps never use pure white.

### Design Principles
1. **Dark Default, Light Polished** - Dark mode is the default (brand identity). Light mode is equally designed (not an afterthought). Auto-detection respects system preference. Both modes feel premium and distinctly UNJYNX.
2. **Satisfying by Design** - Every completion triggers satisfying micro-animations, haptic feedback, and sound
3. **3-Second Rule** - Any primary action (create task, mark done, check schedule) must be reachable in 3 seconds or fewer from any screen
4. **Progressive Disclosure** - Show only what matters NOW; advanced features reveal contextually
5. **Thumb-Zone Design** - Critical actions live in the bottom 40% of the screen (thumb-reachable)
6. **Living UI** - The interface reflects your productivity state: productive = vibrant with subtle blooms; idle = muted; all done = warm shimmer

---

## 2. User Tiers & Access Matrix

### Pricing Philosophy

> **Why 4 tiers, not 9.**
> Research shows 3 tiers convert +8% better than 2, but 5+ tiers cause choice paralysis (-14.3%).
> Slack, Notion, Todoist all use 3-4 tiers. Admin roles are access levels within tiers, not separate plans.
>
> **Why no Lifetime plan.**
> Lifetime deal users churn faster than subscribers and generate negative LTV after 18 months.
> We may offer a limited launch-only LTD (1,000 units) for initial cash injection, then discontinue.
>
> **Annual pricing**: ~33% discount over monthly. Annual subscribers generate 90% higher LTV ($507 vs $267).
> Always show annual price first (anchoring effect). Monthly option available but not promoted.

### Regional Pricing

> Spotify grew India revenue **92.6%** by pricing at Rs 199/mo (80% below US price).
> YouTube Premium India: $1.54/mo vs $13.99 US (89% discount). Netflix India starts at Rs 149/mo.
> India has the **lowest download-to-trial and trial-to-paid conversion** globally (RevenueCat 2025).
> The lesson: price for adoption, not revenue maximization. A Rs 99/mo user who stays 2 years > a $4.99/mo user who churns in month 2.

| Plan | US / Global (USD) | India (INR) | Europe (EUR, VAT incl.) |
|------|-------------------|-------------|-------------------------|
| **Free** | $0 | Rs 0 | EUR 0 |
| **Pro (annual)** | $4.99/mo ($49.99/yr) | Rs 99/mo (Rs 999/yr) | EUR 4.99/mo (EUR 49.99/yr) |
| **Pro (monthly)** | $6.99/mo | Rs 149/mo | EUR 6.99/mo |
| **Team (annual)** | $6.99/user/mo | Rs 149/user/mo | EUR 6.99/user/mo |
| **Team (monthly)** | $8.99/user/mo | Rs 199/user/mo | EUR 8.99/user/mo |
| **Enterprise** | Custom (contact sales) | Custom | Custom |

**India pricing rationale**: ~80% below US (matches Spotify/YouTube strategy). Rs 99/mo = price of a chai per day. Psychological anchor: "Less than your daily chai."

**Europe pricing rationale**: EUR at parity with USD (Western Europe purchasing power matches US). VAT included in displayed price (EU B2C requirement). GDPR compliance is table stakes, not a price adder.

### Plan: Free (Personal)

The free tier must be generous enough to build a daily habit before asking for money.
Todoist's free tier keeps users for months before they upgrade. Ours should too.

| Feature | What's included |
|---------|-----------------|
| Tasks | Unlimited |
| Projects | 10 |
| Subtasks | 3 levels deep |
| Recurring tasks (RRULE) | Yes |
| Tags & Priorities | Yes |
| Offline mode | Full |
| Push notifications | Yes |
| **Telegram reminders** | Yes (FREE — Telegram API costs us $0) |
| **Email reminders** | Yes |
| Ghost Mode | Yes |
| Smart Suggest | "What should I do next?" (5/mo, Pro: unlimited) |
| Daily content | 1 category |
| Morning / Evening rituals | Basic (mood + preview) |
| Message quotas | Email 5/day, Telegram unlimited (see Channel Quotas) |
| Progress Insights | Rings + streak + 30-day heatmap |
| Custom themes | 2 (Dark default + Light) |
| Widgets | 2 |
| Calendar sync | 1 calendar |

**What Free does NOT get**: WhatsApp/SMS/Instagram/Slack/Discord reminders, calendar view, kanban, time blocking, full analytics, Game Mode, file attachments, location reminders, unlimited templates, watch app. (AI scheduling and Industry Modes are v2 for all tiers.)

**Why this works**: Free users get a genuinely useful TODO app with Telegram + Email reminders. They experience the core value (multi-channel reminders) without the premium channels. Telegram is free for us, so every Telegram reminder is a zero-cost hook that proves the concept.

### Plan: Pro (Personal — Everything Unlocked)

| Feature | What's included |
|---------|-----------------|
| Everything in Free | Plus... |
| **WhatsApp reminders** | Yes |
| **SMS reminders** | Yes |
| **Instagram reminders** | Yes (Friend First approach) |
| **Slack / Discord** | Yes |
| Daily content | All 10 categories |
| Morning / Evening rituals | Full (smart task prioritization, v2: AI suggestions) |
| Smart suggestions | Unlimited (v1: rule-based, v2: full AI) |
| Task decomposition | Yes (v1: template-based, v2: AI-powered) |
| AI auto-scheduling | v2 (deferred — see K2) |
| Industry Modes | v2 (deferred — see Section O) |
| Calendar view | Yes |
| Time blocking | Yes |
| Kanban board | Yes |
| Progress Insights | Full analytics + year heatmap + dashboard |
| Game Mode (opt-in) | Yes |
| Custom themes | Unlimited |
| Widgets | All |
| File attachments | 100MB/task |
| Location reminders | Yes |
| Task templates | Unlimited |
| Calendar sync | Unlimited calendars |
| Watch app | Yes |
| Streak freezes | 1/week |
| Data export | CSV + JSON + ICS |
| Message quotas | WhatsApp 10/day, SMS 5/day, Email 20/day, etc. (see Channel Quotas) |

### Plan: Team (Collaboration)

Minimum 3 seats. Everything in Pro for every member, plus:

| Feature | What's included |
|---------|-----------------|
| Team members | Up to 50 |
| Shared projects | Unlimited |
| Multi-channel team reminders | Yes (remind your team via WhatsApp/Telegram) |
| Roles | Owner, Admin, Member, Guest (guests are free) |
| Admin dashboard | Team analytics, member activity, workload view |
| Audit logs | 90 days |
| Team reports | Weekly digest, completion rates by member |
| Industry modes | v2 (deferred — see Section O) |
| Priority support | Email (48h response) |
| Data export | CSV + JSON |
| API access | Read-only (1,000 req/hr) |

### Plan: Enterprise (v2 — Post Product-Market Fit)

> **Why deferred**: Enterprise sales cycles are 6-18 months. Each deal needs a sales team, legal review,
> security questionnaires, and custom onboarding. Notion didn't add Enterprise until millions of users.
> Todoist still doesn't have SCIM. We need 50K+ users and proven PMF before Enterprise makes sense.
> This plan exists in the roadmap but will NOT be built for v1 launch.

When ready, Enterprise will include: SSO (SAML/OIDC), SCIM provisioning, custom RBAC, unlimited audit logs, compliance packs (GDPR + HIPAA + SOX), full API (read/write, 10K req/hr) + Webhooks, dedicated CSM, on-premise deployment option, 99.99% SLA, SOC 2 Type II report. Pricing: custom (contact sales).

### Channel Message Quotas & Cost Model

> **Why quotas matter**: Every WhatsApp/SMS message costs us real money. Without caps, a single
> power user could cost more in messaging fees than their entire subscription.
>
> **Pricing reality (India, per message)**:
> - Telegram: FREE (Bot API costs $0)
> - Email (SendGrid): ~Rs 0.02/email ($0.0004)
> - WhatsApp utility template: ~Rs 0.13-0.15 ($0.0018)
> - WhatsApp marketing template: ~Rs 0.86-1.09 ($0.012)
> - SMS transactional (MSG91): ~Rs 0.25 ($0.003)
> - SMS transactional (Twilio, international): $0.0075-0.08/msg depending on country
>
> **Key insight**: A Pro user at Rs 99/mo who sends 10 WhatsApp messages/day = Rs 45/mo in WhatsApp costs alone.
> That's 45% of their subscription going to Meta. Quotas protect unit economics.

| Channel | Free | Pro | Team (per member) |
|---------|------|-----|-------------------|
| **Push notifications** | Unlimited | Unlimited | Unlimited |
| **Telegram** | Unlimited (costs us $0) | Unlimited | Unlimited |
| **Email** | 5/day | 20/day | 20/day |
| **WhatsApp** | — | 10/day (utility only) | 15/day (utility only) |
| **SMS** | — | 5/day | 10/day |
| **Instagram DM** | — | 3/day (24h window limit) | 3/day |
| **Slack** | — | 10/day | 20/day |
| **Discord** | — | 10/day | 20/day |
| **Daily digest** | Counts as 1 msg regardless of tasks | Same | Same |
| **Fallback messages** | — | Don't count toward daily cap | Same |

**What counts as a message**:
- 1 task reminder = 1 message
- 1 daily digest (all tasks + content) = 1 message (batching saves quota)
- 1 overdue alert = 1 message (max 3 overdue alerts/day, batched)
- 1 daily content delivery = 1 message
- Streak-at-risk nudge = 1 message (max 1/day)
- Test messages = don't count

**Message Add-on Packs** (for power users who need more):

| Pack | Price (India) | Price (Global) | What you get |
|------|---------------|----------------|--------------|
| WhatsApp +50 | Rs 49/mo | $1.99/mo | +50 WhatsApp messages/day |
| SMS +20 | Rs 29/mo | $1.49/mo | +20 SMS messages/day |
| Unlimited Email | Included in Pro | Included | Already 20/day, sufficient for most |

**Why add-on packs work**: 90% of users will never hit the daily cap. The 10% who do are power users (Hustle/Closer/Grind Mode users sending client follow-ups) who understand the value and will pay Rs 49/mo extra. This keeps base Pro pricing low while monetizing heavy usage.

**Cost transparency**: Users can see their message usage in Settings → Channels → "Usage this month" with a simple bar chart per channel. No surprise bills.

### Internal Roles (Not Pricing Tiers)

> These are access levels for the UNJYNX platform team, not customer-facing plans.
> Users never see these. They exist in the admin/developer tooling only.

**Role hierarchy**: Member < Team Admin < Company Admin < **Super Admin** < **Developer Admin**

| Capability | Company Admin | Super Admin (Founder) | Developer Admin (Dev Team) |
|------------|---------------|----------------------|---------------------------|
| **Scope** | Own organization | Entire UNJYNX platform | Entire platform + infrastructure |
| **Who** | Customer's team admin | You (founder only) | Developers you hire for v1+ |
| User management | Own org users | All orgs, all users | All + system accounts |
| Billing management | Own org | All orgs | View only (not their job) |
| Content moderation | No | Yes (daily content, reports) | No (not their job) |
| Feature flags | No | Yes (toggle features per user/org) | Yes (toggle + create new flags) |
| System health | No | View dashboards | Full control (alerts, scaling) |
| Database access | No | Read-only (analytics queries) | Full (migrations, schema, queries) |
| API key management | Own org keys | All keys (revoke, audit) | Full + rate limit config |
| Deploy / rollback | No | Emergency rollback only | Full CI/CD control |
| Infrastructure | No | No (escalate to dev) | Full (K8s, scaling, networking) |
| Push notifications | Own org (Team plan) | Broadcast to segments | Full control + templates |
| Logs & monitoring | No | Grafana view | Grafana + Loki + Prometheus full |
| Secret management | No | No | Full (env vars, API keys, certs) |
| Code access | No | No | Full repo access |

**Super Admin** = You, the founder. Business decisions, content moderation, user oversight, feature flags. You don't need to deploy code — you escalate to Developer Admins for that.

**Developer Admin** = Your dev team. They ship code, manage infrastructure, fix production issues, run migrations. They don't moderate content or make billing decisions — they escalate to you for that.

**Separation of concerns**: Super Admin owns the *business*. Developer Admin owns the *system*. Neither can fully override the other. This prevents a single compromised account from having total control (security best practice).

---

## 3. Global Navigation Architecture

### Bottom Tab Bar (5 tabs - thumb zone)

```
[Home]    [Projects]    [+]    [Calendar]    [Profile]
  |           |          |         |             |
 Hub      Workspace   Quick     Schedule      You
              |       Create       |
              |     (FAB-style)    |
```

- **Home** - Today's tasks, progress rings, quick actions, daily content
- **Projects** - All projects, shared workspaces, team boards
- **+ (Create)** - Floating action button (center, elevated) - opens quick-create sheet
- **Calendar** - Day/Week/Month views, time blocks, deadlines
- **Profile** - Stats, progress insights, heatmap, settings

### Gesture Navigation
| Gesture | Action |
|---------|--------|
| Swipe right on task | Mark complete (satisfying animation) |
| Swipe left on task | Quick actions menu (snooze, edit, delete) |
| Long press task | Drag to reorder |
| Pull down on Home | Refresh + progress rings pulse |
| Swipe between tabs | Switch bottom nav tabs |
| Double-tap Home tab | Toggle Ghost Mode |

### Contextual Top Bar
- Shows contextually relevant info per screen
- Home: "Good morning, [Name]" + progress rings + streak counter
- Projects: Project name + member avatars
- Calendar: Month/Week selector
- Profile: Display name + plan badge (+ level if Game Mode on)

---

## 4. Complete Screen Map

### A. Pre-Auth Flow

#### A1. Splash Screen
- **What**: UNJYNX logo animation - the "curse-breaking" reveal (purple glow → gold flash → logo solidifies)
- **Duration**: 1.5s (covers app initialization)
- **Behavior**: Check auth state → route to Onboarding (first launch) or Home (returning user)
- **All tiers**: Same experience

#### A2. Login / Sign Up Screen
- **Layout**:
  - Top: UNJYNX logo + tagline
  - Center: Social login buttons (stacked, full-width)
    - Continue with Google
    - Continue with Apple
    - Continue with Email
  - Bottom: "By continuing, you agree to Terms & Privacy Policy" (linked)
- **Behavior**:
  - Social auth via Logto (OIDC)
  - Email auth: shows email input → magic link or password option
  - No forced signup to explore (progressive auth - can browse first)
- **Free**: All auth methods
- **Pro/Team**: Same (v2 Enterprise: + SSO option)

#### A3. Forgot Password Screen
- **What**: Email input → sends reset link
- **Design**: Minimal, single field, gold CTA button
- **All tiers**: Same

---

### B. Onboarding Flow

#### B1. Welcome Carousel (3 slides)
- **Slide 1**: "Break the Forgetting Curse"
  - Animation: Broken chain links transforming into golden tasks
  - Copy: "UNJYNX remembers so you don't have to. Tasks, reminders, motivation — all where you already are."
- **Slide 2**: "Reminders Where You Live"
  - Animation: WhatsApp, Telegram, Instagram, SMS icons orbiting the UNJYNX logo
  - Copy: "Get reminders on WhatsApp, Telegram, Instagram, SMS — wherever you actually pay attention."
- **Slide 3**: "Your Day, Your Way"
  - Animation: Sunrise with Ghost Mode toggle, then confetti burst
  - Copy: "Ghost Mode when overwhelmed. Smart suggestions that pick your next move. Reminders where you actually are. Start now."
- **CTA**: "Let's Unjynx!" → Personalization flow
- **Skip**: Available on all slides (goes to B4 with defaults)
- **All tiers**: Same onboarding experience

#### B2. Personalization Flow (4 steps, progress bar at top)

**Step 1 - Identity** (1 screen)
- "What describes you best?" (single select, visual cards with icons)
  - Student | Professional | Freelancer | Parent | Manager | Executive | Creator | Other
- Selected choice influences default templates, daily content, and UI tone

**Step 2 - Goals** (1 screen)
- "What do you want to unjynx?" (multi-select chips)
  - Stop forgetting tasks | Build better habits | Manage my team | Beat procrastination | Stay focused | Work-life balance | Track deadlines | Get daily motivation
- Selected goals seed initial project templates and feature visibility

**Step 3 - Channel Setup** (1 screen)
- "Where should we remind you?" (toggle each channel)
  - Push notifications (default ON, permission prompt)
  - Telegram (shows "Connect" button → deep link to bot)
  - Email (pre-filled from signup email)
  - WhatsApp (shows "Pro" badge, "Upgrade later" link)
  - Instagram / SMS / Slack (each shows tier badge if locked)
- Free users: Push + Telegram + Email enabled
- Pro users: All channels available

**Step 4 - Daily Content** (1 screen)
- "Pick your daily inspiration" (scrollable grid of 10 curated categories with custom icons)
  - Stoic Wisdom | Ancient Indian Wisdom | Growth Mindset | Dark Humor & Anti-Motivation
  - Anime & Pop Culture | Gratitude & Mindfulness | Warrior Discipline
  - Poetic Wisdom | Productivity Hacks | Comeback Stories
- Each card: Icon + name + tagline + sample quote preview
- Tap to preview 3 sample quotes before selecting
- Auto-suggest for India locale: Ancient Indian Wisdom pre-selected
- Free: Pick 1 category | Pro: All 10 categories
- "Deliver at" time picker (defaults to 7:00 AM)
- "Skip for now" option available

#### B3. First Task Prompt
- "Create your first task — go ahead, say it however you want"
- NLP-powered text input with examples: "Buy milk Monday 9am" / "Call dentist" / "Finish report by Friday"
- Voice input button (microphone icon)
- NLP parses: title, date, time, priority, project (shows parsed result for confirmation)
- On submit: satisfying "curse broken" animation, first progress ring nudges forward
- CTA: "Your journey begins!" → Home

#### B4. Notification Permission (OS dialog)
- Triggered after first task creation
- Custom pre-permission screen: "UNJYNX needs to notify you to break the curse. You control everything in Settings."
- If denied: banner on Home explaining what they're missing, Settings shortcut

---

### C. Core App (Tab Navigation)

#### C1. Home Screen (Tab 1 - "Hub")

The command center. Everything you need right now, in one glance.

**Layout (scrollable, top to bottom):**

1. **Greeting Bar** (top)
   - "Good morning, [Name]!" (time-aware: morning/afternoon/evening)
   - Right: streak counter (subtle flame icon + "14 days" — understated, not screaming)
   - Right: notification bell (badge count for unread)

2. **Progress Rings** (hero card — Apple Watch inspired)
   - Three concentric rings, each filling as you progress today:
     - **Outer ring (Gold)**: Tasks — % of today's tasks completed
     - **Middle ring (Violet)**: Focus — total focused minutes (Pomodoro / Ghost Mode)
     - **Inner ring (Emerald)**: Habits — habits checked off today
   - Center: Completion percentage or encouraging word ("Crushing it" / "Keep going")
   - Rings animate smoothly on each completion (spring physics, satisfying fill)
   - Subtle glow when a ring completes (gold shimmer, not confetti)
   - Tap: Expands to full Progress Dashboard (see I2)
   - **Free**: Rings shown | **Pro**: Full analytics + historical trends

3. **Daily Content Card** (swipeable)
   - Quote of the day from selected category
   - Source attribution (e.g., "— Bhagavad Gita, 2.47")
   - "Save" heart icon, "Share" icon
   - Swipe left: Next random quote from category
   - Tap: Full content view with meaning/context
   - **Free**: 1 category | **Pro**: All 10 categories

4. **Today's Tasks** (main list)
   - Section: "Overdue" (red accent, if any, collapsed by default)
   - Section: "Today" (tasks due today, sorted by time → priority)
   - Section: "No Date" (undated tasks, tucked below)
   - Each task card shows:
     - Checkbox (left, animated on tap)
     - Title (1 line, truncated)
     - Project color dot + name
     - Priority flag (color-coded)
     - Due time (if set)
     - Energy tag (if set: lightning bolt icon colored by level)
     - Subtask progress bar (if has subtasks: "3/5")
     - Recurrence icon (if recurring)
   - Swipe right: Complete with animation
   - Swipe left: Snooze / Edit / Delete
   - Tap: Opens Task Detail (D2)
   - **All tiers**: Same task list functionality

5. **Quick Actions Row** (horizontal scroll)
   - Ghost Mode toggle
   - Start Pomodoro
   - Morning Ritual
   - AI Suggest ("What should I do next?" — uses Smart Task Suggest, not full AI Assistant)
   - **Free**: Ghost Mode, Pomodoro, AI Suggest (5/mo) | **Pro**: All actions, AI Suggest unlimited

6. **Upcoming Preview** (compact)
   - Next 3 tasks (tomorrow + this week) as compact cards
   - "See all" → Calendar tab

7. **AI Insight Card** (bottom, when available — v1: rule-based, v2: full AI)
   - "You've deferred 'Clean garage' 4 times. Break it down?" [Yes] [Remove]
   - "Pattern detected: You're most productive 9-11 AM on Tuesdays"
   - v1: Simple rule-based insights (defer count, completion patterns from local data)
   - v2: Full AI-powered insights (Claude API)
   - **Free**: 5 insights/month | **Pro**: Unlimited

---

### D. Task Management

#### D1. Quick Create Sheet (Bottom Sheet)
- Triggered by center "+" FAB on any screen
- **Layout**:
  - Text field with NLP parsing (placeholder: "Add a task...")
  - Voice input button (microphone, right of text field)
  - Below text field (horizontal icon row):
    - Calendar icon → date/time picker
    - Flag icon → priority selector (P1-P4, color-coded)
    - Folder icon → project selector
    - Tag icon → tag input
    - Repeat icon → recurrence rule builder
    - Paperclip icon → attachment (Pro only)
  - "Add to [Project Name]" button (gold, full-width)
  - After submit: task card drops into list with spring animation
- **Image/Screenshot to Task**: Camera icon parses whiteboard/screenshot to tasks (Pro)
- **Free**: Full quick create (minus attachments)
- **Pro**: + Attachments, NLP auto-date parsing, decomposition suggestion (v1: template-based, v2: AI)

#### D2. Task Detail Screen
- **Layout (full screen, scrollable)**:
  - Top bar: Back arrow | Task title (editable inline) | 3-dot menu
  - Completion button (large, prominent, animated)
  - **Info Section**:
    - Project (tappable → changes project)
    - Due date & time (tappable → date picker)
    - Priority (tappable → cycles through P1-P4)
    - Estimated duration (tappable → minutes picker)
    - Recurrence rule (tappable → RRULE builder)
    - Tags (tappable → add/remove chips)
    - Labels (custom key-value metadata)
    - Reminder settings (channel + time offsets)
  - **Description** (rich text editor - markdown support)
  - **Subtasks Section**:
    - Add subtask (inline text field)
    - Drag to reorder subtasks
    - Progress bar showing completed/total
    - Each subtask: checkbox + title + assignee (team mode)
  - **Activity Log** (collapsible):
    - Created, edited, completed timestamps
    - Who made changes (team mode)
    - Sync status indicator
  - **Attachments** (Pro):
    - Photos, files, voice memos
    - Preview thumbnails
  - **AI Section** (collapsible, Pro):
    - "Break this down" → AI decomposes into subtasks (v1: rule-based templates, v2: Claude AI)
    - "Schedule this" → AI suggests optimal time slot (v2 — deferred)
    - "Similar tasks" → pattern-based suggestions (v1: local history matching)
  - **Bottom Actions**:
    - Duplicate | Move to project | Add to ritual | Delete
  - **Team mode extras**: Assignee picker, comment thread, time tracking

#### D3. Task List View (Full)
- Accessed from: Home "See all" or Project detail
- **Filters** (horizontal chip bar at top):
  - All | Today | Upcoming | Overdue | No Date | Completed
  - Priority filter (P1-P4)
  - Energy filter (Low/Med/High/Peak)
  - Tag filter
  - Assignee filter (team mode)
- **Sort**: Due date | Priority | Created | Alphabetical | Energy
- **View toggle** (top right):
  - List view (default)
  - Kanban board (Pro): columns = status or priority or custom
  - Compact view (minimal info per row)
- **Bulk actions** (long press activates multi-select):
  - Complete all | Move to project | Reschedule | Delete | Set priority
- **Search**: Magnifying glass icon → full-text search with filters

#### D4. Kanban Board (Pro)
- Columns: Configurable (Status: Pending → In Progress → Done | Priority: Urgent → High → Medium → Low | Custom)
- Drag and drop between columns
- Card preview: Title, priority flag, assignee avatar (team), due date
- Tap card → Task Detail (D2)
- Column header: Count + collapse toggle
- Add task button per column (inline)
- **Team**: Swimlanes by assignee, WIP limits per column

#### D5. Recurring Task Builder
- Visual RRULE builder (no technical jargon)
- Presets: Daily | Weekdays | Weekly | Biweekly | Monthly | Yearly
- Custom: "Every [N] [day/week/month/year] on [days] at [time]"
- Advanced: "After completion" mode (N days after last completion)
- Calendar preview showing next 5 occurrences
- End condition: Never | After N occurrences | Until date

#### D6. Task Templates
- Browse templates: Personal, Professional, Industry-specific
- Each template: Name, description, pre-filled fields, subtasks
- User can save any task as template
- **Free**: Use 5 built-in templates | **Pro**: Create unlimited, access all templates
- **Industry Mode templates** (v2 — added when Industry Modes ship):
  - Hustle Mode: Client Onboarding, Invoice Follow-up, Proposal, Tax Prep, Portfolio Update
  - Closer Mode: Lead Follow-up Chain, Site Visit Prep, Document Collection, Closing Checklist
  - Grind Mode: Daily Open/Close, Restock Alert, Staff Onboarding, Monthly Bills, Customer Follow-up

---

### E. Projects & Workspaces

#### E1. Project List Screen (Tab 2)
- **Layout**:
  - Top: "Projects" title + search icon + create button
  - Sections (collapsible):
    - Favorites (starred projects, pinned to top)
    - Active Projects (sorted by last modified)
    - Shared With Me (team projects)
    - Archived (collapsed by default)
  - Each project card:
    - Color dot + icon (user-chosen)
    - Project name
    - Task count (completed/total)
    - Progress bar
    - Member avatars (if shared, max 3 + overflow count)
    - Last activity timestamp
  - Tap → Project Detail (E2)
  - Long press → Quick actions (Archive, Delete, Share, Edit)
- **Free**: Up to 10 projects | **Pro**: Unlimited
- **Team**: Shared workspace section visible

#### E2. Project Detail Screen
- **Top section**:
  - Project name (editable) + color/icon
  - Description (markdown)
  - Member list with roles (team mode)
  - Progress ring (% complete)
- **Task list** (filtered to this project):
  - Same as D3 but scoped to project
  - View toggle: List | Kanban | Timeline (Gantt — Team plan)
- **Sections/Boards** (within project):
  - User-created sections to group tasks
  - Drag tasks between sections
- **Team features** (Team plan):
  - Activity feed (who did what, when)
  - Member management (invite, roles, remove)
  - Project settings (visibility: private/team/public)

#### E3. Create / Edit Project Sheet
- **Fields**:
  - Name (required)
  - Description (optional)
  - Color picker (18 colors + custom hex)
  - Icon picker (200+ Material icons)
  - Default view (List | Kanban | Timeline)
  - Template (optional — v1: built-in templates, v2: industry-specific templates)
  - Visibility (Personal | Team | Public)
  - Due date (optional project deadline)
- **Team**: Add members (email/username search) + assign roles

#### E4. Workspace Screen (Team plan)
- Organization-level container for multiple projects
- **Layout**:
  - Workspace name + company logo
  - Team members (with online status)
  - Projects grid (cards with progress)
  - Recent activity feed
  - Quick stats (total tasks, completion rate, active members)
- **Actions**: Create project, Invite member, Manage roles

---

### F. Calendar & Scheduling

#### F1. Calendar View (Tab 4)
- **View modes** (segmented control at top):
  - Day | 3-Day | Week | Month
- **Day view**:
  - 24h timeline (scrollable)
  - Task blocks placed at scheduled times
  - Color-coded by project
  - Empty slots highlighted for scheduling
  - Tap empty slot → Quick create with time pre-filled
  - Drag task to reschedule
- **Week view**:
  - 7-column grid
  - Tasks as compact chips in time slots
  - Overdue tasks highlighted at top
- **Month view**:
  - Calendar grid with task count dots per day
  - Color intensity by task count (heatmap-style)
  - Tap day → zooms to day view
- **Calendar sync** (connected calendars shown as ghost blocks):
  - Google Calendar
  - Apple Calendar
  - Outlook
  - **Free**: 1 calendar | **Pro**: Unlimited
- **Pro features**:
  - Time blocking mode (drag to create time blocks)
  - AI suggested schedule overlay (v2 — deferred)
  - "Find free time" helper (v1: rule-based gap finder, v2: AI assistant)

#### F2. Time Blocking Screen (Pro)
- Visual drag-and-drop scheduler
- Left panel: Unscheduled tasks (draggable)
- Right panel: Day timeline
- Drag tasks onto timeline → creates time blocks
- Blocks snap to 15-min increments
- Color-coded by project/energy
- Auto-schedule: "Auto-schedule remaining" button (v1: arranges by energy + priority rules, v2: AI-powered)

#### F3. Pomodoro Timer Screen
- Full-screen focus mode
- **Layout**:
  - Large circular timer (25 min work / 5 min break, configurable)
  - Current task displayed below timer
  - Session counter: "Pomodoro 3 of 4"
  - Start / Pause / Reset buttons
  - Ambient sound selector (rain, forest, cafe, lo-fi, silence)
  - Minimizes to floating bubble when navigating away
- **After session**:
  - "How focused were you?" slider (1-5)
  - Auto-log time to task
  - Focus ring fills + satisfying completion feedback (XP shown only if Game Mode on)
- **All tiers**: Available (part of core experience)

---

### G. Ghost Mode

#### G1. Ghost Mode Screen
- Activated: Double-tap Home tab | Quick Actions | Settings toggle
- **Design**: Ultra-minimal, dark, calming purple gradient background
- **Layout**:
  - Shows ONLY your single most important task
  - Large, centered, breathing text animation (slow pulse)
  - "This is all that matters right now."
  - Single large completion button
  - No navigation, no tabs, no badges, no counts, no distractions
  - Small "Exit Ghost Mode" button (top-right, muted)
- **On completion**:
  - Gentle celebration (no confetti - calm shimmer)
  - Next most important task slides in
  - Or: "All caught up" zen screen if none remain
- **All tiers**: Free (this is an anti-overwhelm safety net, never paywalled)

---

### H. Daily Content & Rituals

#### H1. Daily Content Feed
- Accessed: Home card tap | "Content" item in side menu
- **Layout**:
  - Today's content (main card, large):
    - Quote/wisdom text (beautiful typography)
    - Source + author
    - Category badge
    - Actions: Save | Share | Read more
  - Content history (scrollable below)
  - "Explore categories" button → H2
- **Sharing**: Share as beautiful image card to Instagram/WhatsApp/Twitter stories
- **Free**: 1 daily content from 1 category | **Pro**: All 10 categories

#### H2. Content Category Selector

> **Why 10 categories, not 60+.**
> 60 categories means thin content and maintenance nightmares. 10 curated categories means
> deep content libraries (300-2000+ pieces each), high quality, and a clear identity.
> Each category was chosen based on: global appeal, India resonance, shareability,
> daily-open-worthiness, scientific backing, and UNJYNX brand fit.

- Grid of 10 categories with custom icons and brand-matched art:

| # | Category | Tagline | Content Depth | Why It's Here |
|---|----------|---------|---------------|---------------|
| 1 | **Stoic Wisdom** | "Ancient philosophy. Modern edge." | Marcus Aurelius, Seneca, Epictetus (1000+ quotes) | Ryan Holiday sold 5M+ books. Daily Stoic has 3M followers. Stoic app has 4M+ users. "Break the curse" = Stoic adversity philosophy. Dark, serious tone = UNJYNX personality. |
| 2 | **Ancient Indian Wisdom** | "5,000 years of power." | Bhagavad Gita, Vivekananda, Kalam, Chanakya (2000+ quotes) | Nuclear weapon for India market. 80% of 1.4B Indians are Hindu. Sri Mandir app: 40M downloads, 55% 6-month retention. India's #1 forwarded WhatsApp content is spiritual quotes. Not religion-specific — includes Kalam (scientist), Chanakya (strategist). |
| 3 | **Growth Mindset** | "Rewire how you think." | Dweck, Clear, Newport, Goleman, Covey (500+ tips) | 64% report higher productivity with growth mindset. Atomic Habits sold 15M+ copies. Directly tied to app's core purpose. Only category with peer-reviewed links to productivity improvement. |
| 4 | **Dark Humor & Anti-Motivation** | "Laugh at the chaos. Then conquer it." | Original + curated sardonic wisdom (endless) | THE differentiator. No other productivity app does this. 42% of Gen Z use dark humor as coping. Most shared content type among Gen Z. "Your to-do list isn't going to cry itself to sleep. That's your job." |
| 5 | **Anime & Pop Culture** | "Level up. Main character energy." | Naruto, One Piece, Marvel, Star Wars, Stan Lee, Gaming (1000+) | 54% of Gen Z globally like anime (Crunchyroll). India is fastest-growing anime market. Jujutsu Kaisen is literally about curses = perfect UNJYNX fit. Includes Stan Lee's "Excelsior!" |
| 6 | **Gratitude & Mindfulness** | "Anti-jinx your negativity spiral." | Prompts, reflections, micro-meditations (365+) | Most evidence-backed category. Gratitude journaling: +10% happiness, -6.89% depression, -7.76% anxiety (meta-analysis). Framed with UNJYNX voice, not generic zen. |
| 7 | **Warrior Discipline** | "Empires weren't built by the comfortable." | Sun Tzu, Bushido, Chanakya, modern discipline (500+) | Captures hustle energy for ambitious 18-30 year olds. Art of War is perennial bestseller. "Discipline > Motivation" is among the most shared self-improvement content. Warriors break curses. |
| 8 | **Poetic Wisdom** | "Words that haunt and heal." | Rumi, Kabir, Gibran, Hafiz, Ghalib (800+) | Rumi is the best-selling poet in the US. Kabir and Ghalib are deeply embedded in Indian culture. Poetry is one of the most screenshot-shared content types on Instagram stories. Provides emotional range vs the logical/edgy categories. |
| 9 | **Productivity Hacks** | "One technique. Every day. No fluff." | Pomodoro, time blocking, deep work, GTD, 2-min rule (365+) | Table stakes for a productivity app. Without this, UNJYNX is just a quote app. With it, UNJYNX is a quote app that helps you get things done. Each tip = 1 sentence + 1 actionable step. |
| 10 | **Comeback Stories** | "They were worse off than you. Look at them now." | Real people, real failures, real victories (365+) | "What [person] was doing at your age" posts go viral constantly. Every comeback is an "unjynxing." Format: "Age 26: fired, broke. Age 32: built a $1B company. [Name]. What's your curse to break?" |

- Each category card: Custom icon + name + tagline + sample quote preview + toggle
- Tap to preview 3 sample quotes before enabling
- Delivery time configuration (when to show daily content)
- **Free**: 1 category active (picks during onboarding) | **Pro**: All 10 categories
- **Auto-suggest for India**: Ancient Indian Wisdom pre-selected based on locale
- **Share cards**: Every quote gets a pre-designed UNJYNX-branded card (midnight purple + gold), optimized for Instagram Stories (9:16) and WhatsApp forwards

#### H3. Morning Ritual Screen
- Activated: From Quick Actions, scheduled notification, or dedicated section
- **Layout (sequential flow, 5-10 minutes)**:
  1. **Mood Check-in**: "How are you feeling?" (5-point emoji slider: drained → energized)
  2. **Gratitude Prompt**: "Name one thing you're grateful for" (text input, voice input)
  3. **Daily Content**: Today's quote with reflection
  4. **Day Preview**: Today's top 3 tasks with time estimates
  5. **Intention Setting**: "What will make today great?" (free text)
  6. **"Go Break the Curse!"** (motivational send-off with animation)
- Completion: Warm sunrise animation, ritual streak increments (XP added silently if Game Mode on)
- **Free**: Steps 1-4 | **Pro**: Full ritual with smart task prioritization (v1: rule-based, v2: AI suggestions)

#### H4. Evening Review Screen
- Activated: Scheduled notification (default 9 PM) or manually
- **Layout (sequential flow, 3-5 minutes)**:
  1. **Day Recap**: Tasks completed vs planned (visual ring)
  2. **Wins**: Highlight completed tasks with micro-celebrations
  3. **Carry Forward**: Incomplete tasks → reschedule or drop
  4. **Reflection**: "What did you learn today?" (optional text)
  5. **Tomorrow Preview**: Smart tomorrow plan (v1: priority-sorted task list, v2: AI-generated)
  6. **Gratitude Close**: "End on a high note" prompt
- Completion: Calming close animation, streak maintained for the day (XP added silently if Game Mode on)
- **Free**: Basic recap | **Pro**: Smart tomorrow plan + full reflection (v2: AI-enhanced)

#### H5. Weekly Review Screen (Pro — v2)
- Available: Sunday evening notification or manually
- **Layout**:
  - Week stats: Tasks completed, completion rate trend, streak status
  - Wins of the week (top 3 accomplishments)
  - Patterns detected by AI: "You complete 60% more in mornings"
  - Time Debt report: Hours of deferred tasks
  - Next week planning: AI suggests priority tasks
  - Goal progress check

---

### I. Progress & Insights (+ Game Mode)

> **Design philosophy**: Todoist (42M users, light gamification) beat Habitica (4M users, heavy RPG) by 10x.
> The lesson: build an excellent tool first, layer gamification as opt-in personal insights.
> UNJYNX default = **personal productivity intelligence**. Game Mode = opt-in for those who want it.
>
> **The Overjustification Effect** (behavioral science): Adding external rewards (XP, badges) to intrinsically
> motivated activities (completing YOUR tasks) can destroy intrinsic motivation over time. So the default
> experience rewards consistency and self-awareness, not points. Game Mode is the escape hatch for gamers.

#### I1. Progress Hub Screen (Default — All Users)

The default experience. Clean, adult, analytical. Looks like Strava or Apple Fitness, not a video game.
A 35-year-old VP of Engineering should feel comfortable if a colleague sees this on their screen.

- Accessed from: Profile tab → Progress section, or progress rings on Home

**Layout (scrollable):**

1. **Progress Rings** (hero — same as Home, but larger + interactive)
   - Three concentric rings: Tasks (Gold) / Focus (Violet) / Habits (Emerald)
   - Tap any ring to see detail breakdown
   - Weekly comparison: This week vs last week as small sparkline below each ring
   - "Close your rings" language (familiar from Apple Watch)

2. **Streak Counter**
   - Current streak: large number + subtle flame
   - Personal best streak alongside (muted text)
   - Streak freeze: 1 per week (Pro) — "Life happens. Use a freeze to protect your streak."
   - Calendar strip below showing last 14 days (filled = active, empty = missed, blue = freeze used)
   - No shame for breaks — if streak resets, copy says: "Streaks reset. Your progress doesn't. You completed [N] tasks last streak."

3. **Activity Heatmap** (GitHub contribution graph style)
   - 52-week grid showing daily task completion intensity
   - Color: Empty (dark) → Light purple → Deep violet → Gold (high activity)
   - Tap any day: popup shows tasks completed that day
   - This is the single most satisfying visualization for professionals (92% of tech recruiters check GitHub heatmaps first — the pattern works)
   - **Free**: Last 30 days | **Pro**: Full year

4. **Weekly Insights Card** (rotates weekly — variable reward via information, not points)
   - "Your most productive day this week was Wednesday (12 tasks)"
   - "You completed 23% more tasks than last week"
   - "Your average completion time improved by 8 minutes"
   - "3 tasks were deferred more than twice — want to break them down?"
   - New insight every Monday — creates anticipation without slot-machine psychology

5. **Personal Bests** (milestone markers, not badges)
   - Most tasks in a day: 14 (March 3)
   - Longest streak: 30 days
   - Fastest project completion: "Website Redesign" in 6 days
   - Total tasks completed: 847
   - Displayed as a clean stat row, not a trophy case

- **Free tier**: Rings, streak, 30-day heatmap, basic weekly insight
- **Pro tier**: Full heatmap, all insights, personal bests, export data

#### I2. Progress Dashboard (Pro)

Deep analytics for people who love data. Feels like a personal Strava for productivity.

**Layout (scrollable, chart-heavy):**

1. **Completion Trend** — Line chart: daily/weekly/monthly task completion over 30/90/365 days
2. **Productivity by Day** — Bar chart: which days of the week you're most productive
3. **Productivity by Hour** — Heatmap: which hours you get the most done
   - Insight line: "Your peak hours are 9-11 AM and 8-10 PM"
4. **Estimated vs Actual** — Scatter plot: how accurate your time estimates are
   - Helps users calibrate — "You underestimate tasks by an average of 40%"
5. **Completion Rate** — Percentage of tasks completed vs created (weekly trend)
6. **Focus Time** — Total Pomodoro + Ghost Mode minutes (weekly bar chart)
7. **Procrastination Pattern** — Tasks deferred average N times before completion
   - "Your 'Call dentist' pattern: tasks with phone calls get deferred 3.2x more than others"
8. **Category Breakdown** — Donut chart: work vs personal vs health vs learning

- All charts use the UNJYNX color system (purple/gold/emerald)
- Export as PDF or PNG (share your stats without sharing your tasks)

#### I3. Accountability Partners (Pro)

Lightweight, respectful accountability. Not a competition — a partnership.

**Layout:**
- Invite up to 3 partners via link/QR code
- Partner cards: Avatar + name + their current streak (if they've opted to share)
- **Nudge** (1 per day per partner): Send a gentle push notification — "Hey, [Name] is checking in on you"
  - Nudge copy is warm, not aggressive: "Just a friendly poke" / "Your partner believes in you"
- **Shared Goals** (optional): Both partners set the same goal, progress shown side-by-side
- **Weekly Summary**: Auto-sent every Sunday — "[Partner] completed 23 tasks this week. You completed 19."
  - Framed as mutual support, never as competition
- No public leaderboards. No "who wins." Just two people keeping each other honest.

#### I4. Game Mode (Opt-in — Pro Only)

> For users who WANT the full gamification experience. Turned off by default.
> Enabled in Settings → Progress → "Enable Game Mode"
> When enabled, XP/levels/achievements layer on top of the default Progress experience.
> Can be turned off anytime without losing progress (XP is tracked silently, just hidden).

**What Game Mode adds:**

1. **XP System**
   - Task completed: +5 XP
   - Last task of the day (all done): +20 XP
   - Morning ritual complete: +25 XP
   - Ghost Mode session complete: +15 XP
   - Pomodoro complete: +10 XP
   - Streak milestones (7/30/100/365 days): +50/+100/+500/+1000 XP
   - XP bar appears on Profile and Home (only when Game Mode is on)
   - Levels: every 500 XP = 1 level (uncapped)
   - Level titles are understated: "Level 5" not "Level 5: Task Slayer"

2. **Achievements** (revealed progressively — never show a wall of locked badges)
   - Earned badges appear in a minimal grid on Profile
   - 30 achievements total (not 50+ — quality over quantity)
   - Categories: Consistency (streak-based), Volume (task counts), Exploration (features used), Special (easter eggs)
   - Examples: "First Week" (7-day streak) | "Century" (100 tasks) | "Deep Work" (10 Ghost Mode sessions) | "Connected" (3+ channels linked)
   - Each achievement = one-line description of what you actually did, not fantasy language
   - Unlocking an achievement also unlocks a theme or completion sound (tangible reward)

3. **Leaderboards** (all opt-in, never default)
   - **Friends board**: Invite-only, shows weekly XP earned
   - **Team board** (Team plan): Team members, weekly XP
   - No global leaderboard (prevents toxic comparison and fake accounts)
   - Filter: This week | This month
   - Position shown as "5th of 12 friends" not "#5 RANK" — softer language

4. **Challenges** (lightweight, time-boxed)
   - Challenge a friend: "Complete 10 tasks this week" — both participants tracked
   - Auto-resolves at end of week — winner gets a unique badge variant
   - No money stakes (removed — too aggressive for default UX)
   - Maximum 1 active challenge at a time (prevents challenge fatigue)

---

### J. Social Channels & Notifications

#### J1. Channel Hub Screen
- Accessed from: Settings → Notification Channels, or Onboarding
- **Layout**: List of all channels with connection status

**Each channel card**:
| Channel | Status | Actions | Tier |
|---------|--------|---------|------|
| Push Notification | Connected/Not | Configure / Test | Free |
| Telegram | Connected/Not | Connect via bot link / Disconnect / Test | Free |
| Email | Connected/Not | Change address / Verify / Test | Free |
| WhatsApp | Connected/Not | Add phone / Verify / Test | Pro |
| SMS | Connected/Not | Add phone / Verify / Test | Pro |
| Instagram | Connected/Not | Add username / Accept follow / Test | Pro |
| Slack | Connected/Not | OAuth connect / Select channel / Test | Pro |
| Discord | Connected/Not | OAuth connect / Select server+channel / Test | Pro |

**Each channel detail** (tap to expand):
- Connection status + last message sent
- Test message button ("Send me a test reminder")
- Quiet hours toggle (per-channel override)
- Digest mode toggle (batch notifications)
- Fallback order: "If this channel fails, try [next channel]"
- Disconnect button

#### J2. Telegram Connection Flow
1. Tap "Connect Telegram" → shows QR code + deep link
2. Deep link: `t.me/UNJYNXBot?start=[USER_TOKEN]`
3. User opens Telegram, taps "Start"
4. Bot confirms: "Connected! You'll get reminders here."
5. App updates status to "Connected" (real-time via WebSocket)
6. Test message button → sends sample reminder with buttons
7. **Inline keyboard interactions**: [Mark Done] [Snooze 1hr] [View Task]

#### J3. WhatsApp Connection Flow (Pro)
1. Tap "Connect WhatsApp" → phone number input + country code
2. OTP verification (WhatsApp message or SMS)
3. Opt-in consent screen: "UNJYNX will send task reminders and daily content to this number. You can opt out anytime by replying STOP."
4. Confirmation template sent
5. Interactive buttons on reminders: [Mark Done] [Snooze 1hr] [View Task]
6. Daily digest available: All tasks + content in one morning message

#### J4. Instagram Friend First Flow (Pro)
1. Tap "Connect Instagram" → username input
2. App explains: "We'll send a follow request from @UNJYNX. Accept it, then reply START to our DM."
3. Backend follows user from @UNJYNX account
4. Backend sends initial DM: "Hi! Reply START to activate reminders"
5. User replies → 24h messaging window opens
6. Daily content keeps window alive (user reacts/replies daily)
7. If window expires: Push notification "Your Instagram reminders paused. Open Instagram and message @UNJYNX to reconnect."

#### J6. SMS Connection Flow (Pro)

> **Why SMS matters**: SMS is the ONLY channel that works without internet, without apps, on every phone.
> India has 1.2B+ mobile subscribers — not all on smartphones or WhatsApp. SMS is the ultimate fallback
> when WhatsApp is down, Telegram isn't installed, or the user is in a low-connectivity area.
>
> **India compliance**: All SMS in India requires DLT (Distributed Ledger Technology) registration
> under TRAI regulations. Our backend registers as a "Principal Entity" on the DLT platform.
> Every SMS template must be pre-approved before sending. This is handled server-side — the user
> never sees DLT complexity.
>
> **Provider**: MSG91 (India-first, ~Rs 0.15-0.20/SMS transactional) or 2Factor as backup.
> Both are 4-8x cheaper than Twilio ($0.0079/SMS US). For international users: Twilio or Plivo.
>
> **Cost note**: SMS is the most expensive per-message channel after voice. Unlike Telegram (free)
> or WhatsApp (per-template), every SMS costs money. This is why SMS is Pro-only and positioned
> as the reliability fallback, not the primary channel.

1. Tap "Connect SMS" → phone number input with country code auto-detection
2. Verification: OTP sent via SMS (6-digit code, 60s expiry, 3 retries)
3. Consent screen: "UNJYNX will send task reminders via SMS to this number. Standard messaging rates may apply. Reply STOP anytime to opt out."
4. Confirmation SMS sent: "You're connected! Reply HELP for options or STOP to unsubscribe."
5. Test message button → sends sample reminder
6. **SMS interactions** (limited vs rich channels):
   - Reply `DONE` → marks task complete
   - Reply `SNOOZE` → snoozes 1 hour
   - Reply `STOP` → unsubscribes (TCPA/TRAI compliance, mandatory)
   - Reply `HELP` → sends command list
   - No buttons, no rich cards — SMS is text-only by design
7. **Fallback role**: SMS can be set as the last-resort fallback in notification preferences
   - If WhatsApp fails → try Telegram → try Email → try SMS (guaranteed delivery)
   - This fallback chain is configurable per user in J5

**SMS message format** (compact, respectful of 160-char limit):
```
UNJYNX: "Buy groceries" due in 30min.
Reply DONE or SNOOZE.
```

**SMS types we send:**
| Type | When | Example |
|------|------|---------|
| Task reminder | Before due time (offset configurable) | "Task X due in 30min" |
| Overdue alert | After due time (1x only, no spam) | "Task X is overdue" |
| Daily digest | Morning summary (if enabled) | "3 tasks today. Top: Task X" |
| Streak at risk | Evening if no completions (1x/day max) | "1 task left to keep your streak" |
| Channel verification | On connect/reconnect | OTP code |

**Rate limits** (prevent bill shock):
- Max 10 SMS/day per user (configurable down in J5)
- Daily digest counts as 1 SMS regardless of task count
- Overdue alerts: max 3/day (batched if multiple overdue)
- User sees estimated SMS cost in Settings (transparency)

#### J5. Notification Preferences Screen
- **Global Settings**:
  - Primary channel selector (dropdown)
  - Fallback channel selector
  - Quiet hours: Start time + End time (per timezone)
  - Max reminders per day: Slider (1-50, default 20)
  - Digest mode: Off | Hourly | Daily (morning/evening)
  - Advance reminder: 5min | 15min | 30min | 1hr | 1day before due
- **Per-Task Override**: Each task can override channel + timing
- **Team Notifications** (Team plan):
  - Task assigned to me
  - Task completed by teammate
  - Comment on my task
  - Project update
  - Daily team standup summary

#### Future Channels (Post-Launch, Data-Driven)

> Same philosophy as Future Modes (O5) — only build if demand data supports it.

| Channel | Why it's deferred | What would trigger building it |
|---------|-------------------|-------------------------------|
| **RCS (Rich Communication Services)** | Google's RCS Business Messaging now works on Android + iOS 18+. Rich cards, carousels, suggested actions, verified sender — essentially "WhatsApp-quality" over the native messaging app. But: requires carrier agreements, RCS agent registration, and billing categories are still evolving (90-day transition as of March 2026). | If SMS users request richer interactions, or if RCS adoption crosses 60% of our user base's devices. Natural upgrade path from SMS — same phone number, richer experience. |
| **Apple Messages for Business** | Requires approved MSP ($500-2K+/mo middleware). Apple mandates live agent access (bots-only banned). iOS-only (0% Android). Not designed for automated reminders. | Only if Enterprise contracts specifically request it for customer-facing teams on iOS. |
| **Google Chat / Microsoft Teams** | Workplace messaging. Requires workspace admin approval. Competes with Slack/Discord which we already support. | If Team plan adoption shows 20%+ are requesting workplace integrations beyond Slack/Discord. |
| **Line / KakaoTalk** | Regional dominance (Japan/Thailand/Korea). Zero relevance for India/US/EU launch markets. | If we expand to Japan/Korea/SEA and local user demand exceeds 10K. |

---

### K. AI Assistant (v2 — Deferred)

> **Why deferred**: AI features are expensive (Claude API costs), complex (prompt engineering, hallucination prevention),
> and not the core differentiator (multi-channel reminders are). Ship core TODO + channels first, prove PMF,
> then layer AI on top. The "Smart Task Suggest" (5 free/mo) in the Free tier is the only AI touch point in v1.
> Full AI assistant, auto-scheduling, and insights come in v2 when revenue supports API costs.

#### K1. AI Chat Interface (Pro — v2)
- Accessed from: Floating AI button (bottom-right bubble) or "Ask AI" in various screens
- **Layout**: Chat-style interface, conversation bubbles
- **Capabilities** (via text or voice):
  - "What should I focus on right now?" → AI suggests based on priority + energy + calendar
  - "Break down 'Plan wedding'" → Decomposes into 50+ organized subtasks
  - "Schedule my tasks for this week" → AI arranges tasks in optimal time slots
  - "What am I forgetting?" → Pattern analysis: "You usually do X on Tuesdays"
  - "How productive was I this week?" → Weekly report with charts
  - "Draft a pushback email for this deadline" → Task Negotiation AI
  - Natural language task creation: "Remind me to call mom every Sunday at 6pm"
- **Quick actions** (pre-built chips at bottom):
  - Suggest next task | Break this down | Schedule my day | Weekly report
- **AI Personas** (Pro, unlockable):
  - Default (Balanced, helpful)
  - Drill Sergeant (Tough love, no excuses)
  - Therapist (Empathetic, understanding)
  - CEO (Strategic, big-picture)
  - Coach (Encouraging, growth-focused)
- **Free**: 5 AI interactions/month | **Pro**: Unlimited

#### K2. AI Auto-Schedule Screen (Pro — v2)
- Shows current unscheduled tasks
- AI suggests optimal placement in calendar
- **Factors considered**:
  - Task priority and deadline
  - Calendar conflicts (existing events)
  - Duration estimates (learned from history)
  - User's productivity patterns (most productive hours/days)
- Preview: Calendar view with AI-placed tasks (draggable to adjust)
- "Accept all" or adjust individual placements
- Undo: Full schedule can be reverted

#### K3. AI Insights Screen (Pro — v2)
- Weekly auto-generated productivity report
- **Sections**:
  - Summary: "You completed 34 of 41 tasks (83%)"
  - Patterns: "Your most productive day is Wednesday"
  - Suggestions: "Consider scheduling creative tasks before 11 AM"
  - Comparisons: "12% more productive than last week"
  - Predictions: "At current pace, you'll finish Project X by March 20"
  - Warnings: "3 tasks deferred more than 3 times — consider removing or delegating"

---

### L. Profile & Stats

#### L1. Profile Screen (Tab 5)
- **Layout**:
  - **Header**: Avatar (tappable → change photo) + Display name + plan badge
    - If Game Mode enabled: small level indicator next to name (subtle, e.g., "Lv.8")
    - If Game Mode off: no level shown — just name and plan
  - **Stats Row**: Tasks completed | Current streak | Completion rate (%)
  - **Quick Links**:
    - Progress Hub (I1)
    - Progress Dashboard (I2) (Pro)
    - Accountability Partners (I3) (Pro)
    - Game Mode Settings (I4) (Pro, if enabled)
  - **Activity Heatmap**: GitHub-style grid showing daily task completion over past year
  - **Plan Badge**: Current plan (Free / Pro / Team) with "Upgrade" button if not Pro
  - **Connected Channels**: Icons showing connected notification channels
  - **Settings**: Gear icon → Settings screen (M1)
  - **Sign Out** (bottom, muted)

#### L2. Edit Profile Screen
- **Fields**:
  - Display name
  - Avatar (camera + gallery + remove)
  - Email (read-only, linked to auth)
  - Timezone (auto-detected + manual override)
  - Industry mode selector (General | Hustle | Closer | Grind)
  - Bio (optional, for team profiles)
- **Danger zone**:
  - Export my data (JSON/CSV download)
  - Delete my account (confirmation dialog with "type DELETE to confirm")

---

### M. Settings

#### M1. Settings Screen (Main)
- **Sections**:

**Account**
- Profile (→ L2)
- Plan & Billing (→ M2)
- Connected accounts (Google, Apple, Logto)
- Export data
- Delete account

**Appearance**
- Theme: Dark (default) | Light | System
- Color scheme: Midnight Purple (default) | Ocean | Forest | Sunset | Custom (Pro)
- Font size: Small | Medium (default) | Large
- Task density: Comfortable | Compact
- Animations: Full | Reduced | Off
- Haptic feedback: On (default) | Off

**Notifications**
- Notification channels (→ J1)
- Notification preferences (→ J5)
- Quiet hours
- Sounds: Select completion sound (library of 20+)
- Badge count: Show | Hide

**Task Defaults**
- Default project
- Default priority
- Default reminder offset
- Default task view (List | Kanban)
- Start of week: Sunday | Monday | Saturday
- Date format: MM/DD | DD/MM | YYYY-MM-DD
- Time format: 12h | 24h

**Productivity**
- Ghost Mode settings (double-tap to activate, auto-exit timer)
- Pomodoro settings (work/break durations, auto-start next)
- Morning ritual time
- Evening review time
- Daily content delivery time & channel

**AI** (Pro — v1: basic settings, v2: full AI config)
- Smart suggestions: On | Off (v1: rule-based)
- Proactive insights: On | Off (v1: rule-based)
- AI persona selection (v2)
- AI language preference (v2)

**Integrations** (Pro)
- Google Calendar sync
- Apple Calendar sync
- Outlook sync
- Siri Shortcuts
- Shortcuts app (iOS)
- Widgets configuration

**Data & Privacy**
- Offline mode preferences
- Sync settings (Wi-Fi only | Any network)
- Cache management
- Privacy policy
- Terms of service
- Open source licenses

**About**
- App version
- What's new (changelog)
- Rate us (App Store / Play Store)
- Send feedback
- Contact support
- Follow us (social links)

#### M2. Plan & Billing Screen
- Current plan card with features summary
- **Upgrade CTA** (for Free users):
  - Side-by-side comparison: Free vs Pro (show what they're missing)
  - Annual savings highlight: "$49.99/yr saves 40%!" (Rs 999/yr in India, EUR 49.99/yr in EU)
  - Regional pricing auto-detected by App Store / Play Store locale
  - 7-day free trial toggle (no credit card required)
- **For Pro users**: Manage subscription, download invoices, cancel
- **For Team users**: Per-seat billing, add/remove seats, invoices
- **For Enterprise** (v2): Contact sales link, custom pricing

---

### N. Team & Collaboration

#### N1. Team Dashboard (Team plan)
- **Layout**:
  - Team name + member count
  - Active projects with completion status
  - Team completion rate (aggregate progress rings)
  - Team activity feed (recent actions by members)
  - Upcoming deadlines (cross-project view)
  - Workload heatmap: Which members are overloaded?
- **Actions**: Invite member, Create project, View reports

#### N2. Team Member Management (Admin)
- **Member list**:
  - Avatar + Name + Role badge + Status (active/invited/deactivated)
  - Each member: notification channel preference, tasks assigned, completion rate
- **Invite flow**:
  - Email invite | Link invite | QR code
  - Role selection: Owner | Admin | Member | Viewer (Guest)
  - Project access: All | Specific projects
- **Role permissions**:
  | Permission | Owner | Admin | Member | Viewer |
  |------------|-------|-------|--------|--------|
  | Create tasks | Yes | Yes | Yes | No |
  | Assign tasks | Yes | Yes | Own tasks | No |
  | Delete tasks | All | All | Own | No |
  | Manage members | Yes | Yes | No | No |
  | Billing | Yes | No | No | No |
  | Delete project | Yes | No | No | No |
  | View reports | Yes | Yes | Own | Limited |
  | Manage integrations | Yes | Yes | No | No |

#### N3. Shared Project View (Team plan)
- Same as E2 but with team features:
  - Assignee column in task list
  - Filter by assignee
  - Workload balance indicator
  - Comment thread on each task
  - @mention in comments → notification to mentioned user
  - Activity feed sidebar

#### N4. Team Reports (Team)
- **Reports available**:
  - Team productivity over time
  - Individual contribution breakdown
  - Project completion rates
  - Overdue tasks by assignee
  - Time tracking summary
  - Channel usage analytics (which channels team uses most)
  - Export: PDF | CSV | via API

#### N5. Async Standup (Team)
- Auto-generated daily standup from task activity
- **Layout**:
  - Each member's summary:
    - Done yesterday (auto-filled from completed tasks)
    - Planned today (auto-filled from today's tasks)
    - Blockers (manually entered)
  - Due daily at configured time (e.g., 9:30 AM)
  - Delivered to team channel (Slack/Discord/Telegram/WhatsApp/Email)
  - History of past standups

---

### O. Industry Modes (v2 — Deferred)

> **Why deferred to v2**: Each industry mode is a mini-product. Vocabulary swaps, custom templates,
> dashboard widgets, AI behavior changes — each mode is 2-3 weeks of dev time. Ship core TODO + channels
> first. If freelancers, agents, and shopkeepers organically adopt UNJYNX, that's the signal to build modes.
> The spec below is preserved for v2 implementation.

> **Why 3 modes, not 12.**
> Each industry mode is essentially a mini-product. Healthcare needs HIPAA. Legal needs attorney-client privilege.
> Developer mode competes with Jira/Linear. Each adds months of development and compliance cost.
>
> Instead: ship 3 modes that target **underserved, high-growth, low-compliance** markets where UNJYNX's
> multi-channel reminders are the killer feature. Expand based on demand data, not assumptions.
>
> **No TODO app has industry modes.** Monday.com, Asana, ClickUp use industry *templates* (static).
> UNJYNX modes change vocabulary, workflows, AI behavior, and daily content. That's a real differentiator.
>
> **Key insight**: The word "Mode" is unique in this space. Competitors say "templates" or "solutions."
> Modes imply depth and switchability — like "dark mode" or "focus mode." Users already understand the concept.

#### O1. Mode Selector Screen
- Accessed from: Settings → Industry Mode (v2 — hidden in v1 Settings and Onboarding)
- **Available modes**:
  - **General** (default — no industry-specific features)
  - **Hustle Mode** — Freelancers / Solopreneurs (Pro)
  - **Closer Mode** — Real Estate / Sales (Pro)
  - **Grind Mode** — Small Business / Retail (Pro)
- Each mode card shows:
  - Icon + mode name
  - 3-line description of what changes
  - "Preview changes" expandable: shows vocabulary swaps, templates, sample dashboard
- Selecting a mode:
  - Swaps industry-specific vocabulary across the entire app (UI-layer rename, not data change)
  - Adds 5-10 industry task templates to template library
  - Adjusts AI suggestions and WhatsApp/Telegram template messages
  - Seeds 1 starter project with example tasks (optional, user can skip)
  - Changes daily content mix (adds relevant industry content)
  - Adds mode-specific dashboard widget on Home
- Switching modes: Instant, non-destructive. Old templates remain, new ones are added. No data loss.
- **Free**: General mode only | **Pro**: All 3 modes | **Team**: All modes + team-specific templates

#### What Every Mode Contains (Minimum Viable Mode)

Each mode is 6 components — achievable in 2-3 weeks per mode:

| Component | What it does | Example (Hustle Mode) |
|-----------|-------------|--------------------------|
| **Vocabulary swap** | Renames UI labels app-wide | "Projects" → "Clients", "Tasks" → "Deliverables" |
| **Task templates** (5-10) | Pre-built task structures | "Client Onboarding", "Invoice Follow-up", "Portfolio Update" |
| **Workflow statuses** | Custom column/status options | "Pitched → Contracted → In Progress → Delivered → Paid" |
| **WhatsApp/Telegram/SMS templates** | Contextual reminder messages per channel | "Reminder: Invoice #[X] for [Client] is due in 2 days" (SMS: compact 160-char version) |
| **Daily content mix** | Industry-relevant content added | Hustle mindset quotes, pricing psychology tips, client management wisdom |
| **Dashboard widget** | Mode-specific card on Home | "Revenue this month: Rs [X] | Pending invoices: [N]" |

#### O2. Hustle Mode — Freelancers / Solopreneurs (Pro)

> **Why first**: 1.57B freelancers globally. India = 2nd largest market (15M+, 38% surge in FY25).
> ZERO TODO apps have a freelancer mode. 40% of freelancer time lost to admin. WhatsApp is THE client
> communication channel in India. This is a blue ocean — no competition at all.
> The name "Hustle Mode" resonates universally — every freelancer identifies as a hustler.

**Vocabulary swaps:**
| General term | Hustle Mode term |
|--------------|---------------------|
| Projects | Clients |
| Tasks | Deliverables |
| Tags | Skills |
| Due date | Deadline |
| Priority P1 | Urgent / Rush |
| Archive | Completed clients |

**Added task fields:**
- Client name (linked to Client project)
- Rate type: Hourly / Fixed / Retainer
- Amount: Currency + value
- Payment status: Unpaid → Invoiced → Paid
- Invoice number (auto-generated or manual)

**Task templates:**
1. "Client Onboarding" — 8 subtasks (intro call, scope doc, contract, first payment, kickoff, etc.)
2. "Invoice Follow-up Chain" — Auto-reminders: Day 0 (send invoice) → Day 3 (gentle check-in) → Day 7 (follow-up) → Day 14 (firm reminder) → Day 30 (final notice). Each step sent via WhatsApp/Telegram/SMS (user's preferred channel).
3. "Portfolio Update" — Quarterly template: collect screenshots, write case study, update profiles
4. "Tax Season Prep" — Monthly: categorize expenses, save receipts, update income tracker
5. "Proposal Template" — Scope, timeline, deliverables, pricing, terms
6. "Client Check-in" — Weekly: status update, blockers, next steps — sent via WhatsApp

**Dashboard widget (Home screen):**
```
┌─────────────────────────────────────┐
│ Hustle Pulse                        │
│ Active clients: 4                   │
│ Deliverables this week: 7           │
│ Pending invoices: Rs 45,000 (2)     │
│ Next deadline: Logo v2 — Tomorrow   │
└─────────────────────────────────────┘
```

**AI behavior changes:**
- AI suggests: "You haven't invoiced [Client] for last month's work. Create invoice?"
- Morning ritual adds: "Client priorities" step — which client needs attention today?
- Re-engagement: "[Name], [Client]'s deadline is in 3 days. You haven't logged any progress."

**Why this mode wins:**
- Invoice follow-up via WhatsApp alone justifies Pro subscription for Indian hustlers
- No freelancer-specific TODO app exists — Notion/Trello require manual setup
- Rs 99/mo is cheaper than any freelancer invoicing tool (FreshBooks starts at $15/mo)
- The name alone is marketing — "I'm in Hustle Mode" is something people say out loud and share

#### O3. Closer Mode — Real Estate / Sales (Pro)

> **Why**: $4.22B CRM market → $11.89B by 2033. India: 82,000+ real estate companies, highly fragmented.
> Deals are won/lost on follow-up timing — reminders ARE the product. Agents already live on WhatsApp.
> Existing tools (Follow Up Boss, LionDesk) cost $25-300+/user/mo. UNJYNX at Rs 99/mo is 10-50x cheaper.
> "Closer Mode" — because closers close. The name is aspirational and action-oriented.

**Vocabulary swaps:**
| General term | Closer Mode term |
|--------------|-----------------|
| Projects | Deals |
| Tasks | Follow-ups |
| Tags | Property type (Residential, Commercial, Land, Rental) |
| Priority P1 | Hot Lead |
| Priority P4 | Nurture |
| Archive | Closed |

**Added task fields:**
- Lead name + phone (tappable → call or WhatsApp)
- Property details: Location, type, price range
- Deal stage: Lead → Contacted → Site Visit → Negotiation → Docs → Closed
- Commission: Percentage or flat amount
- Site visit date/time

**Task templates:**
1. "New Lead Follow-up" — Auto-chain: Immediate WhatsApp/SMS (intro + property link) → Day 1 (check interest) → Day 3 (site visit invite) → Day 7 (re-engage or close). Sent via user's preferred channel (WhatsApp/Telegram/SMS).
2. "Site Visit Prep" — 6 subtasks: confirm appointment, prepare documents, check property, arrange transport, follow-up after visit, send photos
3. "Document Collection" — Buyer: Aadhaar, PAN, bank statement, address proof. Seller: Title deed, encumbrance cert, tax receipts, NOC
4. "Monthly Market Update" — Send property updates to nurture leads via Telegram broadcast
5. "Closing Checklist" — Registry, stamp duty, possession, key handover, referral ask

**Dashboard widget (Home screen):**
```
┌─────────────────────────────────────┐
│ Closer Pipeline                     │
│ Hot leads: 3  Nurture: 12           │
│ Site visits this week: 2            │
│ Pending follow-ups: 5 (2 overdue!)  │
│ Revenue this month: Rs 1,20,000     │
└─────────────────────────────────────┘
```

**AI behavior changes:**
- AI suggests: "You haven't followed up with [Lead] in 5 days. They visited [Property] — send a check-in?"
- Smart timing: "Best time to call [Lead] based on past response: 6-7 PM"
- Morning ritual adds: "Today's site visits" + "Leads going cold" (no contact in 7+ days)

**Why this mode wins:**
- Follow-up timing literally determines commission — this is a revenue tool, not a productivity tool
- WhatsApp lead follow-up chain alone replaces a Rs 2,000/mo CRM for most Indian agents
- India's real estate market is massive ($1T+) and tech adoption is accelerating fast

#### O4. Grind Mode — Small Business / Retail (Pro)

> **Why**: $1.32B market growing at 20.6% CAGR (highest growth of any segment).
> 80% of Indian small businesses use WhatsApp for communication. 71% use smartphone as primary device.
> 45% cite high tool costs as barrier. NO TODO app targets this segment. Complete blue ocean.
> "Grind Mode" — because running a small business IS the grind. Daily ops, supplier calls, staff management. This name respects the work.

**Vocabulary swaps:**
| General term | Grind Mode term |
|--------------|----------------|
| Projects | Categories (Inventory, Staff, Suppliers, Customers) |
| Tasks | To-dos |
| Tags | Department (Floor, Kitchen, Office, Warehouse) |
| Priority P1 | Urgent — Do Now |
| Subtasks | Steps |
| Calendar | Schedule |

**Added task fields:**
- Assigned to: Staff member name (simple text, no account needed)
- Supplier name + phone (tappable)
- Cost/Budget: Amount field
- Recurring: Pre-set options (Daily open/close, Weekly restock, Monthly rent/bills)

**Task templates:**
1. "Daily Open Checklist" — Recurring: Cash count, lights/AC, display check, staff attendance, POS system check
2. "Daily Close Checklist" — Recurring: Cash reconciliation, lock inventory, clean, tomorrow prep
3. "Restock Alert" — When triggered: Create order list, message supplier via WhatsApp/SMS, confirm delivery date, receive stock, update count
4. "New Staff Onboarding" — 10 steps: ID docs, training schedule, uniform, access setup, first week checklist
5. "Monthly Bills Tracker" — Rent, electricity, internet, insurance, licenses — each with due date and WhatsApp/SMS reminder
6. "Customer Follow-up" — After purchase: Thank-you WhatsApp/SMS → 7 days (satisfaction check) → 30 days (repeat business invite)

**Dashboard widget (Home screen):**
```
┌─────────────────────────────────────┐
│ Grind Pulse                         │
│ Today's checklist: 4/8 done         │
│ Pending orders: 2 suppliers         │
│ Bills due this week: Rs 15,000 (3)  │
│ Staff tasks: 6 assigned, 2 done     │
└─────────────────────────────────────┘
```

**AI behavior changes:**
- AI suggests: "Electricity bill is due in 3 days. Want to set a WhatsApp reminder?"
- Recurring task intelligence: "You restock [item] every 2 weeks. Next order in 3 days."
- Morning ritual adds: "Today's open checklist" + "Staff assignments" overview

**Why this mode wins:**
- Daily open/close checklists alone are a daily-use hook that no competitor offers
- WhatsApp supplier ordering replaces pen-and-paper for millions of Indian shopkeepers
- Rs 99/mo is the price of a single chai. For a tool that tracks bills, staff, and suppliers — it's a no-brainer
- This mode has the highest organic virality — shop owners talk to each other, recommend tools

#### O5. Future Modes (Post-Launch, Data-Driven)

> These modes will only be built if user demand data supports them.
> Each requires additional compliance, integrations, or domain expertise.

| Mode | Why it's deferred | What would trigger building it |
|------|-------------------|-------------------------------|
| **Student Mode** | Low monetization (students don't pay). Better as a free-tier feature (syllabus import, exam countdown) than a mode. | If 30%+ of free users are students AND they upgrade at 5%+ rate |
| **Developer Mode** | Jira (57M users), Linear, GitHub Projects already dominate. We'd be competing with free tools. | If team plan adoption shows 20%+ are dev teams asking for integrations |
| **Healthcare Mode** | HIPAA compliance costs $100K+ initially. Legal liability. | Only if Enterprise contracts specifically request it |
| **Legal Mode** | Attorney-client privilege requirements. Malpractice insurance implications. | Only if Enterprise contracts specifically request it |
| **Education (Teacher)** | Requires student-teacher relationship features, grading, parent comms — essentially a separate product. | If student user base exceeds 100K and teachers organically sign up |
| **Construction/Field** | Requires offline-heavy features, photo documentation, location tracking. | If real estate mode users request it (natural expansion) |

---

### P. Admin Panel (Mobile)

#### P1. Company Admin Dashboard (Team plan Admin)
- **Accessed via**: Profile → Admin Panel (visible only to Owners/Admins)
- **Layout**:
  - Team overview: Active users, total tasks, completion rate
  - Billing summary: Current plan, next billing date, per-seat cost
  - Member management (→ N2)
  - Quick actions: Invite member, export data, view reports
  - Support: Contact UNJYNX support, view documentation

#### P2. Content Management (Super Admin only)
- Not accessible in mobile app
- Redirects to web admin portal (Q1)

---

### Q. Enterprise Admin (Web Dashboard)

Built with React + Refine, hosted on Vercel. Separate from mobile app.

#### Q1. Admin Login
- SSO / Email + MFA
- Role-based landing page

#### Q2. Admin Dashboard Home
- **Widgets**:
  - Total users (graph over time)
  - Active users (DAU/WAU/MAU)
  - Revenue (MRR/ARR)
  - Feature usage heatmap
  - Error rates (Sentry integration)
  - Server health (Grafana embed)
  - Support tickets (pending/resolved)

#### Q3. User Management
- **Searchable user table**: Name, email, plan, signup date, last active, status
- **User detail**: Full profile, activity log, subscription history, notification channels, device info
- **Actions**: Suspend, delete, upgrade/downgrade plan, impersonate (view as user), send notification
- **Bulk actions**: Export, suspend, send notification to segment

#### Q4. Content Management System
- **Daily content CRUD**: Create, edit, delete quotes/tips
- **Category management**: Add/edit categories, set icons, configure rotation
- **Content scheduling**: Queue content for future dates
- **Analytics**: Which content gets most saves/shares, engagement by category
- **Import**: Bulk import from CSV/JSON
- **AI content generation** (v2): Generate new content suggestions (approved by human)

#### Q5. Notification Management
- **Broadcast**: Send push/email/SMS to user segments
- **Template management**: Create/edit notification templates (WhatsApp, Telegram, email)
- **Delivery logs**: Status of all sent notifications
- **Analytics**: Open rates, click rates, opt-out rates by channel
- **Abuse prevention**: Rate limit configuration, spam detection

#### Q6. Feature Flags
- **Flag management**: Create/edit feature flags (name, description, enabled %)
- **Targeting**: By user segment, plan, country, device, custom attributes
- **Gradual rollout**: 1% → 10% → 50% → 100%
- **Kill switch**: Instantly disable any feature
- **Integration**: PostHog feature flags

#### Q7. Analytics Dashboard
- **Cohort analysis**: Retention by signup week/month
- **Funnel analysis**: Onboarding → First task → 7-day retention → Pro upgrade
- **Revenue analytics**: MRR, churn, LTV, ARPU by plan
- **Feature usage**: Most/least used features
- **Channel analytics**: Which notification channels drive most engagement
- **Geographic distribution**: Users by country/region
- **Device analytics**: Android vs iOS, OS versions, screen sizes
- **Export**: All data exportable to CSV/JSON

#### Q8. Support & Moderation
- **Support tickets**: Integrated ticket system (or connect to Zendesk/Intercom)
- **User reports**: Flagged content, abuse reports
- **Knowledge base management**: Help articles, FAQs
- **Canned responses**: Pre-built reply templates for common issues

#### Q9. Billing Administration
- **Subscription overview**: Active subscriptions by plan type
- **Revenue reports**: Monthly/annual, by region, by plan
- **Coupon management**: Create discount codes, track usage
- **Refund processing**: View requests, approve/deny
- **Invoice management**: Auto-generated, downloadable

#### Q10. Compliance & Audit
- **Audit log viewer**: Searchable log of all admin actions
- **Data requests**: GDPR data export/deletion requests queue
- **Consent management**: Track user consent records
- **Compliance reports**: Auto-generated for GDPR, DPDP Act, HIPAA

---

### R. Super Admin / Developer Portal (Web)

For UNJYNX engineering team and METAminds developers only.

#### R1. System Health Dashboard
- **Infrastructure monitoring** (Grafana embed):
  - CPU, memory, disk across all services
  - Request latency (p50, p95, p99)
  - Error rates by service
  - Database connection pool status
  - Cache hit rates (Valkey)
  - Queue depths (BullMQ)
  - WebSocket active connections
- **Alerting**: Configure alert thresholds, notification channels for ops

#### R2. Database Management
- **Schema viewer**: Current schema with relationships
- **Migration history**: Applied migrations timeline
- **Query analyzer**: Slow query log, EXPLAIN analysis
- **Backup management**: Schedule, status, restore points
- **Data browser**: Read-only table browser (with data masking for PII)

#### R3. API Management
- **API documentation**: Auto-generated OpenAPI docs
- **API key management**: Create/revoke keys, set rate limits per key
- **Rate limit configuration**: Global and per-endpoint limits
- **Webhook management**: Register webhook endpoints, delivery logs, retry policy
- **API usage analytics**: Requests per endpoint, response times, error rates

#### R4. Deployment Management
- **Service status**: All services (API, WebSocket, workers, bots) with health
- **Deploy history**: Git SHA, deployer, timestamp, rollback button
- **Feature flag overrides**: Force-enable/disable for testing
- **Environment management**: Dev / Staging / Production config
- **Canary deployments**: Route % of traffic to new version

#### R5. Notification Infrastructure
- **Channel health**: Status of each channel provider (WhatsApp BSP/Gupshup, Telegram Bot API, SMS/MSG91, Email/SendGrid)
- **Template management**: WhatsApp/SMS template approval status
- **Delivery monitoring**: Real-time delivery rates, failures, bounces
- **Cost tracking**: Per-channel spend, projected monthly cost
- **Provider failover**: Configure primary/backup providers per channel

#### R6. AI Model Management
- **Model configuration**: Select models per use case (Haiku/Sonnet/Opus)
- **Prompt management**: Version-controlled prompt templates
- **Cost tracking**: Token usage, cost per user, budget alerts
- **Quality monitoring**: User feedback on AI responses, hallucination detection
- **A/B testing**: Compare prompt versions, model versions

#### R7. Channel Provider Management
- **Telegram bot**: Connection status, message stats, user count
- **WhatsApp BSP** (Gupshup): Account health, quality rating, tier status
- **Instagram**: Follow/DM stats, window management
- **SMS** (MSG91/2Factor): DLT registration status, template approval queue, delivery rates, per-message cost tracking
- **Email** (SendGrid): Domain verification, bounce rates, reputation score
- **Provider logs**: Message history (anonymized), error logs, delivery receipts
- **Automated responses**: Configure/edit reply templates per channel

#### R8. Data Pipeline
- **ETL jobs**: Scheduled data jobs (content rotation, analytics aggregation)
- **Content pipeline**: Content ingestion, moderation queue, publication
- **Backup verification**: Automated backup testing results
- **Data anonymization**: Tools for GDPR-compliant data handling

---

## 5. Interaction Patterns & Hooks

### Completion Feedback System

> Principle: Feedback should feel **satisfying**, not **performative**. Think Stripe checkout success, not mobile game loot drop.
> Every interaction has exactly 3 feedback layers: visual + haptic + optional sound. No XP numbers fly across the screen by default.
> Game Mode XP is shown only when enabled.

**Default Experience (All Users):**

| Trigger | Visual | Sound | Haptic |
|---------|--------|-------|--------|
| Task completed | Checkbox spring animation + ring fills slightly | Soft "ding" (customizable) | Medium impact |
| Last task of day | Rings close with gold shimmer + "All done" text appears | Warm completion tone | Strong tap |
| Streak milestone (7, 30, 100) | Streak counter glows gold briefly, number increments with spring | Gentle chime | Success pattern |
| Morning ritual complete | Sunrise gradient washes across the card | Calm bell | Gentle pulse |
| Ghost Mode exit (tasks done) | Breathing circle contracts to completion, soft shimmer | Zen tone | Soft tap |
| Pomodoro complete | Timer ring fills gold smoothly | Timer bell | Strong tap |

**With Game Mode enabled (adds to the above):**

| Trigger | Additional Visual | Additional Info |
|---------|-------------------|-----------------|
| Task completed | "+5 XP" text fades in below checkbox (subtle, not flying) | XP bar on Profile nudges forward |
| Last task of day | "+20 XP" badge appears, progress rings pulse | If close to level up, "12 XP to Level 8" hint |
| Streak milestone | Achievement badge slides in from bottom (if earned) | One-time unique animation per milestone tier |
| Level up | Level number increments with gold flash on Profile | Toast notification: "Level 8 reached" (no full-screen takeover) |
| Achievement unlocked | Badge appears in toast with one-line description | Unlocked theme/sound mentioned |

**What we deliberately DON'T do:**
- No full-screen confetti on every completion (desensitizes after 3 days)
- No XP numbers flying across the screen by default
- No "COMBO!" or "STREAK BONUS!" language
- No loot boxes, mystery boxes, or randomized rewards
- No sounds that would embarrass you in a meeting

### Retention Hooks

> Guiding principle: hooks that **help** the user vs hooks that **trap** the user.
> We use Nir Eyal's Hook Model (Trigger → Action → Variable Reward → Investment) but only the ethical subset.
> Three reward types: **Tribe** (social), **Hunt** (information/discovery), **Self** (mastery/progress).

1. **Streak Continuity** (Self): Private streak counter with freeze protection (Pro: 1/week). Streaks work — Duolingo has 10M+ users with 1-year+ streaks. But if a streak breaks, the copy is kind: "Your streak reset. Your 847 completed tasks didn't."
2. **Ring Closure** (Self): "Close your rings" creates daily micro-goals. Apple Watch proved this — the visual incompleteness of an open ring is a powerful motivator without any points system.
3. **Daily Content Hook** (Hunt): Morning quote/content creates a daily open habit. The daily WhatsApp/Telegram message keeps channel windows alive AND gives the user a reason to return. Variable reward through content rotation.
4. **Weekly Insight Card** (Hunt): New personal insight every Monday — "You completed 23% more tasks than last week." Creates anticipation for discovery, not points.
5. **Completion Momentum** (Self): After completing a task, surface the next suggested task. Momentum compounds — users often complete 2-3 more tasks than planned when the next one is immediately visible.
6. **Gentle Re-engagement** (Tribe): After 48h inactivity, send ONE message via their preferred channel: "[Name], just checking in. You've got 3 tasks waiting whenever you're ready." No guilt. No "your streak is dying!" language.
7. **Ritual Anchoring** (Self): Morning/evening rituals create temporal anchors — the app becomes part of daily rhythm, not just a tool. Duolingo's "same time every day" push notification is their #1 retention driver.
8. **Future Self Projection** (Self): Shows: "At this pace, you'll finish [Project] by [Date]." (v1: simple date math, v2: AI-powered projection). Creates commitment through visualization, not pressure.
9. **Social Proof** (Tribe, subtle): Small counter on Home: "12,847 tasks completed by UNJYNX users today." You're part of something. Not a leaderboard, just community presence.

**Hooks we deliberately REMOVED:**
- ~~Variable ratio XP multipliers~~ (slot machine psychology — manipulative, creates extrinsic dependency)
- ~~Time Debt visualization~~ (anxiety-inducing, shames users for being behind)
- ~~Progress endowment toward badges~~ (only relevant in Game Mode, not default)
- ~~Loss aversion messaging~~ ("Your streak is at RISK!" — creates stress, not motivation)

### Micro-Interactions

- **Task card hover/press**: Subtle scale (1.02x) + shadow elevation
- **Checkbox tap**: Spring animation (overshoots then settles)
- **Pull to refresh**: Custom UNJYNX logo animation (curse-breaking visual)
- **Empty state**: Animated illustration + encouraging copy ("No tasks? Go enjoy life! Or add one.")
- **Loading states**: Skeleton screens with purple shimmer (never spinners)
- **Error states**: Friendly copy with retry button ("Oops, the curse struck again. Tap to retry.")
- **Swipe actions**: Rubber-band physics, color reveal (green = complete, red = delete)
- **Tab switch**: Shared element transitions between tabs
- **Sheet dismiss**: Drag-down with velocity detection (flick = dismiss, slow = snap back)

---

## 6. Accessibility & Responsiveness

### Accessibility (WCAG 2.1 AA Target)

- **Contrast**: All text meets 4.5:1 ratio (7:1 for small text in dark mode)
- **Touch targets**: Minimum 48x48dp (Material 3 standard)
- **Screen reader**: Full semantics labeling on all interactive elements
- **Dynamic type**: Supports system font scaling (up to 200%)
- **Reduce motion**: Respects system "reduce motion" setting — disables all decorative animations
- **Color blindness**: No information conveyed by color alone (always paired with icon/text)
- **Keyboard/switch**: Full keyboard navigation support
- **Voice control**: All buttons and inputs have voice-accessible labels

### Responsive Layout Tiers

| Screen Width | Layout | Target |
|-------------|--------|--------|
| < 360dp | Compact phone | Budget Android |
| 360-411dp | Standard phone | Most phones |
| 412-599dp | Large phone | Phablets, small foldables |
| 600-839dp | Tablet portrait | iPad Mini, tablets |
| 840dp+ | Tablet landscape / Desktop | iPad Pro, Chromebooks |

**Adaptive behaviors**:
- Phone: Bottom tab bar, single-column, sheets for creation
- Tablet portrait: Bottom tab bar, two-column (list + detail)
- Tablet landscape: Side rail navigation, three-column (nav + list + detail)
- Desktop/Web: Full sidebar navigation, multi-panel layout

---

## Offline-First UX Specification

> **Core principle**: UNJYNX works without internet. Period. All task creation, editing, completion,
> and viewing happens locally first. Network is secondary and asynchronous. Users in the Delhi Metro,
> rural India, or airplane mode get the full TODO experience. Sync happens silently when connectivity returns.
>
> **Architecture**: Drift (SQLite) local database → field-level LWW conflict resolution → background sync via service_sync package.

### What Works Offline (100% functionality)

| Feature | Offline Behavior |
|---------|-----------------|
| Create/edit/delete tasks | Saved to local DB immediately. Queued for sync. |
| Complete tasks | Checkbox animation, ring update, streak count — all local. |
| View all tasks, projects, calendar | Reads from local DB. Identical to online experience. |
| Ghost Mode | Fully local. No network dependency at all. |
| Pomodoro timer | Fully local. Time logged to local DB. |
| Morning/Evening rituals | Steps 1-4 work (mood, gratitude, day preview, intention). Daily content shows cached last-fetched quote. |
| Search & filter | Full-text search on local DB. |
| Recurring tasks | RRULE engine runs locally. Next occurrence generated on device. |
| Reorder / drag & drop | Local state only. |
| Progress rings & streak | Calculated from local task data. |
| Dark/Light mode, settings | All local preferences. |

### What Works Offline with Limitations

| Feature | Offline Behavior | What's Missing |
|---------|-----------------|----------------|
| Daily content | Shows last cached quote. "Swipe for next" pulls from local cache (last 30 fetched). | No new content until online. Shows "Cached" badge. |
| Notifications | Push notifications don't send (requires network). | Local scheduled notifications still fire via OS. |
| Channel reminders (WhatsApp/SMS/Telegram) | Queued. Sent when back online. | User sees "Queued — will send when online" status per reminder. |
| Calendar sync | Shows last synced calendar data. New events don't appear. | "Last synced: 2 hours ago" indicator. |
| AI features (v2) | Disabled. Shows "AI requires internet" message. | — |
| Heatmap / analytics | Shows data up to last sync point. | "Data as of [timestamp]" label. |

### What Does NOT Work Offline

| Feature | Why |
|---------|-----|
| Login / Sign up | Auth requires network (Logto OIDC). |
| Connect new channels | OAuth/OTP requires network. |
| Team collaboration (comments, assignments) | Real-time sync needed. |
| Share content to social media | Requires platform APIs. |
| Import tasks from Todoist/TickTick | Requires API calls. |

### Offline UI Indicators

**Connection banner** (non-intrusive, top of screen):
- **Online**: No banner shown (clean UI by default)
- **Offline**: Subtle gray banner: "Offline — your tasks are safe locally" with cloud-slash icon. Slides down once, persists until reconnect. Not blocking, not alarming.
- **Syncing**: Animated purple cloud icon in top bar (replaces bell briefly). "Syncing..." text for 1-2s, then gone.
- **Sync complete**: Brief green checkmark flash in top bar (200ms). No toast, no popup.
- **Sync conflict**: Yellow dot on affected task card. Tap to see: "This task was edited on another device. We kept the latest version of each field." Details expandable.
- **Sync failed**: Red dot on bell icon. Notification center shows: "Sync failed. Will retry automatically." Retry button available.

**Queued actions indicator**:
- Small badge on sync icon: "3" (number of pending actions)
- Tap → shows queue: "Create task 'Buy milk' — queued", "Complete task 'Call dentist' — queued"
- All queued actions process in order when online

**Stale data indicator**:
- If offline for >24 hours, calendar view shows: "Last synced: Yesterday at 4:30 PM"
- If offline for >7 days, banner changes to: "You've been offline for a while. Some data may be outdated. Connect to sync."

---

## Task Import & Data Migration

> **Why this matters**: Nobody re-enters 200 tasks manually. Import from competitors is table stakes
> for user acquisition. Todoist, TickTick, Apple Reminders, and Google Tasks all support CSV export.
> If import is hard, users won't switch — no matter how good UNJYNX is.

### Import Sources (v1)

| Source | Method | What's Imported |
|--------|--------|-----------------|
| **Todoist** | CSV upload (Todoist export format) | Tasks, projects, priorities, due dates, recurring rules, labels, completed tasks |
| **TickTick** | CSV upload (TickTick backup format) | Tasks, lists, priorities, due dates, tags, subtasks |
| **Apple Reminders** | Via iCloud CalDAV (with user auth) | Reminders, lists, due dates, priority, notes |
| **Google Tasks** | Via Google API (OAuth) | Tasks, lists, due dates, notes, completed tasks |
| **CSV (generic)** | Manual CSV upload with column mapping | User maps columns: title, due date, project, priority, notes |

### Import Flow

1. Settings → Data → "Import tasks" → Select source
2. **For CSV sources** (Todoist, TickTick, generic):
   - "Export your tasks from [App] as CSV" — link to help article with screenshots
   - Upload CSV file (max 10MB, max 5,000 tasks per import)
   - Preview screen: Shows first 10 tasks parsed, column mapping confirmation
   - "Import [N] tasks into [Project]" button → progress bar
   - Completion: "[N] tasks imported! [M] skipped (duplicates)." with details expandable
3. **For API sources** (Apple Reminders, Google Tasks):
   - OAuth login to source account
   - Select which lists/projects to import (checkboxes)
   - Preview → confirm → import
4. **Duplicate detection**: Match by title + due date. If duplicate found: "Skip" (default) | "Import anyway" | "Replace existing"
5. **Post-import**: Banner on Home: "Welcome from [App]! Your [N] tasks are ready."

### Export Formats (Data Portability — GDPR Article 20)

| Format | What's Included | Who Uses It |
|--------|-----------------|-------------|
| **CSV** | All tasks with all fields (title, project, due date, priority, tags, status, created, completed, recurrence rule, notes) | Users switching to another app, spreadsheet users |
| **JSON** | Full structured data (tasks, projects, settings, activity log, sync metadata) | Developers, API integrations, full backup |
| **ICS** | Calendar events for all tasks with due dates (RFC 5545) | Import into Google Calendar, Apple Calendar, Outlook |

- Export: Settings → Data → "Export my data" → Select format → Download
- GDPR data request: Settings → Data → "Request all my data" → Delivered via email within 72 hours (JSON)
- Account deletion: Settings → Data → "Delete my account" → Type DELETE → All data removed within 30 days (GDPR Article 17)

---

## Widget Specification

> **Implementation**: Flutter doesn't render widgets natively. Use `home_widget` package for data bridge,
> SwiftUI (iOS) and Jetpack Compose (Android) for actual widget rendering. Two color sets per widget
> (dark + light mode, respecting system theme independently of app theme).

### Home Screen Widgets

**W1. Today's Tasks Widget**
- **Sizes**: Small (2x2), Medium (4x2), Large (4x4)
- **Small (2x2)**:
  - Shows: Task count "3 left today" + progress ring (compact, single outer ring)
  - Tap: Opens UNJYNX Home screen
- **Medium (4x2)**:
  - Shows: Next 3 tasks (title + time, truncated), progress ring (compact)
  - Tap task: Opens Task Detail
  - Checkbox: Complete task directly from widget (haptic feedback)
- **Large (4x4)**:
  - Shows: Progress rings (3 concentric), next 5 tasks with checkboxes, daily content quote (1 line)
  - Full interaction: Complete tasks, tap quote to expand, tap rings to open Progress Hub
- **Update frequency**: Every 15 minutes + on task change via `home_widget` callback
- **Free**: Small + Medium | **Pro**: All sizes

**W2. Quick Add Widget**
- **Size**: Small (2x1)
- **Shows**: UNJYNX logo + "Add task" text
- **Tap**: Opens Quick Create Sheet directly (deep link)
- **All tiers**: Free

**W3. Progress Rings Widget**
- **Size**: Small (2x2)
- **Shows**: Three concentric rings only (Tasks/Focus/Habits) with center percentage
- **Tap**: Opens Progress Hub
- **Free**: Available

**W4. Daily Content Widget**
- **Size**: Medium (4x2)
- **Shows**: Today's quote (2 lines max) + author + category badge
- **Tap**: Opens Daily Content Feed
- **Pro only**

**W5. Streak Widget**
- **Size**: Small (1x1) — Android only (iOS doesn't support 1x1)
- **Shows**: Streak number + flame icon
- **Tap**: Opens Progress Hub
- **Free**: Available

### iOS Lock Screen Widgets (iOS 16+)

| Widget | Size | What it Shows |
|--------|------|---------------|
| Tasks remaining | Circular | Number in ring: "5" |
| Streak counter | Circular | Flame icon + number |
| Next task | Rectangular | Task title + due time |
| Progress rings | Circular | Mini ring graphic (gold/violet/emerald) |

- All lock screen widgets are read-only (no interaction, iOS limitation)
- Update via WidgetKit timeline: every 15 minutes + on app foreground
- **Free**: Tasks remaining + streak | **Pro**: All lock screen widgets

### Widget Theming
- Widgets respect **system theme** (not app theme) — user may have dark app but light widget area
- Dark widget: Midnight purple bg (#0F0A1A), snow white text, gold accents
- Light widget: Purple mist bg (#F8F5FF), midnight purple text, rich gold accents (#B8860B)
- Widget border radius: 16dp (matches iOS/Android system widget style)

---

## Watch App Specification (Pro — v1 Basic, Full in v2)

> **Implementation**: watchOS via native SwiftUI (Flutter doesn't support watchOS UI directly).
> Wear OS via Jetpack Compose for Wear. Data shared via Watch Connectivity (iOS) and Data Layer API (Android).
> v1 ships basic task viewing and completion. v2 adds complications, voice input, and Pomodoro.

### Apple Watch App (watchOS 10+)

**Screens:**

1. **Task List** (main screen)
   - Shows today's tasks (title + due time + priority color dot)
   - Max 10 tasks shown (scrollable via Digital Crown)
   - Tap task → Task Detail (simplified)
   - Swipe right on task → Complete (haptic confirmation)

2. **Task Detail** (simplified)
   - Title (full, multi-line)
   - Due date + time
   - Priority flag
   - Project name
   - "Done" button (large, green, centered)
   - No editing — view and complete only

3. **Progress Rings** (glanceable)
   - Three concentric rings matching phone app
   - Center: percentage or "Close your rings"
   - Tap: no action (display only on watch)

4. **Streak Counter**
   - Current streak number + flame
   - "Keep going" or "Streak maintained!" message

**Complications** (watch face widgets):
| Complication | Size | What it Shows |
|-------------|------|---------------|
| Tasks left today | Circular Small | Number: "5" |
| Streak | Circular Small | Flame + number |
| Next task | Modular Large | Title + due time |
| Progress rings | Graphic Corner | Mini ring graphic |

**Interactions:**
- Complete tasks via swipe or button
- Haptic feedback on completion (same pattern as phone)
- No task creation on watch (too complex for small screen — create on phone)
- Sync: Via Watch Connectivity framework, near-instant sync with paired iPhone

### Wear OS App (Wear OS 4+)

**Screens**: Same 4 screens as watchOS (Task List, Task Detail, Progress Rings, Streak)

**Tiles** (Wear OS equivalent of complications):
- Today's tasks tile: Shows next 3 tasks with completion buttons
- Progress rings tile: Three rings with percentages

**Interactions**: Same as watchOS (view + complete, no creation)

**Sync**: Via Wearable Data Layer API, syncs with paired Android phone

### Watch App Tier Access
- **Free**: Not available (watch app is Pro incentive)
- **Pro**: Full watch app (both platforms)
- **Team**: Full watch app for all members

---

## Screen Count Summary

| Section | v1 Screens | Key Flows | Notes |
|---------|-----------|-----------|-------|
| Pre-Auth | 3 | Splash, Login, Forgot Password | |
| Onboarding | 5 | Carousel, 4-step personalization, First task | Includes import option |
| Home / Hub | 1 | Command center with cards | Rule-based insights (v2: AI) |
| Task Management | 6 | Create, Detail, List, Kanban, Recurring, Templates | |
| Projects | 4 | List, Detail, Create/Edit, Workspace | |
| Calendar | 3 | Calendar view, Time blocking, Pomodoro | |
| Ghost Mode | 1 | Ghost Mode (ultra-minimal focus) | |
| Daily Content & Rituals | 4 | Content feed, Categories, Morning, Evening | Weekly Review → v2 |
| Progress & Insights | 4 | Progress Hub, Dashboard (Pro), Accountability (Pro), Game Mode (Pro) | |
| Channels & Notifications | 6 | Hub, Telegram, WhatsApp, Instagram, SMS, Preferences | |
| AI Assistant | 0 (v2) | Chat, Auto-schedule, Insights — all deferred | v2: 3 screens |
| Profile | 2 | Profile, Edit profile | |
| Settings | 2 | Main settings, Plan & billing | Message quota visible |
| Team & Collaboration | 5 | Dashboard, Members, Shared project, Reports, Standup | |
| Industry Modes | 0 (v2) | Mode selector, Hustle, Closer, Grind — all deferred | v2: 4 screens |
| Admin (Mobile) | 2 | Company admin, redirect to web | |
| Enterprise Admin (Web) | 10 | Full admin portal | |
| Developer Portal (Web) | 8 | System health, DB, API, Deploy, Notifications, AI, Channels, Data | |
| **v1 Total** | **~66 screens** | | **v2 adds ~8 more** |

---

## Navigation Flow Diagram

```
App Launch
  ├── First Launch → [Splash] → [Onboarding Carousel] → [Personalization] → [First Task] → [Home]
  ├── Returning User → [Splash] → [Home]
  └── Logged Out → [Splash] → [Login] → [Home]

Home (Tab 1)
  ├── Progress Rings → [Progress Dashboard]
  ├── Daily Content Card → [Content Feed] → [Category Selector]
  ├── Task Card → [Task Detail] → [Edit] / [Subtasks] / [Decompose]
  ├── Quick Actions → [Ghost Mode] / [Pomodoro] / [Morning Ritual] / [Smart Suggest]
  ├── Insight Card → rule-based tips (v2: [AI Chat])
  └── Notification Bell → [Notification Center]

Projects (Tab 2)
  ├── Project Card → [Project Detail] → [Task List] / [Kanban] / [Timeline]
  ├── Create Button → [Create Project Sheet]
  ├── Shared Section → [Workspace] → [Team Dashboard]
  └── Search → [Project Search Results]

+ (Center FAB)
  └── [Quick Create Sheet] → Task created → returns to previous screen

Calendar (Tab 4)
  ├── Day/Week/Month views (in-screen toggle)
  ├── Tap event → [Task Detail]
  ├── Time Block mode → [Time Blocking] → drag tasks
  └── Pomodoro button → [Pomodoro Timer]

Profile (Tab 5)
  ├── Stats → [Progress Hub] → [Heatmap] / [Personal Bests]
  ├── Insights → [Progress Dashboard]
  ├── Partners → [Accountability Partners]
  ├── Game Mode → [Game Mode Settings] → [Achievements] / [Leaderboards]
  ├── Edit → [Edit Profile]
  ├── Settings → [Settings Main]
  │   ├── Notifications → [Channel Hub] → [Telegram/WhatsApp/Instagram/SMS setup]
  │   ├── Appearance → theme/font/density
  │   ├── Plan → [Plan & Billing] → [Upgrade] / [Manage]
  │   ├── Smart Suggestions → on/off (v2: AI persona/full config)
  │   ├── Integrations → calendar sync, shortcuts
  │   └── Industry → v2 (hidden in v1)
  └── Admin (if admin) → [Admin Panel] / [Web Admin redirect]
```

---

## 7. Design System Specification

### Typography System

**Primary Pairing: Outfit (Headings) + DM Sans (Body)**

Chosen for: bold startup energy, modern geometric character, high readability on dark backgrounds, excellent variable weight support.

| Role | Font | Weight | Size (Mobile) | Line Height | Letter Spacing |
|------|------|--------|---------------|-------------|----------------|
| Display Large | Outfit | 700 | 36sp | 1.15 | -0.5px |
| Display Medium | Outfit | 600 | 28sp | 1.2 | -0.25px |
| Headline Large | Outfit | 600 | 24sp | 1.25 | 0px |
| Headline Medium | Outfit | 500 | 20sp | 1.3 | 0px |
| Title Large | DM Sans | 600 | 18sp | 1.35 | 0.15px |
| Title Medium | DM Sans | 500 | 16sp | 1.4 | 0.15px |
| Body Large | DM Sans | 400 | 16sp | 1.6 | 0.25px |
| Body Medium | DM Sans | 400 | 14sp | 1.5 | 0.25px |
| Body Small | DM Sans | 400 | 12sp | 1.45 | 0.4px |
| Label Large | DM Sans | 500 | 14sp | 1.4 | 0.1px |
| Label Small | DM Sans | 500 | 11sp | 1.35 | 0.5px |

**Secondary Display Font: Bebas Neue** — Used ONLY for streak counters, progress ring percentages, stat numbers on Progress Hub, and level badges (Game Mode). All-caps, high-impact. Sparingly applied — used for 2-3 key numbers per screen, never for body content.

**Tertiary Content Font: Playfair Display** — Used ONLY for daily content quotes (Stoic Wisdom, Ancient Indian Wisdom, Poetic Wisdom, Comeback Stories). Serif elegance creates contrast with the geometric UI, signaling "this is wisdom, not interface." Not used for Productivity Hacks or Dark Humor (those use DM Sans to feel actionable/casual).

**Flutter Implementation:**
```dart
// In unjynx_theme.dart

// === BRAND CONSTANTS ===
class UnjynxColors {
  // Dark mode brand tokens
  static const brandMidnight = Color(0xFF0F0A1A);
  static const brandDeepPurple = Color(0xFF1A0533);
  static const brandViolet = Color(0xFF6B21A8);
  static const brandElectricGold = Color(0xFFFFD700);
  static const brandGoldMuted = Color(0xFFB8960C);

  // Light mode brand tokens
  static const brandPurpleMist = Color(0xFFF8F5FF);
  static const brandSoftLavender = Color(0xFFF0EAFC);
  static const brandLightViolet = Color(0xFFEDE5F7);
  static const brandRichGold = Color(0xFFB8860B);
  static const brandGoldWash = Color(0xFFFFF8E1);
  static const brandGoldMutedLight = Color(0xFF996F00);

  // Shared semantic (deepened for light mode)
  static const emerald = Color(0xFF10B981);
  static const deepEmerald = Color(0xFF059669);
  static const amber = Color(0xFFF59E0B);
  static const deepAmber = Color(0xFFD97706);
  static const rose = Color(0xFFF43F5E);
  static const deepRose = Color(0xFFE11D48);
}

// === DARK THEME ===
ThemeData get darkTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: ColorScheme.fromSeed(
    seedColor: UnjynxColors.brandViolet,
    brightness: Brightness.dark,
  ).copyWith(
    surface: UnjynxColors.brandMidnight,
  ),
  scaffoldBackgroundColor: UnjynxColors.brandMidnight,
  textTheme: GoogleFonts.dmSansTextTheme(ThemeData.dark().textTheme).copyWith(
    displayLarge: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.w700),
    displayMedium: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w600),
    headlineLarge: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w600),
    headlineMedium: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w500),
  ),
);

// === LIGHT THEME ===
ThemeData get lightTheme => ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme.fromSeed(
    seedColor: UnjynxColors.brandViolet,
    brightness: Brightness.light,
  ).copyWith(
    surface: UnjynxColors.brandPurpleMist,
    surfaceContainerLowest: Colors.white,
    surfaceContainerLow: UnjynxColors.brandLightViolet,
    surfaceContainer: UnjynxColors.brandSoftLavender,
    primary: UnjynxColors.brandViolet,
  ),
  scaffoldBackgroundColor: UnjynxColors.brandPurpleMist,
  textTheme: GoogleFonts.dmSansTextTheme(ThemeData.light().textTheme).copyWith(
    displayLarge: GoogleFonts.outfit(
      fontSize: 36, fontWeight: FontWeight.w700,
      color: UnjynxColors.brandDeepPurple, // midnight purple as text
    ),
    displayMedium: GoogleFonts.outfit(
      fontSize: 28, fontWeight: FontWeight.w600,
      color: UnjynxColors.brandDeepPurple,
    ),
    headlineLarge: GoogleFonts.outfit(
      fontSize: 24, fontWeight: FontWeight.w600,
      color: UnjynxColors.brandDeepPurple,
    ),
    headlineMedium: GoogleFonts.outfit(
      fontSize: 20, fontWeight: FontWeight.w500,
      color: UnjynxColors.brandDeepPurple,
    ),
  ),
  cardTheme: CardTheme(
    color: Colors.white,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(color: UnjynxColors.brandViolet.withValues(alpha: 0.08)),
    ),
    shadowColor: UnjynxColors.brandDeepPurple.withValues(alpha: 0.08),
  ),
  dividerTheme: DividerThemeData(
    color: UnjynxColors.brandDeepPurple.withValues(alpha: 0.06),
  ),
);

// === THEME SELECTION ===
// In MaterialApp:
// themeMode: ThemeMode.system, // respects OS preference, dark is default brand
// theme: lightTheme,
// darkTheme: darkTheme,
```

### Refined Color System (Material 3 + Custom Semantic)

**Core Palette (Generated from seed: #6B21A8 Deep Violet)**

| Token | Light | Dark (Primary) | Usage |
|-------|-------|----------------|-------|
| `surface` | `#FFF7FE` | `#141218` | Page backgrounds |
| `surfaceContainer` | `#F3EDF7` | `#1D1B20` | Card backgrounds |
| `surfaceContainerHigh` | `#ECE6F0` | `#2B2930` | Elevated cards, sheets |
| `surfaceContainerHighest` | `#E6E0E9` | `#36343B` | Top-level containers |
| `primary` | `#6B21A8` | `#D0BCFF` | Primary actions, active states |
| `onPrimary` | `#FFFFFF` | `#381E72` | Text on primary |
| `primaryContainer` | `#EADDFF` | `#4F378B` | Selected states, chips |
| `secondary` | `#625B71` | `#CCC2DC` | Secondary text, icons |
| `tertiary` | `#7D5260` | `#EFB8C8` | Accent highlights |
| `error` | `#B3261E` | `#F2B8B5` | Error states |

**Custom Brand Tokens — Dark Mode (Overrides on top of M3 seed)**

| Token | Value | Usage |
|-------|-------|-------|
| `brandMidnight` | `#0F0A1A` | True app background (darker than M3 default) |
| `brandDeepPurple` | `#1A0533` | Nav bar, app bar, primary surfaces |
| `brandViolet` | `#6B21A8` | Active states, selected tabs, progress rings |
| `brandElectricGold` | `#FFD700` | CTAs, XP badges, streak flames, completion glow |
| `brandGoldMuted` | `#B8960C` | Secondary gold (pressed states, borders) |
| `brandEmerald` | `#10B981` | Success, completed tasks, positive trends |
| `brandAmber` | `#F59E0B` | Warnings, due-soon, momentum dips |
| `brandRose` | `#F43F5E` | Overdue, delete, critical alerts |
| `brandCyan` | `#06B6D4` | Telegram channel accent |
| `brandWhatsApp` | `#25D366` | WhatsApp channel accent |
| `brandInstagram` | `#E4405F` | Instagram channel accent |

**Custom Brand Tokens — Light Mode (Parallel overrides, contrast-optimized)**

> Gold shifts from #FFD700 → #B8860B (Dark Goldenrod) to maintain 4.8:1 contrast on light surfaces.
> Semantic colors deepen by 1-2 stops to pass WCAG AA on off-white backgrounds.
> Purple (#1A0533) becomes the dominant text color — the brand is always visible.

| Token | Value | Usage |
|-------|-------|-------|
| `brandPurpleMist` | `#F8F5FF` | App background (purple-tinted off-white, NOT generic white) |
| `brandSoftLavender` | `#F0EAFC` | Nav bar, app bar, primary surfaces |
| `brandLightViolet` | `#EDE5F7` | Cards, sheets, surface containers |
| `brandViolet` | `#6B21A8` | Active states, selected tabs, progress rings (unchanged) |
| `brandRichGold` | `#B8860B` | CTAs, highlights, progress rings, completion glow (4.8:1 contrast) |
| `brandGoldWash` | `#FFF8E1` | Gold-tinted selection backgrounds, active card tint |
| `brandGoldMuted` | `#996F00` | Secondary gold (pressed states, borders — deeper for light bg) |
| `brandDeepEmerald` | `#059669` | Success, completed tasks (deepened for contrast) |
| `brandDeepAmber` | `#D97706` | Warnings, due-soon (deepened for contrast) |
| `brandDeepRose` | `#E11D48` | Overdue, delete, critical alerts (deepened for contrast) |
| `brandCyan` | `#0891B2` | Telegram channel accent (deepened) |
| `brandWhatsApp` | `#16A34A` | WhatsApp channel accent (deepened) |
| `brandInstagram` | `#DB2777` | Instagram channel accent (deepened) |
| `brandTextPrimary` | `#1A0533` | Headlines, body text (18.5:1 on #F8F5FF) |
| `brandTextSecondary` | `#6B21A8` | Subtitles, hints (brand purple as secondary text) |
| `brandTextTertiary` | `#475569` | Timestamps, metadata (4.8:1 minimum) |

**Elevation System — Dark Mode (Tonal, Not Shadow)**

Material 3 uses surface tint instead of shadows in dark mode. Higher elevation = lighter surface.

| Level | dp | Surface Tint Opacity | Use Case |
|-------|----|---------------------|----------|
| 0 | 0dp | 0% | Page background (`brandMidnight`) |
| 1 | 1dp | 5% | Cards at rest, bottom nav |
| 2 | 3dp | 8% | Floating cards, app bar |
| 3 | 6dp | 11% | Bottom sheets, dialogs |
| 4 | 8dp | 12% | Menus, tooltips |
| 5 | 12dp | 14% | FAB, snackbars |

Shadow is used sparingly — only on the FAB (+Create button) and modals, with a subtle purple-tinted shadow: `boxShadow: [BoxShadow(color: Color(0x40_6B21A8), blurRadius: 24, offset: Offset(0, 8))]`

**Elevation System — Light Mode (Shadow-Based, Purple-Tinted)**

Light mode uses real shadows (not tonal surface tint). All shadows are purple-tinted to stay on-brand — never use generic gray `#000000` shadows.

| Level | dp | Shadow | Use Case |
|-------|----|--------|----------|
| 0 | 0dp | None | Page background (`brandPurpleMist`) |
| 1 | 1dp | `0 1px 3px rgba(26,5,51,0.06)` | Cards at rest, bottom nav |
| 2 | 3dp | `0 2px 8px rgba(26,5,51,0.08)` | Floating cards, app bar |
| 3 | 6dp | `0 4px 16px rgba(26,5,51,0.10)` | Bottom sheets, dialogs |
| 4 | 8dp | `0 6px 24px rgba(26,5,51,0.12)` | Menus, tooltips |
| 5 | 12dp | `0 8px 32px rgba(26,5,51,0.14)` | FAB, snackbars |

**Key light mode differences:**
- Cards use `#FFFFFF` surface with purple-tinted shadow (not surface tint)
- Active/selected cards get `brandGoldWash` (#FFF8E1) background tint
- Borders are visible: `1px solid rgba(107,33,168,0.08)` on cards (subtle purple border)
- Bottom nav uses `brandSoftLavender` (#F0EAFC) with no shadow (clean edge)
- Dividers use `rgba(26,5,51,0.06)` (not gray)

### Spacing System (8dp Grid)

| Token | Value | Usage |
|-------|-------|-------|
| `space-xxs` | 2dp | Inline icon-text gaps |
| `space-xs` | 4dp | Tight element spacing |
| `space-sm` | 8dp | Within-component padding |
| `space-md` | 12dp | Between related elements |
| `space-base` | 16dp | Standard padding, card content |
| `space-lg` | 24dp | Between sections |
| `space-xl` | 32dp | Major section gaps |
| `space-2xl` | 48dp | Screen-level spacing |
| `space-3xl` | 64dp | Hero spacing |

**Border Radius Tokens:**
| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8dp | Chips, small buttons |
| `radius-md` | 12dp | Cards, input fields |
| `radius-lg` | 16dp | Bottom sheets, dialogs |
| `radius-xl` | 24dp | FAB, large cards |
| `radius-full` | 9999dp | Avatars, circular buttons |

### Iconography System

**Primary**: Material Symbols Rounded (variable weight, fill, grade, optical size)
- Default: weight 400, no fill, grade 0, optical size 24
- Active/Selected: weight 600, fill 1 (filled appearance)
- This gives "outlined when inactive, filled when active" behavior with one icon set

**Custom Icons** (SVG, designed for brand):
- UNJYNX logo (curse-breaking animation variant)
- Ghost Mode icon (ghost with broken chain)
- Progress ring icon (three concentric arcs — used in nav/shortcuts)
- Channel icons (styled versions of WhatsApp, Telegram, Instagram, SMS, Slack, Discord, Email)
- Industry mode icons (briefcase variants per mode)
- Streak flame (animated Lottie — subtle, not aggressive)

**Icon Sizing:**
| Context | Size | Touch Target |
|---------|------|-------------|
| Bottom nav | 24dp icon | 48x48dp target |
| App bar actions | 24dp icon | 48x48dp target |
| In-card actions | 20dp icon | 40x40dp target |
| Inline with text | 18dp icon | 36x36dp target |
| FAB | 24dp icon | 56x56dp target |
| Large FAB (+Create) | 28dp icon | 96x96dp target |

---

## 8. Animation & Motion System

### Core Principles
1. **Physics-based** — Use spring animations (not linear/cubic). Real objects have mass and momentum.
2. **150-300ms sweet spot** — Micro-interactions at 200ms, page transitions at 300ms, celebrations at 400-600ms.
3. **ease-out for enter, ease-in for exit** — Elements decelerate when arriving, accelerate when leaving.
4. **Respect `prefers-reduced-motion`** — All decorative animations disabled. Functional transitions remain but shortened to 100ms with no overshoot.
5. **GPU-friendly** — Animate only transform and opacity. Never animate size, padding, or layout properties.

### Animation Tokens

| Token | Curve | Duration | Usage |
|-------|-------|----------|-------|
| `motionQuick` | `Curves.easeOut` | 150ms | Checkbox, toggle, press feedback |
| `motionStandard` | `Curves.easeInOut` | 250ms | Card expand, sheet slide, tab switch |
| `motionEmphasis` | `spring(damping: 15, stiffness: 200)` | ~350ms | Task complete, achievement unlock |
| `motionDramatic` | `spring(damping: 12, stiffness: 150)` | ~500ms | Confetti, level up, streak milestone |
| `motionCalm` | `Curves.easeInOutCubic` | 600ms | Ghost Mode enter/exit, breathing pulse |

### Micro-Interaction Choreography

**Task Completion (The Core Loop)**
```
Frame 0ms:    User taps checkbox
Frame 0-50ms: Checkbox scales to 1.3x with spring overshoot
Frame 50ms:   Haptic: medium impact
Frame 50ms:   Sound: "ding" (pitch varies by task priority)
Frame 50-150ms: Checkbox fills with gold gradient (dark: brandElectricGold, light: brandRichGold)
Frame 100ms:  Checkmark draws in (path animation, ease-out)
Frame 150ms:  Ripple glow emanates from checkbox (opacity 0.3 → 0)
Frame 150-300ms: Task title gets strikethrough (left-to-right wipe)
Frame 200ms:  Task ring nudges forward (gold fill animation, 200ms, uses theme-aware gold)
                If Game Mode on: "+5 XP" micro-text fades in below, fades at 400ms
Frame 300-500ms: Task card slides down/collapses (spring, other tasks fill gap)
```

**Pull to Refresh**
```
Frame 0-∞:    User pulls down
Frame 0-60dp: UNJYNX logo appears, scales with pull distance
Frame 60dp+:  Logo reaches full size, starts "curse-breaking" shimmer
Frame release: Logo spins once (spring physics), sends purple ripple across screen
Frame load:   Content fades in with stagger (50ms between items)
```

**Ghost Mode Enter** (always uses dark aesthetics regardless of system theme)
```
Frame 0ms:    User activates Ghost Mode
Frame 0-400ms: All UI elements fade out (opacity → 0, staggered from edges inward)
Frame 200ms:  Background transitions to deep purple gradient (calm, breathing)
               In light mode: crossfade from #F8F5FF → deep purple gradient (smooth, 400ms)
Frame 400ms:  Single task fades in (centered, large text, slow breathing pulse)
Frame 400ms:  Haptic: soft notification pattern
Frame ∞:      Text gently pulses (scale 1.0 → 1.02, 3s cycle) — the "breathing" effect
```

**Morning Ritual Flow Transitions**
```
Between each step:
Frame 0-300ms: Current card slides left + fades (ease-in)
Frame 100-400ms: Next card slides in from right + fades in (ease-out)
Frame 200ms:  Progress bar segment fills (gold, left-to-right wipe)
Background:   Gradient slowly shifts from deep purple (start) → warm sunrise tones (end)
```

### Haptic Feedback Map

| Action | iOS (UIImpactFeedbackGenerator) | Android (VibrationEffect) |
|--------|-------------------------------|--------------------------|
| Task checkbox tap | `.medium` | `EFFECT_CLICK` |
| Swipe to complete | `.light` on threshold, `.heavy` on release | `EFFECT_TICK` → `EFFECT_HEAVY_CLICK` |
| FAB press | `.light` | `EFFECT_TICK` |
| Achievement unlock | `.success` (triple) | Custom pattern: tick-tick-heavy |
| Error/Invalid | `.error` | `EFFECT_DOUBLE_CLICK` |
| Ghost Mode enter | `.soft` | `EFFECT_TICK` (gentle) |
| Level up | Custom: light-medium-heavy | Custom waveform (crescendo) |
| Streak milestone | `.success` (triple) | Custom: tick-tick-tick-HEAVY |

### Sound Design

| Event | Sound Character | Duration | Volume |
|-------|----------------|----------|--------|
| Task complete | Bright "ding" (C5 → E5 glissando) | 200ms | 60% |
| Last task done | Triumphant chord (C major, arpeggiated) | 800ms | 80% |
| Streak milestone | Achievement fanfare (ascending 5-note) | 1200ms | 80% |
| Level up (Game Mode only) | Power-up (ascending sweep + impact) | 1000ms | 85% |
| Ghost Mode enter | Zen bell (single, sustain) | 2000ms | 40% |
| Morning ritual complete | Sunrise chime (warm, ascending) | 1500ms | 60% |
| Pomodoro done | Timer bell (classic, resonant) | 1000ms | 75% |
| XP gained (Game Mode only) | Coin collect (soft "pip") | 150ms | 40% |
| Error | Soft buzz (low frequency) | 200ms | 30% |

All sounds: User can customize from library of 20+ variants per event. Master volume control. Mute all option. Respects system silent/vibrate mode.

---

## 9. Empty States, Delight Moments & Easter Eggs

### Empty State Designs

Every empty state is an opportunity to guide, delight, and motivate — never a dead end.

| Screen | Illustration | Message | CTA |
|--------|-------------|---------|-----|
| No tasks today | Animated character lounging on a cloud, reading a book | "Nothing on the plate. Go live your life!" | "Or add something" (muted link) |
| No tasks ever (new user) | UNJYNX mascot breaking chains, gold particles flying | "Your first curse to break is just one tap away." | "Create your first task" (gold button) |
| No projects | Blueprint paper unrolling with sparkles | "Every empire started with a plan." | "Start a project" |
| Search no results | Magnifying glass examining an empty treasure chest | "Nothing here... yet. The curse hides things well." | "Try different words" (muted) |
| No completed tasks | Empty trophy case with one spotlight | "This shelf is hungry for trophies." | "Go complete something!" |
| Ghost Mode — all done | Zen garden with raked sand, single lotus flower | "Peace. You've conquered the day." | "Exit Ghost Mode" (muted) |
| No streak yet | Unlit torch, spark floating nearby | "One task today lights the flame." | "View today's tasks" |
| No content selected | Book with golden pages, closed | "Wisdom awaits. Pick your daily dose." | "Choose categories" |
| No team members | Empty round table with one chair filled | "Knights needed. Build your round table." | "Invite members" |
| Offline | Cloud with "ZZZ" sleeping | "We're offline. Your tasks are still here — they live on your device." | "Retry connection" |

**Illustration Style**: Flat with subtle grain texture, limited to brand palette (purple, gold, muted tones). Animated with Lottie (2-3s loops, subtle movement only). NO generic stock illustrations. Custom-drawn to match UNJYNX personality.

**Light mode illustration adaptations:**
- Dark mode: Illustrations are lighter elements on dark backgrounds (glowing, luminous feel)
- Light mode: Illustrations use deeper purple/gold tones on the light #F8F5FF background (bold, grounded feel)
- Gold accents in illustrations: #FFD700 (dark mode) → #B8860B (light mode) for visibility
- Same Lottie animations, different color variants (two color sets per illustration asset)
- Background elements (particles, clouds, sparkles): reduce opacity by 30% in light mode to avoid visual noise

### First-Time Delight Moments

| Moment | What Happens |
|--------|-------------|
| First app open | Logo does the "curse-breaking" reveal (chains shatter, gold dust settles into logo) |
| First task created | "Curse broken" animation — chains shatter around the task, gold dust settles. Progress ring makes its first move. |
| First task completed | Ring nudges forward with extra-warm glow. Encouraging message fades in: "One down. The curse weakens." |
| First streak (3 days) | Subtle torch-lighting animation, flame appears in streak counter permanently |
| First Ghost Mode use | Brief tutorial overlay: "Welcome to the calm. Only one task exists here." with breathing circle |
| Connected first channel | Channel icon flies from setup into the connected channels row with a satisfying "dock" sound |
| Completed morning ritual | Sunrise gradient fills the screen bottom-to-top, ritual streak increments |
| All 3 rings closed (first time) | All three rings pulse gold simultaneously, brief shimmer. "Your first perfect day." |

### Adaptive Completion Feedback (Prevents Fatigue)

The key problem: celebrations that don't get boring. The wrong solution: escalating complexity.
The right solution: **the feedback matures with the user**, just like the user matures with the app.

> Research: Duolingo found that reducing animation intensity for power users INCREASED retention.
> Users who complete 200+ tasks don't need confetti — they need speed. Satisfaction comes from
> the act of completing, not the animation around it.

**New users (first 2 weeks):**
- Full checkbox animation + sound + haptic on every completion
- Slightly richer feedback on milestones (10th task, 25th task, 50th task)
- Goal: establish the sensory association between "task done" and "that felt good"

**Regular users (2 weeks - 3 months):**
- Animation becomes faster and crisper (same spring physics, tighter timing)
- Sound becomes quieter (user's brain already associates the motion with completion)
- Ring closure moments get the spotlight instead — closing a ring feels better than a single checkbox
- Weekly insight card becomes the primary "reward" — information, not animation

**Power users (3+ months):**
- Minimal animation by default (fast, professional, gets out of the way)
- User can customize: Settings → Completion Feedback → Minimal / Standard / Expressive
- Major milestones (100th task, 365-day streak, project completion) get a brief, unique moment — a personalized stat summary, not confetti
- The heatmap becoming more green IS the reward — same psychology as GitHub contributions

**Why this works better than 4 tiers with "Apprentice/Breaker/Slayer/Legend" titles:**
- No fantasy language that alienates professionals
- No artificial tiers that feel like a video game progression system
- Adapts to HOW the user uses the app, not just how MUCH
- Respects that a 40-year-old lawyer and a 20-year-old student want different feedback
- The user controls intensity, not the system

### Seasonal & Contextual UI Variations

| Trigger | UI Change |
|---------|-----------|
| New Year (Jan 1-7) | Gold confetti on all completions, "New Year, New Curses to Break" banner |
| Diwali (date varies) | Diya lamp icons replace streak flames, warm orange tint on progress rings |
| Halloween (Oct 25-31) | Ghost Mode icon becomes spookier, purple fog on backgrounds |
| Christmas (Dec 20-31) | Snowfall particle effect on home screen, completion sound = sleigh bells |
| User's birthday | Cake icon on profile, warm confetti on first completion, "Happy birthday! All your rings glow today." |
| Monday morning | Motivational extra: "Monday energy detected. Here's your battle plan." |
| Friday evening | Tone shifts: "It's Friday. Clear 3 tasks and call it a win." |
| Late night (11pm-5am) | UI dims further, text softens to lavender, "Night owl mode. Don't forget to sleep." |
| Rainy weather (with permission) | Subtle rain animation on home background, indoor tasks surfaced |
| User idle 7+ days | Streak flame is "dying ember" animation, emotional re-engagement message |

**Light mode seasonal adaptations:**
- All particle effects (snowfall, confetti, rain) use slightly darker tones for visibility on #F8F5FF
- Diwali: warm orange tint works on both modes (inverts from glow-on-dark to warm-wash-on-light)
- Halloween: purple fog uses rgba(107,33,168,0.06) overlay on light mode (subtle, not muddy)
- Late night auto-dim: light mode shifts to a warmer, lower-contrast variant (not full dark mode switch)
- Gold seasonal accents: #FFD700 (dark) → #B8860B (light) — consistent with brand token system

### Easter Eggs

| Trigger | Easter Egg |
|---------|-----------|
| Type "excelsior" in task input | Stan Lee quote appears with comic-book "EXCELSIOR!" animation |
| Complete exactly 42 tasks | "You've found the answer to life, the universe, and everything." badge |
| Shake phone 10 times rapidly | Screen briefly "glitches" like a broken curse, then self-repairs with sparkle |
| Name a project "Wakanda" | Vibranium-styled project card (dark metallic purple with iridescent shimmer) |
| Complete a task at 3:33 AM | "Night Owl Supreme" rare badge (only earnable at this time) |
| 365-day streak | "Immortal" badge, permanent subtle gold aura on profile avatar |
| Type "I am Iron Man" | Task priority auto-sets to P1 with a repulsor sound effect |
| Create task "Take over the world" | Response: "One task at a time, Pinky." |
| Complete 1000th task | Full-screen cinematic: your journey recap with stats, set to epic music |
| Set all 5 AI personas (v2) | "Personality Crisis" badge — "You contain multitudes." |

---

## 10. Upgrade Prompts (Natural, Not Pushy)

### Philosophy
Upgrade prompts must feel like UNLOCKING POWER, not hitting a paywall. The user should feel "I want that" not "They blocked me."

### Prompt Strategies

**1. The Glimpse (Show, Don't Block)**
- Free user creates 11th project → show creation UI normally but with a shimmering "Pro" badge on the card → "Your 11th project! Upgrade to Pro for unlimited projects. For now, archive one to continue." → User sees the value, makes a choice.

**2. The Taste (Free Trial of Feature)**
- First time user tries to connect WhatsApp → allow ONE test message for free → "That felt good, right? WhatsApp reminders are Pro. 7 days free." → They've experienced the value before paying.

**3. The Social Proof Nudge**
- After completing 50 tasks: "You're more productive than 73% of UNJYNX users. Pro users average 2.4x more completions." → No button yet, just data. CTA appears next day.

**4. The Contextual Helper**
- User manually schedules tasks into calendar → "AI could do this in 3 seconds. Want to try?" → Single-tap auto-schedule demo → "That's a Pro feature. Unlock it?"

**5. The Milestone Gift**
- After 30-day streak: "You've earned 3 days of Pro! Experience everything." → Unrequested free trial creates obligation (reciprocity principle).

**6. The Missing Piece**
- Free user views Progress Dashboard (basic version) → Bottom of chart is blurred with label: "Your full productivity DNA — unlock with Pro" → Visual FOMO without blocking core function.

### Where Prompts NEVER Appear
- During Ghost Mode (sacred calm space)
- During Morning/Evening rituals (flow state protected)
- During active Pomodoro sessions
- Immediately after a failed task or bad day
- More than once per session
- On overdue task warnings (empathy > sales)

---

## 11. Accessibility Innovations

### Beyond WCAG Compliance

| Innovation | Description |
|-----------|-------------|
| **Haptic Semantics** | Different vibration patterns convey task priority without looking at screen (1 pulse = low, 2 = medium, 3 = high, buzz = urgent) |
| **Audio Spatial Cues** | In earphone mode, completed task sounds come from left, new tasks from right — spatial awareness of progress |
| **Voice-First Mode** | Full conversational task management: "What's next?" → AI reads top task → "Done" → marks complete → "Next?" — zero visual dependency |
| **High Contrast Ghost Mode** | Ghost Mode with max contrast option: pure black bg, pure white text, gold completion — readable in any light condition |
| **Dyslexia Mode** | Switches body font to OpenDyslexic, increases letter spacing 15%, tints background to warm cream (#FFF8E7 on light) |
| **Motor Accessibility** | Large touch targets mode: all targets become 64x64dp minimum, extra spacing between interactive elements |
| **Cognitive Load Indicator** | Visual indicator when too many tasks are shown — auto-suggests Ghost Mode or filtering |
| **Screen Reader Task Summaries** | Instead of reading each field, screen reader gets a natural summary: "Buy milk, high priority, due tomorrow at 9 AM, in Groceries project" |
| **Color-blind Patterns** | Priority flags use shape + color (circle = low, triangle = medium, diamond = high, octagon = urgent) — never color alone |
| **One-Handed Mode** | Shrinks the active UI area to bottom half of screen, all actions reachable with one thumb |

---

## 12. Component Library Specification

### Core Components

**UnjynxTaskCard**
```
Properties:
  - task: Todo (required)
  - onComplete: VoidCallback
  - onTap: VoidCallback
  - isCompact: bool (default: false)
  - showProject: bool (default: true)

Structure:
  Row [
    AnimatedCheckbox (48x48dp touch target)
    Expanded Column [
      Title (Body Large, 1 line, ellipsis)
      Row [ProjectDot + ProjectName (Label Small)]
    ]
    Column (trailing) [
      PriorityFlag (icon, color-coded)
      DueTime (Label Small, brandAmber if today)
    ]
  ]

States:
  - Default: Surface container bg, standard text
  - Pressed: Scale 0.98, elevated shadow
  - Completing: Gold ripple from checkbox, strikethrough wipe
  - Overdue: Left border 3dp brandRose/brandDeepRose, muted red tint
  - Swiping right: Green reveal bg, checkmark icon
  - Swiping left: Action menu reveal (snooze, edit, delete)

Light mode adaptations:
  - Card bg: #FFFFFF with purple-tinted shadow (not tonal surface tint)
  - Gold accents use brandRichGold (#B8860B), not brandElectricGold
  - Overdue tint uses brandDeepRose (#E11D48)
  - Text colors use brandTextPrimary (#1A0533)
  - Border: 1px solid rgba(107,33,168,0.08) visible on all cards
```

**UnjynxProgressRings** (Apple Watch inspired)
```
Properties:
  - taskPercent: double (0.0-1.0) — outer ring (Gold)
  - focusPercent: double (0.0-1.0) — middle ring (Violet)
  - habitPercent: double (0.0-1.0) — inner ring (Emerald)
  - size: RingSize (compact, standard, expanded)

Structure:
  Stack [
    CustomPaint outerRing (stroke width 10dp, theme-aware gold, rounded caps)
    CustomPaint middleRing (stroke width 8dp, brandViolet, rounded caps)
    CustomPaint innerRing (stroke width 6dp, brandEmerald, rounded caps)
    Center Column [
      CompletionPercent or encouraging word (Outfit Semibold, Title Medium)
      "Close your rings" (Label Small, muted) — only if rings incomplete
    ]
  ]

Animation:
  - Each ring fills independently on mount (0% → actual, staggered: outer 600ms, middle 700ms, inner 800ms)
  - Ring completion: full ring glows briefly (opacity pulse 0.5 → 1.0 → 0.7, 400ms)
  - All three complete: simultaneous gold shimmer across all rings (spring, 1000ms)
  - On task completion: outer ring extends smoothly (spring physics, 300ms)

Light mode adaptations:
  - Ring colors unchanged (Gold/Violet/Emerald are vibrant enough on light bg)
  - Background track: rgba(107,33,168,0.06) instead of rgba(255,255,255,0.05)
  - Center text uses brandTextPrimary (#1A0533)
  - Completion glow uses brandRichGold (#B8860B) shimmer
```

**UnjynxContentCard**
```
Properties:
  - content: DailyContent (quote, author, source, category)
  - onSave: VoidCallback
  - onShare: VoidCallback

Structure:
  Card (surfaceContainerHigh, radius-lg, gradient border 1dp) [
    Category badge (top-left, chip style)
    Quote text (Playfair Display, Headline Medium, centered)
    Author attribution (Body Small, muted, right-aligned)
    Divider (subtle, 0.5dp)
    Row [SaveButton (heart), ShareButton (share icon)]
  ]

Animation:
  - Card entrance: Fade up + scale from 0.95 (300ms)
  - Swipe left: Next content slides in from right
  - Save tap: Heart fills red with scale overshoot
  - Share tap: Share icon bounces, opens share sheet

Light mode adaptations:
  - Card bg: #FFFFFF with subtle purple-tinted shadow
  - Quote text (Playfair Display): brandTextPrimary (#1A0533) — rich contrast
  - Category badge: brandViolet bg with white text (same as dark)
  - Gradient border: rgba(107,33,168,0.12) instead of rgba(208,188,255,0.2)
```

**UnjynxGhostModeScreen**
```
Structure:
  Container (full screen, deep purple gradient bg) [
    SafeArea [
      ExitButton (top-right, muted, "Exit Ghost Mode")
      Expanded Center [
        AnimatedText (
          task.title,
          Headline Large,
          Snow White,
          breathing: scale 1.0 → 1.02, 3s sine cycle
        )
        Space (24dp)
        SubText ("This is all that matters right now.", Body Medium, Lavender Mist)
      ]
      LargeCompleteButton (
        bottom-center,
        96dp diameter,
        gold gradient,
        "Done" label,
        onTap: calm shimmer celebration
      )
    ]
  ]

Animation:
  - Enter: All UI fades out → gradient bg fades in → single task text fades in
  - Breathing: Continuous scale pulse (1.0 → 1.02, 3s, sine wave)
  - Complete: Calm shimmer (not confetti), next task slides in from below
  - Exit: Reverse of enter, UI elements fade back in from edges

Light mode note:
  - Ghost Mode ALWAYS uses dark mode aesthetics regardless of system theme
  - The deep purple gradient and snow white text are core to the calming experience
  - Entering Ghost Mode from light mode: UI elements fade out → bg crossfades from
    light to deep purple gradient → task appears in white text (seamless transition)
  - Exiting: reverse crossfade back to light mode theme
```

**UnjynxChannelCard**
```
Properties:
  - channel: NotificationChannel (type, status, lastMessage)
  - onConnect: VoidCallback
  - onTest: VoidCallback
  - onDisconnect: VoidCallback

Structure:
  Card (surfaceContainer, radius-md) [
    Row [
      ChannelIcon (branded colors: WhatsApp green, Telegram blue, etc.)
      Column [
        ChannelName (Title Medium)
        Status (Label Small: "Connected" green / "Not connected" muted)
      ]
      Trailing: ConnectButton or StatusChip
    ]
  ]

States:
  - Disconnected: Muted icon, "Connect" gold button
  - Connecting: Pulsing icon, loading indicator
  - Connected: Full-color icon, green "Connected" chip, "Test" button
  - Pro-locked: Channel icon + "Pro" badge overlay, upgrade CTA

Light mode adaptations:
  - Card bg: #FFFFFF with purple-tinted shadow
  - Gold button uses brandRichGold (#B8860B) for contrast
  - Connected chip: brandDeepEmerald (#059669) bg with white text
  - Channel brand colors stay the same (WhatsApp green, Telegram blue, SMS purple)
  - Pro badge: brandViolet bg (same in both modes)
```

---

## Design References & Research Sources

- [7 Mobile UX/UI Design Patterns Dominating 2026](https://www.sanjaydey.com/mobile-ux-ui-design-patterns-2026-data-backed/)
- [App Design for User Retention: 8 UX Moves in 2026](https://www.studioubique.com/app-design-for-user-retention/)
- [How Gen Z is Redefining UI/UX Trends in Mobile Design](https://www.wildnetedge.com/blogs/how-gen-z-ui-ux-is-shaping-the-future-of-mobile-design)
- [Designing for Gen Z: Digital First Generation Guide](https://www.aufaitux.com/blog/gen-z-digital-design-strategies/)
- [Mobile Navigation Design: 6 Patterns That Work in 2026](https://phone-simulator.com/blog/mobile-navigation-patterns-in-2026/)
- [14 App Gamification Examples and Ideas](https://clevertap.com/blog/app-gamification-examples/)
- [7 Strategies to Increase Mobile App Engagement in 2026](https://www.plotline.so/blog/increase-app-engagement)
- [Best Mobile App Onboarding Examples in 2026](https://www.plotline.so/blog/mobile-app-onboarding-examples)
- [Mobile Onboarding UX: 11 Best Practices for Retention](https://www.designstudiouiux.com/blog/mobile-app-onboarding-best-practices/)
- [10 Dark Mode UI Best Practices & Principles for 2026](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/)
- [How to Design Dark Mode for Your Mobile App - 2026 Guide](https://appinventiv.com/blog/guide-on-designing-dark-mode-for-mobile-app/)
- [10 App Pricing Models for 2026](https://blog.funnelfox.com/app-pricing-models-guide/)
- [Admin Dashboard: Ultimate Guide 2026](https://www.weweb.io/blog/admin-dashboard-ultimate-guide-templates-examples)
- [The Ultimate Guide to Perfecting Notification Preferences](https://www.suprsend.com/post/the-ultimate-guide-to-perfecting-notification-preferences-putting-your-users-in-control)
- [Gen Z Content Marketing: Attention Span vs Value](https://www.contentgrip.com/gen-z-content-strategy/)
- [Social Media Attention Span Statistics 2026](https://sqmagazine.co.uk/social-media-attention-span-statistics/)
- [Todoist vs TickTick 2026 Comparison](https://toolfinder.com/comparisons/todoist-vs-ticktick)
- [5 Micro-Interaction Design Rules for Apps 2026](https://dev.to/devin-rosario/5-micro-interaction-design-rules-for-apps-in-2026-48nb)
- [UI/UX Evolution 2026: Micro-Interactions & Motion](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)
- [Motion Design & Micro-Interactions: What Users Expect 2026](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect)
- [Mastering Material Design 3: Complete Theming Guide Flutter](https://www.christianfindlay.com/blog/flutter-mastering-material-design3)
- [Building a Dark Theme with Material and Figma](https://m3.material.io/blog/google-fonts-dark-theme)
- [Flutter Themes Cookbook](https://docs.flutter.dev/cookbook/design/themes)
- [Elevation - Material Design 3](https://m3.material.io/styles/elevation/applying-elevation)
- [Empty States - The Most Overlooked Aspect of UX](https://www.toptal.com/designers/ux/empty-state-ux-design)
- [Empty State UI Design: From Zero to Engagement](https://www.setproduct.com/blog/empty-state-ui-design)
- [40 Clever Empty State Designs for Mobile Apps](https://www.hongkiat.com/blog/mobile-app-empty-state-designs/)

---

> **UNJYNX by METAminds** — 66 v1 screens, 8 notification channels (Push, Telegram, Email, WhatsApp, SMS, Instagram, Slack, Discord), 10 curated content categories, field-level offline sync, dark + light mode, home screen widgets, watch app, task import from competitors, per-channel message quotas, and the only TODO app that reminds you where you actually pay attention. India-first launch, global expansion in Phase 2.
>
> *"Break the Satisfactory. Unjynx Your Productivity."*
