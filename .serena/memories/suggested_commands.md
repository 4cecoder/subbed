Suggested commands for developing this project:
- Development server: `bun run dev` or `npm run dev` (starts Next.js dev server with Turbopack)
- Build for production: `bun run build` or `npm run build` (builds the app with Turbopack)
- Start production server: `bun run start` or `npm run start` (serves the built app)
- Linting: `bun run lint` or `npm run lint` (runs ESLint)
- Install dependencies: `bun install` or `npm install`
- Note: Bun is preferred but npm works too. For native packages like better-sqlite3 (mentioned in README but not used), may need build tools on Linux (apt install build-essential python3)
- Environment: Set SUBBED_DB_FILE to absolute path if changing DB location (defaults to ./data/subscriptions.json)
- Open app: http://localhost:3000 after starting dev server