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
# CRITIQUE: --include=dev car NODE_ENV=production fait sauter les devDependencies
# (TypeScript, Tailwind, types sont REQUIS pour next build)
RUN npm install --include=dev

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://build:build@localhost/build"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV AUTH_SECRET="build-placeholder-not-used-at-runtime"
RUN npm run build

# Retirer les devDependencies après le build pour alléger l'image
RUN npm prune --omit=dev

# ── Runner stage ──────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs
COPY --from=build /app/public                                ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=build /app/db                ./db
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/node_modules      ./node_modules
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
