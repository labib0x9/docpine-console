"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Terminal, ShieldCheck, Cpu, Radio } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { API_BASE, IS_TURNSTILE_ENABLED } from "@/lib/env";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-950/40">
            <Terminal className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-display">
            Docpine Console
          </h1>
          <p className="mt-2 text-xs font-mono text-zinc-400">
            Authenticated GitHub Repository Lab Runner
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-zinc-100">
              Sign in to your account
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Connect with your GitHub account to access seeded labs, run test
              suites, and stream execution output.
            </p>
          </div>

          {/* Turnstile / OAuth Form */}
          {IS_TURNSTILE_ENABLED ? (
            <form
              action={`${API_BASE}/v1/auth/login`}
              method="POST"
              className="space-y-4"
            >
              <TurnstileWidget
                name="cf-turnstile-response"
                onVerify={(tok) => setTurnstileToken(tok)}
                onExpire={() => setTurnstileToken("")}
              />

              <button
                type="submit"
                disabled={!turnstileToken}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-sm transition-all shadow-lg shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <GitBranch className="w-4 h-4 text-zinc-900 group-hover:scale-110 transition-transform" />
                <span>Sign in with GitHub</span>
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <a
                href={`${API_BASE}/v1/auth/login`}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-medium text-sm transition-all shadow-lg shadow-white/5 group"
              >
                <GitBranch className="w-4 h-4 text-zinc-900 group-hover:scale-110 transition-transform" />
                <span>Sign in with GitHub</span>
              </a>
            </div>
          )}

          {/* Feature checklist */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Isolated one-shot container execution</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Live Server-Sent Events (SSE) logs</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Signed session cookie security</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-[11px] font-mono text-zinc-500">
          Docpine runner console &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
