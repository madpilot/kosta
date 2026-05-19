# Sprout

A self-hostable gardening assistant. Sprout keeps a database of your plants
and a calendar of upcoming garden tasks, and exposes both an HTTP API and an
LLM-driven chat that can record activities ("today I planted basil seeds")
and propose follow-up tasks (water, check germination, transplant, harvest).

The chat backend speaks to any locally-run OpenAI-compatible server by default
(e.g. [Ollama](https://ollama.com/) with its `/v1` endpoint,
[LM Studio](https://lmstudio.ai/), or
[llama.cpp](https://github.com/ggerganov/llama.cpp)); using the hosted OpenAI
API is supported as an alternative.

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
  - A locally-run OpenAI-compatible server (e.g.
    [Ollama](https://ollama.com/) started with `ollama serve`,
    [LM Studio](https://lmstudio.ai/), or
    [llama.cpp](https://github.com/ggerganov/llama.cpp) with `--api`), or
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

Sprout reads only the bare minimum needed to bootstrap the process from
environment variables. Everything else (AI backend, model, location,
weather key, logging level, etc.) lives in the SQLite database and is
managed at runtime via the `/api/onboarding` and `/api/settings` endpoints —
no restart required when you update them.

### Bootstrap environment variables

| Variable       | Default            | Notes                                                                            |
| -------------- | ------------------ | -------------------------------------------------------------------------------- |
| `PORT`         | `3000`             | HTTP listen port.                                                                |
| `HOST`         | `0.0.0.0`          | HTTP listen address.                                                             |
| `DATABASE_URL` | `./data/garden.db` | SQLite file path. Required to find the DB before settings can be loaded from it. |

### Database-stored settings

These are written via `POST /api/onboarding` on first run and updated via
`PUT /api/settings` afterwards. Field names match the JSON body of those
endpoints (see `packages/shared/src/schemas/settings.ts`).

| Field            | Default                     | Notes                                                                              |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| `appBaseUrl`     | `http://localhost:3000`     | Public URL — used in password-reset emails. No trailing slash.                     |
| `aiBackend`      | `local`                     | `local` or `openai`.                                                               |
| `localAiBaseUrl` | `http://localhost:11434/v1` | Base URL of your local OpenAI-compatible server (include the `/v1` path).          |
| `localAiModel`   | `llama3.2`                  | Model name to send to the local server.                                            |
| `openaiApiKey`   | _(empty)_                   | Required when `aiBackend=openai`.                                                  |
| `openaiModel`    | `gpt-4o`                    | OpenAI model name.                                                                 |
| `aiPreamble`     | _(built-in)_                | Override the default Sprout system prompt.                                         |
| `weatherApiKey`  | _(empty)_                   | OpenWeatherMap key. Forecasts are skipped if unset.                                |
| `location`       | _(empty)_                   | e.g. `Perth, AU`. Used for weather + season-aware advice.                          |
| `hemisphere`     | `southern`                  | `northern` or `southern`. Drives season detection.                                 |
| `logLevel`       | `info`                      | Standard npm levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`. |
| `logFormat`      | `pretty`                    | `pretty` for human-readable colourised output, `json` for line-delimited JSON.     |
| `logSilent`      | `false`                     | Silence all log output. Auto-true under `NODE_ENV=test`.                           |

The JWT signing secret is auto-generated on first boot and persisted in the
database — you do not need to provision one.

## Running with Docker

The API ships a Dockerfile that uses the standard pnpm + `pnpm deploy`
pattern: it copies the workspace lockfile, installs only `@sprout/api`'s
production dependencies, builds, and assembles a flat install at `/app`.

> ⚠️ The build context is the **repo root**, not `apps/api/`.

```bash
docker build -f apps/api/Dockerfile -t sprout-api:latest .

docker run --rm \
  -p 3000:3000 \
  -v sprout-data:/data \
  --name sprout \
  sprout-api:latest
```

Configure the AI backend, model, location, etc. via `POST /api/onboarding`
(first run) or `PUT /api/settings` (afterwards) — they are stored in
`/data/garden.db` and survive container restarts.

## Running with docker compose

`apps/api/docker-compose.yml` brings up Sprout. You need a separate
locally-run OpenAI-compatible server (e.g. Ollama, LM Studio) accessible
from the container:

```bash
cd apps/api
docker compose up -d
```

The compose file declares one named volume:

- `sprout-data` — keeps `/data/garden.db` across restarts.

To use the hosted OpenAI API instead of a local server, switch at runtime
via the settings API (`PUT /api/settings` with `aiBackend: 'openai'` and an
`openaiApiKey`).

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
