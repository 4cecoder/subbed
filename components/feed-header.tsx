"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Play } from 'lucide-react';
import { UserButton } from "@clerk/nextjs";

interface FeedHeaderProps {
  selected: string | null;
  subs: Array<{ id: string; title: string | null }>;
  query: string;
  loading: boolean;
  total?: number | null;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  onClear: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = React.memo(({
  selected,
  subs,
  query,
  loading,
  total,
  onQueryChange,
  onRefresh,
  onClear,
}) => {
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  }, [onQueryChange]);

  const handleClear = useCallback(() => {
    onQueryChange("");
    onClear();
  }, [onQueryChange, onClear]);

  const getTitle = () => {
    if (selected === "all") {
      return (
        <>
          <Play className="w-5 h-5 text-primary" />
          All Recent Uploads
        </>
      );
    } else if (selected) {
      const sub = subs.find((s) => s.id === selected);
      return (
        <>
          <Play className="w-5 h-5 text-primary" />
          {sub?.title || selected}
        </>
      );
    }
    return "Feed";
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {getTitle()}
          </h2>
          {selected === "all" && total != null && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing {total} recent videos
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 sm:flex-initial">
            <label htmlFor="search-videos" className="sr-only">
              Search videos
            </label>
            <Input
              id="search-videos"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search videos..."
              className="w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Button
                  onClick={handleClear}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
                <Button
                  disabled={!selected || loading}
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <UserButton />
          </div>
        </div>
      </div>
    </div>
  );
});

FeedHeader.displayName = 'FeedHeader';
