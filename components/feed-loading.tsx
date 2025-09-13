"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface FeedLoadingProps {
  isSearching?: boolean;
}

export const FeedLoading: React.FC<FeedLoadingProps> = ({ isSearching = false }) => {
  return (
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
  );
};