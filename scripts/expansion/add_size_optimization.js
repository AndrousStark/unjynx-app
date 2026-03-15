const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const mainDoc = path.join(projectRoot, 'COMPREHENSIVE-PHASE-PLAN.doc');

const content = fs.readFileSync(mainDoc, 'utf-8');
const lines = content.split('\n');
const linesBefore = lines.length;

// ============================================================================
// INSERTION 1: After Phase 1 COMPLETED block (around line 115)
// Add "SIZE OPTIMIZATION FOUNDATIONS" note
// ============================================================================
const phase1EndMarker = '  ACTION: Run scripts/install-wsl-docker.ps1';
const phase1Insertion = `

  SIZE OPTIMIZATION — ESTABLISHED IN PHASE 1:
  ────────────────────────────────────────────
  Phase 1 establishes the foundation for a lean binary. Key decisions:
  - NO Firebase SDK (saves ~3-5MB) — using awesome_notifications directly
  - NO Isar/Hive (abandoned) — Drift/SQLite is smaller (~3MB vs ~5MB)
  - google_fonts package added to core — fonts download on first use,
    NOT bundled in APK (saves ~500KB-2MB per font family)
  - SVG-first asset strategy — flutter_svg for all icons/illustrations
    (kilobytes, not megabytes like PNG/JPG)
  - Deferred imports enabled from day 1 — feature packages load on demand
  - build.gradle configured: shrinkResources true, minifyEnabled true
  All phases below enforce these constraints.`;

// ============================================================================
// INSERTION 2: In Phase 2 after PREREQUISITES (around line 142)
// Add asset strategy for Phase 2
// ============================================================================
const phase2PrereqMarker = '  - Docker Desktop + WSL2 installed (scripts/install-wsl-docker.ps1)';
const phase2Insertion = `
  - Size Optimization Guide followed (see Part V Section O)

  SIZE OPTIMIZATION — PHASE 2 RULES:
  ────────────────────────────────────────────
  Assets:
  - ALL illustrations/icons: SVG via flutter_svg (NOT PNG/JPG)
  - Animations: Lottie JSON only (5-50KB each), NOT Rive binaries (50-500KB)
  - Compress Lottie files: run lottie-compress on every .json animation
  - Photos (if any): WebP format, max 512px width, quality 80
  - NO bundled fonts — google_fonts downloads only needed glyphs at runtime
  Content:
  - Daily content (quotes, wisdom): fetched from API on first launch,
    cached in Drift locally. ZERO content weight in APK.
  - DO NOT bundle content JSON in assets/ folder
  Deferred Loading:
  - feature_onboarding: deferred import (loaded once, never again)
  - feature_profile: deferred import (low-frequency screen)
  - Only feature_todos and core loaded eagerly at startup`;

// ============================================================================
// INSERTION 3: In Phase 3 after PREREQUISITES
// Add channel-specific size notes
// ============================================================================
const phase3PrereqMarker = '  - Docker stack running (Valkey for BullMQ, Mailpit for email dev)';
const phase3Insertion = `
  - Size Optimization Guide followed (see Part V Section O)

  SIZE OPTIMIZATION — PHASE 3 RULES:
  ────────────────────────────────────────────
  Channel Integrations (ALL backend-side, ZERO APK weight):
  - Telegram Bot API: backend-only (HTTP calls from Hono server)
  - WhatsApp Gupshup: backend-only (REST API)
  - SendGrid Email: backend-only (REST API)
  - MSG91 SMS: backend-only (REST API)
  - Instagram/Slack/Discord: backend-only (webhooks + REST)
  - Push (FCM): awesome_notifications already included, NO firebase_core
  Flutter-side:
  - Channel preference UI: standard Flutter widgets, no new packages
  - Notification settings screens: use existing Material 3 components
  - Channel icons: 8 SVG icons (~2KB each = ~16KB total, NOT PNGs)
  - Deferred: feature_channels package loaded via deferred import
  NET APK IMPACT OF PHASE 3: ~0 KB (all channel logic is backend-side)`;

// ============================================================================
// INSERTION 4: In Phase 4 after PREREQUISITES
// Add gamification + widget size notes
// ============================================================================
const phase4PrereqMarker = '  - At least one external channel working end-to-end';
const phase4Insertion = `
  - Size Optimization Guide followed (see Part V Section O)

  SIZE OPTIMIZATION — PHASE 4 RULES:
  ────────────────────────────────────────────
  Gamification:
  - Achievement badge icons: SVG (NOT PNG sprites or image sheets)
  - Level-up animations: single Lottie JSON (~20-40KB), recolored per level
  - XP/streak flame: animated SVG or tiny Lottie (<10KB), NOT Rive
  - Sound effects: compressed OGG Vorbis (NOT WAV/AIFF)
    Each sound clip: 200ms-2s, mono, 64kbps = ~2-15KB each
    20 sound effects total: ~100-200KB (NOT megabytes)
  Widgets (home_widget package):
  - home_widget adds ~200KB to APK
  - Widget layouts: XML (Android) / SwiftUI (iOS) — rendered natively
  - NO Flutter engine in widgets (avoids ~8MB overhead)
  - Widget data: SharedPreferences bridge, not separate database
  Watch App:
  - Wear OS: native Kotlin Compose (~1-2MB addition to AAB)
  - watchOS: native SwiftUI (~1-2MB addition to IPA)
  - Watch modules delivered via Play Store on-demand delivery (NOT in base APK)
  RevenueCat:
  - purchases_flutter adds ~500KB — acceptable, no alternative
  Deferred Loading:
  - feature_gamification: deferred import
  - feature_billing: deferred import
  - feature_widgets: deferred import (home screen widget config only)
  NET APK IMPACT OF PHASE 4: ~1-2MB (gamification assets + RevenueCat + sounds)`;

// ============================================================================
// INSERTION 5: Replace Phase 5 Task 5.2.3 build commands with optimized version
// ============================================================================
const buildArtifactMarker = '  5.2.3  Build release artifacts:\n         - Android: flutter build appbundle --release (use 8.3 short paths)\n         - iOS: flutter build ipa --release (requires macOS + Xcode)';
const buildArtifactReplacement = `  5.2.3  Build release artifacts (SIZE-OPTIMIZED):
         - Android (AAB for Play Store — auto-splits by ABI/density/language):
           flutter build appbundle --release \\
             --obfuscate \\
             --split-debug-info=build/symbols/android \\
             --tree-shake-icons \\
             --dart-define=FLUTTER_WEB_CANVASKIT_URL=disabled
           (use 8.3 short paths on Windows: cd /d C:\\SAVELI~1\\PROJEC~1)
         - Android (APK for sideloading — split per ABI):
           flutter build apk --release --split-per-abi \\
             --obfuscate \\
             --split-debug-info=build/symbols/android \\
             --tree-shake-icons
           Produces: app-arm64-v8a-release.apk (~14-17MB)
                     app-armeabi-v7a-release.apk (~12-15MB)
                     app-x86_64-release.apk (~15-18MB, emulator only)
         - iOS (IPA for App Store):
           flutter build ipa --release \\
             --obfuscate \\
             --split-debug-info=build/symbols/ios \\
             --tree-shake-icons
           (requires macOS + Xcode)
         - CRITICAL: Save build/symbols/ directory — needed for crash symbolication
           Upload to Sentry: sentry-cli upload-dif build/symbols/`;

// ============================================================================
// INSERTION 6: Replace APK size target in Task 5.3.3
// ============================================================================
const apkSizeMarker = '  5.3.3  APK size: target < 20MB (--split-per-abi, --tree-shake-icons)';
const apkSizeReplacement = `  5.3.3  APK size audit and optimization:
         TARGET: < 15MB arm64 APK | < 20MB universal APK | < 25MB iOS IPA
         Play Store download: ~12-15MB (AAB auto-thinning)
         App Store download: ~20-28MB (App Thinning)
         AUDIT STEPS:
         a) Run: flutter build apk --analyze-size --target-platform android-arm64
            Inspect: build/app-size-analysis/report.json
         b) Identify top 5 largest assets and optimize:
            - Images > 50KB: convert to WebP or SVG
            - Fonts bundled in assets/: remove, use google_fonts runtime download
            - Lottie JSON > 100KB: run lottie-compress, strip unused layers
            - Unused Material icons: verify --tree-shake-icons removed them
         c) Verify build.gradle release config:
            shrinkResources true
            minifyEnabled true
            (R8 full mode enabled by default in Flutter 3.27+)
         d) Check no debug symbols in release: --split-debug-info separates them
         e) Verify deferred loading: feature packages loaded on-demand
         f) Compare against competitor baselines:
            Todoist ~45MB | TickTick ~65MB | Microsoft To Do ~55MB
            UNJYNX target: ~15MB (3-4x leaner than competitors)`;

// ============================================================================
// INSERTION 7: Update Phase 5 summary metrics
// ============================================================================
const launchMetricsMarker = '  - < 20MB APK';
const launchMetricsReplacement = `  - < 15MB APK (arm64) | < 20MB universal | Play Store download ~12-15MB`;

// ============================================================================
// INSERTION 8: In v2 Phase 1 (AI) add ML model size strategy
// ============================================================================
const v2p1ModelMarker = '  v2.1.5.4  Lazy model download on first use (~5MB per model)';
const v2p1ModelReplacement = `  v2.1.5.4  Lazy model download on first use (~5MB per model)
            SIZE STRATEGY: Models are NOT bundled in APK.
            Downloaded via HTTPS on first AI feature use, cached in app data.
            Progressive: download only the model needed (priority prediction first).
            User sees "Downloading AI model..." with progress bar.
            Models stored in getApplicationSupportDirectory() (excluded from backup).
            Total potential download: ~15-20MB (3-4 models), but most users
            only need 1-2 models. APK impact: 0 MB.`;

// ============================================================================
// INSERTION 9: In v2 Phase 2 (Industry Modes) add mode asset strategy
// ============================================================================
const v2p2SummaryMarker = '  v2 PHASE 2 SUMMARY:\n  Testing: 30+ new | Cumulative: ~671';
const v2p2SummaryReplacement = `  SIZE OPTIMIZATION — v2 PHASE 2:
  ────────────────────────────────────────────
  - Mode vocabulary maps: JSON config (~2KB per mode), NOT separate packages
  - Mode templates: stored in PostgreSQL, fetched on mode switch, cached in Drift
  - Mode dashboard widgets: standard Flutter widgets, no new assets per mode
  - Mode-specific icons: recolored SVGs (NOT separate icon packs)
  - NO new packages added — modes are data-driven, not code-driven
  NET APK IMPACT: ~0 KB (all mode content is server-side)

  v2 PHASE 2 SUMMARY:
  Testing: 30+ new | Cumulative: ~671`;

// ============================================================================
// INSERTION 10: In v2 Phase 3 (Advanced Intelligence) add model size strategy
// ============================================================================
const v2p3SummaryMarker = '  On-device: LiteRT models (~5MB each, INT8 quantized)';
const v2p3SummaryReplacement = `  On-device: LiteRT models (~5MB each, INT8 quantized)
  SIZE: Models downloaded on-demand, NOT bundled. APK impact: 0 MB.
    INT8 quantization reduces model size 4x (20MB float32 -> 5MB int8).
    Models cached in app support directory after first download.`;

// ============================================================================
// INSERTION 11: In v2 Phase 5 (Innovation) add AR/voice size notes
// ============================================================================
const v2p5SummaryMarker = '  v2 PHASE 5 SUMMARY:\n  Testing: 20+ new | Cumulative: ~746';
const v2p5SummaryReplacement = `  SIZE OPTIMIZATION — v2 PHASE 5:
  ────────────────────────────────────────────
  - AR (ar_flutter_plugin): ~3-5MB addition. Use Android App Bundle
    on-demand delivery module — AR module downloads only when user
    first accesses AR feature. NOT included in base APK install.
  - Voice (picovoice_flutter): ~2-3MB for wake word model.
    Also delivered via on-demand module, NOT base APK.
  - Health (health package): ~200KB — acceptable, always included.
  - Location (geolocator): ~300KB — acceptable, always included.
  STRATEGY: Use Play Feature Delivery (Android) and On Demand Resources
  (iOS) for AR and Voice modules. Base APK stays at ~15-18MB even with
  all v2 features. Users download AR/Voice only when they use them.

  v2 PHASE 5 SUMMARY:
  Testing: 20+ new | Cumulative: ~746`;

// ============================================================================
// INSERTION 12: After Flutter Development Standards (before Pricing section)
// Add comprehensive Size Optimization Guide as Part V Section O
// ============================================================================
const pricingHeaderMarker = `================================================================================
  L. PRICING STRATEGY (INLINED)
================================================================================`;

const sizeOptGuide = `================================================================================
  O. APP SIZE OPTIMIZATION GUIDE (LEAN BUILD STRATEGY)
================================================================================

  GOAL: Ship every feature at < 15MB APK (arm64) without compromising anything.
  For context: Todoist is ~45MB, TickTick ~65MB, Microsoft To Do ~55MB.
  UNJYNX targets 3-4x leaner than any competitor.

  ─── PRINCIPLE: FEATURES ADD CODE (KB), NOT BINARY WEIGHT (MB) ───────────

  All Dart business logic for 10 phases compiles to ~2-3MB total.
  The bloat comes from: assets, unused libraries, bundled data, and
  wrong build flags. Fix those and the app stays lean forever.

  ─── 1. ASSET OPTIMIZATION (biggest win, ~60% of bloat) ────────────────

  IMAGES:
    ALWAYS SVG via flutter_svg for icons, illustrations, logos.
    Vectors scale infinitely, weigh kilobytes (2-20KB), not megabytes.
    ONLY use raster (WebP) for photos or complex gradients.
    WebP saves 30-50% over PNG with equal or better quality.
    Max dimensions: 512px for thumbnails, 1024px for full-screen.
    Quality: 80 (WebP) — visually lossless, significant size reduction.
    NEVER ship PNG or JPG in assets/ folder.

  ANIMATIONS:
    Lottie JSON files: 5-50KB each (simple UI animations).
    Run lottie-compress on EVERY Lottie file before committing.
    Strip unused layers, masks, and effects in After Effects export.
    Rive binaries: 50-500KB each — AVOID unless Rive-specific features
    needed (state machines, mesh deformation). For simple entrance/exit/
    feedback animations, Lottie is 5-10x smaller.
    Custom animations via AnimationController: 0 KB asset cost.
    flutter_animate: code-only, 0 KB asset cost, preferred for micro-interactions.

  FONTS:
    DO NOT bundle font files in assets/fonts/.
    Use google_fonts package — fonts download only needed glyph subsets
    at runtime, cached locally. Zero font weight in APK.
    google_fonts auto-subsets: if app uses 200 Latin characters,
    it downloads ~15KB instead of the full 200KB+ font file.
    Exception: if offline-first is critical at first launch before
    any network, bundle ONE fallback font (DM Sans Regular, ~40KB).
    All other weights/families: runtime download via google_fonts.

  SOUNDS:
    Format: OGG Vorbis (NOT WAV, NOT AIFF, NOT MP3).
    Mono channel, 64kbps bitrate.
    Duration: 200ms-2s per effect (task complete, level up, etc.).
    Size per clip: ~2-15KB.
    20 sound effects total: ~100-200KB.
    Store in assets/sounds/ — small enough to bundle.

  ICONS:
    Material Symbols Rounded: tree-shaken via --tree-shake-icons.
    Only icons actually referenced in code remain in binary.
    6 custom SVGs (logo, ghost, ring, channels, industry, flame): ~30KB total.
    NEVER use icon image packs (PNG sprite sheets).

  ─── 2. BUILD FLAGS (free size reduction) ────────────────────────────────

  ANDROID RELEASE (AAB for Play Store):
    flutter build appbundle --release \\
      --obfuscate \\
      --split-debug-info=build/symbols/android \\
      --tree-shake-icons

    Play Store App Bundle auto-splits by:
    - ABI (arm64, armeabi-v7a) — user downloads only their architecture
    - Screen density (hdpi, xhdpi, xxhdpi) — user gets only matching assets
    - Language — user gets only their locale strings
    Result: Play Store download ~60% of universal APK size.

  ANDROID RELEASE (APK for sideloading/testing):
    flutter build apk --release --split-per-abi \\
      --obfuscate \\
      --split-debug-info=build/symbols/android \\
      --tree-shake-icons
    Produces per-ABI APKs: arm64 ~14-17MB vs universal ~30-35MB.

  iOS RELEASE:
    flutter build ipa --release \\
      --obfuscate \\
      --split-debug-info=build/symbols/ios \\
      --tree-shake-icons
    App Store Thinning reduces download to ~65-75% of IPA size.

  FLAG BREAKDOWN:
    --obfuscate              : ~5-10% reduction (strips symbol names)
    --split-debug-info       : ~5-15% reduction (moves debug info out)
    --tree-shake-icons       : ~1-3MB reduction (unused icon fonts removed)
    --split-per-abi          : ~40% reduction (single architecture)
    shrinkResources true     : removes unreferenced resources
    minifyEnabled true       : R8 code shrinking (ProGuard successor)

  CRITICAL: Always save build/symbols/ directory.
  Upload to Sentry for crash report symbolication:
    sentry-cli upload-dif build/symbols/android
    sentry-cli upload-dif build/symbols/ios

  ─── 3. DEPENDENCY AUDIT (cut hidden weight) ────────────────────────────

  HEAVY PACKAGES TO AVOID:
    firebase_core + FCM       : ~3-5MB — we use awesome_notifications, skip Firebase
    rive                      : ~1-2MB — use lottie for simple animations
    Full ICU data (intl)      : ~2-4MB — use --no-icu for English-only v1 launch
    firebase_analytics        : ~2-3MB — we use PostHog (web-based, 0 APK cost)
    firebase_crashlytics      : ~1-2MB — we use Sentry (SDK is lighter)
    google_maps_flutter       : ~3-5MB — not needed for v1

  LEAN ALTERNATIVES CHOSEN:
    awesome_notifications     : ~1MB (vs Firebase Messaging ~3MB)
    sentry_flutter            : ~0.5MB (vs Firebase Crashlytics ~2MB)
    posthog_flutter           : ~0.3MB (vs Firebase Analytics ~3MB)
    lottie                    : ~0.2MB (vs rive ~1.5MB)
    flutter_svg               : ~0.1MB (vs bundled PNGs ~2-5MB)

  AUDIT COMMAND (run before every release):
    flutter pub deps --no-dev | grep -E "\\+" | wc -l
    Target: < 80 total dependencies (direct + transitive)
    Compare: flutter build apk --analyze-size --target-platform android-arm64
    Review: build/app-size-analysis/report.json

  ─── 4. DEFERRED LOADING (Dart 3.x) ────────────────────────────────────

  Deferred imports load feature code only when user navigates there.
  This reduces initial download on Play Store (on-demand delivery modules)
  and speeds up cold start time.

  DEFERRED PACKAGES (loaded on first navigation):
    import 'package:feature_onboarding/...' deferred as onboarding;
    import 'package:feature_profile/...' deferred as profile;
    import 'package:feature_channels/...' deferred as channels;
    import 'package:feature_gamification/...' deferred as gamification;
    import 'package:feature_billing/...' deferred as billing;

  EAGER PACKAGES (always loaded at startup):
    import 'package:core/...';           // always needed
    import 'package:feature_todos/...';  // primary feature
    import 'package:service_database/...'; // offline-first requirement
    import 'package:service_auth/...';     // auth check at startup
    import 'package:service_sync/...';     // background sync

  USAGE PATTERN:
    // In go_router route definition:
    GoRoute(
      path: '/onboarding',
      builder: (context, state) {
        return FutureBuilder(
          future: onboarding.loadLibrary(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.done) {
              return onboarding.OnboardingPage();
            }
            return const LoadingScreen(); // lightweight shimmer
          },
        );
      },
    );

  ─── 5. CONTENT STRATEGY (don't bundle, fetch) ──────────────────────────

  10 categories x 300+ entries = 3,000+ content items.
  DO NOT bundle in APK assets. That would add 1-2MB for zero benefit.

  STRATEGY:
    1. Content lives in PostgreSQL (seeded via scripts/seed-content.ts)
    2. On first launch: fetch user's enabled categories from API
    3. Cache in Drift local database (daily_content table)
    4. Background sync refreshes content weekly via WorkManager
    5. Offline: user always has cached content available in Drift
    6. Result: 0 KB content weight in APK, 0 KB content weight in download

  Same strategy for:
    - Industry mode templates (fetched on mode switch)
    - Industry mode vocabulary maps (fetched on mode switch)
    - Achievement/badge definitions (fetched on first gamification access)

  ─── 6. ML MODEL DELIVERY (v2 only) ──────────────────────────────────────

  ML models are NOT bundled in the APK. Ever.

  STRATEGY:
    1. Models hosted on CDN (Cloudflare R2 or MinIO)
    2. Downloaded on first use of each AI feature
    3. INT8 quantization: 4x smaller (20MB float32 -> 5MB int8)
    4. Cached in getApplicationSupportDirectory() (excluded from iCloud/GDrive backup)
    5. User sees: "Downloading AI model..." with progress bar + cancel
    6. Progressive: only download the model needed (priority prediction first)
    7. Most users need 1-2 models (~5-10MB download), not all 4 (~20MB)

  RESULT: APK impact of all ML/AI features = 0 MB

  ─── 7. PLAY FEATURE DELIVERY (v2 Phase 5) ───────────────────────────────

  For large v2 modules (AR, Voice), use platform on-demand delivery:

  ANDROID: Play Feature Delivery
    - Define feature modules in build.gradle as dynamic-feature
    - AR module (~3-5MB): downloads when user first taps AR feature
    - Voice module (~2-3MB): downloads when user enables wake word
    - Base APK stays at ~15-18MB even with all v2 code

  iOS: On Demand Resources (ODR)
    - Tag AR/Voice assets with NSBundleResourceRequest
    - Downloaded from App Store on first access
    - System can purge when storage low (re-downloads if needed)
    - Base IPA stays lean

  ─── 8. PROGUARD/R8 (Android) ────────────────────────────────────────────

  Flutter release builds enable R8 by default since Flutter 3.10.
  Verify in android/app/build.gradle:

    android {
      buildTypes {
        release {
          shrinkResources true   // Remove unreferenced resources
          minifyEnabled true     // R8 code shrinking + optimization
          proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                        'proguard-rules.pro'
        }
      }
    }

  proguard-rules.pro (keep rules for Flutter + dependencies):
    -keep class io.flutter.** { *; }
    -keep class com.dexterous.** { *; }  # awesome_notifications
    -keep class net.sqlcipher.** { *; }  # SQLCipher (Drift encryption)
    -dontwarn io.flutter.embedding.**

  R8 full mode (Flutter 3.27+): ~30% APK reduction over default.

  ─── 9. SIZE BUDGET PER PHASE ────────────────────────────────────────────

  Running APK size budget (arm64, release, with all optimizations):

    After Phase 1: ~10-12MB (skeleton app, basic CRUD, Drift, auth)
    After Phase 2: ~12-14MB (calendar, NLP, content UI, animations)
    After Phase 3: ~12-14MB (channels are backend-side, ~0 KB Flutter)
    After Phase 4: ~14-17MB (gamification assets, sounds, RevenueCat)
    After Phase 5: ~14-17MB (optimized, audited, final release)
    ────────────────────────────────────────────
    v1 LAUNCH TARGET: < 15MB arm64 APK | Play Store download ~12-15MB
    ────────────────────────────────────────────
    After v2 P1:  ~15-17MB (AI SDK ~0.5MB, models downloaded separately)
    After v2 P2:  ~15-17MB (modes are data-driven, ~0 KB)
    After v2 P3:  ~15-17MB (ML models downloaded separately)
    After v2 P4:  ~17-20MB (watch SDK, PWA service worker)
    After v2 P5:  ~17-20MB base (AR/Voice via on-demand delivery)
    ────────────────────────────────────────────
    v2 COMPLETE TARGET: < 20MB base APK | AR/Voice add-ons on-demand

  COMPETITOR COMPARISON (for reference):
    Todoist:        ~45 MB
    TickTick:       ~65 MB
    Microsoft To Do: ~55 MB
    Any.do:         ~50 MB
    Notion:         ~75 MB
    Things 3:       ~30 MB (iOS only, no sync complexity)
    UNJYNX v1:      ~15 MB (3-4x leaner than ANY competitor)

  ─── 10. SIZE AUDIT CHECKLIST (run before every release) ─────────────────

    [ ] flutter build apk --analyze-size --target-platform android-arm64
    [ ] No PNG/JPG in assets/ (all SVG or WebP)
    [ ] No fonts in assets/fonts/ (using google_fonts runtime)
    [ ] No content JSON bundled in assets/ (API-fetched, Drift-cached)
    [ ] Lottie files < 100KB each (lottie-compress applied)
    [ ] --obfuscate flag present in build command
    [ ] --split-debug-info flag present, symbols saved for Sentry
    [ ] --tree-shake-icons flag present
    [ ] build.gradle: shrinkResources true, minifyEnabled true
    [ ] Total dependencies < 80 (flutter pub deps --no-dev)
    [ ] No unused packages (flutter pub outdated, remove unused)
    [ ] Deferred imports for non-critical feature packages
    [ ] ML models NOT in assets/ (downloaded on-demand)
    [ ] Sound files: OGG Vorbis, mono, 64kbps, < 15KB each
    [ ] Release APK tested on mid-range device (4GB RAM, Android 10)


`;

// ============================================================================
// INSERTION 13: Update the "END OF COMPREHENSIVE PHASE PLAN" summary
// ============================================================================
const endSummaryMarker = '  Tests at v1 Launch: 601+';
const endSummaryAfterMarker = '  Tests at v2 Complete: 746+';

// ============================================================================
// Now perform all replacements
// ============================================================================
let result = content;

// 1. Phase 1 size foundations
result = result.replace(phase1EndMarker, phase1EndMarker + phase1Insertion);

// 2. Phase 2 asset rules
result = result.replace(phase2PrereqMarker, phase2PrereqMarker + phase2Insertion);

// 3. Phase 3 channel size notes
result = result.replace(phase3PrereqMarker, phase3PrereqMarker + phase3Insertion);

// 4. Phase 4 gamification size notes
result = result.replace(phase4PrereqMarker, phase4PrereqMarker + phase4Insertion);

// 5. Phase 5 build commands (enhanced)
result = result.replace(buildArtifactMarker, buildArtifactReplacement);

// 6. Phase 5 APK size audit (enhanced)
result = result.replace(apkSizeMarker, apkSizeReplacement);

// 7. Phase 5 summary metrics
result = result.replace(launchMetricsMarker, launchMetricsReplacement);

// 8. v2 Phase 1 ML model strategy
result = result.replace(v2p1ModelMarker, v2p1ModelReplacement);

// 9. v2 Phase 2 mode assets
result = result.replace(v2p2SummaryMarker, v2p2SummaryReplacement);

// 10. v2 Phase 3 model size
result = result.replace(v2p3SummaryMarker, v2p3SummaryReplacement);

// 11. v2 Phase 5 AR/Voice size
result = result.replace(v2p5SummaryMarker, v2p5SummaryReplacement);

// 12. Add Size Optimization Guide as Part V Section O (before Pricing)
result = result.replace(pricingHeaderMarker, sizeOptGuide + '\n' + pricingHeaderMarker);

// 13. Update end summary with new APK target
result = result.replace(
  '  Timeline: v1 Launch Week 22, v2 Complete Week 39+',
  '  v1 APK: < 15MB (arm64) | Play Store ~12-15MB\n  v2 APK: < 20MB base | AR/Voice on-demand\n  Timeline: v1 Launch Week 22, v2 Complete Week 39+'
);

// Verify all replacements happened
const checks = [
  ['Phase 1 size foundations', result.includes('SIZE OPTIMIZATION — ESTABLISHED IN PHASE 1')],
  ['Phase 2 asset rules', result.includes('SIZE OPTIMIZATION — PHASE 2 RULES')],
  ['Phase 3 channel size', result.includes('SIZE OPTIMIZATION — PHASE 3 RULES')],
  ['Phase 4 gamification size', result.includes('SIZE OPTIMIZATION — PHASE 4 RULES')],
  ['Phase 5 build commands', result.includes('SIZE-OPTIMIZED')],
  ['Phase 5 APK audit', result.includes('APK size audit and optimization')],
  ['Phase 5 metrics updated', result.includes('< 15MB APK (arm64)')],
  ['v2P1 model strategy', result.includes('Models are NOT bundled in APK')],
  ['v2P2 mode assets', result.includes('SIZE OPTIMIZATION — v2 PHASE 2')],
  ['v2P3 model size', result.includes('Models downloaded on-demand, NOT bundled')],
  ['v2P5 AR/Voice', result.includes('SIZE OPTIMIZATION — v2 PHASE 5')],
  ['Part V Section O', result.includes('O. APP SIZE OPTIMIZATION GUIDE')],
  ['End summary APK', result.includes('v1 APK: < 15MB')],
];

let allPassed = true;
for (const [name, passed] of checks) {
  if (passed) {
    console.log(`  [OK] ${name}`);
  } else {
    console.log(`  [FAIL] ${name}`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('\nSome replacements FAILED. Not writing file.');
  process.exit(1);
}

fs.writeFileSync(mainDoc, result, 'utf-8');
const linesAfter = result.split('\n').length;

console.log('\nSize optimization content added successfully.');
console.log(`  Before: ${linesBefore} lines`);
console.log(`  After:  ${linesAfter} lines`);
console.log(`  Added:  ${linesAfter - linesBefore} lines`);
console.log(`  Insertions: 13 (across all 10 phases + Part V guide + summary)`);
