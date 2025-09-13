"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Optimized icon imports - only import what we need
import { Settings } from "lucide-react";
import { Plus } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { Trash2 } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { Search } from "lucide-react";
import { Moon } from "lucide-react";
import { Sun } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Youtube } from "lucide-react";

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

type RawFeedItem = {
  id: string;
  title: string;
  link: string;
  published: string;
  thumbnail?: string;
  description?: string;
  isShort?: boolean;
};

type FeedType = "all" | "video" | "short";
type SortOrder = "newest" | "oldest";

type Settings = {
  per_page: number;
  per_channel: number;
  showThumbnails: boolean;
  showDescriptions: boolean;
  defaultFeedType: FeedType;
  sortOrder: SortOrder;
  caching_ttl: number;
  concurrency: number;
};

export default function Home() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pagination/search state for aggregated feed
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // settings
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Partial<Settings>>({});
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchSubs();
    fetchSettings();
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    // when query changes and we're viewing the aggregated feed, debounce the request
    if (selected !== "all") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAggregatedFeed(1, query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected, settings]);

  async function fetchSettings() {
    try {
      const res = await fetch(`/api/settings`);
      if (!res.ok) return;
      const j = await res.json();
      setSettings(j.settings || null);
      setSettingsDraft(j.settings || {});
    } catch {
      // ignore
    }
  }

  async function saveSettings() {
    try {
      const res = await fetch(`/api/settings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      if (!res.ok) throw new Error("failed to save settings");
      const j = await res.json();
      const newSettings = j.settings || null;
      setSettings(newSettings);
      setSettingsOpen(false);

      // Refresh current view so new defaultFeedType / limits apply immediately
      try {
        if (selected === "all") {
          await fetchAggregatedFeed(1, query, newSettings?.defaultFeedType || undefined);
        } else if (selected) {
          await fetchFeedFor(selected, newSettings?.defaultFeedType || undefined);
        }
      } catch {
        // ignore refresh errors here
      }
    } catch (e: unknown) {
      setError(String(e));
    }
  }

  async function fetchSubs() {
    try {
      const res = await fetch(`/api/subscriptions`);
      if (!res.ok) throw new Error("failed to load subscriptions");
      const data = await res.json();
      setSubs(data || []);
    } catch (e: unknown) {
      setError(String(e));
    }
  }

  async function addSub() {
    setError(null);
    const url = input.trim();
    if (!url) {
      setError("Please paste a channel URL, handle, or channel id.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/resolve?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || res.statusText || "failed to resolve");
      }
      const j = await res.json();
      const channelId: string = j.channelId;
      const title: string | null = j.title || null;
      if (!channelId) throw new Error("Could not determine channel id");

      const post = await fetch(`/api/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: channelId, title, url: `https://www.youtube.com/channel/${channelId}` }),
      });
      if (!post.ok) {
        const j2 = await post.json().catch(() => ({}));
        throw new Error(j2?.error || post.statusText || "failed to save subscription");
      }

      setInput("");
      await fetchSubs();
      setSelected(channelId);
      await fetchFeedFor(channelId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function removeSub(id: string) {
    try {
      const res = await fetch(`/api/subscriptions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to remove");
      setSubs((p) => p.filter((s) => s.id !== id));
      if (selected === id) {
        setSelected(null);
        setFeed([]);
      }
    } catch (e: unknown) {
      setError(String(e));
    }
  }

  async function clearAll() {
    try {
      const res = await fetch(`/api/subscriptions`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to clear");
      setSubs([]);
      setFeed([]);
      setSelected(null);
      setClearConfirmOpen(false);
    } catch (e: unknown) {
      setError(String(e));
    }
  }

  async function fetchFeedFor(channelId: string, type?: string) {
    setError(null);
    setLoading(true);
    setFeed([]);
    try {
      const limit = settings?.per_channel || 10;
      const t = type || settings?.defaultFeedType || "all";
      const res = await fetch(`/api/rss?id=${encodeURIComponent(channelId)}&limit=${limit}&type=${encodeURIComponent(t)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || res.statusText || "failed to fetch feed");
      }
      const data = await res.json();
      const items: FeedItem[] = (data.items || []).map((it: RawFeedItem) => ({ ...it, channelId: data.channelId, channelTitle: data.channelTitle }));
      setFeed(items);
      setTotal(items.length);
      setHasMore(false);
      setPage(1);
      setSelected(channelId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchAggregatedFeed(pageToLoad = 1, search = "", type?: string) {
    setError(null);
    setLoading(true);
    try {
      const per_page = settings?.per_page || 20;
      const per_channel = settings?.per_channel || 10;
      const t = type || settings?.defaultFeedType || "all";
      const res = await fetch(`/api/feed?page=${pageToLoad}&per_page=${per_page}&per_channel=${per_channel}&q=${encodeURIComponent(search)}&type=${encodeURIComponent(t)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || res.statusText || "failed to fetch aggregated feed");
      }
      const j = await res.json();
      const items: FeedItem[] = (j.items || []);
      if (pageToLoad === 1) {
        setFeed(items);
      } else {
        setFeed((p) => [...p, ...items]);
      }
      const perPage = Number(j.per_page || per_page);
      const totalCount = Number(j.total || 0);
      setHasMore(pageToLoad * perPage < totalCount);
      setPage(pageToLoad);
      setTotal(totalCount || null);
      setSelected("all");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllFeeds() {
    // convenience: fetch first page of aggregated feed
    await fetchAggregatedFeed(1, query);
  }

  function openSettings() {
    setSettingsDraft(settings || {});
    setSettingsOpen(true);
  }

  function closeSettings() {
    setSettingsOpen(false);
  }

  function openClearConfirm() {
    setClearConfirmOpen(true);
  }

  function closeClearConfirm() {
    setClearConfirmOpen(false);
  }

  function toggleDarkMode() {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle('dark', newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <main className="min-h-screen" id="main-content">
      <Container size="2xl" padding="md">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Youtube className="w-8 h-8 text-primary" />
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
            <Button onClick={openSettings} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <section className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <label htmlFor="add-subscription" className="sr-only">Add subscription URL, handle, or channel ID</label>
          <Input
            id="add-subscription"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste channel URL, handle (@name), or channel id (UC...)"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="w-5 h-5" />
                Subscriptions
                <Badge variant="secondary" className="ml-auto">
                  {subs.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button disabled={subs.length === 0 || loading} onClick={fetchAllFeeds} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh All
                  </Button>
                  <Button onClick={openClearConfirm} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>

           <ul className="space-y-2 sm:space-y-3">
            <li className={`p-4 border rounded-lg transition-all hover:shadow-md ${selected === "all" ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-accent/50"}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Youtube className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      onClick={() => { setSelected("all"); fetchAllFeeds(); }}
                    >
                      <div className="font-semibold text-sm">All Subscriptions</div>
                      <div className="text-xs text-muted-foreground mt-1">Aggregated recent uploads</div>
                    </button>
                  </div>
                </div>
                <Button
                  onClick={() => { setSelected("all"); fetchAllFeeds(); }}
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                >
                  View
                </Button>
              </div>
            </li>

            {subs.length === 0 && <li className="text-sm text-gray-500">No subscriptions yet.</li>}
            {subs.map((s) => (
              <li key={s.id} className={`p-4 border rounded-lg transition-all hover:shadow-md ${selected === s.id ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-accent/50"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                        onClick={() => { setSelected(s.id); fetchFeedFor(s.id); }}
                      >
                        <div className="font-semibold text-sm truncate">{s.title || s.id}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{s.id}</div>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${s.title || s.id} channel on YouTube (opens in new tab)`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button
                      onClick={() => removeSub(s.id)}
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
            </CardContent>
          </Card>
        </aside>

        <section className="md:col-span-2">
          <div className="mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {selected === "all" ? (
                    <>
                      <Youtube className="w-5 h-5 text-primary" />
                      All Recent Uploads
                    </>
                  ) : selected ? (
                    <>
                      <Youtube className="w-5 h-5 text-primary" />
                      {subs.find((s) => s.id === selected)?.title || selected}
                    </>
                  ) : (
                    "Feed"
                  )}
                </h2>
                {selected === "all" && total != null && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {feed.length} of {total} recent videos
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="flex-1 sm:flex-initial">
                  <label htmlFor="search-videos" className="sr-only">Search videos</label>
                  <Input
                    id="search-videos"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search videos..."
                    className="w-full sm:w-64"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => { setQuery(""); if (selected === "all") fetchAggregatedFeed(1, ""); }}
                    variant="outline"
                    size="sm"
                  >
                    Clear
                  </Button>
                  <Button
                    disabled={!selected || loading}
                    onClick={() => { if (selected === "all") fetchAggregatedFeed(1, query); else if (selected) fetchFeedFor(selected); }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm" aria-live="polite">Loading feed...</span>
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
          {!loading && feed.length === 0 && (
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <Youtube className="w-12 h-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No videos to show</h3>
                  <p className="text-muted-foreground mt-1">
                    Select a subscription or press &ldquo;Refresh All&rdquo; to load recent uploads.
                  </p>
                </div>
                <Button onClick={fetchAllFeeds} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh All
                </Button>
              </div>
            </Card>
          )}
          
          {feed.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {feed
                .filter((item) => {
                  const t = settings?.defaultFeedType || "all";
                  if (t === "video") return !item.isShort;
                  if (t === "short") return !!item.isShort;
                  return true;
                })
                .map((item) => (
                  <Card key={item.link} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex">
                        {(settings?.showThumbnails ?? true) && (
                          <div className="flex-shrink-0 w-32 sm:w-40">
                            {item.thumbnail ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Watch ${item.title} on YouTube (opens in new tab)`}
                                className="block"
                              >
                                <img
                                  src={item.thumbnail}
                                  alt={`Thumbnail for ${item.title}`}
                                  className="w-full h-24 sm:h-28 object-cover hover:opacity-90 transition-opacity"
                                />
                              </a>
                            ) : (
                              <div className="w-full h-24 sm:h-28 bg-muted flex items-center justify-center">
                                <Youtube className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Watch ${item.title} on YouTube (opens in new tab)`}
                            className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 block"
                          >
                            {item.title}
                          </a>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {item.channelTitle && (
                              <>
                                <Youtube className="w-3 h-3" />
                                <span>{item.channelTitle}</span>
                              </>
                            )}
                            <span>•</span>
                            <time dateTime={item.published}>
                              {new Date(item.published).toLocaleDateString()}
                            </time>
                          </div>
                          {(settings?.showDescriptions ?? true) && item.description && (
                            <p className="text-xs sm:text-sm mt-2 text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.isShort && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              Short
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          )}

          {selected === "all" && hasMore && (
            <div className="mt-6 text-center">
              <Button
                onClick={() => fetchAggregatedFeed(page + 1, query)}
                disabled={loading}
                variant="outline"
                size="lg"
                aria-describedby="load-more-status"
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
              <div id="load-more-status" className="sr-only" aria-live="polite">
                {loading ? "Loading more videos..." : ""}
              </div>
            </div>
          )}
        </section>
      </Grid>

      {/* Settings modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Feed Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="per-page" className="text-sm font-medium flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    Videos per page
                  </label>
                  <Input
                    id="per-page"
                    type="number"
                    min="1"
                    max="100"
                    value={settingsDraft.per_page ?? settings?.per_page ?? 20}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, per_page: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="per-channel" className="text-sm font-medium flex items-center gap-2">
                    <Youtube className="w-4 h-4" />
                    Videos per channel
                  </label>
                  <Input
                    id="per-channel"
                    type="number"
                    min="1"
                    max="50"
                    value={settingsDraft.per_channel ?? settings?.per_channel ?? 10}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, per_channel: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Display Options
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsDraft.showThumbnails ?? settings?.showThumbnails ?? true}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, showThumbnails: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Show video thumbnails</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsDraft.showDescriptions ?? settings?.showDescriptions ?? true}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, showDescriptions: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Show video descriptions</span>
                </label>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Youtube className="w-5 h-5" />
                Content Filtering
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="default-feed-type" className="text-sm font-medium">Default content type</label>
                  <select
                    id="default-feed-type"
                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                    value={settingsDraft.defaultFeedType ?? settings?.defaultFeedType ?? "all"}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, defaultFeedType: e.target.value as FeedType }))}
                  >
                    <option value="all">All videos</option>
                    <option value="video">Regular videos only</option>
                    <option value="short">Shorts only</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="sort-order" className="text-sm font-medium">Sort order</label>
                  <select
                    id="sort-order"
                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                    value={settingsDraft.sortOrder ?? settings?.sortOrder ?? "newest"}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, sortOrder: e.target.value as SortOrder }))}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Performance Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="concurrency" className="text-sm font-medium">Concurrent requests</label>
                  <Input
                    id="concurrency"
                    type="number"
                    min="1"
                    max="20"
                    value={settingsDraft.concurrency ?? settings?.concurrency ?? 6}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, concurrency: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Number of simultaneous API calls</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="cache-ttl" className="text-sm font-medium">Cache duration (seconds)</label>
                  <Input
                    id="cache-ttl"
                    type="number"
                    min="0"
                    max="86400"
                    value={settingsDraft.caching_ttl ?? settings?.caching_ttl ?? 0}
                    onChange={(e) => setSettingsDraft((s) => ({ ...s, caching_ttl: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">0 = no caching</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={closeSettings} variant="outline">Cancel</Button>
            <Button onClick={saveSettings}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="w-full max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-primary" />
              Welcome to Subbed!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Add Subscriptions</h3>
                  <p className="text-sm text-muted-foreground">
                    Paste a YouTube channel URL, handle (&ldquo;@name&rdquo;), or channel ID to add subscriptions.
                    Your data stays local in your browser.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Refresh Feeds</h3>
                  <p className="text-sm text-muted-foreground">
                    Click &ldquo;Refresh All&rdquo; to load recent videos from all your subscriptions.
                    Individual channels can be refreshed separately.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Search & Filter</h3>
                  <p className="text-sm text-muted-foreground">
                    Use the search bar to find specific videos. Configure display options
                    in Settings to show/hide thumbnails and descriptions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Customize</h3>
                  <p className="text-sm text-muted-foreground">
                    Adjust feed limits, content types, and performance settings in the
                    Settings panel. Toggle dark mode for comfortable viewing.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOnboarding(false)}>Get Started</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear confirmation dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Clear All Subscriptions?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete all subscriptions? This action cannot be undone.
            </p>
              <div className="text-sm font-medium text-destructive">
                This will permanently remove {subs.length} subscription{subs.length !== 1 ? "s" : ""}.
              </div>
          </div>
          <DialogFooter>
            <Button onClick={closeClearConfirm} variant="outline">Cancel</Button>
            <Button onClick={clearAll} variant="destructive">Clear All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </Container>
    </main>
    </>
  );
}
