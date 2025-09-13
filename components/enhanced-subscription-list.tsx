"use client";

import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, ExternalLink, Trash2, Play, Search, ChevronDown, ChevronUp, Filter, Calendar, Hash, X } from 'lucide-react';

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

interface SubscriptionGroup {
  title: string;
  subs: Sub[];
  isExpanded: boolean;
}

type SortOption = 'newest' | 'oldest' | 'name';
type GroupOption = 'none' | 'date' | 'alphabetical';

export const EnhancedSubscriptionList: React.FC<SubscriptionListProps> = React.memo(({
  subs,
  selected,
  loading,
  onSelect,
  onRefreshAll,
  onRemove,
  onOpenClearConfirm,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [groupBy, setGroupBy] = useState<GroupOption>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  // Filter and sort subscriptions
  const filteredAndSortedSubs = useMemo(() => {
    const filtered = subs.filter(sub => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (sub.title?.toLowerCase().includes(query)) ||
             sub.id.toLowerCase().includes(query);
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'name':
          return (a.title || a.id).localeCompare(b.title || b.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [subs, searchQuery, sortBy]);

  // Group subscriptions
  const groupedSubs = useMemo(() => {
    if (groupBy === 'none') {
      return [{
        title: 'All Subscriptions',
        subs: filteredAndSortedSubs,
        isExpanded: expandedGroups.has('all')
      }];
    }

    const groups: SubscriptionGroup[] = [];

    if (groupBy === 'date') {
      const today = new Date();
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recent = filteredAndSortedSubs.filter(sub =>
        new Date(sub.created_at || 0) >= thisWeek
      );
      const thisMonthSubs = filteredAndSortedSubs.filter(sub =>
        new Date(sub.created_at || 0) >= thisMonth && new Date(sub.created_at || 0) < thisWeek
      );
      const older = filteredAndSortedSubs.filter(sub =>
        new Date(sub.created_at || 0) < thisMonth
      );

      if (recent.length > 0) groups.push({
        title: 'Recent (This Week)',
        subs: recent,
        isExpanded: expandedGroups.has('recent')
      });
      if (thisMonthSubs.length > 0) groups.push({
        title: 'This Month',
        subs: thisMonthSubs,
        isExpanded: expandedGroups.has('this-month')
      });
      if (older.length > 0) groups.push({
        title: 'Older',
        subs: older,
        isExpanded: expandedGroups.has('older')
      });
    } else if (groupBy === 'alphabetical') {
      const alphabetGroups: { [key: string]: Sub[] } = {};

      filteredAndSortedSubs.forEach(sub => {
        const firstLetter = (sub.title || sub.id).charAt(0).toUpperCase();
        if (!alphabetGroups[firstLetter]) {
          alphabetGroups[firstLetter] = [];
        }
        alphabetGroups[firstLetter].push(sub);
      });

      Object.keys(alphabetGroups).sort().forEach(letter => {
        groups.push({
          title: letter,
          subs: alphabetGroups[letter],
          isExpanded: expandedGroups.has(letter)
        });
      });
    }

    return groups;
  }, [filteredAndSortedSubs, groupBy, expandedGroups]);

  const toggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return newSet;
    });
  }, []);

  const SubscriptionItem: React.FC<{ sub: Sub; isSelected: boolean }> = React.memo(({ sub, isSelected }) => (
    <li className={`p-3 sm:p-4 border rounded-xl transition-all duration-200 hover:shadow-md ${
      isSelected 
        ? "bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10" 
        : "hover:bg-accent/50 hover:border-accent/60"
    }`}>
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <button
              className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -m-1 transition-colors"
              onClick={() => onSelect(sub.id)}
              aria-label={`Select subscription ${sub.title || sub.id}`}
            >
              <div className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                {sub.title || sub.id}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-mono">
                {sub.id}
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
            aria-label={`Open ${sub.title || sub.id} on YouTube`}
          >
            <a
              href={sub.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 sm:w-4 sm:h-4" />
            </a>
          </Button>
          <Button
            onClick={() => onRemove(sub.id)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
            aria-label={`Remove subscription ${sub.title || sub.id}`}
          >
            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>
    </li>
  ));

  SubscriptionItem.displayName = 'SubscriptionItem';

  return (
    <Card className="h-full flex flex-col max-h-[calc(100vh-200px)] border-border/60 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4 flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Play className="w-5 h-5 text-primary" />
            <span className="font-semibold">Subscriptions</span>
            <Badge variant="secondary" className="ml-auto text-xs sm:text-sm px-2 py-1">
              {subs.length}
            </Badge>
          </CardTitle>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="ghost"
            size="sm"
            className="h-8 sm:h-9 w-8 sm:w-9 p-0 touch-manipulation"
            aria-label="Toggle filters"
            aria-pressed={showFilters}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-9 sm:h-10 text-sm"
            aria-label="Search subscriptions"
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 touch-manipulation"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 p-3 sm:p-4 bg-muted/30 rounded-xl border border-border/50 mt-3 sm:mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="sort-select" className="text-sm font-medium mb-1.5 block text-foreground">
                  Sort by
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Sort subscriptions"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
              <div>
                <label htmlFor="group-select" className="text-sm font-medium mb-1.5 block text-foreground">
                  Group by
                </label>
                <select
                  id="group-select"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupOption)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Group subscriptions"
                >
                  <option value="none">No Grouping</option>
                  <option value="date">By Date</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Action Buttons */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
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
              Clear All
            </Button>
          </div>
          {filteredAndSortedSubs.length !== subs.length && (
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 px-2 py-1 rounded">
              Showing {filteredAndSortedSubs.length} of {subs.length}
            </div>
          )}
        </div>

        {/* Subscription List */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-3">
            {/* All Subscriptions Option */}
            <div className={`p-3 sm:p-4 border rounded-xl transition-all duration-200 hover:shadow-md ${
              selected === "all" 
                ? "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20" 
                : "hover:bg-accent/50 hover:border-accent/80"
            }`}>
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/15 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <button
                    className="text-left flex-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -m-1 transition-colors"
                    onClick={() => onSelect("all")}
                    aria-label="View all subscriptions"
                  >
                    <div className="font-semibold text-sm sm:text-base text-foreground">
                      All Subscriptions
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Aggregated recent uploads
                    </div>
                  </button>
                </div>
                <Button
                  onClick={() => onSelect("all")}
                  variant="ghost"
                  size="sm"
                  className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm shrink-0 touch-manipulation"
                  aria-label="View all subscriptions"
                >
                  View
                </Button>
              </div>
            </div>

            {/* Grouped Subscriptions */}
            {groupedSubs.map((group) => (
              <div key={group.title} className="space-y-2 sm:space-y-3">
                {groupBy !== 'none' && (
                  <Button
                    onClick={() => toggleGroup(group.title)}
                    variant="ghost"
                    className="w-full justify-between p-3 sm:p-4 h-auto rounded-xl border border-border/50 hover:bg-accent/50 hover:border-accent/80 transition-all duration-200"
                    aria-expanded={group.isExpanded}
                    aria-controls={`group-${group.title}`}
                  >
                    <span className="font-medium text-sm sm:text-base flex items-center gap-2">
                      {groupBy === 'date' && <Calendar className="w-4 h-4 text-muted-foreground" />}
                      {group.title}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {group.subs.length}
                      </Badge>
                    </span>
                    {group.isExpanded ?
                      <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </Button>
                )}

                {(groupBy === 'none' || group.isExpanded) && (
                  <ul
                    id={`group-${group.title}`}
                    className="space-y-2 sm:space-y-3"
                  >
                    {group.subs.map((sub) => (
                      <SubscriptionItem
                        key={sub.id}
                        sub={sub}
                        isSelected={selected === sub.id}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Empty States */}
            {filteredAndSortedSubs.length === 0 && subs.length > 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                  No subscriptions found
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {subs.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                  No subscriptions yet
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
                  Add your first YouTube channel above
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

EnhancedSubscriptionList.displayName = 'EnhancedSubscriptionList';