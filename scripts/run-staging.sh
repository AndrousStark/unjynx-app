#!/usr/bin/env bash
# Run UNJYNX in staging mode.
#
# Usage: bash scripts/run-staging.sh [extra flutter run flags]

set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

: "${API_BASE_URL:=https://staging.api.unjynx.me}"
: "${LOGTO_ENDPOINT:=https://staging.auth.unjynx.me}"
: "${LOGTO_APP_ID:=unjynx-staging}"
: "${SENTRY_DSN:=}"

exec flutter run \
  --flavor staging \
  -t lib/main_staging.dart \
  --dart-define=ENV=staging \
  --dart-define="API_BASE_URL=$API_BASE_URL" \
  --dart-define="LOGTO_ENDPOINT=$LOGTO_ENDPOINT" \
  --dart-define="LOGTO_APP_ID=$LOGTO_APP_ID" \
  --dart-define="SENTRY_DSN=$SENTRY_DSN" \
  "$@"
