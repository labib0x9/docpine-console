"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  PlaySquare,
  Settings,
  X,
  Terminal,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Labs",
    href: "/labs",
    icon: FlaskConical,
  },
  {
    name: "Runs",
    href: "/runs",
    icon: PlaySquare,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/50 transition-colors shadow-sm shadow-emerald-950/40">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-zinc-100 tracking-tight flex items-center gap-1.5">
                Docpine
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                  v1
                </span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                Lab Runner Console
              </span>
            </div>
          </Link>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-900/80"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isLinkActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? "text-emerald-400" : "text-zinc-400"
                  }`}
                />
                <span>{item.name}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* System info / Footer */}
        <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center justify-between px-2 py-1">
            <span>Protocol</span>
            <span className="text-zinc-400">SSE / REST</span>
          </div>
          <div className="flex items-center justify-between px-2 py-1">
            <span>Container Isolation</span>
            <span className="text-emerald-500">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
