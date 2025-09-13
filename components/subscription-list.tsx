"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ExternalLink, Trash2, Play, Hash } from 'lucide-react';

interface Sub {
  id: string;
  title: string | null;
  url: string;
  created_at?: string;
}

interface SubscriptionListProps {
  subs: Sub[];
  selected: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onRefreshAll: () => void;
  onRemove: (id: string) => void;
  onOpenClearConfirm: () => void;
}



export const SubscriptionList: React.FC<SubscriptionListProps> = React.memo(({
  subs,
  selected,
  loading,
  onSelect,
  onRefreshAll,
  onRemove,
  onOpenClearConfirm,
}) => {
  const sortedSubs = useMemo(() => {
    return [...subs].sort((a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }, [subs]);

  return (
    <Card className="h-full flex flex-col border-border/60 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Play className="w-5 h-5 text-primary" />
          <span className="font-semibold">Subscriptions</span>
          <Badge variant="secondary" className="ml-auto text-xs sm:text-sm px-2 py-1">
            {subs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Action Buttons */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              disabled={subs.length === 0 || loading}
              onClick={onRefreshAll}
              variant="outline"
              size="sm"
              className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 flex-1 sm:flex-none touch-manipulation"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh All</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button 
              onClick={onOpenClearConfirm} 
              variant="outline" 
              size="sm"
              className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4 flex-1 sm:flex-none touch-manipulation"
            >
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[600px]">
          <ul className="space-y-2 sm:space-y-3 pr-2 sm:pr-3">
            {/* All Subscriptions Option */}
            <li className={`p-3 sm:p-4 border rounded-xl transition-all duration-200 hover:shadow-md ${
              selected === "all" 
                ? "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20" 
                : "hover:bg-accent/50 hover:border-accent/80"
            }`}>
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -m-1 transition-colors"
                      onClick={() => onSelect("all")}
                      aria-label="View all subscriptions"
                    >
                      <div className="font-semibold text-sm sm:text-base text-foreground truncate">
                        All Subscriptions
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                        Aggregated recent uploads
                      </div>
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => onSelect("all")}
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0 touch-manipulation"
                >
                  View
                </Button>
              </div>
            </li>

            {/* Empty State */}
            {subs.length === 0 && (
              <li className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                  No subscriptions yet
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                  Add your first YouTube channel above
                </p>
              </li>
            )}

            {/* Subscription Items */}
            {sortedSubs.map((s) => (
              <li
                key={s.id}
                className={`p-3 sm:p-4 border rounded-xl transition-all duration-200 hover:shadow-md ${
                  selected === s.id 
                    ? "bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10" 
                    : "hover:bg-accent/50 hover:border-accent/60"
                }`}
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -m-1 transition-colors"
                        onClick={() => onSelect(s.id)}
                        aria-label={`Select subscription ${s.title || s.id}`}
                      >
                        <div className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {s.title || s.id}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-mono">
                          {s.id}
                        </div>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation hover:bg-accent"
                      aria-label={`Open ${s.title || s.id} on YouTube`}
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 sm:w-4 sm:h-4" />
                      </a>
                    </Button>
                    <Button
                      onClick={() => onRemove(s.id)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                      aria-label={`Remove subscription ${s.title || s.id}`}
                    >
                      <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

SubscriptionList.displayName = 'SubscriptionList';