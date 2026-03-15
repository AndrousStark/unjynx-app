#!/bin/bash
#
# UNJYNX Load Test Runner
#
# Usage:
#   ./run-all.sh                              # Run against localhost
#   BASE_URL=https://staging.unjynx.com ./run-all.sh  # Run against staging
#
# Prerequisites:
#   - k6 installed (https://k6.io/docs/get-started/installation/)
#   - Backend running at BASE_URL
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/results"
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "${RESULTS_DIR}"

echo "================================================"
echo "  UNJYNX Load Tests"
echo "  Target: ${BASE_URL}"
echo "  Started: $(date)"
echo "================================================"
echo ""

run_scenario() {
  local name=$1
  local script=$2
  echo "--- Running: ${name} ---"
  k6 run \
    -e "BASE_URL=${BASE_URL}" \
    --out "json=${RESULTS_DIR}/${name}_${TIMESTAMP}.json" \
    --summary-export "${RESULTS_DIR}/${name}_${TIMESTAMP}_summary.json" \
    "${SCRIPT_DIR}/scenarios/${script}"
  echo ""
}

# Run individual scenarios first
run_scenario "auth" "auth.js"
run_scenario "task-crud" "task-crud.js"
run_scenario "sync" "sync.js"
run_scenario "content" "content.js"

echo "================================================"
echo "  Full Load Test (all scenarios combined)"
echo "================================================"
echo ""

run_scenario "full-load" "full-load.js"

echo "================================================"
echo "  All tests complete!"
echo "  Results: ${RESULTS_DIR}/"
echo "  Finished: $(date)"
echo "================================================"
