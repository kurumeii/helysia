# What to Do When a Task is Completed

After completing a development task, follow these steps to ensure code quality and consistency:

1. **Run Linting**: Execute `bun run lint` to check code style and spelling
   - This runs both `lint:code` (Biome) and `lint:spell` (CSpell)
   - Fix any issues reported

2. **Build Styles** (if CSS changes): Run `bun run build:css` to compile TailwindCSS

3. **Test Changes**: 
   - Start dev server with `bun run dev` and manually test functionality
   - Check browser console for errors
   - Verify HTMX interactions work correctly

4. **Database Changes** (if schema modified):
   - Run `bun run generate` to create migrations
   - Apply with `bun run push` or `bun run migrate`

5. **Commit Changes**:
   - Stage files: `git add .`
   - Commit with descriptive message: `git commit -m "Description of changes"`

6. **Environment Check**: Ensure `.env` has required variables before deployment

For production deployment, use Docker Compose or build the container as needed.