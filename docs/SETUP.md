# Setup Guide

This guide will help you get Subbed up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** or **Bun** (recommended)
- **Git** for version control
- **Convex Account** for backend services
- **Clerk Account** for authentication

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/4cecoder/subbed.git
cd subbed
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=...

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=...
```

### 4. Set Up Convex Backend

```bash
# Install Convex CLI globally
npm install -g convex

# Initialize Convex in your project
npx convex dev
```

Follow the prompts to:
1. Create a new Convex project or link to existing
2. Set up your deployment environment
3. Configure authentication

### 5. Set Up Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the publishable key and secret key to your `.env.local`
4. Configure sign-in/sign-up URLs in Clerk dashboard

### 6. Start Development Server

```bash
# Using Bun
bun run dev

# Or using npm
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Setup

### Code Quality Tools

The project includes several development tools:

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

### Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Start Convex development environment
npm run convex:dev

# Generate Convex types
npm run convex:generate

# Run database migrations
npm run convex:run
```

## Project Structure

```
subbed/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature components
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── subscriptions.ts  # Subscription functions
│   └── ...               # Other backend functions
├── lib/                  # Utility libraries
│   ├── hooks/           # Custom React hooks
│   ├── context/         # React context providers
│   └── ...              # Other utilities
├── __tests__/           # Test files
├── docs/                # Documentation
└── public/              # Static assets
```

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment URL | `https://...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ANALYTICS_ID` | Analytics tracking ID | - |
| `NODE_ENV` | Environment mode | `development` |
| `NEXT_PUBLIC_API_URL` | Custom API URL | Convex URL |

## Database Setup

### Convex Schema

The application uses the following main tables:

- **subscriptions**: User YouTube subscriptions
- **settings**: User preferences and settings
- **sync**: Synchronization queue for offline operations

### Initial Data

For development, you can populate the database with sample data:

```bash
# Add sample subscriptions
npx convex run dev_subscriptions:addDevSubscription '{
  "channelId": "UCsBjURrPoezykLs9EqgamOA",
  "channelName": "Fireship",
  "channelLogoUrl": "https://yt3.ggpht.com/...",
  "channelUrl": "https://youtube.com/@Fireship"
}'
```

## Authentication Setup

### Clerk Configuration

1. **Sign-in/Sign-up URLs**: Configure in Clerk dashboard
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/`
   - After sign-up URL: `/`

2. **Social Providers**: Enable Google, GitHub, etc. in Clerk

3. **User Profile**: Configure custom fields if needed

### Convex Authentication

Convex automatically integrates with Clerk for user authentication. No additional setup required.

## Testing Setup

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- __tests__/component.test.tsx
```

### Test Configuration

Tests are configured in `jest.config.js` and `jest.setup.js`. The setup includes:
- React Testing Library configuration
- Convex mock setup
- Custom test utilities

## Troubleshooting

### Common Issues

1. **Convex Connection Issues**
   ```bash
   # Check Convex status
   npx convex status

   # Reinitialize Convex
   npx convex dev --reset
   ```

2. **Authentication Issues**
   - Verify Clerk keys in `.env.local`
   - Check Clerk dashboard configuration
   - Ensure URLs match between Clerk and app

3. **Build Issues**
   ```bash
   # Clear Next.js cache
   rm -rf .next

   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](../TROUBLESHOOTING.md)
2. Search existing GitHub issues
3. Open a new issue with detailed information

## Next Steps

Once you have Subbed running locally:

1. **Explore the Features**: Try adding subscriptions and filtering feeds
2. **Review the Code**: Understand the architecture and components
3. **Run Tests**: Ensure everything works as expected
4. **Deploy**: Follow the [Deployment Guide](../DEPLOYMENT.md)

Happy coding! 🚀