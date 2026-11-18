"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FlaskConical, Search, RotateCcw } from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { LabCard } from "@/components/LabCard";
import { ApiError } from "@/components/ApiError";
import { api } from "@/lib/api";
import type { Lab } from "@/lib/types";

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getLabs();
      setLabs(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load labs"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLabs();
  }, [loadLabs]);

  const filteredLabs = useMemo(() => {
    if (!search.trim()) return labs;
    const q = search.toLowerCase();
    return labs.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        (Array.isArray(l.tests) && l.tests.some((t) => t.toLowerCase().includes(q)))
    );
  }, [labs, search]);

  return (
    <ConsoleShell title="Available Labs">
      <div className="space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <FlaskConical className="w-5 h-5 text-emerald-400" />
              <span>Seeded Labs</span>
            </h2>
            <p className="mt-1 text-xs font-mono text-zinc-400">
              Read-only laboratory specifications seeded by the system
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labs or commands..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
              />
            </div>

            <button
              onClick={loadLabs}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors shrink-0"
              title="Reload labs"
            >
              <RotateCcw
                className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && <ApiError error={error} onRetry={loadLabs} />}

        {/* Labs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-48 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : filteredLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center bg-zinc-900/20">
            <FlaskConical className="w-8 h-8 text-zinc-600 mb-3" />
            <p className="text-sm font-semibold text-zinc-300">
              {search ? "No labs matched your search" : "No labs found"}
            </p>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              {search
                ? `Try adjusting your search query "${search}"`
                : "No labs are currently seeded in the backend."}
            </p>
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}
