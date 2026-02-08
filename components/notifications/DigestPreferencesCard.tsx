"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, RefreshCw, Calendar, Clock, Database } from "lucide-react";
import { cn } from "@/lib/utils";

type DigestFrequency = "OFF" | "DAILY" | "WEEKLY";

interface PreferencesResponse {
  preferences: {
    digestFrequency: DigestFrequency;
    digestTimeOfDay: number;
    digestTimeZone: string | null;
    emailOptIn: boolean;
    pushOptIn: boolean;
    lastDigestAt?: string | null;
  };
}

const digestOptions: Array<{ value: DigestFrequency; label: string; description: string }> = [
  { value: "OFF", label: "OFFLINE", description: "Zero outbound logs" },
  { value: "DAILY", label: "SOLAR CYCLE", description: "Full report every 24h" },
  { value: "WEEKLY", label: "ORBITAL CYCLE", description: "Full report every 7d" },
];

export function DigestPreferencesCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [digestFrequency, setDigestFrequency] = useState<DigestFrequency>("OFF");
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [pushOptIn, setPushOptIn] = useState(true);
  const [lastDigestAt, setLastDigestAt] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/preferences");
      const result = await response.json();
      if (!response.ok) throw new Error("Load failed");
      const prefs = result.data.preferences;
      setDigestFrequency(prefs.digestFrequency);
      setEmailOptIn(prefs.emailOptIn);
      setPushOptIn(prefs.pushOptIn);
      setLastDigestAt(prefs.lastDigestAt ?? null);
    } catch (e) { console.error("[digest] Load failed", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadPreferences(); }, [loadPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ digestFrequency, emailOptIn, pushOptIn }),
      });
      if (!response.ok) throw new Error("Save failed");
      toast({ title: "Preferences saved", description: "Protocol updated successfully." });
    } catch (e) {
      toast({ title: "Save failed", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="relative group">
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 lg:p-10 glass-elevated border border-white/5 transition-all group-hover:bg-white/5 group-hover:border-white/10">
        <div className="flex flex-col lg:flex-row justify-between gap-12">
          <div className="flex-1 space-y-10">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Protocol Archival</h2>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase opacity-60">
                  CONFIGURE PERIODIC MISSION SUMMARIES AND DATA LOGS
                </p>
              </div>
              <Button
                variant="glass"
                size="icon"
                onClick={() => void loadPreferences()}
                disabled={refreshing || loading}
                className="h-10 w-10 rounded-xl glass border border-white/5"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
            </div>

            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <Label htmlFor="digest-frequency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">DELIVERY CADENCE</Label>
                <Select
                  value={digestFrequency}
                  onValueChange={(value: DigestFrequency) => setDigestFrequency(value)}
                  disabled={loading}
                >
                  <SelectTrigger id="digest-frequency" className="h-14 rounded-2xl glass border-white/10 px-6 font-bold tracking-widest uppercase">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    {digestOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 rounded-xl m-1 px-4 cursor-pointer">
                        <div className="flex flex-col py-1">
                          <span className="font-black text-[10px] tracking-[0.2em]">{option.label}</span>
                          <span className="text-[8px] font-bold tracking-widest text-muted-foreground uppercase">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-2">REDUNDANT SIGNALS</Label>
                <div className="flex items-center justify-between rounded-2xl glass border border-white/5 p-4 h-14">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black tracking-widest uppercase">EMAIL LOGS</span>
                  </div>
                  <Switch
                    checked={emailOptIn}
                    onCheckedChange={setEmailOptIn}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
              <div className="flex items-center gap-8">
                <div className="space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">LAST TRANSMISSION</div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-primary">
                    {lastDigestAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(lastDigestAt)) : "SIGNAL NOT DETECTED"}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/5 hidden sm:block" />
                <div className="hidden sm:block space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">LINK SECURITY</div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-emerald-400">ENCRYPTED</div>
                </div>
              </div>

              <Button variant="accent" size="lg" onClick={savePreferences} disabled={saving || loading} className="w-full sm:w-auto px-10 rounded-2xl">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                SYNC PROTOCOL
              </Button>
            </div>
          </div>
        </div>

        {/* Background elements */}
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-[100px]" />
      </div>
    </div>
  );
}
