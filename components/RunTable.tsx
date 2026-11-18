"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Clock, ArrowRight, PlaySquare } from "lucide-react";
import type { LabRun, Lab } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatRelativeTime, formatDuration } from "@/lib/format";

interface RunTableProps {
  runs: LabRun[];
  labs?: Lab[];
  loading?: boolean;
  emptyMessage?: string;
}

export function RunTable({
  runs,
  labs = [],
  loading = false,
  emptyMessage = "No runs recorded yet.",
}: RunTableProps) {
  const router = useRouter();

  const labMap = new Map<number, string>();
  labs.forEach((l) => labMap.set(l.id, l.name));

  if (loading) {
    return (
      <div className="w-full border border-zinc-800 rounded-xl bg-zinc-900/40 overflow-hidden divide-y divide-zinc-800/80">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-5 bg-zinc-800 rounded" />
              <div className="w-20 h-5 bg-zinc-800 rounded-full" />
              <div className="w-36 h-5 bg-zinc-800 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-4 bg-zinc-800 rounded" />
              <div className="w-16 h-4 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="w-full border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center text-zinc-500 mb-3">
          <PlaySquare className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-200">No Runs Found</h4>
        <p className="text-xs font-mono text-zinc-500 mt-1 max-w-sm">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full border border-zinc-800/80 rounded-xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Run</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Lab</th>
              <th className="py-3 px-4">Repository</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {runs.map((run) => {
              const labName = labMap.get(run.lab_id) || `Lab #${run.lab_id}`;
              const duration = formatDuration(run.started_at, run.finished_at);

              return (
                <tr
                  key={run.id}
                  onClick={() =>
                    router.push(`/runs/${run.id}?labId=${run.lab_id}`)
                  }
                  className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    <span className="text-emerald-400 group-hover:underline">
                      #{run.id}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={run.status} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 text-zinc-200 font-sans font-medium">
                    {labName}
                  </td>

                  <td className="py-3.5 px-4 text-zinc-400">
                    <span className="inline-flex items-center gap-1.5 truncate max-w-xs text-zinc-300">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      {run.github_repo}
                    </span>
                  </td>

                  <td
                    className="py-3.5 px-4 text-zinc-400"
                    title={formatDate(run.created_at)}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {formatRelativeTime(run.created_at)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-zinc-400">
                    {duration}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 group-hover:text-emerald-400 transition-colors">
                      View
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
