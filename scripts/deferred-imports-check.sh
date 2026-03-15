#!/usr/bin/env bash
# =============================================================================
# Deferred Imports Checker for UNJYNX
# =============================================================================
# Checks that feature packages which are NOT needed at app startup use
# deferred imports. This keeps the initial Dart AOT snapshot small and
# reduces first-launch time.
#
# Packages that SHOULD be deferred (not needed until user navigates there):
#   - feature_gamification
#   - feature_billing
#   - feature_widgets
#   - feature_team
#   - feature_import_export
#
# Packages that MUST remain eager (needed at startup):
#   - feature_home (initial screen)
#   - feature_onboarding (first-run screen)
#   - feature_todos (core feature, registered at boot)
#   - feature_projects (core feature, registered at boot)
#   - feature_settings (settings repo needed at boot)
#   - feature_profile (auth provider at boot)
#   - feature_notifications (permission check at boot)
#   - unjynx_core, service_* (infrastructure, always needed)
#
# Usage:
#   bash scripts/deferred-imports-check.sh
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# 8.3 Short Paths (Windows-safe)
# ---------------------------------------------------------------------------
SHORT_ROOT="C:/Users/SAVELI~1/Downloads/personal/PROJEC~1"
MOBILE_LIB="${SHORT_ROOT}/apps/mobile/lib"

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
# Packages that should use deferred loading
# ---------------------------------------------------------------------------
DEFERRED_PACKAGES=(
  "feature_gamification"
  "feature_billing"
  "feature_widgets"
  "feature_team"
  "feature_import_export"
)

# ---------------------------------------------------------------------------
# Step 1: List all imports of feature packages from apps/mobile/lib/
# ---------------------------------------------------------------------------
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  UNJYNX Deferred Imports Audit${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

echo -e "${BOLD}--- All Feature Package Imports ---${NC}"
echo ""

IMPORT_COUNT=0
while IFS= read -r line; do
  IMPORT_COUNT=$((IMPORT_COUNT + 1))
  echo "  ${line}"
done < <(grep -rn "^import 'package:feature_" "${MOBILE_LIB}/" 2>/dev/null || true)

if (( IMPORT_COUNT == 0 )); then
  info "No feature package imports found."
else
  echo ""
  info "${IMPORT_COUNT} feature package import(s) found."
fi
echo ""

# ---------------------------------------------------------------------------
# Step 2: Check for non-deferred imports of deferrable packages
# ---------------------------------------------------------------------------
echo -e "${BOLD}--- Deferred Import Check ---${NC}"
echo ""

VIOLATIONS=0

for pkg in "${DEFERRED_PACKAGES[@]}"; do
  echo -e "${CYAN}Checking: ${pkg}${NC}"

  # Find all imports of this package
  while IFS= read -r match; do
    file=$(echo "${match}" | cut -d: -f1)
    line_num=$(echo "${match}" | cut -d: -f2)
    import_line=$(echo "${match}" | cut -d: -f3-)

    # Check if it uses deferred loading
    if echo "${import_line}" | grep -q "deferred as"; then
      ok "  ${file}:${line_num} -- deferred import"
    else
      fail "  ${file}:${line_num} -- EAGER import (should be deferred)"
      echo "      ${import_line}"
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done < <(grep -rn "^import 'package:${pkg}" "${MOBILE_LIB}/" 2>/dev/null || true)

  # Check if no imports found (which is fine)
  if ! grep -rq "^import 'package:${pkg}" "${MOBILE_LIB}/" 2>/dev/null; then
    info "  No imports found (OK if registered lazily)"
  fi

  echo ""
done

# ---------------------------------------------------------------------------
# Step 3: Summary
# ---------------------------------------------------------------------------
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  Summary${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

if (( VIOLATIONS == 0 )); then
  ok "All deferrable packages are either deferred or not directly imported."
else
  fail "${VIOLATIONS} violation(s) found."
  echo ""
  echo "  To fix: change eager imports to deferred imports."
  echo ""
  echo "  Example:"
  echo "    BEFORE:"
  echo "      import 'package:feature_billing/feature_billing.dart';"
  echo ""
  echo "    AFTER:"
  echo "      import 'package:feature_billing/feature_billing.dart'"
  echo "          deferred as billing;"
  echo ""
  echo "  Then at point of use:"
  echo "      await billing.loadLibrary();"
  echo "      final widget = billing.BillingPage();"
  echo ""
  echo "  For GoRouter, use a deferred loading wrapper:"
  echo "      GoRoute("
  echo "        path: '/billing',"
  echo "        builder: (context, state) => DeferredWidget("
  echo "          billing.loadLibrary,"
  echo "          () => billing.BillingPage(),"
  echo "        ),"
  echo "      ),"
fi

echo ""

# ---------------------------------------------------------------------------
# Step 4: Import map (all feature imports grouped by file)
# ---------------------------------------------------------------------------
echo -e "${BOLD}--- Import Map (by file) ---${NC}"
echo ""

# Collect unique files that import feature packages
while IFS= read -r dart_file; do
  rel_path="${dart_file#"${MOBILE_LIB}"/}"
  echo -e "  ${BOLD}${rel_path}${NC}"

  while IFS= read -r import_line; do
    # Extract the package name
    pkg_name=$(echo "${import_line}" | sed -n "s/.*package:\([^/]*\).*/\1/p")
    if echo "${import_line}" | grep -q "deferred as"; then
      echo -e "    ${GREEN}[deferred]${NC} ${pkg_name}"
    else
      # Check if this is a package that should be deferred
      is_deferrable=false
      for dpkg in "${DEFERRED_PACKAGES[@]}"; do
        if [[ "${pkg_name}" == "${dpkg}" ]]; then
          is_deferrable=true
          break
        fi
      done

      if [[ "${is_deferrable}" == true ]]; then
        echo -e "    ${RED}[eager!]${NC}   ${pkg_name}"
      else
        echo -e "    [eager]    ${pkg_name}"
      fi
    fi
  done < <(grep "^import 'package:feature_" "${dart_file}" 2>/dev/null || true)

  echo ""
done < <(grep -rl "^import 'package:feature_" "${MOBILE_LIB}/" 2>/dev/null | sort -u)

echo ""
info "Done. Review violations above and apply deferred loading before release."
