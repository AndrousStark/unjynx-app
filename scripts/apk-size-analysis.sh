#!/usr/bin/env bash
# =============================================================================
# APK Size Analysis Script for UNJYNX
# =============================================================================
# Builds a release APK with --analyze-size, parses the JSON report, and checks
# against target budgets. Uses 8.3 short paths for Windows compatibility.
#
# Usage:
#   bash scripts/apk-size-analysis.sh [--skip-build]
#
# Options:
#   --skip-build   Skip the flutter build step and only analyze the most recent
#                  size report JSON already on disk.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 8.3 Short Paths (Windows-safe: no spaces)
# ---------------------------------------------------------------------------
SHORT_ROOT="C:/Users/SAVELI~1/Downloads/personal/PROJEC~1"
FLUTTER="C:/Users/SAVELI~1/development/flutter/bin/flutter"
DART="C:/Users/SAVELI~1/development/flutter/bin/dart"
MOBILE_DIR="${SHORT_ROOT}/apps/mobile"

export JAVA_HOME="C:/Program Files/Microsoft/jdk-17.0.18.8-hotspot"

# ---------------------------------------------------------------------------
# Size budgets (bytes)
# ---------------------------------------------------------------------------
TARGET_ARM64_BYTES=$((15 * 1024 * 1024))   # 15 MB
TARGET_UNIVERSAL_BYTES=$((20 * 1024 * 1024)) # 20 MB
ASSET_WARN_BYTES=$((100 * 1024))            # 100 KB per asset

# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }

# ---------------------------------------------------------------------------
# Human-readable size
# ---------------------------------------------------------------------------
human_size() {
  local bytes=$1
  if (( bytes >= 1048576 )); then
    echo "$(awk "BEGIN {printf \"%.2f\", $bytes / 1048576}") MB"
  elif (( bytes >= 1024 )); then
    echo "$(awk "BEGIN {printf \"%.1f\", $bytes / 1024}") KB"
  else
    echo "${bytes} B"
  fi
}

# ---------------------------------------------------------------------------
# Step 1: Build release APK with size analysis
# ---------------------------------------------------------------------------
SKIP_BUILD=false
if [[ "${1:-}" == "--skip-build" ]]; then
  SKIP_BUILD=true
fi

if [[ "$SKIP_BUILD" == false ]]; then
  info "Building release APK with size analysis (arm64)..."
  info "Working directory: ${MOBILE_DIR}"
  echo ""

  cd "${MOBILE_DIR}"

  "${FLUTTER}" build apk --release \
    --analyze-size \
    --target-platform android-arm64 \
    --tree-shake-icons \
    --obfuscate \
    --split-debug-info=build/symbols/android 2>&1 | tee build/size-analysis-log.txt

  echo ""
  ok "Build complete."
else
  info "Skipping build (--skip-build flag). Using existing report."
fi

# ---------------------------------------------------------------------------
# Step 2: Locate the size analysis JSON
# ---------------------------------------------------------------------------
# Flutter writes to ~/.flutter-devtools/ with a timestamped name.
# On Windows/MSYS the home is typically /c/Users/<name> or $USERPROFILE.
DEVTOOLS_DIR=""
for candidate in \
  "${HOME}/.flutter-devtools" \
  "${USERPROFILE}/.flutter-devtools" \
  "C:/Users/SAVELI~1/.flutter-devtools"; do
  if [[ -d "${candidate}" ]]; then
    DEVTOOLS_DIR="${candidate}"
    break
  fi
done

if [[ -z "${DEVTOOLS_DIR}" ]]; then
  warn "Could not find ~/.flutter-devtools directory."
  warn "The size analysis JSON is written there by Flutter."
  warn "Look for: apk-code-size-analysis_*.json"
  exit 1
fi

# Find the most recent analysis file
REPORT_JSON=$(ls -t "${DEVTOOLS_DIR}"/apk-code-size-analysis_*.json 2>/dev/null | head -1 || true)

if [[ -z "${REPORT_JSON}" || ! -f "${REPORT_JSON}" ]]; then
  warn "No apk-code-size-analysis_*.json found in ${DEVTOOLS_DIR}"
  warn "Run without --skip-build first."
  exit 1
fi

info "Using report: ${REPORT_JSON}"
echo ""

# ---------------------------------------------------------------------------
# Step 3: Parse the JSON report
# ---------------------------------------------------------------------------
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  UNJYNX APK Size Analysis Report${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# Total APK size (from the built file)
APK_PATH="${MOBILE_DIR}/build/app/outputs/flutter-apk/app-release.apk"
if [[ -f "${APK_PATH}" ]]; then
  APK_SIZE=$(stat -c%s "${APK_PATH}" 2>/dev/null || wc -c < "${APK_PATH}" | tr -d ' ')
  echo -e "${BOLD}Total APK size:${NC} $(human_size "${APK_SIZE}")"

  if (( APK_SIZE <= TARGET_ARM64_BYTES )); then
    ok "Within arm64 target (< 15 MB)"
  else
    fail "Exceeds arm64 target (> 15 MB) by $(human_size $((APK_SIZE - TARGET_ARM64_BYTES)))"
  fi
  echo ""
else
  warn "APK file not found at ${APK_PATH} -- skipping size check."
  echo ""
fi

# ---------------------------------------------------------------------------
# Step 4: Top-level breakdown using the JSON
# ---------------------------------------------------------------------------
# The Flutter size analysis JSON has a structure like:
# { "type": "apk", "n": "APK", "value": <total>, "children": [...] }
# Each child has { "n": <name>, "value": <size>, "children": [...] }
#
# We extract top-level children and their sizes.
echo -e "${BOLD}--- Top-Level Breakdown ---${NC}"

"${DART}" run --define=REPORT="${REPORT_JSON}" - <<'DART_SCRIPT'
import 'dart:convert';
import 'dart:io';

void main() {
  // Accept report path from environment or first positional arg
  final reportPath = Platform.environment['REPORT'] ??
      (Platform.script.pathSegments.isNotEmpty
          ? Platform.script.pathSegments.last
          : '');

  if (reportPath.isEmpty) {
    stderr.writeln('No REPORT path provided.');
    exit(1);
  }

  final file = File(reportPath);
  if (!file.existsSync()) {
    stderr.writeln('Report not found: $reportPath');
    exit(1);
  }

  final json = jsonDecode(file.readAsStringSync()) as Map<String, dynamic>;
  final totalValue = json['value'] as int? ?? 0;
  final children = json['children'] as List<dynamic>? ?? [];

  String humanSize(int bytes) {
    if (bytes >= 1048576) return '${(bytes / 1048576).toStringAsFixed(2)} MB';
    if (bytes >= 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '$bytes B';
  }

  String pct(int part, int total) {
    if (total == 0) return '0.0%';
    return '${(part / total * 100).toStringAsFixed(1)}%';
  }

  // Sort children by size descending
  final sorted = List<Map<String, dynamic>>.from(
    children.map((c) => c as Map<String, dynamic>),
  )..sort((a, b) => (b['value'] as int? ?? 0).compareTo(a['value'] as int? ?? 0));

  print('Total: ${humanSize(totalValue)}');
  print('');
  print('${'Component'.padRight(40)} ${'Size'.padLeft(12)} ${'%'.padLeft(8)}');
  print('${'-' * 40} ${'-' * 12} ${'-' * 8}');

  for (final child in sorted.take(10)) {
    final name = child['n'] as String? ?? 'unknown';
    final value = child['value'] as int? ?? 0;
    print('${name.padRight(40)} ${humanSize(value).padLeft(12)} ${pct(value, totalValue).padLeft(8)}');
  }

  // Recursively find large individual entries (assets > 100KB)
  print('');
  print('--- Assets > 100 KB ---');
  void walkTree(Map<String, dynamic> node, String path) {
    final name = node['n'] as String? ?? '';
    final value = node['value'] as int? ?? 0;
    final currentPath = path.isEmpty ? name : '$path/$name';
    final nodeChildren = node['children'] as List<dynamic>?;

    if (nodeChildren == null || nodeChildren.isEmpty) {
      // Leaf node
      if (value > 102400) {
        print('  [!] ${humanSize(value).padLeft(10)}  $currentPath');
      }
    } else {
      for (final child in nodeChildren) {
        walkTree(child as Map<String, dynamic>, currentPath);
      }
    }
  }

  // Walk the "assets" subtree specifically
  for (final child in sorted) {
    final name = (child['n'] as String? ?? '').toLowerCase();
    if (name.contains('asset') || name.contains('res')) {
      walkTree(child, '');
    }
  }

  // Also flag Dart AOT, native libs
  print('');
  print('--- Key Categories ---');
  for (final child in sorted) {
    final name = (child['n'] as String? ?? '').toLowerCase();
    final value = child['value'] as int? ?? 0;
    if (name.contains('dart') || name.contains('lib') || name.contains('native')) {
      print('  ${(child['n'] as String).padRight(35)} ${humanSize(value)}');
    }
  }
}
DART_SCRIPT

echo ""
echo -e "${BOLD}--- Budget Summary ---${NC}"
echo "  arm64 target:     < 15 MB"
echo "  universal target: < 20 MB"
echo "  asset budget:     < 2 MB total"
echo "  per-asset limit:  < 100 KB"
echo ""

# ---------------------------------------------------------------------------
# Step 5: Check for large asset files in source tree
# ---------------------------------------------------------------------------
echo -e "${BOLD}--- Source Asset Scan ---${NC}"
ASSET_WARN_COUNT=0

# Scan for asset files in packages and apps
while IFS= read -r -d '' asset_file; do
  file_size=$(stat -c%s "${asset_file}" 2>/dev/null || wc -c < "${asset_file}" | tr -d ' ')
  if (( file_size > ASSET_WARN_BYTES )); then
    warn "Large asset ($(human_size "${file_size}")): ${asset_file}"
    ASSET_WARN_COUNT=$((ASSET_WARN_COUNT + 1))
  fi
done < <(find "${SHORT_ROOT}/packages" "${SHORT_ROOT}/apps/mobile" \
  -path "*/build" -prune -o \
  -path "*/assets/*" -print0 \
  -o -name "*.png" -print0 \
  -o -name "*.jpg" -print0 \
  -o -name "*.jpeg" -print0 \
  -o -name "*.gif" -print0 \
  -o -name "*.webp" -print0 \
  -o -name "*.svg" -print0 \
  -o -name "*.lottie" -print0 \
  -o -name "*.json" -path "*/assets/*" -print0 \
  -o -name "*.mp3" -print0 \
  -o -name "*.ogg" -print0 \
  -o -name "*.wav" -print0 \
  -o -name "*.otf" -print0 \
  -o -name "*.ttf" -print0 \
  2>/dev/null)

if (( ASSET_WARN_COUNT == 0 )); then
  ok "No oversized source assets found (> 100 KB)."
else
  warn "${ASSET_WARN_COUNT} oversized asset(s) detected."
fi

echo ""
info "Report JSON: ${REPORT_JSON}"
info "Open in DevTools: flutter pub global run devtools --appSizeBase=${REPORT_JSON}"
echo ""
ok "Analysis complete."
