"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { Check, X, Inbox, Send } from "lucide-react";

interface FriendRequest {
  id: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
  friend: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
  };
  createdAt: string;
}

interface FriendRequestsProps {
  received: FriendRequest[];
  sent: FriendRequest[];
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export function FriendRequests({
  received,
  sent,
  onAccept,
  onDecline,
  onCancel,
}: FriendRequestsProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (
    requestId: string,
    action: "accept" | "decline" | "cancel"
  ) => {
    setProcessing(requestId);

    try {
      if (action === "accept" && onAccept) {
        await onAccept(requestId);
      } else if (action === "decline" && onDecline) {
        await onDecline(requestId);
      } else if (action === "cancel" && onCancel) {
        await onCancel(requestId);
      }
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  return (
    <Tabs defaultValue="received" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="received" className="flex items-center gap-2">
          <Inbox className="h-4 w-4" />
          Received
          {received.length > 0 && (
            <Badge variant="default" className="ml-1">
              {received.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Sent
          {sent.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {sent.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-3">
        {received.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No pending requests"
            description="You don&apos;t have any pending friend requests"
          />
        ) : (
          received.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    src={request.user.image}
                    alt={request.user.name || "User"}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {request.user.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(request.id, "accept")}
                      disabled={processing === request.id}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(request.id, "decline")}
                      disabled={processing === request.id}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-3">
        {sent.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No pending requests"
            description="You haven&apos;t sent any friend requests"
          />
        ) : (
          sent.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    src={request.friend.image}
                    alt={request.friend.name || "User"}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium">
                      {request.friend.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.friend.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatDate(request.createdAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(request.id, "cancel")}
                    disabled={processing === request.id}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}
