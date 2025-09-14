"use client";

import { useState, useEffect } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { FeedbackDialog } from "./feedback-dialog";
import { OnboardingDialog } from "./onboarding-dialog";
import { SettingsDialog } from "./settings-dialog";
import { SubscriptionManager } from "./subscription-manager";
import { ThemeToggleFancy } from "./theme-toggle";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { useConvexSettings } from "@/lib/hooks/use-convex-settings";
import { HelpCircle, Settings, Users } from "lucide-react";

export default function Header() {
  const { shouldShowOnboarding, markAsSeen } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subscriptionManagerOpen, setSubscriptionManagerOpen] = useState(false);
  const { settings, loading, error, updateSettings } = useConvexSettings();

  useEffect(() => {
    if (shouldShowOnboarding()) {
      setShowOnboarding(true);
    }
  }, [shouldShowOnboarding]);

  const handleOnboardingClose = (open: boolean) => {
    setShowOnboarding(open);
    if (!open) {
      markAsSeen();
    }
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-background border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Subbed</h1>
        <SignedIn>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOnboarding(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            Help
          </Button>
        </SignedIn>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggleFancy className="mr-2" />
        <SignedIn>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubscriptionManagerOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Users className="w-4 h-4 mr-1" />
            Manage
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <FeedbackDialog />
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </SignedOut>
      </div>

      <OnboardingDialog 
        open={showOnboarding} 
        onOpenChange={handleOnboardingClose}
      />
      
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={updateSettings}
        loading={loading}
        error={error}
      />

      <SubscriptionManager
        open={subscriptionManagerOpen}
        onOpenChange={setSubscriptionManagerOpen}
      />
    </header>
  );
}
