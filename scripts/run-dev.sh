#!/usr/bin/env bash
# Run UNJYNX in development mode targeting local backend.
#
# Usage: bash scripts/run-dev.sh [extra flutter run flags]
#
# Override individual values:
#   API_BASE_URL=http://192.168.1.50:3000 bash scripts/run-dev.sh

set -euo pipefail
cd "$(dirname "$0")/../apps/mobile"

: "${API_BASE_URL:=http://10.0.2.2:3000}"
: "${LOGTO_ENDPOINT:=http://10.0.2.2:3001}"
: "${LOGTO_APP_ID:=unjynx-dev}"
: "${SENTRY_DSN:=}"

exec flutter run \
  --flavor dev \
  -t lib/main_dev.dart \
  --dart-define=ENV=development \
  --dart-define="API_BASE_URL=$API_BASE_URL" \
  --dart-define="LOGTO_ENDPOINT=$LOGTO_ENDPOINT" \
  --dart-define="LOGTO_APP_ID=$LOGTO_APP_ID" \
  --dart-define="SENTRY_DSN=$SENTRY_DSN" \
  --dart-define=FEATURE_TEAM=true \
  --dart-define=FEATURE_IMPORT_EXPORT=true \
  --dart-define=FEATURE_WIDGETS=true \
  "$@"
