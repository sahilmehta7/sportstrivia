"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Check, X, Inbox, Send, Activity, ShieldAlert, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleAction = async (requestId: string, action: "accept" | "decline" | "cancel") => {
    setProcessing(requestId);
    try {
      if (action === "accept" && onAccept) await onAccept(requestId);
      else if (action === "decline" && onDecline) await onDecline(requestId);
      else if (action === "cancel" && onCancel) await onCancel(requestId);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(date));
  };

  return (
    <Tabs defaultValue="received" className="space-y-8">
      <div className="flex justify-center">
        <TabsList className="h-auto p-1.5 rounded-2xl glass border border-white/10 shadow-glass">
          <TabsTrigger value="received" className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Inbox className="h-3.5 w-3.5 mr-2" />
            Incoming
            {received.length > 0 && (
              <span className="ml-2 bg-secondary text-white px-1.5 rounded-full text-[8px] animate-pulse">
                {received.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-xl px-6 py-2.5 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Send className="h-3.5 w-3.5 mr-2" />
            Outbound
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="received" className="space-y-4">
        {received.length === 0 ? (
          <EmptyRequests icon={Inbox} title="NO INCOMING SIGNALS" desc="YOUR FREQUENCY IS CURRENTLY CLEAR" />
        ) : (
          received.map((request) => (
            <RequestItem
              key={request.id}
              user={request.user}
              date={formatDate(request.createdAt)}
              isProcessing={processing === request.id}
              onAccept={() => handleAction(request.id, "accept")}
              onDecline={() => handleAction(request.id, "decline")}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-4">
        {sent.length === 0 ? (
          <EmptyRequests icon={Send} title="NO ACTIVE PINGS" desc="INITIATE A LINK TO SYNC WITH OTHERS" />
        ) : (
          sent.map((request) => (
            <RequestItem
              key={request.id}
              user={request.friend}
              date={`Sent ${formatDate(request.createdAt)}`}
              isProcessing={processing === request.id}
              onCancel={() => handleAction(request.id, "cancel")}
              isSent
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
}

function RequestItem({ user, date, isProcessing, onAccept, onDecline, onCancel, isSent }: any) {
  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-[2rem] p-5 glass-elevated border border-white/5 transition-all group-hover:bg-white/5 group-hover:border-white/10">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="p-1 rounded-2xl glass border border-white/10">
            <UserAvatar src={user.image} alt={user.name || "User"} size="md" className="h-14 w-14 rounded-xl" />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h4 className="font-black uppercase tracking-tight truncate">{user.name || "UNIDENTIFIED"}</h4>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 opacity-60">
              <p className="text-[10px] font-bold tracking-widest uppercase">{user.email}</p>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary">{date}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            {isSent ? (
              <Button variant="glass" size="sm" onClick={onCancel} disabled={isProcessing} className="flex-1 sm:flex-none h-11 rounded-xl uppercase font-black text-[10px] tracking-widest text-muted-foreground hover:text-red-400">
                <X className="mr-2 h-3.5 w-3.5" />
                ABORT
              </Button>
            ) : (
              <>
                <Button variant="neon" size="sm" onClick={onAccept} disabled={isProcessing} className="flex-1 sm:flex-none h-11 rounded-xl uppercase font-black text-[10px] tracking-widest">
                  <Check className="mr-2 h-4 w-4" />
                  SYNC
                </Button>
                <Button variant="glass" size="sm" onClick={onDecline} disabled={isProcessing} className="flex-1 sm:flex-none h-11 rounded-xl uppercase font-black text-[10px] tracking-widest text-muted-foreground hover:text-red-400">
                  <X className="mr-2 h-3.5 w-3.5" />
                  REJECT
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyRequests({ icon: Icon, title, desc }: any) {
  return (
    <div className="py-20 text-center space-y-4 rounded-[2.5rem] glass border border-dashed border-white/5">
      <Icon className="h-10 w-10 mx-auto text-muted-foreground/10" />
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">{title}</p>
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/20 uppercase">{desc}</p>
      </div>
    </div>
  );
}
