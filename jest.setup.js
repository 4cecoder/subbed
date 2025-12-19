import '@testing-library/jest-dom';

// Mock @clerk/nextjs to avoid ESM issues with @clerk/backend
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, isLoaded: true, user: null }),
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useClerk: () => ({ openSignIn: jest.fn(), openSignUp: jest.fn() }),
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => null,
  ClerkProvider: ({ children }) => children,
}));

// Mock @clerk/nextjs/server
jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: () => req => req,
  auth: () => ({ userId: null }),
}));
