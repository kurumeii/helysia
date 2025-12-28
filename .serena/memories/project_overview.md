# Project Overview

Helysia is a starter template for building full-stack web applications using Elysia.js (a Bun-based web framework) and HTMX for server-rendered frontend interactions.

## Tech Stack
- **Runtime**: Bun
- **Backend**: Elysia.js with plugins (CORS, JWT, static files, HTML rendering, etc.)
- **Frontend**: HTMX with server-side rendering, TailwindCSS for styling, DaisyUI for components
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript with JSX support via @kitajs/ts-html-plugin
- **Linting/Formatting**: Biome
- **Spell Checking**: CSpell
- **Containerization**: Docker with Docker Compose

## Codebase Structure
- `src/index.ts`: Main application entry point
- `src/config/`: Configuration files (env, drizzle)
- `src/database/`: Database schemas and migrations
- `src/plugin/`: Custom Elysia plugins (auth, db, static)
- `src/shared/`: Shared components and styles
- `src/views/`: Route handlers and views
- `public/`: Static assets

## Key Features
- Server-rendered HTMX frontend
- JWT authentication
- Database integration with Drizzle
- Docker setup for development and production
- Hot reloading in development