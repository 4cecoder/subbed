Particular guidelines, styles, design patterns:

- Component design: shadcn/ui inspired, using class-variance-authority for variants, Radix UI primitives
- Responsive design: Mobile-first with Tailwind, sm: breakpoints for larger screens
- State management: Local component state with React hooks, no global state library
- Data fetching: Client-side fetch API with async/await, error handling with try/catch
- UI patterns: Cards for sections, dialogs for modals, buttons with icons from Lucide
- Accessibility: Basic focus management, semantic HTML, but limited ARIA attributes
- Error handling: User-friendly error messages displayed in UI, console logging for debugging
- Performance: Debounced search, pagination for feeds, optional caching
- Privacy: No user data collection, local storage only, public API usage
- Design system: Consistent spacing, typography, colors via Tailwind
- Code organization: Single large page component (page.tsx) handling all logic, API routes for backend
- No SSR/SSG: Client-side only app, no server components
- File-based routing: Next.js app router
- Type safety: Strict TypeScript with interfaces for API responses
