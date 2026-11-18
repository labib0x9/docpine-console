"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, setUnauthorizedHandler, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleUnauthorized = useCallback(() => {
    setUser(null);
    if (pathname !== "/login") {
      router.push("/login");
    }
  }, [pathname, router]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch (err: unknown) {
      setUser(null);
      if (err instanceof ApiError && err.status === 401) {
        // Handled via setUnauthorizedHandler
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [handleUnauthorized]);

  // Initial load
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== "/login") {
      router.push("/login");
    } else if (user && pathname === "/login") {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
