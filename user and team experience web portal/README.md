# UNJYNX Web Client — User & Team Experience Web Portal
# Comprehensive Plan & Deep Analytical Market Research
# Batch 1: Project Scaffold + Auth + Layout

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Deep Market Research & Competitive Analysis](#2-deep-market-research--competitive-analysis)
3. [Design Philosophy & Principles](#3-design-philosophy--principles)
4. [Technical Architecture](#4-technical-architecture)
5. [Authentication & Security](#5-authentication--security)
6. [Layout System & Navigation](#6-layout-system--navigation)
7. [Component Architecture](#7-component-architecture)
8. [State Management Strategy](#8-state-management-strategy)
9. [API Integration Layer](#9-api-integration-layer)
10. [Dashboard & Home Experience](#10-dashboard--home-experience)
11. [Accessibility & WCAG 2.2 Compliance](#11-accessibility--wcag-22-compliance)
12. [Performance & PWA Strategy](#12-performance--pwa-strategy)
13. [Real-Time & WebSocket Integration](#13-real-time--websocket-integration)
14. [AI Chat Interface](#14-ai-chat-interface)
15. [Gamification Dashboard](#15-gamification-dashboard)
16. [Multi-Channel Notification Hub](#16-multi-channel-notification-hub)
17. [Micro-Interactions & Animation System](#17-micro-interactions--animation-system)
18. [Responsive Design Breakpoints](#18-responsive-design-breakpoints)
19. [File Structure & Module Map](#19-file-structure--module-map)
20. [Implementation Phases & Batches](#20-implementation-phases--batches)
21. [Quality Checklist](#21-quality-checklist)

---

## 1. EXECUTIVE SUMMARY

### What This Is
The UNJYNX Web Client is the browser-based productivity hub for the UNJYNX ecosystem — a Next.js 15 application that gives users full access to their tasks, projects, channels, gamification, AI chat, team collaboration, and analytics from any desktop or tablet browser. It complements the Flutter mobile app (already built) and connects to the same Hono backend at api.unjynx.me.

### Why It Matters
- **70% of knowledge workers** use desktop browsers as their primary work surface during office hours
- **Mobile-first is not desktop-irrelevant**: power users need keyboard shortcuts, multi-panel layouts, and bulk operations that mobile cannot deliver
- **Todoist reports 62% of paid user sessions** originate from their web/desktop apps
- **Linear proved** that a keyboard-first, fast web app can beat native desktop apps in developer satisfaction

### The Goal
Build a web client that is **faster than Linear**, **prettier than Todoist**, **more feature-complete than TickTick's web**, and **uniquely UNJYNX** with multi-channel notification management, gamification, AI chat, and daily content — features no competitor has in one place.

### Batch 1 Scope
This batch covers the foundational scaffold:
1. Next.js 15 project setup with App Router
2. Logto OIDC authentication (login, callback, session)
3. Authenticated dashboard layout (sidebar + navbar + main)
4. Theme system (dark/light with UNJYNX brand colors)
5. API client with TanStack Query integration
6. Dashboard home page with real data from backend APIs
7. Command palette (Cmd+K)

---

## 2. DEEP MARKET RESEARCH & COMPETITIVE ANALYSIS

### 2.1 Todoist Web (todoist.com)

**Strengths We Must Match or Exceed:**
- Natural language task input ("Meeting tomorrow at 3pm" auto-parses date + time)
- Clean, breathing UI with generous whitespace — 83 UI components across 362 screens
- Instant task creation: click "+" or press Q, type, done
- Drag affordances: 6-dot grip handles with cross-arrow on hover
- Project color coding with nested sub-projects
- Karma gamification (subtle, not overwhelming)
- Views: List, Board (Kanban), Calendar
- 3-column layout: sidebar (240px) | task list | task detail panel

**Weaknesses We Exploit:**
- No multi-channel reminders (WhatsApp, Telegram, etc.) — push only
- Karma system is basic (no XP, levels, achievements, leaderboards)
- No AI chat interface (AI is limited to task suggestions)
- No daily content/quotes feature
- No team standup/accountability features
- Dark mode exists but feels like an afterthought — low contrast, washed out
- No command palette (Cmd+K)
- No keyboard-first design philosophy

**Design Metrics:**
- Sidebar width: 240px expanded, icons-only at ~60px
- Font: system fonts (no custom brand typography)
- Task row height: 42px with checkbox, title, chips
- Color palette: Red (#DB4035) as primary accent — generic, not premium

Sources: [Todoist UI/UX Critique](https://medium.com/nyc-design/what-todoist-does-well-and-what-could-be-made-better-a-ui-ux-critique-94b18ce111b0), [Todoist UI Screen Examples](https://nicelydone.club/apps/todoist)

### 2.2 Linear (linear.app)

**Strengths We Must Adopt:**
- **Command Palette (Cmd+K)**: Gold standard — every action accessible, fuzzy search, recent actions, keyboard-navigable. After pausing cursor over any element, a tooltip suggests the keyboard shortcut.
- **Speed**: Feels like a native app. Optimistic updates everywhere. Local-first rendering.
- **Keyboard-first**: Nearly every action has a shortcut. / to filter, E to edit, C to create.
- **Monochrome elegance**: 2025 redesign cut back color dramatically — black/white with surgical pops of color for status/priority
- **Sidebar dimming**: Navigation sidebar is visually recessed so main content takes focus
- **Smooth animations**: 200ms transitions, spring physics for panels
- **Focus indicators**: Visible, accessible, on-brand
- **Density control**: Users can toggle compact/comfortable/spacious

**Weaknesses We Exploit:**
- Developer-only audience — not consumer-friendly
- No personal task management features
- No gamification, no content, no multi-channel
- No mobile web optimization
- Pricing is team-only ($8/user/mo)

**Design Metrics:**
- Sidebar: 220px expanded, 48px collapsed
- Command palette: centered modal, 600px wide, 8px rounded corners
- Font: Inter (clean but ubiquitous)
- Issue row height: 36px (compact), 44px (comfortable)
- Animation duration: 150-250ms, ease-out curves

Sources: [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui), [Linear Design Refresh](https://linear.app/now/behind-the-latest-design-refresh), [Linear Design as SaaS Trend](https://blog.logrocket.com/ux-design/linear-design/), [The Elegant Design of Linear.app](https://telablog.com/the-elegant-design-of-linear-app/)

### 2.3 TickTick Web

**Strengths:**
- Built-in Pomodoro timer in web interface
- Eisenhower Matrix view (unique among competitors)
- Habit tracker integrated into same dashboard
- Calendar view with drag-to-reschedule
- Timeline/Gantt view for projects

**Weaknesses We Exploit:**
- UI feels cluttered — too many features crammed into sidebar
- Dark mode has poor contrast ratios
- No command palette
- Slow — noticeable lag on large task lists
- No AI features
- No multi-channel notifications

Sources: [TickTick vs Todoist Comparison 2026](https://www.morgen.so/blog-posts/ticktick-vs-todoist), [Todoist vs TickTick Comparison](https://efficient.app/compare/todoist-vs-ticktick)

### 2.4 Asana Web

**Strengths:**
- Adaptive task dashboard that changes based on user role
- Cross-department flexibility
- Portfolio views for managers
- Timeline (Gantt) for project planning
- Forms for task intake

**Weaknesses We Exploit:**
- Overwhelming for personal use
- No gamification
- No AI chat
- Slow with large projects (known performance complaints)
- No multi-channel notifications
- Enterprise pricing ($10.99-$24.99/user/mo)

Sources: [Linear vs Asana 2026](https://thesoftwarescout.com/linear-vs-asana-2026-which-project-management-tool-is-right-for-you/), [Jira vs Linear vs Asana 2026](https://www.ideaplan.io/compare/jira-vs-linear-vs-asana)

### 2.5 Notion Web

**Strengths:**
- Sidebar: 224px fixed width, accordion menus for progressive disclosure
- "Hide complexity until needed" philosophy
- Block-based editor (versatile but overkill for TODO)
- Dark mode well-implemented
- Template gallery for onboarding

**Weaknesses We Exploit:**
- Not a dedicated task manager — tasks are an afterthought
- No reminders across channels
- No gamification
- Performance degrades with large databases
- No native calendar or Pomodoro

Sources: [Notion Sidebar UI Breakdown](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d), [Notion Sidebar Navigation Guide](https://www.notion.com/help/guides/navigating-with-the-sidebar)

### 2.6 Competitive Gap Analysis — Where UNJYNX Wins

| Feature | Todoist | Linear | TickTick | Asana | Notion | **UNJYNX** |
|---|---|---|---|---|---|---|
| Command Palette (Cmd+K) | No | Yes | No | No | Yes | **Yes** |
| Keyboard-First Design | Partial | Yes | No | No | Partial | **Yes** |
| Multi-Channel Reminders | No | No | No | No | No | **YES (7 channels)** |
| AI Chat Interface | No | No | No | No | Yes (basic) | **YES (Claude-powered)** |
| Gamification (XP/Levels) | Basic karma | No | No | No | No | **YES (full RPG system)** |
| Daily Content/Quotes | No | No | No | No | No | **YES (60+ categories)** |
| Team Accountability | No | Partial | No | Yes | Partial | **YES (standups, nudges)** |
| Dark Mode Quality | Weak | Excellent | Weak | OK | Good | **Excellent** |
| Offline Support | Yes | Partial | Yes | No | Partial | **YES (PWA + service worker)** |
| Industry Modes | No | No | No | Partial | Templates | **YES (v2: 10+ industries)** |
| Web Performance | Good | Excellent | Poor | Poor | OK | **Target: Excellent** |
| Price (Individual) | $5/mo | Team only | $3/mo | $10.99/mo | $10/mo | **$6.99/mo** |

### 2.7 Target User Personas

**Persona 1: Aarav (25, Software Developer, Bangalore)**
- Uses VS Code all day, wants keyboard shortcuts
- Currently uses Todoist + Notion + Telegram reminders manually
- Wants: Cmd+K, dark mode, WhatsApp/Telegram reminders, Pomodoro
- Pain: Switching between 3 apps for task management

**Persona 2: Priya (32, Marketing Manager, Mumbai)**
- Manages team of 6, uses Asana but finds it overkill for personal tasks
- Wants: Team standup tracking, channel reminders for team members, gamification to motivate team
- Pain: Asana is too enterprise, personal TODO apps don't have team features

**Persona 3: Marcus (28, Freelance Designer, Berlin)**
- Uses TickTick web for habits + tasks
- Wants: Beautiful dark UI, daily inspiration quotes, XP/achievements for motivation
- Pain: TickTick web looks dated, wants premium aesthetic

---

## 3. DESIGN PHILOSOPHY & PRINCIPLES

### 3.1 Core Design Pillars

**Pillar 1: Speed as a Feature (The Linear Principle)**
- Every interaction must feel instant (<100ms response)
- Optimistic updates: UI changes before server confirms
- Skeleton screens instead of spinners
- Prefetch data on hover (link prefetching)
- Virtual scrolling for lists >50 items

Source: [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)

**Pillar 2: Progressive Disclosure (The Notion Principle)**
- Show only what is needed at each moment
- Hover to reveal secondary actions (edit, delete, move)
- Expandable sections with smooth animation
- Detail panels slide in from right (not new pages)
- Complexity hides behind Cmd+K command palette

Source: [Notion Sidebar UI Breakdown](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d)

**Pillar 3: Keyboard-First, Mouse-Second (The Linear Standard)**
- Every action has a keyboard shortcut
- Tab navigation through all interactive elements
- Focus indicators are visible and on-brand (gold ring)
- Cmd+K reaches everything in 2 keystrokes max
- No dead-ends: Escape always closes/goes back

Source: [Linear Shortcuts](https://shortcuts.design/tools/toolspage-linear/), [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)

**Pillar 4: Dark-First, Light-Adapted**
- Dark mode is default and primary design target
- Light mode is a carefully crafted alternative, not a CSS invert
- Both modes pass WCAG 2.2 AA contrast ratios (4.5:1 text, 3:1 UI)
- Smooth transition between modes (200ms crossfade)

Source: [Dark Mode Best Practices 2026](https://natebal.com/best-practices-for-dark-mode/)

**Pillar 5: Emotional Design (The UNJYNX Edge)**
- Micro-celebrations: confetti on streak milestones, XP gain animations
- Audio-visual feedback for achievements and level-ups
- Gold accent pops on achievements and level-ups
- Daily content card creates an emotional hook to open the app
- Progress rings and streak counters create daily engagement loops

Source: [Gamification in Productivity Apps](https://trophy.so/blog/productivity-gamification-examples), [SaaS Onboarding Flows 2026](https://www.saasui.design/blog/saas-onboarding-flows-that-actually-convert-2026)

### 3.2 Brand Design Tokens

```
COLOR SYSTEM (derived from Flutter app, extended for web):

Dark Mode (DEFAULT):
  --bg-primary:        #0F0A1A  (midnight, app background)
  --bg-secondary:      #1A0F2E  (card background, sidebar)
  --bg-tertiary:       #241540  (elevated surfaces, hover states)
  --bg-input:          #1E1338  (input fields, search bar)
  --border-primary:    #2D1F4E  (subtle dividers)
  --border-active:     #6B21A8  (focused elements)
  --text-primary:      #F0EAFC  (main text, headings)
  --text-secondary:    #A89BC8  (descriptions, meta)
  --text-muted:        #6B5B8A  (placeholders, disabled)
  --accent-gold:       #FFD700  (primary accent, CTAs, achievements)
  --accent-gold-hover: #FFE44D  (gold on hover/press)
  --accent-gold-muted: #B8960C  (gold in dark contexts)
  --accent-violet:     #6B21A8  (secondary accent, active states)
  --accent-violet-glow:#8B5CF6  (hover/focus violet)
  --status-success:    #10B981  (completed, connected)
  --status-warning:    #F59E0B  (overdue soon, attention)
  --status-error:      #F43F5E  (failed, disconnected)
  --status-info:       #3B82F6  (informational)

Light Mode:
  --bg-primary:        #F8F5FF  (purple mist, app background)
  --bg-secondary:      #FFFFFF  (card background)
  --bg-tertiary:       #F0EAFC  (soft lavender, hover states)
  --bg-input:          #EDE6F7  (input fields)
  --border-primary:    #D0BCFF  (lavender dividers)
  --border-active:     #6B21A8  (focused elements)
  --text-primary:      #0F0A1A  (midnight, main text)
  --text-secondary:    #4A3B6B  (descriptions)
  --text-muted:        #8B7BAA  (placeholders)
  (accent colors stay same)

TYPOGRAPHY:
  --font-display:    'Bebas Neue', sans-serif     (logo, hero headings)
  --font-heading:    'Outfit', sans-serif          (section headings, h1-h4)
  --font-body:       'DM Sans', sans-serif         (body text, descriptions)
  --font-editorial:  'Playfair Display', serif     (quotes, editorial content)
  --font-mono:       'JetBrains Mono', monospace   (code, keyboard shortcuts)

  Scale:
  text-xs:    12px / 16px (line-height)
  text-sm:    14px / 20px
  text-base:  16px / 24px
  text-lg:    18px / 28px
  text-xl:    20px / 28px
  text-2xl:   24px / 32px
  text-3xl:   30px / 36px
  text-4xl:   36px / 40px

SPACING:
  Base unit: 4px
  --space-1:  4px    (tight gaps)
  --space-2:  8px    (between related elements)
  --space-3:  12px   (between components)
  --space-4:  16px   (section padding)
  --space-5:  20px   (card padding)
  --space-6:  24px   (between sections)
  --space-8:  32px   (major sections)
  --space-10: 40px   (page margins)
  --space-12: 48px   (hero spacing)

ELEVATION (Dark Mode — purple-tinted shadows):
  --shadow-sm:  0 1px 2px rgba(26, 5, 51, 0.3)
  --shadow-md:  0 4px 6px rgba(26, 5, 51, 0.4)
  --shadow-lg:  0 10px 15px rgba(26, 5, 51, 0.5)
  --shadow-xl:  0 20px 25px rgba(26, 5, 51, 0.6)
  --shadow-gold: 0 0 20px rgba(255, 215, 0, 0.15)  (achievement glow)

BORDER RADIUS:
  --radius-sm:  6px   (chips, tags)
  --radius-md:  8px   (buttons, inputs)
  --radius-lg:  12px  (cards, panels)
  --radius-xl:  16px  (modals, command palette)
  --radius-2xl: 24px  (floating elements)
  --radius-full: 9999px (avatars, badges)
```

### 3.3 Iconography

**Primary icon set: Lucide React** (web standard, tree-shakeable, 1400+ icons)
- Stroke width: 1.75px (slightly thinner than default 2px for elegance)
- Size: 16px (inline), 20px (sidebar nav), 24px (section headers), 32px (empty states)
- Color: inherits from text color, accent colors for active/hover states

### 3.4 Component Style System

Following shadcn/ui patterns (NOT the library — the PATTERN):
- `cn()` utility for merging Tailwind classes with clsx + tailwind-merge
- CVA (class-variance-authority) for variant-based component styling
- No CSS-in-JS, no styled-components — pure Tailwind + CVA
- All components are unstyled primitives that accept className prop

Source: [Best Shadcn UI Templates 2026](https://designrevision.com/blog/best-shadcn-templates)

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Stack Decisions (with Rationale)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server Components, streaming, layouts that don't remount, ISR, Edge runtime |
| Language | **TypeScript 5.7+** | Strict mode, satisfies, const type params |
| Styling | **Tailwind CSS 3.4** | Utility-first, purge unused, matches Flutter app's Material 3 approach |
| State (Server) | **TanStack Query v5** | Caching, background refetching, optimistic updates, prefetching, dehydration for SSR |
| State (Client) | **Zustand v5** | Minimal boilerplate, centralized store for UI state (sidebar, theme, modals), devtools |
| Auth | **@logto/next v4** | Direct OIDC integration with our self-hosted Logto at auth.unjynx.me |
| Charts | **Recharts 2.15** | React-native SVG charts, modular, animation built-in, matches admin panel |
| Icons | **Lucide React** | Tree-shakeable, 1400+ icons, consistent with web standards |
| Class Utils | **CVA + clsx + tailwind-merge** | Variant-based styling, class conflict resolution |
| Date | **date-fns v4** | Tree-shakeable date utilities, immutable, lightweight |
| Command Palette | **cmdk** | Composable command menu by Pacocoursey, used by Vercel, Linear-style |
| Forms | **React Hook Form + Zod** | Performant forms with schema validation matching backend schemas |

Sources: [TanStack Query v5 SSR](https://tanstack.com/query/v5/docs/react/guides/ssr), [Zustand vs Jotai Performance 2025](https://www.reactlibraries.com/blog/zustand-vs-jotai-vs-valtio-performance-guide-2025), [State Management 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)

### 4.2 Why Not These Alternatives

| Rejected | Reason |
|---|---|
| Redux | Overkill for our state needs; TanStack Query handles server state |
| Jotai | Atomic model better for complex derived state; our UI state is simple/centralized — Zustand fits better |
| Chakra UI / MUI | Component libraries add bundle weight and fight our brand theme |
| shadcn/ui (as library) | We adopt its PATTERNS (cn(), CVA) but build our own components for full control |
| tRPC | Our backend is Hono, not tRPC-compatible; we use typed fetch client instead |
| SWR | TanStack Query v5 has better mutation support, devtools, and SSR hydration |

### 4.3 Build & Deploy

- **Dev server**: `next dev --port 3003` (3000=backend, 3001=logto, 3002=dev-portal)
- **Build**: `next build` with `output: 'standalone'` for Docker deployment
- **Deploy target**: Vercel (initial) or Docker on Hetzner (later, alongside backend)
- **CI/CD**: GitHub Actions — lint, type-check, test, build, deploy

---

## 5. AUTHENTICATION & SECURITY

### 5.1 Auth Flow (Logto OIDC)

```
User visits unjynx.me/app (or localhost:3003)
  |
  v
Middleware checks session cookie
  |
  +--> Has valid session --> Proceed to dashboard
  |
  +--> No session --> Redirect to /login
         |
         v
       Login page (branded)
         |
         +--> Click "Sign in with Google" --> Logto /auth?connector=google
         |
         +--> Click "Sign in with Email" --> Logto /auth (email/password flow)
         |
         v
       Logto auth.unjynx.me handles OIDC
         |
         v
       Redirect to /callback with auth code
         |
         v
       Exchange code for tokens (server-side)
         |
         v
       Set HttpOnly, Secure, SameSite=Lax cookie
         |
         v
       Redirect to /dashboard
```

### 5.2 Logto Configuration

- **App Type**: Traditional Web (NOT SPA — for server-side token handling)
- **App ID**: Will be registered as `unjynx-web-client` in Logto
- **Redirect URI**: http://localhost:3003/callback (dev), https://app.unjynx.me/callback (prod)
- **Post Sign-Out URI**: http://localhost:3003 (dev), https://app.unjynx.me (prod)
- **Scopes**: openid, profile, email, offline_access

Sources: [Logto Next.js App Router Quickstart](https://docs.logto.io/quick-starts/next-app-router), [Next.js Authentication Patterns](https://nextjs.org/docs/app/guides/authentication)

### 5.3 Security Measures

1. **Server-side token storage**: Tokens never reach the browser. HttpOnly cookies only.
2. **Middleware auth check**: Every /dashboard/* route checks session in Edge middleware (<50ms).
3. **DAL pattern**: Auth verification at data access layer, not just layout (Next.js layout gotcha: layouts don't re-render on navigation).
4. **CSRF protection**: SameSite=Lax cookies + double-submit cookie pattern.
5. **Rate limiting**: Login attempts rate-limited server-side.
6. **Token refresh**: Logto SDK handles refresh token rotation automatically.
7. **CVE-2025-29927**: Ensure Next.js >=15.2.3 to patch critical middleware bypass vulnerability.

Sources: [Next.js App Router Auth Guide 2026 (WorkOS)](https://workos.com/blog/nextjs-app-router-authentication-guide-2026), [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)

### 5.4 Session Management

```
Cookie: unjynx-session
  - HttpOnly: true
  - Secure: true (production)
  - SameSite: Lax
  - Max-Age: 7 days
  - Domain: .unjynx.me (production)
  - Path: /

Token refresh: silent, server-side, before expiry
Session data: { logtoId, profileId (cached 5min), email, name, avatar }
```

---

## 6. LAYOUT SYSTEM & NAVIGATION

### 6.1 Sidebar (The Heart of the Web App)

**Research-Backed Decisions:**
- Width: **256px expanded, 64px collapsed** (Linear uses 220px, Notion uses 224px, Todoist uses 240px — we use 256px for slightly more breathing room, divisible by our 4px grid)
- Collapse: **Cmd+\\** keyboard shortcut (matches VS Code, Linear)
- Persistence: Collapse state saved in Zustand -> localStorage
- Dimming: Sidebar background is 1 shade darker than main content (Linear principle: content takes visual priority)

Sources: [Best Sidebar Menu Designs 2026](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples), [Sidebar Collapse Navigation Dark Mode](https://elements.envato.com/sidebar-collapse-navigation-dark-mode-9VG9434)

**Sidebar Structure (Top to Bottom):**

```
+------------------------------------------+
| [UNJYNX Logo]  Bebas Neue, gold #FFD700  |
|  + collapse toggle button (<<)           |
+------------------------------------------+
| [Search]  Cmd+K to open command palette  |
+------------------------------------------+
|                                          |
| OVERVIEW                                 |
|   > Dashboard         (LayoutDashboard)  |
|   > My Day            (Sun)              |
|   > Upcoming          (Calendar)         |
|   > Overdue           (AlertTriangle)    |
|                                          |
| WORKSPACE                                |
|   > Inbox             (Inbox) [badge: 3] |
|   > Projects          (FolderKanban)     |
|     > Project Alpha   (circle, colored)  |
|     > Project Beta    (circle, colored)  |
|     + New Project                        |
|   > Tags              (Tag)              |
|   > Sections          (Layers)           |
|                                          |
| CHANNELS                                 |
|   > Channel Hub       (Radio)            |
|   > Delivery Log      (ScrollText)       |
|                                          |
| PRODUCTIVITY                             |
|   > Progress          (TrendingUp)       |
|   > Calendar          (CalendarDays)     |
|   > AI Chat           (Sparkles)         |
|   > Daily Content     (BookOpen)         |
|                                          |
| TEAM (if user.hasTeam)                   |
|   > Team Dashboard    (Users)            |
|   > Standups          (MessageSquare)    |
|   > Members           (UserCog)          |
|                                          |
+------------------------------------------+
| GAMIFICATION                             |
|   Level 12  [progress bar]  2,340 XP     |
|   7-day streak (flame icon)              |
+------------------------------------------+
|                                          |
|   > Settings          (Settings)         |
|   > Profile           (User)             |
|   [Dark/Light Toggle] (Moon/Sun)         |
|                                          |
|   [User Avatar + Name]                   |
|   aarav@unjynx.me                        |
+------------------------------------------+
```

**Active State Design:**
- Left border: 3px solid gold (#FFD700)
- Background: rgba(107, 33, 168, 0.15) (violet at 15% opacity)
- Text color: white (dark mode) / midnight (light mode)
- Icon color: gold

**Hover State Design:**
- Background: rgba(107, 33, 168, 0.08) (violet at 8% opacity)
- Transition: background 150ms ease

**Collapsed State (64px):**
- Only icons visible, centered
- Tooltip on hover showing label
- Active item: left gold border + violet bg on icon container
- Logo becomes just "U" monogram in Bebas Neue

### 6.2 Navbar (Top Bar)

```
+------------------------------------------------------------------------+
| [Breadcrumb: Dashboard > My Day]                                        |
|                                                                         |
|              [Search Bar - Cmd+K]              [Notif Bell] [Avatar v]  |
|                                               [unread: 5]              |
+------------------------------------------------------------------------+
```

**Components:**
1. **Breadcrumb** (left): Shows current location, clickable for navigation
2. **Search Trigger** (center): Click or Cmd+K to open command palette
3. **View Switcher** (center-right): List/Board/Calendar toggle for applicable pages
4. **Notification Bell** (right): Badge with unread count, opens dropdown
5. **User Avatar** (right): Dropdown with profile, settings, sign out

**Navbar height:** 56px (compact but touchable)
**Background:** Same as sidebar (1 shade darker than content)
**Border:** Bottom border: 1px solid var(--border-primary)

### 6.3 Main Content Area

- Fills remaining space after sidebar + navbar
- Max content width: 1200px (centered, for readability on ultra-wide screens)
- Padding: 24px on desktop, 16px on tablet, 12px on mobile
- Scroll: Content area scrolls independently of sidebar
- Transition: When sidebar collapses, content expands with 200ms ease transition

### 6.4 Command Palette (Cmd+K)

**Research-backed design** (Linear + Vercel pattern):
- **Trigger**: Cmd+K (Mac) / Ctrl+K (Windows)
- **Position**: Centered overlay, 640px wide, 480px max height
- **Animation**: Scale from 95% + fade in, 150ms
- **Backdrop**: Semi-transparent black (rgba(0,0,0,0.5))
- **Search**: Fuzzy matching, debounced 150ms
- **Sections**:
  - Recent Actions (last 5)
  - Navigation (all pages)
  - Tasks (search by title)
  - Projects (search by name)
  - Commands (create task, toggle theme, etc.)
  - Keyboard Shortcuts (show cheat sheet)
- **Keyboard navigation**: Arrow keys, Enter to select, Escape to close
- **Footer**: Shows keyboard shortcuts for current context

**Implementation**: cmdk library by Pacocoursey (used by Vercel, Raycast)

Sources: [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1), [Command Palette Best Practices](https://uxpatterns.dev/patterns/advanced/command-palette), [Command K Bars](https://maggieappleton.com/command-bar)

### 6.5 Detail Panel (Slide-In)

When clicking a task or project:
- **Panel slides in from right**: 480px wide, overlays content
- **Does NOT navigate to new page** (keeps context)
- **Escape or click outside** to close
- **Keyboard shortcut**: Cmd+Shift+D to toggle detail panel
- **Animation**: slideInRight 200ms ease-out
- Contains: Full task details, subtasks, comments, activity log

---

## 7. COMPONENT ARCHITECTURE

### 7.1 Base UI Components (shadcn/ui Patterns)

All built from scratch using CVA + Tailwind (not importing shadcn):

```
src/components/ui/
  button.tsx           - Variants: primary (gold), secondary (violet), ghost, outline, destructive
                         Sizes: sm (32px), md (40px), lg (48px), icon (40x40)
  input.tsx            - Text input with label, error, helper text
  textarea.tsx         - Auto-growing textarea
  select.tsx           - Custom select dropdown (no native)
  checkbox.tsx         - Animated checkbox with purple fill + gold checkmark
  badge.tsx            - Priority badges, status badges, count badges
  avatar.tsx           - User avatar with fallback initials, status dot
  card.tsx             - Content card with header, body, footer sections
  dialog.tsx           - Modal dialog with backdrop, Escape to close
  dropdown-menu.tsx    - Context menu / dropdown
  tooltip.tsx          - Hover tooltip with 300ms delay
  toast.tsx            - Success/error/info toast notifications
  skeleton.tsx         - Shimmer loading placeholder (matching Flutter app's UnjynxShimmer)
  progress.tsx         - Linear progress bar
  progress-ring.tsx    - Circular SVG progress ring (animated)
  separator.tsx        - Horizontal/vertical divider
  scroll-area.tsx      - Custom scrollbar styling
  switch.tsx           - Toggle switch for settings
  tabs.tsx             - Tab navigation with animated indicator
  popover.tsx          - Floating popover for pickers
  sheet.tsx            - Slide-in panel (for mobile sidebar + task detail)
  command.tsx          - Command palette wrapper (cmdk)
  kbd.tsx              - Keyboard shortcut display component
```

### 7.2 Feature Components

```
src/components/
  layout/
    sidebar.tsx         - Main navigation sidebar
    sidebar-item.tsx    - Individual nav item with icon + label + badge
    sidebar-section.tsx - Section header (OVERVIEW, WORKSPACE, etc.)
    sidebar-project.tsx - Expandable project item with sub-items
    sidebar-xp-bar.tsx  - XP progress bar at sidebar bottom
    navbar.tsx          - Top navigation bar
    breadcrumb.tsx      - Route breadcrumb
    user-menu.tsx       - User avatar + dropdown
    notification-bell.tsx - Bell icon + unread count + dropdown
    page-container.tsx  - Wraps page content with max-width, padding

  tasks/
    task-list.tsx       - List of task items
    task-item.tsx       - Single task row (checkbox, title, priority, due date, assignee)
    task-create.tsx     - Inline task creation (like Todoist's quick add)
    task-detail.tsx     - Full task detail panel
    task-priority.tsx   - Priority indicator (color dot / flag)
    task-due-date.tsx   - Due date display with relative time

  projects/
    project-list.tsx    - Project grid/list
    project-card.tsx    - Project summary card with progress ring
    project-header.tsx  - Project page header with views toggle

  dashboard/
    stats-card.tsx      - Metric card (tasks today, streak, XP, focus)
    progress-rings.tsx  - Animated circular progress indicators
    completion-chart.tsx - Recharts area chart for trends
    upcoming-tasks.tsx  - Next 5 tasks widget
    daily-content.tsx   - Quote of the day card
    ai-suggestions.tsx  - AI recommendations card
    channel-status.tsx  - Channel connectivity overview

  gamification/
    xp-display.tsx      - Current XP, level, progress to next
    streak-counter.tsx  - Current streak with flame animation
    achievement-card.tsx - Individual achievement
    leaderboard.tsx     - Weekly/monthly leaderboard

  channels/
    channel-card.tsx    - Channel status card (WhatsApp, Telegram, etc.)
    channel-connect.tsx - Channel connection wizard
    delivery-log.tsx    - Notification delivery history

  ai/
    chat-interface.tsx  - AI chat with streaming responses
    chat-message.tsx    - Individual message bubble
    typing-indicator.tsx - AI thinking/typing animation
    suggestion-chip.tsx - Quick action suggestion

  providers/
    theme-provider.tsx  - Dark/light theme context
    query-provider.tsx  - TanStack Query client provider
    auth-provider.tsx   - Authentication context
```

### 7.3 Component Design Specifications

**Task Item (the most critical component):**
```
Height: 44px (comfortable), 36px (compact)
Layout: [checkbox 20px] [gap 12px] [title flex-1] [priority badge] [due date] [assignee avatar] [more ...]

Checkbox:
  - Unchecked: 20x20, rounded-md, border 2px var(--border-primary)
  - Hover: border color transitions to priority color
  - Checked: filled with priority color, white checkmark with spring animation
  - Animation: scale(0.8) -> scale(1.1) -> scale(1.0) in 300ms

Priority Colors:
  - none:   var(--text-muted)
  - low:    #3B82F6  (blue)
  - medium: #F59E0B  (amber)
  - high:   #F97316  (orange)
  - urgent: #F43F5E  (rose, with subtle pulse animation)

Hover state: bg var(--bg-tertiary), show drag handle (6 dots) on left, show action icons on right
Drag handle: cursor grab, drag-and-drop for reordering

Click: Opens task detail panel (right slide-in)
Double-click: Inline edit mode (title becomes editable)
```

**Stats Card (Dashboard):**
```
Size: min-width 200px, responsive grid
Border-radius: var(--radius-lg) = 12px
Padding: 20px
Background: var(--bg-secondary)
Border: 1px solid var(--border-primary)

Layout:
  [Icon in colored circle 40x40]
  [Metric value - text-2xl font-bold]
  [Metric label - text-sm text-muted]
  [Trend indicator: +12% with arrow, green/red]

Hover: subtle lift (translateY(-2px)), shadow-md
Transition: transform 200ms ease, box-shadow 200ms ease
```

---

## 8. STATE MANAGEMENT STRATEGY

### 8.1 Architecture: Zustand for Client + TanStack Query for Server

```
CLIENT STATE (Zustand):
  uiStore:
    - sidebarCollapsed: boolean
    - sidebarWidth: number
    - theme: 'dark' | 'light'
    - commandPaletteOpen: boolean
    - detailPanelOpen: boolean
    - detailPanelContent: { type: 'task' | 'project', id: string } | null
    - activeView: 'list' | 'board' | 'calendar'
    - viewDensity: 'compact' | 'comfortable' | 'spacious'

  authStore:
    - user: { id, name, email, avatar } | null
    - isAuthenticated: boolean
    - isLoading: boolean

SERVER STATE (TanStack Query):
  - tasks (list, detail, today, overdue, upcoming)
  - projects (list, detail)
  - progress (rings, streak, heatmap, insights, completion-trend)
  - gamification (xp, achievements, leaderboard, challenges)
  - channels (list, delivery-log)
  - content (today, categories, saved)
  - notifications (list, unread-count)
  - teams (members, standups, invites)
  - profile (user profile, preferences)
```

Sources: [State Management in 2025](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k), [TanStack Query Complete Guide](https://medium.com/@learning.anand01/tanstack-query-v5-the-complete-guide-to-mastering-server-state-in-react-cbc1905a3095)

### 8.2 Query Key Convention

```typescript
// Predictable, hierarchical keys for cache management
const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
    today: () => [...queryKeys.tasks.all, 'today'] as const,
    overdue: () => [...queryKeys.tasks.all, 'overdue'] as const,
  },
  // ... similar for all domains
};
```

### 8.3 Optimistic Update Pattern

```
User completes task:
  1. Immediately update UI (checkbox fills, strikethrough, XP +10 animation)
  2. Fire PATCH /api/v1/tasks/:id { status: 'completed' }
  3. On success: cache is already correct, no visual change
  4. On failure: rollback UI, show toast error

This pattern applies to ALL mutations: create, update, delete, reorder
```

---

## 9. API INTEGRATION LAYER

### 9.1 API Client Design

```
src/lib/api/
  client.ts       - Base fetch client with auth headers, error handling
  types.ts        - ApiResponse<T>, PaginationMeta, ApiError (matches backend exactly)
  tasks.ts        - Task CRUD operations
  projects.ts     - Project CRUD operations
  progress.ts     - Progress endpoints (rings, streak, heatmap, trend)
  gamification.ts - XP, achievements, leaderboard
  channels.ts     - Channel management
  content.ts      - Daily content, categories
  auth.ts         - Auth-related API calls
  notifications.ts - Notification management
  teams.ts        - Team operations
```

### 9.2 Response Type Alignment

Our API client types MUST match the backend's ApiResponse exactly:
```typescript
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: PaginationMeta;
}

interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
```

### 9.3 Backend Endpoints Used (Batch 1)

| Endpoint | Method | Purpose | Used In |
|---|---|---|---|
| /api/v1/tasks | GET | List tasks with filters | Dashboard, Task list |
| /api/v1/tasks | POST | Create task | Quick add, Cmd+K |
| /api/v1/tasks/:id | GET | Task detail | Detail panel |
| /api/v1/tasks/:id | PATCH | Update task | Inline edit, complete |
| /api/v1/tasks/:id | DELETE | Delete task | Context menu |
| /api/v1/projects | GET | List projects | Sidebar, Dashboard |
| /api/v1/progress/rings | GET | Progress rings data | Dashboard |
| /api/v1/progress/streak | GET | Current streak | Dashboard, Sidebar |
| /api/v1/progress/completion-trend | GET | Completion chart | Dashboard |
| /api/v1/progress/insights | GET | AI insights | Dashboard |
| /api/v1/gamification/xp | GET | XP + level status | Sidebar, Dashboard |
| /api/v1/gamification/achievements | GET | Achievements list | Dashboard |
| /api/v1/channels | GET | Channel list + status | Dashboard, Channels |
| /api/v1/content/today | GET | Daily content | Dashboard |
| /api/v1/notifications | GET | Notification list | Navbar bell |

---

## 10. DASHBOARD & HOME EXPERIENCE

### 10.1 Dashboard Layout (Batch 1 Home Page)

The dashboard is the first thing users see after login. It must create an emotional connection and provide immediate value.

```
+-----------------------------------------------------------------------+
| Good morning, Aarav!  It's Tuesday, March 23                          |
| "Break the satisfactory. Unjynx your productivity."                   |
+-----------------------------------------------------------------------+
|                                                                        |
| [Stats Cards Row - 4 across]                                          |
| +---------------+ +---------------+ +---------------+ +--------------+ |
| | Tasks Today   | | Day Streak    | | Focus Hours   | | XP Today     | |
| | 8 / 12        | | 7 days        | | 3.5h          | | +145 XP      | |
| | +23% vs avg   | | Best: 14      | | Target: 5h    | | Level 12     | |
| +---------------+ +---------------+ +---------------+ +--------------+ |
|                                                                        |
| +---------------------------+ +--------------------------------------+ |
| | Progress Rings            | | Completion Trend (7-day chart)       | |
| | [Daily] [Weekly] [Proj]   | | (Recharts area chart)                | |
| | Three animated SVG rings  | | Smooth gradient fill, purple->gold  | |
| | with percentage labels    | | Hover shows exact date + count      | |
| +---------------------------+ +--------------------------------------+ |
|                                                                        |
| +---------------------------+ +--------------------------------------+ |
| | Upcoming Tasks (Next 5)   | | Daily Content                        | |
| | [ ] Design review  2:00pm | | "The impediment to action advances   | |
| | [ ] API integration 4:00pm| |  action. What stands in the way      | |
| | [ ] Team standup   5:00pm | |  becomes the way." -- Marcus Aurelius | |
| | [ ] Deploy staging  EOD   | |                                      | |
| | [ ] Code review    tmrw   | | Category: Stoic Wisdom               | |
| | [+ Add task]               | | [Save] [Share] [New Quote]           | |
| +---------------------------+ +--------------------------------------+ |
|                                                                        |
| +---------------------------+ +--------------------------------------+ |
| | AI Suggestions            | | Channel Status                       | |
| | Based on your patterns:   | | [WhatsApp] Connected                 | |
| | > Schedule "API review"   | | [Telegram] Connected                 | |
| |   for 10am (peak focus)   | | [Email]    Connected                 | |
| | > "Design review" took    | | [SMS]      Not set up                | |
| |   45min avg -- block it   | | [Push]     Connected                 | |
| | > 3 tasks overdue -- snooze| | [Discord]  Not set up               | |
| |   or complete?            | | [Instagram] Friend request sent...   | |
| +---------------------------+ +--------------------------------------+ |
+-----------------------------------------------------------------------+
```

### 10.2 Dashboard Specifics

**Greeting Section:**
- Time-aware greeting: "Good morning" (5am-12pm), "Good afternoon" (12pm-5pm), "Good evening" (5pm-9pm), "Night owl mode" (9pm-5am)
- User's first name (from Logto profile)
- Date formatted as "Tuesday, March 23"
- Rotating motivational tagline from UNJYNX brand quotes

**Stats Cards:**
- Layout: CSS Grid, 4 columns on desktop, 2 on tablet, 1 on mobile
- Each card has: icon in colored circle, metric value (large), label (small), trend indicator
- Hover: translateY(-2px) lift with shadow
- Data sources:
  - Tasks Today: GET /tasks?status=pending&dueDate=today (count vs completed count)
  - Day Streak: GET /progress/streak
  - Focus Hours: GET /progress/insights (focusHours field)
  - XP Today: GET /gamification/xp (todayXp field)

**Progress Rings:**
- 3 animated SVG circles: Daily progress, Weekly progress, Active project progress
- Colors: gold (daily), violet (weekly), emerald (project)
- Animation: Ring fills from 0 to current % over 1200ms with easeOutCubic
- Percentage label in center, animate counting up
- Toggle buttons above for time period

**Completion Trend Chart:**
- Recharts AreaChart with gradient fill (violet bottom -> gold top)
- X-axis: last 7 days (or 14, or 30 -- toggle)
- Y-axis: tasks completed count
- Hover: tooltip with date + count
- Smooth curve: type="monotone"
- Responsive: fills available width

Sources: [Recharts Documentation](https://recharts.github.io/), [Best React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/)

**Upcoming Tasks:**
- Shows next 5 tasks by due date
- Each row: checkbox, title (truncated), relative time
- Checkbox triggers optimistic complete
- "+ Add task" at bottom opens inline creation
- Empty state: illustration + "All clear! Add a task to get started"

**Daily Content Card:**
- Random quote from user's preferred categories
- Typography: Playfair Display italic for quote text
- Author attribution below
- Category badge
- Actions: Save (bookmark), Share (copy), Next (random refresh)
- Subtle animated gradient border (purple -> gold)

**AI Suggestions Card:**
- Shows 3 AI-generated suggestions based on user patterns
- Each suggestion: icon, description, action button
- "Smart" badge in card header
- Actions: Accept (applies suggestion), Dismiss (removes)
- Powered by Claude API (v2 phase, mock data for Batch 1)

**Channel Status Card:**
- Shows all 7 channel types with connection status
- Connected: green checkmark, channel-specific icon
- Not connected: grey, "Set up" link
- Pending: amber, status message (e.g., "Friend request sent")
- Click: navigates to channel setup page

---

## 11. ACCESSIBILITY & WCAG 2.2 COMPLIANCE

### 11.1 Requirements (AA Level)

- **Contrast ratios**: All text 4.5:1 minimum, large text 3:1, UI components 3:1
- **Focus indicators**: 2px solid gold (#FFD700) outline, offset 2px, contrast 3:1
- **Keyboard navigation**: Full app navigable via Tab, Arrow keys, Enter, Escape
- **Screen reader**: All interactive elements have aria-labels, live regions for dynamic content
- **Focus trap**: Modals and command palette trap focus inside
- **Reduced motion**: @media (prefers-reduced-motion: reduce) disables animations
- **Font scaling**: Supports up to 200% zoom without layout breakage

Sources: [WCAG 2.2 Complete Guide 2025](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025), [Color Contrast Accessibility 2025](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025), [Focus Indicators Guide](https://vispero.com/resources/managing-focus-and-visible-focus-indicators-practical-accessibility-guidance-for-the-web/)

### 11.2 Focus Management

```
Tab order:
  1. Skip to main content link (visually hidden, appears on Tab)
  2. Sidebar navigation items
  3. Navbar items (search, notifications, profile)
  4. Main content area (following DOM order)
  5. Detail panel (if open)

Focus trap in:
  - Command palette (Cmd+K)
  - Dialogs/modals
  - Dropdown menus

Auto-focus on:
  - Command palette search input when opened
  - First task when task list loads
  - First invalid field on form submission error
```

### 11.3 ARIA Patterns

- Sidebar: role="navigation", aria-label="Main navigation"
- Task list: role="list" with role="listitem" children
- Task checkbox: role="checkbox", aria-checked, aria-label="Complete [task title]"
- Command palette: role="dialog", aria-modal="true", aria-label="Command palette"
- Toast: role="alert", aria-live="polite"
- Progress ring: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax

---

## 12. PERFORMANCE & PWA STRATEGY

### 12.1 Performance Budgets

| Metric | Target | Linear Benchmark |
|---|---|---|
| First Contentful Paint | <1.2s | 1.0s |
| Largest Contentful Paint | <2.0s | 1.8s |
| Time to Interactive | <2.5s | 2.0s |
| Cumulative Layout Shift | <0.05 | 0.02 |
| First Input Delay | <50ms | 30ms |
| Bundle size (gzipped) | <200KB initial | ~180KB |

### 12.2 Optimization Strategies

1. **Server Components by default**: Only add 'use client' when needed (event handlers, hooks)
2. **Dynamic imports**: Heavy components (charts, command palette, AI chat) loaded lazily
3. **Image optimization**: next/image with WebP, AVIF formats
4. **Font optimization**: next/font for Google Fonts (subset Latin, preload)
5. **Prefetching**: Router.prefetch on link hover, TanStack Query prefetchQuery for probable next pages
6. **Virtual scrolling**: For task lists >50 items (react-virtual)
7. **Skeleton screens**: UnjynxShimmer during data loading (matching Flutter app)

Sources: [Next.js 15 App Router Patterns](https://devglory.com/blog/next-js-15-app-router-patterns-that-actually-work)

### 12.3 PWA Strategy (Future Batch)

- Service worker: Workbox for cache management
- Caching: Static assets (cache-first), API responses (stale-while-revalidate)
- Offline: Read-only access to cached tasks and projects
- Install prompt: Custom "Add to Home Screen" banner
- Push notifications: Web Push API with backend integration
- Background sync: Queue task mutations when offline, sync when back online

Sources: [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [PWA Performance Guide 2026](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide)

---

## 13. REAL-TIME & WEBSOCKET INTEGRATION

### 13.1 Architecture

```
Client (Next.js) <--WebSocket--> Backend (Hono + ws)
  |
  +- Subscribe to user channel on connect
  +- Receive: task.updated, task.created, task.deleted
  +- Receive: notification.new
  +- Receive: xp.awarded, streak.updated
  +- Receive: channel.status_changed
  +- Receive: team.standup_posted
```

### 13.2 Implementation (Future Batch, designed now)

- **Connection**: Establish WebSocket on authenticated page load
- **Reconnection**: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **Heartbeat**: Ping every 30s to keep connection alive
- **State sync**: On reconnect, fetch missed events since last timestamp
- **TanStack Query integration**: WebSocket events invalidate relevant query keys

Sources: [WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices), [Real-Time Web Apps 2025](https://www.debutinfotech.com/blog/real-time-web-apps)

---

## 14. AI CHAT INTERFACE

### 14.1 Design Specifications

**Position**: Full page (/dashboard/ai-chat) OR slide-in panel (toggle from sidebar)

**Chat Interface:**
- User messages: right-aligned, violet bubble (#6B21A8 at 20%)
- AI messages: left-aligned, dark card bg
- Streaming: tokens appear word-by-word with typing cursor animation
- Typing indicator: 3 dots pulsing animation while AI processes
- Code blocks: syntax highlighted with copy button
- Task suggestions: inline action buttons ("Create this task", "Add to project")

**Input Area:**
- Full-width textarea at bottom (auto-grow to max 4 lines)
- Send button (gold accent)
- Quick actions: "Schedule my day", "Analyze my week", "Suggest tasks"
- Voice input button (future)

Sources: [AI UI Design Patterns](https://www.patterns.dev/react/ai-ui-patterns/), [Design Patterns for AI Interfaces (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/), [Chat UI Design Patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn)

### 14.2 AI Capabilities (via Claude API)

- Smart scheduling: "When should I do this task?"
- Weekly review: "How was my week?"
- Task breakdown: "Break down 'Launch marketing campaign' into subtasks"
- Pattern analysis: "What time am I most productive?"
- Context-aware: Has access to user's tasks, projects, and progress data

---

## 15. GAMIFICATION DASHBOARD

### 15.1 Elements

**XP System:**
- Current XP with progress bar to next level
- XP gain animation: +10 floats up from completed task, gold particles
- Level badge with tier color (Bronze 1-10, Silver 11-25, Gold 26-50, Platinum 51-100)

**Streak Counter:**
- Flame icon with current streak count
- Streak calendar (mini heatmap of last 30 days)
- Streak milestone celebrations (7, 14, 30, 60, 100, 365 days)
- "Freeze" indicator if user has a streak freeze active

**Achievements:**
- Grid of achievement cards
- Locked: greyscale with lock icon
- Unlocked: full color with unlock date, gold border glow
- Categories: Consistency, Productivity, Social, Exploration, Mastery

**Leaderboard:**
- Weekly/monthly/all-time tabs
- User's rank highlighted
- Top 10 with avatar, name, XP
- "You vs. friends" toggle
- Optional anonymized display for privacy

Sources: [Gamification in Productivity Apps](https://trophy.so/blog/productivity-gamification-examples), [Best Task Management Gamification Apps 2026](https://yukaichou.com/lifestyle-gamification/the-top-ten-gamified-productivity-apps/), [Gamified Dashboard Builder](https://trickle.so/tools/gamified-dashboard-builder)

---

## 16. MULTI-CHANNEL NOTIFICATION HUB

### 16.1 Channel Management Page

The killer feature no competitor has in web form:

```
CHANNELS PAGE:

+-- Connected Channels --------------------------------+
| [WhatsApp]    +91 98765 43210    Active    [Manage]  |
| [Telegram]    @aarav_dev         Active    [Manage]  |
| [Email]       aarav@gmail.com    Active    [Manage]  |
| [Push]        Chrome (Desktop)   Active    [Manage]  |
+------------------------------------------------------+

+-- Available Channels --------------------------------+
| [SMS]         Not connected      [Connect]           |
| [Discord]     Not connected      [Connect]           |
| [Instagram]   Request pending... [Status ...]        |
| [Slack]       Not connected      [Connect]           |
+------------------------------------------------------+

+-- Delivery Preferences ------------------------------+
| Default channel: [WhatsApp]                          |
| Escalation chain: WhatsApp -> SMS -> Push -> Email   |
| Quiet hours: 10:00 PM - 7:00 AM                     |
| Delivery report: Show in dashboard [toggle]          |
+------------------------------------------------------+

+-- Recent Deliveries ---------------------------------+
| 10:00 AM  "Team standup"     WhatsApp  Delivered     |
|  9:30 AM  "Code review"      Telegram  Delivered     |
|  9:00 AM  "Morning routine"  Push      Read          |
|  8:30 AM  "Standup prep"     WhatsApp  Failed        |
|           Fallback: SMS       SMS       Delivered     |
+------------------------------------------------------+
```

Sources: [Notifo Multi-Channel Notification Service](https://github.com/notifo-io/notifo), [Muvi Multi-Channel Notification System](https://www.muvi.com/one/features/multi-channel-notification-system/), [SendPulse Multi-Channel Platform](https://sendpulse.com/)

### 16.2 Channel Connection Wizards

Each channel has a multi-step connection wizard:
1. **WhatsApp**: Enter phone -> receive OTP -> verify -> connected
2. **Telegram**: Click link -> opens Telegram bot -> /start -> verify token
3. **Email**: Pre-filled from auth -> send verification email -> click link
4. **SMS**: Enter phone -> receive OTP -> verify
5. **Discord**: OAuth -> select server -> select channel -> connected
6. **Instagram**: "Friend First" flow -> follow page -> accept follow-back -> DM enabled
7. **Slack**: OAuth -> select workspace -> select channel -> connected
8. **Push**: Browser permission prompt -> store FCM token

---

## 17. MICRO-INTERACTIONS & ANIMATION SYSTEM

### 17.1 Animation Tokens

```css
/* Duration */
--duration-instant: 100ms   (hover, focus)
--duration-quick:   150ms   (menu open, tooltip)
--duration-normal:  200ms   (sidebar collapse, panel slide)
--duration-slow:    300ms   (page transition, modal)
--duration-slower:  500ms   (progress ring fill, chart)
--duration-slowest: 1200ms  (dashboard load animations)

/* Easing */
--ease-default:    cubic-bezier(0.4, 0, 0.2, 1)    (material standard)
--ease-in:         cubic-bezier(0.4, 0, 1, 1)
--ease-out:        cubic-bezier(0, 0, 0.2, 1)
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1) (overshoot for celebratory)
```

### 17.2 Specific Animations

| Interaction | Animation | Duration | Easing |
|---|---|---|---|
| Task complete checkbox | Scale 0.8 -> 1.1 -> 1.0 + fill color | 300ms | spring |
| Task row appear | fadeIn + slideUp 8px | 200ms | ease-out |
| Task row delete | slideLeft + fadeOut | 200ms | ease-in |
| XP gain | +N floats up + fades | 1500ms | ease-out |
| Streak milestone | Confetti particles (30 particles) | 2000ms | gravity |
| Level up | Full-screen gold burst + badge | 3000ms | spring |
| Sidebar collapse | width 256 -> 64 + label fadeOut | 200ms | ease-default |
| Command palette open | scale 0.95 -> 1.0 + fadeIn | 150ms | spring |
| Detail panel slide | translateX 100% -> 0% | 200ms | ease-out |
| Stats card hover | translateY -2px + shadow increase | 200ms | ease-out |
| Progress ring fill | strokeDashoffset animation | 1200ms | ease-out |
| Chart data load | staggered point reveal | 800ms total | ease-out |
| Toast appear | slideInRight + fadeIn | 300ms | spring |
| Toast dismiss | slideOutRight + fadeOut | 200ms | ease-in |
| Skeleton shimmer | gradient sweep left -> right | 1500ms | linear, infinite |
| Theme toggle | crossfade + color transitions | 200ms | ease-default |

### 17.3 Reduced Motion

All animations wrapped in:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 18. RESPONSIVE DESIGN BREAKPOINTS

### 18.1 Breakpoints

```
Mobile:  320px  - 767px   (sidebar hidden, bottom nav, single column)
Tablet:  768px  - 1023px  (sidebar collapsed by default, 2-column grid)
Desktop: 1024px - 1439px  (sidebar expanded, 3-column where applicable)
Wide:    1440px+           (max-width content, extra sidebar info)
```

### 18.2 Layout Adaptations

**Mobile (< 768px):**
- Sidebar becomes a slide-in sheet (left edge swipe or hamburger button)
- Navbar: simplified (hamburger, title, notif bell)
- Dashboard: single column stack
- Task detail: full-screen page (not side panel)
- Command palette: full-width
- Bottom navigation bar: Dashboard, Tasks, Create (+), Channels, Profile

**Tablet (768-1023px):**
- Sidebar collapsed (64px icons-only) by default
- Expand on hamburger click (overlays content)
- Dashboard: 2-column grid
- Task detail: side panel (narrower, 360px)

**Desktop (1024-1439px):**
- Sidebar expanded (256px) by default
- Full 3-panel layout when viewing task detail
- Dashboard: full grid layout

**Wide (1440px+):**
- Content max-width: 1200px, centered
- Sidebar can show additional info (upcoming task count, etc.)

---

## 19. FILE STRUCTURE & MODULE MAP

### 19.1 Complete File Tree

```
apps/web-client/
  package.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  .env.local.example
  .eslintrc.json
  public/
    favicon.ico
    manifest.json
    icons/
      (PWA icons)
  src/
    app/
      layout.tsx                      # Root layout (html, body, providers)
      (auth)/
        login/
          page.tsx                    # Login page
        callback/
          page.tsx                    # Logto callback handler
        layout.tsx                    # Auth layout (centered, no sidebar)
      (dashboard)/
        layout.tsx                    # Authenticated layout (sidebar + navbar)
        page.tsx                      # Dashboard home
        tasks/
          page.tsx                    # All tasks (filterable)
          today/page.tsx              # Today view
          [id]/page.tsx               # Task detail (mobile/direct link)
        projects/
          page.tsx                    # All projects
          [id]/page.tsx               # Project detail
        channels/
          page.tsx                    # Channel management
        progress/
          page.tsx                    # Progress & analytics
        ai-chat/
          page.tsx                    # AI chat interface
        calendar/
          page.tsx                    # Calendar view
        gamification/
          page.tsx                    # XP, achievements, leaderboard
        content/
          page.tsx                    # Daily content & saved quotes
        team/
          page.tsx                    # Team dashboard
          standups/page.tsx           # Standups
          members/page.tsx            # Team members
        settings/
          page.tsx                    # Settings
        profile/
          page.tsx                    # Profile
      api/
        auth/
          sign-in/route.ts            # Initiates Logto sign-in
          callback/route.ts           # Handles Logto callback
          sign-out/route.ts           # Signs out
          user/route.ts               # Returns current user
    components/
      ui/                             # Base UI primitives (23 components)
        button.tsx
        input.tsx
        textarea.tsx
        checkbox.tsx
        badge.tsx
        avatar.tsx
        card.tsx
        dialog.tsx
        dropdown-menu.tsx
        tooltip.tsx
        toast.tsx
        skeleton.tsx
        progress.tsx
        progress-ring.tsx
        separator.tsx
        scroll-area.tsx
        switch.tsx
        tabs.tsx
        popover.tsx
        sheet.tsx
        command.tsx
        kbd.tsx
      layout/                         # Layout components (10 components)
        sidebar.tsx
        sidebar-item.tsx
        sidebar-section.tsx
        sidebar-project.tsx
        sidebar-xp-bar.tsx
        navbar.tsx
        breadcrumb.tsx
        user-menu.tsx
        notification-bell.tsx
        page-container.tsx
      dashboard/                      # Dashboard widgets (7 components)
        stats-card.tsx
        progress-rings.tsx
        completion-chart.tsx
        upcoming-tasks.tsx
        daily-content.tsx
        ai-suggestions.tsx
        channel-status.tsx
      tasks/                          # Task components (6 components)
        task-list.tsx
        task-item.tsx
        task-create.tsx
        task-detail.tsx
        task-priority.tsx
        task-due-date.tsx
      channels/                       # Channel components (3 components)
        channel-card.tsx
        channel-connect.tsx
        delivery-log.tsx
      gamification/                   # Gamification components (4 components)
        xp-display.tsx
        streak-counter.tsx
        achievement-card.tsx
        leaderboard.tsx
      ai/                             # AI components (4 components)
        chat-interface.tsx
        chat-message.tsx
        typing-indicator.tsx
        suggestion-chip.tsx
      providers/                      # Context providers (3 components)
        theme-provider.tsx
        query-provider.tsx
        auth-provider.tsx
    lib/
      api/                            # API layer (10 files)
        client.ts
        types.ts
        tasks.ts
        projects.ts
        progress.ts
        gamification.ts
        channels.ts
        content.ts
        notifications.ts
        teams.ts
      stores/                         # Zustand stores (2 files)
        ui-store.ts
        auth-store.ts
      hooks/                          # Custom hooks (9 files)
        use-tasks.ts
        use-projects.ts
        use-progress.ts
        use-gamification.ts
        use-channels.ts
        use-content.ts
        use-keyboard-shortcuts.ts
        use-media-query.ts
        use-theme.ts
      types/                          # TypeScript types (5 files)
        task.ts
        project.ts
        channel.ts
        gamification.ts
        user.ts
      utils/                          # Utility functions (4 files)
        cn.ts
        date.ts
        priority-colors.ts
        constants.ts
      query-keys.ts                   # TanStack Query key factory
    styles/
      globals.css                     # Global styles with theme tokens
```

**Total: ~95 files** for the complete web client (all batches)
**Batch 1: ~45 files** (scaffold, auth, layout, dashboard, core UI components)

---

## 20. IMPLEMENTATION PHASES & BATCHES

### Batch 1: Scaffold + Auth + Layout (THIS BATCH)
**Estimated effort: 1 session**
1. Project setup (package.json, next.config.ts, tsconfig.json, tailwind.config.ts, postcss)
2. Global styles with UNJYNX theme tokens
3. Utility functions (cn, priority-colors, date helpers, constants)
4. Base UI components (button, input, card, badge, skeleton, avatar, dialog, toast, tooltip, kbd)
5. Theme provider (dark/light with class-based toggling)
6. TanStack Query provider
7. API client (typed fetch with auth headers, error handling)
8. API type definitions (matching backend exactly)
9. Zustand UI store (sidebar, theme, command palette)
10. Sidebar component (full design with all sections)
11. Navbar component (breadcrumb, search trigger, notifications, user menu)
12. Authenticated dashboard layout (sidebar + navbar + content)
13. Login page (branded, Logto redirect)
14. Callback page (Logto auth code exchange)
15. Auth API routes (sign-in, callback, sign-out, user)
16. Dashboard home page with all widgets
17. Query hooks for dashboard data

### Batch 2: Task Management
1. Task list page with filters (status, priority, project, date range)
2. Task item component with inline actions
3. Task creation (inline + command palette + Cmd+N)
4. Task detail panel (slide-in from right)
5. Task editing with optimistic updates
6. Drag-and-drop reordering
7. Bulk operations (select multiple, bulk complete/delete/move)
8. View modes: List, Board (Kanban), Calendar
9. Keyboard shortcuts for task management

### Batch 3: Projects + Command Palette
1. Project list/grid page
2. Project detail with task sections
3. Project creation and editing
4. cmdk command palette integration
5. Fuzzy search across tasks, projects, commands
6. Keyboard shortcut system (global hotkeys)

### Batch 4: Channels + Progress + Content
1. Channel management page
2. Channel connection wizards (all 7 channels)
3. Delivery log with status tracking
4. Progress page (rings, heatmap, trends, insights)
5. Daily content page (categories, save, share)
6. Calendar view with task integration

### Batch 5: Gamification + AI Chat + Team
1. Full gamification dashboard (XP, achievements, leaderboard)
2. AI chat interface with streaming
3. Team dashboard, standups, members
4. Settings page
5. Profile page
6. PWA setup (manifest, service worker, offline)

### Batch 6: Polish + Performance
1. Performance optimization (lazy loading, virtual scrolling, image optimization)
2. E2E tests (Playwright)
3. Accessibility audit (WCAG 2.2 AA)
4. Error boundary handling
5. 404 and error pages
6. SEO optimization
7. Deploy configuration (Vercel/Docker)

---

## 21. QUALITY CHECKLIST

### Before Each Batch Completion:

**Code Quality:**
- [ ] TypeScript strict mode -- zero any types
- [ ] All components < 200 lines (extract sub-components)
- [ ] All files < 400 lines
- [ ] No deep nesting (>3 levels)
- [ ] Proper error handling at all boundaries
- [ ] No hardcoded strings (use constants or config)
- [ ] Immutable patterns (no mutation)

**Design Quality:**
- [ ] Dark mode: all colors verified, no white flashes
- [ ] Light mode: all colors verified, proper contrast
- [ ] WCAG AA contrast ratios pass for all text
- [ ] Focus indicators visible and on-brand
- [ ] Responsive: tested at 320px, 768px, 1024px, 1440px
- [ ] Loading states: skeleton shimmer on every async load
- [ ] Empty states: illustration + message on every list
- [ ] Error states: user-friendly message + retry button
- [ ] Animations: smooth, purposeful, respect prefers-reduced-motion

**Architecture Quality:**
- [ ] Server components used where possible
- [ ] Client components have 'use client' directive
- [ ] TanStack Query for all server state
- [ ] Zustand for all client UI state
- [ ] No prop drilling (use hooks/stores)
- [ ] Type safety: all API responses typed
- [ ] Optimistic updates on mutations

**Brand Consistency:**
- [ ] Fonts: Outfit (headings), DM Sans (body), Bebas Neue (logo), Playfair Display (quotes)
- [ ] Colors: Midnight purple bg, gold accents, violet highlights
- [ ] Shadows: Purple-tinted (matching Flutter app)
- [ ] Border radius: Consistent with design tokens
- [ ] Icons: Lucide only, consistent size/weight

---

## RESEARCH SOURCES

### Market Analysis
- [Todoist vs TickTick Comparison (2026)](https://www.morgen.so/blog-posts/ticktick-vs-todoist) -- Feature comparison
- [Linear vs Asana Developer Tool Analysis](https://get-alfred.ai/compare/linear-vs-asana) -- Workflow comparison
- [SaaS UI Design Trends 2026](https://www.saasui.design/blog/7-saas-ui-design-trends-2026) -- Design trend analysis
- [Todoist UI/UX Critique](https://medium.com/nyc-design/what-todoist-does-well-and-what-could-be-made-better-a-ui-ux-critique-94b18ce111b0) -- Design analysis
- [Todoist vs TickTick (2026)](https://efficient.app/compare/todoist-vs-ticktick) -- Side-by-side comparison
- [Jira vs Linear vs Asana (2026)](https://www.ideaplan.io/compare/jira-vs-linear-vs-asana) -- Product team comparison

### Design & UX Patterns
- [Linear UI Redesign (Part II)](https://linear.app/now/how-we-redesigned-the-linear-ui) -- Sidebar dimming, monochrome
- [Linear Design Refresh](https://linear.app/now/behind-the-latest-design-refresh) -- Calmer interface philosophy
- [Linear Design as SaaS Trend](https://blog.logrocket.com/ux-design/linear-design/) -- Linear design movement
- [The Elegant Design of Linear.app](https://telablog.com/the-elegant-design-of-linear-app/) -- Full design analysis
- [Notion Sidebar UI Breakdown](https://medium.com/@quickmasum/ui-breakdown-of-notions-sidebar-2121364ec78d) -- 224px width, accordion
- [Notion Design Critique](https://medium.com/@yolu.x0918/a-breakdown-of-notion-how-ui-design-pattern-facilitates-autonomy-cleanness-and-organization-84f918e1fa48) -- Progressive disclosure
- [Best Sidebar Menu Designs 2026](https://www.navbar.gallery/blog/best-side-bar-navigation-menu-design-examples) -- Sidebar patterns
- [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1) -- Cmd+K implementation
- [Command Palette Best Practices](https://uxpatterns.dev/patterns/advanced/command-palette) -- Fuzzy search, sections
- [Command K Bars](https://maggieappleton.com/command-bar) -- History and patterns
- [Gamification in Productivity Apps](https://trophy.so/blog/productivity-gamification-examples) -- XP, streaks, leaderboards
- [Gamified Dashboard Builder](https://trickle.so/tools/gamified-dashboard-builder) -- Dashboard gamification
- [AI UI Design Patterns](https://www.patterns.dev/react/ai-ui-patterns/) -- Streaming, typing indicators
- [Design Patterns for AI Interfaces (Smashing Magazine)](https://www.smashingmagazine.com/2025/07/design-patterns-ai-interfaces/) -- Beyond chat UI
- [Chat UI Design Patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn) -- Message layouts
- [Dark Mode Best Practices 2026](https://natebal.com/best-practices-for-dark-mode/) -- CSS variables, contrast
- [Best Shadcn UI Templates 2026](https://designrevision.com/blog/best-shadcn-templates) -- Component patterns

### Technical Architecture
- [Next.js App Router Auth Guide 2026 (WorkOS)](https://workos.com/blog/nextjs-app-router-authentication-guide-2026) -- Server-side auth
- [Logto Next.js App Router Quickstart](https://docs.logto.io/quick-starts/next-app-router) -- OIDC integration
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/guides/authentication) -- DAL pattern, middleware
- [Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices) -- Security best practices
- [Next.js 15 App Router Patterns](https://devglory.com/blog/next-js-15-app-router-patterns-that-actually-work) -- Practical patterns
- [Next.js App Router File Structure (2025)](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3) -- Folder conventions
- [TanStack Query v5 SSR](https://tanstack.com/query/v5/docs/react/guides/ssr) -- Hydration, streaming
- [TanStack Query v5 Advanced SSR](https://tanstack.com/query/v5/docs/react/guides/advanced-ssr) -- Next.js app router
- [TanStack Query Complete Guide](https://medium.com/@learning.anand01/tanstack-query-v5-the-complete-guide-to-mastering-server-state-in-react-cbc1905a3095) -- All patterns
- [State Management 2025: Zustand vs Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k) -- When to use which
- [Zustand vs Jotai Performance 2025](https://www.reactlibraries.com/blog/zustand-vs-jotai-vs-valtio-performance-guide-2025) -- Benchmarks
- [Recharts Documentation](https://recharts.github.io/) -- Chart library reference
- [Best React Chart Libraries 2025](https://blog.logrocket.com/best-react-chart-libraries-2025/) -- Library comparison

### Accessibility
- [WCAG 2.2 Complete Guide 2025](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025) -- All 9 new criteria
- [WCAG 2.2 Compliance Checklist](https://www.allaccessible.org/blog/wcag-22-compliance-checklist-implementation-roadmap) -- Implementation roadmap
- [Focus Indicators Guide](https://vispero.com/resources/managing-focus-and-visible-focus-indicators-practical-accessibility-guidance-for-the-web/) -- Visible focus
- [Color Contrast Accessibility 2025](https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025) -- Contrast ratios
- [Web Accessibility Best Practices 2025](https://www.broworks.net/blog/web-accessibility-best-practices-2025-guide) -- Complete guide

### Performance & PWA
- [Next.js PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps) -- Official Next.js PWA
- [PWA Performance Guide 2026](https://www.digitalapplied.com/blog/progressive-web-apps-2026-pwa-performance-guide) -- Modern PWA strategy
- [Next.js PWA Offline Support](https://blog.logrocket.com/nextjs-16-pwa-offline-support/) -- Service worker setup
- [WebSocket Architecture Best Practices](https://ably.com/topic/websocket-architecture-best-practices) -- Real-time patterns
- [Real-Time Web Apps 2025](https://www.debutinfotech.com/blog/real-time-web-apps) -- WebSocket vs SSE
- [WebSocket Notification Patterns](https://websocket.org/guides/use-cases/notifications/) -- Push delivery

### SaaS Onboarding
- [SaaS Onboarding Best Practices 2026](https://designrevision.com/blog/saas-onboarding-best-practices) -- Reduce churn by 20-50%
- [SaaS Onboarding Flows 2026](https://www.saasui.design/blog/saas-onboarding-flows-that-actually-convert-2026) -- Activation in 60 seconds
- [User Onboarding Best Practices 2026](https://formbricks.com/blog/user-onboarding-best-practices) -- Micro-celebrations
- [SaaS Onboarding Design Guide](https://www.insaim.design/blog/saas-onboarding-best-practices-for-2025-examples) -- Complete checklist

### Multi-Channel Notifications
- [Notifo Multi-Channel Service](https://github.com/notifo-io/notifo) -- Open-source reference
- [Muvi Multi-Channel System](https://www.muvi.com/one/features/multi-channel-notification-system/) -- Dashboard design
- [Unified Messaging Platforms](https://www.tidio.com/blog/unified-messaging-platform/) -- Platform comparison
- [SendPulse Multi-Channel](https://sendpulse.com/) -- Marketing automation reference

---

*Document Version: 1.0*
*Author: Claude Opus 4.6 (1M context)*
*Date: March 23, 2026*
*Project: UNJYNX by METAminds*
*Batch: 1 of 6 -- Project Scaffold + Auth + Layout*
