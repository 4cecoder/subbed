"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Subscription, FeedItem, UserSettings } from "@/lib/types";

interface AppContextType {
  // State
  subscriptions: Subscription[];
  selectedSubscriptionId: string | null;
  feed: FeedItem[];
  settings: UserSettings | null;
  isDark: boolean;

  // Loading states
  loading: {
    subscriptions: boolean;
    feed: boolean;
    settings: boolean;
  };

  // Error states
  errors: {
    subscriptions?: string;
    feed?: string;
    settings?: string;
    general?: string;
  };

  // Actions
  setSelectedSubscriptionId: (id: string | null) => void;
  toggleTheme: () => void;
  clearError: (key: keyof AppContextType['errors']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
  value: AppContextType;
}

export function AppProvider({ children, value }: AppProviderProps) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}