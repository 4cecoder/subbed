'use client';

import { useConvexSubscriptions } from '@/lib/hooks/use-convex-subscriptions';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import { AdvancedVideoFeed } from '@/components/advanced-video-feed';
import FeedEmpty from '@/components/feed-empty';
import { useOnboarding } from '@/lib/hooks/use-onboarding';
import { Button } from '@/components/ui/button';
import { Video, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { subscriptions } = useConvexSubscriptions();
  useOnboarding();

  return (
    <main id="main-content" className="container mx-auto p-4">
      <SignedIn>
        {subscriptions.length === 0 && <FeedEmpty />}
        {subscriptions.length > 0 && <AdvancedVideoFeed />}
      </SignedIn>
      <SignedOut>
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <Video className="w-10 h-10 text-red-500" />
              <h1 className="text-4xl font-bold">Welcome to Subbed</h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A clean, fast, and privacy-focused way to manage your YouTube subscriptions without
              the clutter of the official platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignInButton mode="modal">
                <Button size="lg" className="px-8">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </SignInButton>

              <Button variant="outline" size="lg" asChild>
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Easy Setup</h3>
              <p className="text-sm text-muted-foreground">
                Add YouTube channels with URLs, handles, or channel IDs. No YouTube account
                required.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Optimized performance with smart caching and efficient data handling.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Your data never leaves your browser. No tracking, no ads, no compromises.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 mt-12">
            <h2 className="text-2xl font-semibold mb-4">Ready to take control?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join thousands of users who&apos;ve simplified their YouTube experience with Subbed.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="px-8">
                Sign In to Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
    </main>
  );
}
