Code style and conventions:

- TypeScript: Strict mode enabled, type annotations for all variables and functions, interfaces for data structures
- React: Functional components with hooks, no class components, useEffect for side effects, useState for local state
- Naming: camelCase for variables/functions, PascalCase for components and types, kebab-case for file names
- Imports: Absolute imports with @/ alias for lib and components, relative imports for local files
- Async/await: Preferred over promises for API calls
- Error handling: Try/catch blocks with error state management
- Styling: Tailwind CSS classes, responsive design with sm: prefixes, shadcn/ui component patterns
- Component structure: Props destructuring, default values, forwardRef for custom components
- API routes: Next.js API routes with GET/POST/DELETE handlers, JSON responses
- File organization: app/ for pages and API, components/ui/ for reusable UI components, lib/ for utilities, data/ for storage
- Comments: ESLint disable comments for specific rules, minimal inline comments
- Formatting: Not explicitly configured (no Prettier), but consistent indentation and spacing
