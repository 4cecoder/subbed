"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Plus, RefreshCw, Search, Settings } from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
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
          <Button onClick={() => onOpenChange(false)}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};