'use client';

import { useState, useCallback, useMemo } from 'react';
import { useConvexSubscriptions } from './use-convex-subscriptions';
import { Doc } from '@/convex/_generated/dataModel';

export interface SubscriptionManagerState {
  addMode: boolean;
  inputValue: string;
  isResolving: boolean;
  resolveError: string | null;
  resolveSuccess: string | null;
  showClearConfirm: boolean;
  showRemoveConfirm: boolean;
  selectedForRemoval: Doc<'subscriptions'> | null;
  viewMode: 'simple' | 'advanced';
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'name';
  groupBy: 'none' | 'date' | 'alphabetical';
  expandedGroups: Set<string>;
}

export interface UseSubscriptionManagerReturn {
  // State
  state: SubscriptionManagerState;

  // Data
  subscriptions: Doc<'subscriptions'>[];
  loading: boolean;
  filteredAndSortedSubscriptions: Doc<'subscriptions'>[];
  groupedSubscriptions: Array<{
    title: string;
    subscriptions: Doc<'subscriptions'>[];
    isExpanded: boolean;
  }>;

  // Actions
  setAddMode: (addMode: boolean) => void;
  setInputValue: (value: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'name') => void;
  setGroupBy: (groupBy: 'none' | 'date' | 'alphabetical') => void;
  setViewMode: (viewMode: 'simple' | 'advanced') => void;
  toggleGroup: (groupTitle: string) => void;
  setShowClearConfirm: (show: boolean) => void;
  setShowRemoveConfirm: (show: boolean, subscription?: Doc<'subscriptions'>) => void;

  // Operations
  handleAddSubscription: () => Promise<void>;
  handleRemoveSubscription: (channelId: string) => Promise<void>;
  handleClearAll: () => Promise<void>;
  resetState: () => void;
}

export function useSubscriptionManager(): UseSubscriptionManagerReturn {
  const { subscriptions, loading, addSubscription, removeSubscription, clearSubscriptions } =
    useConvexSubscriptions();

  const [state, setState] = useState<SubscriptionManagerState>({
    addMode: false,
    inputValue: '',
    isResolving: false,
    resolveError: null,
    resolveSuccess: null,
    showClearConfirm: false,
    showRemoveConfirm: false,
    selectedForRemoval: null,
    viewMode: 'simple',
    searchQuery: '',
    sortBy: 'newest',
    groupBy: 'none',
    expandedGroups: new Set(['all']),
  });

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    const filtered = subscriptions.filter(sub => {
      if (!state.searchQuery) return true;
      const query = state.searchQuery.toLowerCase();
      return (
        sub.channelName?.toLowerCase().includes(query) ||
        sub.channelId.toLowerCase().includes(query)
      );
    });

    // Sort
    filtered.sort((a, b) => {
      switch (state.sortBy) {
        case 'newest':
          return new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime();
        case 'oldest':
          return new Date(a._creationTime).getTime() - new Date(b._creationTime).getTime();
        case 'name':
          return (a.channelName || a.channelId).localeCompare(b.channelName || b.channelId);
        default:
          return 0;
      }
    });

    return filtered;
  }, [subscriptions, state.searchQuery, state.sortBy]);

  // Group subscriptions
  const groupedSubscriptions = useMemo(() => {
    if (state.groupBy === 'none') {
      return [
        {
          title: 'All Subscriptions',
          subscriptions: filteredAndSortedSubscriptions,
          isExpanded: state.expandedGroups.has('all'),
        },
      ];
    }

    const groups: Array<{
      title: string;
      subscriptions: Doc<'subscriptions'>[];
      isExpanded: boolean;
    }> = [];

    if (state.groupBy === 'date') {
      const today = new Date();
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recent = filteredAndSortedSubscriptions.filter(
        sub => new Date(sub._creationTime) >= thisWeek
      );
      const thisMonthSubs = filteredAndSortedSubscriptions.filter(
        sub => new Date(sub._creationTime) >= thisMonth && new Date(sub._creationTime) < thisWeek
      );
      const older = filteredAndSortedSubscriptions.filter(
        sub => new Date(sub._creationTime) < thisMonth
      );

      if (recent.length > 0)
        groups.push({
          title: 'Recent (This Week)',
          subscriptions: recent,
          isExpanded: state.expandedGroups.has('recent'),
        });
      if (thisMonthSubs.length > 0)
        groups.push({
          title: 'This Month',
          subscriptions: thisMonthSubs,
          isExpanded: state.expandedGroups.has('this-month'),
        });
      if (older.length > 0)
        groups.push({
          title: 'Older',
          subscriptions: older,
          isExpanded: state.expandedGroups.has('older'),
        });
    } else if (state.groupBy === 'alphabetical') {
      const alphabetGroups: { [key: string]: Doc<'subscriptions'>[] } = {};

      filteredAndSortedSubscriptions.forEach(sub => {
        const firstLetter = (sub.channelName || sub.channelId).charAt(0).toUpperCase();
        if (!alphabetGroups[firstLetter]) {
          alphabetGroups[firstLetter] = [];
        }
        alphabetGroups[firstLetter].push(sub);
      });

      Object.keys(alphabetGroups)
        .sort()
        .forEach(letter => {
          groups.push({
            title: letter,
            subscriptions: alphabetGroups[letter],
            isExpanded: state.expandedGroups.has(letter),
          });
        });
    }

    return groups;
  }, [filteredAndSortedSubscriptions, state.groupBy, state.expandedGroups]);

  // Action handlers
  const setAddMode = useCallback((addMode: boolean) => {
    setState(prev => ({ ...prev, addMode }));
  }, []);

  const setInputValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, inputValue: value, resolveError: null, resolveSuccess: null }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const setSortBy = useCallback((sortBy: 'newest' | 'oldest' | 'name') => {
    setState(prev => ({ ...prev, sortBy }));
  }, []);

  const setGroupBy = useCallback((groupBy: 'none' | 'date' | 'alphabetical') => {
    setState(prev => ({ ...prev, groupBy }));
  }, []);

  const setViewMode = useCallback((viewMode: 'simple' | 'advanced') => {
    setState(prev => ({ ...prev, viewMode }));
  }, []);

  const toggleGroup = useCallback((groupTitle: string) => {
    setState(prev => {
      const newSet = new Set(prev.expandedGroups);
      if (newSet.has(groupTitle)) {
        newSet.delete(groupTitle);
      } else {
        newSet.add(groupTitle);
      }
      return { ...prev, expandedGroups: newSet };
    });
  }, []);

  const setShowClearConfirm = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showClearConfirm: show }));
  }, []);

  const setShowRemoveConfirm = useCallback((show: boolean, subscription?: Doc<'subscriptions'>) => {
    setState(prev => ({
      ...prev,
      showRemoveConfirm: show,
      selectedForRemoval: subscription || null,
    }));
  }, []);

  const handleAddSubscription = useCallback(async () => {
    if (!state.inputValue.trim()) return;

    setState(prev => ({
      ...prev,
      isResolving: true,
      resolveError: null,
      resolveSuccess: null,
    }));

    try {
      // Resolve channel info using the API
      const response = await fetch(
        `/api/resolve?url=${encodeURIComponent(state.inputValue.trim())}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve channel');
      }

      const { channelId, title } = data;

      // Check if already subscribed
      const existingSubscription = subscriptions.find(sub => sub.channelId === channelId);
      if (existingSubscription) {
        setState(prev => ({
          ...prev,
          isResolving: false,
          resolveError: `Already subscribed to ${existingSubscription.channelName}`,
        }));
        return;
      }

      // Add to ConvexDB
      await addSubscription(
        channelId,
        title || `Channel ${channelId.slice(-8)}`,
        `https://yt3.ggpht.com/ytc/default-${channelId}=s88-c-k-c0x00ffffff-no-rj`,
        `https://www.youtube.com/channel/${channelId}`
      );

      setState(prev => ({
        ...prev,
        isResolving: false,
        resolveSuccess: `Successfully added ${title || 'channel'}`,
        inputValue: '',
      }));

      // Auto-close success message
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          resolveSuccess: null,
          addMode: false,
        }));
      }, 2000);
    } catch (error) {
      console.error('Failed to add subscription:', error);
      setState(prev => ({
        ...prev,
        isResolving: false,
        resolveError: error instanceof Error ? error.message : 'Failed to add subscription',
      }));
    }
  }, [state.inputValue, subscriptions, addSubscription]);

  const handleRemoveSubscription = useCallback(
    async (channelId: string) => {
      try {
        await removeSubscription(channelId);
        setState(prev => ({
          ...prev,
          showRemoveConfirm: false,
          selectedForRemoval: null,
        }));
      } catch (error) {
        console.error('Failed to remove subscription:', error);
        setState(prev => ({
          ...prev,
          resolveError: error instanceof Error ? error.message : 'Failed to remove subscription',
        }));
      }
    },
    [removeSubscription]
  );

  const handleClearAll = useCallback(async () => {
    try {
      await clearSubscriptions();
      setState(prev => ({
        ...prev,
        showClearConfirm: false,
      }));
    } catch (error) {
      console.error('Failed to clear subscriptions:', error);
      setState(prev => ({
        ...prev,
        resolveError: error instanceof Error ? error.message : 'Failed to clear subscriptions',
      }));
    }
  }, [clearSubscriptions]);

  const resetState = useCallback(() => {
    setState({
      addMode: false,
      inputValue: '',
      isResolving: false,
      resolveError: null,
      resolveSuccess: null,
      showClearConfirm: false,
      showRemoveConfirm: false,
      selectedForRemoval: null,
      viewMode: 'simple',
      searchQuery: '',
      sortBy: 'newest',
      groupBy: 'none',
      expandedGroups: new Set(['all']),
    });
  }, []);

  return {
    state,
    subscriptions,
    loading,
    filteredAndSortedSubscriptions,
    groupedSubscriptions,
    setAddMode,
    setInputValue,
    setSearchQuery,
    setSortBy,
    setGroupBy,
    setViewMode,
    toggleGroup,
    setShowClearConfirm,
    setShowRemoveConfirm,
    handleAddSubscription,
    handleRemoveSubscription,
    handleClearAll,
    resetState,
  };
}
