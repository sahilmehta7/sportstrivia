"use client";
import { useEffect, useMemo, useState } from "react";

type Tier = {
  id?: number;
  name: string;
  slug?: string;
  description?: string | null;
  startLevel: number;
  endLevel: number;
  color?: string | null;
  icon?: string | null;
  order: number;
};

export default function TiersAdminPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlapIndexes, setOverlapIndexes] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/tiers");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load tiers");
        const payload = json?.data ?? json;
        setTiers(payload.tiers ?? []);
      } catch (e: any) {
        setError(e.message || "Failed to load tiers");
      }
      setLoading(false);
    })();
  }, []);

  const updateRow = (idx: number, patch: Partial<Tier>) => {
    setTiers((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  function addTier() {
    const order = (tiers[tiers.length - 1]?.order ?? 0) + 1;
    setTiers((rows) => [
      ...rows,
      {
        name: "New Tier",
        slug: undefined,
        description: "",
        startLevel: 1,
        endLevel: 10,
        order,
      },
    ] as Tier[]);
  }

  const hasInvalidRanges = useMemo(() => {
    // Validate start <= end and non-overlapping ranges, collect bad row indexes
    const overlaps: Set<number> = new Set();
    let invalid = false;
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      if (t.startLevel > t.endLevel) {
        invalid = true;
        overlaps.add(i);
      }
    }
    const sortedWithIdx = tiers
      .map((t, i) => ({ ...t, __i: i }))
      .sort((a, b) => a.startLevel - b.startLevel);
    for (let i = 1; i < sortedWithIdx.length; i++) {
      if (sortedWithIdx[i].startLevel <= sortedWithIdx[i - 1].endLevel) {
        invalid = true;
        overlaps.add(sortedWithIdx[i].__i);
        overlaps.add(sortedWithIdx[i - 1].__i);
      }
    }
    setOverlapIndexes(overlaps);
    return invalid;
  }, [tiers]);

  async function deleteTier(id?: number) {
    if (!id) return; // new/unsaved row: remove locally
    if (!confirm("Delete this tier?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tiers/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to delete tier");
      setTiers((rows) => rows.filter((t) => t.id !== id));
    } catch (e: any) {
      setError(e.message || "Failed to delete tier");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    try {
      if (hasInvalidRanges) throw new Error("Fix overlapping/invalid level ranges before saving");
      if (!window.confirm("Are you sure you want to save all tier changes?")) {
        setSaving(false);
        return;
      }
      const res = await fetch("/api/admin/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save tiers");
    } catch (e: any) {
      setError(e.message || "Failed to save tiers");
    }
    setSaving(false);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tiers</h1>
        <div className="space-x-2">
          <button onClick={addTier} className="px-3 py-2 border rounded">Add Tier</button>
          <button onClick={saveAll} className="btn btn-primary px-3 py-2 border rounded" disabled={saving || hasInvalidRanges}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Order</th>
              <th className="p-2">Name</th>
              <th className="p-2">Start</th>
              <th className="p-2">End</th>
              <th className="p-2">Color</th>
              <th className="p-2">Icon</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((row, idx) => (
              <tr key={row.id ?? `new-${idx}`} className={`border-t ${overlapIndexes.has(idx) ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                <td className="p-2 w-24">
                  <input
                    className="w-20 border rounded px-2 py-1"
                    type="number"
                    value={row.order}
                    onChange={(e) => updateRow(idx, { order: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className={`w-56 border rounded px-2 py-1 ${overlapIndexes.has(idx) ? "border-red-500" : ""}`}
                    value={row.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className={`w-24 border rounded px-2 py-1 ${overlapIndexes.has(idx) ? "border-red-500" : ""}`}
                    type="number"
                    value={row.startLevel}
                    onChange={(e) => updateRow(idx, { startLevel: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className={`w-24 border rounded px-2 py-1 ${overlapIndexes.has(idx) ? "border-red-500" : ""}`}
                    type="number"
                    value={row.endLevel}
                    onChange={(e) => updateRow(idx, { endLevel: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-32 border rounded px-2 py-1"
                    placeholder="#hex or tailwind"
                    value={row.color ?? ""}
                    onChange={(e) => updateRow(idx, { color: e.target.value })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-32 border rounded px-2 py-1"
                    placeholder="icon name"
                    value={row.icon ?? ""}
                    onChange={(e) => updateRow(idx, { icon: e.target.value })}
                  />
                </td>
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => deleteTier(row.id)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


