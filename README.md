# Costa — Garden Agent

A self-hostable gardening assistant. Costa keeps a database of your plants
and calendar of upcoming garden tasks, and exposes both an HTTP API and an
LLM-driven chat that can record activities ("today I planted basil seeds")
and propose follow-up tasks (water, check germination, transplant, harvest).

The chat backend speaks to a local [Ollama](https://ollama.com/) instance by
default; OpenAI-compatible models are supported as an alternative.

## Prerequisites

- **Node.js 22+** and **npm** (only if running outside Docker).
- **A SQLite-capable filesystem.** Data is stored in `data/garden.db` by
  default — better-sqlite3 compiles a native binding on install.
- **An LLM backend.** Either:
  - A local [Ollama](https://ollama.com/) instance with a chat model pulled
    (`ollama pull llama3.2`), or
  - An OpenAI API key.
- _(Optional)_ An [OpenWeatherMap](https://openweathermap.org/api) API key
  if you want the AI to factor weather into its scheduling advice.

## Installation

```bash
git clone https://github.com/madpilot/kosta.git
cd kosta
npm install
cp .env.example .env
# edit .env to taste — see Configuration below
npm run build
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Configuration

Configuration is read from environment variables. `.env.example` lists every
recognised key with its default. The summary:

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
| `AI_PREAMBLE`     | _(built-in)_             | Override the default Costa system prompt.                                          |
| `WEATHER_API_KEY` | _(empty)_                | OpenWeatherMap key. Forecasts are skipped if unset.                                |
| `USER_LOCATION`   | _(empty)_                | e.g. `Perth, AU`. Used for weather + season-aware advice.                          |
| `USER_HEMISPHERE` | `southern`               | `northern` or `southern`. Drives season detection.                                 |
| `LOG_LEVEL`       | `info`                   | Standard npm levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`. |
| `LOG_FORMAT`      | `pretty`                 | `pretty` for human-readable colourised output, `json` for line-delimited JSON.     |
| `LOG_SILENT`      | `false`                  | Silence all log output. Auto-true under `NODE_ENV=test`.                           |

## Running with Docker

A `Dockerfile` is included. The image is a multi-stage Node 22 Alpine build
that compiles `better-sqlite3` and writes its database to `/data` (exposed as
a volume).

```bash
docker build -t garden-agent .

docker run --rm \
  -p 3000:3000 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL=llama3.2 \
  -e APP_BASE_URL=http://localhost:3000 \
  -v costa-data:/data \
  --name costa \
  garden-agent
```

`host.docker.internal` reaches an Ollama server running on the Docker
host on Mac/Windows; on Linux pass `--add-host=host.docker.internal:host-gateway`
or point `OLLAMA_BASE_URL` at the host's LAN IP.

## Running with docker compose

`docker-compose.yml` brings up Costa together with a colocated Ollama
container, so you don't need anything else installed on the host:

```bash
docker compose up -d

# pull a model into the colocated Ollama (one-off)
docker compose exec ollama ollama pull llama3.2
```

The compose file declares two named volumes:

- `ollama-models` — keeps pulled models around across restarts.
- `costa-data` — keeps `/data/garden.db` across restarts.

To use OpenAI instead of the bundled Ollama, drop the `ollama` service from
the compose file and set `AI_BACKEND=openai` / `OPENAI_API_KEY=...` on the
`costa` service.

## Tests

```bash
npm test          # one-shot
npm run test:watch
npm run typecheck
npm run lint
```

## API

The HTTP API is described by an OpenAPI spec served at:

```
GET /api/openapi.json
```

Key route groups:

- `/api/plants` — CRUD for plants in your garden.
- `/api/calendar` — list / create / complete garden tasks.
- `/api/chat/sessions` — chat with Costa; see `POST /api/chat/sessions/:id/messages`.
- `/api/auth` — login, password reset, change password.

## License

MIT.
