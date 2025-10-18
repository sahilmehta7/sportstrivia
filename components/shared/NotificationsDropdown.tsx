"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  UserPlus,
  Award,
  Swords,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsDropdownProps {
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationsDropdown({
  unreadCount,
  onUnreadCountChange,
}: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!open) return;

    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=10");
      const result = await response.json();

      if (response.ok) {
        setNotifications(result.data.notifications || []);
        onUnreadCountChange(result.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [open, onUnreadCountChange]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });

      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      onUnreadCountChange(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      });

      const wasUnread = notifications.find((n) => n.id === notificationId)?.read === false;
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      
      if (wasUnread) {
        onUnreadCountChange(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const markAllAsRead = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      onUnreadCountChange(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
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
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const data = parseContent(notification.content);

    switch (notification.type) {
      case "FRIEND_REQUEST":
        return "/friends?tab=requests";
      case "CHALLENGE_RECEIVED":
      case "CHALLENGE_ACCEPTED":
        return data.challengeId ? `/challenges/${data.challengeId}` : "/friends";
      case "BADGE_EARNED":
        return "/profile/me";
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-2 h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const link = getNotificationLink(notification);
                const content = parseContent(notification.content);

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group relative transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5"
                    )}
                  >
                    {link ? (
                      <Link
                        href={link}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id, {} as React.MouseEvent);
                          }
                          setOpen(false);
                        }}
                        className="block"
                      >
                        <NotificationItem
                          notification={notification}
                          content={content}
                          Icon={Icon}
                          formatDate={formatDate}
                        />
                      </Link>
                    ) : (
                      <NotificationItem
                        notification={notification}
                        content={content}
                        Icon={Icon}
                        formatDate={formatDate}
                      />
                    )}

                    {/* Action Buttons */}
                    <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => markAsRead(notification.id, e)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={(e) => deleteNotification(notification.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="my-0" />
            <div className="p-2">
              <Link href="/notifications" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-center gap-2">
                  See All Notifications
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Separate component for notification item to avoid duplication
function NotificationItem({
  notification,
  content,
  Icon,
  formatDate,
}: {
  notification: Notification;
  content: any;
  Icon: any;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 pr-20">
      <div
        className={cn(
          "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          notification.read ? "bg-muted" : "bg-primary/10"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            notification.read ? "text-muted-foreground" : "text-primary"
          )}
        />
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm", !notification.read && "font-medium")}>
            {content.title || "Notification"}
          </p>
          {!notification.read && (
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {content.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {content.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatDate(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}

