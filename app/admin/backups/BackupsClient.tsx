"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";

type ValidationResponse = {
  valid: boolean;
  backupVersion?: string;
  createdAt?: string;
  rowCounts?: Record<string, number>;
  storageObjectCount?: number;
  warnings: string[];
  errors: string[];
};

type UploadSessionResponse = {
  uploadSessionId: string;
  bucket: string;
  objectPath: string;
  uploadToken: string;
  signedUploadUrl: string;
  expiresAt: string;
  maxBytes: number;
};

function getFileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function BackupsClient() {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [uploadSession, setUploadSession] = useState<UploadSessionResponse | null>(null);
  const [uploadedFileFingerprint, setUploadedFileFingerprint] = useState<string | null>(null);

  const totalRows = useMemo(() => {
    if (!validation?.rowCounts) return 0;
    return Object.values(validation.rowCounts).reduce((acc, value) => acc + value, 0);
  }, [validation]);
  const hasActiveUploadSession = useMemo(() => {
    return Boolean(uploadSession && new Date(uploadSession.expiresAt).getTime() > Date.now());
  }, [uploadSession]);
  const isValidatedSessionReady = Boolean(validation?.valid && hasActiveUploadSession);

  async function ensureUploadedBackup(): Promise<string> {
    if (hasActiveUploadSession && uploadSession) {
      if (!file) {
        return uploadSession.uploadSessionId;
      }
      const fileFingerprint = getFileFingerprint(file);
      if (uploadedFileFingerprint === fileFingerprint) {
        return uploadSession.uploadSessionId;
      }
    }

    if (!file) {
      throw new Error("Choose a backup file first.");
    }

    const fileFingerprint = getFileFingerprint(file);
    if (uploadSession && uploadedFileFingerprint === fileFingerprint && hasActiveUploadSession) {
      return uploadSession.uploadSessionId;
    }

    setUploading(true);
    try {
      const createSessionResponse = await fetch("/api/admin/backups/upload-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSizeBytes: file.size,
          contentType: file.type || "application/octet-stream",
        }),
      });

      const createSessionPayload = await createSessionResponse.json().catch(() => ({}));
      if (!createSessionResponse.ok) {
        throw new Error(createSessionPayload?.error || "Unable to create backup upload session");
      }

      const session = createSessionPayload?.data as UploadSessionResponse;
      if (!session?.uploadToken || !session?.bucket || !session?.objectPath) {
        throw new Error("Upload session response is missing required fields");
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase public credentials are not configured in this environment.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { error: uploadError } = await supabase.storage
        .from(session.bucket)
        .uploadToSignedUrl(session.objectPath, session.uploadToken, file, {
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Failed to upload backup file");
      }

      setUploadSession(session);
      setUploadedFileFingerprint(fileFingerprint);
      return session.uploadSessionId;
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateBackup() {
    setCreating(true);
    try {
      const response = await fetch("/api/admin/backups/create", {
        method: "POST",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create backup");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+?)"/);
      const filename = match?.[1] || `sportstrivia-backup-${Date.now()}.strbk`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast({
        title: "Backup ready",
        description: `Downloaded ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: error instanceof Error ? error.message : "Unable to create backup",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleValidate() {
    if (!file) {
      toast({
        title: "File required",
        description: "Choose a backup file before validating.",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    try {
      const uploadSessionId = await ensureUploadedBackup();
      const response = await fetch("/api/admin/backups/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadSessionId }),
      });
      let report: ValidationResponse;
      try {
        const result = await response.json();
        report = result.data as ValidationResponse;
      } catch {
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check the server logs.`);
      }

      setValidation(report);

      if (!response.ok || !report.valid) {
        toast({
          title: "Validation failed",
          description: report.errors?.[0] || "Backup file is invalid",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Validation passed",
        description: `Backup created at ${report.createdAt}`,
      });
    } catch (error) {
      toast({
        title: "Validation error",
        description: error instanceof Error ? error.message : "Unable to validate backup",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  }

  async function handleRestore() {
    if (!isValidatedSessionReady) {
      toast({
        title: "Validation required",
        description: "Validate a backup first, then restore the validated upload session.",
        variant: "destructive",
      });
      return;
    }

    setRestoring(true);
    try {
      const uploadSessionId = await ensureUploadedBackup();
      const response = await fetch("/api/admin/backups/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Restore-Confirmation": confirmation,
        },
        body: JSON.stringify({
          uploadSessionId,
          confirmation,
        }),
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check the server logs.`);
      }
      const report = result.data;

      if (!response.ok) {
        throw new Error(report?.errors?.[0] || report?.message || result.error || "Restore failed");
      }

      toast({
        title: "Restore enqueued",
        description: `Restore task started (${report?.taskId || "task pending"}). Track progress in Admin AI Tasks.`,
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: error instanceof Error ? error.message : "Unable to restore backup",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Backup</CardTitle>
          <CardDescription>
            Generate an encrypted full snapshot and download it locally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreateBackup} disabled={creating}>
            {creating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {creating ? "Creating Backup..." : "Create & Download Backup"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validate Backup</CardTitle>
          <CardDescription>Upload a local backup file and run integrity + compatibility checks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".strbk,application/octet-stream"
            onChange={(event) => {
              setFile(event.target.files?.[0] || null);
              setValidation(null);
              setUploadSession(null);
              setUploadedFileFingerprint(null);
            }}
          />
          <Button variant="outline" onClick={handleValidate} disabled={validating || uploading || !file}>
            {validating || uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : validating ? "Validating..." : "Validate Backup"}
          </Button>

          {validation && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <Badge variant={validation.valid ? "default" : "destructive"}>
                  {validation.valid ? "VALID" : "INVALID"}
                </Badge>
                {validation.backupVersion && <span className="text-sm">Version: {validation.backupVersion}</span>}
              </div>
              {validation.createdAt && <p className="text-sm">Created At: {validation.createdAt}</p>}
              {validation.valid && (
                <p className="text-sm">
                  Rows: {totalRows.toLocaleString()} • Storage Objects: {(validation.storageObjectCount ?? 0).toLocaleString()}
                </p>
              )}
              {validation.warnings?.length > 0 && (
                <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Warnings</AlertTitle>
                  <AlertDescription>{validation.warnings.join(" ")}</AlertDescription>
                </Alert>
              )}
              {validation.errors?.length > 0 && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription>{validation.errors.join(" ")}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore Backup</CardTitle>
          <CardDescription>
            Full replace restore. This overwrites current database content and reapplies backup storage objects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Destructive action</AlertTitle>
            <AlertDescription>
              Type <code>RESTORE DATABASE</code> to confirm.
            </AlertDescription>
          </Alert>
          <Input
            placeholder="RESTORE DATABASE"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <Button
            variant="destructive"
            disabled={restoring || uploading || !isValidatedSessionReady || confirmation !== "RESTORE DATABASE"}
            onClick={handleRestore}
          >
            {restoring || uploading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            {uploading ? "Uploading..." : restoring ? "Queueing Restore..." : "Restore Backup"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {isValidatedSessionReady
              ? "Validated backup is ready to restore."
              : "Validate a backup first to enable restore."}
          </p>
          <p className="text-xs text-muted-foreground">
            Download-only mode is enabled. Keep your latest 7 backups locally (manual retention).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
