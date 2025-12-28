# Suggested Commands for Development

## Installation and Setup
- `bun install`: Install dependencies
- `cp .env.example .env`: Copy environment file and fill in values (DATABASE_URL, JWT_SECRET, etc.)

## Development
- `bun run dev`: Start development server with hot reloading
- `bun run build:css`: Build TailwindCSS styles

## Production
- `bun run start`: Start production server

## Code Quality
- `bun run lint`: Run all linting (code and spell check)
- `bun run lint:code`: Lint code with Biome
- `bun run lint:spell`: Check spelling with CSpell

## Database
- `bun run generate`: Generate Drizzle migrations
- `bun run push`: Push schema changes to database
- `bun run migrate`: Run pending migrations
- `bun run studio`: Open Drizzle Studio for database management

## Docker
- `docker-compose -f docker-compose.dev.yml up`: Start development environment with exposed ports
- `docker-compose up`: Start production environment

## Utility Commands (Windows)
- `git status`: Check git status
- `git add .`: Stage all changes
- `git commit -m "message"`: Commit changes
- `powershell` or `cmd`: Open shell if needed
- `bunx --bun <tool>`: Run tools via Bun