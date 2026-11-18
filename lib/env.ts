/**
 * Centralized environment configuration.
 * All backend API and SSE URLs MUST be referenced from here.
 * No hardcoded API URLs should exist outside this file.
 */

const trimSlash = (url: string): string => url.replace(/\/+$/, "");

export const API_BASE = trimSlash(
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"
);

export const SSE_BASE = trimSlash(
  process.env.NEXT_PUBLIC_SSE_BASE || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080"
);

export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export const IS_TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);
