'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImprovedSubscriptionManager } from '@/components/subscription-manager';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus, Users, Play, ArrowRight } from 'lucide-react';

export default function FeedEmpty() {
  const [subscriptionManagerOpen, setSubscriptionManagerOpen] = useState(false);
  const addSubscription = useMutation(api.subscriptions.addSubscription);

  const handleAddSample = () => {
    addSubscription({
      channelId: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw',
      channelName: 'Google',
      channelLogoUrl:
        'https://yt3.ggpht.com/ytc/AAUvwni_LdnpDi-SOIhjp4Kxo2l_yVBoYsfdDCpUM5IK=s88-c-k-c0x00ffffff-no-rj',
      channelUrl: 'https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw',
    });
  };

  return (
    <>
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-2">No subscriptions yet</h2>
            <p className="text-lg text-muted-foreground">
              Add your favorite YouTube channels to see their latest videos here.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Primary Action - Manage Subscriptions */}
          <Card
            className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer group"
            onClick={() => setSubscriptionManagerOpen(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Add Subscriptions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add channels by URL, handle (@username), or channel ID. Support for all YouTube
                formats.
              </p>
              <Button className="w-full" onClick={() => setSubscriptionManagerOpen(true)}>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Sample */}
          <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Try a Sample</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add a sample subscription to explore the interface and see how it works.
              </p>
              <Button variant="outline" className="w-full" onClick={handleAddSample}>
                Add Sample Channel
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-500/15 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium mb-1">Easy Setup</h4>
            <p className="text-xs text-muted-foreground">Supports URLs, handles, and channel IDs</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-500/15 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium mb-1">Full Control</h4>
            <p className="text-xs text-muted-foreground">Add, remove, and organize your channels</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium mb-1">No YouTube Account</h4>
            <p className="text-xs text-muted-foreground">Works without signing in to YouTube</p>
          </div>
        </div>
      </div>

      <ImprovedSubscriptionManager
        open={subscriptionManagerOpen}
        onOpenChange={setSubscriptionManagerOpen}
      />
    </>
  );
}
