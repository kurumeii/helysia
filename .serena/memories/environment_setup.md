# Environment Setup

## Required Environment Variables
- `NODE_ENV`: development/production/test (default: development)
- `PORT`: Server port (default: 3000)
- `API_URL`: API base URL (derived from PUBLIC_DOMAIN)
- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Secret key for JWT tokens (required, generate with `openssl rand -base64`)

## Database
- Uses PostgreSQL
- Connection via DATABASE_URL
- Schema managed with Drizzle ORM
- Migrations in `src/database/drizzle/`

## Docker Setup
- Development: `docker-compose.dev.yml` (exposes DB port 5432)
- Production: `docker-compose.yml` (no exposed ports)

## Static Assets
- HTMX library: Served from `/static/scripts/htmx.min.js`
- CSS: Built to `public/global.css`
- DaisyUI themes loaded from CDN