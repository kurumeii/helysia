# Code Style and Conventions

## Formatting and Linting
- **Formatter**: Biome (configured in `biome.json`)
- **Indentation**: Tabs
- **Quotes**: Double quotes
- **Semicolons**: As needed (ASI)
- **Trailing Commas**: ES5 style
- **Imports**: Organized automatically by Biome

## TypeScript
- **Strict Mode**: Enabled
- **JSX**: React-jsx with @kitajs/html for HTMX
- **Type Checking**: No unchecked indexed access
- **Paths**: Use path aliases (e.g., `@config`, `@plugin`, `@db`, `@components/*`, `@/*`)

## Naming Conventions
- **Files**: kebab-case for directories, camelCase for files (e.g., `user.schema.ts`)
- **Variables/Functions**: camelCase
- **Classes/Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Database**: snake_case (configured in Drizzle)

## Code Structure
- **Backend**: Elysia plugins for modularity
- **Frontend**: Server-rendered JSX with HTMX attributes
- **Database**: Drizzle schemas with generated TypeBox schemas
- **Routes**: Autoloaded from `src/views/`

## Best Practices
- Use Elysia plugins for reusable functionality
- Leverage HTMX for dynamic interactions without JavaScript
- Keep components in `src/shared/components/`
- Use environment variables for configuration
- Follow RESTful conventions for API routes

## Design Patterns
- Plugin pattern for Elysia extensions
- Repository pattern implied in database layer
- Component-based frontend with shared components