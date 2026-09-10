# ==============================================================================
# SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)
# Multi-Stage Production Application Container
#
# Stage 1: Build Frontend Assets (Vite) & Server Bundle (esbuild)
# Stage 2: Production Runtime with PostgreSQL Client & Health Probes
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: BUILDER
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install build prerequisites
RUN apk add --no-cache python3 make g++

# Install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy full application source code
COPY . .

# Build Vite frontend assets and compile server.ts to dist/server.cjs
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: PRODUCTION RUNTIME
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities & python3 for migration support
RUN apk add --no-cache curl postgresql-client python3 py3-pip py3-psycopg2

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server distribution
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/requirements.txt ./requirements.txt

# Create non-root user for security compliance
RUN addgroup -g 1001 -S satsa && \
    adduser -S satsa -u 1001 && \
    chown -R satsa:satsa /app

USER satsa

EXPOSE 3000

# Container health probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.cjs"]
