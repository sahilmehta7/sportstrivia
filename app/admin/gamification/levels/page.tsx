"use client";
import { useEffect, useState } from "react";

type Level = { level: number; pointsRequired: number; isActive: boolean };

export default function LevelsAdminPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/admin/levels");
      const data = await res.json();
      setLevels(data.levels ?? []);
      setLoading(false);
    })();
  }, []);

  const updateRow = (idx: number, patch: Partial<Level>) => {
    setLevels((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  async function saveAll() {
    setSaving(true);
    await fetch("/api/admin/levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levels }),
    });
    setSaving(false);
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Levels</h1>
        <button onClick={saveAll} className="btn btn-primary px-3 py-2 border rounded" disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Level</th>
              <th className="p-2">Points Required</th>
              <th className="p-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((row, idx) => (
              <tr key={row.level} className="border-t">
                <td className="p-2 w-24">{row.level}</td>
                <td className="p-2">
                  <input
                    className="w-40 border rounded px-2 py-1"
                    type="number"
                    value={row.pointsRequired}
                    onChange={(e) => updateRow(idx, { pointsRequired: Number(e.target.value) })}
                  />
                </td>
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    onChange={(e) => updateRow(idx, { isActive: e.target.checked })}
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


