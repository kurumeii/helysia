# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this is

Starter template: Bun + Elysia backend, server-rendered JSX (`@kitajs/html`), htmx for interactivity, Drizzle ORM on Postgres, Tailwind 4 + daisyUI 5. It includes a working demo (register, login, per-user todo CRUD, public and protected routes).

## Commands

Bun 1.4.4 or newer: pinned in `.bun-version`, `package.json` `engines` and the `Dockerfile` base image. Bun does not enforce `engines`, so keep these three in sync by hand.

```bash
bun install
cp .env.example .env            # needs DATABASE_URL and JWT_SECRET (openssl rand -base64 32)
docker compose -f docker-compose.dev.yml up -d   # local Postgres on :5432
bun migrate                     # apply migrations (drizzle-kit, via the `postgres` driver)
bun dev                         # dev:server (bun --watch src/index.ts) + dev:css (Tailwind --watch=always) in parallel, http://localhost:3000
bun build:css                   # one-off CSS build (CI or production)

bun run lint                    # biome check --write src, then cspell lint src
bun x tsc --noEmit              # typecheck (the Dockerfile also runs this)
bun generate                    # new migration after editing src/database/*.schema.ts
```

There is no test suite. Swagger is served by `@elysiajs/swagger` at `/swagger`.

## Architecture

- **Entry**: `src/index.ts` builds the `app` (`loggerPlugin` from `src/plugin/logger.plugin.ts` for startup, request and error logs, then swagger, cors, html, etag, helmet, static, graceful shutdown, then `autoloadPlugin` from `src/plugin/autoload.plugin.ts`, which wraps `elysia-autoload` for `src/modules`). Anything a module needs (`db`, `user`, services) is added by that module with `.use(...)`, not by the app.
- **Feature modules** (`src/modules/<feature>/`): each feature owns its controller, service and markup. `elysia-autoload` loads only `index.ts(x)` files (`pattern: "**/index.{ts,tsx}"`); other files in a folder (`service.ts`, `page.tsx`, `components.tsx`) are never loaded as routes. A controller is a default-exported `new Elysia()`; its routes are relative to the folder URL (`.get("/")`).
- **URLs come from folders**: `todos/index.tsx` is `/todos`; `(group)` folders are dropped from the URL, so `(home)/index.tsx` is `/` and `(auth)/login/index.tsx` is `/login`. To add a feature, add a folder with an `index.tsx`; no registration step. Links, `hx-*` URLs and redirects use `ROUTES`, `todoPath` and `HX` from `src/shared/routes.ts`, never string literals; startup throws if a `ROUTES` entry has no matching route.
- **Layers inside a module**: controller (`index.tsx`: HTTP, validation, cookies, status codes) calls the service (`service.ts`: business logic and queries, plain values in and out, no HTTP) and renders a page (`page.tsx`: pure component, props in and HTML out, no Elysia or db imports). Shared markup is in `src/shared/components/`, one component per file (`Layout` wraps `BaseHtml` and `Navbar`; pages use `Layout`).
- **Services get `db` through a plugin**: each service file exports `createXService(db)` (testable with a fake `db`) and a named plugin (`TodoService`, `AuthService`) that derives `todoService`/`authService` from the shared `dbPlugin`. A controller does `.use(TodoService)` and calls `todoService.list(user.id)`; handlers never pass `db`.
- **Auth** (`src/plugin/auth.plugin.ts`): a stateless JWT in an `httpOnly` `session` cookie (not a bearer header, because pages are browser navigations). A global `derive` gives every route `user` (`{ id, username } | null`) plus `startSession(user)` and `endSession()`. Protect routes with the `auth` macro defined in the same plugin: `.use(authPlugin()).guard({ auth: true })` (or `{ auth: true }` on a single route) narrows `user` to non-null; guests get a 302 to `/login`, htmx requests get 401 plus `HX-Redirect`.
- **Database**: `src/database/client.ts` creates the drizzle `bun-sql` client (snake_case; SQL logging off in production); `src/plugin/db.plugin.ts` is a single plugin instance that decorates it as `db` so the app shares one pool, which an `onStop` hook in the same plugin closes when the server stops. Tables are in `src/database/*.schema.ts` and re-exported from `src/database/index.ts`, which is the schema drizzle-kit reads. Todo queries always filter by `user_id` (ownership); keep that on any new per-user table.
- **htmx conventions**: `BaseHtml` sets `htmx-config` so 4xx/5xx responses are swapped (forms show server errors). Handlers return HTML fragments, and `HX-Redirect` response headers do navigation. `index.ts` `onError` turns htmx validation errors into an alert fragment.
- **Logging and shutdown**: `loggerPlugin` (picocolors) prints the startup line, one line per response (`GET /todos 200 12.3ms`) and error stack traces, skipping 404s. `gracefulShutdownPlugin` registers `SIGINT`/`SIGTERM`/`uncaughtException` handlers in `onStart`, ignores repeated signals, forces exit after 10 seconds, and exits 1 on failure.
- **Styles**: Tailwind and daisyUI are compiled by `bun build:css` into `public/global.css` and served from `/static`; `BaseHtml` loads no CDN stylesheets. To upgrade daisyUI, run `bun update daisyui` then `bun build:css`, and commit `bun.lock` and `public/global.css`.

## Gotchas

- `drizzle-kit` needs a Node-style driver, so `postgres` is a dev dependency even though the app itself uses Bun's built-in SQL client.
- JSX is typed by `@kitajs/ts-html-plugin`: user-provided text in element bodies must use the `safe` attribute (e.g. `<span safe>{title}</span>`).
- `@elysiajs/html` (registered in `index.ts`) detects HTML strings: controllers return JSX directly, for full pages and fragments alike (pages are served as `text/html`).
- Elysia needs method chaining to keep types: build controllers and plugins as one chain, never `app.get(...)` on a separate line.
- Path aliases (`tsconfig.json`): `@config`, `@plugin`, `@db`, `@components/*`, `@/*`. Imports keep the `.ts`/`.tsx` extension; files inside a module import each other relatively.
- Biome uses tabs, double quotes and semicolons (its defaults; `biome.json` sets only tabs). cspell checks `src`; add unknown words to `cspell/project-words.txt`. `.cspellcache` is git-ignored.
- Plugins are named (`new Elysia({ name: "plugin.x" })`), live in `src/plugin/` and are re-exported from `src/plugin/index.ts`. Hook scope matters: `derive`, `resolve` and `onError` default to `local`, so use `{ as: "global" }` (or `"scoped"`) for anything other instances must see.
- `Layout` takes exactly one child (the page's `<main>`), not an array.
- Comments: write one only when the reason is not obvious from the code (a security rationale, a runtime surprise). Do not add comments that restate the code or describe a layer's role; this file covers that.
- Docker: the image copies `src/` and `public/` only and never `.env*` (`.dockerignore` excludes them); `DATABASE_URL` and `JWT_SECRET` come from the environment, set in `docker-compose.yml` from `.env`. Migrations run through the `migrate` compose service (profile `tools`, built from the `prerelease` stage because `drizzle-kit` is a dev dependency). Keep new runtime files (anything read from disk, like `public/`) in the `release` stage's `COPY` list. Postgres is pinned to `postgres:18`, whose image requires the data volume mounted at `/var/lib/postgresql` (not `.../data`). The release `COPY`s use `--chown=bun:bun` because the container runs as the non-root `bun` user and a checkout with mode 640 files would otherwise be unreadable. Verified with podman 6.1.4 and podman-compose 1.6.0 (build, `migrate`, register, login and todo CRUD against the compose Postgres); not run under Docker.
