const fs = require('fs');
const path = require('path');

const content = `

================================================================================
  K. FLUTTER DEVELOPMENT STANDARDS (INLINED)
================================================================================

  Replaces: FLUTTER-BEST-PRACTICES-2026.doc (2904 lines)
  REQUIRED READING for all Flutter developers on this project.

  ─── PERFORMANCE TARGETS ──────────────────────────────────

  Startup: < 1050ms | Memory: < 145MB | Scroll: > 60fps (mid-range)
  120fps on flagship devices with Impeller enabled

  ─── WIDGET REBUILD RULES ──────────────────────────────────

  1. const constructors EVERYWHERE possible (compile-time short-circuit)
  2. Break large build() into small StatelessWidgets (each = rebuild boundary)
  3. Consumer/Selector to scope rebuilds with Riverpod (granular, not entire tree)
  4. ValueListenableBuilder for single-value fine-grained updates
  5. RepaintBoundary for expensive visuals (charts, custom painters, list items)

  ─── LIST PERFORMANCE ──────────────────────────────────

  NEVER ListView(children:[]) — ALWAYS ListView.builder (lazy rendering)
  CustomScrollView + Slivers for complex layouts
  itemExtent for fixed-height items (skip layout calculation)
  ValueKey(item.id) for efficient diffing
  Paginate for 1000+ item lists

  ─── IMAGE LOADING ──────────────────────────────────

  CachedNetworkImage with memCacheWidth/Height + maxWidth/HeightDiskCache
  Precache critical images in initState or provider
  cacheWidth/Height on Image.asset for smaller memory footprint

  ─── MEMORY MANAGEMENT ──────────────────────────────────

  Always dispose controllers/subscriptions in dispose()
  ref.onDispose for Riverpod cleanup (streams, timers, listeners)
  WidgetsBindingObserver for app lifecycle (paused/resumed/detached)
  Cancel ongoing work when widget unmounts

  ─── STARTUP OPTIMIZATION ──────────────────────────────────

  Deferred loading: import 'package:x/y.dart' deferred as feature
  Lazy-initialize services (Riverpod providers are lazy by default)
  Show lightweight splash screen immediately
  Split APK by architecture: --split-per-abi (reduces 30-50%)

  ─── ISOLATES ──────────────────────────────────

  Isolate.run() for one-off heavy computation (JSON parsing, sorting)
  compute() for simple function + input pattern
  Avoid sending large objects between isolates (serialize/send minimal)

  ─── ANIMATION PERFORMANCE ──────────────────────────────────

  Prefer implicit animations (AnimatedContainer, AnimatedSwitcher)
  Explicit for complex/chained (AnimationController + Transitions)
  FadeTransition NOT Opacity (avoids saveLayer overhead)
  Enable Impeller on Android:
    <meta-data android:name="io.flutter.embedding.android.EnableImpeller"
               android:value="true" />

  ─── UI/UX PATTERNS ──────────────────────────────────

  Hero animations: Material wrapper + flightShuttleBuilder
  Skeleton loading: Skeletonizer(enabled:isLoading, child:existingWidget)
  Pull-to-refresh: RefreshIndicator -> ref.invalidate(provider)
  Swipe-to-dismiss: Dismissible with optimistic delete + undo SnackBar (4s)
  Haptic feedback:
    lightImpact (toggles), mediumImpact (complete),
    heavyImpact (delete), selectionClick (picker)
  Adaptive layouts: LayoutBuilder breakpoints
    >=1200 desktop, >=600 tablet, else mobile
  Adaptive nav: NavigationBar (mobile), NavigationRail (tablet/desktop)
  Theming: ColorScheme.fromSeed + adaptive_theme for persistence

  ─── RIVERPOD 3.x PATTERNS ──────────────────────────────────

  @riverpod for ALL new providers. Legacy patterns removed.
  Key changes: unified Ref, auto-dispose default, Mutations, auto-retry
  Patterns:
    Simple: @riverpod function (FutureProvider/Provider)
    Notifier: @riverpod class XNotifier extends _$XNotifier (AsyncNotifier)
    Family: constructor args on notifier class
  Optimistic updates: update state immediately, rollback on catch
  Mutations: track side-effect state (idle/pending/success/error) in UI
  Automatic retry: Global via ProviderScope(retry:), per-provider via
    @Riverpod(retry:). Exponential backoff. Don't retry auth errors.
  Offline persistence: persist(storage, key, encode, decode) in build()
  GoRouter: @riverpod GoRouter router(Ref ref) watching authState,
    redirect logic for auth/splash/home
  Scoping: features depend on core NEVER on other features.
    Core never depends on features.
  Testing: ProviderContainer.test() for unit,
    ProviderScope(overrides:[]) for widget tests

  ─── OFFLINE-FIRST (Drift) ──────────────────────────────────

  Architecture: UI -> State -> Repository -> Local DB -> Sync Engine -> API
  SyncQueue table: entityType, entityId, action(CREATE|UPDATE|DELETE),
    payload(JSON), retryCount, status(pending)
  DAO: reactive .watch() queries, transactional writes to SyncQueue
  Batch: batch((b) => b.insertAllOnConflictUpdate(table, items))
  Encryption: sqlcipher_flutter_libs, PRAGMA key='encryption-key'
  Migration testing: SchemaVerifier, verifier.verifyAll()
  SyncEngine: Timer.periodic(30s) + connectivity listener
    processSyncQueue: get pending -> send to API -> mark synced/failed (max 5)
  Conflict: field-level LWW, compare per-field updatedAt, newer wins
  Connectivity: connectivity_plus, Stream<bool> provider
  Background sync: WorkManager registerPeriodicTask(15min, networkRequired)
  iOS: BGTaskSchedulerPermittedIdentifiers

  ─── NOTIFICATIONS (awesome_notifications) ──────────────────────────

  Channels: todo_reminders(High), habit_reminders(High),
    sync_status(Low, silent), collaboration(Default)
  Actions: onActionReceived (deep link + buttons)
  Buttons: COMPLETE (SilentBackgroundAction), SNOOZE 15m (SilentBackground)
  Local scheduling:
    One-time: NotificationCalendar.fromDate(preciseAlarm:true, allowWhileIdle:true)
    Recurring: NotificationCalendar(hour, minute, repeats:true)
  Limits: iOS max 64, Android max 500
  Permission: show explanation dialog FIRST, then request. Handle denied.
  FCM: AwesomeNotificationsFcm with @pragma("vm:entry-point") handlers
    Silent data -> trigger sync, FCM token -> register with server

  ─── MONOREPO (Melos + Dart Workspaces) ──────────────────────────

  Structure:
    apps/unjynx_app
    packages/core/{domain, database, network, ui, utils}
    packages/features/{todo_list, ...}
    packages/services/{notifications, sync, auth}
  Melos scripts: analyze, format, test, test:changed(--since=origin/main),
    generate(--depends-on=build_runner), clean:deep, coverage
  Root pubspec.yaml: workspace: [all package paths]
  RULES: features -> core (never features -> features), core never -> features
  CI: melos exec --since=origin/main (delta testing: only changed packages)

  ─── CODE GENERATION ──────────────────────────────────

  Freezed: domain models + union types + DTOs
  NOT for: simple 1-2 field configs or Drift companions
  build.yaml: generate_for per builder to limit scope:
    freezed: lib/core/domain/models/**/*.dart, lib/features/**/models/
    json_serializable: lib/core/network/dto/**/*.dart
    riverpod_generator: lib/**/providers/**/*.dart
    drift_dev: lib/core/database/**/*.dart
    mockito: test/mocks/generate_mocks.dart (consolidate)
  Result: build time drops from 42s to <15s. Watch mode usable.
  Commands: build --delete-conflicting-outputs, watch

  ─── SECURITY ──────────────────────────────────

  Secure storage: flutter_secure_storage
    Android: encryptedSharedPreferences:true
    iOS: accessibility:first_unlock_this_device
    Store: auth/refresh tokens, DB encryption key
    NEVER: SharedPreferences, hardcoded, assets
  Certificate pinning: SHA-256 fingerprint in badCertificateCallback
  Obfuscation: --obfuscate --split-debug-info=build/debug-info/{platform}
    Save symbols for crash reporting!
  ProGuard: Keep Flutter/Firebase/WorkManager/SQLCipher/model classes
    R8 full mode: ~30% APK reduction
  Biometric: local_auth, authenticate(stickyAuth:true, biometricOnly:false)
    iOS: NSFaceIDUsageDescription. Android: USE_BIOMETRIC
  WebSocket: Always WSS, never WS. Bearer token in headers. pingInterval 30s.
  Input validation: sanitize HTML, max lengths, email regex in validators


================================================================================
  L. PRICING STRATEGY (INLINED)
================================================================================

  Replaces: PRICING-RESEARCH.doc (1212 lines)
  NO LIFETIME PLAN — negative LTV after 18 months.

  ─── COMPETITOR MATRIX ──────────────────────────────────

  Todoist:   Free / Pro $7/mo ($5/mo annual) / Biz $10/u/mo ($8 annual)
  TickTick:  Free / Premium $2.79/mo ($27.99/yr)
  Notion:    Free / Plus $12/seat/mo ($10 annual) / Biz $28/seat
  Slack:     Free / Pro $8.75/u/mo ($7.25 annual) / Biz+ $12.50/u
  Things 3:  $49.99 one-time (Mac $49.99, iPad $19.99, iPhone $9.99)
  Any.do:    Free / Premium $7.99/mo ($4.99 annual)
  Motion:    $34/mo ($29 annual) — AI scheduling premium positioning
  Asana:     Free / Starter $13.49/u/mo ($10.99 annual) / Adv $30.49/u

  ─── UNJYNX PRICING (3 Tiers + Enterprise) ──────────────────

  US PRICING:
    FREE:
      Unlimited tasks, 5 projects, push notifications only,
      1 daily content category, basic insights, Ghost Mode
    PRO (personal):
      Monthly: $6.99/mo | Annual: $4.99/mo ($59.88/yr) | Save 29%
      Unlimited projects, all notification channels,
      WhatsApp 200/mo, SMS 50/mo, Email 500/mo, Telegram unlimited,
      full daily content (10 categories), AI suggestions (v2),
      analytics, Game Mode, calendar view, Kanban, time blocking
    BUSINESS (team):
      Monthly: $8.99/user/mo | Annual: $6.99/user/mo ($83.88/yr)
      Everything in Pro + team features, shared projects,
      task assignment, team analytics, API access, priority support
    ENTERPRISE: Contact sales
      SSO/SAML, custom integrations, dedicated support, SLA, unlimited

  INDIA PRICING (~76% off US, matches Spotify/YouTube strategy):
    PRO: Rs 149/mo | Rs 99/mo annual (Rs 1,188/yr)
    BUSINESS: Rs 199/user/mo | Rs 149/user/mo annual
    Rationale: Spotify India Rs 139-199, Netflix Mobile Rs 149,
      YouTube Premium ~Rs 129. "Less than your daily chai."

  EUROPE PRICING (EUR parity with USD + VAT included):
    PRO: EUR 6.99/mo | EUR 4.99/mo annual
    BUSINESS: EUR 8.99/u/mo | EUR 6.99/u/mo annual
    UK: GBP 4.99/mo (Pro annual), GBP 6.99/u/mo (Business annual)

  FAMILY PLAN: $9.99/mo US | Rs 249/mo India (up to 5 members)

  CURRENCIES SUPPORTED:
    Launch: USD, INR, EUR, GBP
    Later: AUD, CAD, SEK, NOK, DKK, PLN, CHF, BRL

  ─── CHANNEL QUOTAS BY TIER ──────────────────────────────────

  FREE: Push only, no external channels
  PRO: WhatsApp 200/mo, SMS 50/mo, Email 500/mo,
    Telegram unlimited, Push unlimited
  BUSINESS: WhatsApp 500/u/mo, SMS 200/u/mo, Email unlimited, all channels
  Message add-ons: WhatsApp +50/day for Rs 49/mo (power users)

  ─── CONVERSION STRATEGY ──────────────────────────────────

  14-day Pro trial on signup, no CC required, revert to Free after
  Show soft paywall on first app open (82% of trials start day 1)
  Default annual pricing on pricing page, monthly as secondary
  "Save 29%" badge on annual option
  Don't offer annual until 6-12 months retention data exists

  EXPECTED RATES:
    Global: 3-5% freemium-to-paid (target 5% at maturity)
    India: 1-2% (volume compensates)
    Trial-to-paid: 10-15% with good onboarding

  ─── KEY METRICS TO TRACK ──────────────────────────────────

  Conversion rate (Free->Paid) by region, trial start rate,
  trial-to-paid rate, monthly vs annual mix, churn by plan/region,
  LTV by region/plan, CAC by channel, LTV:CAC ratio (target 3:1+),
  revenue per user, expansion revenue

  PAYMENT INTEGRATION:
    RevenueCat (purchases_flutter) → Apple App Store + Google Play
    India: Razorpay for direct web payments (UPI, cards, net banking)
    Global: Stripe for web payments
    Webhook: RevenueCat events -> /webhooks/inbound/revenuecat


================================================================================
  M. DESIGN SYSTEM & COLOR PALETTES (INLINED)
================================================================================

  Replaces: LIGHT-MODE-DESIGN-RESEARCH.doc (1021 lines)
  Three modes: Light, Dark, Midnight Black (AMOLED)
  Brand: Midnight Purple (#1A0533) + Electric Gold (#FFD700)

  ─── LIGHT MODE PALETTE ──────────────────────────────────

  Background:         #F8F5FF (warm purple off-white, NOT pure white)
  Surface hierarchy (5 levels):
    surfaceContainerLowest:  #FFFFFF
    surfaceContainerLow:     #F3EEFF
    surfaceContainer:        #EDE6FF
    surfaceContainerHigh:    #E8DEFF
    surfaceContainerHighest: #E2D8F5

  Text:
    Primary:   #1A0533 (brand purple AS text, 18.5:1 contrast — WCAG AAA)
    Secondary: #4A3D5C (9.2:1 — WCAG AAA)
    Tertiary:  #786C8A (5.1:1 — WCAG AA)
    Disabled:  #ADA4B8 (3.0:1 — decorative)

  Purple accents:
    primary: #6B21A8 | onPrimary: #FFFFFF
    primaryContainer: #F3E8FF | onPrimaryContainer: #2D0A4E
    secondary: #7E57C2 | secondaryContainer: #EDE0FF
    tertiary: #9C27B0 | tertiaryContainer: #F5DCFF

  Gold system (light mode — contrast-safe):
    gold:          #B8860B (decorative)
    goldVivid:     #D4A017 (buttons/badges)
    goldText:      #8B6914 (7.1:1 on white — WCAG AAA)
    goldSurface:   #FFF8E1 (background tint)
    goldContainer: #FFECB3 (chip/tag background)
    goldBorder:    #DAA520 (input borders)
    goldIcon:      #C8960C (icon color)

  Semantic colors:
    success: #16A34A / container: #DCFCE7
    warning: #B45309 / container: #FEF3C7
    error:   #DC2626 / container: #FEE2E2
    info:    #2563EB / container: #DBEAFE

  Shadows: Purple-tinted rgba(26, 5, 51, 0.08/0.06/0.14)
  Outline: #79747E | outlineVariant: #CAC4D0
  Nav: active #6B21A8, inactive #79747E, bg #F3EEFF, indicator #E8DEFF

  ─── DARK MODE PALETTE ──────────────────────────────────

  Background: #1A0533 (brand midnight purple)
  Surface hierarchy:
    surfaceContainerLowest:  #120226
    surfaceContainerLow:     #1E0840
    surfaceContainer:        #25103D
    surfaceContainerHigh:    #2D1848
    surfaceContainerHighest: #362054

  Text:
    Primary:   #F0E6FF (15.2:1 — WCAG AAA)
    Secondary: #C9B8E0 | Tertiary: #9D8BB5 | Disabled: #6B5D7E

  Purple: primary #D4A3FF, primaryContainer #4A1B7A, secondary #B794E5

  Gold (dark mode — vivid):
    gold: #FFD700 | goldVivid: #FFE44D
    goldText: #FFD700 (11.8:1 — WCAG AAA)
    goldSurface: #2D2200 | goldContainer: #3D2E00
    goldBorder: #FFD700 | goldIcon: #FFE44D

  Semantic: success #4ADE80, warning #FBBF24, error #F87171, info #60A5FA

  ─── MIDNIGHT BLACK (AMOLED) ──────────────────────────────────

  Background: #000000 (pure black — saves battery on OLED)
  Surfaces: #0A0014, #12001F, #1A0033, #22004D
  Text: Primary #F0E6FF, Secondary #C9B8E0
  Gold: same as dark mode

  ─── MATERIAL 3 IMPLEMENTATION ──────────────────────────────────

  Primary: ColorScheme.fromSeed(
    seedColor: Color(0xFF6B21A8),
    dynamicSchemeVariant: DynamicSchemeVariant.fidelity
  )
  Multi-seed: flex_seed_scheme -> SeedColorScheme.fromSeeds(
    primaryKey: purple, secondaryKey: gold, tertiaryKey: magenta
  )
  Three ThemeData objects: lightTheme, darkTheme, midnightTheme
  Persistence: adaptive_theme package
  App: AdaptiveTheme(light:, dark:, initial: system, builder:)

  ─── 10 DESIGN PRINCIPLES ──────────────────────────────────

  1. Purple IS the text (not just accent) — #1A0533 as primary text in light
  2. Gold IS the highlight (not primary) — premium touches, not every element
  3. Warm off-white (#F8F5FF not #FFFFFF) — purple tint, distinctive feel
  4. Fork palettes (don't invert) — each mode independently designed
  5. 5-level surface hierarchy for elevation without shadows
  6. Semantic colors shift per mode (error lighter in dark, darker in light)
  7. Gold contrast: light=#8B6914(7.1:1), dark=#FFD700(11.8:1) — both AAA
  8. Purple-tinted shadows in light mode instead of gray
  9. Nav uses purple as active indicator, neutral gray as inactive
  10. Test ALL colors on BOTH modes during design (not after)

  CONTRAST TARGETS (all met):
    Primary text: >7:1 (light 18.5:1, dark 15.2:1) — WCAG AAA
    Secondary text: >4.5:1 (light 9.2:1, dark 8.1:1) — WCAG AAA
    Gold text: >7:1 (light 7.1:1, dark 11.8:1) — WCAG AAA
    Disabled: ~3:1 (intentionally lower, decorative only)


================================================================================
  N. TERMINOLOGY STANDARDIZATION
================================================================================

  STANDARDIZED TERMS (use consistently throughout codebase):

    Energy Flow Engine — the system that predicts user energy levels
      throughout the day and matches task difficulty to energy peaks/troughs.
      Previously also called "Habit DNA" in some docs. Use "Energy Flow Engine"
      everywhere. "Habit DNA" is retired.

    Ghost Mode — ultra-minimal mode showing only one task. NOT "Focus Mode"
      or "Zen Mode". Always "Ghost Mode".

    Friend First — Instagram connection approach where UNJYNX follows user
      first, user accepts, then messages. NOT "follow-first" or "mutual follow".

    Plugin-Play Architecture — our architectural pattern combining
      Feature-First + Hexagonal + Event-Driven. NOT "microservices" or "monolith".

    Energy Flow Engine — replaces all instances of "Habit DNA Analysis"
      in the codebase and documentation.

  RETIRED TERMS (do NOT use):
    - Habit DNA (use "Energy Flow Engine")
    - Lifetime plan (removed — negative LTV)
    - Supabase (blocked in India, removed from stack)
    - Firebase (blocked in India, removed from stack)
    - Isar/Hive (abandoned packages, we use Drift)


================================================================================
  END OF PART V — INLINED COMPANION REFERENCES
================================================================================

  With Parts I-V complete, this document is fully self-contained.
  The only external reference needed is:
    app-structure/README.md — the UI/UX source of truth (2905 lines)

  All other .doc files can be safely deleted. Their knowledge has been
  preserved in this document.

  FINAL DOCUMENT STATISTICS:
    Part I:   Phase Plan (Phases 1-5 + v2 Phases 1-5)
    Part II:  Detailed Screen Specifications (47 screens)
    Part III: Cross-Cutting References (DSA, Testing, DevOps, Tools)
    Part IV:  Missing Systems (Sync, Admin, Analytics, Notifications, Content)
    Part V:   Inlined Companion References (API, DB, ML, Flutter, Pricing, Design)

  Source of Truth: app-structure/README.md (screen definitions)
  Implementation Guide: This document (everything else)
`;

const outFile = path.join(__dirname, 'EXPANSION-REFS-P2.doc');
fs.writeFileSync(outFile, content, 'utf-8');
console.log('EXPANSION-REFS-P2.doc written. Lines:', content.split('\n').length);
