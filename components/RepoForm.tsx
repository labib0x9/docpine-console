"use client";

import React, { useState, useEffect } from "react";
import { GitBranch, Check, AlertCircle, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { isValidGithubRepo } from "@/lib/format";
import { useToast } from "./Toast";

interface RepoFormProps {
  initialRepo?: string;
  onSaved?: (newRepo: string) => void;
}

export function RepoForm({ initialRepo, onSaved }: RepoFormProps) {
  const [repo, setRepo] = useState(initialRepo || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (initialRepo !== undefined) {
      setRepo(initialRepo);
      return;
    }

    let isMounted = true;
    setFetching(true);
    api
      .getUserRepo()
      .then((res) => {
        if (isMounted && res.github_repo) {
          setRepo(res.github_repo);
        }
      })
      .catch(() => {
        // May be empty or unconfigured
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialRepo]);

  const isValid = !repo.trim() || isValidGithubRepo(repo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repo.trim();
    if (!trimmed) {
      setError("Please enter a GitHub repository.");
      return;
    }
    if (!isValidGithubRepo(trimmed)) {
      setError(
        "Invalid format. Use owner/repo, https://github.com/owner/repo, or git@github.com:owner/repo.git"
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.setUserRepo(trimmed);
      setRepo(res.github_repo);
      success("Saved repository updated successfully");
      onSaved?.(res.github_repo);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError ? err.apiError : "Failed to save repository";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
          Default GitHub Repository
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
              setError(null);
            }}
            placeholder="e.g. octocat/Hello-World"
            disabled={loading || fetching}
            className={`w-full pl-9 pr-10 py-2.5 bg-zinc-900 border rounded-lg text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
              error || (repo && !isValid)
                ? "border-red-500/60 focus:ring-red-500/50"
                : "border-zinc-800 focus:border-emerald-500/60 focus:ring-emerald-500/40"
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {fetching ? (
              <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
            ) : repo && isValid ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : repo && !isValid ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : null}
          </div>
        </div>
        <p className="mt-1.5 text-[11px] font-mono text-zinc-500">
          Accepted: <code className="text-zinc-400">owner/repo</code>,{" "}
          <code className="text-zinc-400">github.com/owner/repo</code>, HTTPS or SSH git URLs.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs font-mono text-red-400 bg-red-950/20 border border-red-900/40 p-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || fetching || !repo.trim() || !isValid}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-emerald-950/30"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Save Repository</span>
        </button>
      </div>
    </form>
  );
}
