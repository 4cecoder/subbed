# Testing Guide

This guide covers the testing strategies, tools, and best practices for the Subbed project.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Tools](#testing-tools)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Best Practices](#best-practices)
- [Continuous Integration](#continuous-integration)

## 🎯 Overview

Subbed uses a comprehensive testing strategy that includes:

- **Unit Tests**: Individual components and functions
- **Integration Tests**: Component interactions and API calls
- **End-to-End Tests**: Full user workflows
- **Performance Tests**: Load and performance validation

## 🛠️ Testing Tools

### Core Testing Framework

- **Jest**: JavaScript testing framework
- **React Testing Library**: React component testing utilities
- **Jest DOM**: DOM assertions for Jest

### Configuration Files

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## 📁 Test Structure

### Directory Structure

```
__tests__/
├── components/          # Component tests
│   ├── VideoCard.test.tsx
│   ├── SubscriptionList.test.tsx
│   └── AnalyticsDashboard.test.tsx
├── hooks/              # Custom hook tests
│   ├── use-subscriptions.test.ts
│   └── use-settings.test.ts
├── utils/              # Utility function tests
│   └── format-date.test.ts
├── integration/        # Integration tests
│   └── feed-integration.test.tsx
└── e2e/               # End-to-end tests
    └── user-workflow.test.ts

jest.config.js
jest.setup.js
```

### Test File Naming Convention

- Component tests: `ComponentName.test.tsx`
- Hook tests: `useHookName.test.ts`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature-integration.test.tsx`

## ✍️ Writing Tests

### Component Testing

```typescript
// VideoCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { VideoCard } from '../components/VideoCard'
import { FeedItem } from '../lib/types'

describe('VideoCard', () => {
  const mockVideo: FeedItem = {
    id: 'test-video',
    title: 'Test Video',
    link: 'https://youtube.com/watch?v=test',
    published: '2024-01-01T00:00:00Z',
    thumbnail: 'https://example.com/thumb.jpg',
    description: 'Test description',
    channelId: 'test-channel',
    channelTitle: 'Test Channel',
    isShort: false
  }

  it('renders video information correctly', () => {
    render(<VideoCard video={mockVideo} />)

    expect(screen.getByText('Test Video')).toBeInTheDocument()
    expect(screen.getByText('Test Channel')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const mockOnClick = jest.fn()
    render(<VideoCard video={mockVideo} onClick={mockOnClick} />)

    const card = screen.getByRole('button')
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('displays thumbnail when available', () => {
    render(<VideoCard video={mockVideo} />)

    const thumbnail = screen.getByAltText('Test Video')
    expect(thumbnail).toBeInTheDocument()
    expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg')
  })

  it('shows fallback for missing thumbnail', () => {
    const videoWithoutThumbnail = { ...mockVideo, thumbnail: undefined }
    render(<VideoCard video={videoWithoutThumbnail} />)

    const fallbackIcon = screen.getByTestId('video-icon')
    expect(fallbackIcon).toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
// use-subscriptions.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useSubscriptions } from '../hooks/use-subscriptions'
import { ConvexProvider } from '../providers/ConvexProvider'

describe('useSubscriptions', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConvexProvider>{children}</ConvexProvider>
  )

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSubscriptions(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.subscriptions).toEqual([])
  })

  it('loads subscriptions successfully', async () => {
    const { result } = renderHook(() => useSubscriptions(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.subscriptions).toBeDefined()
    expect(Array.isArray(result.current.subscriptions)).toBe(true)
  })

  it('handles errors gracefully', async () => {
    // Mock an error scenario
    const { result } = renderHook(() => useSubscriptions(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify error handling
    if (result.current.error) {
      expect(result.current.error).toBeDefined()
    }
  })
})
```

### Integration Testing

```typescript
// feed-integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedPage } from '../pages/feed'
import { SubscriptionProvider } from '../providers/SubscriptionProvider'

describe('Feed Integration', () => {
  it('loads and displays feed content', async () => {
    render(
      <SubscriptionProvider>
        <FeedPage />
      </SubscriptionProvider>
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })

    // Verify feed content is displayed
    expect(screen.getByText('Latest Videos')).toBeInTheDocument()
    expect(screen.getAllByTestId('video-card')).toHaveLength(10)
  })

  it('filters content by channel', async () => {
    const user = userEvent.setup()

    render(
      <SubscriptionProvider>
        <FeedPage />
      </SubscriptionProvider>
    )

    // Wait for subscriptions to load
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    // Select a specific channel
    const channelSelect = screen.getByRole('combobox')
    await user.click(channelSelect)
    await user.click(screen.getByText('Test Channel'))

    // Verify filtered results
    await waitFor(() => {
      const videoCards = screen.getAllByTestId('video-card')
      expect(videoCards.length).toBeGreaterThan(0)
    })
  })
})
```

### API Testing

```typescript
// api/subscriptions.test.ts
import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '../app/api/subscriptions/route';

describe('/api/subscriptions', () => {
  describe('GET', () => {
    it('returns subscriptions array', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('creates new subscription', async () => {
      const subscriptionData = {
        id: 'test-channel',
        title: 'Test Channel',
        url: 'https://youtube.com/channel/test',
      };

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscriptionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });

    it('validates required fields', async () => {
      const invalidData = { title: 'Test Channel' }; // Missing id

      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('missing id');
    });
  });

  describe('DELETE', () => {
    it('removes specific subscription', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions?id=test-channel', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });

    it('clears all subscriptions when no id provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ ok: true });
    });
  });
});
```

## 🏃 Running Tests

### Basic Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test VideoCard.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="renders video information"
```

### Advanced Options

```bash
# Run tests in specific directory
npm run test -- __tests__/components/

# Run tests with verbose output
npm run test -- --verbose

# Run tests in parallel
npm run test -- --maxWorkers=4

# Generate coverage report
npm run test -- --coverage --coverageDirectory=coverage/

# Run tests with custom configuration
npm run test -- --config jest.config.custom.js
```

### Debugging Tests

```bash
# Run test in debug mode
npm run test -- --inspect-brk VideoCard.test.tsx

# Run specific test case
npm run test -- --testNamePattern="handles click events"

# Run tests with console output
npm run test -- --verbose --no-coverage
```

## 📊 Test Categories

### Unit Tests

- **Purpose**: Test individual functions and components in isolation
- **Scope**: Single function, hook, or component
- **Mocking**: External dependencies are mocked
- **Examples**: Component rendering, utility functions, custom hooks

### Integration Tests

- **Purpose**: Test interactions between multiple components
- **Scope**: Component combinations and API integrations
- **Mocking**: Minimal mocking, focus on real interactions
- **Examples**: Form submissions, data flow, API calls

### End-to-End Tests

- **Purpose**: Test complete user workflows
- **Scope**: Full application flow from user perspective
- **Mocking**: No mocking, uses real backend
- **Examples**: User registration, subscription management, feed browsing

### Performance Tests

- **Purpose**: Validate application performance
- **Scope**: Load times, memory usage, rendering performance
- **Tools**: Lighthouse, Web Vitals, custom performance tests
- **Examples**: Bundle size, first paint, interaction delays

## ✅ Best Practices

### Test Organization

1. **Arrange-Act-Assert Pattern**

   ```typescript
   it('should handle user interaction', () => {
     // Arrange
     const mockData = { /* ... */ }
     render(<Component data={mockData} />)

     // Act
     fireEvent.click(screen.getByRole('button'))

     // Assert
     expect(screen.getByText('Success')).toBeInTheDocument()
   })
   ```

2. **Descriptive Test Names**

   ```typescript
   // ✅ Good
   describe('VideoCard', () => {
     it('displays video title and channel name');
     it('shows thumbnail when available');
     it('handles click events to open video');
   });

   // ❌ Avoid
   describe('VideoCard', () => {
     it('works');
     it('test 1');
     it('should render');
   });
   ```

3. **Test Data Management**

   ```typescript
   // Use factories for test data
   const createMockVideo = (overrides = {}) => ({
     id: 'test-video',
     title: 'Test Video',
     channelTitle: 'Test Channel',
     published: '2024-01-01T00:00:00Z',
     ...overrides
   })

   it('renders video information', () => {
     const video = createMockVideo({ title: 'Custom Title' })
     render(<VideoCard video={video} />)
   })
   ```

### Mocking Strategies

1. **API Calls**

   ```typescript
   import { rest } from 'msw';
   import { setupServer } from 'msw/node';

   const server = setupServer(
     rest.get('/api/subscriptions', (req, res, ctx) => {
       return res(ctx.json(mockSubscriptions));
     })
   );

   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());
   ```

2. **Custom Hooks**

   ```typescript
   jest.mock('../hooks/use-subscriptions');
   const mockUseSubscriptions = useSubscriptions as jest.MockedFunction<typeof useSubscriptions>;

   mockUseSubscriptions.mockReturnValue({
     subscriptions: mockSubscriptions,
     loading: false,
     error: null,
   });
   ```

3. **Context Providers**
   ```typescript
   const mockContextValue = {
     /* ... */
   };
   jest.mock('../contexts/AppContext', () => ({
     useAppContext: () => mockContextValue,
   }));
   ```

### Accessibility Testing

```typescript
it('is accessible', async () => {
  const { container } = render(<VideoCard video={mockVideo} />)

  // Check for ARIA attributes
  expect(screen.getByRole('img')).toHaveAttribute('alt')

  // Run accessibility tests
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### Performance Testing

```typescript
it('renders quickly', () => {
  const startTime = performance.now()

  render(<VideoCard video={mockVideo} />)

  const endTime = performance.now()
  expect(endTime - startTime).toBeLessThan(100) // Less than 100ms
})
```

## 🔄 Continuous Integration

### GitHub Actions Configuration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Coverage Requirements

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Quality Gates

- **Test Coverage**: Minimum 80% coverage
- **Linting**: No ESLint errors
- **TypeScript**: No type errors
- **Build**: Successful production build

## 📈 Test Metrics

### Coverage Goals

| Category   | Target | Current |
| ---------- | ------ | ------- |
| Statements | 80%    | -       |
| Branches   | 80%    | -       |
| Functions  | 80%    | -       |
| Lines      | 80%    | -       |

### Performance Benchmarks

- **Unit Tests**: < 5 seconds
- **Integration Tests**: < 30 seconds
- **E2E Tests**: < 2 minutes
- **Full Suite**: < 5 minutes

## 🐛 Debugging Tests

### Common Issues

1. **Async Tests**

   ```typescript
   // ✅ Correct
   it('loads data asynchronously', async () => {
     render(<AsyncComponent />)
     await waitFor(() => {
       expect(screen.getByText('Data loaded')).toBeInTheDocument()
     })
   })

   // ❌ Incorrect
   it('loads data asynchronously', () => {
     render(<AsyncComponent />)
     expect(screen.getByText('Data loaded')).toBeInTheDocument()
   })
   ```

2. **Mock Cleanup**

   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Memory Leaks**
   ```typescript
   afterEach(() => {
     cleanup();
   });
   ```

### Debugging Tools

- **Jest Debug Mode**: `npm run test -- --inspect-brk`
- **React DevTools**: Component tree inspection
- **Chrome DevTools**: Network and console debugging
- **Testing Playground**: Interactive test development

## 📚 Additional Resources

### Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Docs](https://testing-library.com/docs/)

### Tools and Libraries

- [MSW (Mock Service Worker)](https://mswjs.io/)
- [React Testing Library](https://github.com/testing-library/react-testing-library)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [User Event](https://github.com/testing-library/user-event)

### Learning Resources

- [Testing JavaScript](https://testingjavascript.com/)
- [Kent C. Dodds Blog](https://kentcdodds.com/blog)
- [React Testing Examples](https://github.com/mrdavidlaing/javascript-testing-recipes)

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/TESTING.md
