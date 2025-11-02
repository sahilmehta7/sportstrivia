"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, RefreshCw } from "lucide-react";

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
  { value: "OFF", label: "Off", description: "No email digests" },
  { value: "DAILY", label: "Daily", description: "Summary every morning" },
  { value: "WEEKLY", label: "Weekly", description: "Summary every Monday" },
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

  const selectedOption = useMemo(
    () => digestOptions.find((option) => option.value === digestFrequency),
    [digestFrequency]
  );

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/preferences");
      const result: { data: PreferencesResponse } = await response.json();
      if (!response.ok) {
        throw new Error("Failed to load notification preferences");
      }
      const prefs = result.data.preferences;
      setDigestFrequency(prefs.digestFrequency);
      setEmailOptIn(prefs.emailOptIn);
      setPushOptIn(prefs.pushOptIn);
      setLastDigestAt(prefs.lastDigestAt ?? null);
    } catch (error) {
      console.error("[digest] Failed to load preferences", error);
      toast({
        title: "Unable to load preferences",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          digestFrequency,
          emailOptIn,
          pushOptIn,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save notification preferences");
      }

      toast({
        title: "Preferences saved",
        description: "Your digest settings have been updated.",
      });
    } catch (error) {
      console.error("[digest] Failed to save preferences", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const refreshLastSent = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPreferences();
      toast({
        title: "Preferences refreshed",
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadPreferences, toast]);

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Email digests</h2>
            <p className="text-sm text-muted-foreground">
              Get periodic summaries with challenges, streak reminders, and new badges.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshLastSent}
            disabled={refreshing || loading}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="digest-frequency">Delivery cadence</Label>
            <Select
              value={digestFrequency}
              onValueChange={(value: DigestFrequency) => setDigestFrequency(value)}
              disabled={loading}
            >
              <SelectTrigger id="digest-frequency">
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                {digestOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-opt-in" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email notifications
            </Label>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="text-sm text-muted-foreground">
                Keep email updates enabled to receive digests at the cadence above.
              </div>
              <Switch
                id="email-opt-in"
                checked={emailOptIn}
                onCheckedChange={setEmailOptIn}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-muted/60 p-4 text-sm">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-muted-foreground">Last digest sent</span>
            <span>
              {lastDigestAt
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(lastDigestAt))
                : "Not sent yet"}
            </span>
            {selectedOption && (
              <span className="text-xs text-muted-foreground">
                {selectedOption.description}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
