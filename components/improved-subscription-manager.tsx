'use client';

import React, { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SubscriptionItem } from '@/components/subscription-item';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { Subscription } from '@/lib/types';
import { useSubscriptionManager } from '@/lib/hooks/use-subscription-manager';
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  Trash2,
  Search,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';

interface ImprovedSubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImprovedSubscriptionManager: React.FC<ImprovedSubscriptionManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    state,
    subscriptions,
    loading,
    filteredAndSortedSubscriptions,
    groupedSubscriptions,
    setInputValue,
    setSearchQuery,
    setSortBy,
    setGroupBy,
    setViewMode,
    toggleGroup,
    setShowClearConfirm,
    setShowRemoveConfirm,
    handleAddSubscription,
    handleRemoveSubscription,
    handleClearAll,
    resetState,
  } = useSubscriptionManager();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      resetState();
    }
  }, [open, resetState]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && state.inputValue.trim()) {
        e.preventDefault();
        handleAddSubscription();
      }
    },
    [state.inputValue, handleAddSubscription]
  );

  const handleRemoveClick = useCallback((subscription: Subscription) => {
    setShowRemoveConfirm(true, subscription);
  }, [setShowRemoveConfirm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl lg:max-w-7xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="w-5 h-5" />
              Subscription Manager
              <Badge variant="secondary" className="ml-2">
                {subscriptions.length} channels
              </Badge>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode(state.viewMode === 'simple' ? 'advanced' : 'simple')}
                className="h-8 px-3"
              >
                <Settings className="w-4 h-4 mr-2" />
                {state.viewMode === 'simple' ? 'Advanced' : 'Simple'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Add Subscription Section - Always Visible */}
          <Card className="m-6 mb-0 bg-white dark:bg-gray-900 border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="w-4 h-4" />
                Add New Subscription
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter YouTube channel URL, handle (@username), channel ID, or video URL..."
                    value={state.inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[80px] bg-white dark:bg-gray-800 border resize-none"
                    disabled={state.isResolving}
                    aria-label="Enter YouTube channel URL or handle"
                  />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Supported formats:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Channel URL: https://www.youtube.com/channel/UC...</li>
                      <li>Handle: @username or https://www.youtube.com/@username</li>
                      <li>Custom URL: https://www.youtube.com/c/channelname</li>
                      <li>Video URL: https://www.youtube.com/watch?v=...</li>
                      <li>Channel ID: UC... (22 characters)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddSubscription}
                    disabled={!state.inputValue.trim() || state.isResolving}
                    className="flex-1"
                  >
                    {state.isResolving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Subscription
                      </>
                    )}
                  </Button>
                </div>

                {/* Status Messages */}
                {state.resolveError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{state.resolveError}</AlertDescription>
                  </Alert>
                )}

                {state.resolveSuccess && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {state.resolveSuccess}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters - Only in Advanced Mode */}
          {state.viewMode === 'advanced' && (
            <Card className="mx-6 mb-0 bg-white dark:bg-gray-900 border shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search subscriptions..."
                      value={state.searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                      aria-label="Search subscriptions"
                    />
                    {state.searchQuery && (
                      <Button
                        onClick={() => setSearchQuery('')}
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Sort */}
                  <Select value={state.sortBy} onValueChange={(value: 'newest' | 'oldest' | 'name') => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Group */}
                  <Select value={state.groupBy} onValueChange={(value: 'none' | 'date' | 'alphabetical') => setGroupBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Group by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Grouping</SelectItem>
                      <SelectItem value="date">By Date</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredAndSortedSubscriptions.length !== subscriptions.length && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    Showing {filteredAndSortedSubscriptions.length} of {subscriptions.length} subscriptions
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscriptions List */}
          <Card className="flex-1 flex flex-col min-h-0 m-6 mt-0 bg-white dark:bg-gray-900 border shadow-lg">
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="w-4 h-4" />
                  Your Subscriptions
                </CardTitle>
                {subscriptions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-8">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto">
                      <Users className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">No subscriptions yet</p>
                      <p className="text-sm text-muted-foreground/70">
                        Add your first YouTube channel above
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-3">
                    {groupedSubscriptions.map(group => (
                      <div key={group.title} className="space-y-2">
                        {state.groupBy !== 'none' && (
                          <Button
                            onClick={() => toggleGroup(group.title)}
                            variant="ghost"
                            className="w-full justify-between p-3 h-auto rounded-xl border border-border/50 hover:bg-accent/50 hover:border-accent/80 transition-all duration-200"
                            aria-expanded={group.isExpanded}
                            aria-controls={`group-${group.title}`}
                          >
                            <span className="font-medium text-sm flex items-center gap-2">
                              {state.groupBy === 'date' && (
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                              )}
                              {group.title}
                              <Badge variant="outline" className="ml-2 text-xs">
                                {group.subscriptions.length}
                              </Badge>
                            </span>
                            {group.isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}

                        {(state.groupBy === 'none' || group.isExpanded) && (
                          <div id={`group-${group.title}`} className="space-y-2">
                            {group.subscriptions.map(subscription => (
                              <SubscriptionItem
                                key={subscription._id}
                                subscription={subscription}
                                onRemove={handleRemoveClick}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Clear All Confirmation Dialog */}
      <ConfirmationDialog
        open={state.showClearConfirm}
        onOpenChange={setShowClearConfirm}
        title="Clear All Subscriptions"
        description="Are you sure you want to remove all subscriptions? This action cannot be undone and will permanently delete all your subscribed channels."
        confirmText="Clear All"
        variant="destructive"
        onConfirm={handleClearAll}
      />

      {/* Remove Individual Subscription Confirmation Dialog */}
      <ConfirmationDialog
        open={state.showRemoveConfirm}
        onOpenChange={(show) => setShowRemoveConfirm(show)}
        title="Remove Subscription"
        description={`Are you sure you want to remove "${state.selectedForRemoval?.channelName}"? This action cannot be undone.`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={() => {
          if (state.selectedForRemoval) {
            handleRemoveSubscription(state.selectedForRemoval.channelId);
          }
        }}
      />
    </Dialog>
  );
};