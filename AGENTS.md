# AGENTS.md

Notes for AI agents working in this repository. Keep this file in sync with
the project layout — it's the canonical map of where things live.

## Overview

**Sprout** is a self-hostable AI gardening assistant: an Express + SQLite
backend, a Vite + React web app, and an Expo + React Native mobile app, all
sharing typed schemas through a thin shared package.

## Repository layout

```
sprout/
├── apps/
│   ├── api/             # @sprout/api — Express + oRPC + SQLite (Node)
│   ├── web/             # @sprout/web — Vite + React + TanStack Router/Query (CSS Modules)
│   └── mobile/          # @sprout/mobile — Expo Router + React Native (StyleSheet.create)
├── packages/
│   ├── shared/          # @sprout/shared — Zod schemas + design tokens (React-free, no barrel)
│   └── api-client/      # @sprout/api-client — typed oRPC client + TanStack Query hooks
├── mockups/             # static HTML mockups (visual reference, never imported)
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Hard rules

- `packages/shared` is **React-free**. The API depends on it; do not import
  React, react-native, or any DOM types. Each schema is its own subpath
  export (`@sprout/shared/schemas/plant`) — **no barrel `index.ts`** so
  Metro can tree-shake.
- `packages/api-client` uses `verbatimModuleSyntax: true` and **type-only**
  imports of `AppRouter` from `@sprout/api/orpc/router`. Server code (Express,
  better-sqlite3) must never reach the web/mobile bundles.
- Workspace packages ship TS source (`"main": "src/index.ts"`), not `dist/`,
  so Vite/Metro hot-reload without a build step.
- Web styles **CSS Modules only**. No Tailwind. No CSS-in-JS.
- Mobile styles **`StyleSheet.create` only**. No NativeWind.
- Web and mobile have **separate component implementations**. UI is not
  shared — designs deliberately diverge.
- Design tokens live in `packages/shared/src/tokens.ts` (typed `as const`).
  `packages/shared/dist/tokens.css` is a generated artefact — wire
  `pnpm --filter @sprout/shared build:css` as a `prebuild`/`predev` step.

## @sprout/api

```
apps/api/src/
├── index.ts              # Express server + REST endpoints
├── openapi.ts            # OpenAPI generator (consumes router.ts)
├── orpc/router.ts        # oRPC route definitions — exports `type AppRouter`
├── services/             # Business logic (plants, calendar, chat, auth, ...)
├── db/                   # SQLite wrapper (better-sqlite3, WAL mode)
├── utils/                # Logger, timezone, season helpers
└── test/                 # Schema-validation tests
```

### Stack

- **Runtime**: TypeScript on Node 22
- **Server**: Express 4
- **Database**: better-sqlite3 (WAL mode)
- **Validation**: Zod (schemas in `@sprout/shared/schemas/*`)
- **API spec**: oRPC + OpenAPI 3
- **Auth**: JWT (jose)
- **Tests**: Jest + supertest

### Commands

```bash
pnpm --filter @sprout/api dev         # tsx watch
pnpm --filter @sprout/api build       # tsc → dist/
pnpm --filter @sprout/api start       # node dist/index.js
pnpm --filter @sprout/api typecheck
pnpm --filter @sprout/api lint
pnpm --filter @sprout/api test
```

### Key files

- `src/orpc/router.ts` — single source of truth for the API surface. Adding
  a route here updates the OpenAPI spec **and** the `@sprout/api-client`
  types automatically.
- `src/index.ts` — Express runtime. Route handlers live here; the oRPC
  handlers in `router.ts` are stubs purely for OpenAPI generation.
- `src/db/sqlite.ts` — single file containing every SQL prepared statement.

### Adding a route

1. Add a Zod schema (or reuse one) in `packages/shared/src/schemas/*`.
2. Declare the route in `apps/api/src/orpc/router.ts` so it shows up in
   the OpenAPI spec and the typed client.
3. Implement the handler in `apps/api/src/index.ts`, validating the body
   with the Zod schema.
4. Implement the corresponding service method in `apps/api/src/services/*`.
5. Add tests next to the service (`*.test.ts`).

## @sprout/shared

Pure-TS package. No React. No Node-specific deps in runtime code.

- `src/schemas/{plant,calendar,calendar-db,user,settings,chat}.ts` — Zod
  schemas + inferred TS types. Each is its own subpath export.
- `src/tokens.ts` — typed design tokens (`color`, `space`, `radius`,
  `shadow`, `fontFamily`, `type`). Source of truth for both web (CSS vars)
  and mobile (typed object).
- `scripts/build-css-vars.ts` — generator that emits
  `dist/tokens.css` (`:root { --color-leaf: ...; --space-md: 18px; ... }`).
  Wired as `prebuild`/`predev` in `apps/web`.

## @sprout/api-client

Type-safe oRPC client + TanStack Query hooks for both web and mobile.

```ts
// apps/web/src/main.tsx
<ApiProvider
  baseUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}
  getToken={() => localStorage.getItem('sprout_token')}
  onUnauthorized={() => router.navigate({ to: '/login' })}
>
  ...
</ApiProvider>
```

```ts
// apps/mobile/app/_layout.tsx
<ApiProvider
  baseUrl={Constants.expoConfig?.extra?.apiUrl}
  getToken={() => SecureStore.getItemAsync('sprout_token')}
  onUnauthorized={() => router.replace('/login')}
>
  ...
</ApiProvider>
```

Hooks: `usePlants`, `usePlant`, `useCreatePlant`, `useUpdatePlant`,
`useDeletePlant`, `useCalendarEvents`, `useTodayEvents`, `useWeekEvents`,
`useMonthEvents`, `useCompleteEvent`, `useLogin`, `useProfile`,
`useOnboardingStatus`, `useSettings`, `useUpdateSettings`.

## @sprout/web

- Vite + React 18 + TanStack Router (file-based) + TanStack Query.
- CSS Modules colocated next to components: `Button.tsx` + `Button.module.css`.
- `src/main.tsx` imports `@sprout/shared/tokens.css` once at boot.
- Components reference `var(--color-leaf)`, `var(--space-3)` — never hard-code.

## @sprout/mobile

- Expo Router v4 + React Native + TanStack Query + expo-secure-store.
- Vanilla `StyleSheet.create`. Import the typed tokens from `@sprout/shared/tokens`.
- `metro.config.js` sets `watchFolders`, `disableHierarchicalLookup`,
  `unstable_enableSymlinks` — required for pnpm + Expo to coexist.
- `eas.json` sets `EXPO_USE_METRO_WORKSPACE_ROOT=1` for production builds.

## Verification before commit

CI runs these on every push (see `.github/workflows/ci.yml`). Don't break them.

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm --filter @sprout/api typecheck
pnpm --filter @sprout/api lint
pnpm --filter @sprout/api test
# add web/mobile/packages typecheck + test as they come online
```

## Gotchas

- pnpm's `.pnpm/` virtual store can produce TS "non-portable type" errors on
  `declaration: true` builds. Fix with explicit return-type annotations on
  exported factories (already done for `createApp`).
- Don't add `react-native-web`. UI is intentionally split between web and
  mobile, with separate components per platform.
- Don't add `@tanstack/react-query` (or any React dep) to `packages/shared`
  — the API consumes it and must stay React-free.
- Don't add a barrel `index.ts` to `packages/shared` — Metro will pull every
  schema into the mobile bundle.

## Security

- DB calls use better-sqlite3 prepared statements — no string-interpolated SQL.
- Bodies are validated with Zod at the Express boundary before reaching services.
- Auth tokens are JWTs (`jose`). No session cookies. The web client stores them
  in `localStorage`; the mobile client uses `expo-secure-store`.
- The first-run `/api/onboarding` endpoint is the only public registration
  surface and self-disables once a user exists.
