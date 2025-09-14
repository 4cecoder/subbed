'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Doc } from '@/convex/_generated/dataModel';
import { ExternalLink, X, Users } from 'lucide-react';

interface SubscriptionItemProps {
  subscription: Doc<'subscriptions'>;
  isSelected?: boolean;
  onSelect?: (subscription: Doc<'subscriptions'>) => void;
  onRemove?: (channelId: string) => void;
  showRemoveButton?: boolean;
  className?: string;
}

export const SubscriptionItem: React.FC<SubscriptionItemProps> = memo(
  ({
    subscription,
    isSelected = false,
    onSelect,
    onRemove,
    showRemoveButton = true,
    className = '',
  }) => {
    const handleSelect = () => {
      onSelect?.(subscription);
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(subscription.channelId);
    };

    return (
      <div
        className={`flex items-center p-3 sm:p-4 border rounded-xl transition-all duration-200 hover:shadow-md ${
          isSelected
            ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/10'
            : 'hover:bg-accent/50 hover:border-accent/60'
        } ${className}`}
        role="listitem"
        aria-label={`Subscription: ${subscription.channelName}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Channel Avatar */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
          </div>

          {/* Channel Info */}
          <div className="flex-1 min-w-0">
            {onSelect ? (
              <button
                onClick={handleSelect}
                className="text-left w-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1 -m-1 transition-colors"
                aria-label={`Select ${subscription.channelName}`}
              >
                <div className="font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                  {subscription.channelName}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-mono">
                  {subscription.channelId}
                </div>
              </button>
            ) : (
              <>
                <div className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {subscription.channelName}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-mono">
                  {subscription.channelId}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-2">
          {/* External Link */}
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 touch-manipulation hover:bg-blue-100 dark:hover:bg-blue-900"
            aria-label={`Open ${subscription.channelName} on YouTube`}
          >
            <a
              href={`https://www.youtube.com/channel/${subscription.channelId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            </a>
          </Button>

          {/* Remove Button */}
          {showRemoveButton && onRemove && (
            <Button
              onClick={handleRemove}
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
              aria-label={`Remove ${subscription.channelName} subscription`}
            >
              <X className="w-4 h-4 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

SubscriptionItem.displayName = 'SubscriptionItem';