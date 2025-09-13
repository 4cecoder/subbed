import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useConvexSubscriptions() {
  // Try to get authenticated subscriptions first
  const authSubscriptions = useQuery(api.subscriptions.getSubscriptions);
  
  // Fall back to dev subscriptions if no authenticated subscriptions are available
  const devSubscriptions = useQuery(api.dev_subscriptions.getDevSubscriptions);
  
  // Use dev subscriptions in development mode when no auth subscriptions exist
  const subscriptions = authSubscriptions && authSubscriptions.length > 0 
    ? authSubscriptions 
    : devSubscriptions;
  
  const loading = (authSubscriptions === undefined) && (devSubscriptions === undefined);
  
  return {
    subscriptions: subscriptions || [],
    loading,
    error: null,
  };
}