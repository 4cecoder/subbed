"use client";

import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { VideoCardProps } from "@/lib/types";

const VideoCardComponent: React.FC<VideoCardProps> = memo(({
  item,
  showThumbnail = true,
  showDescription = true,
  onClick,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.(item);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          {showThumbnail && (
            <div className="flex-shrink-0 w-32 sm:w-40">
              {item.thumbnail ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch ${item.title} on YouTube (opens in new tab)`}
                  className="block"
                  onClick={handleClick}
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={item.thumbnail}
                      alt={`Thumbnail for ${item.title}`}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                      decoding="async"
                      style={{ aspectRatio: '16/9' }}
                    />
                  </div>
                </a>
              ) : (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 p-4 min-w-0">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${item.title} on YouTube (opens in new tab)`}
              className="font-semibold text-sm sm:text-base hover:text-primary transition-colors line-clamp-2 block"
              onClick={handleClick}
            >
              {item.title}
            </a>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
              {item.channelTitle && (
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  <span className="truncate">{item.channelTitle}</span>
                </div>
              )}
              <span>•</span>
              <time dateTime={item.published}>
                {new Date(item.published).toLocaleDateString()}
              </time>
            </div>
            {showDescription && item.description && (
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
  );
});

VideoCardComponent.displayName = "VideoCard";

export const VideoCard = VideoCardComponent;