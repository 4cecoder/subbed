'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { EnhancedVideoCard } from '@/components/enhanced-video-card';

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

interface EnhancedVirtualListProps {
  items: FeedItem[];
  itemHeight?: number;
  containerHeight?: number;
  showThumbnails?: boolean;
  showDescriptions?: boolean;
  onItemClick?: (item: FeedItem) => void;
  overscan?: number;
  className?: string;
}

const DEFAULT_ITEM_HEIGHT = 180; // Updated height for enhanced video cards
const BUFFER_SIZE = 3; // Number of extra items to render outside viewport

export const EnhancedVirtualList: React.FC<EnhancedVirtualListProps> = React.memo(
  ({
    items,
    itemHeight = DEFAULT_ITEM_HEIGHT,
    containerHeight = 600,
    showThumbnails = true,
    showDescriptions = true,
    onItemClick,
    overscan = BUFFER_SIZE,
    className = '',
  }) => {
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate dynamic item height based on content
    const calculateItemHeight = useCallback(
      (item: FeedItem) => {
        let height = itemHeight;

        // Add height for description if shown
        if (showDescriptions && item.description) {
          height += 40; // Additional space for description
        }

        // Add height for short badge
        if (item.isShort) {
          height += 24; // Additional space for badge
        }

        // Enhanced cards have more content, so add base height
        height += 20; // Additional space for action buttons

        return height;
      },
      [itemHeight, showDescriptions]
    );

    // Calculate positions and total height
    const { positions, totalHeight } = useMemo(() => {
      const positions: number[] = [];
      let currentOffset = 0;

      for (let i = 0; i < items.length; i++) {
        positions[i] = currentOffset;
        currentOffset += calculateItemHeight(items[i]);
      }

      return { positions, totalHeight: currentOffset };
    }, [items, calculateItemHeight]);

    // Calculate visible range
    const visibleRange = useMemo(() => {
      const startIdx = positions.findIndex(pos => pos > scrollTop) - 1;
      const start = Math.max(0, startIdx === -2 ? 0 : startIdx);

      let end = start;
      let currentPos = positions[start] || 0;
      const viewportEnd = scrollTop + containerHeight;

      while (end < items.length && currentPos < viewportEnd + overscan * 100) {
        // Buffer based on overscan
        end++;
        currentPos = positions[end] || currentPos;
      }

      return { start, end: Math.min(end, items.length) };
    }, [scrollTop, containerHeight, positions, items.length, overscan]);

    const visibleItems = useMemo(() => {
      return items.slice(visibleRange.start, visibleRange.end);
    }, [items, visibleRange]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
      <div
        className={`overflow-auto relative ${className}`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
        role="list"
        aria-label="Video feed"
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.start + index;
            const itemTop = positions[actualIndex];
            const itemHeight = calculateItemHeight(item);

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: itemTop,
                  left: 0,
                  right: 0,
                  height: itemHeight,
                }}
                className="p-2 sm:p-3"
                role="listitem"
              >
                <EnhancedVideoCard
                  item={item}
                  showThumbnail={showThumbnails}
                  showDescription={showDescriptions}
                  onClick={onItemClick}
                />
              </div>
            );
          })}
        </div>

        {/* Loading indicator when scrolling to new content */}
        {visibleRange.end < items.length && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight - 50,
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            className="flex items-center justify-center py-4"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading more videos...
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No videos found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or refresh the feed
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

EnhancedVirtualList.displayName = 'EnhancedVirtualList';
