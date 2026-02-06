"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, BellOff, Loader2, RefreshCw, Smartphone, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { urlBase64ToUint8Array } from "@/lib/utils/push";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

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
    if (typeof window === "undefined") return;
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
    } catch (e) { console.error("[push] Status failed", e); }
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw-push.js").finally(() => void loadStatus());
  }, [loadStatus]);

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) {
      toast({ title: "Push not configured", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PermissionState);
      if (permissionResult !== "granted") {
        toast({ title: "Permission required", variant: "destructive" });
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const endpoint = existing.endpoint;
        await existing.unsubscribe().catch(() => undefined);
        await fetch("/api/notifications/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) }).catch(() => undefined);
      }
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
      });
      await fetch("/api/notifications/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newSubscription.toJSON(), deviceType: detectDeviceType(navigator.userAgent) }),
      });
      void fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pushOptIn: true }) });
      setIsSubscribed(true);
      toast({ title: "Push enabled", description: "Real-time transmissions active." });
    } catch (e: any) { toast({ title: "Subscription failed", variant: "destructive" }); }
    finally { setIsLoading(false); }
  }, [toast, vapidPublicKey]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch("/api/notifications/subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
      }
      void fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pushOptIn: false }) });
      setIsSubscribed(false);
      toast({ title: "Push disabled", description: "Transmissions severed." });
    } catch (e: any) { toast({ title: "Unsubscribe failed", variant: "destructive" }); }
    finally { setIsLoading(false); }
  }, [toast]);

  if (!isSupported) {
    return (
      <div className="rounded-3xl glass border border-red-500/20 p-6 text-center space-y-4">
        <BellOff className="h-10 w-10 mx-auto text-red-400 opacity-40" />
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-tight text-red-400">HARDWARE INCOMPATIBLE</h3>
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">BROWSER DOES NOT SUPPORT DIRECT TRANSMISSIONS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 glass-elevated border border-white/5 transition-all group-hover:bg-white/5 group-hover:border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={cn(
              "h-16 w-16 rounded-3xl glass border flex items-center justify-center transition-all duration-500 shadow-glass",
              isSubscribed ? "border-primary/40 text-primary shadow-neon-cyan/20" : "border-white/10 text-muted-foreground/40"
            )}>
              {isSubscribed ? <Bell className="h-8 w-8 animate-pulse" /> : <BellOff className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-black uppercase tracking-tighter">Direct Transmissions</h2>
                <Badge variant={isSubscribed ? "neon" : "glass"} className="text-[8px] tracking-widest uppercase px-2 py-0">
                  {isSubscribed ? "SYNCED" : "OFFLINE"}
                </Badge>
              </div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60 max-w-md">
                ENABLE LOW-LATENCY ALERTS FOR CHALLENGES, STREAKS, AND ACCREDITATIONS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={isSubscribed ? "glass" : "accent"}
              size="xl"
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading}
              className="rounded-2xl px-8 min-w-[180px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSubscribed ? "SEVER LINK" : "INITIALIZE SYNC"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void loadStatus()}
              disabled={isRefreshing || isLoading}
              className="h-14 w-14 rounded-2xl glass border border-white/5 hover:border-primary/20 hover:text-primary transition-all"
            >
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-[0.03]">
          <Smartphone className="h-32 w-32" />
        </div>
      </div>
    </div>
  );
}
