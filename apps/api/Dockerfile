# syntax=docker/dockerfile:1.6
#
# Build context for this Dockerfile is the repo root, NOT apps/api/. The
# docker-compose.yml in this directory configures that. Building manually:
#   docker build -f apps/api/Dockerfile -t sprout-api:latest .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo


FROM base AS build
# better-sqlite3 needs build tools to compile its native bindings.
RUN apk add --no-cache python3 make g++

# Copy lockfile + workspace manifest first so dependency-only changes hit cache.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/api-client/package.json ./packages/api-client/

RUN --mount=type=cache,id=pnpm,target=/pnpm-store \
    pnpm config set store-dir /pnpm-store && \
    pnpm install --frozen-lockfile --filter @sprout/api... --filter @sprout/shared

# Copy sources after install for better caching.
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Type-check + emit JS into apps/api/dist.
RUN pnpm --filter @sprout/api build

# Use pnpm deploy to assemble a production install (only @sprout/api + its
# prod deps, with workspace links flattened) into /app.
RUN pnpm deploy --filter=@sprout/api --prod /app


FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_URL=/data/garden.db

COPY --from=build /app /app

# SQLite file lives on a volume so it survives container restarts.
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
