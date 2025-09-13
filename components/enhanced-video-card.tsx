"use client";

import React, { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink, Share2, Clock, User } from "lucide-react";
import { VideoCardProps } from "@/lib/types";

const EnhancedVideoCardComponent: React.FC<VideoCardProps> = memo(({
  item,
  showThumbnail = true,
  showDescription = true,
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.(item);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description || item.title,
        url: item.link,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(item.link);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-to-br from-card via-card to-card/95">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail Section */}
          {showThumbnail && (
            <div className="relative flex-shrink-0 w-full sm:w-48 lg:w-56">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {item.thumbnail && !imageError ? (
                  <>
                    <img
                      src={item.thumbnail}
                      alt={`Thumbnail for ${item.title}`}
                      className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                        imageLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                      style={{ aspectRatio: '16/9' }}
                    />
                    {!imageLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                    <Play className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    className="bg-white/90 hover:bg-white text-black shadow-lg"
                    asChild
                  >
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Watch ${item.title} on YouTube`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch
                    </a>
                  </Button>
                </div>

                {/* Duration/Short badge */}
                {item.isShort && (
                  <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1">
                    SHORT
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between min-w-0">
            <div className="space-y-3">
              {/* Title */}
              <h3 className="font-semibold text-base sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Watch ${item.title} on YouTube (opens in new tab)`}
                  className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1 -m-1"
                  onClick={handleClick}
                >
                  {item.title}
                </a>
              </h3>

              {/* Channel and Date */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {item.channelTitle && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium truncate">{item.channelTitle}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <time dateTime={item.published} className="whitespace-nowrap">
                    {formatDate(item.published)}
                  </time>
                </div>
              </div>

              {/* Description */}
              {showDescription && item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                  asChild
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Watch ${item.title} on YouTube`}
                  >
                    <ExternalLink className="w-3 h-3 mr-1.5" />
                    Watch
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs hover:bg-muted"
                  onClick={handleShare}
                  aria-label="Share video"
                >
                  <Share2 className="w-3 h-3 mr-1.5" />
                  Share
                </Button>
              </div>

              {/* Additional metadata */}
              <div className="text-xs text-muted-foreground/70">
                {item.channelId && (
                  <span className="hidden sm:inline">
                    ID: {item.channelId.slice(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EnhancedVideoCardComponent.displayName = "EnhancedVideoCard";

export const EnhancedVideoCard = EnhancedVideoCardComponent;