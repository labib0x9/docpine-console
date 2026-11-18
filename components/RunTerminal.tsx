"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  Download,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertTriangle,
  ArrowDown,
  WrapText,
} from "lucide-react";
import type { RunStatus } from "@/lib/types";
import { stripAnsi } from "@/lib/format";

interface RunTerminalProps {
  runId: number;
  output: string;
  status: RunStatus;
  isStreaming: boolean;
  connectionState: "connecting" | "open" | "closed" | "error";
  errorPayload?: string | null;
  onReconnect?: () => void;
  onRefreshResult?: () => void;
  refreshingResult?: boolean;
}

export function RunTerminal({
  runId,
  output,
  status,
  isStreaming,
  connectionState,
  errorPayload,
  onReconnect,
  onRefreshResult,
  refreshingResult = false,
}: RunTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Handle user scroll to determine if they are near the bottom
  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 40;
    setIsNearBottom(nearBottom);
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !isNearBottom) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [output, isNearBottom]);

  const scrollToBottom = () => {
    if (!terminalRef.current) return;
    terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    setIsNearBottom(true);
  };

  const handleCopy = async () => {
    try {
      const clean = stripAnsi(output);
      await navigator.clipboard.writeText(clean || "No output recorded.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownload = () => {
    const clean = stripAnsi(output);
    const blob = new Blob([clean || "No output recorded."], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docpine-run-${runId}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isTerminalDone = status === "passed" || status === "failed";

  return (
    <div className="flex flex-col w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden font-mono">
      {/* Prominent error banner if run failed */}
      {status === "failed" && errorPayload && (
        <div className="p-4 bg-red-950/40 border-b border-red-900/50 text-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs text-red-100 uppercase tracking-wider">
              Run Execution Failed
            </h4>
            <pre className="mt-1.5 text-xs text-red-200 font-mono whitespace-pre-wrap break-words bg-red-950/60 p-2.5 rounded border border-red-800/40">
              {stripAnsi(errorPayload)}
            </pre>
          </div>
        </div>
      )}

      {/* Terminal Toolbar */}
      <div className="h-10 bg-zinc-900/90 border-b border-zinc-800 px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 pl-2">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-300 font-semibold text-[11px]">
              runner-output
            </span>
          </div>

          {/* Live vs Completed status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 text-[11px]">
            {isStreaming ? (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            ) : isTerminalDone ? (
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                Completed
              </span>
            ) : connectionState === "error" ? (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <WifiOff className="w-3 h-3 text-amber-400" />
                Disconnected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Wifi className="w-3 h-3" />
                Connecting
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Reconnect button if disconnected before done */}
          {!isTerminalDone && connectionState === "error" && onReconnect && (
            <button
              onClick={onReconnect}
              type="button"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-amber-950/60 border border-amber-600/40 text-amber-300 hover:bg-amber-900/60 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reconnect Stream</span>
            </button>
          )}

          {/* Refresh result */}
          {onRefreshResult && (
            <button
              onClick={onRefreshResult}
              disabled={refreshingResult}
              type="button"
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Reconcile latest result from API"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${
                  refreshingResult ? "animate-spin text-emerald-400" : ""
                }`}
              />
            </button>
          )}

          {/* Wrap lines */}
          <button
            onClick={() => setWrapLines(!wrapLines)}
            type="button"
            className={`p-1.5 rounded transition-colors ${
              wrapLines
                ? "bg-zinc-800 text-emerald-400"
                : "hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title={wrapLines ? "Disable wrap" : "Enable line wrap"}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Copy terminal output"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            type="button"
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Download output as .txt"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Save .txt</span>
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="relative">
        <div
          ref={terminalRef}
          onScroll={handleScroll}
          className={`h-[480px] p-4 overflow-y-auto text-xs leading-relaxed text-zinc-200 font-mono bg-zinc-950 select-text ${
            wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
          }`}
        >
          {output ? (
            output
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 italic select-none">
              {isStreaming ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Waiting for execution chunks...</span>
                </div>
              ) : status === "queued" ? (
                "Run is queued in RabbitMQ, awaiting available worker container..."
              ) : (
                "No output recorded for this run."
              )}
            </div>
          )}
        </div>

        {/* Scroll to bottom floating badge if user scrolled up */}
        {!isNearBottom && output && (
          <button
            onClick={scrollToBottom}
            type="button"
            className="absolute bottom-3 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-black text-[11px] font-semibold shadow-lg backdrop-blur transition-all"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Follow output</span>
          </button>
        )}
      </div>

      {/* Terminal Footer status */}
      <div className="h-7 bg-zinc-900/60 border-t border-zinc-800/80 px-4 flex items-center justify-between text-[11px] text-zinc-500 select-none">
        <div className="flex items-center gap-3">
          <span>Run ID: #{runId}</span>
          <span>•</span>
          <span className="capitalize">Status: {status}</span>
        </div>
        <div>
          <span>Lines: {output ? output.split("\n").length : 0}</span>
        </div>
      </div>
    </div>
  );
}
