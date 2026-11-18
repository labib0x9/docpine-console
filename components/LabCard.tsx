"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FlaskConical, ChevronDown, ChevronUp, ArrowRight, Terminal } from "lucide-react";
import type { Lab } from "@/lib/types";

interface LabCardProps {
  lab: Lab;
  showDetailsDefault?: boolean;
}

export function LabCard({ lab, showDetailsDefault = false }: LabCardProps) {
  const [expanded, setExpanded] = useState(showDetailsDefault);
  const tests = Array.isArray(lab.tests) ? lab.tests : [];

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-700/80 transition-all p-5 flex flex-col justify-between shadow-lg shadow-black/20 group">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm tracking-tight group-hover:text-emerald-400 transition-colors">
                {lab.name}
              </h3>
              <span className="text-[11px] font-mono text-zinc-400">
                Lab ID #{lab.id}
              </span>
            </div>
          </div>

          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {tests.length} {tests.length === 1 ? "test" : "tests"}
          </span>
        </div>

        {/* Expandable test commands */}
        {tests.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors py-1"
            >
              <span>{expanded ? "Hide test commands" : "Show test commands"}</span>
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {expanded && (
              <div className="mt-2 space-y-1.5 bg-black/40 border border-zinc-800/80 rounded-lg p-3 text-xs font-mono">
                {tests.map((cmd, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-zinc-300 leading-tight overflow-x-auto"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-500/70 shrink-0 mt-0.5" />
                    <span className="text-zinc-200">{cmd}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-500">
          Ready to run
        </span>
        <Link
          href={`/labs/${lab.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all group-hover:border-emerald-500/50"
        >
          <span>Open Lab</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
