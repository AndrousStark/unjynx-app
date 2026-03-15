# ─────────────────────────────────────────────────────────────────────────────
# UNJYNX Backend - Multi-Stage Production Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
#
# Build: docker build -f infra/production/Dockerfile -t unjynx-backend .
# Run:   docker run -p 3000:3000 --env-file .env.production unjynx-backend
#
# Stage 1 (builder): Install deps + build TypeScript
# Stage 2 (runner):  Minimal production image
#
# Final image size target: < 150MB
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────────────────────

FROM node:24-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace configuration first (cache layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy only backend package.json for dependency resolution
COPY apps/backend/package.json apps/backend/

# Enable corepack for pnpm and install dependencies
RUN corepack enable && \
    corepack prepare pnpm@latest --activate && \
    pnpm install --filter @unjynx/backend --frozen-lockfile --prod=false

# Copy backend source code
COPY apps/backend/ apps/backend/

# Build TypeScript to JavaScript
RUN pnpm --filter @unjynx/backend run build

# Prune dev dependencies after build
RUN pnpm install --filter @unjynx/backend --frozen-lockfile --prod

# ── Stage 2: Production Runtime ──────────────────────────────────────────────

FROM node:24-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 unjynx && \
    adduser --system --uid 1001 unjynx

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built artifacts and production dependencies
COPY --from=builder --chown=unjynx:unjynx /app/apps/backend/dist ./dist
COPY --from=builder --chown=unjynx:unjynx /app/apps/backend/package.json ./
COPY --from=builder --chown=unjynx:unjynx /app/node_modules ./node_modules
COPY --from=builder --chown=unjynx:unjynx /app/apps/backend/node_modules ./app_modules

# Copy Drizzle migrations if they exist
COPY --from=builder --chown=unjynx:unjynx /app/apps/backend/drizzle ./drizzle

# Switch to non-root user
USER unjynx

# Expose the application port
EXPOSE 3000

# Health check: verify the /health endpoint responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
