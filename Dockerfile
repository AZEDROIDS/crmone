# syntax = docker/dockerfile:1
ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Next.js"
WORKDIR /app
ENV NODE_ENV="production"

# ── Build stage ───────────────────────────────────────────────────────────────
FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    build-essential node-gyp pkg-config python-is-python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
# --include=dev : NODE_ENV=production ferait sauter TypeScript/Tailwind requis au build
RUN npm install --include=dev

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://build:build@localhost/build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV AUTH_SECRET="build-placeholder-not-used-at-runtime"
RUN npm run build

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone contient server.js + node_modules minimaux auto-tracés par Next.js
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public           ./public

# Migrations : schema + config + le CLI drizzle-kit uniquement
COPY --from=build --chown=nextjs:nodejs /app/db                ./db
COPY --from=build --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build --chown=nextjs:nodejs /app/node_modules/drizzle-kit  ./node_modules/drizzle-kit
COPY --from=build --chown=nextjs:nodejs /app/node_modules/drizzle-orm  ./node_modules/drizzle-orm
COPY --from=build --chown=nextjs:nodejs /app/node_modules/tsx          ./node_modules/tsx
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.bin         ./node_modules/.bin

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
