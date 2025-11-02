"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { urlBase64ToUint8Array } from "@/lib/utils/push";

type PermissionState = "default" | "denied" | "granted" | "unsupported";

function detectDeviceType(userAgent: string): string | undefined {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/windows/i.test(userAgent)) return "windows";
  if (/macintosh|mac os x/i.test(userAgent)) return "macos";
  return undefined;
}

export function PushSubscriptionCard() {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const vapidPublicKey = useMemo(
    () => process.env.NEXT_PUBLIC_PUSH_PUBLIC_KEY ?? "",
    []
  );

  const loadStatus = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setIsSupported(false);
      setPermission("unsupported");
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission as PermissionState);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch (error) {
      console.error("[push] Failed to load subscription status", error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw-push.js")
      .catch((error) => {
        if (!cancelled) {
          console.error("[push] Service worker registration failed", error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          void loadStatus();
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadStatus]);

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) {
      toast({
        title: "Push not configured",
        description:
          "Push notifications are not available yet. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PermissionState);

      if (permissionResult !== "granted") {
        toast({
          title: "Permission required",
          description:
            "Enable notifications in your browser settings to receive alerts.",
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe().catch(() => undefined);
        await fetch("/api/notifications/subscriptions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint }),
        }).catch(() => undefined);
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const body = newSubscription.toJSON();
      await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...body,
          deviceType: detectDeviceType(navigator.userAgent),
        }),
      });
      void fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushOptIn: true }),
      });

      setIsSubscribed(true);
      toast({
        title: "Push enabled",
        description: "You'll now receive challenge and streak notifications.",
      });
    } catch (error) {
      console.error("[push] Failed to subscribe", error);
      toast({
        title: "Subscription failed",
        description:
          error instanceof Error ? error.message : "Unable to enable push notifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe().catch(() => undefined);
      await fetch("/api/notifications/subscriptions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint }),
      });
      void fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pushOptIn: false }),
      });

      setIsSubscribed(false);
      toast({
        title: "Push disabled",
        description: "You won't receive push notifications until you re-enable them.",
      });
    } catch (error) {
      console.error("[push] Failed to unsubscribe", error);
      toast({
        title: "Unsubscribe failed",
        description:
          error instanceof Error ? error.message : "Unable to disable push notifications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadStatus();
      toast({
        title: "Status refreshed",
        description: "Push notification status updated.",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadStatus, toast]);

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Push notifications not supported</AlertTitle>
        <AlertDescription>
          Your browser does not support web push notifications. You can still use email
          digests to stay informed.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Push notifications</h2>
            <p className="text-sm text-muted-foreground">
              Receive real-time alerts for new challenges, streak updates, and badges.
            </p>
          </div>
          <Badge variant={isSubscribed ? "default" : "outline"}>
            {permission === "denied" ? "Permission blocked" : isSubscribed ? "Subscribed" : "Not subscribed"}
          </Badge>
        </div>

        {permission === "denied" ? (
          <Alert>
            <AlertTitle>Notifications blocked</AlertTitle>
            <AlertDescription>
              Enable notifications in your browser settings, then click “Refresh status”.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubscribed ? (
                <>
                  <BellOff className="mr-2 h-4 w-4" />
                  Disable push
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable push
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={refreshStatus}
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh status
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Push notifications require browser support and an active internet connection. You
          can unsubscribe at any time from this page or via your browser settings.
        </p>
      </CardContent>
    </Card>
  );
}
