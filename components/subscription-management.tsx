'use client';

import React, { useState, useMemo } from 'react';
import { EnhancedSubscriptionList } from '@/components/enhanced-subscription-list';
import { EnhancedVirtualList } from '@/components/enhanced-virtual-list';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, BarChart3, Users } from 'lucide-react';

interface Sub {
  id: string;
  title: string | null;
  url: string;
  created_at?: string;
}

interface FeedItem {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail?: string;
  description?: string;
  channelId?: string;
  channelTitle?: string | null;
  isShort?: boolean;
}

interface SubscriptionManagementProps {
  subs: Sub[];
  feed: FeedItem[];
  selected: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onRefreshAll: () => void;
  onRemove: (id: string) => void;
  onOpenClearConfirm: () => void;
  onOpenSettings: () => void;
  onItemClick?: (item: FeedItem) => void;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  subs,
  feed,
  selected,
  loading,
  onSelect,
  onRefreshAll,
  onRemove,
  onOpenClearConfirm,
  onOpenSettings,
  onItemClick,
}) => {
  const [viewMode, setViewMode] = useState<'feed' | 'analytics'>('feed');

  // Analytics data
  const analytics = useMemo(() => {
    const totalVideos = feed.length;
    const shortVideos = feed.filter(item => item.isShort).length;
    const channelsWithContent = new Set(feed.map(item => item.channelId)).size;
    const oldestVideo =
      feed.length > 0
        ? new Date(Math.min(...feed.map(item => new Date(item.published).getTime())))
        : null;
    const newestVideo =
      feed.length > 0
        ? new Date(Math.max(...feed.map(item => new Date(item.published).getTime())))
        : null;

    return {
      totalVideos,
      shortVideos,
      channelsWithContent,
      oldestVideo,
      newestVideo,
      averageVideosPerChannel:
        channelsWithContent > 0 ? Math.round(totalVideos / channelsWithContent) : 0,
    };
  }, [feed]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
      {/* Subscription Sidebar */}
      <div className="lg:col-span-1 space-y-6 min-h-0">
        {/* Header with controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Management
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode(viewMode === 'feed' ? 'analytics' : 'feed')}
                  variant="outline"
                  size="sm"
                  aria-label="Toggle view mode"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={onOpenSettings}
                  variant="outline"
                  size="sm"
                  aria-label="Open settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Subscription List */}
        <div className="h-[calc(100vh-12rem)] min-h-0">
          <EnhancedSubscriptionList
            subs={subs}
            selected={selected}
            loading={loading}
            onSelect={onSelect}
            onRefreshAll={onRefreshAll}
            onRemove={onRemove}
            onOpenClearConfirm={onOpenClearConfirm}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6 min-h-0">
        {viewMode === 'feed' ? (
          <>
            {/* Feed Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selected === 'all' ? 'All Subscriptions' : 'Feed'}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feed.length} videos • {analytics.channelsWithContent} channels
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{analytics.shortVideos} shorts</Badge>
                    <Badge variant="outline">{analytics.averageVideosPerChannel} avg/channel</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Enhanced Virtual List for Feed */}
            <Card className="flex-1">
              <CardContent className="p-0">
                <EnhancedVirtualList
                  items={feed}
                  containerHeight={600}
                  showThumbnails={true}
                  showDescriptions={true}
                  onItemClick={onItemClick}
                  className="rounded-lg"
                />
              </CardContent>
            </Card>
          </>
        ) : (
          /* Analytics View */
          <AnalyticsDashboard feed={feed} subscriptions={subs} loading={loading} />
        )}
      </div>
    </div>
  );
};
