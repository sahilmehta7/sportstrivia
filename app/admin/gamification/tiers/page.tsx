"use client";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/tiers");
      const data = await res.json();
      setTiers(data.tiers ?? []);
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

  async function saveAll() {
    setSaving(true);
    await fetch("/api/admin/tiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiers }),
    });
    setSaving(false);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tiers</h1>
        <div className="space-x-2">
          <button onClick={addTier} className="px-3 py-2 border rounded">Add Tier</button>
          <button onClick={saveAll} className="btn btn-primary px-3 py-2 border rounded" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

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
              <tr key={row.id ?? `new-${idx}`} className="border-t">
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
                    className="w-56 border rounded px-2 py-1"
                    value={row.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-24 border rounded px-2 py-1"
                    type="number"
                    value={row.startLevel}
                    onChange={(e) => updateRow(idx, { startLevel: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    className="w-24 border rounded px-2 py-1"
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


