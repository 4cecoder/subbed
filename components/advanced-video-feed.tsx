"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
import { EnhancedVirtualList } from "@/components/enhanced-virtual-list";
import { FeedHeader } from "@/components/feed-header";
import FeedLoading from "@/components/feed-loading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConvexFeed } from "@/lib/hooks/use-convex-feed";
import { useConvexSettings } from "@/lib/hooks/use-convex-settings";
import { useConvexSubscriptions } from "@/lib/hooks/use-convex-subscriptions";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";
import { FeedItem, FeedType, SortOrder } from "@/lib/types";
import { Play, Filter, Search, RefreshCw, Video, Film, Clock } from "lucide-react";

interface AdvancedVideoFeedProps {
  className?: string;
}

export const AdvancedVideoFeed: React.FC<AdvancedVideoFeedProps> = React.memo(({
  className = "",
}) => {
  // State management
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<FeedType>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [containerHeight, setContainerHeight] = useState(600);
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const { settings, loading: settingsLoading } = useConvexSettings();
  const { subscriptions, loading: subscriptionsLoading } = useConvexSubscriptions();
  const {
    feed,
    loading: feedLoading,
    error: feedError,
    hasMore,
    page,
    loadFeed,
    loadChannelFeed,
    refreshCurrentFeed
  } = useConvexFeed(settings || null);
  
  const { 
    query, 
    debouncedQuery, 
    updateQuery, 
    clearQuery, 
    isSearching 
  } = useDebouncedSearch('', () => {
    // Search is handled by the filteredAndSortedFeed useMemo
  });

  // Memoized subscriptions for feed header and dropdown
  const feedSubscriptions = useMemo(() => {
    return subscriptions.map((sub) => ({
      id: sub.channelId,
      title: sub.channelName,
      channelLogoUrl: sub.channelLogoUrl,
      channelUrl: sub.channelUrl || '',
      created_at: sub.createdAt || '',
    }));
  }, [subscriptions]);

  // Filter and sort feed items
  const filteredAndSortedFeed = useMemo(() => {
    let filtered = [...feed];

    // Apply content type filter
    if (feedType === "video") {
      filtered = filtered.filter(item => !item.isShort);
    } else if (feedType === "short") {
      filtered = filtered.filter(item => item.isShort);
    }

    // Apply search filter
    if (debouncedQuery) {
      const searchLower = debouncedQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.channelTitle && item.channelTitle.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.published).getTime();
      const dateB = new Date(b.published).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [feed, feedType, debouncedQuery, sortOrder]);

  // Handle subscription selection
  const handleSubscriptionSelect = useCallback(async (channelId: string) => {
    if (channelId === "all") {
      setSelectedSubscription("all");
      await loadFeed(1, debouncedQuery);
    } else {
      setSelectedSubscription(channelId);
      await loadChannelFeed(channelId);
    }
  }, [loadFeed, loadChannelFeed, debouncedQuery]);

  // Handle feed type change
  const handleFeedTypeChange = useCallback((type: FeedType) => {
    setFeedType(type);
  }, []);

  // Handle sort order change
  const handleSortOrderChange = useCallback((order: SortOrder) => {
    setSortOrder(order);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refreshCurrentFeed();
  }, [refreshCurrentFeed]);

  // Handle clear
  const handleClear = useCallback(() => {
    clearQuery();
    setSelectedSubscription("all");
    loadFeed(1, "");
  }, [clearQuery, loadFeed]);

  // Handle video click
  const handleVideoClick = useCallback((item: FeedItem) => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  }, []);

  // Load more items when scrolling to bottom
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !feedLoading && selectedSubscription === "all") {
      await loadFeed(page + 1, debouncedQuery);
    }
  }, [hasMore, feedLoading, selectedSubscription, page, loadFeed, debouncedQuery]);

  // Set container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 300; // Account for header and filters
      setContainerHeight(Math.max(400, height));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Load initial feed
  useEffect(() => {
    if (settings && !selectedSubscription) {
      setSelectedSubscription("all");
      loadFeed(1, "");
    }
  }, [settings, selectedSubscription, loadFeed]);

  // Loading state
  if (settingsLoading || subscriptionsLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
        <FeedLoading />
      </div>
    );
  }

  // Note: Empty state is handled by the parent component (app/page.tsx)

  // Error state
  if (feedError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-destructive">Error loading feed</h3>
              <p className="text-muted-foreground">{feedError}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feed Header */}
      <FeedHeader
        selected={selectedSubscription}
        subs={feedSubscriptions}
        query={query}
        loading={feedLoading}
        total={filteredAndSortedFeed.length}
        onQueryChange={updateQuery}
        onRefresh={handleRefresh}
        onClear={handleClear}
      />

      {/* Filters and Controls */}
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search videos, channels, descriptions..."
                  value={query}
                  onChange={(e) => updateQuery(e.target.value)}
                  className="pl-10 backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30 focus:border-primary/50 transition-all duration-200"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:w-auto backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30 hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-200"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <Badge variant="secondary" className="ml-2 backdrop-blur-sm bg-primary/10 border-primary/20">
                {feedType !== "all" || sortOrder !== "newest" ? "Active" : "None"}
              </Badge>
            </Button>

            {/* Subscription Quick Select */}
            <Select value={selectedSubscription || ""} onValueChange={handleSubscriptionSelect}>
              <SelectTrigger className="lg:w-64 backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30 focus:border-primary/50 transition-all duration-200">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-white/20">
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    All Channels
                  </div>
                </SelectItem>
                {feedSubscriptions.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <Image
                        src={sub.channelLogoUrl}
                        alt={sub.title || 'Channel'}
                        width={16}
                        height={16}
                        className="rounded-full flex-shrink-0"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/16/16';
                        }}
                      />
                      <span className="truncate font-medium">{sub.title || `Channel ${sub.id.slice(-8)}`}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-white/20 backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Content Type Filter */}
                <div className="space-y-2">
                  <label htmlFor="content-type" className="text-sm font-medium">Content Type</label>
                  <Select value={feedType} onValueChange={handleFeedTypeChange}>
                    <SelectTrigger id="content-type" className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-white/20">
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          All Content
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Videos Only
                        </div>
                      </SelectItem>
                      <SelectItem value="short">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4" />
                          Shorts Only
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label htmlFor="sort-order" className="text-sm font-medium">Sort By</label>
                  <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                    <SelectTrigger id="sort-order" className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-white/20">
                      <SelectItem value="newest">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Newest First
                        </div>
                      </SelectItem>
                      <SelectItem value="oldest">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 rotate-180" />
                          Oldest First
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results Info */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Results</div>
                  <div className="text-sm text-muted-foreground p-2 backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 border border-white/20 rounded" aria-live="polite">
                    <span className="font-semibold">{filteredAndSortedFeed.length}</span> video{filteredAndSortedFeed.length !== 1 ? 's' : ''}
                    {debouncedQuery && (
                      <>
                        <br />
                        <span className="text-xs">matching &quot;<span className="font-medium">{debouncedQuery}</span>&quot;</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Quick Actions</div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFeedType("all");
                        setSortOrder("newest");
                        clearQuery();
                      }}
                      className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30 hover:bg-white/80 transition-all duration-200"
                    >
                      Reset All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefresh}
                      disabled={feedLoading}
                      className="backdrop-blur-sm bg-white/60 dark:bg-gray-800/60 border-white/30 hover:bg-white/80 transition-all duration-200"
                    >
                      <RefreshCw className={`w-4 h-4 ${feedLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Virtual Video Feed */}
      <div className="relative">
        <EnhancedVirtualList
          items={filteredAndSortedFeed}
          containerHeight={containerHeight}
          showThumbnails={settings?.showThumbnails ?? true}
          showDescriptions={settings?.showDescriptions ?? true}
          onItemClick={handleVideoClick}
          className="border border-white/20 rounded-lg backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 shadow-xl"
        />

        {/* Load More Button */}
        {hasMore && selectedSubscription === "all" && !feedLoading && (
          <div className="flex justify-center mt-4">
            <Button onClick={handleLoadMore} variant="outline">
              Load More Videos
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(feedType !== "all" || sortOrder !== "newest" || debouncedQuery) && (
        <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Active filters:</span>
              {feedType !== "all" && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-primary/10 border-primary/20">
                  {feedType === "video" ? "Videos Only" : "Shorts Only"}
                </Badge>
              )}
              {sortOrder !== "newest" && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-primary/10 border-primary/20">
                  {sortOrder === "oldest" ? "Oldest First" : "Newest First"}
                </Badge>
              )}
              {debouncedQuery && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-primary/10 border-primary/20">
                  Search: &quot;{debouncedQuery}&quot;
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFeedType("all");
                  setSortOrder("newest");
                  clearQuery();
                }}
                className="h-6 px-2 text-xs backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-200"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

AdvancedVideoFeed.displayName = "AdvancedVideoFeed";