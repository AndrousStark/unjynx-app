#!/bin/bash
# =============================================================================
# TODO Reminder App - Local Development Setup
# =============================================================================
# Usage: bash scripts/dev-setup.sh
# Prerequisites: Docker Desktop installed and running
# =============================================================================

set -e

echo "============================================="
echo "  TODO Reminder App - Local Dev Setup"
echo "============================================="
echo ""

# Check prerequisites
echo "[1/6] Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Install Docker Desktop first."
    echo "  -> https://docs.docker.com/desktop/install/windows-install/"
    exit 1
fi

if ! docker info &> /dev/null 2>&1; then
    echo "ERROR: Docker daemon is not running. Start Docker Desktop first."
    exit 1
fi

echo "  Docker: OK"

# Create .env from example if it doesn't exist
echo ""
echo "[2/6] Setting up environment variables..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "  Created .env from .env.example"
else
    echo "  .env already exists, skipping"
fi

# Start all services
echo ""
echo "[3/6] Starting all services (this may take a few minutes on first run)..."
docker compose up -d

# Wait for PostgreSQL to be healthy
echo ""
echo "[4/6] Waiting for PostgreSQL to be ready..."
timeout=60
elapsed=0
# Read DB user from .env if available, fall back to default
DB_USER="${POSTGRES_USER:-todoapp}"
if [ -f .env ]; then
    ENV_USER=$(grep -E '^POSTGRES_USER=' .env | cut -d= -f2)
    [ -n "$ENV_USER" ] && DB_USER="$ENV_USER"
fi
until docker exec todo-postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [ "$elapsed" -ge "$timeout" ]; then
        echo "ERROR: PostgreSQL failed to start within ${timeout}s"
        exit 1
    fi
done
echo "  PostgreSQL: Ready"

# Pull a small AI model (optional, takes time)
echo ""
echo "[5/6] Pulling local AI model (llama3.2:3b, ~2GB)..."
echo "  This runs in the background. Skip with Ctrl+C if you don't need AI yet."
docker exec todo-ollama ollama pull llama3.2:3b &
OLLAMA_PID=$!

# Create MinIO bucket
echo ""
echo "[6/6] Setting up MinIO storage bucket..."
sleep 5  # Wait for MinIO to start
if docker exec todo-minio mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null; then
    docker exec todo-minio mc mb local/todo-uploads 2>/dev/null || true
    echo "  MinIO bucket 'todo-uploads': Ready"
else
    echo "  WARNING: Could not configure MinIO. You may need to create the bucket manually."
fi

echo ""
echo "============================================="
echo "  All services are running!"
echo "============================================="
echo ""
echo "  Service URLs:"
echo "  -----------------------------------------------"
echo "  Backend API:     http://localhost:3000"
echo "  PostgreSQL:      localhost:5432"
echo "  Redis:           localhost:6379"
echo "  Auth (Logto):    http://localhost:3001"
echo "  Auth Admin:      http://localhost:3002"
echo "  File Storage:    http://localhost:9001  (minioadmin/minioadmin)"
echo "  Email Viewer:    http://localhost:8025"
echo "  AI (Ollama):     http://localhost:11434"
echo "  Grafana:         http://localhost:3003  (admin/admin)"
echo "  Prometheus:      http://localhost:9090"
echo "  pgAdmin:         http://localhost:5050  (admin@todo.local/admin)"
echo "  -----------------------------------------------"
echo ""
echo "  Next steps:"
echo "  1. Open http://localhost:3002 to configure Logto auth"
echo "  2. Create a Logto application for your Flutter app"
echo "  3. Copy the App ID and Secret to your .env file"
echo "  4. Start the backend: cd backend && npm run dev"
echo "  5. Start Flutter: cd app && flutter run"
echo ""

# Wait for Ollama model download if still running
if kill -0 $OLLAMA_PID 2>/dev/null; then
    echo "  Note: AI model is still downloading in the background."
    echo "  Check progress: docker logs -f todo-ollama"
fi
