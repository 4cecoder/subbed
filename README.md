# Subbed — YouTube Subscription Manager

A modern, real-time YouTube subscription manager built with Next.js, Convex, and Clerk. Manage your YouTube subscriptions with offline support, real-time synchronization, and a beautiful responsive interface.

## ✨ Features

- 🎥 **YouTube Subscription Management** - Organize and filter your YouTube subscriptions
- 🔐 **Secure Authentication** - User authentication with Clerk
- 🌐 **Real-time Sync** - Instant synchronization across all devices
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🚀 **Performance Optimized** - Fast loading and smooth interactions
- 🔄 **Offline Support** - Works without internet connection
- 📊 **Analytics Dashboard** - Track your viewing habits and statistics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Convex account
- Clerk account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/subbed.git
cd subbed

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
bun run dev
```

### Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### 📖 Getting Started

- [**Setup Guide**](./docs/SETUP.md) - Installation and configuration
- [**Architecture Overview**](./docs/ARCHITECTURE.md) - System design and components

### 🔧 Technical Documentation

- [**API Documentation**](./docs/API.md) - API endpoints and usage
- [**Deployment Guide**](./docs/DEPLOYMENT.md) - Production deployment
- [**Performance Guide**](./docs/PERFORMANCE.md) - Performance optimization
- [**Hybrid Storage**](./docs/HYBRID_STORAGE.md) - Offline-first architecture

### 🛠️ Development

- [**Contributing Guide**](./docs/CONTRIBUTING.md) - How to contribute
- [**Testing Guide**](./docs/TESTING.md) - Testing strategies
- [**Code Style Guide**](./docs/CODE_STYLE.md) - Coding conventions

### 📋 Additional Resources

- [**Troubleshooting**](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [**Bug Fixes**](./docs/BUG_FIXES.md) - Documented bug fixes
- [**Migration Guide**](./docs/MIGRATION.md) - Data migration procedures

## 🏗️ Architecture

Subbed is built with a modern, scalable architecture:

```
Frontend (Next.js 14)
├── React Components (TypeScript)
├── State Management (React Hooks)
├── UI Components (Shadcn/ui)
└── Performance Optimizations

Backend (Convex)
├── Database Schema
├── API Functions
├── Authentication Integration
└── Real-time Data Sync

Infrastructure
├── Vercel Deployment
├── Environment Management
├── Performance Monitoring
└── Error Tracking
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style and conventions
- Testing requirements
- Submitting pull requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./docs/README.md)
- 🐛 [Report Issues](https://github.com/your-username/subbed/issues)
- 💬 [Discussions](https://github.com/your-username/subbed/discussions)

---

**Built with ❤️ using Next.js, Convex, and Clerk**</content>
<parameter name="filePath">README.md
