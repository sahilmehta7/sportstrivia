"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const DELETE_CONFIRMATION_TEXT = "DELETE";
const ANALYTICS_SOURCE = "profile_settings";

function isDeletionFlowEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ACCOUNT_DELETION_ENABLED === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function DeleteAccountSection({ className }: { className?: string }) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const enabled = isDeletionFlowEnabled();
  const canConfirmDelete = useMemo(
    () => confirmationText === DELETE_CONFIRMATION_TEXT && !isDeleting,
    [confirmationText, isDeleting]
  );

  if (!enabled) return null;

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setConfirmationText("");
      setIsDeleting(false);
      return;
    }
    trackEvent("account_delete_viewed", { source: ANALYTICS_SOURCE });
  };

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!canConfirmDelete) return;

    try {
      setIsDeleting(true);
      trackEvent("account_delete_confirmed", { source: ANALYTICS_SOURCE });

      const response = await fetch("/api/users/me", { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        const errorCode =
          typeof result?.code === "string" ? result.code : "UNKNOWN_ERROR";
        trackEvent("account_delete_failed", {
          source: ANALYTICS_SOURCE,
          error_code: errorCode,
        });
        throw new Error(result?.error || "Could not delete account");
      }

      trackEvent("account_delete_succeeded", { source: ANALYTICS_SOURCE });
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      await signOut({ callbackUrl: "/" });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete account. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const handleExportClick = () => {
    trackEvent("account_delete_export_clicked", { source: ANALYTICS_SOURCE });
  };

  return (
    <section
      className={cn(
        "rounded-[2.5rem] border border-destructive/30 bg-destructive/5 p-8 space-y-5",
        className
      )}
      aria-label="Danger Zone"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h5 className="text-xl font-black uppercase tracking-tight text-destructive">
          Danger Zone
        </h5>
      </div>

      <p className="text-sm text-muted-foreground">
        Deleting your account is irreversible. Your profile, attempts, reviews,
        friends/challenges, notifications, badges, and related data will be removed.
      </p>

      <AlertDialog open={isOpen} onOpenChange={handleDialogOpenChange}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="rounded-2xl uppercase tracking-wide">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes your account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <Link
              href="/api/users/me/export"
              onClick={handleExportClick}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <Download className="h-4 w-4" />
              Download my data first
            </Link>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Type <span className="font-semibold">{DELETE_CONFIRMATION_TEXT}</span> to confirm.
              </p>
              <Input
                placeholder="Type DELETE"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
