import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useConvexSubscriptions() {
  // Try to get authenticated subscriptions first
  const authSubscriptions = useQuery(api.subscriptions.getSubscriptions);

  // Fall back to dev subscriptions if no authenticated subscriptions are available
  const devSubscriptions = useQuery(api.dev_subscriptions.getDevSubscriptions);

  // Use authenticated subscriptions if available, otherwise fall back to dev subscriptions
  const subscriptions = authSubscriptions !== undefined
    ? authSubscriptions
    : devSubscriptions || [];

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
    console.log('clearSubscriptions hook called');
    try {
      console.log('Calling clearSubscriptionsMutation');
      await clearSubscriptionsMutation({});
      console.log('clearSubscriptionsMutation completed');
    } catch (error) {
      console.error('Error in clearSubscriptions hook:', error);
      throw error;
    }
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