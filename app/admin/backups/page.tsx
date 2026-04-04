import { requireAdmin } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/shared/PageHeader";
import dynamic from "next/dynamic";

const BackupsClient = dynamic(
  () => import("./BackupsClient").then((mod) => mod.BackupsClient),
  {
    loading: () => (
      <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-8">
        <div className="h-6 w-32 rounded bg-white/10" />
      </div>
    ),
  }
);

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

