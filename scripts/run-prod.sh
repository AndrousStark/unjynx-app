#!/usr/bin/env bash
# Run UNJYNX in production mode (debug build against production backend).
#
# Usage: bash scripts/run-prod.sh [extra flutter run flags]
#
# For a release APK, use: bash scripts/build-release.sh

set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

: "${API_BASE_URL:=https://api.unjynx.me}"
: "${LOGTO_ENDPOINT:=https://auth.unjynx.me}"
: "${LOGTO_APP_ID:=unjynx-mobile}"
: "${SENTRY_DSN:=}"

exec flutter run \
  --flavor prod \
  -t lib/main.dart \
  --dart-define=ENV=production \
  --dart-define="API_BASE_URL=$API_BASE_URL" \
  --dart-define="LOGTO_ENDPOINT=$LOGTO_ENDPOINT" \
  --dart-define="LOGTO_APP_ID=$LOGTO_APP_ID" \
  --dart-define="SENTRY_DSN=$SENTRY_DSN" \
  "$@"
