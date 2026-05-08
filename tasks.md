# Handoff — Sprout monorepo: complete frontend split

You're picking up partway through a multi-step migration. The full plan is at `/root/.claude/plans/plan-the-web-app-polished-flute.md` — read it first; this is just the remaining work.

## Repo state

- Repo: `madpilot/kosta` (project name: Sprout). All work goes on branch `claude/plan-react-architecture-i8DBQ`.
- pnpm workspace already set up. `pnpm install --frozen-lockfile` from the repo root works.
- Existing layout:
  ```
  sprout/
  ├── pnpm-workspace.yaml          # packages: apps/*, packages/*
  ├── tsconfig.base.json
  ├── package.json                 # private root, prettier only, packageManager: pnpm@9.15.0
  └── apps/
      └── api/                     # @sprout/api — Express + oRPC + SQLite (working)
  ```
- `apps/api/src/orpc/router.ts` exports `type AppRouter = typeof router` at the bottom, and `apps/api/package.json` has the `./orpc/router` subpath export plus `sideEffects: false`.
- CI (`.github/workflows/ci.yml`) is pnpm-based and green.

## What's done (steps 1–4)

Monorepo bones, API relocated, AppRouter exposed, CI fixed. Don't redo any of it.

## What's left (steps 5–10 of the plan)

### 5. Create `packages/shared` and `packages/api-client`

- Move Zod schemas from `apps/api/src/models/{plant,calendar,user,settings,chat,calendar-db}.ts` into `packages/shared/src/schemas/*`. Use **subpath exports** (`@sprout/shared/schemas/plant`, etc.) — no barrel `index.ts`, so Metro doesn't pull every schema into the mobile bundle.
- Update API imports to consume from `@sprout/shared`.
- `packages/shared` must stay React-free (the API depends on it).
- `packages/api-client` exposes a `createClient({ baseUrl, getToken, onUnauthorized })` factory using `@orpc/client` + `RPCLink`, plus TanStack Query hooks per resource (`usePlants`, `useCalendarEvents`, etc.) under a `<ApiProvider>`.
- The client uses **type-only import**: `import type { AppRouter } from '@sprout/api/orpc/router'`. Set `"verbatimModuleSyntax": true` in `packages/api-client/tsconfig.json`. After first build, grep `apps/web/dist` for `better-sqlite3|express` — must be empty.
- Workspace packages ship TS source: `"main": "src/index.ts"` (not `dist/`) so Vite/Metro hot-reload without a build step.

### 6. Design tokens

- Translate `mockups/06-style-guide.html` into `packages/shared/src/tokens.ts` (typed `as const` object: color, space, radius, type ramp).
- Tiny generator script at `packages/shared/scripts/build-css-vars.ts` emits `packages/shared/dist/tokens.css` (`:root { --color-leaf: ...; --space-1: 4px; ... }`). Wire as a `prebuild`/`predev` step in `apps/web`.
- TS object is the source of truth; CSS file is a derived artifact.

### 7. Docker + docs

- `apps/api/Dockerfile` — convert to the standard pnpm Docker pattern (`pnpm deploy --filter=@sprout/api --prod /app`). Don't ship the whole workspace.
- `apps/api/docker-compose.yml` — set build context to `../..` and `dockerfile: apps/api/Dockerfile`.
- Update `README.md` (currently documents npm + root `src/`) and `AGENTS.md` to reflect the new layout. Decide whether `.env.example` stays at the repo root or moves to `apps/api/`.

### 8. Scaffold `apps/web`

- `pnpm create vite apps/web -- --template react-ts`. Add TanStack Router (file-based), TanStack Query.
- **Styling: CSS Modules only** — user explicitly rejected Tailwind. No CSS-in-JS. Each component has a colocated `*.module.css`.
- `apps/web/src/main.tsx` imports `@sprout/shared/tokens.css` once. Components reference `var(--color-leaf)`, `var(--space-3)`.
- Wire `@sprout/api-client` with `getToken: () => localStorage.getItem('sprout_token')` and `onUnauthorized` routing to `/login`.

### 9. Scaffold `apps/mobile`

- `pnpm create expo apps/mobile`. Add Expo Router v4, TanStack Query, expo-secure-store.
- **Styling: vanilla `StyleSheet.create` only** — no NativeWind, no styling library. Import the typed tokens object from `@sprout/shared`.
- Drop in the canonical Expo+pnpm `metro.config.js` (in the plan file — sets `watchFolders`, `disableHierarchicalLookup`, `unstable_enableSymlinks`).
- `eas.json` needs `EXPO_USE_METRO_WORKSPACE_ROOT=1` for production builds.
- Wire `@sprout/api-client` with `getToken: () => SecureStore.getItemAsync('sprout_token')`.

### 10. Re-implement screens in both apps

Onboarding → today → plant detail → calendar → chat. Use `mockups/0{1..7}.html` as visual reference. Web and mobile get **separate component implementations** — UI is not shared (deliberate; designs diverge).

## Gotchas worth knowing

- pnpm's `.pnpm/` virtual store causes TS "non-portable type" errors on `declaration: true` builds. Already hit this on `createApp` (annotated as `express.Application`). Same pattern may surface elsewhere — fix is an explicit return-type annotation, not turning off declarations.
- Don't add `react-native-web`. User explicitly rejected it.
- Don't add a barrel `index.ts` to `packages/shared` — Metro will pull every schema into the mobile bundle.
- Don't put `@tanstack/react-query` or any React dep in `packages/shared` — keep React out so the API can consume it.

## Verification before each commit

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm --filter @sprout/api typecheck && pnpm --filter @sprout/api lint && pnpm --filter @sprout/api test
# add the same for web/mobile/packages as they come online
```

CI runs these on every push. Don't break it.
