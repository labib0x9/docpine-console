"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { PlaySquare, Filter, Search, RotateCcw } from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { RunTable } from "@/components/RunTable";
import { ApiError } from "@/components/ApiError";
import { api } from "@/lib/api";
import type { Lab, LabRun } from "@/lib/types";

export default function RunsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>("all");
  const [runs, setRuns] = useState<LabRun[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch labs
      const labsData = await api.getLabs();
      setLabs(labsData);

      // 2. Fetch runs depending on filter
      if (selectedLabId === "all") {
        if (labsData.length === 0) {
          setRuns([]);
        } else {
          const promises = labsData.map((lab) =>
            api.getLabRuns(lab.id).catch(() => [] as LabRun[])
          );
          const results = await Promise.all(promises);
          const combined = results.flat();
          combined.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setRuns(combined);
        }
      } else {
        const labId = Number(selectedLabId);
        const labRuns = await api.getLabRuns(labId);
        labRuns.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRuns(labRuns);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load runs"));
    } finally {
      setLoading(false);
    }
  }, [selectedLabId]);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const filteredRuns = useMemo(() => {
    if (!search.trim()) return runs;
    const q = search.toLowerCase();
    return runs.filter(
      (r) =>
        r.github_repo.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        String(r.id).includes(q)
    );
  }, [runs, search]);

  return (
    <ConsoleShell title="Run History">
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <PlaySquare className="w-5 h-5 text-emerald-400" />
              <span>Lab Execution Runs</span>
            </h2>
            <p className="mt-1 text-xs font-mono text-zinc-400">
              Audit log of all one-shot container execution attempts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lab filter selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <select
                value={selectedLabId}
                onChange={(e) => setSelectedLabId(e.target.value)}
                className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900 text-zinc-200">
                  All Labs ({labs.length})
                </option>
                {labs.map((lab) => (
                  <option
                    key={lab.id}
                    value={String(lab.id)}
                    className="bg-zinc-900 text-zinc-200"
                  >
                    Lab #{lab.id}: {lab.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by repo or status..."
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-colors"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadRuns}
              disabled={loading}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors shrink-0"
              title="Refresh runs"
            >
              <RotateCcw
                className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`}
              />
            </button>
          </div>
        </div>

        {error && <ApiError error={error} onRetry={loadRuns} />}

        {/* Runs Table */}
        <RunTable
          runs={filteredRuns}
          labs={labs}
          loading={loading}
          emptyMessage={
            search
              ? `No runs matched filter "${search}"`
              : "No lab execution runs found for the selected filter."
          }
        />
      </div>
    </ConsoleShell>
  );
}
