import { requireAdmin } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/shared/PageHeader";
import { BackupsClient } from "./BackupsClient";

export default async function BackupsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Backups"
        description="Create encrypted snapshots and restore full system state from uploaded backup files."
      />
      <BackupsClient />
    </div>
  );
}

