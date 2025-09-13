import { useQuery, useMutation } from "convex/react";
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

  // Mutations
  const addSubscriptionMutation = useMutation(api.subscriptions.addSubscription);
  const removeSubscriptionMutation = useMutation(api.subscriptions.removeSubscription);
  const clearSubscriptionsMutation = useMutation(api.subscriptions.clearSubscriptions);

  const addSubscription = async (channelId: string, channelName: string, channelLogoUrl: string, channelUrl: string) => {
    await addSubscriptionMutation({ channelId, channelName, channelLogoUrl, channelUrl });
  };

  const removeSubscription = async (channelId: string) => {
    await removeSubscriptionMutation({ channelId });
  };

  const clearSubscriptions = async () => {
    await clearSubscriptionsMutation({});
  };

  const refreshSubscriptions = async () => {
    // Convex will automatically refetch due to the useQuery hook
  };

  return {
    subscriptions: subscriptions || [],
    loading,
    error: null as string | null,
    addSubscription,
    removeSubscription,
    clearSubscriptions,
    refreshSubscriptions,
  };
}