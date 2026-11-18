"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  GitBranch,
  ShieldAlert,
  Calendar,
  ExternalLink,
  Code2,
} from "lucide-react";
import { ConsoleShell } from "@/components/ConsoleShell";
import { useAuth } from "@/components/AuthProvider";
import { RepoForm } from "@/components/RepoForm";
import { formatDate } from "@/lib/format";
import {
  API_BASE,
  SSE_BASE,
  IS_TURNSTILE_ENABLED,
  TURNSTILE_SITE_KEY,
} from "@/lib/env";

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentRepo, setCurrentRepo] = useState<string>("");

  return (
    <ConsoleShell title="Settings">
      <div className="space-y-8 max-w-4xl">
        {/* Page Title */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <span>Profile & Console Settings</span>
          </h2>
          <p className="mt-1 text-xs font-mono text-zinc-400">
            Manage your GitHub identity link, default target repository, and client environment
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-zinc-800">
            <UserIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase font-mono tracking-wider">
              GitHub Profile
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.login}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl border border-zinc-700 shadow-lg object-cover ring-2 ring-emerald-500/20 shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-300 shrink-0">
                {user?.login?.slice(0, 2).toUpperCase() || "DP"}
              </div>
            )}

            <div className="flex-1 space-y-3 min-w-0 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    GitHub Login
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-semibold text-zinc-100 text-sm">
                      {user?.login || "—"}
                    </span>
                    {user?.login && (
                      <a
                        href={`https://github.com/${user.login}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    GitHub User ID
                  </span>
                  <span className="text-zinc-300 mt-0.5 block">
                    {user?.github_id ?? "—"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    Console Account ID
                  </span>
                  <span className="text-zinc-300 mt-0.5 block">
                    #{user?.id ?? "—"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 block text-[11px]">
                    Account Created
                  </span>
                  <span className="text-zinc-300 mt-0.5 block flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Repository Settings Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-zinc-800">
            <GitBranch className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase font-mono tracking-wider">
              Default GitHub Repository
            </h3>
          </div>

          <p className="text-xs text-zinc-400 mb-6 font-mono leading-relaxed">
            This repository is automatically pre-filled when launching test runs
            in any lab. You can always override it for individual runs.
          </p>

          <RepoForm
            initialRepo={currentRepo || undefined}
            onSaved={(newRepo) => setCurrentRepo(newRepo)}
          />
        </div>

        {/* Environment & Security Settings Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-zinc-800">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100 uppercase font-mono tracking-wider">
              Frontend Client Environment
            </h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 gap-1">
                <span className="text-zinc-400">NEXT_PUBLIC_API_BASE</span>
                <span className="text-zinc-200">{API_BASE}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 gap-1">
                <span className="text-zinc-400">NEXT_PUBLIC_SSE_BASE</span>
                <span className="text-zinc-200">{SSE_BASE}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 gap-1">
                <span className="text-zinc-400">NEXT_PUBLIC_TURNSTILE_SITE_KEY</span>
                <span className="text-zinc-200">
                  {IS_TURNSTILE_ENABLED
                    ? `${TURNSTILE_SITE_KEY.slice(0, 8)}... (${TURNSTILE_SITE_KEY.length} chars)`
                    : "Not configured (Turnstile disabled)"}
                </span>
              </div>
            </div>

            {/* Warning against pasting secrets */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs font-mono leading-relaxed">
                <h4 className="font-semibold text-amber-100 uppercase tracking-wider text-[11px] mb-1">
                  Security Boundary Notice
                </h4>
                <p>
                  Only variables prefixed with <code className="text-amber-300">NEXT_PUBLIC_*</code> are
                  embedded in client-side bundles. Never request, provide, or paste backend secrets
                  such as <code className="text-amber-300">COOKIE_SECRET</code>,{" "}
                  <code className="text-amber-300">TURNSTILE_SECRET</code>, or OAuth client secrets into the frontend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
