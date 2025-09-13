"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/grid";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Settings, Plus, Moon, Sun, AlertCircle, Loader2 } from "lucide-react";

// Components
import { SubscriptionList } from "./subscription-list";
import { FeedHeader } from "./feed-header";
import { EnhancedVirtualList } from "./enhanced-virtual-list";
import { SettingsDialog } from "./settings-dialog";
import { OnboardingDialog } from "./onboarding-dialog";
import { ConfirmationDialog } from "./confirmation-dialog";
import { ErrorBoundary } from "./error-boundary";
import { FeedLoading } from "./feed-loading";
import { FeedEmpty } from "./feed-empty";
import { FeedbackDialog } from "./feedback-dialog";

// Hooks
import { useSubscriptions } from "@/lib/hooks/use-subscriptions";
import { useFeed } from "@/lib/hooks/use-feed";
import { useSettings } from "@/lib/hooks/use-settings";
import { useTheme } from "@/lib/hooks/use-theme";
import { useDebouncedSearch } from "@/lib/hooks/use-debounced-search";

// Types
import { FeedItem } from "@/lib/types";

export default function RefactoredMainPage() {
  // UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [input, setInput] = useState("");

  // Custom hooks
  const { isDark, toggleTheme } = useTheme();
  const {
    subscriptions,
    loading: subsLoading,
    error: subsError,
    addSubscription,
    removeSubscription,
    clearSubscriptions,
    refreshSubscriptions,
  } = useSubscriptions();

  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
    refreshSettings,
  } = useSettings();

  const {
    feed,
    loading: feedLoading,
    error: feedError,
    total,
    hasMore,
    page,
    loadFeed,
    loadChannelFeed,
    refreshCurrentFeed,
  } = useFeed(settings);

  // Debounced search
  const { query, updateQuery, clearQuery, isSearching } = useDebouncedSearch(
    "",
    useCallback(
      (searchQuery: string) => {
        if (selectedId === "all") {
          loadFeed(1, searchQuery);
        }
      },
      [selectedId, loadFeed]
    ),
    { delay: 300, minLength: 0 }
  );

  // Initialize data on mount
  useEffect(() => {
    refreshSubscriptions();
    refreshSettings();
  }, [refreshSubscriptions, refreshSettings]);

  // Handle subscription selection
  const handleSelectSubscription = useCallback(
    async (id: string) => {
      setSelectedId(id);
      if (id === "all") {
        await loadFeed(1, query);
      } else {
        await loadChannelFeed(id);
      }
    },
    [loadFeed, loadChannelFeed, query]
  );

  // Handle adding subscription
  const handleAddSubscription = useCallback(async () => {
    try {
      await addSubscription(input);
      setInput("");
    } catch (error) {
      // Error is handled by the hook
    }
  }, [addSubscription, input]);

  // Handle removing subscription
  const handleRemoveSubscription = useCallback(
    async (id: string) => {
      await removeSubscription(id);
    },
    [removeSubscription]
  );

  // Handle clearing all subscriptions
  const handleClearSubscriptions = useCallback(async () => {
    await clearSubscriptions();
    setClearConfirmOpen(false);
  }, [clearSubscriptions]);

  // Handle refreshing all feeds
  const handleRefreshAll = useCallback(async () => {
    await loadFeed(1, query);
  }, [loadFeed, query]);

  // Handle loading more videos
  const handleLoadMore = useCallback(async () => {
    if (selectedId === "all" && hasMore) {
      await loadFeed(page + 1, query);
    }
  }, [selectedId, hasMore, page, query, loadFeed]);

  // Handle video click
  const handleVideoClick = useCallback((item: FeedItem) => {
    window.open(item.link, '_blank', 'noopener,noreferrer');
  }, []);

  // Memoized error state
  const hasError = subsError || feedError || settingsError;
  const errorMessage = subsError || feedError || settingsError;

  // Loading state for UI
  const isLoading = subsLoading || feedLoading || settingsLoading || isSearching;

  return (
    <ErrorBoundary>
      <>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>

        <main className="min-h-screen" id="main-content">
          <Container size="2xl" padding="md">
            {/* Header */}
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
                    onClick={() => setOnboardingOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Help
                  </Button>
                  <Button
                    onClick={toggleTheme}
                    variant="outline"
                    size="sm"
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </Button>
                  <FeedbackDialog />
                  <Button
                    onClick={() => setSettingsOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </header>

            {/* Add Subscription Section */}
            <section className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <label htmlFor="add-subscription" className="sr-only">
                  Add subscription URL, handle, or channel ID
                </label>
                <Input
                  id="add-subscription"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Paste channel URL, handle (@name), or channel id (UC...)"
                  className="flex-1"
                  aria-describedby={hasError ? "add-subscription-error" : undefined}
                />
                <Button
                  onClick={handleAddSubscription}
                  disabled={isLoading}
                  size="responsive"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isLoading ? "Adding..." : "Add"}
                </Button>
              </div>
              {hasError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription id="add-subscription-error">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}
            </section>

            {/* Main Content Grid */}
            <Grid cols={3} gap={6}>
              {/* Subscriptions Sidebar */}
              <aside className="md:col-span-1 h-full">
                <SubscriptionList
                  subs={subscriptions}
                  selected={selectedId}
                  loading={subsLoading}
                  onSelect={handleSelectSubscription}
                  onRefreshAll={handleRefreshAll}
                  onRemove={handleRemoveSubscription}
                  onOpenClearConfirm={() => setClearConfirmOpen(true)}
                />
              </aside>

              {/* Feed Section */}
              <section className="md:col-span-2">
                <FeedHeader
                  selected={selectedId}
                  subs={subscriptions}
                  query={query}
                  loading={isLoading}
                  total={total}
                  onQueryChange={updateQuery}
                  onRefresh={refreshCurrentFeed}
                  onClear={() => {
                    clearQuery();
                    if (selectedId === "all") loadFeed(1, "");
                  }}
                />

                {/* Loading State */}
                {isLoading && !feed.length && <FeedLoading isSearching={isSearching} />}

                {/* Empty State */}
                {!isLoading && !feed.length && <FeedEmpty onRefresh={handleRefreshAll} />}

                {/* Feed Content */}
                {feed.length > 0 && (
                  <EnhancedVirtualList
                    items={feed}
                    containerHeight={600}
                    showThumbnails={settings?.showThumbnails ?? true}
                    showDescriptions={settings?.showDescriptions ?? true}
                    onItemClick={handleVideoClick}
                  />
                )}

                {/* Load More */}
                {selectedId === "all" && hasMore && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                    >
                      {isLoading ? (
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

        {/* Dialogs */}
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSave={updateSettings}
          loading={settingsLoading}
        />

        <OnboardingDialog
          open={onboardingOpen}
          onOpenChange={setOnboardingOpen}
        />

        <ConfirmationDialog
          open={clearConfirmOpen}
          onOpenChange={setClearConfirmOpen}
          title="Clear All Subscriptions?"
          description={`Are you sure you want to delete all subscriptions? This action cannot be undone. This will permanently remove ${subscriptions.length} subscription${subscriptions.length !== 1 ? "s" : ""}.`}
          confirmText="Clear All"
          variant="destructive"
          onConfirm={handleClearSubscriptions}
          loading={subsLoading}
        />
      </>
    </ErrorBoundary>
  );
}