"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWALifecycleListener() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Handle "Before Install Prompt" (Custom Install Button Support)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      
      // Optionally broadcast this event to other components via a custom event
      window.dispatchEvent(new CustomEvent("pwa-installavailable", { detail: e }));
    };

    // 2. Handle Service Worker Updates
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New update available!
                toast({
                  title: "Update Available",
                  description: "A new version of Sports Trivia is ready. Refresh to update.",
                  action: (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reload
                    </Button>
                  ),
                  duration: 10000,
                });
              }
            };
          }
        };
      });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [toast]);

  return null; // This is a logic-only component
}
