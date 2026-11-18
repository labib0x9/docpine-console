"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitBranch,
  Calendar,
  Clock,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
  ExternalLink,
} from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { StatusBadge } from "@/components/StatusBadge";
import { RunTerminal } from "@/components/RunTerminal";
import { ApiError } from "@/components/ApiError";
import { api, ApiError as ApiErrorClass } from "@/lib/api";
import {
  connectRunEventSource,
  RunEventSourceController,
  SseConnectionState,
} from "@/lib/sse";
import { formatDate, formatDuration } from "@/lib/format";
import type { Lab, LabRun, RunStatus } from "@/lib/types";

function RunDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const runId = Number(params?.runID);

  const [labId, setLabId] = useState<number | null>(() => {
    const qLab = searchParams?.get("labId");
    return qLab ? Number(qLab) : null;
  });

  const [run, setRun] = useState<LabRun | null>(null);
  const [lab, setLab] = useState<Lab | null>(null);
  const [status, setStatus] = useState<RunStatus>("queued");
  const [output, setOutput] = useState<string>("");
  const [errorPayload, setErrorPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingResult, setRefreshingResult] = useState(false);
  const [pageError, setPageError] = useState<Error | null>(null);

  // SSE streaming states
  const [connectionState, setConnectionState] =
    useState<SseConnectionState>("closed");
  const sseRef = useRef<RunEventSourceController | null>(null);

  // 1. Initial lookup of lab and run
  const resolveRunAndLab = useCallback(async () => {
    if (!runId || isNaN(runId)) return;
    setLoading(true);
    setPageError(null);

    try {
      const allLabs = await api.getLabs();

      let targetLabId = labId;
      let targetRun: LabRun | null = null;

      // If labId was in query string, verify it
      if (targetLabId) {
        try {
          targetRun = await api.getRun(targetLabId, runId);
        } catch {
          // If not found in this lab, search other labs
          targetLabId = null;
        }
      }

      // If labId not known or not found, scan all labs
      if (!targetRun) {
        for (const l of allLabs) {
          try {
            const r = await api.getRun(l.id, runId);
            if (r && r.id === runId) {
              targetRun = r;
              targetLabId = l.id;
              break;
            }
          } catch {
            // continue checking next lab
          }
        }
      }

      if (!targetRun || !targetLabId) {
        throw new ApiErrorClass(404, `Run #${runId} not found in any lab.`);
      }

      const foundLab = allLabs.find((l) => l.id === targetLabId) || {
        id: targetLabId,
        name: `Lab #${targetLabId}`,
        tests: [],
        created_at: "",
        updated_at: "",
      };

      setLabId(targetLabId);
      setRun(targetRun);
      setLab(foundLab);
      setStatus(targetRun.status);

      // If run already has a terminal status, fetch persisted result
      if (targetRun.status === "passed" || targetRun.status === "failed") {
        try {
          const res = await api.getRunResult(targetLabId, runId);
          if (res && res.results) {
            setOutput(res.results);
            if (targetRun.status === "failed") {
              setErrorPayload(res.results);
            }
          }
        } catch {
          // Result may not be stored yet or empty
        }
      }
    } catch (err: unknown) {
      setPageError(
        err instanceof Error ? err : new Error(`Failed to load run #${runId}`)
      );
    } finally {
      setLoading(false);
    }
  }, [runId, labId]);

  useEffect(() => {
    resolveRunAndLab();
  }, [resolveRunAndLab]);

  // 2. Connect SSE live streaming
  const startSseStream = useCallback(
    (lId: number, rId: number) => {
      // Close any previous stream
      if (sseRef.current) {
        sseRef.current.close();
      }

      // Clear terminal on new mount/stream replay
      setOutput("");
      setErrorPayload(null);

      const controller = connectRunEventSource(lId, rId, {
        onStatus: (newStatus) => {
          setStatus(newStatus);
          setRun((prev) => (prev ? { ...prev, status: newStatus } : null));
        },
        onOutput: (chunk) => {
          setOutput((prev) => prev + chunk);
        },
        onResult: (finalOutput) => {
          setOutput(finalOutput || "");
          setErrorPayload(null);
          setStatus("passed");
          setRun((prev) =>
            prev
              ? {
                  ...prev,
                  status: "passed",
                  finished_at: new Date().toISOString(),
                }
              : null
          );
        },
        onErrorEvent: (errText) => {
          setOutput(errText || "");
          setErrorPayload(errText || null);
          setStatus("failed");
          setRun((prev) =>
            prev
              ? {
                  ...prev,
                  status: "failed",
                  finished_at: new Date().toISOString(),
                }
              : null
          );
        },
        onConnectionChange: (st) => {
          setConnectionState(st);
        },
      });

      sseRef.current = controller;
    },
    []
  );

  const runStatus = run?.status;

  useEffect(() => {
    if (!labId || !runId) return;

    if (runStatus === "queued" || runStatus === "running") {
      startSseStream(labId, runId);
    }

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [labId, runId, runStatus, startSseStream]);

  // Handle explicit result refresh
  const handleRefreshResult = async () => {
    if (!labId || !runId) return;
    setRefreshingResult(true);
    try {
      const [latestRun, latestResult] = await Promise.all([
        api.getRun(labId, runId),
        api.getRunResult(labId, runId).catch(() => null),
      ]);

      setRun(latestRun);
      setStatus(latestRun.status);

      if (latestResult && latestResult.results) {
        setOutput(latestResult.results);
        if (latestRun.status === "failed") {
          setErrorPayload(latestResult.results);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh result:", err);
    } finally {
      setRefreshingResult(false);
    }
  };

  const handleReconnect = () => {
    if (labId && runId) {
      startSseStream(labId, runId);
    }
  };

  const isTerminalDone = status === "passed" || status === "failed";
  const isStreaming = connectionState === "open" && !isTerminalDone;

  return (
    <ConsoleShell title={`Run #${runId}`}>
      <div className="space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/runs"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Runs</span>
          </Link>
          {lab && (
            <Link
              href={`/labs/${lab.id}`}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200"
            >
              Lab: <span className="text-zinc-200">{lab.name}</span>
            </Link>
          )}
        </div>

        {pageError && <ApiError error={pageError} onRetry={resolveRunAndLab} />}

        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-28 bg-zinc-900 rounded-2xl border border-zinc-800" />
            <div className="h-96 bg-zinc-900 rounded-xl border border-zinc-800" />
          </div>
        ) : run && lab ? (
          <>
            {/* Header Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                      <span>Run #{run.id}</span>
                    </h2>
                    <StatusBadge status={status} size="md" />

                    {isStreaming && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Live SSE Stream
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-zinc-200 font-semibold">
                        {run.github_repo}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Created: {formatDate(run.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        Duration:{" "}
                        {formatDuration(run.started_at, run.finished_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={
                      run.github_repo.startsWith("http")
                        ? run.github_repo
                        : `https://github.com/${run.github_repo.replace(/^github\.com\//, "")}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors"
                  >
                    <span>Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Lifecycle Timeline */}
              <div className="pt-6 border-t border-zinc-800/80">
                <h4 className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-4 font-semibold">
                  Execution Lifecycle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Step 1: Queued */}
                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                      <Clock className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        1. Queued
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {formatDate(run.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Running */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      status === "running"
                        ? "border-amber-500/40 bg-amber-950/20"
                        : status === "passed" || status === "failed"
                        ? "border-zinc-800 bg-zinc-950/60"
                        : "border-zinc-800/40 bg-zinc-950/20 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        status === "running"
                          ? "bg-amber-500/20 border border-amber-500/30 text-amber-300"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {status === "running" ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      ) : (
                        <Terminal className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        2. Running
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {run.started_at ? formatDate(run.started_at) : "Awaiting container"}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Result */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      status === "passed"
                        ? "border-emerald-500/40 bg-emerald-950/20"
                        : status === "failed"
                        ? "border-red-500/40 bg-red-950/20"
                        : "border-zinc-800/40 bg-zinc-950/20 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        status === "passed"
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : status === "failed"
                          ? "bg-red-500/20 border border-red-500/30 text-red-400"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {status === "passed" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : status === "failed" ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 capitalize">
                        3. {status === "passed" || status === "failed" ? status : "Result"}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {run.finished_at ? formatDate(run.finished_at) : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Terminal Component */}
            <RunTerminal
              runId={run.id}
              output={output}
              status={status}
              isStreaming={isStreaming}
              connectionState={connectionState}
              errorPayload={errorPayload}
              onReconnect={handleReconnect}
              onRefreshResult={handleRefreshResult}
              refreshingResult={refreshingResult}
            />
          </>
        ) : null}
      </div>
    </ConsoleShell>
  );
}

export default function RunDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950">
          <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        </div>
      }
    >
      <RunDetailContent />
    </Suspense>
  );
}
