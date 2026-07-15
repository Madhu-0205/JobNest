# ────────────────────────────────────────────────────────────────────
# Stage 1: Dependency Installation
# ────────────────────────────────────────────────────────────────────
FROM node:20.19-alpine3.21 AS deps

# Security: install only what's needed for native addons
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy lockfile first to leverage Docker layer cache
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline && npm cache clean --force

# ────────────────────────────────────────────────────────────────────
# Stage 2: Build
# ────────────────────────────────────────────────────────────────────
FROM node:20.19-alpine3.21 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for baking version metadata
ARG BUILD_VERSION=dev
ARG BUILD_SHA=unknown
ARG NEXT_TELEMETRY_DISABLED=1

ENV NEXT_TELEMETRY_DISABLED=${NEXT_TELEMETRY_DISABLED}
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_SHA=${BUILD_SHA}
ENV NODE_ENV=production

RUN npm run build

# ────────────────────────────────────────────────────────────────────
# Stage 3: Production Runner
# ────────────────────────────────────────────────────────────────────
FROM node:20.19-alpine3.21 AS runner

WORKDIR /app

# Security hardening
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Do not run as root
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Static public assets
COPY --from=builder /app/public ./public

# Prerender cache directory with correct ownership
RUN mkdir -p .next && chown nextjs:nodejs .next

# Standalone server bundle (smallest possible image)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Docker-native health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
