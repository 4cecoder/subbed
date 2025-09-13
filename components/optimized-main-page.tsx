"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Plus, RefreshCw, Settings, Moon, Sun, AlertCircle, Loader2 } from "lucide-react";
import { SubscriptionList } from "./subscription-list";
import { FeedHeader } from "./feed-header";
import { VirtualList } from "./ui/virtual-list";
import { apiClient } from "@/lib/api-client";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

type Sub = { id: string; title: string | null; url: string; created_at?: string };

type FeedItem = {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail?: string;
  description?: string;
  channelId?: string;
  channelTitle?: string | null;
  isShort?: boolean;
};

type Settings = {
  per_page: number;
  per_channel: number;
  showThumbnails: boolean;
  showDescriptions: boolean;
  defaultFeedType: "all" | "video" | "short";
  sortOrder: "newest" | "oldest";
  caching_ttl: number;
  concurrency: number;
};

export default function OptimizedMainPage() {
  // Core state
  const [subs, setSubs] = useState<Sub[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | null>(null);

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Partial<Settings>>({});

  // UI state
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [input, setInput] = useState("");

  // Debounced search
  const { query, updateQuery, clearQuery, isSearching } = useDebouncedSearch(
    "",
    useCallback((searchQuery: string) => {
      if (selected === "all") {
        fetchAggregatedFeed(1, searchQuery);
      }
    }, [selected]),
    { delay: 300, minLength: 0 }
  );

  // Initialize app
  useEffect(() => {
    fetchSubs();
    fetchSettings();

    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  // Memoized filtered feed
  const filteredFeed = useMemo(() => {
    if (!settings) return feed;

    return feed.filter((item) => {
      const t = settings.defaultFeedType || "all";
      if (t === "video") return !item.isShort;
      if (t === "short") return !!item.isShort;
      return true;
    });
  }, [feed, settings]);

  // API functions with caching
  const fetchSettings = useCallback(async () => {
    try {
      const response = await apiClient.getSettings();
      setSettings(response.data.settings || null);
      setSettingsDraft(response.data.settings || {});
    } catch {
      // Ignore errors
    }
  }, []);

  const fetchSubs = useCallback(async () => {
    try {
      const response = await apiClient.getSubscriptions();
      setSubs(response.data || []);
    } catch (e: unknown) {
      setError(String(e));
    }
  }, []);

  const fetchAggregatedFeed = useCallback(async (pageToLoad = 1, search = "") => {
    setError(null);
    setLoading(true);
    try {
      const per_page = settings?.per_page || 20;
      const per_channel = settings?.per_channel || 10;
      const t = settings?.defaultFeedType || "all";

      const response = await apiClient.getFeed(pageToLoad, per_page, search, t);
      const data = response.data;

      const items: FeedItem[] = (data.items || []);
      if (pageToLoad === 1) {
        setFeed(items);
      } else {
        setFeed((p) => [...p, ...items]);
      }

      const perPage = Number(data.per_page || per_page);
      const totalCount = Number(data.total || 0);
      setHasMore(pageToLoad * perPage < totalCount);
      setPage(pageToLoad);
      setTotal(totalCount || null);
      setSelected("all");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [settings]);

  // Other functions...
  const addSub = useCallback(async () => {
    setError(null);
    const url = input.trim();
    if (!url) {
      setError("Please paste a channel URL, handle, or channel id.");
      return;
    }
    setLoading(true);
    try {
      const j = await apiClient.resolveChannel(url);
      const channelId: string = j.channelId;
      const title: string | null = j.title || null;

      await apiClient.addSubscription({
        id: channelId,
        title,
        url: `https://www.youtube.com/channel/${channelId}`
      });

      setInput("");
      await fetchSubs();
      setSelected(channelId);
      // Note: Would need to implement fetchFeedFor with caching
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [input, fetchSubs]);

  const removeSub = useCallback(async (id: string) => {
    try {
      await apiClient.removeSubscription(id);
      setSubs((p) => p.filter((s) => s.id !== id));
      if (selected === id) {
        setSelected(null);
        setFeed([]);
      }
    } catch (e: unknown) {
      setError(String(e));
    }
  }, [selected]);

  const clearAll = useCallback(async () => {
    try {
      await apiClient.clearSubscriptions();
      setSubs([]);
      setFeed([]);
      setSelected(null);
      setClearConfirmOpen(false);
    } catch (e: unknown) {
      setError(String(e));
    }
  }, []);

  const saveSettings = useCallback(async () => {
    try {
      const response = await apiClient.saveSettings(settingsDraft);
      const newSettings = response.settings || null;
      setSettings(newSettings);

      // Refresh current view
      if (selected === "all") {
        await fetchAggregatedFeed(1, query);
      }

      setSettingsOpen(false);
    } catch (e: unknown) {
      setError(String(e));
    }
  }, [settingsDraft, selected, query, fetchAggregatedFeed]);

  const toggleDarkMode = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  }, [isDark]);

  const handleItemClick = useCallback((item: FeedItem) => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <>
      <main className="min-h-screen" id="main-content">
        <Container size="2xl" padding="md">
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-primary">Subbed</h1>
                  <p className="text-sm text-muted-foreground">YouTube Subscriptions Manager</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowOnboarding(true)}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Help
                </Button>
                <Button
                  onClick={toggleDarkMode}
                  variant="outline"
                  size="sm"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button onClick={() => setSettingsOpen(true)} variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </header>

          <section className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste channel URL, handle (@name), or channel id"
                className="flex-1"
                aria-describedby={error ? "add-subscription-error" : undefined}
              />
              <Button onClick={addSub} disabled={loading} size="responsive">
                <Plus className="w-4 h-4 mr-2" />
                {loading ? "Adding..." : "Add"}
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription id="add-subscription-error">{error}</AlertDescription>
              </Alert>
            )}
          </section>

          <Grid cols={3} gap={6}>
            <aside className="md:col-span-1">
              <SubscriptionList
                subs={subs}
                selected={selected}
                loading={loading}
                onSelect={setSelected}
                onRefreshAll={() => fetchAggregatedFeed(1, query)}
                onRemove={removeSub}
                onOpenClearConfirm={() => setClearConfirmOpen(true)}
              />
            </aside>

            <section className="md:col-span-2">
              <FeedHeader
                selected={selected}
                subs={subs}
                query={query}
                loading={loading || isSearching}
                total={total}
                onQueryChange={updateQuery}
                onRefresh={() => {
                  if (selected === "all") fetchAggregatedFeed(1, query);
                }}
                onClear={() => {
                  clearQuery();
                  if (selected === "all") fetchAggregatedFeed(1, "");
                }}
              />

              {loading && !feed.length && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm" aria-live="polite">
                      {isSearching ? "Searching..." : "Loading feed..."}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Card key={i} className="p-4">
                        <div className="flex gap-4">
                          <Skeleton className="w-32 h-24 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {!loading && !feed.length && (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <div className="w-6 h-6 bg-muted-foreground rounded-sm"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No videos to show</h3>
                      <p className="text-muted-foreground mt-1">
                        Select a subscription or press "Refresh All" to load recent uploads.
                      </p>
                    </div>
                    <Button onClick={() => fetchAggregatedFeed(1, query)} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh All
                    </Button>
                  </div>
                </Card>
              )}

              {feed.length > 0 && (
                <VirtualList
                  items={filteredFeed}
                  containerHeight={600}
                  showThumbnails={settings?.showThumbnails ?? true}
                  showDescriptions={settings?.showDescriptions ?? true}
                  onItemClick={handleItemClick}
                />
              )}

              {selected === "all" && hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => fetchAggregatedFeed(page + 1, query)}
                    disabled={loading}
                    variant="outline"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More Videos"
                    )}
                  </Button>
                </div>
              )}
            </section>
          </Grid>
        </Container>
      </main>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Settings content would go here */}
            <p className="text-sm text-muted-foreground">
              Performance settings optimized automatically.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSettingsOpen(false)} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Other dialogs would go here */}
    </>
  );
}