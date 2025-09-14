# Contributing to Subbed

Thank you for your interest in contributing to Subbed! We welcome contributions from developers of all skill levels. This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)
- [Community](#community)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun**
- **Git** for version control
- **GitHub account** for submitting pull requests
- **Code editor** (VS Code recommended)

### Quick Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/subbed.git
   cd subbed
   ```

2. **Install dependencies**

   ```bash
   bun install  # or npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

4. **Start development server**
   ```bash
   bun run dev  # or npm run dev
   ```

## 🛠️ Development Setup

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210

# Development
NODE_ENV=development
```

### Convex Setup

1. **Install Convex CLI**

   ```bash
   npm install -g convex
   ```

2. **Initialize Convex**

   ```bash
   npx convex dev
   ```

3. **Deploy schema**
   ```bash
   npx convex deploy
   ```

## 📝 Contributing Guidelines

### Types of Contributions

We welcome the following types of contributions:

- 🐛 **Bug fixes** - Fix existing issues
- ✨ **Features** - Add new functionality
- 📚 **Documentation** - Improve documentation
- 🎨 **UI/UX** - Improve user interface and experience
- 🧪 **Tests** - Add or improve tests
- 🔧 **Tools** - Development tools and scripts

### Development Workflow

1. **Choose an issue** from our [GitHub Issues](https://github.com/your-username/subbed/issues)
2. **Create a branch** for your work

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit your work** with clear commit messages
6. **Push your branch** and create a pull request

### Branch Naming Convention

```bash
# Feature branches
feature/add-dark-mode
feature/improve-search

# Bug fix branches
fix/dropdown-not-working
fix/mobile-layout-issue

# Documentation branches
docs/update-api-docs
docs/add-contributing-guide

# Hotfix branches (for urgent fixes)
hotfix/critical-security-fix
```

## 💻 Code Style

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow the existing code style in the project
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### React Components

```typescript
// ✅ Good
interface VideoCardProps {
  video: VideoItem;
  onClick?: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div className="video-card" onClick={onClick}>
      <h3>{video.title}</h3>
      <p>{video.description}</p>
    </div>
  );
}

// ❌ Avoid
function videocard(props) {
  return <div>{props.video.title}</div>;
}
```

### File Structure

```
components/
├── ui/           # Reusable UI components
├── VideoCard.tsx # Feature-specific components
└── Feed.tsx      # Page-level components

lib/
├── hooks/        # Custom React hooks
├── utils/        # Utility functions
└── types/        # TypeScript type definitions
```

### Commit Messages

Follow conventional commit format:

```bash
# ✅ Good
feat: add dark mode toggle
fix: resolve dropdown scrolling issue
docs: update API documentation
test: add unit tests for video card component

# ❌ Avoid
fixed bug
updated code
changes
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test VideoCard.test.tsx

# Run with coverage
npm run test -- --coverage
```

### Writing Tests

```typescript
// VideoCard.test.tsx
import { render, screen } from '@testing-library/react';
import { VideoCard } from './VideoCard';

describe('VideoCard', () => {
  it('renders video title', () => {
    const video = { title: 'Test Video', description: 'Test Description' };
    render(<VideoCard video={video} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });
});
```

### Test Coverage

Aim for high test coverage:

- **Components**: Unit tests for all user-facing components
- **Hooks**: Test custom hooks with React Testing Library
- **Utils**: Unit tests for utility functions
- **API**: Integration tests for API endpoints

## 📤 Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run tests and linting**

   ```bash
   npm run test
   npm run lint
   ```

3. **Create a pull request**
   - Use a clear, descriptive title
   - Provide a detailed description of changes
   - Reference any related issues
   - Add screenshots for UI changes

4. **Pull Request Template**

   ```markdown
   ## Description

   Brief description of the changes made.

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed

   ## Screenshots (if applicable)

   Add screenshots of UI changes.

   ## Checklist

   - [ ] Code follows project style guidelines
   - [ ] Tests pass
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

### Code Review Process

1. **Automated Checks**
   - CI/CD pipeline runs tests and linting
   - Code coverage requirements met
   - Build passes successfully

2. **Peer Review**
   - At least one maintainer reviews the code
   - Review focuses on code quality, functionality, and adherence to guidelines
   - Constructive feedback provided

3. **Approval and Merge**
   - Changes approved by maintainer
   - Squash and merge to maintain clean git history
   - Branch deleted after merge

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (browser, OS, device)
5. **Screenshots or videos** if applicable
6. **Console errors** or logs

### Feature Requests

For feature requests, please include:

1. **Clear description** of the proposed feature
2. **Use case** and why it's needed
3. **Mockups or examples** if applicable
4. **Potential implementation** ideas

## 🤝 Community

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions and discussions
- **Pull Request Comments**: For code review discussions

### Code of Conduct

We follow a code of conduct to ensure a welcoming environment:

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers learn and contribute
- Maintain professional communication

### Recognition

Contributors are recognized through:

- GitHub contributor statistics
- Mention in release notes
- Special contributor badges
- Featured in our contributors page

## 📚 Additional Resources

### Documentation

- [Setup Guide](./SETUP.md) - Installation and configuration
- [API Documentation](./API.md) - API endpoints and usage
- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Testing Guide](./TESTING.md) - Testing strategies

### Development Tools

- [VS Code Extensions](https://marketplace.visualstudio.com/) - Recommended extensions
- [Prettier](https://prettier.io/) - Code formatting
- [ESLint](https://eslint.org/) - Code linting
- [TypeScript](https://www.typescriptlang.org/) - Type checking

### Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)

## 🙏 Acknowledgments

Thank you for contributing to Subbed! Your efforts help make this project better for everyone.

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/CONTRIBUTING.md
