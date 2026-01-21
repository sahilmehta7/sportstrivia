"use client";

import { useState, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Send, Target, Sparkles } from "lucide-react";

interface AddFriendFormProps {
  onSuccess?: () => void;
}

export function AddFriendForm({ onSuccess }: AddFriendFormProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail: email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send friend request");
      toast({ title: "Success", description: "Friend request sent successfully" });
      setEmail("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-5 group-hover:opacity-10 transition-opacity rounded-[3rem]" />

      <div className="relative overflow-hidden rounded-[3rem] p-10 lg:p-14 glass-elevated border border-white/10">
        <div className="max-w-xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl glass border border-white/20 text-primary shadow-neon-cyan/20">
              <UserPlus className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-black uppercase tracking-tighter">Initiate Recruitment</h3>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">TRANSMIT REQUEST VIA DIGITAL IDENTIFIER</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">TARGET EMAIL FREQUENCY</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="IDENTIFIER@SECTOR.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-16 rounded-[1.5rem] glass border-white/10 pl-6 text-lg font-bold tracking-tight focus:border-primary/40 focus:ring-primary/20 placeholder:text-white/10 transition-all"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg glass border border-white/5 flex items-center justify-center opacity-20">
                  <Target className="h-4 w-4" />
                </div>
              </div>
            </div>

            <Button variant="neon" size="xl" type="submit" disabled={loading} className="w-full">
              <Send className="mr-3 h-5 w-5" />
              {loading ? "TRANSMITTING..." : "INITIALIZE SYNC"}
            </Button>
          </form>

          <div className="flex items-center justify-center gap-6 opacity-30 grayscale saturate-0 pointer-events-none">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
            <Sparkles className="h-4 w-4" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/5 blur-[100px]" />
      </div>
    </div>
  );
}
