# ============================================
# Stage 1: Dependencies Installation Stage
# ============================================

# IMPORTANT: Node.js Version Maintenance
# To ensure stability with Next.js, Node.js 22 LTS is used instead of 24.
# Update these versions as newer LTS releases become available.
ARG BUILD_NODE_VERSION=22.14.0-slim
ARG RUNNER_NODE_VERSION=22.14.0-alpine

FROM node:${BUILD_NODE_VERSION} AS dependencies

# Set working directory
WORKDIR /app

# Copy package-related files first to leverage Docker's caching mechanism
COPY package.json pnpm-lock.yaml ./

# Pin pnpm to a specific version for reproducible builds
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Install project dependencies with frozen lockfile for reproducible builds
# NOTE: This uses Docker BuildKit cache mounts (requires DOCKER_BUILDKIT=1).
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build Next.js application in standalone mode
# ============================================

FROM node:${BUILD_NODE_VERSION} AS builder

# Set working directory
WORKDIR /app

# Copy project dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application source code
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Pin pnpm to a specific version for reproducible builds
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

# Build Next.js application
# If you want to speed up Docker rebuilds, you can cache the build artifacts
# by adding: --mount=type=cache,target=/app/.next/cache
# This caches the .next/cache directory across builds, but it also prevents
# .next/cache/fetch-cache from being included in the final image, meaning
# cached fetch responses from the build won't be available at runtime.
RUN pnpm build

# ============================================
# Stage 3: Run Next.js application
# ============================================

FROM node:${RUNNER_NODE_VERSION} AS runner

# Install libc6-compat for native module compatibility on Alpine
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy production assets
COPY --from=builder --chown=node:node /app/public ./public

# Create required directories and set ownership
RUN mkdir -p .next && chown -R node:node /app

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# If you want to persist the fetch cache generated during the build so that
# cached responses are available immediately on startup, uncomment this line:
# COPY --from=builder --chown=node:node /app/.next/cache ./.next/cache

# Switch to non-root user for security best practices
USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

# Health check to verify the application is running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => process.exit(r.ok?0:1)).catch(() => process.exit(1))"

# Start Next.js standalone server
CMD ["node", "server.js"]
