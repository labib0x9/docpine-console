"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  Play,
  GitBranch,
  Terminal,
  ArrowLeft,
  Loader2,
  Calendar,
  AlertCircle,
  Clock,
} from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { TurnstileWidget, TurnstileWidgetRef } from "@/components/TurnstileWidget";
import { RunTable } from "@/components/RunTable";
import { ApiError } from "@/components/ApiError";
import { useToast } from "@/components/Toast";
import { api, ApiError as ApiErrorClass } from "@/lib/api";
import { isValidGithubRepo, formatDate } from "@/lib/format";
import { IS_TURNSTILE_ENABLED } from "@/lib/env";
import type { Lab, LabRun } from "@/lib/types";

export default function LabDetailPage() {
  const params = useParams();
  const labId = Number(params?.id);
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [lab, setLab] = useState<Lab | null>(null);
  const [runs, setRuns] = useState<LabRun[]>([]);
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileWidgetRef>(null);

  const loadLabData = useCallback(async () => {
    if (!labId || isNaN(labId)) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all labs and find this one
      const [allLabs, runsData, userRepoData] = await Promise.all([
        api.getLabs(),
        api.getLabRuns(labId).catch(() => [] as LabRun[]),
        api.getUserRepo().catch(() => ({ github_repo: "" })),
      ]);

      const foundLab = allLabs.find((l) => l.id === labId);
      if (!foundLab) {
        throw new ApiErrorClass(404, `Lab #${labId} not found`);
      }

      setLab(foundLab);
      setRuns(runsData);
      if (userRepoData.github_repo) {
        setRepo(userRepoData.github_repo);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err : new Error(`Failed to load lab #${labId}`)
      );
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    loadLabData();
  }, [loadLabData]);

  const isValidRepo = isValidGithubRepo(repo);

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab) return;

    const trimmed = repo.trim();
    if (!trimmed) {
      setSubmitError("Please enter a repository to run against this lab.");
      return;
    }

    if (!isValidRepo) {
      setSubmitError(
        "Invalid repository format. Accepted: owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo.git"
      );
      return;
    }

    if (IS_TURNSTILE_ENABLED && !turnstileToken) {
      setSubmitError("Please complete the security check before starting a run.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const run = await api.createRun(lab.id, trimmed, turnstileToken || undefined);
      success(`Run #${run.id} started successfully!`);
      // Navigate to /runs/[runID]?labId=[id]
      router.push(`/runs/${run.id}?labId=${lab.id}`);
    } catch (err: unknown) {
      let msg = "Failed to start run.";
      if (err instanceof ApiErrorClass) {
        msg = err.apiError;
        if (err.status === 428) {
          msg = "Security verification required. Please complete the Turnstile widget below.";
          turnstileRef.current?.reset();
          setTurnstileToken("");
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      setSubmitError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ConsoleShell title="Lab Details">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-64 bg-zinc-900 rounded-xl border border-zinc-800" />
        </div>
      </ConsoleShell>
    );
  }

  if (error || !lab) {
    return (
      <ConsoleShell title="Lab Details">
        <div className="space-y-4">
          <Link
            href="/labs"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Labs</span>
          </Link>
          <ApiError error={error || new Error("Lab not found")} onRetry={loadLabData} />
        </div>
      </ConsoleShell>
    );
  }

  const tests = Array.isArray(lab.tests) ? lab.tests : [];

  return (
    <ConsoleShell title={`Lab: ${lab.name}`}>
      <div className="space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/labs"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Labs</span>
          </Link>
        </div>

        {/* Lab Header Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                    {lab.name}
                  </h2>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                    Lab #{lab.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    Created: {formatDate(lab.created_at)}
                  </span>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    Updated: {formatDate(lab.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Test commands list */}
          <div className="mt-6 pt-6 border-t border-zinc-800/80">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Configured Test Commands ({tests.length})</span>
            </h3>

            {tests.length > 0 ? (
              <div className="space-y-2 bg-black/50 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs">
                {tests.map((cmd, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-1 border-b border-zinc-900 last:border-none"
                  >
                    <span className="text-zinc-600 select-none w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-emerald-400 select-none shrink-0">$</span>
                    <span className="text-zinc-200 select-text overflow-x-auto">
                      {cmd}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-500 italic">
                No test commands defined for this lab.
              </p>
            )}
          </div>
        </div>

        {/* Start Run Form Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Launch Lab Run</span>
            </h3>
            <p className="mt-1 text-xs font-mono text-zinc-400">
              Provide a GitHub repository to clone into an isolated one-shot Docker
              container and execute tests.
            </p>
          </div>

          <form onSubmit={handleStartRun} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
                Target GitHub Repository
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <GitBranch className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => {
                    setRepo(e.target.value);
                    setSubmitError(null);
                  }}
                  placeholder="e.g. octocat/Hello-World"
                  disabled={submitting}
                  className={`w-full pl-9 pr-4 py-2.5 bg-zinc-950 border rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all ${
                    submitError || (repo && !isValidRepo)
                      ? "border-red-500/60 focus:ring-1 focus:ring-red-500/50"
                      : "border-zinc-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40"
                  }`}
                />
              </div>
              <p className="mt-1.5 text-[11px] font-mono text-zinc-500">
                Accepts <code className="text-zinc-400">owner/repo</code>,{" "}
                <code className="text-zinc-400">github.com/owner/repo</code>, HTTPS, or SSH clone URLs.
              </p>
            </div>

            {/* Turnstile verification widget if enabled */}
            {IS_TURNSTILE_ENABLED && (
              <div className="pt-2">
                <TurnstileWidget
                  ref={turnstileRef}
                  onVerify={(tok) => {
                    setTurnstileToken(tok);
                    setSubmitError(null);
                  }}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => {
                    setTurnstileToken("");
                    setSubmitError("Turnstile verification failed. Please try again.");
                  }}
                />
              </div>
            )}

            {/* Submit error display */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs font-mono text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={
                  submitting ||
                  !repo.trim() ||
                  !isValidRepo ||
                  (IS_TURNSTILE_ENABLED && !turnstileToken)
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enqueueing Run...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Lab Run</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Runs History for this Lab */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
              Runs for {lab.name} ({runs.length})
            </h3>
          </div>

          <RunTable
            runs={runs}
            labs={[lab]}
            loading={false}
            emptyMessage={`No runs recorded for ${lab.name} yet.`}
          />
        </section>
      </div>
    </ConsoleShell>
  );
}
