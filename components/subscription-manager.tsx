'use client';

import React from 'react';
import { ImprovedSubscriptionManager } from './improved-subscription-manager';

interface SubscriptionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * @deprecated Use ImprovedSubscriptionManager instead. This component is kept for backward compatibility.
 */
export const SubscriptionManager: React.FC<SubscriptionManagerProps> = (props) => {
  return <ImprovedSubscriptionManager {...props} />;
};

// Re-export improved version as default
export { ImprovedSubscriptionManager };