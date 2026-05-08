# syntax=docker/dockerfile:1.6

FROM node:22-alpine AS build
WORKDIR /app

# better-sqlite3 needs build tools to compile its native bindings
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev deps for the runtime image
RUN npm prune --omit=dev


FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DATABASE_URL=/data/garden.db

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# SQLite file lives on a volume so it survives container restarts
RUN mkdir -p /data && chown -R node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
