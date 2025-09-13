Subbed — YouTube subscription manager (local + no logins)

This project runs locally and stores subscriptions in a local SQLite database. It does not require any login.

## Quick setup (local machine):

1.  Install dependencies

    ```bash
    bun install
    ```

    Or if you prefer npm:

    ```bash
    npm install
    ```

    Note: `better-sqlite3` is a native package and may require build tools on your system (Python 3, make, gcc/clang). On Debian/Ubuntu:

    ```bash
    sudo apt update && sudo apt install -y build-essential python3
    ```

    On Gentoo:

    ```bash
    emerge --ask dev-lang/python sys-devel/gcc sys-devel/make
    ```

2.  Start the dev server

    ```bash
    bun run dev
    ```

    Or:

    ```bash
    npm run dev
    ```

3.  Open http://localhost:3000

## Authentication

This project uses [Clerk](https://clerk.com/) for authentication.

### Environment Variables

Create a `.env.local` file in the root of the project and add the following environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## ConvexDB Integration

This project uses [Convex](https://convex.dev/) as a backend for storing and managing subscriptions.

### Setup

1.  **Install Convex CLI:**

    ```bash
    npm install -g convex
    ```

2.  **Initialize Convex:**

    Run the following command in your project root and follow the prompts:

    ```bash
    npx convex dev
    ```

    This will create a `convex` directory with a basic schema and functions.

### Environment Variables

Add the following environment variables to your `.env.local` file:

```
CONVEX_URL=...
CLERK_JWT_ISSUER_DOMAIN=...
```

You can get the `CONVEX_URL` from the Convex dashboard. The `CLERK_JWT_ISSUER_DOMAIN` should be set to your Clerk JWT issuer domain.

### API Usage

The Convex backend provides the following functions for managing subscriptions:

*   `getSubscriptions`: Retrieves all subscriptions for the authenticated user.
*   `addSubscription`: Adds a new subscription for the authenticated user.
*   `deleteSubscription`: Deletes a subscription for the authenticated user.

All API functions are secured and require a valid Clerk JWT. The backend validates the token and ensures that users can only access their own data.

## Notes
- The app provisions the SQLite DB automatically at `./data/subbed.sqlite` when the server runs.
- No Google/YouTube login is used. The server fetches public YouTube oEmbed and Atom feeds to provide video lists.

If you prefer to avoid any network lookups when adding subscriptions, enter channel IDs directly (they start with `UC`).

## Commands
- `bun run dev` or `npm run dev` — development server
- `bun run build` and `bun run start` or `npm run build` and `npm run start` — build and run in production

If you want an Electron/desktop wrapper or to change where the DB file is stored, set environment variable `SUBBED_DB_FILE` to an absolute path before starting the server.
