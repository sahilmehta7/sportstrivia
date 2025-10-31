import Link from "next/link";
import { prisma } from "@/lib/db";
import { LEVELS_MAX, pointsForLevel } from "@/lib/config/gamification";

async function getPreview(limit: number = LEVELS_MAX) {
  try {
    const overrides = await prisma.level.findMany({ orderBy: { level: "asc" } });
    const mapOverride = new Map(overrides.map((l) => [l.level, l.pointsRequired]));
    const rows = Array.from({ length: Math.min(limit, LEVELS_MAX) }, (_, i) => {
      const level = i + 1;
      const curve = pointsForLevel(level);
      const override = mapOverride.get(level) ?? null;
      const effective = override ?? curve;
      return { level, curve, override, effective };
    });
    return rows;
  } catch (error) {
    console.error("Error getting preview:", error);
    return [];
  }
}

export default async function GamificationAdminPage() {
  const preview = await getPreview(50);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gamification</h1>
        <p className="text-sm text-muted-foreground">Manage levels, tiers and backfills</p>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/admin/gamification/users" className="border rounded p-4 hover:bg-accent">
          <div className="font-medium">User Progress</div>
          <div className="text-sm text-muted-foreground">View user levels and tiers</div>
        </Link>
        <Link href="/admin/gamification/levels" className="border rounded p-4 hover:bg-accent">
          <div className="font-medium">Levels</div>
          <div className="text-sm text-muted-foreground">Edit points required per level</div>
        </Link>
        <Link href="/admin/gamification/tiers" className="border rounded p-4 hover:bg-accent">
          <div className="font-medium">Tiers</div>
          <div className="text-sm text-muted-foreground">Manage sports-themed tier bands</div>
        </Link>
        <form action="/api/admin/gamification/recompute" method="post" className="border rounded p-4">
          <div className="font-medium mb-2">Recompute Progress</div>
          <p className="text-sm text-muted-foreground mb-3">Backfill levels/tiers from current points.</p>
          <button className="btn btn-primary px-3 py-2 border rounded" type="submit">Run</button>
        </form>
      </div>
      <div className="border rounded p-4">
        <div className="font-medium mb-2">Curve Preview</div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Level</th>
                <th className="p-2">Curve</th>
                <th className="p-2">Override</th>
                <th className="p-2">Effective</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row) => (
                <tr key={row.level} className="border-t">
                  <td className="p-2">{row.level}</td>
                  <td className="p-2">{row.curve}</td>
                  <td className="p-2">{row.override ?? "-"}</td>
                  <td className="p-2 font-medium">{row.effective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


