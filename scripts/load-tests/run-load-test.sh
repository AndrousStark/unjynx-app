#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# UNJYNX - k6 Load Test Runner
#
# Usage:
#   ./run-load-test.sh              # default load test
#   ./run-load-test.sh --smoke      # quick smoke test (1 VU, ~50s)
#   ./run-load-test.sh --load       # standard load test (0-100 VUs, ~16min)
#   ./run-load-test.sh --stress     # stress test (0-200 VUs, ~10min)
#   ./run-load-test.sh --help       # show usage
#
# Environment overrides:
#   BASE_URL=http://staging:3000 ./run-load-test.sh --load
#   AUTH_TOKEN=real-jwt-here ./run-load-test.sh --load
# ---------------------------------------------------------------------------

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_SCRIPT="${SCRIPT_DIR}/api-load-test.js"

# Defaults (can be overridden via environment)
: "${BASE_URL:=http://localhost:3000}"
: "${AUTH_TOKEN:=test-bearer-token}"
TEST_TYPE="load"

# ---------------------------------------------------------------------------
# Colors for output
# ---------------------------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

print_banner() {
  echo -e "${CYAN}"
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║       UNJYNX - k6 API Load Test Runner      ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_usage() {
  echo -e "${BOLD}Usage:${NC}"
  echo "  $(basename "$0") [OPTIONS]"
  echo ""
  echo -e "${BOLD}Options:${NC}"
  echo "  --smoke     Quick verification (1 VU, ~50 seconds)"
  echo "  --load      Standard load test (50-100 VUs, ~16 minutes) [default]"
  echo "  --stress    High concurrency stress test (200 VUs, ~10 minutes)"
  echo "  --help      Show this help message"
  echo ""
  echo -e "${BOLD}Environment Variables:${NC}"
  echo "  BASE_URL    Backend URL       (default: http://localhost:3000)"
  echo "  AUTH_TOKEN  Bearer auth token (default: test-bearer-token)"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  ./run-load-test.sh --smoke"
  echo "  BASE_URL=http://staging:3000 ./run-load-test.sh --load"
  echo "  AUTH_TOKEN=eyJhbGciOi... ./run-load-test.sh --stress"
}

check_k6_installed() {
  if ! command -v k6 &>/dev/null; then
    echo -e "${RED}Error: k6 is not installed or not in PATH.${NC}"
    echo ""
    echo -e "${YELLOW}Install k6:${NC}"
    echo "  macOS:    brew install k6"
    echo "  Windows:  choco install k6  OR  winget install k6"
    echo "  Linux:    sudo gpg -k; sudo gpg --no-default-keyring \\"
    echo "              --keyring /usr/share/keyrings/k6-archive-keyring.gpg \\"
    echo "              --keyserver hkp://keyserver.ubuntu.com:80 \\"
    echo "              --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69"
    echo "            echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \\"
    echo "              https://dl.k6.io/deb stable main' | \\"
    echo "              sudo tee /etc/apt/sources.list.d/k6.list"
    echo "            sudo apt-get update && sudo apt-get install k6"
    echo "  Docker:   docker run --rm -i grafana/k6 run -"
    echo ""
    echo -e "  Docs: ${BLUE}https://k6.io/docs/get-started/installation/${NC}"
    exit 1
  fi

  local k6_version
  k6_version=$(k6 version 2>/dev/null || echo "unknown")
  echo -e "${GREEN}[OK]${NC} k6 found: ${k6_version}"
}

check_backend_reachable() {
  echo -n "Checking backend at ${BASE_URL}/health ... "

  local http_code
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 5 --max-time 10 \
    "${BASE_URL}/health" 2>/dev/null || echo "000")

  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}OK (HTTP ${http_code})${NC}"
  elif [ "$http_code" = "503" ]; then
    echo -e "${YELLOW}DEGRADED (HTTP ${http_code}) - DB may be down${NC}"
  elif [ "$http_code" = "000" ]; then
    echo -e "${RED}UNREACHABLE${NC}"
    echo -e "${YELLOW}WARNING: Backend is not responding. Tests will likely fail.${NC}"
    echo -n "Continue anyway? [y/N] "
    read -r answer
    if [[ ! "$answer" =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 1
    fi
  else
    echo -e "${YELLOW}HTTP ${http_code}${NC}"
  fi
}

check_test_script_exists() {
  if [ ! -f "$TEST_SCRIPT" ]; then
    echo -e "${RED}Error: Test script not found at ${TEST_SCRIPT}${NC}"
    exit 1
  fi
  echo -e "${GREEN}[OK]${NC} Test script: ${TEST_SCRIPT}"
}

print_config() {
  echo ""
  echo -e "${BOLD}Configuration:${NC}"
  echo -e "  Test type  : ${CYAN}${TEST_TYPE}${NC}"
  echo -e "  Base URL   : ${BASE_URL}"
  echo -e "  Auth token : ${AUTH_TOKEN:0:20}..."
  echo ""

  case "$TEST_TYPE" in
    smoke)
      echo -e "  ${YELLOW}Smoke Test:${NC} 1 VU, ~50 seconds"
      echo "  Quick verification that all endpoints respond correctly."
      ;;
    load)
      echo -e "  ${YELLOW}Load Test:${NC} 0 -> 50 -> 100 VUs, ~16 minutes"
      echo "  Staged ramp-up simulating realistic production traffic."
      echo "  Thresholds: p95 < 200ms, p99 < 500ms, error rate < 1%"
      ;;
    stress)
      echo -e "  ${YELLOW}Stress Test:${NC} 0 -> 200 VUs, ~10 minutes"
      echo "  High concurrency test to find the breaking point."
      echo "  Thresholds: p95 < 500ms, p99 < 1000ms, error rate < 5%"
      ;;
  esac

  echo ""
}

run_test() {
  echo -e "${BOLD}Starting k6...${NC}"
  echo "────────────────────────────────────────────────"

  k6 run \
    --env "BASE_URL=${BASE_URL}" \
    --env "AUTH_TOKEN=${AUTH_TOKEN}" \
    --env "TEST_TYPE=${TEST_TYPE}" \
    --summary-trend-stats="avg,min,med,max,p(90),p(95),p(99)" \
    "$TEST_SCRIPT"

  local exit_code=$?

  echo "────────────────────────────────────────────────"

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}${BOLD}All thresholds passed.${NC}"
  else
    echo -e "${RED}${BOLD}Some thresholds failed (exit code: ${exit_code}).${NC}"
    echo -e "${YELLOW}Review the summary above for details.${NC}"
  fi

  return $exit_code
}

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --smoke)
      TEST_TYPE="smoke"
      shift
      ;;
    --load)
      TEST_TYPE="load"
      shift
      ;;
    --stress)
      TEST_TYPE="stress"
      shift
      ;;
    --help|-h)
      print_banner
      print_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo ""
      print_usage
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

print_banner
check_k6_installed
check_test_script_exists
check_backend_reachable
print_config
run_test
