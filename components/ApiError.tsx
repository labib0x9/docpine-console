import React from "react";
import { AlertCircle, RotateCcw, ShieldAlert, FileQuestion } from "lucide-react";
import { ApiError as ApiErrorClass } from "@/lib/api";

interface ApiErrorProps {
  error: Error | ApiErrorClass | string | null;
  onRetry?: () => void;
  className?: string;
}

export function ApiError({ error, onRetry, className = "" }: ApiErrorProps) {
  if (!error) return null;

  let status: number | null = null;
  let message = typeof error === "string" ? error : error.message;

  if (error instanceof ApiErrorClass) {
    status = error.status;
    message = error.apiError;
  }

  let title = "Error";
  let explanation = message;
  let Icon = AlertCircle;
  let showRetry = Boolean(onRetry);

  if (status === 400) {
    title = "Validation Error";
    explanation =
      message || "Invalid input or repository name. Please check and retry.";
    showRetry = false;
  } else if (status === 401) {
    title = "Session Expired";
    explanation = "Your session has expired. Redirecting to login...";
    showRetry = false;
  } else if (status === 404) {
    title = "Not Found";
    explanation =
      message || "The requested resource was not found or is not owned by your account.";
    Icon = FileQuestion;
    showRetry = false;
  } else if (status === 428) {
    title = "Security Verification Required";
    explanation =
      "Cloudflare Turnstile token is missing or expired. Please verify and retry.";
    Icon = ShieldAlert;
    showRetry = true;
  } else if (status === 500 || status === 502) {
    title = "Server Error";
    explanation =
      message || "A backend service error occurred. Please try again in a few moments.";
    showRetry = true;
  }

  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200 backdrop-blur-sm ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-red-100">{title}</span>
            {status && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/50 border border-red-700/50 text-red-300">
                HTTP {status}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-red-200/90 leading-relaxed break-words font-mono">
            {explanation}
          </p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              type="button"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
