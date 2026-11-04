# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this is

Starter template: Bun + Elysia backend, server-rendered JSX (`@kitajs/html`), htmx for interactivity, Drizzle ORM on Postgres, Tailwind 4 + daisyUI 5. It includes a working demo (register, login, per-user todo CRUD, public and protected routes).

## Commands

```bash
bun install
cp .env.example .env            # needs DATABASE_URL and JWT_SECRET (openssl rand -base64 32)
docker compose -f docker-compose.dev.yml up -d   # local Postgres on :5432
bun migrate                     # apply migrations (drizzle-kit, via the `postgres` driver)
bun build:css                   # rebuild public/global.css after adding Tailwind classes
bun dev                         # bun --watch src/index.ts, http://localhost:3000

bun run lint                    # biome check --write src, then cspell lint src
bun x tsc --noEmit              # typecheck (the Dockerfile also runs this)
bun generate                    # new migration after editing src/database/*.schema.ts
```

There is no test suite. Swagger is served by `@elysiajs/swagger` at `/swagger`.

## Architecture

- **Entry**: `src/index.ts` builds the `app` (`loggerPlugin` from `src/plugin/logger.plugin.ts` for startup, request and error logs, then swagger, cors, html, etag, helmet, static, graceful shutdown, then `autoload` of `src/modules`). Anything a module needs (`db`, `user`, services) is added by that module with `.use(...)`, not by the app.
- **Feature modules** (`src/modules/<feature>/`): each feature owns its controller, service and markup. `elysia-autoload` loads only `index.ts(x)` files (`pattern: "**/index.{ts,tsx}"`); other files in a folder (`service.ts`, `page.tsx`, `components.tsx`) are never loaded as routes. A controller is a default-exported `new Elysia()`; its routes are relative to the folder URL (`.get("/")`).
- **URLs come from folders**: `todos/index.tsx` is `/todos`; `(group)` folders are dropped from the URL, so `(home)/index.tsx` is `/` and `(auth)/login/index.tsx` is `/login`. To add a feature, add a folder with an `index.tsx`; no registration step. Links, `hx-*` URLs and redirects use `ROUTES`, `todoPath` and `HX` from `src/shared/routes.ts`, never string literals; startup throws if a `ROUTES` entry has no matching route.
- **Layers inside a module**: controller (`index.tsx`: HTTP, validation, cookies, status codes) calls the service (`service.ts`: business logic and queries, plain values in and out, no HTTP) and renders a page (`page.tsx`: pure component, props in and HTML out, no Elysia or db imports). Shared markup (`BaseHtml`, `Navbar`, `ErrorAlert`) is in `src/shared/components/`.
- **Services get `db` through a plugin**: each service file exports `createXService(db)` (testable with a fake `db`) and a named plugin (`TodoService`, `AuthService`) that derives `todoService`/`authService` from the shared `dbPlugin`. A controller does `.use(TodoService)` and calls `todoService.list(user.id)`; handlers never pass `db`.
- **Auth** (`src/plugin/auth.plugin.ts`): a stateless JWT in an `httpOnly` `session` cookie (not a bearer header, because pages are browser navigations). A global `derive` gives every route `user` (`{ id, username } | null`) plus `startSession(user)` and `endSession()`. Protect routes with the `auth` macro defined in the same plugin: `.use(authPlugin()).guard({ auth: true })` (or `{ auth: true }` on a single route) narrows `user` to non-null; guests get a 302 to `/login`, htmx requests get 401 plus `HX-Redirect`.- **Database**: `src/database/client.ts` creates the drizzle `bun-sql` client (snake_case; SQL logging off in production); `src/plugin/db.plugin.ts` is a single plugin instance that decorates it as `db` so the app shares one pool. Tables are in `src/database/*.schema.ts` and re-exported from `src/database/index.ts`, which is the schema drizzle-kit reads. Todo queries always filter by `user_id` (ownership); keep that on any new per-user table.
- **htmx conventions**: `BaseHtml` sets `htmx-config` so 4xx/5xx responses are swapped (forms show server errors). Handlers return HTML fragments, and `HX-Redirect` response headers do navigation. `index.ts` `onError` turns htmx validation errors into an alert fragment.

## Gotchas

- `drizzle-kit` needs a Node-style driver, so `postgres` is a dev dependency even though the app itself uses Bun's built-in SQL client.
- JSX is typed by `@kitajs/ts-html-plugin`: user-provided text in element bodies must use the `safe` attribute (e.g. `<span safe>{title}</span>`).
- `@elysiajs/html` (registered in `index.ts`) detects HTML strings: controllers return JSX directly, for full pages and fragments alike (pages are served as `text/html`).
- Elysia needs method chaining to keep types: build controllers and plugins as one chain, never `app.get(...)` on a separate line.
- Path aliases (`tsconfig.json`): `@config`, `@plugin`, `@db`, `@components/*`, `@/*`. Imports keep the `.ts`/`.tsx` extension; files inside a module import each other relatively.
- Biome uses tabs, double quotes and no semicolons. cspell checks `src`; add unknown words to `cspell/project-words.txt`.
- The `Dockerfile` and `docker-compose.yml` are stale: they reference `./drizzle` and `./drizzle.config.ts` at the repo root (both now live under `src/`) and do not pass `DATABASE_URL`/`JWT_SECRET` to the app.
