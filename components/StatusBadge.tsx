import React from "react";
import type { RunStatus } from "@/lib/types";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: RunStatus | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const normalized = (status || "queued").toLowerCase() as RunStatus;

  let colorClasses = "bg-zinc-800 text-zinc-300 border-zinc-700";
  let icon = <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
  let label = "Queued";

  switch (normalized) {
    case "queued":
      colorClasses =
        "bg-zinc-800/80 text-zinc-300 border-zinc-700/80";
      icon = <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />;
      label = "Queued";
      break;

    case "running":
      colorClasses =
        "bg-amber-950/40 text-amber-300 border-amber-600/40 ring-1 ring-amber-500/20";
      icon = (
        <Loader2
          className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} animate-spin text-amber-400`}
        />
      );
      label = "Running";
      break;

    case "passed":
      colorClasses =
        "bg-emerald-950/40 text-emerald-300 border-emerald-600/40";
      icon = (
        <CheckCircle2
          className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} text-emerald-400`}
        />
      );
      label = "Passed";
      break;

    case "failed":
      colorClasses = "bg-red-950/40 text-red-300 border-red-600/40";
      icon = (
        <XCircle
          className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} text-red-400`}
        />
      );
      label = "Failed";
      break;

    default:
      label = status;
      break;
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-2";

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border shadow-sm ${sizeClasses} ${colorClasses}`}
    >
      {showIcon && icon}
      <span className="capitalize">{label}</span>
      {normalized === "running" && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
      )}
    </span>
  );
}
