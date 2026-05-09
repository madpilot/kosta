# Sprout

A self-hostable gardening assistant. Sprout keeps a database of your plants
and a calendar of upcoming garden tasks, and exposes both an HTTP API and an
LLM-driven chat that can record activities ("today I planted basil seeds")
and propose follow-up tasks (water, check germination, transplant, harvest).

The chat backend speaks to a local [Ollama](https://ollama.com/) instance by
default; OpenAI-compatible models are supported as an alternative.

## Repository layout

This is a [pnpm workspace](https://pnpm.io/workspaces) monorepo:

```
sprout/
├── apps/
│   ├── api/           # @sprout/api — Express + oRPC + SQLite backend
│   ├── web/           # @sprout/web — Vite + React + TanStack Router
│   └── mobile/        # @sprout/mobile — Expo + React Native
└── packages/
    ├── shared/        # @sprout/shared — Zod schemas + design tokens (React-free)
    └── api-client/    # @sprout/api-client — typed oRPC client + TanStack Query hooks
```

Workspace packages ship TypeScript source (`"main": "src/index.ts"`); Vite
and Metro pick up changes without a build step. `packages/shared` exposes
each schema as a subpath export (e.g. `@sprout/shared/schemas/plant`) so
mobile bundles only pull in what they use.

## Prerequisites

- **Node.js 22+** and **pnpm 9** (Corepack works: `corepack enable`).
- **A SQLite-capable filesystem.** Data lives at `./data/garden.db` by default.
  `better-sqlite3` compiles a native binding on install.
- **An LLM backend.** Either:
  - A local [Ollama](https://ollama.com/) instance with a chat model pulled
    (`ollama pull llama3.2`), or
  - An OpenAI API key.
- _(Optional)_ An [OpenWeatherMap](https://openweathermap.org/api) API key
  if you want weather-aware advice.

## Installation

```bash
git clone https://github.com/madpilot/kosta.git sprout
cd sprout
pnpm install
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env to taste — see Configuration below
pnpm --filter @sprout/api build
pnpm --filter @sprout/api start
```

For development with auto-reload:

```bash
pnpm --filter @sprout/api dev    # API on :3000
pnpm --filter @sprout/web dev    # Web on :5173
pnpm --filter @sprout/mobile start  # Expo dev server
```

## Configuration

Configuration is read from environment variables in `apps/api/.env`.
`apps/api/.env.example` lists every recognised key with its default.

| Variable          | Default                  | Notes                                                                              |
| ----------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `PORT`            | `3000`                   | HTTP listen port.                                                                  |
| `HOST`            | `0.0.0.0`                | HTTP listen address.                                                               |
| `APP_BASE_URL`    | `http://localhost:3000`  | Public URL — used in password-reset emails. No trailing slash.                     |
| `DATABASE_URL`    | `./data/garden.db`       | SQLite file path. Creates the file (and parent dir) on first run.                  |
| `AI_BACKEND`      | `ollama`                 | `ollama` or `openai`.                                                              |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL.                                                                 |
| `OLLAMA_MODEL`    | `llama3.2`               | Ollama model tag. Pull it first with `ollama pull <model>`.                        |
| `OPENAI_API_KEY`  | _(empty)_                | Required when `AI_BACKEND=openai`.                                                 |
| `OPENAI_MODEL`    | `gpt-4o`                 | OpenAI model name.                                                                 |
| `AI_PREAMBLE`     | _(built-in)_             | Override the default Sprout system prompt.                                         |
| `WEATHER_API_KEY` | _(empty)_                | OpenWeatherMap key. Forecasts are skipped if unset.                                |
| `USER_LOCATION`   | _(empty)_                | e.g. `Perth, AU`. Used for weather + season-aware advice.                          |
| `USER_HEMISPHERE` | `southern`               | `northern` or `southern`. Drives season detection.                                 |
| `LOG_LEVEL`       | `info`                   | Standard npm levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`. |
| `LOG_FORMAT`      | `pretty`                 | `pretty` for human-readable colourised output, `json` for line-delimited JSON.     |
| `LOG_SILENT`      | `false`                  | Silence all log output. Auto-true under `NODE_ENV=test`.                           |

## Running with Docker

The API ships a Dockerfile that uses the standard pnpm + `pnpm deploy`
pattern: it copies the workspace lockfile, installs only `@sprout/api`'s
production dependencies, builds, and assembles a flat install at `/app`.

> ⚠️ The build context is the **repo root**, not `apps/api/`.

```bash
docker build -f apps/api/Dockerfile -t sprout-api:latest .

docker run --rm \
  -p 3000:3000 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL=llama3.2 \
  -e APP_BASE_URL=http://localhost:3000 \
  -v sprout-data:/data \
  --name sprout \
  sprout-api:latest
```

## Running with docker compose

`apps/api/docker-compose.yml` brings up Sprout together with a colocated
Ollama container, so you don't need anything else installed on the host:

```bash
cd apps/api
docker compose up -d

# pull a model into the colocated Ollama (one-off)
docker compose exec ollama ollama pull llama3.2
```

The compose file declares two named volumes:

- `ollama-models` — keeps pulled models around across restarts.
- `sprout-data` — keeps `/data/garden.db` across restarts.

To use OpenAI instead of the bundled Ollama, drop the `ollama` service from
the compose file and set `AI_BACKEND=openai` / `OPENAI_API_KEY=...` on the
`sprout` service.

## Tests

```bash
pnpm format:check
pnpm --filter @sprout/api typecheck
pnpm --filter @sprout/api lint
pnpm --filter @sprout/api test
pnpm --filter @sprout/api test:watch
```

CI (`.github/workflows/ci.yml`) runs the same set on every push.

## API

The HTTP API is described by an OpenAPI spec served at:

```
GET /api/openapi.json
```

Key route groups:

- `/api/onboarding` — first-run setup. `GET /api/onboarding/status` reports
  whether the install has been onboarded; `POST /api/onboarding` creates the
  initial user and persists settings (AI backend, location, hemisphere,
  weather key, etc.). Only callable while no user exists.
- `/api/settings` — read/update the install settings post-onboarding.
- `/api/plants` — CRUD for plants in your garden.
- `/api/calendar` — list / create / complete garden tasks.
- `/api/chat/sessions` — chat with Sprout; see `POST /api/chat/sessions/:id/messages`.
- `/api/auth` — login, password reset, change password. There is no public
  registration endpoint — the first (and only) user is created via
  `/api/onboarding`.

## License

MIT.
