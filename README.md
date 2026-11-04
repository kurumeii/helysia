# This is a starter template for Elysia and Htmx

## Core concepts

Backend will be using [Elysia](https://elysiajs.com/) with bunch of useful plugins. Frontend will be server rendered with the help of [htmx](http://htmx.org)

## How to use

1. Clone the repo

```bash
tiged kurumeii/helysia <your-project-name>
```

2. Install dependencies

```bash
bun install
```

3. Copy `.env.example` to `.env` and fill in the values

```bash
cp .env.example .env
-- Use open ssl rand -base 64
JWT_SECRET = 
```

4. Start Postgres, apply migrations, build CSS and run

```bash
docker compose -f docker-compose.dev.yml up -d
bun migrate
bun build:css
bun dev
```

## Demo included

| Route                              | Access    | Shows                                          |
| ---------------------------------- | --------- | ---------------------------------------------- |
| `GET /`                            | public    | Landing page, navbar reacts to sign-in state   |
| `GET/POST /register`               | guests    | Insert a user, hash the password, start a session |
| `GET/POST /login`                  | guests    | Look up a user, verify the hash, start a session |
| `POST /logout`                     | any       | End the session                                |
| `GET /todos`                       | protected | List the signed-in user's todos                |
| `POST /todos`                      | protected | Create                                         |
| `GET /todos/:id`, `/:id/edit`      | protected | Read one row (display and edit form)           |
| `PUT /todos/:id`, `PATCH /:id/toggle` | protected | Update                                      |
| `DELETE /todos/:id`                | protected | Delete                                         |

How it fits together:

- **Session**: `src/plugin/auth.plugin.ts` signs a JWT into an `httpOnly`, `SameSite=Lax` cookie (7 days). Every route gets `user` (or `null`). The token is stateless, so it cannot be revoked before it expires.
- **Protect routes**: `.use(requireAuth())` (from `@plugin`) rejects guests and makes `user` non-null. Pages redirect to `/login`, htmx requests get `401` plus `HX-Redirect`. See `src/modules/todos/index.tsx`.
- **Database**: `src/database/client.ts` creates the client and `src/plugin/db.plugin.ts` shares it. Tables live in `src/database/`.
- **Ownership**: every todo query filters by `user_id`, so users cannot see or change each other's rows.
- **Features are folders**: each folder in `src/modules/` holds a controller (`index.tsx`), a service (`service.ts`) and its markup (`page.tsx`, `components.tsx`). `elysia-autoload` mounts every `index.tsx`, and the folder name is the URL (`todos/` is `/todos`; a `(group)` folder is left out of the URL). Add a feature by adding a folder.
- **Layers**: the controller handles HTTP and calls the service (business logic and queries, no HTTP). Pages are pure components with no Elysia or database imports. Shared markup is in `src/shared/components/`.
- **Production**: set `NODE_ENV=production` so the session cookie gets the `Secure` flag, which needs HTTPS.
