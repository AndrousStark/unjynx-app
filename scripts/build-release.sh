#!/usr/bin/env bash
# =============================================================================
# Release Build Script for UNJYNX
# =============================================================================
# Builds production-ready AAB (Play Store) and split APKs (sideloading).
# Uses 8.3 short paths for Windows compatibility (no spaces).
#
# Usage:
#   bash scripts/build-release.sh [aab|apk|all]
#
# Options:
#   aab   Build only the App Bundle (Play Store upload)
#   apk   Build only split-per-ABI APKs (sideloading)
#   all   Build both (default)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 8.3 Short Paths (Windows-safe)
# ---------------------------------------------------------------------------
SHORT_ROOT="C:/Users/SAVELI~1/Downloads/personal/PROJEC~1"
FLUTTER="C:/Users/SAVELI~1/development/flutter/bin/flutter"
DART="C:/Users/SAVELI~1/development/flutter/bin/dart"
MOBILE_DIR="${SHORT_ROOT}/apps/mobile"
SYMBOLS_DIR="build/symbols/android"

export JAVA_HOME="C:/Program Files/Microsoft/jdk-17.0.18.8-hotspot"

# ---------------------------------------------------------------------------
# Build target selection
# ---------------------------------------------------------------------------
BUILD_TARGET="${1:-all}"

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
# Pre-flight checks
# ---------------------------------------------------------------------------
info "UNJYNX Release Build"
echo -e "${BOLD}==============================${NC}"
echo "  Target:  ${BUILD_TARGET}"
echo "  Root:    ${SHORT_ROOT}"
echo "  Mobile:  ${MOBILE_DIR}"
echo ""

cd "${MOBILE_DIR}"

# Clean previous symbols
mkdir -p "${SYMBOLS_DIR}"

# Ensure dependencies are up to date
info "Running flutter pub get..."
"${FLUTTER}" pub get --suppress-analytics 2>&1

echo ""

# ---------------------------------------------------------------------------
# Shared build flags
# ---------------------------------------------------------------------------
# --obfuscate          : Minify Dart symbol names (smaller + harder to RE)
# --split-debug-info   : Extract debug symbols (required for obfuscation)
# --tree-shake-icons   : Remove unused Material/Cupertino icons
# --dart-define=ENV    : Compile-time environment flag
COMMON_FLAGS=(
  --release
  --flavor prod
  --obfuscate
  "--split-debug-info=${SYMBOLS_DIR}"
  --tree-shake-icons
  --dart-define=ENV=production
  --dart-define=API_BASE_URL=https://api.unjynx.me
  --dart-define=LOGTO_ENDPOINT=https://auth.unjynx.me
  --dart-define=LOGTO_APP_ID=unjynx-mobile
  --dart-define=SENTRY_DSN=${SENTRY_DSN:-}
)

# ---------------------------------------------------------------------------
# Build AAB (App Bundle for Play Store)
# ---------------------------------------------------------------------------
build_aab() {
  info "Building release AAB (App Bundle)..."
  echo ""

  "${FLUTTER}" build appbundle "${COMMON_FLAGS[@]}" 2>&1

  AAB_PATH="${MOBILE_DIR}/build/app/outputs/bundle/prodRelease/app-prod-release.aab"

  echo ""
  if [[ -f "${AAB_PATH}" ]]; then
    AAB_SIZE=$(stat -c%s "${AAB_PATH}" 2>/dev/null || wc -c < "${AAB_PATH}" | tr -d ' ')
    ok "AAB built: $(human_size "${AAB_SIZE}")"
    info "Path: ${AAB_PATH}"
  else
    fail "AAB file not found at expected path."
    fail "Check build output above for errors."
    return 1
  fi
  echo ""
}

# ---------------------------------------------------------------------------
# Build split APKs (per-ABI, for sideloading / testing)
# ---------------------------------------------------------------------------
build_apk() {
  info "Building release APKs (split per ABI)..."
  echo ""

  "${FLUTTER}" build apk --split-per-abi "${COMMON_FLAGS[@]}" 2>&1

  APK_DIR="${MOBILE_DIR}/build/app/outputs/flutter-apk"

  echo ""
  echo -e "${BOLD}--- APK Sizes ---${NC}"

  local found=0
  for abi in arm64-v8a armeabi-v7a x86_64; do
    APK_FILE="${APK_DIR}/app-prod-${abi}-release.apk"
    if [[ -f "${APK_FILE}" ]]; then
      APK_SIZE=$(stat -c%s "${APK_FILE}" 2>/dev/null || wc -c < "${APK_FILE}" | tr -d ' ')
      echo "  ${abi}:  $(human_size "${APK_SIZE}")  ${APK_FILE}"
      found=$((found + 1))
    fi
  done

  if (( found == 0 )); then
    fail "No split APK files found."
    return 1
  fi

  echo ""
}

# ---------------------------------------------------------------------------
# Execute builds
# ---------------------------------------------------------------------------
case "${BUILD_TARGET}" in
  aab)
    build_aab
    ;;
  apk)
    build_apk
    ;;
  all)
    build_aab
    build_apk
    ;;
  *)
    fail "Unknown target: ${BUILD_TARGET}"
    echo "Usage: $0 [aab|apk|all]"
    exit 1
    ;;
esac

# ---------------------------------------------------------------------------
# Symbol upload reminder
# ---------------------------------------------------------------------------
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Post-Build Checklist${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""
echo "  1. Debug symbols saved to: ${MOBILE_DIR}/${SYMBOLS_DIR}"
echo "     Upload to Sentry for crash symbolication:"
echo ""
echo "       sentry-cli debug-files upload \\"
echo "         --org metaminds \\"
echo "         --project unjynx-mobile \\"
echo "         ${MOBILE_DIR}/${SYMBOLS_DIR}"
echo ""
echo "  2. For Play Store upload (AAB):"
echo "     - Open Google Play Console"
echo "     - Upload build/app/outputs/bundle/release/app-release.aab"
echo "     - Also upload native debug symbols from ${SYMBOLS_DIR}"
echo ""
echo "  3. For direct APK distribution:"
echo "     - arm64 APK is the primary (most modern devices)"
echo "     - armeabi-v7a APK covers older 32-bit devices"
echo "     - x86_64 APK is for emulators / Chromebooks"
echo ""
echo "  4. Verify with:"
echo "     bash scripts/apk-size-analysis.sh --skip-build"
echo ""
ok "Release build complete."
