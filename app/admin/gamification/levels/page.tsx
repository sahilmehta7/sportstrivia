"use client";
import { useEffect, useMemo, useState } from "react";
import { pointsForLevel } from "@/lib/config/gamification";

type Level = { level: number; pointsRequired: number; isActive: boolean };

export default function LevelsAdminPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkStart, setBulkStart] = useState<number>(1);
  const [bulkEnd, setBulkEnd] = useState<number>(10);
  const [bulkMode, setBulkMode] = useState<"activate" | "deactivate">("activate");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/levels");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load levels");
        const payload = json?.data ?? json;
        setLevels(payload.levels ?? []);
      } catch (e: any) {
        setError(e.message || "Failed to load levels");
      }
      setLoading(false);
    })();
  }, []);

  const updateRow = (idx: number, patch: Partial<Level>) => {
    setLevels((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const isNonDecreasing = useMemo(() => {
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].pointsRequired < levels[i - 1].pointsRequired) return false;
    }
    return true;
  }, [levels]);

  const invalidIndexes = useMemo(() => {
    const bad: Set<number> = new Set();
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].pointsRequired < levels[i - 1].pointsRequired) {
        bad.add(i);
        bad.add(i - 1);
      }
    }
    return bad;
  }, [levels]);

  function roundNearest(value: number) {
    if (value >= 1000) return Math.round(value / 1000) * 1000;
    return Math.round(value / 100) * 100;
  }

  function resetToCurve() {
    setLevels((rows) =>
      rows.map((r) => ({ ...r, pointsRequired: pointsForLevel(r.level) }))
    );
  }

  async function saveAll() {
    setSaving(true);
    setError(null);
    try {
      if (!isNonDecreasing) throw new Error("Points must be non-decreasing by level");
      if (!window.confirm("Are you sure you want to save all level changes?")) {
        setSaving(false);
        return;
      }
      const res = await fetch("/api/admin/levels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levels }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save levels");
    } catch (e: any) {
      setError(e.message || "Failed to save levels");
    }
    setSaving(false);
  }

  function applyBulkActivation() {
    const start = Math.max(1, Math.min(bulkStart, levels.length));
    const end = Math.max(1, Math.min(bulkEnd, levels.length));
    const lo = Math.min(start, end);
    const hi = Math.max(start, end);
    setLevels((rows) =>
      rows.map((r) =>
        r.level >= lo && r.level <= hi ? { ...r, isActive: bulkMode === "activate" } : r
      )
    );
  }

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Levels</h1>
        <div className="flex items-center gap-2">
          <button onClick={resetToCurve} className="px-3 py-2 border rounded" disabled={saving}>
            Reset to Curve
          </button>
          <button onClick={saveAll} className="btn btn-primary px-3 py-2 border rounded" disabled={saving || !isNonDecreasing}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* Bulk activation controls */}
      <div className="flex flex-wrap items-end gap-2 border rounded p-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Start Level</label>
          <input
            className="w-28 border rounded px-2 py-1"
            type="number"
            value={bulkStart}
            min={1}
            max={levels.length}
            onChange={(e) => setBulkStart(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">End Level</label>
          <input
            className="w-28 border rounded px-2 py-1"
            type="number"
            value={bulkEnd}
            min={1}
            max={levels.length}
            onChange={(e) => setBulkEnd(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Action</label>
          <select
            className="h-9 border rounded px-2"
            value={bulkMode}
            onChange={(e) => setBulkMode(e.target.value as any)}
          >
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
          </select>
        </div>
        <button onClick={applyBulkActivation} className="px-3 py-2 border rounded">
          Apply
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Level</th>
              <th className="p-2">Points Required</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((row, idx) => (
              <tr key={row.level} className={`border-t ${invalidIndexes.has(idx) ? "bg-red-50 dark:bg-red-950/20" : ""}`}>
                <td className="p-2 w-24">{row.level}</td>
                <td className="p-2">
                  <input
                    className={`w-40 border rounded px-2 py-1 ${invalidIndexes.has(idx) ? "border-red-500" : ""}`}
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
                <td className="p-2">
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => updateRow(idx, { pointsRequired: pointsForLevel(row.level) })}
                    >
                      Use Curve
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => updateRow(idx, { pointsRequired: roundNearest(row.pointsRequired) })}
                    >
                      Round
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


