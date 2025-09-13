# Deployment Guide

This guide covers the production deployment of Subbed to Vercel with Convex backend integration.

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub repository with Subbed code
- ✅ Vercel account
- ✅ Convex account and project
- ✅ Clerk account and application
- ✅ Domain name (optional)

## Quick Deployment

### 1. Vercel Deployment

#### Option A: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/subbed)

#### Option B: Manual Setup

1. **Import Project**
   ```bash
   # In Vercel dashboard
   # Click "New Project" → "Import Git Repository"
   # Select your Subbed repository
   ```

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "outputDirectory": ".next"
   }
   ```

3. **Set Environment Variables**
   ```bash
   # In Vercel project settings → Environment Variables
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud
   ```

### 2. Convex Backend Setup

1. **Install Convex CLI**
   ```bash
   npm install -g convex
   ```

2. **Initialize Convex**
   ```bash
   npx convex dev
   ```

3. **Deploy to Convex**
   ```bash
   npx convex deploy
   ```

4. **Get Deployment URL**
   ```bash
   npx convex dashboard
   # Copy the deployment URL for environment variables
   ```

### 3. Clerk Authentication Setup

1. **Create Clerk Application**
   ```bash
   # In Clerk dashboard
   # Create new application
   # Configure sign-in/sign-up URLs
   ```

2. **Configure Social Providers** (Optional)
   - Google OAuth
   - GitHub OAuth
   - Other providers

3. **Get API Keys**
   ```bash
   # Copy from Clerk dashboard
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   ```

## Environment Configuration

### Required Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Environment-Specific Variables

#### Development
```bash
NODE_ENV=development
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
```

#### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_CONVEX_URL=https://your-production-url.convex.cloud
```

## Build Configuration

### Next.js Configuration

```javascript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['img.youtube.com', 'yt3.googleusercontent.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "test": "jest",
    "deploy": "vercel --prod"
  }
}
```

## Database Setup

### Convex Schema Deployment

1. **Push Schema to Convex**
   ```bash
   npx convex deploy
   ```

2. **Verify Schema**
   ```bash
   npx convex dashboard
   # Check tables: subscriptions, settings, syncQueue
   ```

3. **Seed Development Data** (Optional)
   ```bash
   npx convex run dev_subscriptions:addDevSubscription --channelId=UCsBjURrPoezykLs9EqgamOA --channelName=Fireship
   ```

## Domain Configuration

### Custom Domain Setup

1. **Add Domain in Vercel**
   ```bash
   # In Vercel project settings
   # Domains → Add your-domain.com
   ```

2. **Configure DNS**
   ```bash
   # Add CNAME record
   # your-domain.com → cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL certificates
   - HTTPS is enabled by default

### Subdomain Setup

```bash
# For app.your-domain.com
# Add CNAME: app.your-domain.com → cname.vercel-dns.com
```

## Performance Optimization

### Build Optimizations

1. **Enable Turbopack**
   ```bash
   npm run build  # Uses --turbopack flag
   ```

2. **Bundle Analysis**
   ```bash
   ANALYZE=true npm run build
   ```

3. **Image Optimization**
   - Next.js automatically optimizes images
   - WebP/AVIF formats enabled
   - Responsive images configured

### CDN Configuration

1. **Vercel Edge Network**
   - Automatic CDN distribution
   - Global edge locations
   - Cache optimization

2. **Cache Headers**
   ```javascript
   // In API routes
   export async function GET() {
     return NextResponse.json(data, {
       headers: {
         'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
       },
     })
   }
   ```

## Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**
   ```bash
   # In Vercel project settings
   # Analytics → Enable
   ```

2. **Custom Analytics**
   ```bash
   NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
   ```

### Error Tracking

1. **Vercel Error Monitoring**
   - Automatic error tracking
   - Performance monitoring
   - Real user monitoring

2. **Custom Error Handling**
   ```typescript
   // In _app.tsx or layout.tsx
   import { ErrorBoundary } from '@/components/error-boundary'

   export default function App({ Component, pageProps }) {
     return (
       <ErrorBoundary>
         <Component {...pageProps} />
       </ErrorBoundary>
     )
   }
   ```

## Security Configuration

### Environment Security

1. **Never Commit Secrets**
   ```bash
   # .gitignore
   .env.local
   .env.production.local
   ```

2. **Vercel Environment Variables**
   - Use Vercel dashboard for production secrets
   - Separate environments for staging/production

### API Security

1. **Rate Limiting**
   - Convex provides built-in rate limiting
   - Configure limits in Convex dashboard

2. **CORS Configuration**
   ```javascript
   // In next.config.ts
   async headers() {
     return [
       {
         source: '/api/:path*',
         headers: [
           { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
           { key: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,OPTIONS' },
           { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
         ],
       },
     ]
   }
   ```

## Backup & Recovery

### Database Backup

1. **Convex Backup**
   ```bash
   npx convex export
   ```

2. **Automated Backups**
   - Configure in Convex dashboard
   - Daily/weekly backup schedules

### Data Migration

1. **Export Data**
   ```bash
   npx convex run exportData
   ```

2. **Import Data**
   ```bash
   npx convex run importData --file=backup.json
   ```

## Troubleshooting

### Common Deployment Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Verify environment variables are set
# Check Node.js version compatibility
```

#### Runtime Errors
```bash
# Check Convex function logs
npx convex logs

# Verify environment variables
# Check Clerk configuration
```

#### Performance Issues
```bash
# Enable Vercel analytics
# Check Core Web Vitals
# Monitor API response times
```

### Rollback Strategy

1. **Vercel Rollback**
   ```bash
   # In Vercel dashboard
   # Deployments → Rollback to previous version
   ```

2. **Convex Rollback**
   ```bash
   npx convex rollback
   ```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor Performance**
   - Check Vercel analytics weekly
   - Monitor error rates
   - Review Core Web Vitals

3. **Security Updates**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular security audits

### Scaling Considerations

1. **Traffic Growth**
   - Vercel automatically scales
   - Monitor usage limits
   - Consider paid plans for high traffic

2. **Database Scaling**
   - Convex handles scaling automatically
   - Monitor query performance
   - Optimize expensive queries

## Support

### Getting Help

1. **Documentation**
   - [Vercel Docs](https://vercel.com/docs)
   - [Convex Docs](https://docs.convex.dev)
   - [Clerk Docs](https://clerk.com/docs)

2. **Community Support**
   - [Vercel Community](https://vercel.com/community)
   - [Convex Community](https://convex.dev/community)
   - [Next.js Community](https://nextjs.org/community)

3. **Professional Support**
   - Vercel Enterprise support
   - Convex Enterprise support
   - Clerk Enterprise support

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/DEPLOYMENT.md