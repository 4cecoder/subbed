'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Clock, Users, Video, Activity, Zap, Target } from 'lucide-react';
import { FeedItem, Subscription } from '@/lib/types';

interface AnalyticsDashboardProps {
  feed: FeedItem[];
  subscriptions: Subscription[];
  loading?: boolean;
}

interface ChannelAnalytics {
  id: string;
  title: string | null;
  videoCount: number;
  shortCount: number;
  latestVideo: Date | null;
  oldestVideo: Date | null;
  averageDaysBetweenVideos: number;
}

interface ContentTimeline {
  period: string;
  videoCount: number;
  shortCount: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  feed,
  subscriptions,
  loading = false,
}) => {
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (feed.length === 0) {
      return {
        totalVideos: 0,
        shortVideos: 0,
        regularVideos: 0,
        channelsWithContent: 0,
        oldestVideo: null,
        newestVideo: null,
        averageVideosPerChannel: 0,
        contentTimeline: [] as ContentTimeline[],
        channelAnalytics: [] as ChannelAnalytics[],
        topActiveChannels: [] as ChannelAnalytics[],
        contentDistribution: {
          shorts: 0,
          regular: 0,
          shortsPercentage: 0,
        },
        activityMetrics: {
          videosPerDay: 0,
          mostActiveDay: null as string | null,
          leastActiveDay: null as string | null,
        },
      };
    }

    const totalVideos = feed.length;
    const shortVideos = feed.filter(item => item.isShort).length;
    const regularVideos = totalVideos - shortVideos;
    const channelsWithContent = new Set(feed.map(item => item.channelId)).size;

    const videoDates = feed.map(item => new Date(item.published).getTime());
    const oldestVideo = new Date(Math.min(...videoDates));
    const newestVideo = new Date(Math.max(...videoDates));

    const averageVideosPerChannel =
      channelsWithContent > 0 ? Math.round(totalVideos / channelsWithContent) : 0;

    // Channel analytics
    const channelMap = new Map<string, ChannelAnalytics>();

    feed.forEach(item => {
      if (!item.channelId) return;

      const existing = channelMap.get(item.channelId);
      const videoDate = new Date(item.published);

      if (existing) {
        existing.videoCount++;
        if (item.isShort) existing.shortCount++;
        if (!existing.latestVideo || videoDate > existing.latestVideo) {
          existing.latestVideo = videoDate;
        }
        if (!existing.oldestVideo || videoDate < existing.oldestVideo) {
          existing.oldestVideo = videoDate;
        }
      } else {
        const subscription = subscriptions.find(sub => sub.id === item.channelId);
        channelMap.set(item.channelId, {
          id: item.channelId,
          title: subscription?.title || item.channelTitle || item.channelId,
          videoCount: 1,
          shortCount: item.isShort ? 1 : 0,
          latestVideo: videoDate,
          oldestVideo: videoDate,
          averageDaysBetweenVideos: 0,
        });
      }
    });

    // Calculate average days between videos for each channel
    const channelAnalytics = Array.from(channelMap.values()).map(channel => {
      if (channel.videoCount <= 1) {
        return { ...channel, averageDaysBetweenVideos: 0 };
      }

      const daysDiff =
        (channel.latestVideo!.getTime() - channel.oldestVideo!.getTime()) / (1000 * 60 * 60 * 24);
      const averageDays = daysDiff / (channel.videoCount - 1);

      return { ...channel, averageDaysBetweenVideos: Math.round(averageDays) };
    });

    // Sort channels by activity (most videos first)
    const topActiveChannels = [...channelAnalytics]
      .sort((a, b) => b.videoCount - a.videoCount)
      .slice(0, 10);

    // Content timeline (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentVideos = feed.filter(item => new Date(item.published) >= thirtyDaysAgo);

    const contentTimeline: ContentTimeline[] = [];
    for (let i = 0; i < 30; i += 5) {
      const periodStart = new Date(now.getTime() - (i + 5) * 24 * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      const periodVideos = recentVideos.filter(item => {
        const videoDate = new Date(item.published);
        return videoDate >= periodStart && videoDate < periodEnd;
      });

      contentTimeline.unshift({
        period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        videoCount: periodVideos.length,
        shortCount: periodVideos.filter(v => v.isShort).length,
      });
    }

    // Activity metrics
    const daysDiff = (now.getTime() - oldestVideo.getTime()) / (1000 * 60 * 60 * 24);
    const videosPerDay = daysDiff > 0 ? Math.round((totalVideos / daysDiff) * 100) / 100 : 0;

    // Most active day analysis
    const dayCounts = new Map<string, number>();
    feed.forEach(item => {
      const day = new Date(item.published).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });

    const sortedDays = Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1]);
    const mostActiveDay = sortedDays.length > 0 ? sortedDays[0][0] : null;
    const leastActiveDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1][0] : null;

    return {
      totalVideos,
      shortVideos,
      regularVideos,
      channelsWithContent,
      oldestVideo,
      newestVideo,
      averageVideosPerChannel,
      contentTimeline,
      channelAnalytics,
      topActiveChannels,
      contentDistribution: {
        shorts: shortVideos,
        regular: regularVideos,
        shortsPercentage: totalVideos > 0 ? Math.round((shortVideos / totalVideos) * 100) : 0,
      },
      activityMetrics: {
        videosPerDay,
        mostActiveDay,
        leastActiveDay,
      },
    };
  }, [feed, subscriptions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    data-testid="loading-skeleton"
                    className="h-24 bg-muted rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data to Analyze</h3>
            <p className="text-muted-foreground">
              Subscribe to some channels and load their feed to see analytics insights.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Video className="w-4 h-4 text-primary" />
                <div className="text-2xl font-bold text-primary">{analytics.totalVideos}</div>
              </div>
              <div className="text-sm text-muted-foreground">Total Videos</div>
            </div>

            <div className="text-center p-4 bg-secondary/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                <div className="text-2xl font-bold">{analytics.channelsWithContent}</div>
              </div>
              <div className="text-sm text-muted-foreground">Active Channels</div>
            </div>

            <div className="text-center p-4 bg-accent/50 rounded-lg border">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <div className="text-2xl font-bold text-orange-600">{analytics.shortVideos}</div>
              </div>
              <div className="text-sm text-muted-foreground">Short Videos</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div className="text-2xl font-bold text-green-600">
                  {analytics.averageVideosPerChannel}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Avg per Channel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Content Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Type Breakdown</span>
              <div className="flex gap-2">
                <Badge variant="secondary">{analytics.contentDistribution.shorts} Shorts</Badge>
                <Badge variant="outline">{analytics.contentDistribution.regular} Videos</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Short Videos</span>
                <span>{analytics.contentDistribution.shortsPercentage}%</span>
              </div>
              <Progress value={analytics.contentDistribution.shortsPercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Regular Videos</span>
                <span>{100 - analytics.contentDistribution.shortsPercentage}%</span>
              </div>
              <Progress
                value={100 - analytics.contentDistribution.shortsPercentage}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Content Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Oldest Content</div>
                  <div className="font-medium">{analytics.oldestVideo?.toLocaleDateString()}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Newest Content</div>
                  <div className="font-medium">{analytics.newestVideo?.toLocaleDateString()}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Activity Metrics</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Videos per day</div>
                    <div className="font-medium">{analytics.activityMetrics.videosPerDay}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Most active day</div>
                    <div className="font-medium">
                      {analytics.activityMetrics.mostActiveDay || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.contentTimeline.map((period, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{period.period}</div>
                    <div className="text-xs text-muted-foreground">
                      {period.shortCount} shorts, {period.videoCount - period.shortCount} videos
                    </div>
                  </div>
                  <Badge variant={period.videoCount > 0 ? 'default' : 'secondary'}>
                    {period.videoCount}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Active Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Active Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topActiveChannels.map((channel, index) => (
              <div
                key={channel.id}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium truncate">{channel.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {channel.shortCount} shorts, {channel.videoCount - channel.shortCount}{' '}
                        videos
                        {channel.averageDaysBetweenVideos > 0 && (
                          <span className="ml-2">
                            • Avg: {channel.averageDaysBetweenVideos} days between videos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{channel.videoCount}</Badge>
                  {channel.latestVideo && (
                    <div className="text-xs text-muted-foreground">
                      {channel.latestVideo.toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
