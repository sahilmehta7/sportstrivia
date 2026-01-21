"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { PushSubscriptionCard } from "@/components/notifications/PushSubscriptionCard";
import { DigestPreferencesCard } from "@/components/notifications/DigestPreferencesCard";
import {
  Bell,
  BellOff,
  Check,
  UserPlus,
  Award,
  Swords,
  Trash2,
  Activity,
  Zap,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50");
      const result = await response.json();
      if (response.ok) {
        setNotifications(result.data.notifications || []);
        setUnreadCount(result.data.unreadCount || 0);
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Transmission failure.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "PATCH" });
      setNotifications(notifications.map((n) => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast({ title: "Success", description: "All signals cleared." });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "FRIEND_REQUEST":
      case "FRIEND_ACCEPTED":
        return UserPlus;
      case "CHALLENGE_RECEIVED":
      case "CHALLENGE_ACCEPTED":
      case "CHALLENGE_COMPLETED":
        return Swords;
      case "BADGE_EARNED":
        return Award;
      default:
        return Bell;
    }
  };

  const parseContent = (content: string) => {
    try { return JSON.parse(content); } catch { return {}; }
  };

  const getNotificationLink = (notification: Notification) => {
    const data = parseContent(notification.content);
    switch (notification.type) {
      case "FRIEND_REQUEST": return "/friends?tab=requests";
      case "CHALLENGE_RECEIVED":
      case "CHALLENGE_ACCEPTED": return data.challengeId ? `/challenges/${data.challengeId}` : "/friends";
      case "BADGE_EARNED": return "/profile/me";
      default: return null;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "JUST NOW";
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;
    if (diffDays < 7) return `${diffDays}D AGO`;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d).toUpperCase();
  };

  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">
          {circle1}
          {circle2}
          {circle3}
        </div>

        <PageContainer className="max-w-4xl space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter", getGradientText("neon"))}>
                  TRANSMISSIONS
                </h1>
              </div>
              <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase lg:pl-5">
                CENTRAL FEED • SYSTEM SIGNALS & UPDATES
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="neon" size="lg" onClick={markAllAsRead} className="rounded-full px-8">
                <Check className="mr-2 h-5 w-5" />
                CLEAR SIGNALS
              </Button>
            )}
          </div>

          <div className="grid gap-8">
            <PushSubscriptionCard />
            <DigestPreferencesCard />
          </div>

          <div className="space-y-8 pt-8">
            <div className="flex items-center gap-4">
              <div className="h-4 w-1 rounded-full bg-secondary shadow-neon-magenta" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Transmission History</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="relative">
                  <LoadingSpinner />
                  <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-24 text-center space-y-6 rounded-[3rem] glass border border-dashed border-white/10">
                <div className="h-16 w-16 mx-auto rounded-full glass border border-white/5 flex items-center justify-center text-muted-foreground/20">
                  <BellOff className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">NO SIGNALS DETECTED</p>
                  <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest px-4">YOUR FREQUENCY IS CURRENTLY CLEAR OF EXTERNAL DATA</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const link = getNotificationLink(notification);
                  const content = parseContent(notification.content);
                  const Wrapper = link ? Link : "div";

                  return (
                    <div key={notification.id} className="relative group">
                      <div className={cn(
                        "relative overflow-hidden rounded-2xl glass transition-all duration-300 group-hover:bg-white/5 border",
                        notification.read ? "border-white/5 opacity-40 grayscale" : "border-white/10 shadow-glass"
                      )}>
                        <Wrapper href={link || ""} className={cn("p-4 block", link && "cursor-pointer")}>
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "h-12 w-12 rounded-xl glass border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                              notification.read ? "border-white/5 text-muted-foreground" : "border-primary/20 text-primary shadow-neon-cyan/10"
                            )}>
                              <Icon className="h-6 w-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                                {content.title || "UNIDENTIFIED DATA"}
                              </h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{formatDate(notification.createdAt)}</span>
                                {!notification.read && <Badge variant="neon" className="px-1.5 py-0 text-[7px] tracking-widest uppercase h-4">NEW SIGNAL</Badge>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <Button
                                  variant="glass"
                                  size="icon"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notification.id); }}
                                  className="h-9 w-9 rounded-lg"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteNotification(notification.id); }}
                                className="h-9 w-9 rounded-lg hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Wrapper>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>

        {/* Tactical decor */}
        <div className="absolute -bottom-20 -left-20 pointer-events-none opacity-[0.02]">
          <Activity className="h-[400px] w-[400px]" />
        </div>
      </main>
    </ShowcaseThemeProvider>
  );
}
