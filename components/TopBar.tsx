"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { LogOut, Activity, Menu, GitBranch } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";
import { api } from "@/lib/api";

interface TopBarProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export function TopBar({ title = "Console", onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const [health, setHealth] = useState<"ok" | "error" | "checking">("checking");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await api.getHealth();
      if (res && res.status === "ok") {
        setHealth("ok");
      } else {
        setHealth("error");
      }
    } catch {
      setHealth("error");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      success("Logged out successfully");
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Backend health status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors cursor-pointer"
          title={`Backend API Health: ${health}`}
          onClick={checkHealth}
        >
          {health === "ok" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-medium hidden sm:inline">
                API Online
              </span>
            </>
          ) : health === "error" ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 text-[11px] font-medium hidden sm:inline">
                API Offline
              </span>
            </>
          ) : (
            <>
              <Activity className="w-3 h-3 text-zinc-400 animate-spin" />
              <span className="text-zinc-400 text-[11px] font-medium hidden sm:inline">
                Checking
              </span>
            </>
          )}
        </div>

        {/* User profile & Logout */}
        {user ? (
          <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
            <div className="flex items-center gap-2.5">
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.login}
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full border border-zinc-700 ring-1 ring-zinc-800 object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-300">
                  {user.login?.slice(0, 2).toUpperCase() || "DP"}
                </div>
              )}
              <span className="text-xs font-medium text-zinc-200 hidden md:inline font-mono">
                {user.login}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-700/60"
              title="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <a
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}
