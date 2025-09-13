"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Plus, 
  RefreshCw, 
  Search, 
  Settings, 
  Video, 
  Heart, 
  Zap,
  Shield,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEATURES = [
  {
    icon: Plus,
    title: "Add Subscriptions",
    description: "Paste YouTube channel URLs, handles (@name), or channel IDs. Your data stays private and local.",
    color: "bg-blue-500",
    badge: "Easy Setup"
  },
  {
    icon: RefreshCw,
    title: "Refresh Feeds",
    description: "Load recent videos from all subscriptions with one click. Refresh individual channels as needed.",
    color: "bg-green-500",
    badge: "Real-time"
  },
  {
    icon: Search,
    title: "Search & Filter",
    description: "Find specific videos instantly. Customize display options for thumbnails and descriptions.",
    color: "bg-purple-500",
    badge: "Powerful"
  },
  {
    icon: Settings,
    title: "Customize Experience",
    description: "Adjust feed limits, content types, and performance settings. Toggle dark mode for comfort.",
    color: "bg-orange-500",
    badge: "Flexible"
  }
];

const BENEFITS = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data never leaves your browser. No tracking, no ads, no compromises."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance with smart caching and efficient data handling."
  },
  {
    icon: Heart,
    title: "Open Source",
    description: "Built with love by the community. Contribute and help us improve."
  }
];

export const OnboardingDialog: React.FC<OnboardingDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 2;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="relative">
              <Video className="w-8 h-8 text-red-500" />
              <Sparkles className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                Welcome to Subbed!
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                Your personal YouTube subscription manager
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="space-y-8">
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">What is Subbed?</h2>
                <p className="text-muted-foreground">
                  A clean, fast, and privacy-focused way to manage your YouTube subscriptions 
                  without the clutter of the official platform.
                </p>
              </div>

              <div className="grid gap-6">
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                      <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{feature.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {feature.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Why Choose Subbed?</h2>
                <p className="text-muted-foreground">
                  Built with your privacy and experience in mind
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {BENEFITS.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={index} className="text-center p-4 rounded-lg border bg-card">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-lg mb-2">Ready to get started?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first YouTube subscription and see the difference!
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Play className="w-4 h-4" />
                  <span>No YouTube account required</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between pt-6">
          <div className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button onClick={currentStep === totalSteps - 1 ? handleComplete : handleNext}>
              {currentStep === totalSteps - 1 ? (
                <>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};