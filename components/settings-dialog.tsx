"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserSettings, FeedType, SortOrder } from "@/lib/types";
import { Settings, RefreshCw, CheckCircle, Play, AlertCircle, Save } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings | null;
  onSave: (settings: Partial<UserSettings>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSave,
  loading,
  error,
}) => {
  const [draft, setDraft] = useState<Partial<UserSettings>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize draft when dialog opens
  React.useEffect(() => {
    if (open && settings) {
      setDraft(settings);
      setValidationErrors({});
    }
  }, [open, settings]);

  // Validate settings before saving
  const validateSettings = useCallback((settingsToValidate: Partial<UserSettings>): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validate per_page
    if (settingsToValidate.per_page !== undefined) {
      if (typeof settingsToValidate.per_page !== 'number' || settingsToValidate.per_page < 1 || settingsToValidate.per_page > 100) {
        errors.per_page = 'Videos per page must be between 1 and 100';
      }
    }

    // Validate per_channel
    if (settingsToValidate.per_channel !== undefined) {
      if (typeof settingsToValidate.per_channel !== 'number' || settingsToValidate.per_channel < 1 || settingsToValidate.per_channel > 50) {
        errors.per_channel = 'Videos per channel must be between 1 and 50';
      }
    }

    // Validate concurrency
    if (settingsToValidate.concurrency !== undefined) {
      if (typeof settingsToValidate.concurrency !== 'number' || settingsToValidate.concurrency < 1 || settingsToValidate.concurrency > 20) {
        errors.concurrency = 'Concurrency must be between 1 and 20';
      }
    }

    // Validate caching_ttl
    if (settingsToValidate.caching_ttl !== undefined) {
      if (typeof settingsToValidate.caching_ttl !== 'number' || settingsToValidate.caching_ttl < 0 || settingsToValidate.caching_ttl > 86400) {
        errors.caching_ttl = 'Cache duration must be between 0 and 86400 seconds';
      }
    }

    // Validate defaultFeedType
    if (settingsToValidate.defaultFeedType !== undefined) {
      const validFeedTypes: FeedType[] = ['all', 'video', 'short'];
      if (!validFeedTypes.includes(settingsToValidate.defaultFeedType)) {
        errors.defaultFeedType = 'Invalid feed type';
      }
    }

    // Validate sortOrder
    if (settingsToValidate.sortOrder !== undefined) {
      const validSortOrders: SortOrder[] = ['newest', 'oldest'];
      if (!validSortOrders.includes(settingsToValidate.sortOrder)) {
        errors.sortOrder = 'Invalid sort order';
      }
    }

    return errors;
  }, []);

  const handleSave = useCallback(async () => {
    // Validate settings
    const errors = validateSettings(draft);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await onSave(draft);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the hook and displayed via error prop
    }
  }, [draft, onSave, onOpenChange, validateSettings]);

  const updateDraft = useCallback((updates: Partial<UserSettings>) => {
    setDraft((prev) => {
      const newDraft = { ...prev, ...updates };
      // Clear validation errors for the updated fields
      const updatedFields = Object.keys(updates);
      const newErrors = { ...validationErrors };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      setValidationErrors(newErrors);
      return newDraft;
    });
  }, [validationErrors]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Feed Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Feed Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="per-page" className="text-sm font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Videos per page
                </label>
                <Input
                  id="per-page"
                  type="number"
                  min="1"
                  max="100"
                  value={draft.per_page ?? settings?.per_page ?? 20}
                  onChange={(e) => updateDraft({ per_page: Number(e.target.value) })}
                  className={validationErrors.per_page ? 'border-destructive' : ''}
                />
                {validationErrors.per_page && (
                  <p className="text-xs text-destructive">{validationErrors.per_page}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of videos to show per page (1-100)
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="per-channel" className="text-sm font-medium flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Videos per channel
                </label>
                <Input
                  id="per-channel"
                  type="number"
                  min="1"
                  max="50"
                  value={draft.per_channel ?? settings?.per_channel ?? 10}
                  onChange={(e) => updateDraft({ per_channel: Number(e.target.value) })}
                  className={validationErrors.per_channel ? 'border-destructive' : ''}
                />
                {validationErrors.per_channel && (
                  <p className="text-xs text-destructive">{validationErrors.per_channel}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Maximum videos from each channel (1-50)
                </p>
              </div>
            </div>
          </div>

          {/* Display Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Display Options
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showThumbnails ?? settings?.showThumbnails ?? true}
                  onChange={(e) => updateDraft({ showThumbnails: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show video thumbnails</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.showDescriptions ?? settings?.showDescriptions ?? true}
                  onChange={(e) => updateDraft({ showDescriptions: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show video descriptions</span>
              </label>
            </div>
          </div>

          {/* Content Filtering */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5" />
              Content Filtering
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="default-feed-type" className="text-sm font-medium">
                  Default content type
                </label>
                <select
                  id="default-feed-type"
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  value={draft.defaultFeedType ?? settings?.defaultFeedType ?? "all"}
                  onChange={(e) => updateDraft({ defaultFeedType: e.target.value as FeedType })}
                >
                  <option value="all">All videos</option>
                  <option value="video">Regular videos only</option>
                  <option value="short">Shorts only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="sort-order" className="text-sm font-medium">
                  Sort order
                </label>
                <select
                  id="sort-order"
                  className="w-full border rounded px-3 py-2 text-sm bg-background"
                  value={draft.sortOrder ?? settings?.sortOrder ?? "newest"}
                  onChange={(e) => updateDraft({ sortOrder: e.target.value as SortOrder })}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Performance Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="concurrency" className="text-sm font-medium">
                  Concurrent requests
                </label>
                <Input
                  id="concurrency"
                  type="number"
                  min="1"
                  max="20"
                  value={draft.concurrency ?? settings?.concurrency ?? 6}
                  onChange={(e) => updateDraft({ concurrency: Number(e.target.value) })}
                  className={validationErrors.concurrency ? 'border-destructive' : ''}
                />
                {validationErrors.concurrency && (
                  <p className="text-xs text-destructive">{validationErrors.concurrency}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Number of simultaneous API calls (1-20)
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="cache-ttl" className="text-sm font-medium">
                  Cache duration (seconds)
                </label>
                <Input
                  id="cache-ttl"
                  type="number"
                  min="0"
                  max="86400"
                  value={draft.caching_ttl ?? settings?.caching_ttl ?? 0}
                  onChange={(e) => updateDraft({ caching_ttl: Number(e.target.value) })}
                  className={validationErrors.caching_ttl ? 'border-destructive' : ''}
                />
                {validationErrors.caching_ttl && (
                  <p className="text-xs text-destructive">{validationErrors.caching_ttl}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  0 = no caching, max 24 hours (86400s)
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || Object.keys(validationErrors).length > 0}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};