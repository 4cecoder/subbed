# Code Style Guide

This document outlines the coding conventions and best practices for the Subbed project.

## 📋 Table of Contents

- [TypeScript](#typescript)
- [React](#react)
- [Naming Conventions](#naming-conventions)
- [Imports](#imports)
- [Async/Await](#asyncawait)
- [Error Handling](#error-handling)
- [Styling](#styling)
- [Component Structure](#component-structure)
- [API Routes](#api-routes)
- [File Organization](#file-organization)
- [Comments](#comments)
- [Formatting](#formatting)

## 🔷 TypeScript

### Strict Mode
- **Strict mode enabled** in `tsconfig.json`
- All variables and functions must have explicit type annotations
- Use `unknown` instead of `any` when type is uncertain

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// ❌ Avoid
function getUser(id) {  // Missing type annotation
  // Implementation
}
```

### Interfaces vs Types
- Use **interfaces** for object shapes that may be extended
- Use **type aliases** for unions, primitives, and complex types

```typescript
// ✅ Good
interface Subscription {
  id: string
  title: string
  url: string
}

type FeedType = 'all' | 'video' | 'short'
type UserSettings = Record<string, unknown>

// ❌ Avoid
type Subscription = {
  id: string
  title: string
  url: string
}
```

### Generics
- Use descriptive generic names
- Provide constraints when necessary

```typescript
// ✅ Good
interface ApiResponse<T> {
  data: T
  error?: string
}

function fetchData<T extends { id: string }>(endpoint: string): Promise<T[]> {
  // Implementation
}

// ❌ Avoid
function fetchData<T>(endpoint: string): Promise<T[]> {
  // Implementation
}
```

## ⚛️ React

### Functional Components
- Use functional components with hooks
- No class components

```typescript
// ✅ Good
interface VideoCardProps {
  video: FeedItem
  onClick?: () => void
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div onClick={onClick}>
      <h3>{video.title}</h3>
    </div>
  )
}

// ❌ Avoid
class VideoCard extends React.Component {
  render() {
    return <div>{this.props.video.title}</div>
  }
}
```

### Hooks
- Use `useState` for local state
- Use `useEffect` for side effects
- Custom hooks for reusable logic

```typescript
// ✅ Good
export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions().then(setSubscriptions).finally(() => setLoading(false))
  }, [])

  return { subscriptions, loading }
}

// ❌ Avoid
export function SubscriptionList() {
  const [data, setData] = useState(null)

  useEffect(() => {
    // Side effect mixed with component logic
  }, [])

  // Component logic mixed with data fetching
}
```

### Props
- Use destructuring in component parameters
- Provide default values for optional props
- Use `forwardRef` for custom components that need refs

```typescript
// ✅ Good
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', onClick }, ref) => (
    <button ref={ref} className={`btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  )
)

// ❌ Avoid
export function Button(props) {
  const { children, variant, onClick } = props
  return <button className={`btn-${variant || 'primary'}`} onClick={onClick}>
    {children}
  </button>
}
```

## 📝 Naming Conventions

### Variables and Functions
- Use `camelCase` for variables and functions

```typescript
// ✅ Good
const userName = 'John'
function getUserData() { /* ... */ }
const isLoading = false

// ❌ Avoid
const user_name = 'John'
const UserName = 'John'
function get_user_data() { /* ... */ }
```

### Components and Types
- Use `PascalCase` for components, interfaces, and types

```typescript
// ✅ Good
interface UserProfile {}
type VideoItem = {}
function VideoCard() { /* ... */ }

// ❌ Avoid
interface userProfile {}
type videoItem = {}
function videoCard() { /* ... */ }
```

### Files and Directories
- Use `kebab-case` for file names
- Use `PascalCase` for component files

```typescript
// ✅ Good
components/
  ├── video-card.tsx
  ├── subscription-list.tsx
  └── user-profile.tsx

lib/
  ├── api-client.ts
  └── format-date.ts

// ❌ Avoid
components/
  ├── VideoCard.tsx
  ├── subscriptionList.tsx
  └── user_profile.tsx
```

### Constants
- Use `UPPER_SNAKE_CASE` for constants

```typescript
// ✅ Good
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRIES = 3

// ❌ Avoid
const apiBaseUrl = 'https://api.example.com'
const maxRetries = 3
```

## 📦 Imports

### Import Order
1. React imports
2. Third-party libraries
3. Local imports (utilities, hooks, components)
4. Type imports

```typescript
// ✅ Good
import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'

import { useSubscriptions } from '@/hooks/use-subscriptions'
import { VideoCard } from '@/components/video-card'
import type { FeedItem } from '@/lib/types'

// ❌ Avoid
import { VideoCard } from '@/components/video-card'
import React, { useState } from 'react'
import { format } from 'date-fns'
import { useSubscriptions } from '@/hooks/use-subscriptions'
```

### Absolute Imports
- Use `@/` alias for lib and components directories

```typescript
// ✅ Good
import { apiClient } from '@/lib/api-client'
import { VideoCard } from '@/components/video-card'
import type { FeedItem } from '@/lib/types'

// ❌ Avoid
import { apiClient } from '../../../lib/api-client'
import { VideoCard } from '../components/video-card'
```

### Import Types
- Use `import type` for type-only imports

```typescript
// ✅ Good
import type { FeedItem, Subscription } from '@/lib/types'
import { VideoCard } from '@/components/video-card'

// ❌ Avoid
import { FeedItem, Subscription, VideoCard } from '@/lib/types'
```

## 🔄 Async/Await

### Preferred Pattern
- Use `async/await` over promise chains
- Handle errors with try/catch

```typescript
// ✅ Good
export async function fetchSubscriptions(): Promise<Subscription[]> {
  try {
    const response = await fetch('/api/subscriptions')
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    throw error
  }
}

// ❌ Avoid
export function fetchSubscriptions(): Promise<Subscription[]> {
  return fetch('/api/subscriptions')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }
      return response.json()
    })
    .catch(error => {
      console.error('Error fetching subscriptions:', error)
      throw error
    })
}
```

### Error Handling in Components
- Use error boundaries for React components
- Handle async errors gracefully

```typescript
// ✅ Good
export function SubscriptionList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptions()
      .then(setSubscriptions)
      .catch(error => setError(error.message))
  }, [])

  if (error) {
    return <div className="error">Error: {error}</div>
  }

  return (
    <ul>
      {subscriptions.map(sub => (
        <li key={sub.id}>{sub.title}</li>
      ))}
    </ul>
  )
}
```

## 🎨 Styling

### Tailwind CSS
- Use utility-first approach
- Follow responsive design patterns
- Use consistent spacing and colors

```typescript
// ✅ Good
export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <img
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-48 object-cover rounded-md mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {video.title}
      </h3>
      <p className="text-sm text-gray-600">{video.channelTitle}</p>
    </div>
  )
}

// ❌ Avoid
export function VideoCard({ video }: VideoCardProps) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '16px' }}>
      <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '192px' }} />
      <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{video.title}</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>{video.channelTitle}</p>
    </div>
  )
}
```

### Responsive Design
- Use Tailwind's responsive prefixes
- Mobile-first approach

```typescript
// ✅ Good
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

// ❌ Avoid
<div className="grid grid-cols-3 gap-4">
  {/* Content - not responsive */}
</div>
```

### Shadcn/ui Components
- Use shadcn/ui components for consistency
- Follow the established design system

```typescript
// ✅ Good
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{video.title}</h3>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{video.description}</p>
        <Button className="mt-4">Watch Video</Button>
      </CardContent>
    </Card>
  )
}
```

## 🏗️ Component Structure

### Component Organization
- Group related components in directories
- Use index files for clean imports

```typescript
// components/video/
├── index.ts
├── video-card.tsx
├── video-list.tsx
└── video-player.tsx

// components/video/index.ts
export { VideoCard } from './video-card'
export { VideoList } from './video-list'
export { VideoPlayer } from './video-player'
```

### Component Composition
- Prefer composition over inheritance
- Use render props or children for flexibility

```typescript
// ✅ Good
interface FeedContainerProps {
  children: React.ReactNode
  loading?: boolean
  error?: string
}

export function FeedContainer({ children, loading, error }: FeedContainerProps) {
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div className="feed-container">{children}</div>
}

// Usage
<FeedContainer loading={isLoading} error={error}>
  <VideoList videos={videos} />
</FeedContainer>
```

## 🌐 API Routes

### Route Structure
- Use Next.js API routes
- Follow RESTful conventions
- Return consistent JSON responses

```typescript
// app/api/subscriptions/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const subscriptions = await getSubscriptions()
    return NextResponse.json(subscriptions)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const subscription = await createSubscription(body)
    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 400 }
    )
  }
}
```

### Error Handling
- Use appropriate HTTP status codes
- Provide descriptive error messages
- Log errors for debugging

```typescript
// ✅ Good
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validation
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const subscription = await createSubscription(body)
    return NextResponse.json(subscription, { status: 201 })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## 📁 File Organization

### Directory Structure
```
app/
├── api/           # API routes
├── (auth)/        # Route groups
└── layout.tsx     # Root layout

components/
├── ui/            # Reusable UI components
├── forms/         # Form components
└── layouts/       # Layout components

lib/
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── validations/   # Validation schemas

data/              # Static data and configurations
public/            # Static assets
```

### File Naming
- Use descriptive, kebab-case names
- Group related files together

```typescript
// ✅ Good
lib/
├── api-client.ts
├── date-utils.ts
├── subscription-utils.ts
└── validation-schemas.ts

// ❌ Avoid
lib/
├── api.ts
├── utils.ts
├── helpers.ts
└── schemas.ts
```

## 💬 Comments

### When to Comment
- Complex business logic
- Non-obvious algorithms
- API integrations
- TODO items and known issues

```typescript
// ✅ Good
// Calculate video duration from YouTube API format (PT#H#M#S)
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

// ❌ Avoid
// This function parses the duration
function parseDuration(duration: string): number {
  // Get hours, minutes, seconds
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  // Convert to seconds
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}
```

### ESLint Disable Comments
- Use sparingly and with explanation
- Prefer fixing the underlying issue

```typescript
// ✅ Good
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Legacy API response type
const response: any = await fetch('/api/legacy')

// ❌ Avoid
// eslint-disable-next-line
const response = await fetch('/api/legacy')
```

## 🎨 Formatting

### Consistent Indentation
- Use 2 spaces for indentation
- Consistent spacing around operators and brackets

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`)
    .then(response => response.json())
}

// ❌ Avoid
interface User{
id:string
name:string
email:string
}

function getUser(id:string):Promise<User>{
  return fetch(`/api/users/${id}`).then(response=>response.json())
}
```

### Line Length
- Keep lines under 100 characters
- Break long lines appropriately

```typescript
// ✅ Good
const userProfile = await apiClient.get('/users/profile', {
  params: { include: 'preferences,settings' }
})

// ❌ Avoid
const userProfile = await apiClient.get('/users/profile', { params: { include: 'preferences,settings' } })
```

### Semicolons
- Use semicolons consistently
- Required by TypeScript in some cases

```typescript
// ✅ Good
const name = 'John'
function greet() {
  return 'Hello'
}

// ❌ Avoid (inconsistent)
const name = 'John'
function greet() {
  return 'Hello'
}
```

## 🛠️ Development Tools

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', '@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  }
}
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test
```

### VS Code Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📚 Additional Resources

### Style Guides
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### Tools
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/)

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/CODE_STYLE.md