"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SubscriptionList } from '@/components/subscription-list';
import { useConvexSubscriptions } from '@/lib/hooks/use-convex-subscriptions';
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Users,
  X,
  Trash2
} from 'lucide-react';
import { Doc } from "@/convex/_generated/dataModel";

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  open,
  onOpenChange,
}) => {
  const { subscriptions, loading, addSubscription, removeSubscription, clearSubscriptions } = useConvexSubscriptions();

  const [addMode, setAddMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setAddMode(false);
      setInputValue('');
      setResolveError(null);
      setResolveSuccess(null);
    }
  }, [open]);

  const handleAddSubscription = useCallback(async () => {
    if (!inputValue.trim()) return;

    setIsResolving(true);
    setResolveError(null);
    setResolveSuccess(null);

    try {
      // Resolve channel info using the API
      const response = await fetch(`/api/resolve?url=${encodeURIComponent(inputValue.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve channel');
      }

      const { channelId, title } = data;

      // Check if already subscribed
      const existingSubscription = subscriptions.find(sub => sub.channelId === channelId);
      if (existingSubscription) {
        setResolveError(`Already subscribed to ${existingSubscription.channelName}`);
        setIsResolving(false);
        return;
      }

      // Add to ConvexDB
      await addSubscription(
        channelId,
        title || `Channel ${channelId.slice(-8)}`,
        `https://yt3.ggpht.com/ytc/default-${channelId}=s88-c-k-c0x00ffffff-no-rj`, // Default avatar
        `https://www.youtube.com/channel/${channelId}`
      );

      setResolveSuccess(`Successfully added ${title || 'channel'}`);
      setInputValue('');

      // Auto-close success message
      setTimeout(() => {
        setResolveSuccess(null);
        setAddMode(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to add subscription:', error);
      setResolveError(error instanceof Error ? error.message : 'Failed to add subscription');
    } finally {
      setIsResolving(false);
    }
  }, [inputValue, subscriptions, addSubscription]);

  const handleRemoveSubscription = useCallback(async (channelId: string) => {
    try {
      await removeSubscription(channelId);
    } catch (error) {
      console.error('Failed to remove subscription:', error);
    }
  }, [removeSubscription]);

  const handleClearAll = useCallback(async () => {
    try {
      await clearSubscriptions();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear subscriptions:', error);
    }
  }, [clearSubscriptions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubscription();
    }
  }, [handleAddSubscription]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Subscription Manager
            <Badge variant="secondary" className="ml-2">
              {subscriptions.length} channels
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Add Subscription Section */}
          <Card className="bg-white dark:bg-gray-900 border shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Add New Subscription</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAddMode(!addMode)}
                  className="bg-white dark:bg-gray-800 border"
                >
                  {addMode ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>

            {addMode && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter YouTube channel URL, handle (@username), channel ID, or video URL..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[80px] bg-white dark:bg-gray-800 border resize-none"
                      disabled={isResolving}
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Supported formats:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Channel URL: https://www.youtube.com/channel/UC...</li>
                        <li>Handle: @username or https://www.youtube.com/@username</li>
                        <li>Custom URL: https://www.youtube.com/c/channelname</li>
                        <li>Video URL: https://www.youtube.com/watch?v=... (extracts channel)</li>
                        <li>Channel ID: UC... (22 characters)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddSubscription}
                      disabled={!inputValue.trim() || isResolving}
                      className="flex-1"
                    >
                      {isResolving ? (
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
                  {resolveError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{resolveError}</AlertDescription>
                    </Alert>
                  )}

                  {resolveSuccess && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {resolveSuccess}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Subscriptions List */}
          <Card className="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 border shadow-lg">
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your Subscriptions</h3>
                {subscriptions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(true)}
                    className="text-destructive hover:text-destructive bg-white dark:bg-gray-800 border"
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
                      <p className="text-sm text-muted-foreground/70">Add your first YouTube channel above</p>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-3">
                    {subscriptions.map((subscription: Doc<"subscriptions">) => (
                      <div
                        key={subscription._id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{subscription.channelName}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {subscription.channelId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a
                              href={`https://www.youtube.com/channel/${subscription.channelId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${subscription.channelName} on YouTube`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSubscription(subscription.channelId)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            aria-label={`Remove ${subscription.channelName} subscription`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Clear All Subscriptions
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove all subscriptions? This action cannot be undone and will permanently delete all your subscribed channels.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};