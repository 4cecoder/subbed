"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FeedEmptyProps {
  onRefresh: () => void;
}

export const FeedEmpty: React.FC<FeedEmptyProps> = ({ onRefresh }) => {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 bg-muted-foreground rounded-sm"></div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">No videos to show</h3>
          <p className="text-muted-foreground mt-1">
            Select a subscription or press &ldquo;Refresh All&rdquo; to load recent uploads.
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh All
        </Button>
      </div>
    </Card>
  );
};