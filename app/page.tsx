"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GitBranch,
  ArrowRight,
  FlaskConical,
  PlaySquare,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { useAuth } from "@/components/AuthProvider";
import { LabCard } from "@/components/LabCard";
import { RunTable } from "@/components/RunTable";
import { ApiError } from "@/components/ApiError";
import { api } from "@/lib/api";
import type { Lab, LabRun } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [savedRepo, setSavedRepo] = useState<string | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [recentRuns, setRecentRuns] = useState<LabRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch saved repository & labs in parallel
      const [repoRes, labsRes] = await Promise.all([
        api.getUserRepo().catch(() => ({ github_repo: "" })),
        api.getLabs().catch(() => [] as Lab[]),
      ]);

      setSavedRepo(repoRes.github_repo || null);
      setLabs(labsRes);

      // 2. Fetch runs for each lab to compute recent runs across all labs
      if (labsRes.length > 0) {
        const runPromises = labsRes.map((lab) =>
          api.getLabRuns(lab.id).catch(() => [] as LabRun[])
        );
        const runsPerLab = await Promise.all(runPromises);
        const allRuns = runsPerLab.flat();

        // Sort descending by created_at
        allRuns.sort((a, b) => {
          const tA = new Date(a.created_at).getTime();
          const tB = new Date(b.created_at).getTime();
          return tB - tA;
        });

        setRecentRuns(allRuns);
      } else {
        setRecentRuns([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error("Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const displayedLabs = labs.slice(0, 6);
  const displayedRuns = recentRuns.slice(0, 5);

  return (
    <ConsoleShell title="Dashboard">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.login}
                width={56}
                height={56}
                className="w-14 h-14 rounded-2xl border border-zinc-700/80 shadow-md object-cover ring-2 ring-emerald-500/20"
                unoptimized
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300">
                {user?.login?.slice(0, 2).toUpperCase() || "DP"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                  Welcome back, {user?.login || "Developer"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Active
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400 font-mono">
                GitHub ID: {user?.github_id} &bull; Account #{user?.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <Link
              href="/labs"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md shadow-emerald-950/40"
            >
              <FlaskConical className="w-4 h-4" />
              <span>Browse Labs</span>
            </Link>
          </div>
        </div>
      </div>

      {error && <ApiError error={error} onRetry={loadDashboardData} />}

      {/* Saved Repository Status Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
              <GitBranch className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                  Saved Repository
                </span>
                {savedRepo ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Configured
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Not configured
                  </span>
                )}
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-100 break-all">
                {savedRepo || "No default repository saved."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {savedRepo && (
              <a
                href={
                  savedRepo.startsWith("http")
                    ? savedRepo
                    : `https://github.com/${savedRepo.replace(/^github\.com\//, "")}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition-colors"
            >
              {savedRepo ? "Change repository" : "Set repository"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Labs Section (Up to 6 cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>Available Labs</span>
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Seeded testing suites ready for Docker container execution
            </p>
          </div>
          {labs.length > 6 && (
            <Link
              href="/labs"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>View all ({labs.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
              />
            ))}
          </div>
        ) : displayedLabs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedLabs.map((lab) => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-500 text-xs font-mono">
            No labs available yet.
          </div>
        )}
      </section>

      {/* Recent Runs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <PlaySquare className="w-4 h-4 text-emerald-400" />
              <span>Recent Runs</span>
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Latest execution attempts across your labs
            </p>
          </div>
          {recentRuns.length > 5 && (
            <Link
              href="/runs"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors"
            >
              <span>All runs ({recentRuns.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <RunTable
          runs={displayedRuns}
          labs={labs}
          loading={loading}
          emptyMessage="No runs executed yet. Select a lab above to start your first container run."
        />
      </section>
    </ConsoleShell>
  );
}
