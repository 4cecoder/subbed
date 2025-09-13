# Subbed — YouTube Subscription Manager

This project is a YouTube subscription manager that allows users to manage their channel subscriptions and view recent uploads. It uses Clerk for authentication and Convex for the backend.

## UI Changes and New Component Functionalities

### Login, Logout, and Profile Management

- **Clerk Integration**: The application now uses Clerk for user authentication.
  - **Login/Signup**: New users can sign up and existing users can sign in using the Clerk-provided UI. This is available via the "Sign in" button in the header.
  - **User Profile**: Once signed in, users can manage their profile by clicking on the user button in the header. This opens the Clerk profile management interface.
  - **Logout**: Users can sign out by clicking the "Sign out" option in the user profile menu.

### Subscription Management

- **Real-time Synchronization**: Subscriptions are now stored in ConvexDB, providing real-time synchronization across all devices. When a user adds or removes a subscription, the changes are instantly reflected everywhere.
- **Fetching Subscriptions**: After a user logs in, their subscriptions are fetched from ConvexDB and displayed in a list.
- **Loading and Error States**:
  - **Loading**: A loading skeleton is displayed while the subscriptions are being fetched.
  - **Empty State**: If the user has no subscriptions, a message is displayed with a button to add a sample subscription.
  - **Errors**: If there is an error fetching the subscriptions, a relevant error message will be displayed to the user.

### New Components

- **`Header`**: A new header component has been added, which includes the application title and the Clerk user management buttons (Sign in/Sign up, User Profile).
- **`SubscriptionList`**: This component is responsible for displaying the list of user subscriptions. It handles the display of each subscription, including the channel logo, name, and a button to remove the subscription.
- **`FeedLoading`**: A component that displays a skeleton loader while data is being fetched.
- **`FeedEmpty`**: A component that is displayed when the user has no subscriptions.

### Accessibility and Responsiveness

- All new UI components have been designed to be fully accessible, following WCAG 2.1 AA guidelines. This includes proper use of ARIA attributes, keyboard navigation, and focus management.
- The UI is fully responsive and works seamlessly on all screen sizes, from mobile devices to desktops.

## Quick setup (local machine):

1.  Install dependencies

    ```bash
    bun install
    ```

    Or if you prefer npm:

    ```bash
    npm install
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
NEXT_PUBLIC_CONVEX_URL=...
```

You can get the `NEXT_PUBLIC_CONVEX_URL` from the Convex dashboard.

### API Usage

The Convex backend provides the following functions for managing subscriptions:

*   `getSubscriptions`: Retrieves all subscriptions for the authenticated user.
*   `addSubscription`: Adds a new subscription for the authenticated user.
*   `removeSubscription`: Deletes a subscription for the authenticated user.

All API functions are secured and require a valid Clerk JWT. The backend validates the token and ensures that users can only access their own data.

## Deployment (Vercel)

1.  **Set up environment variables:**
    - In your Vercel project dashboard, navigate to **Settings > Environment Variables**.
    - Add the following variables:
      - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
      - `CLERK_SECRET_KEY`
      - `NEXT_PUBLIC_CONVEX_URL`

2.  **Import project:**
    - In the Vercel dashboard, import your Git repository.

3.  **Deploy:**
    - Push your code to the main branch. Vercel will automatically build and deploy the project.
